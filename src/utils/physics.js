/**
 * physics.js
 * Car physics, LIDAR raycasting, and collision detection for AVTAS.
 */

import { getIntersection, getDistanceToSegment } from './geometry.js';
import { feedForward, generateRandomNetwork } from './neural.js';

const RAY_ANGLES = [-Math.PI / 3, -Math.PI / 6, 0, Math.PI / 6, Math.PI / 3];
const RAY_LENGTH = 200;
const CAR_RADIUS = 9;

/**
 * Spawn a new car object, optionally with a pre-supplied neural network brain.
 */
export const spawnCar = (track, friction, brain = null) => ({
  x:                   track.startPoint.x,
  y:                   track.startPoint.y,
  angle:               track.startAngle,
  speed:               0,
  maxSpeed:            5.5,
  friction,
  width:               24,
  height:              12,
  alive:               true,
  fitness:             0,
  checkpointsPassed:   0,
  nextCheckpointIndex: 1,
  survivalTime:        0,
  brain:               brain || generateRandomNetwork(6, 6, 2),
  sensors:             [0, 0, 0, 0, 0],
  sensorRays:          [],
  trail:               [],
  collisionTimeout:    0,  // kills cars stuck at speed < 0.1
  noProgressTimer:     0,  // kills cars spinning without hitting checkpoints
  lastOutputs:         [0, 0],
  hiddenActivations:   [0, 0, 0, 0, 0, 0],
});

/**
 * Perform one physics step for a single car.
 *
 * @param {object} car      - mutable car state
 * @param {boolean} isAI    - true → use neural net; false → use manual controls
 * @param {object|null} controls  - { steer, accel } for manual mode
 * @param {object} track    - city map
 * @param {Array}  cones    - obstacle cone array
 */
export const updateCarPhysics = (car, isAI, controls, track, cones) => {
  if (!car.alive) return;

  // ── 1. LIDAR raycasting ──────────────────────────────────────────────────
  car.sensors    = [];
  car.sensorRays = [];

  RAY_ANGLES.forEach((angleOffset) => {
    const rayAngle = car.angle + angleOffset;
    const rayEnd   = {
      x: car.x + Math.cos(rayAngle) * RAY_LENGTH,
      y: car.y + Math.sin(rayAngle) * RAY_LENGTH,
    };

    let closest = null;

    // Wall intersections
    track.walls.forEach((wall) => {
      const hit = getIntersection(car, rayEnd, wall.p1, wall.p2);
      if (hit && (!closest || hit.offset < closest.offset)) closest = hit;
    });

    // Cone (obstacle) intersections – approximate as point
    cones.forEach((cone) => {
      const coneDist = Math.hypot(car.x - cone.x, car.y - cone.y);
      if (coneDist < RAY_LENGTH) {
        const dx  = cone.x - car.x;
        const dy  = cone.y - car.y;
        const dot = (dx * Math.cos(rayAngle) + dy * Math.sin(rayAngle)) / coneDist;
        if (dot > 0.98) {
          const offset = coneDist / RAY_LENGTH;
          if (!closest || offset < closest.offset) {
            closest = { x: cone.x, y: cone.y, offset };
          }
        }
      }
    });

    // Traffic NPCs (Adversarial Cars) intersections
    if (track.adversarialCars) {
      track.adversarialCars.forEach((npc) => {
        const npcDist = Math.hypot(car.x - npc.x, car.y - npc.y);
        if (npcDist < RAY_LENGTH) {
          const dx  = npc.x - car.x;
          const dy  = npc.y - car.y;
          // Wider dot threshold for cars since they are bigger than cones
          const dot = (dx * Math.cos(rayAngle) + dy * Math.sin(rayAngle)) / npcDist;
          if (dot > 0.95) {
            const offset = npcDist / RAY_LENGTH;
            if (!closest || offset < closest.offset) {
              closest = { x: npc.x, y: npc.y, offset };
            }
          }
        }
      });
    }

    if (closest) {
      car.sensors.push(closest.offset);
      car.sensorRays.push({ p1: { x: car.x, y: car.y }, p2: closest });
    } else {
      car.sensors.push(1.0);
      car.sensorRays.push({ p1: { x: car.x, y: car.y }, p2: rayEnd });
    }
  });

  // ── 2. Control decisions ─────────────────────────────────────────────────
  let steerForce = 0;
  let accelForce = 0;

  if (isAI) {
    const inputs  = [...car.sensors, car.speed / car.maxSpeed];
    const result  = feedForward(inputs, car.brain);
    steerForce    = result.outputs[0];
    accelForce    = result.outputs[1];
    car.lastOutputs = result.outputs;
    car.hiddenActivations = result.hidden;
  } else if (controls) {
    steerForce = controls.steer;
    accelForce = controls.accel;
  }

  // ── 3. Motion ────────────────────────────────────────────────────────────
  car.speed += accelForce * 0.22;
  car.speed  = Math.max(-1, Math.min(car.maxSpeed, car.speed));

  if (car.speed >  0) car.speed -= car.friction;
  if (car.speed <  0) car.speed += car.friction;
  if (Math.abs(car.speed) < 0.05) car.speed = 0;

  car.angle += steerForce * 0.07 * (car.speed / car.maxSpeed);
  car.x     += Math.cos(car.angle) * car.speed;
  car.y     += Math.sin(car.angle) * car.speed;
  car.survivalTime += 1;

  // ── 4. Checkpoint progress ───────────────────────────────────────────────
  const gate = track.checkpointsGates[car.nextCheckpointIndex];
  if (Math.hypot(car.x - gate.center.x, car.y - gate.center.y) < 110) {
    car.checkpointsPassed   += 1;
    car.nextCheckpointIndex  = (car.nextCheckpointIndex + 1) % track.checkpointsGates.length;
    car.collisionTimeout     = 0;
    car.noProgressTimer      = 0; // reset — car is making forward progress
  } else {
    car.noProgressTimer += 1;
  }

  car.fitness = car.checkpointsPassed * 1000 + car.survivalTime * 0.2;

  // Trail update
  if (car.survivalTime % 3 === 0) {
    car.trail.push({ x: car.x, y: car.y });
    if (car.trail.length > 20) car.trail.shift();
  }

  // ── 5. Collision detection ───────────────────────────────────────────────
  // Map boundary check: cull cars that wander off the city grid canvas boundaries
  const mapSize = track.mapSize || 2400;
  if (car.x < 10 || car.x > mapSize - 10 || car.y < 10 || car.y > mapSize - 10) {
    car.alive = false;
  }

  // Segment wall collision
  track.walls.forEach((wall) => {
    if (getDistanceToSegment({ x: car.x, y: car.y }, wall.p1, wall.p2) < CAR_RADIUS) {
      car.alive = false;
    }
  });



  cones.forEach((cone) => {
    if (Math.hypot(car.x - cone.x, car.y - cone.y) < CAR_RADIUS + cone.radius) {
      car.alive = false;
    }
  });

  // Pedestrian Collision
  if (track.pedestrians) {
    track.pedestrians.forEach((ped) => {
      const dist = Math.hypot(car.x - ped.x, car.y - ped.y);
      if (dist < CAR_RADIUS + 3) {
        car.alive = false;
        car.fitness -= 500; // Massive penalty for hitting pedestrians
      }
    });
  }

  // Adversarial Car Collision
  if (track.adversarialCars) {
    track.adversarialCars.forEach((ghost) => {
      // Treat ghost cars as rectangular or approximate with a larger radius
      const dist = Math.hypot(car.x - ghost.x, car.y - ghost.y);
      if (dist < CAR_RADIUS + 10) {
        car.alive = false;
        car.fitness -= 200; // Penalty for crashing into ghost cars
      }
    });
  }

  // Anti-stuck (speed-based): kills cars that have stopped moving
  if (car.speed < 0.1) {
    car.collisionTimeout += 1;
    // Increased timeout to allow cars to stop at traffic lights or behind traffic without instantly dying
    if (car.collisionTimeout > 400) car.alive = false;
  } else {
    car.collisionTimeout = 0;
  }

  // Anti-spinner (progress-based): kills cars circling without checkpoints
  // 300 frames ≈ 5 seconds at 60fps — enough time to reach the next gate
  if (car.noProgressTimer > 300) car.alive = false;
};

/**
 * Perform one environment step (traffic lights, pedestrians, ghost cars).
 *
 * @param {object} state - mutable simulation state
 */
export const updateEnvironment = (state) => {
  if (!state.track) return;

  // Traffic Lights State Machine
  if (state.track.trafficLights) {
    state.track.trafficLights.forEach((light) => {
      light.timer -= 0.016; 
      if (light.timer <= 0) {
        if (light.state === 'green') {
          light.state = 'yellow';
          light.timer = 3.0; // 3 seconds yellow
        } else if (light.state === 'yellow') {
          light.state = 'red';
          light.timer = 10.0; // 10 seconds red
        } else {
          light.state = 'green';
          light.timer = 10.0; // 10 seconds green
        }
      }
    });
  }

  // Pedestrian Logic
  if (state.track.pedestrians) {
    state.track.pedestrians.forEach((ped) => {
      if (ped.isVertical) {
        ped.y += ped.dir * ped.speed;
        if (ped.dir === 1 && ped.y > ped.maxBound) ped.dir = -1;
        if (ped.dir === -1 && ped.y < ped.minBound) ped.dir = 1;
      } else {
        ped.x += ped.dir * ped.speed;
        if (ped.dir === 1 && ped.x > ped.maxBound) ped.dir = -1;
        if (ped.dir === -1 && ped.x < ped.minBound) ped.dir = 1;
      }
    });
  }

  if (state.track.intersectionRects) {
    state.track.intersectionRects.forEach(rect => {
      if (rect.timer !== undefined) {
        rect.timer -= 0.016;
        if (rect.timer <= 0) {
          rect.lightStateX = rect.lightStateX === 'green' ? 'red' : 'green';
          rect.timer = 6.0; // 6 seconds per phase
        }
      }
    });
  }

  // Traffic NPCs (Adversarial Cars) Logic
  if (state.track.adversarialCars) {
    const mapSize = state.track.mapSize || 2400;
    state.track.adversarialCars.forEach((car) => {
      if (car.waitTimer > 0) {
        car.waitTimer -= 0.016;
        return;
      }
      
      let canMove = true;

      // 1. Intersection and Traffic Light logic
      if (state.track.intersectionRects) {
        const atIntersection = state.track.intersectionRects.find(
          rect => Math.hypot(car.x - rect.x, car.y - rect.y) < 25
        );

        if (atIntersection) {
          const isMovingX = Math.abs(Math.cos(car.angle)) > 0.5;
          const greenLight = isMovingX ? atIntersection.lightStateX === 'green' : atIntersection.lightStateX === 'red';
          
          if (!greenLight) {
            canMove = false; // Stop at red light
          } else if (!car.hasTurnedAtThisIntersection) {
             const conn = atIntersection.conn;
             const possibleDirs = [];
             // Only turn to valid roads, avoid U-turns if possible
             if (conn.left && Math.abs(car.angle - 0) > 0.1) possibleDirs.push(Math.PI);
             if (conn.right && Math.abs(car.angle - Math.PI) > 0.1) possibleDirs.push(0);
             if (conn.top && Math.abs(car.angle - Math.PI/2) > 0.1) possibleDirs.push(-Math.PI/2);
             if (conn.bottom && Math.abs(car.angle - (-Math.PI/2)) > 0.1) possibleDirs.push(Math.PI/2);

             if (possibleDirs.length > 0) {
               // 30% chance to turn, 70% chance to go straight if straight is valid
               const isStraightValid = possibleDirs.some(d => Math.abs(d - car.angle) < 0.1 || Math.abs(d - car.angle) > Math.PI*1.9);
               if (!isStraightValid || Math.random() < 0.3) {
                 car.angle = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
                 car.x = atIntersection.x;
                 car.y = atIntersection.y;
               }
             }
             car.hasTurnedAtThisIntersection = true;
          }
        } else {
          car.hasTurnedAtThisIntersection = false;
        }
      }

      // 2. Traffic collision avoidance
      if (canMove) {
        for (let other of state.track.adversarialCars) {
          if (other === car) continue;
          
          const angleDiff = Math.abs(car.angle - other.angle);
          const isOpposite = Math.abs(angleDiff - Math.PI) < 0.1 || Math.abs(angleDiff - Math.PI*3) < 0.1;
          if (isOpposite) continue; // Ignore oncoming traffic cars so they pass each other

          const dist = Math.hypot(car.x - other.x, car.y - other.y);
          if (dist < 40) {
            const dx = other.x - car.x;
            const dy = other.y - car.y;
            const dot = (dx * Math.cos(car.angle) + dy * Math.sin(car.angle)) / dist;
            if (dot > 0.8) {
              canMove = false; // Traffic Car in front
              break;
            }
          }
        }
      }

      // 3. Move
      if (canMove) {
        car.x += Math.cos(car.angle) * car.speed;
        car.y += Math.sin(car.angle) * car.speed;
      }
      
      // Respawn if off-map
      if (car.x < 10 || car.x > mapSize - 10 || car.y < 10 || car.y > mapSize - 10) {
        const road = state.track.roadRects[Math.floor(Math.random() * state.track.roadRects.length)];
        car.x = road.x;
        car.y = road.y;
        car.angle = road.isVertical ? (Math.random() > 0.5 ? Math.PI/2 : -Math.PI/2) : (Math.random() > 0.5 ? 0 : Math.PI);
        car.hasTurnedAtThisIntersection = false;
      }
    });
  }
};
