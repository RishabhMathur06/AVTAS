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
*   **Frontend:** React.js, TailwindCSS
*   **3D Engine:** React Three Fiber (`@react-three/fiber`, `@react-three/drei`)
*   **AI Engine:** Custom from-scratch Vanilla JS (Feedforward NNs, Genetic Algorithms)
*   **Physics:** Custom Rigid-body kinematics and 2D/3D Raycasting

## 🏎️ Getting Started

> [!IMPORTANT]  
> **Node.js Version Requirement:** This project requires **Node v22** or higher. 
> Ensure you have the correct version active before installing dependencies. If you are using NVM, run:
> ```bash
> nvm use 22
> ```

1. Clone the repository and navigate into the directory:
   ```bash
   git clone https://github.com/<your-username>/AVTAS.git
   cd AVTAS
   ```

2. Set the correct Node version and install the dependencies:
   ```bash
   nvm use 22
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## 📝 License
This project is licensed under the MIT License.
