/**
 * cityMap.js
 * Procedural city map and obstacle generation for AVTAS.
 * Phase 2: Advanced Grid Generation with Intersections
 */

const MAP_SIZE   = 2400;
const ROAD_WIDTH = 90;
const BLOCK_SIZE = 340; // distance between road centers
const HALF_ROAD = ROAD_WIDTH / 2;

/**
 * Build the grid-based city map.
 */
export const buildSprawlingCityMap = () => {
  // 1. Define Grid Lines
  const gridLinesX = [];
  for (let x = 180; x <= MAP_SIZE - 180; x += BLOCK_SIZE) gridLinesX.push(x);

  const gridLinesY = [];
  for (let y = 180; y <= MAP_SIZE - 180; y += BLOCK_SIZE) gridLinesY.push(y);

  // 2. Build Walls (Block Boundaries)
  const walls = [];
  const curbEdges = []; // For rendering curbs
  
  // Outer boundary walls
  const minX = gridLinesX[0] - HALF_ROAD;
  const maxX = gridLinesX[gridLinesX.length - 1] + HALF_ROAD;
  const minY = gridLinesY[0] - HALF_ROAD;
  const maxY = gridLinesY[gridLinesY.length - 1] + HALF_ROAD;

  walls.push({ p1: { x: minX, y: minY }, p2: { x: maxX, y: minY } }); // Top
  walls.push({ p1: { x: maxX, y: minY }, p2: { x: maxX, y: maxY } }); // Right
  walls.push({ p1: { x: maxX, y: maxY }, p2: { x: minX, y: maxY } }); // Bottom
  walls.push({ p1: { x: minX, y: maxY }, p2: { x: minX, y: minY } }); // Left

  // Inner block walls
  for (let c = 0; c < gridLinesX.length - 1; c++) {
    for (let r = 0; r < gridLinesY.length - 1; r++) {
      const bMinX = gridLinesX[c] + HALF_ROAD;
      const bMaxX = gridLinesX[c + 1] - HALF_ROAD;
      const bMinY = gridLinesY[r] + HALF_ROAD;
      const bMaxY = gridLinesY[r + 1] - HALF_ROAD;

      if (bMinX < bMaxX && bMinY < bMaxY) {
        // Add walls for this block
        const top = { p1: { x: bMinX, y: bMinY }, p2: { x: bMaxX, y: bMinY } };
        const right = { p1: { x: bMaxX, y: bMinY }, p2: { x: bMaxX, y: bMaxY } };
        const bottom = { p1: { x: bMaxX, y: bMaxY }, p2: { x: bMinX, y: bMaxY } };
        const left = { p1: { x: bMinX, y: bMaxY }, p2: { x: bMinX, y: bMinY } };
        
        walls.push(top, right, bottom, left);
        curbEdges.push(top, right, bottom, left);
      }
    }
  }

  // Add outer boundary curbs (inset slightly)
  curbEdges.push({ p1: { x: minX, y: minY }, p2: { x: maxX, y: minY } });
  curbEdges.push({ p1: { x: maxX, y: minY }, p2: { x: maxX, y: maxY } });
  curbEdges.push({ p1: { x: maxX, y: maxY }, p2: { x: minX, y: maxY } });
  curbEdges.push({ p1: { x: minX, y: maxY }, p2: { x: minX, y: minY } });

  // 3. Build Checkpoints (Main Route = Perimeter)
  const checkpoints = [];
  const checkpointsGates = [];
  
  // Perimeter path: Top-left -> Top-right -> Bottom-right -> Bottom-left -> Top-left
  const routeCorners = [
    { x: gridLinesX[0], y: gridLinesY[0] },
    { x: gridLinesX[gridLinesX.length - 1], y: gridLinesY[0] },
    { x: gridLinesX[gridLinesX.length - 1], y: gridLinesY[gridLinesY.length - 1] },
    { x: gridLinesX[0], y: gridLinesY[gridLinesY.length - 1] },
    { x: gridLinesX[0], y: gridLinesY[0] }
  ];

  let gateId = 0;
  for (let i = 0; i < routeCorners.length - 1; i++) {
    const p1 = routeCorners[i];
    const p2 = routeCorners[i + 1];
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    const steps = Math.floor(dist / 60); // Checkpoint every ~60 units
    
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;
      checkpoints.push({ x: cx, y: cy });
      
      const nx = -dy / dist;
      const ny =  dx / dist;
      
      checkpointsGates.push({
        id: gateId++,
        center: { x: cx, y: cy },
        p1: { x: cx - nx * HALF_ROAD, y: cy - ny * HALF_ROAD },
        p2: { x: cx + nx * HALF_ROAD, y: cy + ny * HALF_ROAD },
      });
    }
  }

  // 4. City Dressing (Buildings & Gardens)
  const buildings = [];
  const gardens = [];
  
  for (let c = 0; c < gridLinesX.length - 1; c++) {
    for (let r = 0; r < gridLinesY.length - 1; r++) {
      const bMinX = gridLinesX[c] + HALF_ROAD;
      const bMaxX = gridLinesX[c + 1] - HALF_ROAD;
      const bMinY = gridLinesY[r] + HALF_ROAD;
      const bMaxY = gridLinesY[r + 1] - HALF_ROAD;
      
      const blockWidth = bMaxX - bMinX;
      const blockHeight = bMaxY - bMinY;
      const cx = bMinX + blockWidth / 2;
      const cy = bMinY + blockHeight / 2;

      // 20% chance for a garden
      if (Math.random() < 0.2) {
        gardens.push({
          x: cx,
          y: cy,
          radius: Math.min(blockWidth, blockHeight) / 2 * 0.8,
          treeCount: 8,
        });
      } else {
        // 2x2 grid of buildings
        const pad = 10;
        const bw = (blockWidth - pad * 3) / 2;
        const bh = (blockHeight - pad * 3) / 2;
        
        for (let bx = 0; bx < 2; bx++) {
          for (let by = 0; by < 2; by++) {
            buildings.push({
              x: bMinX + pad + bx * (bw + pad),
              y: bMinY + pad + by * (bh + pad),
              w: bw,
              h: bh,
              height: 40 + Math.random() * 80,
              color: `hsl(${210 + Math.random() * 30}, 15%, ${15 + Math.random() * 8}%)`,
            });
          }
        }
      }
    }
  }

  // 5. Render Geometry Data (Road Rectangles & Traffic Lights)
  const roadRects = [];
  const intersectionRects = [];
  const trafficLights = [];
  const crosswalks = [];

  // Intersections
  for (let x of gridLinesX) {
    for (let y of gridLinesY) {
      intersectionRects.push({ x, y, size: ROAD_WIDTH });
      
      // Randomize traffic lights: 30% chance of a traffic light per intersection, and only 1 light.
      if (Math.random() > 0.7) {
        const offset = HALF_ROAD + 8;
        const corner = Math.floor(Math.random() * 4);
        if (corner === 0) trafficLights.push({ x: x - offset, y: y - offset, angle: Math.PI / 4 });
        if (corner === 1) trafficLights.push({ x: x + offset, y: y - offset, angle: Math.PI * 3 / 4 });
        if (corner === 2) trafficLights.push({ x: x + offset, y: y + offset, angle: -Math.PI * 3 / 4 });
        if (corner === 3) trafficLights.push({ x: x - offset, y: y + offset, angle: -Math.PI / 4 });
      }
      
      // Crosswalks
      crosswalks.push({ x: x, y: y - HALF_ROAD, angle: 0 }); // Top
      crosswalks.push({ x: x, y: y + HALF_ROAD, angle: 0 }); // Bottom
      crosswalks.push({ x: x - HALF_ROAD, y: y, angle: Math.PI / 2 }); // Left
      crosswalks.push({ x: x + HALF_ROAD, y: y, angle: Math.PI / 2 }); // Right
    }
  }

  // Horizontal road segments
  for (let y of gridLinesY) {
    for (let i = 0; i < gridLinesX.length - 1; i++) {
      const x1 = gridLinesX[i] + HALF_ROAD;
      const x2 = gridLinesX[i + 1] - HALF_ROAD;
      roadRects.push({
        x: (x1 + x2) / 2,
        y: y,
        w: x2 - x1,
        h: ROAD_WIDTH,
        isVertical: false,
      });
    }
  }

  // Vertical road segments
  for (let x of gridLinesX) {
    for (let i = 0; i < gridLinesY.length - 1; i++) {
      const y1 = gridLinesY[i] + HALF_ROAD;
      const y2 = gridLinesY[i + 1] - HALF_ROAD;
      roadRects.push({
        x: x,
        y: (y1 + y2) / 2,
        w: ROAD_WIDTH,
        h: y2 - y1,
        isVertical: true,
      });
    }
  }

  return {
    mapSize: MAP_SIZE,
    roadWidth: ROAD_WIDTH,
    checkpoints,
    checkpointsGates,
    walls,
    curbEdges,
    buildings,
    gardens,
    crosswalks,
    roadRects,
    intersectionRects,
    trafficLights,
    gridLinesX,
    gridLinesY,
    startPoint: { x: gridLinesX[0], y: gridLinesY[0] },
    startAngle: 0, // Facing +X (East)
  };
};

/**
 * Spawn traffic-cone obstacles on the road.
 */
export const buildObstacles = (track) => {
  const cones = [];
  // Randomly place cones on road segments
  track.roadRects.forEach(rect => {
    if (Math.random() < 0.3) {
      cones.push({
        x: rect.x + (Math.random() - 0.5) * rect.w * 0.5,
        y: rect.y + (Math.random() - 0.5) * rect.h * 0.5,
        radius: 12,
      });
    }
  });
  return cones;
};
