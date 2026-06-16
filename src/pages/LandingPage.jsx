import { useState, useEffect } from 'react';
import { Play, Folder, FolderPlus, BrainCircuit, Car, MoreVertical, Edit2, Trash2, ArrowLeft, Terminal, Sparkles, Activity } from 'lucide-react';

export default function LandingPage({ onComplete }) {
  const [projects, setProjects] = useState([]);
  const [currentStep, setCurrentStep] = useState('workspace'); // 'workspace' | 'project_dashboard' | 'mode_selection'
  const [selectedProject, setSelectedProject] = useState(null);
  
  // UI States
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editProjectName, setEditProjectName] = useState('');
  
  const [openMenuId, setOpenMenuId] = useState(null);

  // Session UI States
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editSessionName, setEditSessionName] = useState('');
  const [openSessionMenuId, setOpenSessionMenuId] = useState(null);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => console.error("Failed to load projects", err));
  }, []);

  const handleCreateProject = async (e) => {
    if (e) e.preventDefault();
    if (!newProjectName.trim()) return;
    const newProject = {
      id: Date.now().toString(),
      name: newProjectName.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });
      const savedProject = await res.json();
      setProjects([savedProject, ...projects]);
      setNewProjectName('');
      setIsCreatingProject(false);
      
      // Auto-select and move to next step
      setSelectedProject(savedProject);
      setCurrentStep('project_dashboard');
    } catch (err) {
      console.error("Failed to create project", err);
    }
  };

  const handleRename = async (id) => {
    if (!editProjectName.trim()) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editProjectName.trim() })
      });
      if (res.ok) {
        setProjects(projects.map(p => p.id === id ? { ...p, name: editProjectName.trim() } : p));
      }
      setEditingProjectId(null);
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to rename project", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects(projects.filter(p => p.id !== id));
      }
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to delete project", err);
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClick = () => {
      setOpenMenuId(null);
      setOpenSessionMenuId(null);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleRenameSession = async (projectId, sessionId) => {
    if (!editSessionName.trim()) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editSessionName.trim() })
      });
      if (res.ok) {
        const updatedSession = await res.json();
        const updateFn = (prevProjects) => prevProjects.map(p => {
          if (p.id === projectId) {
            return {
              ...p,
              sessions: p.sessions.map(sess => sess.id === sessionId ? updatedSession : sess)
            };
          }
          return p;
        });
        setProjects(updateFn);
        if (selectedProject?.id === projectId) {
           setSelectedProject(prev => ({
             ...prev,
             sessions: prev.sessions.map(sess => sess.id === sessionId ? updatedSession : sess)
           }));
        }
      }
      setEditingSessionId(null);
      setOpenSessionMenuId(null);
    } catch (err) {
      console.error("Failed to rename session", err);
    }
  };

  const handleDeleteSession = async (projectId, sessionId) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/sessions/${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        const updateFn = (prevProjects) => prevProjects.map(p => {
          if (p.id === projectId) {
            return { ...p, sessions: p.sessions.filter(sess => sess.id !== sessionId) };
          }
          return p;
        });
        setProjects(updateFn);
        if (selectedProject?.id === projectId) {
           setSelectedProject(prev => ({
             ...prev,
             sessions: prev.sessions.filter(sess => sess.id !== sessionId)
           }));
        }
      }
      setOpenSessionMenuId(null);
    } catch (err) {
      console.error("Failed to delete session", err);
    }
  };

  if (currentStep === 'workspace') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#030305] overflow-y-auto selection:bg-amber-500/30">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative w-full max-w-7xl mx-auto px-8 py-16 animation-fade-in flex-1 flex flex-col">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-amber-500 font-mono font-bold uppercase tracking-[0.2em] text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Simulation Platform V1.0</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 tracking-tight">
                AVTAS
              </h1>
              <p className="text-zinc-400 text-lg max-w-xl leading-relaxed">
                Autonomous agent training and adversarial edge-case testing laboratory. Select a workspace to initialize the physics engine.
              </p>
            </div>
            
            {isCreatingProject ? (
              <form onSubmit={handleCreateProject} className="flex gap-3 items-center glass-panel p-2 rounded-2xl animation-slide-up">
                <div className="flex items-center gap-2 px-3">
                  <Terminal className="w-5 h-5 text-amber-500" />
                  <input 
                    type="text"
                    placeholder="Workspace ID..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="bg-transparent border-none text-zinc-100 placeholder-zinc-600 focus:ring-0 w-48 md:w-64 outline-none font-mono"
                    autoFocus
                  />
                </div>
                <button type="submit" className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  Initialize
                </button>
                <button type="button" onClick={() => setIsCreatingProject(false)} className="px-4 py-2.5 text-zinc-400 hover:text-white font-medium rounded-xl hover:bg-zinc-800/50 transition-colors">
                  Cancel
                </button>
              </form>
            ) : (
              <button 
                onClick={() => setIsCreatingProject(true)}
                className="group relative px-6 py-3.5 bg-zinc-900/80 hover:bg-zinc-800 text-white font-medium rounded-2xl border border-zinc-700/50 hover:border-amber-500/50 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <div className="relative flex items-center gap-3">
                  <FolderPlus className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span>New Workspace</span>
                </div>
              </button>
            )}
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((p, i) => (
              <div 
                key={p.id} 
                className="group glass-panel rounded-2xl p-1 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)] transition-all duration-300 cursor-pointer animation-slide-up flex flex-col"
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => {
                  if (editingProjectId !== p.id) {
                    setSelectedProject(p);
                    setCurrentStep('project_dashboard');
                  }
                }}
              >
                <div className="bg-zinc-950/50 rounded-xl p-5 h-[180px] flex flex-col justify-between relative overflow-hidden">
                  {/* Subtle glowing orb in card */}
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/10 blur-[40px] rounded-full group-hover:bg-amber-500/20 transition-colors" />
                  
                  <div className="relative z-10 flex justify-between items-start">
                    <div className="flex items-center gap-4 w-full pr-8">
                      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800/50 flex items-center justify-center text-zinc-500 group-hover:border-amber-500/30 group-hover:text-amber-500 shadow-inner transition-colors shrink-0">
                        <Folder className="w-6 h-6" />
                      </div>
                      {editingProjectId === p.id ? (
                        <input 
                          type="text"
                          value={editProjectName}
                          onChange={(e) => setEditProjectName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(p.id);
                            if (e.key === 'Escape') setEditingProjectId(null);
                          }}
                          className="bg-zinc-900 border border-amber-500/50 rounded-lg px-3 py-1.5 text-white font-bold w-full focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          autoFocus
                        />
                      ) : (
                        <div className="min-w-0">
                          <h3 className="text-xl font-bold text-zinc-100 truncate group-hover:text-white transition-colors">{p.name}</h3>
                          <p className="text-xs text-zinc-500 font-mono mt-1">ID: {p.id.slice(-6)}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Context Menu */}
                    <div className="absolute right-0 top-0">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === p.id ? null : p.id);
                        }}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      {openMenuId === p.id && (
                        <div className="absolute right-0 mt-1 w-48 glass-panel rounded-xl shadow-2xl z-20 py-1 border border-zinc-700/50" onClick={e => e.stopPropagation()}>
                          {editingProjectId === p.id ? (
                             <button 
                              onClick={(e) => { e.stopPropagation(); handleRename(p.id); }}
                              className="w-full text-left px-4 py-2.5 text-sm font-medium text-amber-500 hover:bg-zinc-800/50 flex items-center gap-2 transition-colors"
                            >
                              Save Changes
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProjectId(p.id);
                                setEditProjectName(p.name);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800/50 flex items-center gap-2 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" /> Rename Workspace
                            </button>
                          )}
                          <div className="h-px w-full bg-zinc-800/50 my-1" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Terminate Project
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative z-10 flex items-center gap-3">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/80 border border-zinc-800/50 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                      <Activity className="w-3 h-3 text-emerald-500" /> Active
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {projects.length === 0 && !isCreatingProject && (
              <div className="col-span-full py-24 flex flex-col items-center justify-center glass-panel rounded-3xl border-dashed border-2 border-zinc-800/50 animation-slide-up">
                <div className="w-20 h-20 bg-zinc-900/50 rounded-full flex items-center justify-center mb-6">
                  <FolderPlus className="w-10 h-10 text-zinc-600" />
                </div>
                <h3 className="text-xl font-bold text-zinc-300 mb-2">No Workspaces Detected</h3>
                <p className="text-zinc-500 max-w-sm text-center mb-8">
                  Initialize a new workspace to begin configuring neural networks and adversarial test scenarios.
                </p>
                <button 
                  onClick={() => setIsCreatingProject(true)}
                  className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5"
                >
                  Create First Workspace
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Project Dashboard View ---
  if (currentStep === 'project_dashboard') {
    const trainingSessions = selectedProject?.sessions?.filter(s => s.mode === 'training') || [];
    const adversarialSessions = selectedProject?.sessions?.filter(s => s.mode === 'adversarial') || [];

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#030305] overflow-y-auto selection:bg-amber-500/30">
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
        
        <div className="relative w-full max-w-6xl px-8 py-16 animation-fade-in">
          {/* Header */}
          <div className="flex flex-col items-start mb-12">
            <button 
              onClick={() => setCurrentStep('workspace')}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800/50 rounded-full text-zinc-400 hover:text-white transition-all duration-300 backdrop-blur-sm mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Return to Directory</span>
            </button>
            <div className="flex items-center justify-between w-full">
              <div>
                <span className="text-[12px] text-amber-500 font-mono font-bold uppercase tracking-widest flex items-center gap-2">
                  <Folder className="w-3.5 h-3.5" /> Workspace: {selectedProject?.name}
                </span>
                <h1 className="text-4xl font-extrabold text-white mt-2">Project Sessions</h1>
              </div>
              <button 
                onClick={() => setCurrentStep('mode_selection')}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all hover:scale-105 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                Initialize New Session
              </button>
            </div>
          </div>

          <div className="space-y-12">
            {/* Training Sessions */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <BrainCircuit className="text-amber-500 w-6 h-6" /> Training Sessions
              </h2>
              {trainingSessions.length === 0 ? (
                <div className="p-8 border border-dashed border-zinc-800/50 rounded-2xl text-zinc-500 text-center glass-panel">
                  No training sessions saved yet. Click "Initialize New Session" to start.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {trainingSessions.map(s => (
                    <div key={s.id} className="glass-panel p-6 rounded-2xl hover:border-amber-500/50 transition-colors group relative">
                      {/* Context Menu for Session */}
                      <div className="absolute right-2 top-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenSessionMenuId(openSessionMenuId === s.id ? null : s.id);
                          }}
                          className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {openSessionMenuId === s.id && (
                          <div className="absolute right-0 mt-1 w-44 glass-panel rounded-xl shadow-2xl z-20 py-1 border border-zinc-700/50" onClick={e => e.stopPropagation()}>
                            {editingSessionId === s.id ? (
                               <button 
                                onClick={(e) => { e.stopPropagation(); handleRenameSession(selectedProject.id, s.id); }}
                                className="w-full text-left px-4 py-2 text-xs font-medium text-amber-500 hover:bg-zinc-800/50 flex items-center gap-2 transition-colors"
                              >
                                Save Changes
                              </button>
                            ) : (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSessionId(s.id);
                                  setEditSessionName(s.name || `Session ${s.id.slice(-4)}`);
                                  setOpenSessionMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800/50 flex items-center gap-2 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Rename
                              </button>
                            )}
                            <div className="h-px w-full bg-zinc-800/50 my-1" />
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteSession(selectedProject.id, s.id); }}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="text-xs font-mono text-zinc-500 mb-2">{new Date(s.createdAt).toLocaleString()}</div>
                      
                      {editingSessionId === s.id ? (
                        <input 
                          type="text"
                          value={editSessionName}
                          onChange={(e) => setEditSessionName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSession(selectedProject.id, s.id);
                            if (e.key === 'Escape') setEditingSessionId(null);
                          }}
                          className="bg-zinc-900 border border-amber-500/50 rounded-lg px-2 py-1 text-white font-bold w-full focus:outline-none focus:ring-2 focus:ring-amber-500/20 mb-3"
                          autoFocus
                        />
                      ) : (
                        <div className="text-xl font-bold text-white mb-2">{s.name || `Session ${s.id.slice(-4)}`}</div>
                      )}
                      
                      <div className="text-sm text-zinc-400 mb-2">Generation: {s.generation}</div>
                      <div className="text-sm text-zinc-400 mb-6">Best Fitness: <span className="text-amber-500 font-mono">{s.fitness}</span></div>
                      <button 
                        onClick={() => onComplete({ project: selectedProject, mode: 'training', sessionData: s })}
                        className="w-full py-2 bg-zinc-800/50 hover:bg-amber-500 hover:text-black text-white rounded-lg transition-colors font-semibold flex justify-center items-center gap-2"
                      >
                        <Play className="w-4 h-4" /> Load Session
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Adversarial Sessions */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Car className="text-red-500 w-6 h-6" /> Adversarial Sessions
              </h2>
              {adversarialSessions.length === 0 ? (
                <div className="p-8 border border-dashed border-zinc-800/50 rounded-2xl text-zinc-500 text-center glass-panel">
                  No adversarial sessions saved yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {adversarialSessions.map(s => (
                    <div key={s.id} className="glass-panel p-6 rounded-2xl hover:border-red-500/50 transition-colors group relative">
                      {/* Context Menu for Session */}
                      <div className="absolute right-2 top-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenSessionMenuId(openSessionMenuId === s.id ? null : s.id);
                          }}
                          className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {openSessionMenuId === s.id && (
                          <div className="absolute right-0 mt-1 w-44 glass-panel rounded-xl shadow-2xl z-20 py-1 border border-zinc-700/50" onClick={e => e.stopPropagation()}>
                            {editingSessionId === s.id ? (
                               <button 
                                onClick={(e) => { e.stopPropagation(); handleRenameSession(selectedProject.id, s.id); }}
                                className="w-full text-left px-4 py-2 text-xs font-medium text-amber-500 hover:bg-zinc-800/50 flex items-center gap-2 transition-colors"
                              >
                                Save Changes
                              </button>
                            ) : (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSessionId(s.id);
                                  setEditSessionName(s.name || `Session ${s.id.slice(-4)}`);
                                  setOpenSessionMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800/50 flex items-center gap-2 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Rename
                              </button>
                            )}
                            <div className="h-px w-full bg-zinc-800/50 my-1" />
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteSession(selectedProject.id, s.id); }}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="text-xs font-mono text-zinc-500 mb-2">{new Date(s.createdAt).toLocaleString()}</div>
                      
                      {editingSessionId === s.id ? (
                        <input 
                          type="text"
                          value={editSessionName}
                          onChange={(e) => setEditSessionName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSession(selectedProject.id, s.id);
                            if (e.key === 'Escape') setEditingSessionId(null);
                          }}
                          className="bg-zinc-900 border border-red-500/50 rounded-lg px-2 py-1 text-white font-bold w-full focus:outline-none focus:ring-2 focus:ring-red-500/20 mb-3"
                          autoFocus
                        />
                      ) : (
                        <div className="text-xl font-bold text-white mb-2">{s.name || `Session ${s.id.slice(-4)}`}</div>
                      )}
                      
                      <div className="text-sm text-zinc-400 mb-2">Generation: {s.generation}</div>
                      <div className="text-sm text-zinc-400 mb-6">Best Fitness: <span className="text-red-500 font-mono">{s.fitness}</span></div>
                      <button 
                        onClick={() => onComplete({ project: selectedProject, mode: 'adversarial', sessionData: s })}
                        className="w-full py-2 bg-zinc-800/50 hover:bg-red-500 hover:text-white text-white rounded-lg transition-colors font-semibold flex justify-center items-center gap-2"
                      >
                        <Play className="w-4 h-4" /> Load Session
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  }

  // --- Mode Selection View ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030305] overflow-y-auto selection:bg-amber-500/30">
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
      
      <div className="relative w-full max-w-5xl px-8 py-12 animation-fade-in">
        
        {/* Nav & Title */}
        <div className="flex flex-col items-center text-center mb-16 space-y-4">
          <button 
            onClick={() => setCurrentStep('project_dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800/50 rounded-full text-zinc-400 hover:text-white transition-all duration-300 backdrop-blur-sm mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Return to Dashboard</span>
          </button>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800/50 text-xs text-amber-500 font-mono tracking-widest uppercase shadow-inner">
            <Folder className="w-3.5 h-3.5" /> {selectedProject?.name}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Select Operational Suite</h1>
          <p className="text-zinc-400 max-w-lg mx-auto">
            Choose the simulation mode for this workspace. You can train new neural pathways or inject existing brains into adversarial scenarios.
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Training Suite Card */}
          <button 
            onClick={() => onComplete({ project: selectedProject, mode: 'training' })}
            className="group relative text-left glass-panel p-1 rounded-[2rem] hover:-translate-y-2 hover:border-amber-500/50 hover:shadow-[0_20px_50px_rgba(245,158,11,0.15)] transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-[#070709]/80 backdrop-blur-sm p-10 rounded-[1.8rem] h-full flex flex-col justify-between overflow-hidden">
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/5 rounded-full blur-[60px] group-hover:bg-amber-500/10 transition-colors duration-500" />
              
              <div>
                <div className="w-16 h-16 rounded-2xl mb-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:bg-amber-500 group-hover:text-black group-hover:border-amber-400 group-hover:scale-110 transition-all duration-500 shadow-xl">
                  <BrainCircuit className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black mb-4 text-white group-hover:text-amber-500 transition-colors duration-300 tracking-tight">
                  Evolutionary Training
                </h3>
                <p className="text-base text-zinc-400 leading-relaxed mb-8">
                  Deploy a population of agents utilizing genetic algorithms. The environment will forcefully evolve driving behaviors through mutation, crossover, and rigorous fitness selection over successive generations.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {['Genetic Algorithms', 'Neural Topology', 'Mutation Scaling'].map((tag, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-500 group-hover:border-amber-500/20 group-hover:text-amber-500/80 transition-colors">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </button>

          {/* Adversarial Suite Card */}
          <button 
            onClick={() => onComplete({ project: selectedProject, mode: 'adversarial' })}
            className="group relative text-left glass-panel p-1 rounded-[2rem] hover:-translate-y-2 hover:border-red-500/50 hover:shadow-[0_20px_50px_rgba(239,68,68,0.15)] transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-[#070709]/80 backdrop-blur-sm p-10 rounded-[1.8rem] h-full flex flex-col justify-between overflow-hidden">
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-red-500/5 rounded-full blur-[60px] group-hover:bg-red-500/10 transition-colors duration-500" />
              
              <div>
                <div className="w-16 h-16 rounded-2xl mb-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:bg-red-500 group-hover:text-white group-hover:border-red-400 group-hover:scale-110 transition-all duration-500 shadow-xl">
                  <Car className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black mb-4 text-white group-hover:text-red-500 transition-colors duration-300 tracking-tight">
                  Adversarial Testing
                </h3>
                <p className="text-base text-zinc-400 leading-relaxed mb-8">
                  Inject a pre-trained "Perfect Brain" into highly volatile scenarios. The simulation actively generates erratic edge-cases and hostile dynamics specifically designed to induce catastrophic failure.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {['Pre-trained Upload', 'Hostile Environment', 'Robustness Analysis'].map((tag, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-500 group-hover:border-red-500/20 group-hover:text-red-500/80 transition-colors">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
}
