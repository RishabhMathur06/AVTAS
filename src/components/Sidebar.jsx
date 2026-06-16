/**
 * Sidebar.jsx
 * Left control panel: branding, live stats, climate settings, and genetic sliders.
 */
import { Navigation, Sun, Sparkles, Moon, CloudRain, AlertTriangle, Sliders, Lock } from 'lucide-react';

export default function Sidebar({
  generation, aliveCount, populationSize,
  bestFitness,
  timeOfDay, setTimeOfDay,
  hasRain, setHasRain,
  hasObstacles, setHasObstacles,
  mutationRate, setMutationRate,
  selectionRatio, setSelectionRatio,
  setPopulationSize,
}) {
  return (
    <div className="w-80 bg-zinc-950 border-r border-zinc-900 h-screen flex flex-col fixed left-0 top-0 overflow-y-auto">
      <div className="p-6 flex-1 space-y-8">

        {/* Branding */}
        <div className="flex items-center gap-2.5 text-amber-500">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold font-mono">Autonomous Lab</span>
            <h1 className="text-base font-black tracking-wider text-white">
              AVTAS <span className="text-amber-500">Simulation</span>
            </h1>
          </div>
        </div>

        {/* Live stats HUD */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4 space-y-3 font-mono">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-500">EPISODE</span>
            <span className="text-white font-bold">GEN #{generation}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-500">SURVIVORS</span>
            <span className="text-emerald-400 font-bold">{aliveCount} / {populationSize}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-500">BEST SCORE</span>
            <span className="text-amber-500 font-bold">{bestFitness.toLocaleString()}</span>
          </div>
        </div>

        {/* Climate sandbox (LOCKED) */}
        <div className="space-y-4 opacity-50 select-none">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-between border-b border-zinc-900 pb-2">
            <span className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-zinc-600" /> Climate Sandbox</span>
            <span className="flex items-center gap-1 text-[9px] text-zinc-600 font-mono"><Lock className="w-2.5 h-2.5" /> LOCKED</span>
          </h3>

          {/* Lighting selector */}
          <div className="space-y-2 pointer-events-none">
            <label className="text-[11px] text-zinc-600 font-bold uppercase flex justify-between">
              <span>Lighting Engine</span>
              <span className="text-[9px] text-amber-500/80">SANDBOX MODE</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 border border-zinc-900 rounded-lg">
              {[
                { id: 'day',        label: 'Day',        icon: Sun      },
                { id: 'sunset',     label: 'Sunset',     icon: Sparkles },
                { id: 'cyber-night',label: 'Cyber Night',icon: Moon     },
              ].map(item => (
                <button
                  disabled
                  key={item.id}
                  className={`py-1.5 rounded-md text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                    timeOfDay === item.id
                      ? 'bg-zinc-800 text-amber-500 border border-zinc-700/60'
                      : 'text-zinc-500'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Physics modifiers */}
          <div className="space-y-2.5 pointer-events-none">
            <label className="text-[11px] text-zinc-600 font-bold uppercase">Physics Modifiers</label>

            <button
              disabled
              className={`w-full py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-between cursor-not-allowed ${
                hasRain
                  ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-500'
              }`}
            >
              <span className="flex items-center gap-2"><CloudRain className="w-4 h-4" /> Toggle Wet Rain</span>
              <span className="text-[9px] font-mono">{hasRain ? 'FRICTION: HIGH' : 'OFF'}</span>
            </button>

            <button
              disabled
              className={`w-full py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-between cursor-not-allowed ${
                hasObstacles
                  ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-500'
              }`}
            >
              <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Road Hazards (Cones)</span>
              <span className="text-[9px] font-mono">{hasObstacles ? 'ACTIVE' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Genetic tuning (LOCKED) */}
        <div className="space-y-4 opacity-50 select-none">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-between border-b border-zinc-900 pb-2">
            <span className="flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5 text-zinc-600" /> Genetic Tuning</span>
            <span className="flex items-center gap-1 text-[9px] text-zinc-600 font-mono"><Lock className="w-2.5 h-2.5" /> LOCKED</span>
          </h3>

          <div className="space-y-4 pointer-events-none">
            {/* Mutation rate */}
            <div>
              <div className="flex justify-between text-[11px] text-zinc-600 font-bold uppercase mb-1">
                <span>Mutation Probability</span>
                <span className="text-amber-500 font-mono">{(mutationRate * 100).toFixed(0)}%</span>
              </div>
              <input type="range" disabled
                value={mutationRate}
                className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-not-allowed"
              />
            </div>

            {/* Selection ratio */}
            <div>
              <div className="flex justify-between text-[11px] text-zinc-600 font-bold uppercase mb-1">
                <span>Elite Survival Limit</span>
                <span className="text-amber-500 font-mono">{(selectionRatio * 100).toFixed(0)}%</span>
              </div>
              <input type="range" disabled
                value={selectionRatio}
                className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-not-allowed"
              />
            </div>

            {/* Population size */}
            <div>
              <div className="flex justify-between text-[11px] text-zinc-600 font-bold uppercase mb-1">
                <span>Agent Limit</span>
                <span className="text-amber-500 font-mono">{populationSize} Cars</span>
              </div>
              <input type="range" disabled
                value={populationSize}
                className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-not-allowed"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="p-6 border-t border-zinc-900 bg-zinc-950/40 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-400">Physics Core Active</span>
        </div>
        <p className="text-[10px] text-zinc-500">Autonomous Neural Evolution Simulator v1.0.0</p>
      </div>
    </div>
  );
}
