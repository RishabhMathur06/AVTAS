import { useState } from 'react';
import { Play, X, Info } from 'lucide-react';

function Tooltip({ text }) {
  const [visible, setVisible] = useState(false);
  return (
    <span 
      className="relative inline-block ml-1.5 align-middle cursor-help"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <Info className="w-3.5 h-3.5 text-zinc-500 hover:text-amber-500 transition-colors" />
      {visible && (
        <span 
          className="absolute top-full mt-1.5 left-1/2 w-56 rounded-lg bg-zinc-900 border border-zinc-700 p-2.5 text-[11px] normal-case font-normal text-zinc-200 shadow-2xl z-[999] pointer-events-none leading-relaxed"
          style={{ transform: 'translateX(-50%)', minWidth: '14rem', whiteSpace: 'normal' }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

export default function StartConfigModal({ simMode = 'training', isSessionLoaded = false, initial = {}, onCancel = () => {}, onStart = () => {} }) {
  const [populationSize, setPopulationSize] = useState(initial.populationSize || 20);
  const [mutationRate, setMutationRate] = useState(initial.mutationRate || 0.08);
  const [selectionRatio, setSelectionRatio] = useState(initial.selectionRatio || 0.25);
  const [timeOfDay, setTimeOfDay] = useState(initial.timeOfDay || 'day');
  const [hasRain, setHasRain] = useState(!!initial.hasRain);
  const [hasObstacles, setHasObstacles] = useState(!!initial.hasObstacles);
  const [simSpeed, setSimSpeed] = useState(initial.simSpeed || 1);
  const [zoom, setZoom] = useState(initial.zoom || 1);
  const [cameraMode, setCameraMode] = useState(initial.cameraMode || 'follow');
  
  const [uploadedBrain, setUploadedBrain] = useState(null);

  const handleStart = () => {
    onStart({
      populationSize: simMode === 'adversarial' ? 1 : populationSize,
      mutationRate: simMode === 'adversarial' ? 0 : mutationRate,
      selectionRatio,
      timeOfDay,
      hasRain,
      hasObstacles,
      simSpeed,
      zoom,
      cameraMode,
      uploadedBrain
    });
  };

  const isStartDisabled = simMode === 'adversarial' && !isSessionLoaded && !uploadedBrain;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-900 rounded-xl p-6 shadow-2xl relative overflow-visible">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Welcome to AVTAS</h2>
            <p className="text-sm text-zinc-400">Configure the simulation inputs before starting. This removes left-hand clutter and enlarges the arena.</p>
          </div>
          <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-200"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {simMode === 'training' ? (
            <>
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 uppercase font-mono flex items-center">
                  Population Size
                  <Tooltip text="How many cars train at the same time. More cars find paths faster but can slow down your computer." />
                </label>
                <input type="range" min="10" max="60" step="5" value={populationSize} onChange={(e) => setPopulationSize(Number(e.target.value))} className="w-full accent-amber-500" />
                <div className="text-sm text-zinc-300">{populationSize} cars</div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-400 uppercase font-mono flex items-center">
                  Mutation Rate
                  <Tooltip text="How much random behavior to allow. Higher means more random testing; lower means they stick closely to what they already learned." />
                </label>
                <input type="range" min="0.01" max="0.25" step="0.01" value={mutationRate} onChange={(e) => setMutationRate(Number(e.target.value))} className="w-full accent-amber-500" />
                <div className="text-sm text-zinc-300">{Math.round(mutationRate * 100)}%</div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-400 uppercase font-mono flex items-center">
                  Elite Survival
                  <Tooltip text="The percentage of best-performing cars kept to pass their brains on to the next generation." />
                </label>
                <input type="range" min="0.1" max="0.5" step="0.05" value={selectionRatio} onChange={(e) => setSelectionRatio(Number(e.target.value))} className="w-full accent-amber-500" />
                <div className="text-sm text-zinc-300">{Math.round(selectionRatio * 100)}%</div>
              </div>
            </>
          ) : (
            !isSessionLoaded && (
              <div className="col-span-2 space-y-2 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                <label className="text-xs text-zinc-400 uppercase font-mono flex items-center mb-2">
                  Upload Perfect Brain
                  <Tooltip text="Select the pre-trained neural network JSON file to evaluate." />
                </label>
                <input 
                  type="file" 
                  accept=".json,application/json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const payload = JSON.parse(ev.target.result);
                        if (!payload.network) throw new Error('Invalid file');
                        setUploadedBrain(payload);
                      } catch(err) {
                        alert("Invalid brain file");
                      }
                    };
                    reader.readAsText(file);
                  }}
                  className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-amber-500 file:text-black hover:file:bg-amber-400 transition-colors"
                />
                {uploadedBrain && (
                  <div className="mt-2 text-sm text-green-400 font-medium">
                    ✓ Brain loaded successfully! (Fitness: {uploadedBrain.fitness})
                  </div>
                )}
              </div>
            )
          )}

          <div className="space-y-2">
            <label className="text-xs text-zinc-400 uppercase font-mono flex items-center">
              Time of Day
              <Tooltip text="Changes the visual theme and lighting of the city track (Day, Sunset, or Cyber Night)." />
            </label>
            <select value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded p-2 w-full text-sm text-zinc-200 focus:outline-none focus:border-amber-500">
              <option value="day">Day</option>
              <option value="sunset">Sunset</option>
              <option value="cyber-night">Cyber Night</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400 uppercase font-mono flex items-center">
              Weather / Obstacles
              <Tooltip text="Rain makes the road slippery (harder to drive). Cones add obstacles that the cars must dodge." />
            </label>
            <div className="flex gap-2">
              <button onClick={() => setHasRain(!hasRain)} className={`py-2 px-3 rounded text-sm transition-all ${hasRain ? 'bg-sky-500/10 text-sky-300 border border-sky-700' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-850'}`}>
                Rain
              </button>
              <button onClick={() => setHasObstacles(!hasObstacles)} className={`py-2 px-3 rounded text-sm transition-all ${hasObstacles ? 'bg-orange-500/10 text-orange-300 border border-orange-700' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-850'}`}>
                Cones
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400 uppercase font-mono flex items-center">
              Simulation Speed
              <Tooltip text="Speeds up the simulation time (1x, 2x, 4x) so the cars can learn much faster." />
            </label>
            <div className="flex gap-2">
              {[1,2,4].map(v => (
                <button key={v} onClick={() => setSimSpeed(v)} className={`py-2 px-3 rounded text-sm font-semibold transition-all ${simSpeed === v ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-850'}`}>{v}x</button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400 uppercase font-mono flex items-center">
              Viewport Zoom
              <Tooltip text="Zooms the camera closer to the cars or further out to see more of the track." />
            </label>
            <input type="range" min="0.8" max="1.4" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-amber-500" />
            <div className="text-sm text-zinc-300">{(zoom * 100).toFixed(0)}%</div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400 uppercase font-mono flex items-center">
              Camera Mode
              <Tooltip text="Switch between Chase Cam (behind the car) and Top-down View." />
            </label>
            <div className="flex gap-2">
              <button onClick={() => setCameraMode('follow')} className={`py-2 px-3 rounded text-sm font-semibold transition-all ${cameraMode === 'follow' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-850'}`}>Chase</button>
              <button onClick={() => setCameraMode('topdown')} className={`py-2 px-3 rounded text-sm font-semibold transition-all ${cameraMode === 'topdown' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-850'}`}>Top-down</button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-zinc-900">
          <button onClick={onCancel} className="py-2 px-4 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm hover:bg-zinc-850 transition-colors">Cancel</button>
          <button 
            onClick={handleStart} 
            disabled={isStartDisabled}
            className={`py-2 px-4 rounded font-bold flex items-center gap-2 text-sm transition-colors ${isStartDisabled ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-amber-500 text-black hover:bg-amber-400'}`}
          >
            <Play className="w-4 h-4" /> Start Simulation
          </button>
        </div>
      </div>
    </div>
  );
}
