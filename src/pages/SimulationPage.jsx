/**
 * SimulationPage.jsx
 * The main split dashboard panel containing the Drone View (3D Scene)
 * and the Evolved Synaptic Brain Map (NeuralTopology).
 */
import { useRef, useState, useEffect } from 'react';
import { 
  Eye, Navigation, Sliders, Pause, Play, 
  RefreshCw, Camera, Activity, Database
} from 'lucide-react';
import NeuralTopology from '../components/NeuralTopology.jsx';
import Scene3D from '../components/Scene3D.jsx';
import Minimap2D from '../components/Minimap2D.jsx';

import AnalyticsPage from './AnalyticsPage.jsx';
import BrainMemoryPage from './BrainMemoryPage.jsx';

export default function SimulationPage({
  canvasRef,
  isPlaying, setIsPlaying,
  simSpeed, setSimSpeed,
  timeOfDay,
  hasRain,
  leaderTelemetry,
  onRegenerateCity,
  stateRef,
  generation,
  aliveCount,
  bestFitness,
  zoom,
  setZoom,
  compact,
  // Tab nested view props
  history,
  hasSavedBrain,
  savedBrainFitness,
  savedBrainGen,
  onSaveBrain,
  onLoadBrain,
  onClearBrain,
}) {
  const containerRef = useRef(null);
  const [leftWidth, setLeftWidth] = useState(50); // percentage (50% left, 50% right)
  const [isDragging, setIsDragging] = useState(false);
  const [cameraMode, setCameraMode] = useState('follow'); // 'follow' or 'topdown'
  const [rightTab, setRightTab] = useState('topology'); // 'topology' | 'analytics' | 'memory'
  const [controlsExpanded, setControlsExpanded] = useState(false);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      // Constraint to prevent collapsing columns (min 35%, max 65%)
      if (newWidth >= 35 && newWidth <= 65) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="animation-fade-in space-y-6">
      
      {/* Draggable Resizable split layout container */}
      <div 
        ref={containerRef} 
        className={`flex border border-zinc-900 rounded-2xl overflow-hidden bg-black/30 backdrop-blur-sm relative ${isDragging ? 'cursor-col-resize select-none' : ''}`}
      >
        {/* ── LEFT COLUMN: Simulation Arena ────────────────────── */}
        <div 
          style={{ width: `${leftWidth}%` }} 
          className="p-5 flex flex-col gap-4 border-r border-zinc-900/60"
        >
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl flex flex-col justify-between flex-1 overflow-hidden">
            {/* Canvas + HUD overlays (Expanded size now that header is removed) */}
            <div className="relative bg-[#0b0b0d] flex-1 flex items-center justify-center min-h-[520px]">
              <div className="w-full h-full flex-1 relative min-h-[520px]">
                <Scene3D
                  stateRef={stateRef}
                  timeOfDay={timeOfDay}
                  hasRain={hasRain}
                  zoom={zoom}
                  cameraMode={cameraMode}
                />
              </div>

              {/* Simulation Controls Overlay — Expandable Button (Top Left) */}
              <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-2">
                <button
                  onClick={() => setControlsExpanded(!controlsExpanded)}
                  className="p-2.5 bg-zinc-950/95 border border-zinc-900 rounded-xl hover:border-amber-500/50 text-zinc-300 hover:text-amber-500 transition-all shadow-2xl flex items-center gap-2 backdrop-blur-md font-mono text-[10px] uppercase font-bold tracking-wider"
                >
                  <Sliders className={`w-4 h-4 transition-transform duration-300 ${controlsExpanded ? 'rotate-90 text-amber-500' : ''}`} />
                  <span>Simulation Controls</span>
                </button>

                {controlsExpanded && (
                  <div className="bg-zinc-950/95 border border-zinc-900 rounded-xl p-4 w-52 shadow-2xl backdrop-blur-md space-y-4 font-mono text-[10px] animate-fade-in text-left">
                    {/* Camera Selector */}
                    <div className="space-y-2">
                      <div className="text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-amber-500" /> Camera Mode
                      </div>
                      <div className="grid grid-cols-2 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-[10px]">
                        <button
                          onClick={() => setCameraMode('follow')}
                          className={`py-1.5 rounded transition-all font-bold ${
                            cameraMode === 'follow' 
                              ? 'bg-amber-500 text-zinc-950 font-extrabold shadow-sm' 
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          CHASE
                        </button>
                        <button
                          onClick={() => setCameraMode('topdown')}
                          className={`py-1.5 rounded transition-all font-bold ${
                            cameraMode === 'topdown' 
                              ? 'bg-amber-500 text-zinc-950 font-extrabold shadow-sm' 
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          TOP
                        </button>
                      </div>
                    </div>

                    {/* Speed Selector */}
                    <div className="space-y-2 border-t border-zinc-900/60 pt-3">
                      <div className="text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 text-amber-500" /> Warp Speed
                      </div>
                      <div className="grid grid-cols-3 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-[10px] text-center font-bold">
                        {[1, 2, 4].map(v => (
                          <button
                            key={v}
                            onClick={() => setSimSpeed(v)}
                            className={`py-1.5 rounded transition-all ${
                              simSpeed === v 
                                ? 'bg-amber-500 text-zinc-950 font-extrabold shadow-sm' 
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {v}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Minimap overlay — top right */}
              <div className="absolute top-4 right-4 z-10 shadow-2xl">
                <Minimap2D stateRef={stateRef} />
              </div>



              {/* Steering output overlay — bottom right */}
              <div className="absolute bottom-4 right-4 bg-zinc-950/95 border border-zinc-900 rounded-lg p-3 font-mono text-[10px] text-zinc-400 space-y-1.5 z-10 shadow-2xl backdrop-blur-md w-36">
                <div className="flex items-center gap-1 text-amber-500 font-bold mb-1 uppercase tracking-wider text-[9px] border-b border-zinc-900 pb-1">
                  <Sliders className="w-3 h-3" /> Steering Outputs
                </div>
                <div className="flex justify-between items-center text-[9px] mt-2 mb-0.5">
                  <span>STEER ACTION:</span>
                  <span className="text-white font-bold">
                    {leaderTelemetry.lastOutputs[0] > 0.1 ? 'RIGHT' : leaderTelemetry.lastOutputs[0] < -0.1 ? 'LEFT' : 'STG'}
                  </span>
                </div>
                <div className="w-full bg-zinc-900 h-1 rounded overflow-hidden">
                  <div
                    className="bg-amber-500 h-1 transition-all"
                    style={{ width: `${(Math.abs(leaderTelemetry.lastOutputs[0]) * 100).toFixed(0)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] mt-2 mb-0.5">
                  <span>THROTTLE:</span>
                  <span className="text-white font-bold">{Math.round(leaderTelemetry.lastOutputs[1] * 100)}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1 rounded overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1 transition-all"
                    style={{ width: `${(Math.max(0, leaderTelemetry.lastOutputs[1]) * 100).toFixed(0)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick controls bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 text-zinc-200 transition-colors"
            >
              {isPlaying
                ? <><Pause className="w-4 h-4 text-red-500" /> Pause Simulation</>
                : <><Play  className="w-4 h-4 text-emerald-500" /> Resume Simulation</>
              }
            </button>
            <button
              onClick={onRegenerateCity}
              className="px-4 py-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 text-zinc-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-zinc-500" /> Remap City Grid
            </button>
          </div>
        </div>

        {/* ── DRAGGABLE DIVIDER RESIZER ────────────────────── */}
        <div 
          onMouseDown={handleMouseDown}
          className={`w-1.5 hover:bg-amber-500/70 cursor-col-resize transition-all duration-150 relative flex items-center justify-center border-l border-r border-zinc-900/40 bg-zinc-950 ${isDragging ? 'bg-amber-500/80' : ''}`}
        >
          <div className="flex flex-col gap-1 pointer-events-none opacity-50">
            <div className="w-1 h-1 rounded-full bg-zinc-400" />
            <div className="w-1 h-1 rounded-full bg-zinc-400" />
            <div className="w-1 h-1 rounded-full bg-zinc-400" />
          </div>
        </div>

        {/* ── RIGHT COLUMN: Topology & Stats HUD ────────────────────── */}
        <div 
          style={{ width: `${100 - leftWidth}%` }} 
          className="p-4 flex flex-col gap-3 bg-zinc-950/20"
        >
          {/* Compact stats HUD */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 font-mono text-[12px] text-zinc-300">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Episode</div>
                <div className="text-sm font-extrabold text-white mt-1">GEN #{generation}</div>
              </div>
              <div className="border-l border-r border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Survivors</div>
                <div className="text-sm font-extrabold text-emerald-400 mt-1">{aliveCount} / {stateRef.current.cars.length}</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Best Score</div>
                <div className="text-sm font-extrabold text-amber-500 mt-1">{bestFitness.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Synaptic map or pages */}
          <div className="flex bg-zinc-900/50 border border-zinc-850 rounded-xl p-1 font-mono text-xs select-none gap-1 shrink-0">
            <button
              onClick={() => setRightTab('topology')}
              className={`flex-1 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-[11px] font-bold ${
                rightTab === 'topology' 
                  ? 'bg-amber-500 text-zinc-950 font-extrabold shadow-md' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Synaptic Map</span>
            </button>
            <button
              onClick={() => setRightTab('analytics')}
              className={`flex-1 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-[11px] font-bold ${
                rightTab === 'analytics' 
                  ? 'bg-amber-500 text-zinc-950 font-extrabold shadow-md' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Failure Arc</span>
            </button>
            <button
              onClick={() => setRightTab('memory')}
              className={`flex-1 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-[11px] font-bold ${
                rightTab === 'memory' 
                  ? 'bg-amber-500 text-zinc-950 font-extrabold shadow-md' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Brain Store</span>
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-y-auto min-h-0">
            {rightTab === 'topology' && <NeuralTopology leaderTelemetry={leaderTelemetry} />}
            {rightTab === 'analytics' && <AnalyticsPage history={history} />}
            {rightTab === 'memory' && (
              <BrainMemoryPage
                hasSavedBrain={hasSavedBrain}
                savedBrainFitness={savedBrainFitness}
                savedBrainGen={savedBrainGen}
                onSaveBrain={onSaveBrain}
                onLoadBrain={onLoadBrain}
                onClearBrain={onClearBrain}
                stateRef={stateRef}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
