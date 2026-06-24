# AVTAS: Autonomous Vehicle Training & Adversarial Simulation Platform

**AVTAS** is an interactive, in-browser 3D WebGL simulation environment designed to train and stress-test autonomous driving neural networks. It leverages neuro-evolution and procedural generation to create complex edge-cases and adversarial scenarios.

## 🚀 Core Features

### 1. Vehicle Training Suite
Train an autonomous AI "brain" from scratch. The system uses a Feed-forward Neural Network combined with a Genetic Algorithm (NEAT). Vehicles learn to navigate a procedurally generated city grid using simulated physical LiDAR rays, evolving to dodge moving obstacles and navigate intersections.

### 2. Intelligent Traffic NPC System
A fully dynamic traffic simulation runs alongside the training process:
- **Intelligent Pathfinding:** Traffic NPCs navigate the city map, automatically determining valid turns at intersections.
- **Traffic Light Compliance:** Invisible traffic lights cycle at intersections; NPCs will correctly brake and wait for green lights.
- **Collision Avoidance:** Traffic NPCs detect other cars in front of them (including your AI Champion) and actively hit the brakes to avoid rear-ending or head-on collisions.
- **Real 3D Models:** Traffic is rendered using full 3D car models painted in randomized vibrant colors (Yellow, Green, Purple).

### 3. Adversarial Test Suite
Upload a pre-trained "Perfect Brain" and test its robustness in the **Adversarial Test Dashboard**. The simulation actively tests your AI's reaction to dynamic edge cases such as:
- Erratic pedestrians crossing intersections.
- Changing traffic lights.
- Deadlocked traffic jams and oncoming vehicles.

### 4. Live Telemetry Dashboard
A beautiful mission control dashboard tracks real-time training data, including:
- Current Generation and Survivor Count
- Best Fitness Score
- **Live Speed Tracking** (in realistic km/h based on simulation physics)

## 🛠️ Technology Stack
*   **Frontend:** React.js, TailwindCSS, Vite
*   **3D Engine:** React Three Fiber (`@react-three/fiber`, `@react-three/drei`)
*   **Physics Engine:** Custom Rigid-body kinematics and 2D/3D Raycasting (JavaScript)
*   **AI Backend Engine:** Python, FastAPI, WebSockets, Numpy
*   **AI Architecture:** Decoupled OpenAI Gym-style pattern. The frontend handles physics/observations and streams them via WebSockets to the Python backend. The backend runs the Genetic Algorithm (NEAT) and Feedforward Neural Network inferences, streaming steering commands back to the frontend at 60fps.

## 🏎️ Getting Started

> [!IMPORTANT]  
> **Node.js Version Requirement:** The frontend requires **Node v22** or higher. 
> Ensure you have the correct version active before installing dependencies.

### 1. Start the AI Backend (Python)

Open a terminal, navigate to the `backend` folder, set up your Python environment, and start the FastAPI WebSocket server:

```bash
cd AVTAS/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python server.py
```
*The AI Engine will run on `http://127.0.0.1:8000` with interactive API docs available at `/docs`.*

### 2. Start the Simulation Frontend (React/Vite)

Open a **new** terminal, navigate to the root directory, and start the Vite dev server:

```bash
cd AVTAS
nvm use 22
npm install
npm run dev
```

### 3. Connect
Open your browser to `http://localhost:5173`. Select a workspace, and the simulation will automatically establish a WebSocket connection with the Python engine to begin training!

## 📝 License
This project is licensed under the MIT License.
