import { useState } from 'react';
import { Cpu, Info } from 'lucide-react';

function Tooltip({ text }) {
  const [visible, setVisible] = useState(false);
  return (
    <span 
      className="relative inline-block ml-1.5 align-middle cursor-help"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <Info className="w-4 h-4 text-zinc-500 hover:text-amber-500 transition-colors" />
      {visible && (
        <span 
          className="absolute top-full left-1/2 mt-1.5 w-64 rounded-lg bg-zinc-900 border border-zinc-800 p-2.5 text-[11px] normal-case font-normal text-zinc-200 shadow-2xl z-50 pointer-events-none leading-relaxed"
          style={{ transform: 'translateX(-50%)' }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

export default function NeuralTopology({ leaderTelemetry }) {
  if (!leaderTelemetry || !leaderTelemetry.network) {
    return (
      <div className="animation-fade-in bg-zinc-950 border border-zinc-900 rounded-xl p-12 flex flex-col items-center justify-center text-zinc-500 text-sm">
        <Cpu className="w-8 h-8 text-amber-500 mb-3 animate-pulse" />
        <p className="font-semibold text-zinc-300">Waiting for first generation…</p>
        <p className="text-xs mt-1 text-zinc-600">Neural topology will appear once a car is alive.</p>
      </div>
    );
  }

  const net = leaderTelemetry.network;
  const { sensors, speed, lastOutputs, hiddenActivations } = leaderTelemetry;

  const inputLabels = ['LIDAR L', 'LIDAR FL', 'LIDAR F', 'LIDAR FR', 'LIDAR R', 'Velocity'];
  const outputLabels = ['Steer Left/Right', 'Throttle'];

  // Column positions inside the 650x360 SVG
  const colX = {
    input: 110,
    hidden: 325,
    output: 540,
  };

  // Compute node coordinates dynamically
  const inputY = Array.from({ length: 6 }, (_, i) => 40 + i * 56);
  const hiddenY = Array.from({ length: 6 }, (_, i) => 40 + i * 56);
  const outputY = [112, 248]; // Centered outputs

  // Input neuron values
  const inputVals = Array.from({ length: 6 }, (_, idx) => {
    return idx < 5
      ? (sensors && sensors[idx] !== undefined ? sensors[idx] : 1.0)
      : (speed !== undefined ? speed / 5.5 : 0.0);
  });

  return (
    <div className="animation-fade-in bg-zinc-950 border border-zinc-900 rounded-xl p-4 shadow-xl relative">
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute left-0 bottom-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2 select-none">
            <Cpu className="text-amber-500 w-4.5 h-4.5 animate-pulse" /> Evolved Synaptic Brain Map
            <Tooltip text="Interactive, live-updating synaptic model of the current generation's best driver. Watch how proximity data maps through hidden nodes to command steering and throttle." />
          </h3>
        </div>
      </div>

      <div className="relative bg-black/40 border border-zinc-900 rounded-lg overflow-hidden p-2">
        <svg
          viewBox="0 0 650 360"
          className="w-full h-auto max-h-[520px]"
        >
          {/* Cyber filters for glowing nodes/synapses */}
          <defs>
            <filter id="glow-synapse" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-node" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. LAYER: Synaptic lines from Inputs to Hidden Layer */}
          {net.weights0.map((row, i) => {
            const yStart = inputY[i];
            return row.map((weight, j) => {
              const yEnd = hiddenY[j];
              const strokeColor = weight > 0 ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.45)';
              const strokeWidth = Math.max(0.5, Math.abs(weight) * 3);
              const activeVal = inputVals[i];
              // Highlight active synapses
              const opacity = 0.1 + Math.abs(weight) * 0.5 * (activeVal + 0.1);

              return (
                <line
                  key={`syn0-${i}-${j}`}
                  x1={colX.input}
                  y1={yStart}
                  x2={colX.hidden}
                  y2={yEnd}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  style={{ opacity }}
                  filter={Math.abs(weight) > 0.7 ? "url(#glow-synapse)" : undefined}
                />
              );
            });
          })}

          {/* 2. LAYER: Synaptic lines from Hidden Layer to Outputs */}
          {net.weights1.map((row, j) => {
            const yStart = hiddenY[j];
            return row.map((weight, k) => {
              const yEnd = outputY[k];
              const strokeColor = weight > 0 ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.45)';
              const strokeWidth = Math.max(0.5, Math.abs(weight) * 3);
              const activeVal = Math.abs(hiddenActivations[j] || 0);
              const opacity = 0.1 + Math.abs(weight) * 0.5 * (activeVal + 0.1);

              return (
                <line
                  key={`syn1-${j}-${k}`}
                  x1={colX.hidden}
                  y1={yStart}
                  x2={colX.output}
                  y2={yEnd}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  style={{ opacity }}
                  filter={Math.abs(weight) > 0.7 ? "url(#glow-synapse)" : undefined}
                />
              );
            });
          })}

          {/* 3. LAYER: Input Nodes and Labels */}
          {inputLabels.map((label, idx) => {
            const val = inputVals[idx];
            // Render LIDAR inputs showing obstacle closeness (closer = brighter/warmer)
            // Velocity shows speed directly
            let hue = 38; // Amber for base/velocity
            let saturation = 85;
            let lightness = 25 + val * 45;

            if (idx < 5) {
              // LIDAR: 0 means wall (extremely close), 1 means clear.
              // Let's color-code so wall proximity glows red
              const closeness = 1 - val;
              hue = closeness > 0.7 ? 0 : closeness > 0.4 ? 38 : 142; // Red -> Amber -> Emerald
              saturation = closeness > 0.1 ? 85 : 40;
              lightness = 20 + closeness * 50;
            }

            const fillVal = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

            return (
              <g key={`in-node-${idx}`} className="group cursor-help">
                <text
                  x={colX.input - 20}
                  y={inputY[idx] + 4}
                  textAnchor="end"
                  className="fill-zinc-400 font-mono text-[9px] font-bold uppercase tracking-wider select-none transition-colors group-hover:fill-white"
                >
                  {label}
                </text>
                <circle
                  cx={colX.input}
                  cy={inputY[idx]}
                  r={9}
                  fill={fillVal}
                  stroke="#18181b"
                  strokeWidth={1.5}
                  filter={val > 0.6 || (idx < 5 && val < 0.4) ? "url(#glow-node)" : undefined}
                  className="transition-all duration-150 group-hover:r-11"
                />
                {/* Micro numerical readout */}
                <text
                  x={colX.input + 18}
                  y={inputY[idx] + 3}
                  className="fill-zinc-500 font-mono text-[8px] font-bold select-none group-hover:fill-zinc-300"
                >
                  {val.toFixed(2)}
                </text>
                <title>{`${label}: ${val.toFixed(3)}`}</title>
              </g>
            );
          })}

          {/* 4. LAYER: Hidden Nodes */}
          {Array.from({ length: 6 }).map((_, idx) => {
            const val = hiddenActivations[idx] || 0;
            const absoluteVal = Math.abs(val);
            // Green for positive activation, red for negative activation
            const hue = val > 0 ? 142 : 0;
            const fillVal = `hsl(${hue}, 80%, ${20 + absoluteVal * 50}%)`;

            return (
              <g key={`h-node-${idx}`} className="group cursor-help">
                <circle
                  cx={colX.hidden}
                  cy={hiddenY[idx]}
                  r={9}
                  fill={fillVal}
                  stroke="#18181b"
                  strokeWidth={1.5}
                  filter={absoluteVal > 0.5 ? "url(#glow-node)" : undefined}
                  className="transition-all duration-150 group-hover:r-11"
                />
                {/* Show values inside title */}
                <title>{`Hidden Node ${idx + 1}: ${val.toFixed(3)}`}</title>
                {/* Micro numerical value */}
                <text
                  x={colX.hidden + (idx % 2 === 0 ? 14 : -34)}
                  y={hiddenY[idx] + 3}
                  className="fill-zinc-500 font-mono text-[8px] font-bold select-none group-hover:fill-zinc-300"
                >
                  {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* 5. LAYER: Output Nodes and Labels */}
          {outputLabels.map((label, idx) => {
            const val = lastOutputs[idx] || 0;
            const absoluteVal = Math.abs(val);
            // Color outputs: positive green, negative red (neutral dark)
            const hue = val > 0.05 ? 142 : val < -0.05 ? 0 : 200;
            const saturation = absoluteVal > 0.05 ? 80 : 20;
            const fillVal = `hsl(${hue}, ${saturation}%, ${20 + absoluteVal * 55}%)`;

            return (
              <g key={`out-node-${idx}`} className="group cursor-help">
                <text
                  x={colX.output + 20}
                  y={outputY[idx] + 4}
                  textAnchor="start"
                  className="fill-zinc-400 font-mono text-[9px] font-bold uppercase tracking-wider select-none transition-colors group-hover:fill-white"
                >
                  {label}
                </text>
                <circle
                  cx={colX.output}
                  cy={outputY[idx]}
                  r={9}
                  fill={fillVal}
                  stroke="#18181b"
                  strokeWidth={1.5}
                  filter={absoluteVal > 0.3 ? "url(#glow-node)" : undefined}
                  className="transition-all duration-150 group-hover:r-11"
                />
                {/* Micro numerical value */}
                <text
                  x={colX.output - 36}
                  y={outputY[idx] + 3}
                  className="fill-zinc-500 font-mono text-[8px] font-bold select-none group-hover:fill-zinc-300"
                >
                  {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                </text>
                <title>{`${label} command: ${val.toFixed(3)}`}</title>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
