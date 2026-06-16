import { useState } from 'react';
import { Database, Save, Download, Trash2, Cpu, ArrowRight, Info } from 'lucide-react';

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
          className="absolute top-full mt-1.5 left-1/2 w-64 rounded-lg bg-zinc-900 border border-zinc-700 p-2.5 text-[11px] normal-case font-normal text-zinc-200 shadow-2xl z-[999] pointer-events-none leading-relaxed"
          style={{ transform: 'translateX(-50%)', minWidth: '16rem', whiteSpace: 'normal' }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

export default function BrainMemoryPage({
  hasSavedBrain,
  savedBrainFitness,
  savedBrainGen,
  onSaveBrain,
  onLoadBrain,
  onClearBrain,
  stateRef,
}) {
  const currentLeader = stateRef?.current?.cars?.filter(c => c.alive).sort((a, b) => b.fitness - a.fitness)[0] 
    || stateRef?.current?.cars?.[0];

  const currentLeaderFitness = currentLeader ? Math.round(currentLeader.fitness) : 0;
  const currentGen = stateRef?.current?.generationCount || 1;

  return (
    <div className="animation-fade-in space-y-6 max-w-4xl mx-auto">
      
      {/* Header card */}
      <div className="bg-[#0b0b0d] border border-zinc-900 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" /> Neural Brain Memory Store
          <Tooltip text="Export and import your agent's neural network as a .json file. You can share this file, back it up, or reload it any time to resume evolution from where you left off." />
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left card: Current active session champion */}
        <div className="bg-[#0b0b0d] border border-zinc-900 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-amber-500" /> Active Session Leader
              </h3>
              <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                Live State
              </span>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-900/50 p-4 rounded-lg space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">CURRENT GENERATION:</span>
                <span className="text-white font-bold">GEN #{currentGen}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">LEADER FIT SCORE:</span>
                <span className="text-amber-500 font-bold">{currentLeaderFitness.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed pt-2 border-t border-zinc-900/55">
                Click "Export to File" to download the current champion brain as a .json file you can save anywhere and share with others.
              </p>
            </div>
          </div>

          <button
            onClick={onSaveBrain}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors mt-4"
          >
            <Save className="w-4 h-4" /> Export to File
          </button>
        </div>

        {/* Right card: Saved model memory status */}
        <div className="bg-[#0b0b0d] border border-zinc-900 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-400" /> Saved Brain Memory
              </h3>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${hasSavedBrain ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-850'}`} />
                <span className="text-[9px] font-mono text-zinc-500 uppercase">
                  {hasSavedBrain ? 'Model Loaded' : 'Memory Empty'}
                </span>
              </div>
            </div>

            {hasSavedBrain ? (
              <div className="bg-zinc-900/30 border border-emerald-950/20 p-4 rounded-lg space-y-3 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">TRAINED GENERATION:</span>
                  <span className="text-white font-bold">GEN #{savedBrainGen}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">SAVED FIT SCORE:</span>
                  <span className="text-emerald-400 font-bold">{savedBrainFitness.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed pt-2 border-t border-zinc-900/55">
                   Loaded from file. Click "Inject to Simulation" to apply this brain — the population will be seeded with mutated copies of this champion.
                </p>
              </div>
            ) : (
              <div className="bg-zinc-900/10 border border-zinc-900/50 p-4 rounded-lg flex flex-col items-center justify-center text-center h-[96px] text-[11px] text-zinc-500 leading-relaxed font-mono">
                No saved brain detected. Save the current leader or let the algorithm auto-save when a new generation record is reached.
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={onLoadBrain}
              disabled={!hasSavedBrain}
              className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all ${
                hasSavedBrain
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-zinc-900/30 border-zinc-900/50 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <Download className="w-4 h-4" /> Import from File
            </button>
            
            <button
              onClick={onClearBrain}
              disabled={!hasSavedBrain}
              className={`py-3 px-4 rounded-lg border transition-all ${
                hasSavedBrain
                  ? 'bg-red-950/20 border-red-900/30 text-red-400 hover:bg-red-950/40'
                  : 'bg-zinc-900/30 border-zinc-900/50 text-zinc-600 cursor-not-allowed'
              }`}
              title="Wipe saved brain"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Helpful info section */}
      <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-5 font-mono text-[11px] text-zinc-400 space-y-2">
        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1">
          <ArrowRight className="w-3 h-3 text-amber-500" /> How Genetic Resume Works
        </div>
        <ul className="list-disc pl-4 space-y-1.5 text-zinc-400 leading-relaxed">
          <li><strong>Export to File:</strong> Downloads a .json file containing the champion's neural weights. Save it anywhere — your desktop, cloud, USB — or share it.</li>
          <li><strong>Import from File:</strong> Opens your file picker. Select any previously exported .json brain. The simulation will immediately seed the population from it.</li>
          <li><strong>Accelerated Progress:</strong> Loading a trained brain skips the early random phase — the cars start knowing how to drive and focus on improving advanced behaviour.</li>
        </ul>
      </div>

    </div>
  );
}
