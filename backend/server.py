import json
import logging
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from genetic import Population

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AVTAS AI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
population = None
sim_mode = "training"

class BrainPayload(BaseModel):
    weights0: list
    biases0: list
    weights1: list
    biases1: list

@app.get("/health")
def health_check():
    """Health check endpoint to verify server status."""
    return {
        "status": "online",
        "mode": sim_mode,
        "population_initialized": population is not None,
        "generation": population.generation if population else 0,
        "best_fitness": population.best_fitness if population else 0
    }

@app.get("/brain/download")
def download_brain():
    """Download the best brain from the current population."""
    if not population:
        raise HTTPException(status_code=400, detail="Population not initialized")
    
    champion = population.best_brain if population.best_brain else population.agents[0]
    return {
        "generation": population.generation,
        "fitness": population.best_fitness,
        "network": champion.get_weights()
    }

@app.post("/brain/upload")
def upload_brain(payload: BrainPayload):
    """Upload a pre-trained brain to seed the population."""
    global population
    if not population:
        raise HTTPException(status_code=400, detail="Initialize population first via WebSocket")
    
    # Inject into the champion slot and populate the rest
    from neural import NeuralNetwork
    new_net = NeuralNetwork(population.agents[0].input_size, 
                            population.agents[0].hidden_size, 
                            population.agents[0].output_size)
    new_net.set_weights(payload.dict())
    
    population.best_brain = new_net
    # Overwrite current population with clones of the uploaded brain
    population.agents = [new_net.clone() for _ in range(population.size)]
    
    return {"status": "success", "message": "Brain successfully injected into population."}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global population, sim_mode
    await websocket.accept()
    logger.info("Client connected to WebSocket")
    
    try:
        while True:
            data_str = await websocket.receive_text()
            message = json.loads(data_str)
            msg_type = message.get("type")
            
            if msg_type == "INIT":
                pop_size = message.get("populationSize", 20)
                input_size = message.get("inputSize", 6)
                hidden_size = message.get("hiddenSize", 8)
                output_size = message.get("outputSize", 2)
                sim_mode = message.get("mode", "training")
                
                logger.info(f"Initializing population: size={pop_size}, mode={sim_mode}")
                population = Population(pop_size, input_size, hidden_size, output_size)
                
                await websocket.send_json({
                    "type": "INIT_ACK",
                    "generation": population.generation
                })
                
            elif msg_type == "SET_MODE":
                sim_mode = message.get("mode", "training")
                logger.info(f"Mode switched to {sim_mode}")

            elif msg_type == "OBSERVATION":
                # Received inputs for current cars
                cars_data = message.get("data", [])
                actions = []
                
                if population:
                    # In adversarial mode, we just use the best brain (if exists) or brain 0 for all cars
                    is_adversarial = (sim_mode == "adversarial")
                    champion_net = population.best_brain if population.best_brain else population.agents[0]

                    for car_info in cars_data:
                        car_id = car_info["id"]
                        inputs = car_info["inputs"]
                        
                        net = champion_net if is_adversarial else population.agents[car_id]
                        outputs = net.feed_forward(inputs).tolist()
                        
                        actions.append({
                            "id": car_id,
                            "steer": outputs[0],
                            "throttle": outputs[1]
                        })
                
                await websocket.send_json({
                    "type": "ACTION",
                    "data": actions
                })

            elif msg_type == "END_GENERATION":
                if sim_mode == "adversarial":
                    # In adversarial mode, we don't evolve, just restart
                    await websocket.send_json({
                        "type": "START_GENERATION",
                        "generation": population.generation
                    })
                else:
                    # Training mode: evolve population
                    fitness_data = message.get("data", [])
                    mutation_rate = message.get("mutationRate", 0.1)
                    selection_ratio = message.get("selectionRatio", 0.1)
                    
                    logger.info(f"Evolving generation {population.generation}")
                    population.evolve(
                        fitness_data, 
                        selection_ratio=selection_ratio, 
                        mutation_rate=mutation_rate
                    )
                    
                    champion = population.best_brain if population.best_brain else population.agents[0]
                    await websocket.send_json({
                        "type": "START_GENERATION",
                        "generation": population.generation,
                        "bestFitness": population.best_fitness,
                        "championNetwork": champion.get_weights()
                    })

    except WebSocketDisconnect:
        logger.info("Client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
