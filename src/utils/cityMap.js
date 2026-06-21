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

  // Organic Road Segments (Graph Edges)
  const segmentsX = []; // Horizontal roads
  const segmentsY = []; // Vertical roads

  for (let yIdx = 0; yIdx < gridLinesY.length; yIdx++) {
    for (let xIdx = 0; xIdx < gridLinesX.length - 1; xIdx++) {
      const isPerimeter = (yIdx === 0 || yIdx === gridLinesY.length - 1);
      // Keep perimeter, randomly drop ~30% of internal roads
      if (isPerimeter || Math.random() > 0.3) {
        segmentsX.push({ xIdx, yIdx });
      }
    }
  }

  for (let xIdx = 0; xIdx < gridLinesX.length; xIdx++) {
    for (let yIdx = 0; yIdx < gridLinesY.length - 1; yIdx++) {
      const isPerimeter = (xIdx === 0 || xIdx === gridLinesX.length - 1);
      if (isPerimeter || Math.random() > 0.3) {
        segmentsY.push({ xIdx, yIdx });
      }
    }
  }

  // Helper to check road connectivity
  const hasRoad = (xIdx, yIdx) => {
    const left = segmentsX.some(s => s.xIdx === xIdx - 1 && s.yIdx === yIdx);
    const right = segmentsX.some(s => s.xIdx === xIdx && s.yIdx === yIdx);
    const top = segmentsY.some(s => s.xIdx === xIdx && s.yIdx === yIdx - 1);
    const bottom = segmentsY.some(s => s.xIdx === xIdx && s.yIdx === yIdx);
    return { left, right, top, bottom, any: left || right || top || bottom };
  };

  // 2. Build Walls (Block Boundaries)
  const walls = [];
  const curbEdges = [];
  
  const minX = gridLinesX[0] - HALF_ROAD;
  const maxX = gridLinesX[gridLinesX.length - 1] + HALF_ROAD;
  const minY = gridLinesY[0] - HALF_ROAD;
  const maxY = gridLinesY[gridLinesY.length - 1] + HALF_ROAD;

  // Outer boundary walls
  walls.push({ p1: { x: minX, y: minY }, p2: { x: maxX, y: minY } });
  walls.push({ p1: { x: maxX, y: minY }, p2: { x: maxX, y: maxY } });
  walls.push({ p1: { x: maxX, y: maxY }, p2: { x: minX, y: maxY } });
  walls.push({ p1: { x: minX, y: maxY }, p2: { x: minX, y: minY } });

  // Inner block walls
  for (let c = 0; c < gridLinesX.length - 1; c++) {
    for (let r = 0; r < gridLinesY.length - 1; r++) {
      const bMinX = gridLinesX[c] + HALF_ROAD;
      const bMaxX = gridLinesX[c + 1] - HALF_ROAD;
      const bMinY = gridLinesY[r] + HALF_ROAD;
      const bMaxY = gridLinesY[r + 1] - HALF_ROAD;

      if (bMinX < bMaxX && bMinY < bMaxY) {
        const top = { p1: { x: bMinX, y: bMinY }, p2: { x: bMaxX, y: bMinY } };
        const right = { p1: { x: bMaxX, y: bMinY }, p2: { x: bMaxX, y: bMaxY } };
        const bottom = { p1: { x: bMaxX, y: bMaxY }, p2: { x: bMinX, y: bMaxY } };
        const left = { p1: { x: bMinX, y: bMaxY }, p2: { x: bMinX, y: bMinY } };
        walls.push(top, right, bottom, left);
        curbEdges.push(top, right, bottom, left);
      }
    }
  }

  // Outer boundary curbs
  curbEdges.push({ p1: { x: minX, y: minY }, p2: { x: maxX, y: minY } });
  curbEdges.push({ p1: { x: maxX, y: minY }, p2: { x: maxX, y: maxY } });
  curbEdges.push({ p1: { x: maxX, y: maxY }, p2: { x: minX, y: maxY } });
  curbEdges.push({ p1: { x: minX, y: maxY }, p2: { x: minX, y: minY } });

  // 3. Build Checkpoints (Main Route = Perimeter)
  const checkpoints = [];
  const checkpointsGates = [];
  
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
    const steps = Math.floor(dist / 60);
    
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
        gardens.push({ x: cx, y: cy, radius: Math.min(blockWidth, blockHeight) / 2 * 0.8, treeCount: 8 });
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
  for (let xIdx = 0; xIdx < gridLinesX.length; xIdx++) {
    for (let yIdx = 0; yIdx < gridLinesY.length; yIdx++) {
      const x = gridLinesX[xIdx];
      const y = gridLinesY[yIdx];
      const conn = hasRoad(xIdx, yIdx);

      if (conn.any) {
        intersectionRects.push({ 
          x, y, 
          size: ROAD_WIDTH, 
          conn,
          lightStateX: Math.random() > 0.5 ? 'green' : 'red',
          timer: Math.random() * 10
        });
        
        // Smart Crosswalks (only where roads exist)
        if (conn.top) crosswalks.push({ x: x, y: y - HALF_ROAD, angle: 0 }); 
        if (conn.bottom) crosswalks.push({ x: x, y: y + HALF_ROAD, angle: 0 }); 
        if (conn.left) crosswalks.push({ x: x - HALF_ROAD, y: y, angle: Math.PI / 2 }); 
        if (conn.right) crosswalks.push({ x: x + HALF_ROAD, y: y, angle: Math.PI / 2 }); 

        // Cap missing roads with walls
        if (!conn.top && yIdx !== 0) walls.push({ p1: { x: x - HALF_ROAD, y: y - HALF_ROAD }, p2: { x: x + HALF_ROAD, y: y - HALF_ROAD } });
        if (!conn.bottom && yIdx !== gridLinesY.length - 1) walls.push({ p1: { x: x + HALF_ROAD, y: y + HALF_ROAD }, p2: { x: x - HALF_ROAD, y: y + HALF_ROAD } });
        if (!conn.left && xIdx !== 0) walls.push({ p1: { x: x - HALF_ROAD, y: y + HALF_ROAD }, p2: { x: x - HALF_ROAD, y: y - HALF_ROAD } });
        if (!conn.right && xIdx !== gridLinesX.length - 1) walls.push({ p1: { x: x + HALF_ROAD, y: y - HALF_ROAD }, p2: { x: x + HALF_ROAD, y: y + HALF_ROAD } });

        // Traffic Light
        if (Math.random() > 0.7) {
          const offset = HALF_ROAD + 8;
          const corner = Math.floor(Math.random() * 4);
          const state = Math.random() > 0.5 ? 'green' : 'red';
          const timer = Math.random() * 10;
          if (corner === 0) trafficLights.push({ x: x - offset, y: y - offset, angle: Math.PI / 4, state, timer });
          if (corner === 1) trafficLights.push({ x: x + offset, y: y - offset, angle: Math.PI * 3 / 4, state, timer });
          if (corner === 2) trafficLights.push({ x: x + offset, y: y + offset, angle: -Math.PI * 3 / 4, state, timer });
          if (corner === 3) trafficLights.push({ x: x - offset, y: y + offset, angle: -Math.PI / 4, state, timer });
        }
      }
    }
  }

  // Active Horizontal road segments
  segmentsX.forEach(s => {
    const x1 = gridLinesX[s.xIdx] + HALF_ROAD;
    const x2 = gridLinesX[s.xIdx + 1] - HALF_ROAD;
    const y = gridLinesY[s.yIdx];
    roadRects.push({ x: (x1 + x2) / 2, y, w: x2 - x1, h: ROAD_WIDTH, isVertical: false });
  });

  // Active Vertical road segments
  segmentsY.forEach(s => {
    const x = gridLinesX[s.xIdx];
    const y1 = gridLinesY[s.yIdx] + HALF_ROAD;
    const y2 = gridLinesY[s.yIdx + 1] - HALF_ROAD;
    roadRects.push({ x, y: (y1 + y2) / 2, w: ROAD_WIDTH, h: y2 - y1, isVertical: true });
  });

  const pedestrians = [];
  const adversarialCars = [];

  // Generate Pedestrians at Crosswalks (Reduced probability and speed)
  crosswalks.forEach(cw => {
    if (Math.random() > 0.6) { // was 0.4
      const isVerticalMovement = (cw.angle === Math.PI / 2); 
      pedestrians.push({
        x: isVerticalMovement ? cw.x : cw.x + (Math.random() - 0.5) * ROAD_WIDTH,
        y: isVerticalMovement ? cw.y + (Math.random() - 0.5) * ROAD_WIDTH : cw.y,
        dir: Math.random() > 0.5 ? 1 : -1,
        speed: 0.3 + Math.random() * 0.4, // Slower speed
        isVertical: isVerticalMovement,
        minBound: isVerticalMovement ? cw.y - HALF_ROAD : cw.x - HALF_ROAD,
        maxBound: isVerticalMovement ? cw.y + HALF_ROAD : cw.x + HALF_ROAD,
      });
    }
  });

  // Generate Jaywalking Pedestrians (Reduced probability and speed)
  roadRects.forEach(r => {
    if (Math.random() > 0.8) { // was 0.6
      const isVerticalMovement = !r.isVertical; 
      pedestrians.push({
        x: r.isVertical ? r.x + (Math.random() - 0.5) * ROAD_WIDTH : r.x + (Math.random() - 0.5) * r.w,
        y: r.isVertical ? r.y + (Math.random() - 0.5) * r.h : r.y + (Math.random() - 0.5) * ROAD_WIDTH,
        dir: Math.random() > 0.5 ? 1 : -1,
        speed: 0.3 + Math.random() * 0.4,
        isVertical: isVerticalMovement,
        minBound: isVerticalMovement ? r.y - HALF_ROAD : r.x - HALF_ROAD,
        maxBound: isVerticalMovement ? r.y + HALF_ROAD : r.x + HALF_ROAD,
      });
    }
  });

  // Generate Traffic NPCs (Adversarial Cars)
  const trafficColors = ['#eab308', '#22c55e', '#a855f7']; // Yellow, Green, Purple
  
  // Pick 10 random roads
  const shuffledRoads = [...roadRects].sort(() => 0.5 - Math.random()).slice(0, 10);
  
  shuffledRoads.forEach(r => {
    const isVertical = r.isVertical;
    const angle = isVertical ? (Math.random() > 0.5 ? Math.PI/2 : -Math.PI/2) : (Math.random() > 0.5 ? 0 : Math.PI);
    adversarialCars.push({
      x: r.x,
      y: r.y,
      angle: angle,
      speed: 1.5 + Math.random() * 1.5, // 1.5 to 3.0 speed
      color: trafficColors[Math.floor(Math.random() * trafficColors.length)],
      isVertical: isVertical,
      dir: (angle === 0 || angle === Math.PI/2) ? 1 : -1,
      state: 'driving', // driving, waiting
      waitTimer: 0
    });
  });

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
    pedestrians,
    adversarialCars,
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
