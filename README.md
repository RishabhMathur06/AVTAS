# AVTAS: Autonomous Vehicle Training & Adversarial Simulation Platform

**AVTAS** is an interactive, in-browser 3D WebGL simulation environment designed to train and stress-test autonomous driving neural networks. It leverages neuro-evolution and procedural generation to create complex edge-cases and adversarial scenarios.

## 🚀 Core Features

### 1. Vehicle Training Suite
Train an autonomous AI "brain" from scratch. The system uses a Feed-forward Neural Network combined with a Genetic Algorithm (NEAT). Vehicles learn to navigate a procedurally generated city grid using simulated physical LIDAR rays. 

### 2. Adversarial Test Suite *(In Development)*
Upload a pre-trained "Perfect Brain" and test its robustness. The simulation actively tries to force accidents by spawning dynamic edge cases such as:
- Erratic pedestrians crossing intersections.
- Changing traffic lights.
- "Ghost Cars" that intentionally violate traffic laws.

## 🛠️ Technology Stack
*   **Frontend:** React.js, TailwindCSS
*   **3D Engine:** React Three Fiber (`@react-three/fiber`, `@react-three/drei`)
*   **AI Engine:** Custom from-scratch Vanilla JS (Feedforward NNs, Genetic Algorithms)
*   **Physics:** Custom Rigid-body kinematics and 2D/3D Raycasting

## 🏎️ Getting Started

First, ensure you have Node.js installed on your machine.

1. Clone the repository and navigate into the directory:
   ```bash
   git clone https://github.com/<your-username>/AVTAS.git
   cd AVTAS
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## 📝 License
This project is licensed under the MIT License.
