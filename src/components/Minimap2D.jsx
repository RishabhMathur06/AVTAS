import { useEffect, useRef } from 'react';

export default function Minimap2D({ stateRef, size = 130, onClick }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = () => {
      const state = stateRef.current;
      if (!state || !state.track) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const scale = size / 2400; // Map size is 2400

      // Clear
      ctx.clearRect(0, 0, size, size);

      // Background (Dark semitransparent)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, 8);
      ctx.fill();
      ctx.stroke();

      // Draw Roads
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      if (state.track.roadRects) {
        state.track.roadRects.forEach(r => {
           ctx.fillRect((r.x - r.w/2) * scale, (r.y - r.h/2) * scale, r.w * scale, r.h * scale);
        });
      }
      if (state.track.intersectionRects) {
        state.track.intersectionRects.forEach(r => {
           ctx.fillRect((r.x - r.size/2) * scale, (r.y - r.size/2) * scale, r.size * scale, r.size * scale);
        });
      }

      // Draw active checkpoints (optional, maybe keep it light)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      state.track.checkpoints.forEach((wp, idx) => {
        const mx = wp.x * scale;
        const my = wp.y * scale;
        if (idx === 0) ctx.moveTo(mx, my);
        else ctx.lineTo(mx, my);
      });
      ctx.stroke();

      // Get active cars and identify leader
      const cars = state.cars || [];
      const sortedActive = cars
        .filter((c) => c.alive)
        .sort((a, b) => b.fitness - a.fitness);
      const leader = sortedActive[0] || cars[0];

      // Draw car dots
      const dotSize = size > 300 ? 5 : 2.5;
      cars.forEach((car) => {
        if (!car.alive) return;
        ctx.fillStyle = car === leader ? '#fbbf24' : '#0ea5e9';
        ctx.beginPath();
        ctx.arc(car.x * scale, car.y * scale, dotSize, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [stateRef, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      onClick={onClick}
      className={`border border-zinc-800 rounded-lg shadow-2xl backdrop-blur-md ${onClick ? 'cursor-pointer hover:border-zinc-600 transition-colors' : ''}`}
      style={{ width: `${size}px`, height: `${size}px`, display: 'block' }}
    />
  );
}
