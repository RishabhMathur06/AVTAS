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
      <Info className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-500 transition-colors" />
      {visible && (
        <span 
          className="absolute top-full mt-1.5 left-1/2 w-56 rounded-lg bg-white border border-slate-200 p-2.5 text-[11px] normal-case font-normal text-slate-700 shadow-xl z-[999] pointer-events-none leading-relaxed"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-xl relative overflow-visible">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Welcome to AVTAS</h2>
            <p className="text-sm text-slate-500">Configure the simulation inputs before starting. This removes left-hand clutter and enlarges the arena.</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {simMode === 'training' ? (
            <>
              <div className="space-y-2">
                <label className="text-xs text-slate-500 uppercase font-mono flex items-center">
                  Population Size
                  <Tooltip text="How many cars train at the same time. More cars find paths faster but can slow down your computer." />
                </label>
                <input type="range" min="10" max="60" step="5" value={populationSize} onChange={(e) => setPopulationSize(Number(e.target.value))} className="w-full accent-cyan-500" />
                <div className="text-sm text-slate-600">{populationSize} cars</div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-500 uppercase font-mono flex items-center">
                  Mutation Rate
                  <Tooltip text="How much random behavior to allow. Higher means more random testing; lower means they stick closely to what they already learned." />
                </label>
                <input type="range" min="0.01" max="0.25" step="0.01" value={mutationRate} onChange={(e) => setMutationRate(Number(e.target.value))} className="w-full accent-cyan-500" />
                <div className="text-sm text-slate-600">{Math.round(mutationRate * 100)}%</div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-500 uppercase font-mono flex items-center">
                  Elite Survival
                  <Tooltip text="The percentage of best-performing cars kept to pass their brains on to the next generation." />
                </label>
                <input type="range" min="0.1" max="0.5" step="0.05" value={selectionRatio} onChange={(e) => setSelectionRatio(Number(e.target.value))} className="w-full accent-cyan-500" />
                <div className="text-sm text-slate-600">{Math.round(selectionRatio * 100)}%</div>
              </div>
            </>
          ) : (
            !isSessionLoaded && (
              <div className="col-span-2 space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="text-xs text-slate-500 uppercase font-mono flex items-center mb-2">
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
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-cyan-100 file:text-cyan-700 hover:file:bg-cyan-200 transition-colors"
                />
                {uploadedBrain && (
                  <div className="mt-2 text-sm text-green-500 font-medium">
                    ✓ Brain loaded successfully! (Fitness: {uploadedBrain.fitness})
                  </div>
                )}
              </div>
            )
          )}

          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase font-mono flex items-center">
              Time of Day
              <Tooltip text="Changes the visual theme and lighting of the city track (Day, Sunset, or Cyber Night)." />
            </label>
            <select value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} className="bg-white border border-slate-200 rounded p-2 w-full text-sm text-slate-700 focus:outline-none focus:border-cyan-500">
              <option value="day">Day</option>
              <option value="sunset">Sunset</option>
              <option value="cyber-night">Cyber Night</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase font-mono flex items-center">
              Weather / Obstacles
              <Tooltip text="Rain makes the road slippery (harder to drive). Cones add obstacles that the cars must dodge." />
            </label>
            <div className="flex gap-2">
              <button onClick={() => setHasRain(!hasRain)} className={`py-2 px-3 rounded text-sm transition-all shadow-sm ${hasRain ? 'bg-cyan-50 text-cyan-600 border border-cyan-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                Rain
              </button>
              <button onClick={() => setHasObstacles(!hasObstacles)} className={`py-2 px-3 rounded text-sm transition-all shadow-sm ${hasObstacles ? 'bg-pink-50 text-pink-600 border border-pink-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                Cones
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase font-mono flex items-center">
              Simulation Speed
              <Tooltip text="Speeds up the simulation time (1x, 2x, 4x) so the cars can learn much faster." />
            </label>
            <div className="flex gap-2">
              {[1,2,4].map(v => (
                <button key={v} onClick={() => setSimSpeed(v)} className={`py-2 px-3 rounded text-sm font-bold shadow-sm transition-all ${simSpeed === v ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-white border-transparent' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>{v}x</button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase font-mono flex items-center">
              Viewport Zoom
              <Tooltip text="Zooms the camera closer to the cars or further out to see more of the track." />
            </label>
            <input type="range" min="0.8" max="1.4" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-cyan-500" />
            <div className="text-sm text-slate-600">{(zoom * 100).toFixed(0)}%</div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase font-mono flex items-center">
              Camera Mode
              <Tooltip text="Switch between Chase Cam (behind the car) and Top-down View." />
            </label>
            <div className="flex gap-2">
              <button onClick={() => setCameraMode('follow')} className={`py-2 px-3 rounded text-sm font-bold shadow-sm transition-all ${cameraMode === 'follow' ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-white border-transparent' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>Chase</button>
              <button onClick={() => setCameraMode('topdown')} className={`py-2 px-3 rounded text-sm font-bold shadow-sm transition-all ${cameraMode === 'topdown' ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-white border-transparent' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>Top-down</button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-slate-200">
          <button onClick={onCancel} className="py-2 px-4 rounded bg-white border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
          <button 
            onClick={handleStart} 
            disabled={isStartDisabled}
            className={`py-2 px-4 rounded font-bold flex items-center gap-2 text-sm transition-colors shadow-md ${isStartDisabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-white'}`}
          >
            <Play className="w-4 h-4" /> Start Simulation
          </button>
        </div>
      </div>
    </div>
  );
}
