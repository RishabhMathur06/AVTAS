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
      <Info className="w-4 h-4 text-slate-400 hover:text-cyan-500 transition-colors" />
      {visible && (
        <span 
          className="absolute top-full mt-1.5 left-1/2 w-64 rounded-lg bg-white border border-slate-200 p-2.5 text-[11px] normal-case font-normal text-slate-700 shadow-xl z-[999] pointer-events-none leading-relaxed"
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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Database className="w-5 h-5 text-pink-500" /> Neural Brain Memory Store
          <Tooltip text="Export and import your agent's neural network as a .json file. You can share this file, back it up, or reload it any time to resume evolution from where you left off." />
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left card: Current active session champion */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-500" /> Active Session Leader
              </h3>
              <span className="text-[10px] font-mono bg-slate-50 border border-slate-200 text-slate-500 px-2 py-0.5 rounded">
                Live State
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">CURRENT GENERATION:</span>
                <span className="text-slate-800 font-bold">GEN #{currentGen}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">LEADER FIT SCORE:</span>
                <span className="text-cyan-600 font-bold">{currentLeaderFitness.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
                Click "Export to File" to download the current champion brain as a .json file you can save anywhere and share with others.
              </p>
            </div>
          </div>

          <button
            onClick={onSaveBrain}
            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors mt-4 shadow-md"
          >
            <Save className="w-4 h-4" /> Export to File
          </button>
        </div>

        {/* Right card: Saved model memory status */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4 text-pink-500" /> Saved Brain Memory
              </h3>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${hasSavedBrain ? 'bg-pink-500 animate-pulse' : 'bg-slate-300'}`} />
                <span className="text-[9px] font-mono text-slate-500 uppercase">
                  {hasSavedBrain ? 'Model Loaded' : 'Memory Empty'}
                </span>
              </div>
            </div>

            {hasSavedBrain ? (
              <div className="bg-slate-50 border border-pink-200 p-4 rounded-lg space-y-3 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">TRAINED GENERATION:</span>
                  <span className="text-slate-800 font-bold">GEN #{savedBrainGen}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SAVED FIT SCORE:</span>
                  <span className="text-pink-600 font-bold">{savedBrainFitness.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
                   Loaded from file. Click "Import from File" to apply this brain — the population will be seeded with mutated copies of this champion.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-lg flex flex-col items-center justify-center text-center h-[96px] text-[11px] text-slate-400 leading-relaxed font-mono">
                No saved brain detected. Save the current leader or let the algorithm auto-save when a new generation record is reached.
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={onLoadBrain}
              className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all ${
                hasSavedBrain
                  ? 'bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-100'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-cyan-500 shadow-sm'
              }`}
            >
              <Download className="w-4 h-4" /> Import from File
            </button>
            
            <button
              onClick={onClearBrain}
              disabled={!hasSavedBrain}
              className={`py-3 px-4 rounded-lg border transition-all ${
                hasSavedBrain
                  ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                  : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              title="Wipe saved brain"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Helpful info section */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 font-mono text-[11px] text-slate-500 space-y-2">
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
          <ArrowRight className="w-3 h-3 text-cyan-500" /> How Genetic Resume Works
        </div>
        <ul className="list-disc pl-4 space-y-1.5 text-slate-500 leading-relaxed">
          <li><strong>Export to File:</strong> Downloads a .json file containing the champion's neural weights. Save it anywhere — your desktop, cloud, USB — or share it.</li>
          <li><strong>Import from File:</strong> Opens your file picker. Select any previously exported .json brain. The simulation will immediately seed the population from it.</li>
          <li><strong>Accelerated Progress:</strong> Loading a trained brain skips the early random phase — the cars start knowing how to drive and focus on improving advanced behaviour.</li>
        </ul>
      </div>

    </div>
  );
}
