/**
 * renderer.js
 * All HTML5 Canvas drawing routines for AVTAS.
 * Stateless – receives state and draws; returns nothing.
 */

/**
 * Draw the city scenery layer (ground, parks, roads, buildings, cones, overlays).
 */
export const drawScenery = (ctx, state, camX, camY, canvas, timeOfDay, hasRain) => {
  const { track } = state;

  // Clear the entire camera viewport with landscape background (prevents orange/blank leaks)
  ctx.fillStyle =
    timeOfDay === 'day'        ? '#064e3b' : // Deep forest green
    timeOfDay === 'sunset'     ? '#1c1917' : // Warm stone black
                                 '#09090b';  // Cyber dark
  ctx.fillRect(camX, camY, canvas.width, canvas.height);

  // Systematic Grid Mesh for structural reference
  ctx.strokeStyle =
    timeOfDay === 'day'        ? 'rgba(16, 101, 52, 0.35)' :
    timeOfDay === 'sunset'     ? 'rgba(41, 37, 36, 0.4)' : 
                                 'rgba(24, 24, 27, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  // Draw grid only in visible viewport area
  const startGridX = Math.floor(camX / 100) * 100;
  const endGridX = startGridX + canvas.width + 100;
  const startGridY = Math.floor(camY / 100) * 100;
  const endGridY = startGridY + canvas.height + 100;

  for (let x = startGridX; x <= endGridX; x += 100) {
    ctx.moveTo(x, camY); ctx.lineTo(x, camY + canvas.height);
  }
  for (let y = startGridY; y <= endGridY; y += 100) {
    ctx.moveTo(camX, y); ctx.lineTo(camX + canvas.width, y);
  }
  ctx.stroke();

  // Draw decorative rivers / water bodies to make map realistic
  // Let's draw a nice blue canal running diagonally
  ctx.strokeStyle = timeOfDay === 'day' ? '#1d4ed8' : timeOfDay === 'sunset' ? '#1e3a8a' : '#0f172a';
  ctx.lineWidth = 80;
  ctx.beginPath();
  ctx.moveTo(0, 600);
  ctx.lineTo(2400, 1800);
  ctx.stroke();

  // Draw river bridge concrete supports
  ctx.fillStyle = '#4b5563';
  ctx.fillRect(580, 850, 40, 90);
  ctx.fillRect(1780, 1450, 40, 90);

  // Parks / gardens
  state.cityAssets.gardens.forEach((garden) => {
    ctx.fillStyle =
      timeOfDay === 'day'    ? '#047857' : // Rich park green
      timeOfDay === 'sunset' ? 'rgba(22, 163, 74, 0.12)' : 'rgba(16, 185, 129, 0.05)';
    ctx.beginPath();
    ctx.arc(garden.x, garden.y, garden.radius, 0, Math.PI * 2);
    ctx.fill();

    // Border line for park
    ctx.strokeStyle = timeOfDay === 'day' ? '#065f46' : 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Detailed 3D-effect trees
    for (let i = 0; i < garden.treeCount; i++) {
      const tx = garden.x + Math.sin(i * 1.0) * (garden.radius - 20);
      const ty = garden.y + Math.cos(i * 1.0) * (garden.radius - 20);
      
      // Tree canopy shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.arc(tx + 3, ty + 3, 9, 0, Math.PI * 2);
      ctx.fill();

      // Trunk
      ctx.fillStyle = '#78350f';
      ctx.fillRect(tx - 2, ty - 2, 4, 4);

      // Dark leaves
      ctx.fillStyle = timeOfDay === 'day' ? '#047857' : '#064e3b';
      ctx.beginPath();
      ctx.arc(tx, ty, 9, 0, Math.PI * 2);
      ctx.fill();

      // Light leaves highlight
      ctx.fillStyle = timeOfDay === 'day' ? '#10b981' : '#059669';
      ctx.beginPath();
      ctx.arc(tx - 2, ty - 2, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // ── ROAD RENDERING ENGINE ──────────────────────────────────────────────────
  
  // 1. Concrete sidewalk / shoulders base
  ctx.lineCap   = 'round';
  ctx.lineJoin  = 'round';
  ctx.strokeStyle = timeOfDay === 'day' ? '#4b5563' : timeOfDay === 'sunset' ? '#292524' : '#18181b';
  ctx.lineWidth   = (track.roadWidth || 90) * 2 + 16;
  ctx.beginPath();
  track.checkpoints.forEach((wp, idx) => {
    if (idx === 0) ctx.moveTo(wp.x, wp.y);
    else           ctx.lineTo(wp.x, wp.y);
  });
  ctx.stroke();

  // 2. Red-and-White Racing Curbs (Dashed lines along the curb edges)
  ctx.lineCap = 'butt';
  ctx.lineWidth = 5;
  
  // Left side curbs
  ctx.strokeStyle = '#ef4444'; // Red base
  ctx.setLineDash([16, 16]);
  ctx.beginPath();
  track.leftWalls.forEach((w, idx) => {
    if (idx === 0) ctx.moveTo(w.p1.x, w.p1.y);
    ctx.lineTo(w.p2.x, w.p2.y);
  });
  ctx.stroke();
  
  ctx.strokeStyle = '#ffffff'; // White stripes
  ctx.lineDashOffset = 16;
  ctx.beginPath();
  track.leftWalls.forEach((w, idx) => {
    if (idx === 0) ctx.moveTo(w.p1.x, w.p1.y);
    ctx.lineTo(w.p2.x, w.p2.y);
  });
  ctx.stroke();

  // Right side curbs
  ctx.strokeStyle = '#ef4444'; // Red base
  ctx.lineDashOffset = 0;
  ctx.beginPath();
  track.rightWalls.forEach((w, idx) => {
    if (idx === 0) ctx.moveTo(w.p1.x, w.p1.y);
    ctx.lineTo(w.p2.x, w.p2.y);
  });
  ctx.stroke();

  ctx.strokeStyle = '#ffffff'; // White stripes
  ctx.lineDashOffset = 16;
  ctx.beginPath();
  track.rightWalls.forEach((w, idx) => {
    if (idx === 0) ctx.moveTo(w.p1.x, w.p1.y);
    ctx.lineTo(w.p2.x, w.p2.y);
  });
  ctx.stroke();
  
  // Reset line dash
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
  ctx.lineCap = 'round';

  // 3. Asphalt road surface (Slate Black)
  ctx.strokeStyle = '#0f172a'; // Dark asphalt
  ctx.lineWidth   = (track.roadWidth || 90) * 2;
  ctx.beginPath();
  track.checkpoints.forEach((wp, idx) => {
    if (idx === 0) ctx.moveTo(wp.x, wp.y);
    else           ctx.lineTo(wp.x, wp.y);
  });
  ctx.stroke();

  // 4. White curb lines (boundary line inside the curb)
  ctx.lineWidth   = 1.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  track.leftWalls.forEach((w, idx) => {
    if (idx === 0) ctx.moveTo(w.p1.x, w.p1.y);
    ctx.lineTo(w.p2.x, w.p2.y);
  });
  ctx.stroke();

  ctx.beginPath();
  track.rightWalls.forEach((w, idx) => {
    if (idx === 0) ctx.moveTo(w.p1.x, w.p1.y);
    ctx.lineTo(w.p2.x, w.p2.y);
  });
  ctx.stroke();

  // 5. Yellow highway dashed center line
  ctx.strokeStyle = '#fbbf24'; // Golden Yellow
  ctx.lineWidth   = 2;
  ctx.setLineDash([20, 24]);
  ctx.beginPath();
  track.checkpoints.forEach((wp, idx) => {
    if (idx === 0) ctx.moveTo(wp.x, wp.y);
    else           ctx.lineTo(wp.x, wp.y);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  // Crosswalks
  state.cityAssets.crosswalks.forEach((cw) => {
    ctx.save();
    ctx.translate(cw.center.x, cw.center.y);
    ctx.rotate(cw.angle + Math.PI / 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth   = 6;
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.moveTo(-45, 0);
    ctx.lineTo( 45, 0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  });

  // Traffic lights next to crosswalks
  const lightCycle = Math.floor(Date.now() / 4000) % 3; // 0: green, 1: yellow, 2: red
  state.cityAssets.crosswalks.forEach((cw) => {
    // Offset traffic light to the side of the road
    const lightOffset = track.roadWidth + 15;
    const lx = cw.center.x + Math.cos(cw.angle + Math.PI / 2) * lightOffset;
    const ly = cw.center.y + Math.sin(cw.angle + Math.PI / 2) * lightOffset;

    // Pole
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx, ly - 22);
    ctx.stroke();

    // Box
    ctx.fillStyle = '#1f2937';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(lx - 5, ly - 37, 10, 18, 2);
    ctx.fill();
    ctx.stroke();

    // Lenses (Red, Yellow, Green)
    ctx.fillStyle = lightCycle === 2 ? '#ef4444' : '#4b5563'; // Red
    ctx.beginPath(); ctx.arc(lx, ly - 33, 2, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = lightCycle === 1 ? '#fbbf24' : '#4b5563'; // Yellow
    ctx.beginPath(); ctx.arc(lx, ly - 28, 2, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = lightCycle === 0 ? '#10b981' : '#4b5563'; // Green
    ctx.beginPath(); ctx.arc(lx, ly - 23, 2, 0, Math.PI * 2); ctx.fill();
  });

  // Ambient streetlights with warm light cones (at intervals along track)
  for (let i = 0; i < track.checkpoints.length; i += 18) {
    const cp = track.checkpoints[i];
    const nextCp = track.checkpoints[(i + 1) % track.checkpoints.length];
    const angle = Math.atan2(nextCp.y - cp.y, nextCp.x - cp.x) + Math.PI / 2;
    const sx = cp.x + Math.cos(angle) * (track.roadWidth + 10);
    const sy = cp.y + Math.sin(angle) * (track.roadWidth + 10);

    // Draw pole
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, sy - 15);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#d1d5db';
    ctx.beginPath();
    ctx.arc(sx, sy - 15, 3, 0, Math.PI * 2);
    ctx.fill();

    // Light beam in dark modes
    if (timeOfDay === 'sunset' || timeOfDay === 'cyber-night') {
      const gradient = ctx.createRadialGradient(sx, sy - 15, 2, sx, sy - 15, 60);
      gradient.addColorStop(0, timeOfDay === 'cyber-night' ? 'rgba(253, 224, 71, 0.25)' : 'rgba(251, 146, 60, 0.2)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(sx, sy - 15, 60, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Buildings with axonometric 3-D projection and structural patterns
  state.cityAssets.buildings.forEach((b) => {
    const rxOffset = (b.x - (camX + canvas.width  / 2)) * 0.08;
    const ryOffset = (b.y - (camY + canvas.height / 2)) * 0.08;

    // Draw base shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(b.x + 8, b.y + 8, b.w, b.h);

    // Bottom shadow face
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.moveTo(b.x,        b.y + b.h);
    ctx.lineTo(b.x + rxOffset,        b.y + b.h + ryOffset);
    ctx.lineTo(b.x + b.w + rxOffset,  b.y + b.h + ryOffset);
    ctx.lineTo(b.x + b.w, b.y + b.h);
    ctx.fill();

    // Right shadow face
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.moveTo(b.x + b.w,             b.y);
    ctx.lineTo(b.x + b.w + rxOffset,  b.y + ryOffset);
    ctx.lineTo(b.x + b.w + rxOffset,  b.y + b.h + ryOffset);
    ctx.lineTo(b.x + b.w,             b.y + b.h);
    ctx.fill();

    // Roof Top
    ctx.fillStyle   = timeOfDay === 'cyber-night' ? '#1e293b' : timeOfDay === 'sunset' ? '#2e2528' : '#374151';
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth   = 1.5;
    ctx.fillRect(b.x + rxOffset,   b.y + ryOffset,   b.w, b.h);
    ctx.strokeRect(b.x + rxOffset, b.y + ryOffset,   b.w, b.h);

    // Helipad or Roof design on large/medium buildings
    if (b.w > 40) {
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(b.x + rxOffset + b.w/2, b.y + ryOffset + b.h/2, 12, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('H', b.x + rxOffset + b.w/2, b.y + ryOffset + b.h/2);
    }

    // Windows facade with modern grid details
    if (timeOfDay === 'cyber-night') {
      const windowsCount = Math.floor(b.w / 18);
      ctx.fillStyle = Math.random() > 0.45 ? '#fef08a' : '#38bdf8'; // Glowing yellow or sky cyan
      for (let wx = 0; wx < windowsCount; wx++) {
        for (let wy = 0; wy < windowsCount; wy++) {
          if ((wx * 5 + wy * 11) % 4 === 0) { // Randomize window glow state
            ctx.fillRect(
              b.x + rxOffset + 8 + wx * 15,
              b.y + ryOffset + 8 + wy * 15,
              5,
              5
            );
          }
        }
      }
      // Glowing neon antenna on taller buildings
      if (b.height > 85) {
        ctx.strokeStyle = '#ec4899'; // Hot pink neon
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(b.x + rxOffset + b.w/2, b.y + ryOffset + b.h/2);
        ctx.lineTo(b.x + rxOffset + b.w/2, b.y + ryOffset + b.h/2 - 18);
        ctx.stroke();

        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(b.x + rxOffset + b.w/2, b.y + ryOffset + b.h/2 - 18, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Daytime window outline
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      const winCount = Math.floor(b.w / 18);
      for (let wx = 0; wx < winCount; wx++) {
        for (let wy = 0; wy < winCount; wy++) {
          ctx.fillRect(b.x + rxOffset + 8 + wx * 15, b.y + ryOffset + 8 + wy * 15, 6, 6);
        }
      }
    }
  });

  // Traffic cones
  state.obstacles.forEach((cone) => {
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(cone.x, cone.y, cone.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cone.x, cone.y, cone.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Rain overlay
  if (hasRain) {
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.2)';
    ctx.lineWidth   = 1;
    for (let r = 0; r < 25; r++) {
      const rx = camX + Math.random() * canvas.width;
      const ry = camY + Math.random() * canvas.height;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 5, ry + 20);
      ctx.stroke();
    }
  }

  // Sunset / cyber-night tint
  if (timeOfDay === 'sunset') {
    ctx.fillStyle = 'rgba(251, 146, 60, 0.12)';
    ctx.fillRect(camX, camY, canvas.width, canvas.height);
  } else if (timeOfDay === 'cyber-night') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.fillRect(camX, camY, canvas.width, canvas.height);
  }
};

/**
 * Draw LIDAR sensor rays for the champion car.
 */
export const drawLidar = (ctx, leader) => {
  if (!leader || !leader.alive) return;
  leader.sensorRays.forEach((ray) => {
    const d  = ray.p2.offset || 1.0;
    const near = d < 0.28;
    ctx.strokeStyle = near ? 'rgba(239,68,68,0.75)' : 'rgba(34,197,94,0.45)';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(ray.p1.x, ray.p1.y);
    ctx.lineTo(ray.p2.x, ray.p2.y);
    ctx.stroke();

    ctx.fillStyle = near ? '#ef4444' : '#22c55e';
    ctx.beginPath();
    ctx.arc(ray.p2.x, ray.p2.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
};

/**
 * Draw all alive AI cars (and optionally highlight the leader).
 */
export const drawAICars = (ctx, cars, currentLeader, timeOfDay) => {
  cars.forEach((car) => {
    if (!car.alive) return;

    // Tire tracks
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth   = 3;
    ctx.beginPath();
    car.trail.forEach((t, i) => {
      if (i === 0) ctx.moveTo(t.x, t.y);
      else         ctx.lineTo(t.x, t.y);
    });
    ctx.stroke();

    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

    const isLeader = car === currentLeader;

    // Night headlights
    if (timeOfDay === 'cyber-night') {
      ctx.fillStyle = 'rgba(254,240,138,0.25)';
      ctx.beginPath();
      ctx.moveTo(car.width / 2, -2);
      ctx.lineTo(car.width / 2 + 100, -35);
      ctx.lineTo(car.width / 2 + 100,  35);
      ctx.closePath();
      ctx.fill();
    }

    // Body
    ctx.fillStyle   = isLeader ? '#f59e0b' : 'rgba(56,189,248,0.8)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.roundRect(-car.width / 2, -car.height / 2, car.width, car.height, 3);
    ctx.fill();
    ctx.stroke();

    // Windshield
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(2, -4, 5, 8);

    // Tail lights
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-car.width / 2, -car.height / 2 + 2, 2, 2);
    ctx.fillRect(-car.width / 2,  car.height / 2 - 4, 2, 2);

    ctx.restore();
  });
};

/**
 * Draw the manual (player) car.
 */
export const drawManualCar = (ctx, manualCar, timeOfDay) => {
  if (!manualCar || !manualCar.alive) return;
  const mc = manualCar;

  ctx.save();
  ctx.translate(mc.x, mc.y);
  ctx.rotate(mc.angle);

  if (timeOfDay === 'cyber-night') {
    ctx.fillStyle = 'rgba(254,240,138,0.35)';
    ctx.beginPath();
    ctx.moveTo(mc.width / 2, -2);
    ctx.lineTo(mc.width / 2 + 120, -45);
    ctx.lineTo(mc.width / 2 + 120,  45);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle   = '#10b981';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth   = 2;
  ctx.shadowColor = '#10b981';
  ctx.shadowBlur  = 8;
  ctx.beginPath();
  ctx.roundRect(-mc.width / 2, -mc.height / 2, mc.width, mc.height, 3);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
};

/**
 * Draw the GPS mini-map HUD overlay in the bottom-right corner of the canvas.
 */
export const drawMinimap = (ctx, canvas, state, manualMode) => {
  const mmSize = 130;
  const mmX    = canvas.width  - mmSize - 20;
  const mmY    = canvas.height - mmSize - 20;
  const scale  = mmSize / 2400;

  // Background
  ctx.fillStyle   = 'rgba(15,23,42,0.85)';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth   = 3;
  ctx.beginPath();
  ctx.roundRect(mmX, mmY, mmSize, mmSize, 8);
  ctx.fill();
  ctx.stroke();

  // Track outline
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth   = 5;
  ctx.beginPath();
  state.track.checkpoints.forEach((wp, idx) => {
    const mx = mmX + wp.x * scale;
    const my = mmY + wp.y * scale;
    if (idx === 0) ctx.moveTo(mx, my);
    else           ctx.lineTo(mx, my);
  });
  ctx.stroke();

  // Car dots
  const sortedActive = state.cars
    .filter(c => c.alive)
    .sort((a, b) => b.fitness - a.fitness);
  const leader = sortedActive[0] || state.cars[0];

  state.cars.forEach((car) => {
    if (!car.alive) return;
    ctx.fillStyle = car === leader ? '#f59e0b' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(mmX + car.x * scale, mmY + car.y * scale, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  if (manualMode && state.manualCar?.alive) {
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(mmX + state.manualCar.x * scale, mmY + state.manualCar.y * scale, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
};
