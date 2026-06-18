import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';

// ─────────────────────────────────────────────────────────────────────────────
// Custom 3D Road Geometry Component (Grid Based)
// ─────────────────────────────────────────────────────────────────────────────
function RoadSurface({ track }) {
  if (!track || !track.roadRects) return null;

  return (
    <group>
      {track.roadRects.map((rect, i) => (
        <mesh key={`r-${i}`} position={[rect.x, 0.01, rect.y]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[rect.w, rect.h]} />
          <meshStandardMaterial color="#222222" roughness={0.9} metalness={0.1} />
        </mesh>
      ))}
      {track.intersectionRects.map((rect, i) => (
        <mesh key={`i-${i}`} position={[rect.x, 0.012, rect.y]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[rect.size, rect.size]} />
          <meshStandardMaterial color="#222222" roughness={0.9} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// White & Yellow Road Markings Component
// ─────────────────────────────────────────────────────────────────────────────
function RoadMarkings({ track }) {
  const lineGeoms = useMemo(() => {
    if (!track || !track.roadRects) return [];
    return track.roadRects.map(rect => {
      const isVert = rect.isVertical;
      const pts = [];
      if (isVert) {
        pts.push(new THREE.Vector3(rect.x, 0.03, rect.y - rect.h / 2));
        pts.push(new THREE.Vector3(rect.x, 0.03, rect.y + rect.h / 2));
      } else {
        pts.push(new THREE.Vector3(rect.x - rect.w / 2, 0.03, rect.y));
        pts.push(new THREE.Vector3(rect.x + rect.w / 2, 0.03, rect.y));
      }
      return pts;
    });
  }, [track]);

  return (
    <group>
      {lineGeoms.map((pts, i) => (
        <LineLoop key={i} points={pts} color="#fbbf24" lineWidth={2} dashed dashSize={15} gapSize={12} />
      ))}
    </group>
  );
}

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
// Crosswalks Component
// ─────────────────────────────────────────────────────────────────────────────
function Crosswalks({ track }) {
  if (!track || !track.crosswalks) return null;
  return (
    <group>
      {track.crosswalks.map((cw, i) => (
        <mesh key={`cw-${i}`} position={[cw.x, 0.015, cw.y]} rotation={[0, cw.angle, 0]} receiveShadow>
          <boxGeometry args={[track.roadWidth - 4, 0.02, 10]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Red-and-White Curbs Component
// ─────────────────────────────────────────────────────────────────────────────
function RoadCurbs({ track }) {
  const curbMesh = useMemo(() => {
    if (!track || !track.curbEdges) return null;
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    const indices = [];

    track.curbEdges.forEach((edge, i) => {
      const dx = edge.p2.x - edge.p1.x;
      const dy = edge.p2.y - edge.p1.y;
      const angle = Math.atan2(dy, dx);
      // Offset slightly to give width to the curb strip
      const nx = -Math.sin(angle) * 3;
      const ny = Math.cos(angle) * 3;

      const vIdx = vertices.length / 3;

      vertices.push(edge.p1.x, 0.05, edge.p1.y);
      vertices.push(edge.p1.x + nx, 0.05, edge.p1.y + ny);
      vertices.push(edge.p2.x, 0.05, edge.p2.y);
      vertices.push(edge.p2.x + nx, 0.05, edge.p2.y + ny);

      const isRed = i % 2 === 0;
      const cR = isRed ? 0.93 : 1.0;
      const cG = isRed ? 0.27 : 1.0;
      const cB = isRed ? 0.27 : 1.0;

      colors.push(cR, cG, cB);
      colors.push(cR, cG, cB);
      colors.push(cR, cG, cB);
      colors.push(cR, cG, cB);

      indices.push(vIdx, vIdx + 1, vIdx + 2);
      indices.push(vIdx + 1, vIdx + 3, vIdx + 2);
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }, [track]);

  if (!curbMesh) return null;

  return (
    <mesh geometry={curbMesh}>
      <meshStandardMaterial vertexColors roughness={0.6} metalness={0.1} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Traffic Lights Component
// ─────────────────────────────────────────────────────────────────────────────
function TrafficLights3D({ track }) {
  if (!track || !track.trafficLights) return null;
  return (
    <group>
      {track.trafficLights.map((tl, i) => (
        <group key={`tl-${i}`} position={[tl.x, 0, tl.y]}>
          <mesh position={[0, 8, 0]} castShadow>
            <cylinderGeometry args={[0.5, 0.5, 16, 8]} />
            <meshStandardMaterial color="#4b5563" roughness={0.6} />
          </mesh>
          <mesh position={[0, 16, 0]} rotation={[0, tl.angle, 0]} castShadow>
            <boxGeometry args={[3, 8, 3]} />
            <meshStandardMaterial color="#1f2937" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
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
      const neonColor = idx % 3 === 0 ? '#ec4899' : idx % 3 === 1 ? '#06b6d4' : '#fbbf24';
      const hasNeonAntenna = b.height > 85;
      return { ...b, neonColor, hasNeonAntenna };
    });
  }, [buildings]);

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
      <instancedMesh ref={meshRef} args={[null, null, buildingsData.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={timeOfDay === 'day' ? '#94a3b8' : timeOfDay === 'sunset' ? '#451a03' : '#09090b'}
          roughness={0.9}
          metalness={0.1}
          emissive={isNight ? '#0b0b1a' : '#000000'}
        />
      </instancedMesh>
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
          <mesh castShadow position={[0, 4, 0]}>
            <coneGeometry args={[4, 8, 8]} />
            <meshStandardMaterial color="#f97316" roughness={0.5} />
          </mesh>
          <mesh position={[0, 4, 0]}>
            <cylinderGeometry args={[2.1, 2.7, 2.5, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </mesh>
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
    const camera = state.camera;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      array[idx + 1] -= speeds[i] * 1.5;
      if (array[idx + 1] < 0) {
        array[idx + 1] = 200;
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
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#93c5fd" size={0.8} transparent opacity={0.35} sizeAttenuation />
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

  const lightPositions = useMemo(() => {
    if (!track || !track.curbEdges) return [];
    const positions = [];
    track.curbEdges.forEach((edge, idx) => {
      // Spawn light in the middle of alternating curbs
      if (idx % 2 === 0) {
        positions.push({ x: (edge.p1.x + edge.p2.x)/2, z: (edge.p1.y + edge.p2.y)/2 });
      }
    });
    return positions;
  }, [track]);

  const lightColor = isNight ? '#fde047' : '#fb923c';

  return (
    <group>
      {lightPositions.map((pos, idx) => (
        <group key={idx} position={[pos.x, 0, pos.z]}>
          <mesh castShadow position={[0, 10, 0]}>
            <cylinderGeometry args={[0.3, 0.4, 20, 8]} />
            <meshStandardMaterial color="#4b5563" roughness={0.4} />
          </mesh>
          <mesh position={[0, 20, 0]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color={lightColor} />
          </mesh>
          <spotLight
            position={[0, 20, 0]}
            color={lightColor}
            intensity={8.0}
            distance={70}
            angle={Math.PI / 3}
            penumbra={0.5}
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
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const wheelsRef = useRef([]);
  const lookTargetRef = useRef(new THREE.Vector3());
  const isFirstFrame = useRef(true);

  useFrame((state) => {
    const cars = stateRef.current.cars;
    if (!cars || cars.length === 0) return;

    const aliveCars = cars.filter((c) => c.alive).sort((a, b) => b.fitness - a.fitness);
    const leader = aliveCars[0] || cars[0];

    if (leaderRef.current && leader) {
      leaderRef.current.position.set(leader.x, 0.2, leader.y);
      leaderRef.current.rotation.y = -leader.angle;

      wheelsRef.current.forEach((wheel) => {
        if (wheel) wheel.rotation.y += leader.speed * 0.15;
      });
    }

    if (followerRef.current) {
      let followerIdx = 0;
      cars.forEach((car) => {
        if (car.alive && car !== leader) {
          dummy.position.set(car.x, 2.7, car.y);
          dummy.rotation.y = -car.angle;
          dummy.updateMatrix();
          followerRef.current.setMatrixAt(followerIdx, dummy.matrix);
          followerIdx++;
        }
      });
      for (let i = followerIdx; i < cars.length; i++) {
        dummy.position.set(0, -100, 0);
        dummy.updateMatrix();
        followerRef.current.setMatrixAt(i, dummy.matrix);
      }
      followerRef.current.instanceMatrix.needsUpdate = true;
    }

    if (lidarRef.current && leader && leader.alive && leader.sensorRays) {
      const lineGeoms = lidarRef.current.children;
      leader.sensorRays.forEach((ray, idx) => {
        if (idx < lineGeoms.length) {
          const line = lineGeoms[idx];
          const posAttr = line.geometry.attributes.position;
          const array = posAttr.array;

          array[0] = ray.p1.x;
          array[1] = 0.5;
          array[2] = ray.p1.y;
          array[3] = ray.p2.x;
          array[4] = 0.5;
          array[5] = ray.p2.y;

          posAttr.needsUpdate = true;
          const d = ray.p2.offset || 1.0;
          const isNear = d < 0.28;
          line.material.color.setHex(isNear ? 0xef4444 : 0x22c55e);
        }
      });
    }

    if (leader) {
      const cam = state.camera;
      const targetPos = new THREE.Vector3();
      const idealLook = new THREE.Vector3();

      if (cameraMode === 'follow') {
        const distance = 95 * zoom;
        const height = 45 * zoom;
        const lookAheadDistance = 50;
        const cosAngle = Math.cos(leader.angle);
        const sinAngle = Math.sin(leader.angle);

        targetPos.set(leader.x - cosAngle * distance, height, leader.y - sinAngle * distance);
        idealLook.set(leader.x + cosAngle * lookAheadDistance, 2.0, leader.y + sinAngle * lookAheadDistance);
      } else {
        const height = 420 * zoom;
        targetPos.set(leader.x, height, leader.y + 0.1);
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
      <group ref={leaderRef}>
        {/* Main Body */}
        <mesh castShadow receiveShadow position={[0, 2.0, 0]}>
          <boxGeometry args={[24, 3, 11]} />
          <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.6} />
        </mesh>
        
        {/* Cabin */}
        <mesh position={[-2, 4.0, 0]}>
          <boxGeometry args={[10, 2.5, 9]} />
          <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
        </mesh>
        
        {/* Spoiler */}
        <mesh position={[-11, 4.0, 0]}>
          <boxGeometry args={[2, 0.5, 10]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[-11, 3.0, -3]}>
          <boxGeometry args={[1, 2, 0.5]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[-11, 3.0, 3]}>
          <boxGeometry args={[1, 2, 0.5]} />
          <meshStandardMaterial color="#111111" />
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
        
        {/* Taillights */}
        <mesh position={[-12, 2.2, 4]}>
          <boxGeometry args={[0.5, 1, 2.2]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[-12, 2.2, -4]}>
          <boxGeometry args={[0.5, 1, 2.2]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        
        {isNight && (
          <group position={[12.1, 2.2, 0]}>
            <spotLight color="#fffee0" intensity={4.5} distance={220} angle={Math.PI / 5} penumbra={0.3} castShadow />
          </group>
        )}
        
        {isNight && (
          <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[9, 11, 16]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        )}

        {/* Wheels */}
        {[
          [7, 1.5, 6.2],
          [7, 1.5, -6.2],
          [-7, 1.5, 6.2],
          [-7, 1.5, -6.2]
        ].map((pos, i) => (
          <group key={i} ref={(el) => (wheelsRef.current[i] = el)} position={pos} rotation={[Math.PI / 2, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[2.5, 2.5, 2.5, 16]} />
              <meshStandardMaterial color="#111111" roughness={0.9} />
            </mesh>
            <mesh position={[0, pos[2] > 0 ? 1.26 : -1.26, 0]}>
              <cylinderGeometry args={[1.5, 1.5, 0.1, 6]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        ))}
      </group>

      <instancedMesh ref={followerRef} args={[null, null, 100]} castShadow>
        <boxGeometry args={[24, 4.5, 12]} />
        <meshStandardMaterial color="#0ea5e9" transparent opacity={0.4} roughness={0.3} metalness={0.5} />
      </instancedMesh>

      <group ref={lidarRef}>
        {Array.from({ length: 5 }).map((_, idx) => (
          <line key={idx}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[new Float32Array(6), 3]} />
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
      case 'day': return { sunPosition: [100, 50, 100], turbidity: 2, rayleigh: 0.5 };
      case 'sunset': return { sunPosition: [100, 5, -100], turbidity: 10, rayleigh: 2 };
      default: return { sunPosition: [0, -100, 0], turbidity: 0, rayleigh: 0 };
    }
  };

  const getFogConfig = () => {
    switch (timeOfDay) {
      case 'day': return { color: '#87ceeb', density: 0.0006 };
      case 'sunset': return { color: '#fdba74', density: 0.0008 };
      default: return { color: '#070709', density: 0.0015 };
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
      <ambientLight intensity={isNight ? 0.05 : isSunset ? 0.25 : 0.65} />
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
        <SkyAndFog timeOfDay={timeOfDay} />
        <Lighting timeOfDay={timeOfDay} />
        <Ground timeOfDay={timeOfDay} />

        {track && (
          <group>
            <RoadSurface track={track} />
            <RoadCurbs track={track} />
            <RoadMarkings track={track} />
            <Crosswalks track={track} />
            <TrafficLights3D track={track} />
            <StreetLights track={track} timeOfDay={timeOfDay} />
          </group>
        )}

        <CityBuildings buildings={buildings} timeOfDay={timeOfDay} />
        <TrafficCones3D obstacles={obstacles} />

        <CarsController
          stateRef={stateRef}
          timeOfDay={timeOfDay}
          cameraMode={cameraMode}
          zoom={zoom}
        />

        <RainSystem hasRain={hasRain} />
      </Canvas>
    </div>
  );
}
