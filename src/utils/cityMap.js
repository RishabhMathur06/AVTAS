/**
 * cityMap.js
 * Procedural city map and obstacle generation for AVTAS.
 */

const MAP_SIZE   = 2400;
const ROAD_WIDTH = 90;

function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  
  const f0 = -0.5 * t3 + t2 - 0.5 * t;
  const f1 = 1.5 * t3 - 2.5 * t2 + 1.0;
  const f2 = -1.5 * t3 + 2.0 * t2 + 0.5 * t;
  const f3 = 0.5 * t3 - 0.5 * t2;
  
  return {
    x: p0.x * f0 + p1.x * f1 + p2.x * f2 + p3.x * f3,
    y: p0.y * f0 + p1.y * f1 + p2.y * f2 + p3.y * f3
  };
}

/**
 * Build the full sprawling city map.
 * Returns walls, checkpoints, decorative assets, etc.
 */
export const buildSprawlingCityMap = () => {
  const centerPoints = [
    { x: 300,  y: 300  },
    { x: 1200, y: 250  },
    { x: 2100, y: 400  },
    { x: 2100, y: 1200 },
    { x: 1700, y: 2100 },
    { x: 800,  y: 2000 },
    { x: 300,  y: 1200 },
  ];

  // Subdivide segments into smooth checkpoints using Catmull-Rom spline
  const checkpoints = [];
  const n = centerPoints.length;
  const SUB = 24; // High fidelity subdivision for ultimate smoothness
  for (let i = 0; i < n; i++) {
    const p0 = centerPoints[(i - 1 + n) % n];
    const p1 = centerPoints[i];
    const p2 = centerPoints[(i + 1) % n];
    const p3 = centerPoints[(i + 2) % n];
    
    for (let s = 0; s < SUB; s++) {
      const t = s / SUB;
      checkpoints.push(catmullRom(p0, p1, p2, p3, t));
    }
  }
  checkpoints.push({ ...checkpoints[0] });

  // Build left/right walls + gate checkpoints from the path
  const leftWalls       = [];
  const rightWalls      = [];
  const checkpointsGates = [];

  for (let i = 0; i < checkpoints.length - 1; i++) {
    const p1 = checkpoints[i];
    const p2 = checkpoints[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len;
    const ny =  dx / len;

    leftWalls.push({
      p1: { x: p1.x + nx * ROAD_WIDTH, y: p1.y + ny * ROAD_WIDTH },
      p2: { x: p2.x + nx * ROAD_WIDTH, y: p2.y + ny * ROAD_WIDTH },
    });
    rightWalls.push({
      p1: { x: p1.x - nx * ROAD_WIDTH, y: p1.y - ny * ROAD_WIDTH },
      p2: { x: p2.x - nx * ROAD_WIDTH, y: p2.y - ny * ROAD_WIDTH },
    });
    checkpointsGates.push({
      id: i,
      p1: { x: p1.x - nx * ROAD_WIDTH, y: p1.y - ny * ROAD_WIDTH },
      p2: { x: p1.x + nx * ROAD_WIDTH, y: p1.y + ny * ROAD_WIDTH },
      center: { x: p1.x, y: p1.y },
    });
  }

  const walls = [...leftWalls, ...rightWalls];

  // Procedural city dressing (systematic block grid)
  const isOnRoad = (x, y, margin = 160) =>
    checkpoints.some(cp => Math.hypot(x - cp.x, y - cp.y) < margin);

  const buildings = [];
  const gardens   = [];
  const crosswalks = [];

  const cellSize = 200;
  const cellsCount = Math.floor(MAP_SIZE / cellSize);

  for (let col = 0; col < cellsCount; col++) {
    for (let row = 0; row < cellsCount; row++) {
      const cx = col * cellSize + cellSize / 2;
      const cy = row * cellSize + cellSize / 2;

      // Check if this grid cell center is on or too close to the road corridor
      if (isOnRoad(cx, cy, 140)) {
        continue; // Keep clear for streets and curbs
      }

      // 20% chance to make it a public garden / park block
      if ((col * 7 + row * 13) % 5 === 0) {
        gardens.push({
          x: cx,
          y: cy,
          radius: 55,
          treeCount: 6,
        });
      } else {
        // Place 2x2 grid of systematic office/apartment buildings in this cell
        const padding = 20;
        const bSize = (cellSize - padding * 2 - 10) / 2; // ~75px each

        for (let bx = 0; bx < 2; bx++) {
          for (let by = 0; by < 2; by++) {
            const bxPos = col * cellSize + padding + bx * (bSize + 10);
            const byPos = row * cellSize + padding + by * (bSize + 10);

            // Double check corner of building is not clipping the road
            if (isOnRoad(bxPos + bSize/2, byPos + bSize/2, 110)) {
              continue;
            }

            buildings.push({
              x: bxPos,
              y: byPos,
              w: bSize,
              h: bSize,
              height: 50 + Math.random() * 55,
              color: `hsl(${210 + Math.random() * 30}, 15%, ${15 + Math.random() * 8}%)`,
            });
          }
        }
      }
    }
  }

  for (let i = 2; i < checkpoints.length - 2; i += 12) {
    crosswalks.push({
      center: checkpoints[i],
      angle:  Math.atan2(
        checkpoints[i + 1].y - checkpoints[i].y,
        checkpoints[i + 1].x - checkpoints[i].x
      ),
    });
  }

  return {
    mapSize: MAP_SIZE,
    roadWidth: ROAD_WIDTH,
    checkpoints,
    walls,
    leftWalls,
    rightWalls,
    checkpointsGates,
    buildings,
    gardens,
    crosswalks,
    startPoint: checkpoints[0],
    startAngle: Math.atan2(
      checkpoints[1].y - checkpoints[0].y,
      checkpoints[1].x - checkpoints[0].x
    ),
  };
};

/**
 * Spawn traffic-cone obstacles on the road.
 * @param {object} track  - result of buildSprawlingCityMap
 * @returns {Array}
 */
export const buildObstacles = (track) => {
  const cones = [];
  for (let i = 5; i < track.checkpoints.length - 5; i += 6) {
    const cp     = track.checkpoints[i];
    const nextCp = track.checkpoints[i + 1];
    const angle  = Math.atan2(nextCp.y - cp.y, nextCp.x - cp.x) + Math.PI / 2;
    const offset = (Math.random() > 0.5 ? 1 : -1) * 45;
    cones.push({
      x:      cp.x + Math.cos(angle) * offset,
      y:      cp.y + Math.sin(angle) * offset,
      radius: 12,
    });
  }
  return cones;
};
