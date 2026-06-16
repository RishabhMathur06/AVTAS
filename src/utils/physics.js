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

  // Robust road corridor check: if a car crosses the white curb lines (distance to nearest center-line segment > track.roadWidth)
  if (car.alive && track.roadWidth) {
    let minCenterDist = Infinity;
    for (let i = 0; i < track.checkpoints.length - 1; i++) {
      const dist = getDistanceToSegment(
        { x: car.x, y: car.y },
        track.checkpoints[i],
        track.checkpoints[i + 1]
      );
      if (dist < minCenterDist) {
        minCenterDist = dist;
      }
    }
    // Curb lines are drawn at track.roadWidth. If the car center goes past track.roadWidth - 3, it crashes.
    if (minCenterDist > (track.roadWidth - 3)) {
      car.alive = false;
    }
  }

  cones.forEach((cone) => {
    if (Math.hypot(car.x - cone.x, car.y - cone.y) < CAR_RADIUS + cone.radius) {
      car.alive = false;
    }
  });

  // Anti-stuck (speed-based): kills cars that have stopped moving
  if (car.speed < 0.1) {
    car.collisionTimeout += 1;
    if (car.collisionTimeout > 180) car.alive = false;
  } else {
    car.collisionTimeout = 0;
  }

  // Anti-spinner (progress-based): kills cars circling without checkpoints
  // 300 frames ≈ 5 seconds at 60fps — enough time to reach the next gate
  if (car.noProgressTimer > 300) car.alive = false;
};
