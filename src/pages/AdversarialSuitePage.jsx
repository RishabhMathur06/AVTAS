import React, { useState } from 'react';
import { 
  Camera, Sliders, Play, Pause, RefreshCw, 
  CloudRain, Sun, TriangleAlert, Zap, Map
} from 'lucide-react';
import Scene3D from '../components/Scene3D.jsx';
import Minimap2D from '../components/Minimap2D.jsx';

export default function AdversarialSuitePage({
  stateRef,
  isPlaying, setIsPlaying,
  simSpeed, setSimSpeed,
  timeOfDay, setTimeOfDay,
  hasRain, setHasRain,
  hasObstacles, setHasObstacles,
  cameraMode,
  zoom,
  onRegenerateCity,
  leaderTelemetry,
  generation,
  bestFitness,
  aliveCount,
  hasSavedBrain
}) {
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  return (
    <div className="animation-fade-in flex flex-col h-[calc(100vh-140px)] w-full relative border border-pink-500/30 rounded-2xl overflow-hidden bg-white/60 backdrop-blur-md shadow-xl shadow-pink-500/10">
      
      {/* 3D Scene Background */}
      <div className="absolute inset-0 z-0 bg-slate-50">
        <Scene3D
          stateRef={stateRef}
          timeOfDay={timeOfDay}
          hasRain={hasRain}
          zoom={zoom}
          cameraMode={cameraMode}
        />
      </div>

      {/* ── OVERLAYS ── */}
      
      {/* Top Left: Quick Actions (Play/Pause, Remap) */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          disabled={!hasSavedBrain}
          onClick={() => setIsPlaying(!isPlaying)}
          className={`py-2 px-4 rounded-lg font-bold flex justify-center items-center gap-2 transition-all shadow-xl backdrop-blur-md text-xs tracking-wider ${
            !hasSavedBrain 
              ? 'bg-slate-100/50 text-slate-400 border border-slate-200 cursor-not-allowed' 
              : isPlaying 
                ? 'bg-pink-100 text-pink-600 border border-pink-200 hover:bg-pink-200' 
                : 'bg-cyan-100 text-cyan-600 border border-cyan-200 hover:bg-cyan-200'
          }`}
          title={!hasSavedBrain ? "Upload a Brain first to Play" : ""}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? 'PAUSE' : 'PLAY'}
        </button>
        <button
          onClick={onRegenerateCity}
          className="py-2 px-4 bg-white/90 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-800 transition-colors font-bold flex justify-center items-center gap-2 shadow-xl backdrop-blur-md text-xs tracking-wider"
        >
          <RefreshCw className="w-4 h-4 text-slate-400" /> REMAP
        </button>
      </div>

      {/* Top Right: Minimap */}
      <div className="absolute top-4 right-4 z-10 shadow-xl border border-slate-200 rounded-xl overflow-hidden">
        <Minimap2D stateRef={stateRef} size={130} onClick={() => setIsMapModalOpen(true)} />
      </div>

      {/* Bottom Center: Telemetry HUD */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-white/95 border border-slate-200 rounded-2xl p-4 flex items-center gap-8 backdrop-blur-md shadow-xl">
          <div className="text-center">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Test Run</div>
            <div className="text-lg font-black text-slate-800">#{generation}</div>
          </div>
          <div className="w-px h-10 bg-slate-200"></div>
          <div className="text-center">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Score</div>
            <div className="text-lg font-black text-pink-500">{bestFitness.toLocaleString()}</div>
          </div>
          <div className="w-px h-10 bg-slate-200"></div>
          <div className="text-center min-w-[80px]">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Steering</div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2 relative flex items-center shadow-inner">
              <div className="absolute left-1/2 w-0.5 h-full bg-slate-300 z-10 -translate-x-1/2"></div>
              {/* Steer Bar */}
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 absolute"
                style={{ 
                  left: leaderTelemetry.lastOutputs[0] < 0 ? `${50 + leaderTelemetry.lastOutputs[0] * 50}%` : '50%',
                  width: `${Math.abs(leaderTelemetry.lastOutputs[0]) * 50}%`,
                  transition: 'all 0.1s'
                }}
              ></div>
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
            <h2 className="absolute top-6 left-6 text-xl font-black text-slate-800 z-10 uppercase tracking-widest drop-shadow-sm flex items-center gap-2">
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
