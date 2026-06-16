import { useEffect, useRef } from 'react';

export default function Minimap2D({ stateRef }) {
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

      const mmSize = 130;
      const scale = mmSize / 2400; // Map size is 2400

      // Clear
      ctx.clearRect(0, 0, mmSize, mmSize);

      // Background (Dark semitransparent)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(0, 0, mmSize, mmSize, 8);
      ctx.fill();
      ctx.stroke();

      // Draw road checkpoints line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 4;
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
      cars.forEach((car) => {
        if (!car.alive) return;
        ctx.fillStyle = car === leader ? '#fbbf24' : '#0ea5e9';
        ctx.beginPath();
        ctx.arc(car.x * scale, car.y * scale, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [stateRef]);

  return (
    <canvas
      ref={canvasRef}
      width={130}
      height={130}
      className="border border-zinc-800 rounded-lg shadow-2xl backdrop-blur-md"
      style={{ width: '130px', height: '130px', display: 'block' }}
    />
  );
}
