/**
 * App.jsx
 * AVTAS — root orchestrator.
 *
 * Responsibilities:
 *   - Holds all simulation state (React + mutable ref)
 *   - Runs the requestAnimationFrame game loop
 *   - Drives the genetic evolution cycle
 *   - Delegates rendering to utility modules
 *   - Composes the UI from focused child components
 *   - File-based brain save/load (JSON download / file picker)
 */
import { useState, useEffect, useRef } from 'react';
import { Menu, X, Settings, LayoutGrid, Database, Edit2 } from 'lucide-react';

import Sidebar         from './components/Sidebar.jsx';
import StartConfigModal from './components/StartConfigModal.jsx';
import ProjectSidebar   from './components/ProjectSidebar.jsx';

import LandingPage      from './pages/LandingPage.jsx';
import SimulationPage   from './pages/SimulationPage.jsx';
import AdversarialSuitePage from './pages/AdversarialSuitePage.jsx';

import { buildSprawlingCityMap, buildObstacles } from './utils/cityMap.js';
import { spawnCar, updateCarPhysics }            from './utils/physics.js';
import { cloneNetwork, crossoverNetworks,
         mutateNetwork }                          from './utils/neural.js';


// ─────────────────────────────────────────────────────────────────────────────
// Default leader telemetry (prevents null access on first render)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_TELEMETRY = {
  speed: 0,
  gForce: 0,
  sensors: [1, 1, 1, 1, 1],
  lastOutputs: [0, 0],
  hiddenActivations: [0, 0, 0, 0, 0, 0],
  network: null,
};

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  // ── UI / navigation state ──────────────────────────────────────────────────

  // ── Evolutionary parameters ────────────────────────────────────────────────
  const [isPlaying,      setIsPlaying]      = useState(false);
  const [simSpeed,       setSimSpeed]       = useState(1);
  const [zoom,           setZoom]           = useState(1);
  const [generation,     setGeneration]     = useState(1);
  const [populationSize, setPopulationSize] = useState(20);
  const [mutationRate,   setMutationRate]   = useState(0.08);
  const [mutationPower]                     = useState(0.25);
  const [selectionRatio, setSelectionRatio] = useState(0.25);
  const [cameraMode, setCameraMode]         = useState('follow');

  // ── Environment ────────────────────────────────────────────────────────────
  const [timeOfDay,    setTimeOfDay]    = useState('day');
  const [hasRain,      setHasRain]      = useState(false);
  const [hasObstacles, setHasObstacles] = useState(true);
  const [friction,     setFriction]     = useState(0.05);

  // ── Gameplay ───────────────────────────────────────────────────────────────
  const [bestFitness,     setBestFitness]     = useState(0);
  const [aliveCount,      setAliveCount]      = useState(0);
  const [history,         setHistory]         = useState([]);
  const [leaderTelemetry, setLeaderTelemetry] = useState(DEFAULT_TELEMETRY);

  // ── Startup / sidebar flow ─────────────────────────────────────────────────
  const [showLanding,      setShowLanding]      = useState(true);
  const [showStartupModal, setShowStartupModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSidebar,      setShowSidebar]      = useState(false);
  const [showProjectSidebar, setShowProjectSidebar] = useState(false);
  
  // ── Mode / Project state ───────────────────────────────────────────────────
  const [currentProject,   setCurrentProject]   = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentSessionName, setCurrentSessionName] = useState('');
  const [simMode,          setSimMode]          = useState('training');

  // ── Saved brain state (file-based; no localStorage) ────────────────────────
  const [hasSavedBrain,    setHasSavedBrain]    = useState(false);
  const [savedBrainFitness, setSavedBrainFitness] = useState(0);
  const [savedBrainGen,    setSavedBrainGen]    = useState(0);
  // The actual saved network weights live here (in-memory only)
  const savedBrainRef = useRef(null);

  // ── DOM / animation refs ───────────────────────────────────────────────────
  const canvasRef  = useRef(null);
  const requestRef = useRef(null);

  /** Mutable simulation state — never triggers re-renders */
  const stateRef = useRef({
    cars:            [],
    track:           null,
    generationCount: 1,
    bestEverNetwork: null,
    bestEverFitness: 0,
    historyData:     [],
    obstacles:       [],
    cityAssets:      { buildings: [], gardens: [], crosswalks: [] },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Full city reset
  // ─────────────────────────────────────────────────────────────────────────
  const handleRegenerateCity = () => {
    const track = buildSprawlingCityMap();
    stateRef.current.track = track;

    const cones = hasObstacles ? buildObstacles(track) : [];
    stateRef.current.obstacles = cones;

    stateRef.current.cityAssets = {
      buildings:  track.buildings,
      gardens:    track.gardens,
      crosswalks: track.crosswalks,
    };

    const f = hasRain ? 0.08 : 0.04;
    setFriction(f);

    stateRef.current.cars        = Array.from({ length: populationSize }, () => spawnCar(track, f));
    stateRef.current.generationCount = 1;
    stateRef.current.bestEverFitness = 0;
    stateRef.current.bestEverNetwork = null;
    stateRef.current.historyData     = [];

    setGeneration(1);
    setBestFitness(0);
    setHistory([]);
  };

  // Initial city build
  useEffect(() => { handleRegenerateCity(); }, [populationSize]); // eslint-disable-line

  // Friction update when rain toggles
  useEffect(() => {
    const f = hasRain ? 0.08 : 0.04;
    setFriction(f);
    stateRef.current.cars.forEach(c => { c.friction = f; });
  }, [hasRain]);

  // ─────────────────────────────────────────────────────────────────────────
  // Genetic evolution cycle (called when all cars are dead)
  // ─────────────────────────────────────────────────────────────────────────
  const handleEvolutionCycle = () => {
    const { cars, historyData } = stateRef.current;
    cars.sort((a, b) => b.fitness - a.fitness);

    const genBest = cars[0].fitness;
    const genAvg  = cars.reduce((s, c) => s + c.fitness, 0) / cars.length;

    if (genBest > stateRef.current.bestEverFitness) {
      stateRef.current.bestEverFitness = genBest;
      stateRef.current.bestEverNetwork = cloneNetwork(cars[0].brain);
    }

    setBestFitness(Math.round(stateRef.current.bestEverFitness));

    const nextHist = [
      ...historyData,
      {
        generation:     stateRef.current.generationCount,
        topFitness:     Math.round(genBest),
        averageFitness: Math.round(genAvg),
      },
    ].slice(-30);
    stateRef.current.historyData = nextHist;
    setHistory(nextHist);

    // Bypass evolution in adversarial mode
    if (simMode === 'adversarial') {
      const bestNet = stateRef.current.bestEverNetwork || stateRef.current.cars[0]?.brain;
      const nextBrains = Array(populationSize).fill(null).map(() => cloneNetwork(bestNet));
      stateRef.current.cars = nextBrains.map(b =>
        spawnCar(stateRef.current.track, stateRef.current.cars[0]?.friction ?? friction, b)
      );
      stateRef.current.generationCount += 1;
      setGeneration(stateRef.current.generationCount);
      return;
    }

    // Select elites & breed next generation
    const eliteCount   = Math.max(2, Math.floor(cars.length * selectionRatio));
    const eliteParents = cars.slice(0, eliteCount).map(c => c.brain);

    const nextBrains = [cloneNetwork(eliteParents[0])];
    while (nextBrains.length < populationSize) {
      const pa    = eliteParents[Math.floor(Math.random() * eliteParents.length)];
      const pb    = eliteParents[Math.floor(Math.random() * eliteParents.length)];
      let child   = crossoverNetworks(pa, pb);
      child       = mutateNetwork(child, mutationRate, mutationPower);
      nextBrains.push(child);
    }

    stateRef.current.cars = nextBrains.map(b =>
      spawnCar(stateRef.current.track, stateRef.current.cars[0]?.friction ?? friction, b)
    );
    stateRef.current.generationCount += 1;
    setGeneration(stateRef.current.generationCount);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Main animation loop
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = () => {
      const state = stateRef.current;
      if (!state.track) {
        requestRef.current = requestAnimationFrame(loop);
        return;
      }

      if (isPlaying) {
        for (let s = 0; s < simSpeed; s++) {
          let allDead = true;

          state.cars.forEach((car) => {
            if (car.alive) {
              updateCarPhysics(car, true, null, state.track, state.obstacles);
              allDead = false;
            }
          });

          if (allDead) {
            handleEvolutionCycle();
            break;
          }
        }
      }

      // Identify leader (best alive car)
      const alive  = state.cars.filter(c => c.alive).sort((a, b) => b.fitness - a.fitness);
      const leader = alive[0] || state.cars[0];

      if (leader) {
        setAliveCount(alive.length);
        setLeaderTelemetry({
          speed:             leader.speed,
          gForce:            Math.abs(leader.speed * 0.15),
          sensors:           leader.sensors,
          lastOutputs:       leader.lastOutputs || [0, 0],
          hiddenActivations: leader.hiddenActivations || [0, 0, 0, 0, 0, 0],
          network:           leader.brain,
        });
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, simSpeed]); // eslint-disable-line

  // ─────────────────────────────────────────────────────────────────────────
  // Brain save/load — FILE BASED (no localStorage)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Download the current leader's brain as a .json file.
   * The user can choose where to save it via the browser's native save dialog.
   */
  const handleSaveCurrentChampion = () => {
    const network = stateRef.current.bestEverNetwork || stateRef.current.cars?.[0]?.brain;
    if (!network) return;

    const fitness = Math.round(stateRef.current.bestEverFitness || stateRef.current.cars?.[0]?.fitness || 0);
    const gen     = stateRef.current.generationCount;

    const payload = {
      version:   '1.0',
      savedAt:   new Date().toISOString(),
      generation: gen,
      fitness,
      network,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);

    // Use showSaveFilePicker if available (Chromium), otherwise fallback to <a> download
    if (window.showSaveFilePicker) {
      window.showSaveFilePicker({
        suggestedName: `avtas-brain-gen${gen}-fit${fitness}.json`,
        types: [{ description: 'AVTAS Brain File', accept: { 'application/json': ['.json'] } }],
      }).then(async (fileHandle) => {
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        URL.revokeObjectURL(url);
        // Update in-memory saved state
        savedBrainRef.current = cloneNetwork(network);
        setSavedBrainFitness(fitness);
        setSavedBrainGen(gen);
        setHasSavedBrain(true);
      }).catch(() => {
        // User cancelled — just clean up
        URL.revokeObjectURL(url);
      });
    } else {
      // Fallback: trigger a download
      const a = document.createElement('a');
      a.href     = url;
      a.download = `avtas-brain-gen${gen}-fit${fitness}.json`;
      a.click();
      URL.revokeObjectURL(url);
      // Update in-memory saved state
      savedBrainRef.current = cloneNetwork(network);
      setSavedBrainFitness(fitness);
      setSavedBrainGen(gen);
      setHasSavedBrain(true);
    }
  };

  /**
   * Open a file picker so the user can load a previously saved .json brain file.
   */
  const handleLoadSavedChampion = () => {
    const input = document.createElement('input');
    input.type   = 'file';
    input.accept = '.json,application/json';

    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const payload = JSON.parse(ev.target.result);
          if (!payload.network) throw new Error('Invalid brain file: missing network field.');

          const loadedNetwork = payload.network;
          const loadedFitness = payload.fitness || 0;
          const loadedGen     = payload.generation || 1;

          // Store in ref so it persists in memory
          savedBrainRef.current = cloneNetwork(loadedNetwork);
          setSavedBrainFitness(loadedFitness);
          setSavedBrainGen(loadedGen);
          setHasSavedBrain(true);

          // Inject into simulation: 1 exact clone + mutated offspring
          if (stateRef.current.track) {
            const f = stateRef.current.cars[0]?.friction ?? friction;
            const nextBrains = [cloneNetwork(loadedNetwork)];
            while (nextBrains.length < populationSize) {
              const child = mutateNetwork(cloneNetwork(loadedNetwork), mutationRate, mutationPower);
              nextBrains.push(child);
            }
            stateRef.current.cars = nextBrains.map(b => spawnCar(stateRef.current.track, f, b));
            stateRef.current.generationCount = loadedGen;
            stateRef.current.bestEverNetwork = cloneNetwork(loadedNetwork);
            stateRef.current.bestEverFitness = loadedFitness;
            setGeneration(loadedGen);
            setBestFitness(loadedFitness);
          }
        } catch (err) {
          alert('❌ Failed to load brain file: ' + err.message);
        }
      };
      reader.readAsText(file);
    };

    input.click();
  };

  /**
   * Clear the in-memory saved brain.
   */
  const handleClearSavedChampion = () => {
    savedBrainRef.current = null;
    setHasSavedBrain(false);
    setSavedBrainFitness(0);
    setSavedBrainGen(0);
  };

  /**
   * Save the current session to the workspace (projects.json)
   */
  const handleSaveSession = async () => {
    if (!currentProject) {
      alert("No active workspace to save to.");
      return;
    }

    const network = stateRef.current.bestEverNetwork || stateRef.current.cars?.[0]?.brain;
    const fitness = Math.round(stateRef.current.bestEverFitness || stateRef.current.cars?.[0]?.fitness || 0);
    const gen     = stateRef.current.generationCount;

    const sessionPayload = {
      mode: simMode,
      generation: gen,
      fitness: fitness,
      config: {
        populationSize,
        mutationRate,
        selectionRatio,
        timeOfDay,
        hasRain,
        hasObstacles,
        simSpeed,
        zoom
      },
      network: network || null
    };

    try {
      const res = await fetch(`/api/projects/${currentProject.id}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionPayload)
      });
      if (res.ok) {
        alert('✅ Session saved successfully to the workspace!');
        const newSession = await res.json();
        
        setCurrentSessionId(newSession.id);
        setCurrentSessionName(newSession.name || `Session ${newSession.id.slice(-4)}`);

        // Update currentProject to include this session so the dashboard reflects it if we go back
        setCurrentProject(prev => ({
          ...prev,
          sessions: [...(prev.sessions || []), newSession]
        }));
      }
    } catch (err) {
      console.error('Failed to save session', err);
      alert('❌ Failed to save session.');
    }
  };

  const handleRenameCurrentSession = async () => {
    if (!currentProject || !currentSessionId) return;
    const newName = window.prompt("Enter new session name:", currentSessionName);
    if (newName && newName.trim() !== currentSessionName) {
      try {
        const res = await fetch(`/api/projects/${currentProject.id}/sessions/${currentSessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName.trim() })
        });
        if (res.ok) {
          const updatedSession = await res.json();
          setCurrentSessionName(updatedSession.name);
          setCurrentProject(prev => ({
            ...prev,
            sessions: prev.sessions?.map(s => s.id === currentSessionId ? updatedSession : s) || []
          }));
        }
      } catch (err) {
        console.error('Failed to rename session', err);
        alert('❌ Failed to rename session.');
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Current active config snapshot (for ConfigModal read-only view)
  // ─────────────────────────────────────────────────────────────────────────
  const activeConfig = {
    populationSize,
    mutationRate,
    selectionRatio,
    timeOfDay,
    hasRain,
    hasObstacles,
    simSpeed,
    zoom,
    cameraMode,
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex font-sans selection:bg-amber-500/30">

      {/* ── Sidebar (hidden by default) ── */}
      {showSidebar && (
        <Sidebar
          generation={generation}
          aliveCount={aliveCount}
          populationSize={populationSize}
          bestFitness={bestFitness}
          timeOfDay={timeOfDay}      setTimeOfDay={setTimeOfDay}
          hasRain={hasRain}          setHasRain={setHasRain}
          hasObstacles={hasObstacles} setHasObstacles={setHasObstacles}
          mutationRate={mutationRate} setMutationRate={setMutationRate}
          selectionRatio={selectionRatio} setSelectionRatio={setSelectionRatio}
          setPopulationSize={setPopulationSize}
        />
      )}

      {/* ── Main panel ───────────────────────────────────────────────────── */}
      <main className={`flex-1 p-8 overflow-y-auto ${showSidebar ? 'pl-80' : 'pl-8'}`}>

        {/* Page header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
          <div className="flex items-center gap-4">
            {!showStartupModal && !showLanding && (
              <button 
                onClick={() => setShowProjectSidebar(true)}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-300 transition-colors"
                title="Open Project Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-extrabold text-white">AVTAS Laboratory</h1>
            </div>
          </div>

          {!showLanding && (
            <button
              onClick={() => {
                setShowLanding(true);
                setIsPlaying(false);
                setShowStartupModal(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white transition-all shadow-md font-mono uppercase tracking-wider"
              title="Back to Workspace Dashboard"
            >
              <LayoutGrid className="w-4 h-4 text-amber-500" />
              <span>Back to Workspaces</span>
            </button>
          )}
        </div>

        {/* Sub-header (where tabs used to be) */}
        {!showLanding && (
          <div className="flex items-center justify-between border-b border-zinc-900 mb-6 pb-3">
            <h2 className="text-sm font-semibold text-zinc-300">
              {simMode === 'training' ? 'Mission Control Dashboard' : 'Adversarial Test Dashboard'}
            </h2>
            
            <div className="flex items-center gap-3">
              {currentSessionId && (
                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/50 rounded-lg border border-zinc-800/50 mr-2">
                  <span className="text-zinc-400 text-xs font-mono">{currentSessionName}</span>
                  <button 
                    onClick={handleRenameCurrentSession}
                    className="text-zinc-500 hover:text-amber-500 transition-colors p-1"
                    title="Rename Session"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {!showStartupModal && (
                <button
                  onClick={handleSaveSession}
                  className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900 hover:bg-amber-500 hover:text-black border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-300 transition-colors shadow-sm"
                >
                  <Database className="w-3.5 h-3.5" /> Save Session
                </button>
              )}

              {!showStartupModal && (
                <button
                  onClick={() => setShowStartupModal(true)}
                  className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-semibold text-amber-500 transition-colors"
                >
                  ⚙ Environment Configurations
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        {simMode === 'adversarial' ? (
          <AdversarialSuitePage 
            onSaveSession={handleSaveSession}
            stateRef={stateRef}
            isPlaying={isPlaying} setIsPlaying={setIsPlaying}
            simSpeed={simSpeed} setSimSpeed={setSimSpeed}
            timeOfDay={timeOfDay} setTimeOfDay={setTimeOfDay}
            hasRain={hasRain} setHasRain={setHasRain}
            hasObstacles={hasObstacles} setHasObstacles={setHasObstacles}
            zoom={zoom} setZoom={setZoom}
            cameraMode={cameraMode} setCameraMode={setCameraMode}
            onRegenerateCity={handleRegenerateCity}
            leaderTelemetry={leaderTelemetry}
            generation={generation}
            bestFitness={bestFitness}
            aliveCount={aliveCount}
            hasSavedBrain={hasSavedBrain || !!currentSessionId}
          />
        ) : (
          <SimulationPage
            canvasRef={canvasRef}
            isPlaying={isPlaying}         setIsPlaying={setIsPlaying}
            simSpeed={simSpeed}           setSimSpeed={setSimSpeed}
            timeOfDay={timeOfDay}
            hasRain={hasRain}
            leaderTelemetry={leaderTelemetry}
            onRegenerateCity={handleRegenerateCity}
            stateRef={stateRef}
            generation={generation}
            aliveCount={aliveCount}
            bestFitness={bestFitness}
            zoom={zoom}
            setZoom={setZoom}
            compact={!showSidebar}
            history={history}
            hasSavedBrain={hasSavedBrain}
            savedBrainFitness={savedBrainFitness}
            savedBrainGen={savedBrainGen}
            onSaveBrain={handleSaveCurrentChampion}
            onLoadBrain={handleLoadSavedChampion}
            onClearBrain={handleClearSavedChampion}
            onSaveSession={handleSaveSession}
          />
        )}

      </main>

      {/* ── Landing Page ─────────────────────────────────────────────────── */}
      {showLanding && (
        <LandingPage
          onComplete={({ project, mode, sessionData }) => {
            setCurrentProject(project);
            setSimMode(mode);
            setShowLanding(false);
            
            if (sessionData) {
              setCurrentSessionId(sessionData.id);
              setCurrentSessionName(sessionData.name || `Session ${sessionData.id.slice(-4)}`);

              // Load configuration
              setPopulationSize(sessionData.config?.populationSize || 20);
              setMutationRate(sessionData.config?.mutationRate || 0.08);
              setSelectionRatio(sessionData.config?.selectionRatio || 0.25);
              setTimeOfDay(sessionData.config?.timeOfDay || 'day');
              setHasRain(sessionData.config?.hasRain || false);
              setHasObstacles(sessionData.config?.hasObstacles || true);
              setSimSpeed(sessionData.config?.simSpeed || 1);
              setZoom(sessionData.config?.zoom || 1);
              if (sessionData.config?.cameraMode) setCameraMode(sessionData.config.cameraMode);

              // For adversarial mode, show config modal first. For training, go straight to play.
              if (mode === 'adversarial') {
                setShowStartupModal(true);
                setIsPlaying(false);
              } else {
                setShowStartupModal(false);
                setIsPlaying(true);
              }

              // Setup simulation state after a tiny delay to allow handleRegenerateCity to run from populationSize effect
              setTimeout(() => {
                if (sessionData.network && stateRef.current.track) {
                  const f = sessionData.config?.hasRain ? 0.08 : 0.04;
                  savedBrainRef.current = cloneNetwork(sessionData.network);
                  stateRef.current.bestEverNetwork = cloneNetwork(sessionData.network);
                  
                  // In adversarial, all cars use the exact same brain. In training, we use clones of the brain.
                  const nextBrains = Array(sessionData.config?.populationSize || 20).fill(null).map(() => cloneNetwork(sessionData.network));
                  stateRef.current.cars = nextBrains.map(b => spawnCar(stateRef.current.track, f, b));
                  setHasSavedBrain(true);
                }
                
                stateRef.current.bestEverFitness = sessionData.fitness || 0;
                setBestFitness(sessionData.fitness || 0);
                stateRef.current.generationCount = sessionData.generation || 1;
                setGeneration(sessionData.generation || 1);
              }, 50);

            } else {
              setCurrentSessionId(null);
              setCurrentSessionName('');
              // Normal startup
              setShowStartupModal(true);
            }
          }}
        />
      )}

      {/* ── Project Sidebar ──────────────────────────────────────────────── */}
      <ProjectSidebar 
        isOpen={showProjectSidebar}
        onClose={() => setShowProjectSidebar(false)}
        currentProject={currentProject}
        simMode={simMode}
        onOpenProjectList={() => {
          setShowLanding(true);
          setIsPlaying(false);
          setShowProjectSidebar(false);
        }}
        onOpenSettings={() => setShowSettingsModal(true)}
        onSwitchProject={(project) => {
          setCurrentProject(project);
          setShowProjectSidebar(false);
          setIsPlaying(false);
          setShowLanding(true);
        }}
      />

      {/* ── Startup configuration modal ────────────────────────────────── */}
      {showStartupModal && (
        <StartConfigModal
          simMode={simMode}
          isSessionLoaded={!!currentSessionId}
          initial={{ populationSize, mutationRate, selectionRatio, timeOfDay, hasRain, hasObstacles, simSpeed, zoom, cameraMode }}
          onCancel={() => {
            setShowStartupModal(false);
            if (simMode === 'adversarial' && currentSessionId) {
              setIsPlaying(true); // If they cancel after loading an adversarial session, just start it.
            }
          }}
          onStart={(cfg) => {
            setPopulationSize(cfg.populationSize);
            setMutationRate(cfg.mutationRate);
            setSelectionRatio(cfg.selectionRatio);
            setTimeOfDay(cfg.timeOfDay);
            setHasRain(cfg.hasRain);
            setHasObstacles(cfg.hasObstacles);
            setSimSpeed(cfg.simSpeed || 1);
            setZoom(cfg.zoom || 1);
            setCameraMode(cfg.cameraMode || 'follow');
            setShowSidebar(false);
            setShowStartupModal(false);
            setIsPlaying(true);
            
            handleRegenerateCity();

            if (simMode === 'adversarial' && cfg.uploadedBrain) {
               // Load it into state
               savedBrainRef.current = cloneNetwork(cfg.uploadedBrain.network);
               stateRef.current.bestEverNetwork = cloneNetwork(cfg.uploadedBrain.network);
               
               // Override spawned cars with the uploaded brain
               const nextBrains = Array(cfg.populationSize).fill(null).map(() => cloneNetwork(cfg.uploadedBrain.network));
               stateRef.current.cars = nextBrains.map(b => spawnCar(stateRef.current.track, friction, b));
               setHasSavedBrain(true);
            }
          }}
        />
      )}

      {/* ── Settings placeholder modal ────────────────────────────────── */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-900 rounded-xl p-8 shadow-2xl relative text-center space-y-6">
            <button 
              onClick={() => setShowSettingsModal(false)} 
              className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.05)]">
              <Settings className="w-8 h-8 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white uppercase tracking-wide">System Settings</h2>
              <p className="text-zinc-500 font-mono text-xs tracking-widest uppercase">Feature in Development</p>
            </div>
            <p className="text-xs text-zinc-600 max-w-sm mx-auto leading-relaxed">
              General application settings, simulation parameters, and model customization settings will be configurable here in a future update.
            </p>
            <button
              onClick={() => setShowSettingsModal(false)}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg transition-colors uppercase tracking-wider font-mono"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
