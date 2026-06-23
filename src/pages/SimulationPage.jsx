/**
 * SimulationPage.jsx
 * The main split dashboard panel containing the Drone View (3D Scene)
 * and the Evolved Synaptic Brain Map (NeuralTopology).
 */
import { useRef, useState, useEffect } from 'react';
import { 
  Eye, Navigation, Sliders, Pause, Play, 
  RefreshCw, Camera, Activity, Database, Map
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
  const [leftWidth, setLeftWidth] = useState(65); // percentage (65% left, 35% right)
  const [isDragging, setIsDragging] = useState(false);
  const [cameraMode, setCameraMode] = useState('follow'); // 'follow' or 'topdown'
  const [controlsExpanded, setControlsExpanded] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

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
      // Constraint to prevent collapsing columns (min 35%, max 75%)
      if (newWidth >= 35 && newWidth <= 75) {
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
        className={`flex border border-slate-200 rounded-2xl overflow-hidden bg-white/60 shadow-xl shadow-slate-200/50 backdrop-blur-md relative h-[calc(100vh-140px)] min-h-[600px] ${isDragging ? 'cursor-col-resize select-none' : ''}`}
      >
        {/* ── LEFT COLUMN: Simulation Arena ────────────────────── */}
        <div 
          style={{ width: `${leftWidth}%` }} 
          className="p-5 flex flex-col gap-4 border-r border-slate-200/60"
        >
          <div className="bg-white/90 border border-slate-200 rounded-2xl flex flex-col justify-between flex-1 overflow-hidden shadow-sm">
            {/* Canvas + HUD overlays */}
            <div className="relative bg-slate-50 flex-1 flex items-center justify-center min-h-[520px]">
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
                  className="p-2.5 bg-white/95 border border-slate-200 rounded-xl hover:border-cyan-400/50 text-slate-500 hover:text-cyan-600 transition-all shadow-lg flex items-center gap-2 backdrop-blur-md font-mono text-[10px] uppercase font-bold tracking-wider"
                >
                  <Sliders className={`w-4 h-4 transition-transform duration-300 ${controlsExpanded ? 'rotate-90 text-cyan-500' : ''}`} />
                  <span>Simulation Controls</span>
                </button>

                {controlsExpanded && (
                  <div className="bg-white/95 border border-slate-200 rounded-xl p-4 w-52 shadow-xl backdrop-blur-md space-y-4 font-mono text-[10px] animate-fade-in text-left">
                    {/* Camera Selector */}
                    <div className="space-y-2">
                      <div className="text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-cyan-500" /> Camera Mode
                      </div>
                      <div className="grid grid-cols-2 bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-[10px]">
                        <button
                          onClick={() => setCameraMode('follow')}
                          className={`py-1.5 rounded transition-all font-bold ${
                            cameraMode === 'follow' 
                              ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-white font-extrabold shadow-sm' 
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          CHASE
                        </button>
                        <button
                          onClick={() => setCameraMode('topdown')}
                          className={`py-1.5 rounded transition-all font-bold ${
                            cameraMode === 'topdown' 
                              ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-white font-extrabold shadow-sm' 
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          TOP
                        </button>
                      </div>
                    </div>

                    {/* Speed Selector */}
                    <div className="space-y-2 border-t border-slate-200/60 pt-3">
                      <div className="text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 text-pink-500" /> Warp Speed
                      </div>
                      <div className="grid grid-cols-3 bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-[10px] text-center font-bold">
                        {[1, 2, 4].map(v => (
                          <button
                            key={v}
                            onClick={() => setSimSpeed(v)}
                            className={`py-1.5 rounded transition-all ${
                              simSpeed === v 
                                ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white font-extrabold shadow-sm' 
                                : 'text-slate-500 hover:text-slate-800'
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
                <Minimap2D stateRef={stateRef} size={130} onClick={() => setIsMapModalOpen(true)} />
              </div>



              {/* Steering output overlay — bottom right */}
              <div className="absolute bottom-4 right-4 bg-white/95 border border-slate-200 rounded-lg p-3 font-mono text-[10px] text-slate-500 space-y-1.5 z-10 shadow-xl backdrop-blur-md w-36">
                <div className="flex items-center gap-1 text-cyan-600 font-bold mb-1 uppercase tracking-wider text-[9px] border-b border-slate-200 pb-1">
                  <Sliders className="w-3 h-3" /> Steering Outputs
                </div>
                <div className="flex justify-between items-center text-[9px] mt-2 mb-0.5">
                  <span>STEER ACTION:</span>
                  <span className="text-slate-800 font-bold">
                    {leaderTelemetry.lastOutputs[0] > 0.1 ? 'RIGHT' : leaderTelemetry.lastOutputs[0] < -0.1 ? 'LEFT' : 'STG'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-cyan-500 h-1 transition-all"
                    style={{ width: `${(Math.abs(leaderTelemetry.lastOutputs[0]) * 100).toFixed(0)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] mt-2 mb-0.5">
                  <span>THROTTLE:</span>
                  <span className="text-slate-800 font-bold">{Math.round(leaderTelemetry.lastOutputs[1] * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-pink-400 to-pink-500 h-1 transition-all"
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
              className="px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              {isPlaying
                ? <><Pause className="w-4 h-4 text-pink-500" /> Pause Simulation</>
                : <><Play  className="w-4 h-4 text-cyan-500" /> Resume Simulation</>
              }
            </button>
            <button
              onClick={onRegenerateCity}
              className="px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-slate-400 group-hover:text-cyan-500" /> Remap City Grid
            </button>
          </div>
        </div>

        {/* ── DRAGGABLE DIVIDER RESIZER ────────────────────── */}
        <div 
          onMouseDown={handleMouseDown}
          className={`w-1.5 hover:bg-cyan-400/30 cursor-col-resize transition-all duration-150 relative flex items-center justify-center border-l border-r border-slate-200 bg-white ${isDragging ? 'bg-cyan-400/40' : ''}`}
        >
          <div className="flex flex-col gap-1 pointer-events-none opacity-50">
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <div className="w-1 h-1 rounded-full bg-slate-300" />
          </div>
        </div>

        {/* ── RIGHT COLUMN: Topology & Stats HUD ────────────────────── */}
        <div 
          style={{ width: `${100 - leftWidth}%` }} 
          className="p-4 flex flex-col gap-6 bg-slate-50 overflow-y-auto"
        >
          <div className="flex flex-col gap-2 relative z-30">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">Synaptic Map</h3>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-none min-h-[220px]">
              <NeuralTopology leaderTelemetry={leaderTelemetry} />
            </div>
          </div>

          <div className="flex flex-col gap-2 relative z-20">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">Failure Arc</h3>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-none min-h-[220px]">
              <AnalyticsPage history={history} />
            </div>
          </div>

          <div className="flex flex-col gap-2 relative z-10">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">Brain Store</h3>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-none min-h-[220px]">
              <BrainMemoryPage
                hasSavedBrain={hasSavedBrain}
                savedBrainFitness={savedBrainFitness}
                savedBrainGen={savedBrainGen}
                onSaveBrain={onSaveBrain}
                onLoadBrain={onLoadBrain}
                onClearBrain={onClearBrain}
                stateRef={stateRef}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Map Modal */}
      {isMapModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animation-fade-in cursor-pointer"
          onClick={() => setIsMapModalOpen(false)}
        >
          <div className="bg-white border border-slate-200 p-4 rounded-[2rem] shadow-[0_20px_50px_rgba(6,182,212,0.15)] relative overflow-hidden group" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-xl transition-colors z-10 hover:scale-110 shadow-sm"
              onClick={() => setIsMapModalOpen(false)}
            >
              ✕
            </button>
            <h2 className="absolute top-6 left-6 text-xl font-black text-slate-800 z-10 uppercase tracking-widest flex items-center gap-2 drop-shadow-sm">
              <Map className="w-5 h-5 text-pink-500" /> City Map
            </h2>
            <div className="rounded-3xl overflow-hidden border border-slate-200 mt-14 shadow-inner">
              <Minimap2D stateRef={stateRef} size={600} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
