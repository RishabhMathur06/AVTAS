import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';

// ─────────────────────────────────────────────────────────────────────────────
// Custom 3D Road Geometry Component
// ─────────────────────────────────────────────────────────────────────────────
function RoadSurface({ track }) {
  const geom = useMemo(() => {
    if (!track || !track.checkpoints) return null;
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    const uvs = [];

    const n = track.checkpoints.length;
    // For each checkpoint, we have two boundary points
    for (let i = 0; i < n; i++) {
      const cp = track.checkpoints[i];
      const left = track.leftWalls[i % track.leftWalls.length].p1;
      const right = track.rightWalls[i % track.rightWalls.length].p1;

      // Map 2D (x, y) to 3D (x, 0, z)
      vertices.push(left.x, 0.01, left.y);  // Left curb point
      vertices.push(right.x, 0.01, right.y); // Right curb point

      // UV mapping for road texture / lane markings repeat
      const v = i / 10;
      uvs.push(0, v);
      uvs.push(1, v);

      if (i < n - 1) {
        const idx = i * 2;
        // Triangles forming the road segment quad
        indices.push(idx, idx + 1, idx + 2);
        indices.push(idx + 1, idx + 3, idx + 2);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }, [track]);

  if (!geom) return null;

  return (
    <mesh geometry={geom} receiveShadow>
      <meshStandardMaterial
        color="#111111"
        roughness={0.9}
        metalness={0.1}
        side={THREE.DoubleSide}
        flatShading={false}
      />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// White & Yellow Road Markings Component
// ─────────────────────────────────────────────────────────────────────────────
function RoadMarkings({ track }) {
  const centerLinePoints = useMemo(() => {
    if (!track) return [];
    return track.checkpoints.map(cp => new THREE.Vector3(cp.x, 0.02, cp.y));
  }, [track]);

  const leftCurbPoints = useMemo(() => {
    if (!track) return [];
    return track.leftWalls.map(w => new THREE.Vector3(w.p1.x, 0.02, w.p1.y));
  }, [track]);

  const rightCurbPoints = useMemo(() => {
    if (!track) return [];
    return track.rightWalls.map(w => new THREE.Vector3(w.p1.x, 0.02, w.p1.y));
  }, [track]);

  return (
    <group>
      {/* Yellow Dashed Center Line */}
      <LineLoop
        points={centerLinePoints}
        color="#fbbf24"
        lineWidth={2}
        dashed
        dashSize={15}
        gapSize={12}
      />
      {/* Left White Edge */}
      <LineLoop
        points={leftCurbPoints}
        color="rgba(255, 255, 255, 0.5)"
        lineWidth={1}
      />
      {/* Right White Edge */}
      <LineLoop
        points={rightCurbPoints}
        color="rgba(255, 255, 255, 0.5)"
        lineWidth={1}
      />
    </group>
  );
}

// A simple loop helper component using THREE.Line2 or basic LineLoop
function LineLoop({ points, color, lineWidth = 1, dashed = false, dashSize = 10, gapSize = 10 }) {
  const lineRef = useRef();

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return geom;
  }, [points]);

  const material = useMemo(() => {
    if (dashed) {
      return new THREE.LineDashedMaterial({
        color,
        linewidth: lineWidth,
        dashSize,
        gapSize,
        scale: 1,
      });
    }
    return new THREE.LineBasicMaterial({
      color,
      linewidth: lineWidth,
    });
  }, [color, lineWidth, dashed, dashSize, gapSize]);

  useEffect(() => {
    if (lineRef.current && dashed) {
      lineRef.current.computeLineDistances();
    }
  }, [dashed, points]);

  return <lineLoop ref={lineRef} geometry={geometry} material={material} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Red-and-White Curbs Component
// ─────────────────────────────────────────────────────────────────────────────
function RoadCurbs({ track }) {
  const curbMesh = useMemo(() => {
    if (!track) return null;
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    const indices = [];

    const n = track.checkpoints.length;
    for (let i = 0; i < n; i++) {
      const leftW = track.leftWalls[i % track.leftWalls.length].p1;
      const rightW = track.rightWalls[i % track.rightWalls.length].p1;

      const angle = Math.atan2(
        track.checkpoints[(i + 1) % n].y - track.checkpoints[i].y,
        track.checkpoints[(i + 1) % n].x - track.checkpoints[i].x
      ) + Math.PI / 2;

      const offsetWidth = 3;

      // Left curb strip points
      const l1_x = leftW.x;
      const l1_z = leftW.y;
      const l2_x = leftW.x + Math.cos(angle) * offsetWidth;
      const l2_z = leftW.y + Math.sin(angle) * offsetWidth;

      // Right curb strip points
      const r1_x = rightW.x;
      const r1_z = rightW.y;
      const r2_x = rightW.x - Math.cos(angle) * offsetWidth;
      const r2_z = rightW.y - Math.sin(angle) * offsetWidth;

      // Add left curb points (raised slightly)
      vertices.push(l1_x, 0.05, l1_z);
      vertices.push(l2_x, 0.05, l2_z);

      // Add right curb points (raised slightly)
      vertices.push(r1_x, 0.05, r1_z);
      vertices.push(r2_x, 0.05, r2_z);

      // Alternating Red & White colors every few checkpoints
      const isRed = Math.floor(i / 2) % 2 === 0;
      const r = isRed ? 0.93 : 1.0;
      const g = isRed ? 0.27 : 1.0;
      const b = isRed ? 0.27 : 1.0;

      colors.push(r, g, b); // Left inner
      colors.push(r, g, b); // Left outer
      colors.push(r, g, b); // Right inner
      colors.push(r, g, b); // Right outer

      if (i < n - 1) {
        const idx = i * 4;
        // Left Curb quad triangles
        indices.push(idx, idx + 1, idx + 4);
        indices.push(idx + 1, idx + 5, idx + 4);

        // Right Curb quad triangles
        indices.push(idx + 2, idx + 3, idx + 6);
        indices.push(idx + 3, idx + 7, idx + 6);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }, [track]);

  if (!curbMesh) return null;

  return (
    <mesh geometry={curbMesh}>
      <meshStandardMaterial vertexColors roughness={0.6} metalness={0.1} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// City Buildings Component
// ─────────────────────────────────────────────────────────────────────────────
function CityBuildings({ buildings, timeOfDay }) {
  const isNight = timeOfDay === 'cyber-night';
  const meshRef = useRef();

  const buildingsData = useMemo(() => {
    return buildings.map((b, idx) => {
      // Procedurally assign night facade types and glowing windows
      const neonColor = idx % 3 === 0 ? '#ec4899' : idx % 3 === 1 ? '#06b6d4' : '#fbbf24';
      const hasNeonAntenna = b.height > 85;
      return {
        ...b,
        neonColor,
        hasNeonAntenna,
      };
    });
  }, [buildings]);

  // Update instance matrices for extreme performance
  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    buildingsData.forEach((b, i) => {
      dummy.position.set(b.x + b.w / 2, b.height / 2, b.y + b.h / 2);
      dummy.scale.set(b.w, b.height, b.h);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [buildingsData]);

  return (
    <group>
      {/* 1 Single Draw Call for all Buildings */}
      <instancedMesh ref={meshRef} args={[null, null, buildingsData.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={timeOfDay === 'day' ? '#94a3b8' : timeOfDay === 'sunset' ? '#451a03' : '#09090b'}
          roughness={0.9}
          metalness={0.1}
          emissive={isNight ? '#0b0b1a' : '#000000'}
        />
      </instancedMesh>

      {/* Decorative Facades & Antennas */}
      {buildingsData.map((b, idx) => (
        <group key={idx} position={[b.x + b.w / 2, b.height / 2, b.y + b.h / 2]}>
          {isNight && b.hasNeonAntenna && (
            <group position={[0, b.height / 2, 0]}>
              <mesh position={[0, 8, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 16, 4]} />
                <meshBasicMaterial color={b.neonColor} />
              </mesh>
              <mesh position={[0, 16, 0]}>
                <sphereGeometry args={[1, 8, 8]} />
                <meshBasicMaterial color={b.neonColor} />
              </mesh>
              {/* Removed pointLight to save massive performance */}
            </group>
          )}

          {isNight && b.w > 40 && (
            <mesh position={[0, 0, b.h / 2 + 0.1]}>
              <planeGeometry args={[b.w - 10, b.height - 10]} />
              <meshBasicMaterial color="#fbbf24" transparent opacity={0.15} wireframe />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Traffic Cones Component
// ─────────────────────────────────────────────────────────────────────────────
function TrafficCones3D({ obstacles }) {
  return (
    <group>
      {obstacles.map((cone, idx) => (
        <group key={idx} position={[cone.x, 0.05, cone.y]}>
          {/* Cone body */}
          <mesh castShadow position={[0, 4, 0]}>
            <coneGeometry args={[4, 8, 8]} />
            <meshStandardMaterial color="#f97316" roughness={0.5} />
          </mesh>
          {/* White Stripe */}
          <mesh position={[0, 4, 0]}>
            <cylinderGeometry args={[2.1, 2.7, 2.5, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </mesh>
          {/* Black Base */}
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[10, 0.4, 10]} />
            <meshStandardMaterial color="#111111" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rain Particle System Component
// ─────────────────────────────────────────────────────────────────────────────
function RainSystem({ hasRain }) {
  const pointsRef = useRef();
  const count = 1800;

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Spawn rain particles in a cylinder around the coordinates
      pos[i * 3] = (Math.random() - 0.5) * 600;
      pos[i * 3 + 1] = Math.random() * 200;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 600;
      spd[i] = 4 + Math.random() * 4;
    }
    return [pos, spd];
  }, []);

  useFrame((state) => {
    if (!hasRain || !pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const array = posAttr.array;

    // Follow camera's target center so rain loop stays relative
    const camera = state.camera;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      // Subtract fall speed
      array[idx + 1] -= speeds[i] * 1.5;

      // Wrap around ground floor
      if (array[idx + 1] < 0) {
        array[idx + 1] = 200;
        // Keep positioned relative to camera x-z coordinates
        array[idx] = camera.position.x + (Math.random() - 0.5) * 600;
        array[idx + 2] = camera.position.z + (Math.random() - 0.5) * 600;
      }
    }
    posAttr.needsUpdate = true;
  });

  if (!hasRain) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#93c5fd"
        size={0.8}
        transparent
        opacity={0.35}
        sizeAttenuation
      />
    </points>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ambient Street Lights Component
// ─────────────────────────────────────────────────────────────────────────────
function StreetLights({ track, timeOfDay }) {
  const isNight = timeOfDay === 'cyber-night';
  const isSunset = timeOfDay === 'sunset';
  if (!isNight && !isSunset) return null;

  // We place streetlights along checkpoints
  const lightPositions = useMemo(() => {
    if (!track) return [];
    const positions = [];
    const n = track.checkpoints.length;
    for (let i = 0; i < n; i += 18) {
      const cp = track.checkpoints[i];
      const nextCp = track.checkpoints[(i + 1) % n];
      const angle = Math.atan2(nextCp.y - cp.y, nextCp.x - cp.x) + Math.PI / 2;
      const sx = cp.x + Math.cos(angle) * (track.roadWidth + 10);
      const sz = cp.y + Math.sin(angle) * (track.roadWidth + 10);
      positions.push({ x: sx, z: sz });
    }
    return positions;
  }, [track]);

  const lightColor = isNight ? '#fde047' : '#fb923c';

  return (
    <group>
      {lightPositions.map((pos, idx) => (
        <group key={idx} position={[pos.x, 0, pos.z]}>
          {/* Post/Pole */}
          <mesh castShadow position={[0, 10, 0]}>
            <cylinderGeometry args={[0.3, 0.4, 20, 8]} />
            <meshStandardMaterial color="#4b5563" roughness={0.4} />
          </mesh>
          {/* Light Head */}
          <mesh position={[0, 20, 0]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color={lightColor} />
          </mesh>
          {/* Spotlight cast */}
          <spotLight
            position={[0, 20, 0]}
            color={lightColor}
            intensity={10.0}
            distance={50}
            angle={Math.PI / 4}
            penumbra={0.5}
            // Removed castShadow to prevent exponential draw call explosion
          />
        </group>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cars Controller and Camera Rig Component
// ─────────────────────────────────────────────────────────────────────────────
function CarsController({ stateRef, timeOfDay, cameraMode, zoom }) {
  const leaderRef = useRef();
  const followerRef = useRef();
  const lidarRef = useRef();

  const isNight = timeOfDay === 'cyber-night';

  // We draw the follower cars in an InstancedMesh for extreme WebGL performance
  // Pre-initialize buffer coordinates
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Set initial wheels rotation refs
  const wheelsRef = useRef([]);

  const lookTargetRef = useRef(new THREE.Vector3());
  const isFirstFrame = useRef(true);

  useFrame((state) => {
    const cars = stateRef.current.cars;
    if (!cars || cars.length === 0) return;

    // ── Find active Leader car ──────────────────────────────────────────────
    const aliveCars = cars.filter((c) => c.alive).sort((a, b) => b.fitness - a.fitness);
    const leader = aliveCars[0] || cars[0];

    // ── Update Leader Mesh & Wheels ─────────────────────────────────────────
    if (leaderRef.current && leader) {
      leaderRef.current.position.set(leader.x, 0.2, leader.y);
      leaderRef.current.rotation.y = -leader.angle;

      // Animate wheels based on leader velocity
      wheelsRef.current.forEach((wheel) => {
        if (wheel) {
          wheel.rotation.x += leader.speed * 0.15;
        }
      });
    }

    // ── Update Follower Cars InstancedMesh ─────────────────────────────────
    if (followerRef.current) {
      let followerIdx = 0;
      cars.forEach((car) => {
        // We render all alive follower cars (except the leader) in the instanced mesh
        if (car.alive && car !== leader) {
          dummy.position.set(car.x, 0.2, car.y);
          dummy.rotation.y = -car.angle;
          dummy.updateMatrix();
          followerRef.current.setMatrixAt(followerIdx, dummy.matrix);
          followerIdx++;
        }
      });

      // Hide unused instances below ground level
      for (let i = followerIdx; i < cars.length; i++) {
        dummy.position.set(0, -100, 0);
        dummy.updateMatrix();
        followerRef.current.setMatrixAt(i, dummy.matrix);
      }
      followerRef.current.instanceMatrix.needsUpdate = true;
    }

    // ── Update LIDAR Sensor Rays ────────────────────────────────────────────
    if (lidarRef.current && leader && leader.alive && leader.sensorRays) {
      const lineGeoms = lidarRef.current.children;
      leader.sensorRays.forEach((ray, idx) => {
        if (idx < lineGeoms.length) {
          const line = lineGeoms[idx];
          const posAttr = line.geometry.attributes.position;
          const array = posAttr.array;

          // Start position (front center of leader)
          array[0] = ray.p1.x;
          array[1] = 0.5;
          array[2] = ray.p1.y;

          // End position (sensor intersection)
          array[3] = ray.p2.x;
          array[4] = 0.5;
          array[5] = ray.p2.y;

          posAttr.needsUpdate = true;

          // Color based on intersection distance
          const d = ray.p2.offset || 1.0;
          const isNear = d < 0.28;
          line.material.color.setHex(isNear ? 0xef4444 : 0x22c55e);
        }
      });
    }

    // ── Update Camera rig (Lerp) ────────────────────────────────────────────
    if (leader) {
      const cam = state.camera;
      const targetPos = new THREE.Vector3();
      const idealLook = new THREE.Vector3();

      if (cameraMode === 'follow') {
        // GTA/Forza style Chase Cam: behind and looking forward
        const distance = 95 * zoom;
        const height = 45 * zoom;
        const lookAheadDistance = 50;

        const cosAngle = Math.cos(leader.angle);
        const sinAngle = Math.sin(leader.angle);

        // Position camera behind vehicle
        const camX = leader.x - cosAngle * distance;
        const camZ = leader.y - sinAngle * distance;

        targetPos.set(camX, height, camZ);
        idealLook.set(
          leader.x + cosAngle * lookAheadDistance,
          2.0,
          leader.y + sinAngle * lookAheadDistance
        );
      } else {
        // Isometric Top-down Cam
        const height = 420 * zoom;
        targetPos.set(leader.x, height, leader.y + 0.1); // slight offset for clean top down projection angle
        idealLook.set(leader.x, 0, leader.y);
      }

      if (isFirstFrame.current) {
        cam.position.copy(targetPos);
        lookTargetRef.current.copy(idealLook);
        isFirstFrame.current = false;
      } else {
        cam.position.lerp(targetPos, 0.05);
        lookTargetRef.current.lerp(idealLook, 0.05);
      }
      cam.lookAt(lookTargetRef.current);
    }
  });

  return (
    <group>
      {/* Detailed Leader Car */}
      <group ref={leaderRef}>
        {/* Car chassis / body */}
        <mesh castShadow receiveShadow position={[0, 2.5, 0]}>
          <boxGeometry args={[24, 4.5, 12]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.2} metalness={0.7} />
        </mesh>
        {/* Windshield */}
        <mesh position={[4, 4.5, 0]}>
          <boxGeometry args={[6, 3, 10]} />
          <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
        </mesh>
        {/* Headlights */}
        <mesh position={[12, 2.2, 3.5]}>
          <boxGeometry args={[0.5, 1, 2]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[12, 2.2, -3.5]}>
          <boxGeometry args={[0.5, 1, 2]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Tail lights */}
        <mesh position={[-12, 2.2, 4]}>
          <boxGeometry args={[0.5, 1, 2.2]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[-12, 2.2, -4]}>
          <boxGeometry args={[0.5, 1, 2.2]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>

        {/* Dynamic Headlight Cones / Point Lights at Night */}
        {isNight && (
          <group position={[12.1, 2.2, 0]}>
            <spotLight
              color="#fffee0"
              intensity={4.5}
              distance={220}
              angle={Math.PI / 5}
              penumbra={0.3}
              castShadow
            />
          </group>
        )}

        {/* Underglow neon ring */}
        {isNight && (
          <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[9, 11, 16]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        )}

        {/* Wheels (Cylinders) */}
        <group ref={(el) => (wheelsRef.current[0] = el)} position={[7, 1.5, 6.2]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow><cylinderGeometry args={[2.2, 2.2, 2, 12]} /><meshStandardMaterial color="#111111" roughness={0.9} /></mesh>
        </group>
        <group ref={(el) => (wheelsRef.current[1] = el)} position={[7, 1.5, -6.2]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow><cylinderGeometry args={[2.2, 2.2, 2, 12]} /><meshStandardMaterial color="#111111" roughness={0.9} /></mesh>
        </group>
        <group ref={(el) => (wheelsRef.current[2] = el)} position={[-7, 1.5, 6.2]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow><cylinderGeometry args={[2.2, 2.2, 2, 12]} /><meshStandardMaterial color="#111111" roughness={0.9} /></mesh>
        </group>
        <group ref={(el) => (wheelsRef.current[3] = el)} position={[-7, 1.5, -6.2]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow><cylinderGeometry args={[2.2, 2.2, 2, 12]} /><meshStandardMaterial color="#111111" roughness={0.9} /></mesh>
        </group>
      </group>

      {/* Instanced Followers Pool */}
      <instancedMesh ref={followerRef} args={[null, null, 100]} castShadow>
        <boxGeometry args={[24, 4.5, 12]} />
        <meshStandardMaterial
          color="#0ea5e9"
          transparent
          opacity={0.4}
          roughness={0.3}
          metalness={0.5}
        />
      </instancedMesh>

      {/* LIDAR sensor rays */}
      <group ref={lidarRef}>
        {Array.from({ length: 5 }).map((_, idx) => (
          <line key={idx}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array(6), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#22c55e" linewidth={2} />
          </line>
        ))}
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fog & Sun Controller
// ─────────────────────────────────────────────────────────────────────────────
function SkyAndFog({ timeOfDay }) {
  const getSkyConfig = () => {
    switch (timeOfDay) {
      case 'day':
        return { sunPosition: [100, 50, 100], turbidity: 2, rayleigh: 0.5 };
      case 'sunset':
        return { sunPosition: [100, 5, -100], turbidity: 10, rayleigh: 2 };
      default:
        // Night
        return { sunPosition: [0, -100, 0], turbidity: 0, rayleigh: 0 };
    }
  };

  const getFogConfig = () => {
    switch (timeOfDay) {
      case 'day':
        return { color: '#87ceeb', density: 0.0006 };
      case 'sunset':
        return { color: '#fdba74', density: 0.0008 };
      default:
        return { color: '#070709', density: 0.0015 };
    }
  };

  const sky = getSkyConfig();
  const fog = getFogConfig();

  return (
    <group>
      <color attach="background" args={[fog.color]} />
      <fogExp2 attach="fog" color={fog.color} density={fog.density} />
      {timeOfDay !== 'cyber-night' ? (
        <Sky distance={50000} sunPosition={sky.sunPosition} turbidity={sky.turbidity} rayleigh={sky.rayleigh} />
      ) : (
        <group>
          <Stars radius={500} depth={50} count={3000} factor={6} saturation={0.5} fade speed={1} />
        </group>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ground Component
// ─────────────────────────────────────────────────────────────────────────────
function Ground({ timeOfDay }) {
  const color = timeOfDay === 'day' ? '#4ade80' : timeOfDay === 'sunset' ? '#78350f' : '#050505';
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
      <planeGeometry args={[10000, 10000]} />
      <meshStandardMaterial color={color} roughness={1} metalness={0} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Lighting Controller
// ─────────────────────────────────────────────────────────────────────────────
function Lighting({ timeOfDay }) {
  const isNight = timeOfDay === 'cyber-night';
  const isSunset = timeOfDay === 'sunset';

  return (
    <group>
      {/* Soft general lighting */}
      <ambientLight intensity={isNight ? 0.05 : isSunset ? 0.25 : 0.65} />

      {/* Main directional source (Sun or Moon) */}
      <directionalLight
        castShadow
        position={isSunset ? [120, 40, -100] : [100, 300, 100]}
        intensity={isNight ? 0.08 : isSunset ? 0.8 : 1.5}
        color={isSunset ? '#fdba74' : isNight ? '#93c5fd' : '#ffffff'}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={2500}
        shadow-camera-left={-1200}
        shadow-camera-right={1200}
        shadow-camera-top={1200}
        shadow-camera-bottom={-1200}
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Scene3D Component
// ─────────────────────────────────────────────────────────────────────────────
export default function Scene3D({ stateRef, timeOfDay, hasRain, zoom, cameraMode }) {
  const track = stateRef.current?.track;
  const buildings = stateRef.current?.cityAssets?.buildings || [];
  const obstacles = stateRef.current?.obstacles || [];

  return (
    <div className="w-full h-full relative" style={{ minHeight: '520px' }}>
      <Canvas
        shadows
        gl={{ antialias: true, logarithmicDepthBuffer: true }}
        camera={{ position: [1200, 420, 1200], fov: 45, near: 1, far: 5000 }}
      >
        {/* Environment setup */}
        <SkyAndFog timeOfDay={timeOfDay} />
        <Lighting timeOfDay={timeOfDay} />
        <Ground timeOfDay={timeOfDay} />

        {/* City Geometry Layers */}
        {track && (
          <group>
            <RoadSurface track={track} />
            <RoadCurbs track={track} />
            <RoadMarkings track={track} />
            <StreetLights track={track} timeOfDay={timeOfDay} />
          </group>
        )}

        <CityBuildings buildings={buildings} timeOfDay={timeOfDay} />
        <TrafficCones3D obstacles={obstacles} />

        {/* Simulation Controllers */}
        <CarsController
          stateRef={stateRef}
          timeOfDay={timeOfDay}
          cameraMode={cameraMode}
          zoom={zoom}
        />

        {/* Rain Particles */}
        <RainSystem hasRain={hasRain} />


      </Canvas>
    </div>
  );
}
