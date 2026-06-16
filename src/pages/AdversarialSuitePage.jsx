import React, { useState } from 'react';
import { 
  Camera, Sliders, Play, Pause, RefreshCw, 
  CloudRain, Sun, TriangleAlert, Zap
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

  return (
    <div className="animation-fade-in flex flex-col h-[calc(100vh-140px)] w-full relative border border-red-500/30 rounded-2xl overflow-hidden bg-black/40 backdrop-blur-md shadow-[0_0_40px_rgba(239,68,68,0.05)]">
      
      {/* 3D Scene Background */}
      <div className="absolute inset-0 z-0">
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
          className={`py-2 px-4 rounded-lg font-bold flex justify-center items-center gap-2 transition-all shadow-2xl backdrop-blur-md text-xs tracking-wider ${
            !hasSavedBrain 
              ? 'bg-zinc-900/50 text-zinc-600 border border-zinc-800/50 cursor-not-allowed' 
              : isPlaying 
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
          }`}
          title={!hasSavedBrain ? "Upload a Brain first to Play" : ""}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? 'PAUSE' : 'PLAY'}
        </button>
        <button
          onClick={onRegenerateCity}
          className="py-2 px-4 bg-zinc-950/90 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-300 transition-colors font-bold flex justify-center items-center gap-2 shadow-2xl backdrop-blur-md text-xs tracking-wider"
        >
          <RefreshCw className="w-4 h-4" /> REMAP
        </button>
      </div>

      {/* Top Right: Minimap */}
      <div className="absolute top-4 right-4 z-10 shadow-2xl border border-zinc-800/50 rounded-xl overflow-hidden">
        <Minimap2D stateRef={stateRef} />
      </div>

      {/* Bottom Center: Telemetry HUD */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-8 backdrop-blur-md shadow-2xl">
          <div className="text-center">
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Test Run</div>
            <div className="text-lg font-black text-white">#{generation}</div>
          </div>
          <div className="w-px h-10 bg-zinc-800"></div>
          <div className="text-center">
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Score</div>
            <div className="text-lg font-black text-amber-500">{bestFitness.toLocaleString()}</div>
          </div>
          <div className="w-px h-10 bg-zinc-800"></div>
          <div className="text-center min-w-[80px]">
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Steering</div>
            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden mt-2 relative flex items-center">
              <div className="absolute left-1/2 w-0.5 h-full bg-zinc-700 z-10 -translate-x-1/2"></div>
              {/* Steer Bar */}
              <div 
                className="h-full bg-amber-500 absolute"
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
      
    </div>
  );
}
