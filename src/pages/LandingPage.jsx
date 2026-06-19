import { useState, useEffect } from 'react';
import { Play, Folder, FolderPlus, BrainCircuit, Car, MoreVertical, Edit2, Trash2, ArrowLeft, Terminal, Sparkles, Activity } from 'lucide-react';

export default function LandingPage({ onComplete }) {
  const [projects, setProjects] = useState([]);
  const [currentStep, setCurrentStep] = useState('workspace'); // 'workspace' | 'project_dashboard' | 'mode_selection'
  const [selectedProject, setSelectedProject] = useState(null);
  
  // UI States
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#f59e0b'); // Default amber-500
  
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
      color: newProjectColor,
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
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 overflow-y-auto selection:bg-pink-500/30">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none invert" />
        <div className="absolute top-0 left-0 w-[800px] h-[500px] bg-cyan-400/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-[800px] h-[500px] bg-pink-400/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative w-full max-w-7xl mx-auto px-8 py-16 animation-fade-in flex-1 flex flex-col">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-cyan-600 font-mono font-bold uppercase tracking-[0.2em] text-xs">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span>Simulation Platform V1.0</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500 tracking-tight pb-2">
                AVTAS
              </h1>
              <p className="text-slate-500 text-lg max-w-xl leading-relaxed">
                Autonomous agent training and adversarial edge-case testing laboratory. Select a workspace to initialize the physics engine.
              </p>
            </div>
            
            {isCreatingProject ? (
              <form onSubmit={handleCreateProject} className="flex gap-3 items-center bg-white/80 border border-slate-200/60 shadow-xl shadow-slate-200/50 backdrop-blur-md p-2 rounded-2xl animation-slide-up">
                <div className="flex items-center gap-2 px-3">
                  <Terminal className="w-5 h-5 text-cyan-500" />
                  <input 
                    type="text"
                    placeholder="Workspace ID..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="bg-transparent border-none text-slate-800 placeholder-slate-400 focus:ring-0 w-48 md:w-64 outline-none font-mono"
                    autoFocus
                  />
                  <input 
                    type="color" 
                    value={newProjectColor}
                    onChange={(e) => setNewProjectColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0 ml-2"
                    title="Select Workspace Color"
                  />
                </div>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-pink-500 hover:opacity-90 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md">
                  Initialize
                </button>
                <button type="button" onClick={() => setIsCreatingProject(false)} className="px-4 py-2.5 text-slate-400 hover:text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors">
                  Cancel
                </button>
              </form>
            ) : (
              <button 
                onClick={() => setIsCreatingProject(true)}
                className="group relative px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-medium rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 hover:border-cyan-300 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-pink-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <div className="relative flex items-center gap-3">
                  <FolderPlus className="w-5 h-5 text-pink-500 group-hover:scale-110 transition-transform" />
                  <span>New Workspace</span>
                </div>
              </button>
            )}
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((p, i) => {
              const pColor = p.color || '#06b6d4';
              const trainCount = p.sessions?.filter(s => s.mode === 'training').length || 0;
              const advCount = p.sessions?.filter(s => s.mode === 'adversarial').length || 0;
              return (
              <div 
                key={p.id} 
                className="group bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-2xl p-1 hover:-translate-y-1 transition-all duration-300 cursor-pointer animation-slide-up flex flex-col shadow-lg shadow-slate-200/40"
                style={{ animationDelay: `${i * 50}ms`, '--hover-color': pColor }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = pColor;
                  e.currentTarget.style.boxShadow = `0 8px 30px ${pColor}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.6)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(226, 232, 240, 0.4)';
                }}
                onClick={() => {
                  if (editingProjectId !== p.id) {
                    setSelectedProject(p);
                    setCurrentStep('project_dashboard');
                  }
                }}
              >
                <div className="bg-white rounded-xl p-5 h-[180px] flex flex-col justify-between relative overflow-hidden">
                  {/* Subtle glowing orb in card */}
                  <div className="absolute -right-8 -top-8 w-24 h-24 blur-[40px] rounded-full transition-colors" style={{ backgroundColor: `${pColor}20` }} />
                  
                  <div className="relative z-10 flex justify-between items-start">
                    <div className="flex items-center gap-4 w-full pr-8">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner transition-colors shrink-0 group-hover:bg-white" style={{ color: pColor }}>
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
                          className="bg-slate-50 border border-cyan-300 rounded-lg px-3 py-1.5 text-slate-800 font-bold w-full focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                          autoFocus
                        />
                      ) : (
                        <div className="min-w-0">
                          <h3 className="text-xl font-bold text-slate-800 truncate group-hover:text-cyan-600 transition-colors">{p.name}</h3>
                          <div className="flex gap-3 text-[11px] text-slate-400 font-mono mt-1.5">
                            <span className="flex items-center gap-1"><BrainCircuit className="w-3 h-3 text-pink-400" /> {trainCount}</span>
                            <span className="flex items-center gap-1"><Car className="w-3 h-3 text-cyan-400" /> {advCount}</span>
                          </div>
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
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      {openMenuId === p.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl z-20 py-1 border border-slate-200" onClick={e => e.stopPropagation()}>
                          {editingProjectId === p.id ? (
                             <button 
                              onClick={(e) => { e.stopPropagation(); handleRename(p.id); }}
                              className="w-full text-left px-4 py-2.5 text-sm font-medium text-cyan-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
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
                              className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" /> Rename Workspace
                            </button>
                          )}
                          <div className="h-px w-full bg-slate-100 my-1" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-pink-500 hover:bg-pink-50 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Terminate Project
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative z-10 flex items-center gap-3">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      <Activity className="w-3 h-3 text-cyan-500" /> Active
                    </span>
                  </div>
                </div>
              </div>
            )})}

            {/* Empty State */}
            {projects.length === 0 && !isCreatingProject && (
              <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-3xl border-dashed border-2 border-slate-300 animation-slide-up shadow-sm">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <FolderPlus className="w-10 h-10 text-cyan-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No Workspaces Detected</h3>
                <p className="text-slate-500 max-w-sm text-center mb-8">
                  Initialize a new workspace to begin configuring neural networks and adversarial test scenarios.
                </p>
                <button 
                  onClick={() => setIsCreatingProject(true)}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20 hover:scale-105"
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
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-50 overflow-y-auto selection:bg-pink-500/30">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none invert" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-pink-400/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-400/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative w-full max-w-6xl px-8 py-16 animation-fade-in">
          {/* Header */}
          <div className="flex flex-col items-start mb-12">
            <button 
              onClick={() => setCurrentStep('workspace')}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-slate-500 hover:text-cyan-600 transition-all duration-300 shadow-sm mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Return to Directory</span>
            </button>
            <div className="flex items-center justify-between w-full">
              <div>
                <span className="text-[12px] text-pink-500 font-mono font-bold uppercase tracking-widest flex items-center gap-2">
                  <Folder className="w-3.5 h-3.5" /> Workspace: {selectedProject?.name}
                </span>
                <h1 className="text-4xl font-extrabold text-slate-800 mt-2">Project Sessions</h1>
              </div>
              <button 
                onClick={() => setCurrentStep('mode_selection')}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-pink-500 hover:opacity-90 text-white font-bold rounded-xl transition-all hover:scale-105 shadow-[0_10px_30px_rgba(6,182,212,0.3)]"
              >
                Initialize New Session
              </button>
            </div>
          </div>

          <div className="space-y-12">
            {/* Training Sessions */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <BrainCircuit className="text-cyan-500 w-6 h-6" /> Training Sessions
              </h2>
              {trainingSessions.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-300 rounded-2xl text-slate-400 text-center bg-white/50 backdrop-blur-sm">
                  No training sessions saved yet. Click "Initialize New Session" to start.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {trainingSessions.map(s => (
                    <div key={s.id} className="bg-white border border-slate-200 shadow-lg shadow-slate-200/50 p-6 rounded-2xl hover:border-cyan-300 hover:shadow-cyan-500/10 transition-all group relative">
                      <div className="absolute right-2 top-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenSessionMenuId(openSessionMenuId === s.id ? null : s.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {openSessionMenuId === s.id && (
                          <div className="absolute right-0 mt-1 w-44 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl z-20 py-1 border border-slate-200" onClick={e => e.stopPropagation()}>
                            {editingSessionId === s.id ? (
                               <button 
                                onClick={(e) => { e.stopPropagation(); handleRenameSession(selectedProject.id, s.id); }}
                                className="w-full text-left px-4 py-2 text-xs font-medium text-cyan-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
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
                                className="w-full text-left px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Rename
                              </button>
                            )}
                            <div className="h-px w-full bg-slate-100 my-1" />
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteSession(selectedProject.id, s.id); }}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-pink-500 hover:bg-pink-50 flex items-center gap-2 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="text-xs font-mono text-slate-400 mb-2">{new Date(s.createdAt).toLocaleString()}</div>
                      
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
                          className="bg-slate-50 border border-cyan-300 rounded-lg px-2 py-1 text-slate-800 font-bold w-full focus:outline-none focus:ring-2 focus:ring-cyan-500/20 mb-3"
                          autoFocus
                        />
                      ) : (
                        <div className="text-xl font-bold text-slate-800 mb-2 group-hover:text-cyan-600 transition-colors">{s.name || `Session ${s.id.slice(-4)}`}</div>
                      )}
                      
                      <div className="text-sm text-slate-500 mb-2">Generation: <span className="font-semibold text-slate-700">{s.generation}</span></div>
                      <div className="text-sm text-slate-500 mb-6">Best Fitness: <span className="text-cyan-600 font-mono font-bold">{s.fitness}</span></div>
                      <button 
                        onClick={() => onComplete({ project: selectedProject, mode: 'training', sessionData: s })}
                        className="w-full py-2 bg-slate-100 hover:bg-cyan-50 text-cyan-700 hover:text-cyan-600 border border-transparent hover:border-cyan-200 rounded-lg transition-colors font-semibold flex justify-center items-center gap-2"
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
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Car className="text-pink-500 w-6 h-6" /> Adversarial Sessions
              </h2>
              {adversarialSessions.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-300 rounded-2xl text-slate-400 text-center bg-white/50 backdrop-blur-sm">
                  No adversarial sessions saved yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {adversarialSessions.map(s => (
                    <div key={s.id} className="bg-white border border-slate-200 shadow-lg shadow-slate-200/50 p-6 rounded-2xl hover:border-pink-300 hover:shadow-pink-500/10 transition-all group relative">
                      <div className="absolute right-2 top-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenSessionMenuId(openSessionMenuId === s.id ? null : s.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {openSessionMenuId === s.id && (
                          <div className="absolute right-0 mt-1 w-44 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl z-20 py-1 border border-slate-200" onClick={e => e.stopPropagation()}>
                            {editingSessionId === s.id ? (
                               <button 
                                onClick={(e) => { e.stopPropagation(); handleRenameSession(selectedProject.id, s.id); }}
                                className="w-full text-left px-4 py-2 text-xs font-medium text-pink-500 hover:bg-slate-50 flex items-center gap-2 transition-colors"
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
                                className="w-full text-left px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Rename
                              </button>
                            )}
                            <div className="h-px w-full bg-slate-100 my-1" />
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteSession(selectedProject.id, s.id); }}
                              className="w-full text-left px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="text-xs font-mono text-slate-400 mb-2">{new Date(s.createdAt).toLocaleString()}</div>
                      
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
                          className="bg-slate-50 border border-pink-300 rounded-lg px-2 py-1 text-slate-800 font-bold w-full focus:outline-none focus:ring-2 focus:ring-pink-500/20 mb-3"
                          autoFocus
                        />
                      ) : (
                        <div className="text-xl font-bold text-slate-800 mb-2 group-hover:text-pink-600 transition-colors">{s.name || `Session ${s.id.slice(-4)}`}</div>
                      )}
                      
                      <div className="text-sm text-slate-500 mb-2">Generation: <span className="font-semibold text-slate-700">{s.generation}</span></div>
                      <div className="text-sm text-slate-500 mb-6">Best Fitness: <span className="text-pink-600 font-mono font-bold">{s.fitness}</span></div>
                      <button 
                        onClick={() => onComplete({ project: selectedProject, mode: 'adversarial', sessionData: s })}
                        className="w-full py-2 bg-slate-100 hover:bg-pink-50 text-pink-700 hover:text-pink-600 border border-transparent hover:border-pink-200 rounded-lg transition-colors font-semibold flex justify-center items-center gap-2"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 overflow-y-auto selection:bg-pink-500/30">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none invert" />
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-slate-50 to-pink-400/10 pointer-events-none" />
      
      <div className="relative w-full max-w-5xl px-8 py-12 animation-fade-in">
        
        {/* Nav & Title */}
        <div className="flex flex-col items-center text-center mb-16 space-y-4">
          <button 
            onClick={() => setCurrentStep('project_dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-slate-500 hover:text-cyan-600 transition-all duration-300 shadow-sm mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Return to Dashboard</span>
          </button>
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-pink-500 font-mono tracking-widest uppercase shadow-sm">
            <Folder className="w-3.5 h-3.5" /> {selectedProject?.name}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">Select Operational Suite</h1>
          <p className="text-slate-500 max-w-lg mx-auto text-lg">
            Choose the simulation mode for this workspace. You can train new neural pathways or inject existing brains into adversarial scenarios.
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Training Suite Card */}
          <button 
            onClick={() => onComplete({ project: selectedProject, mode: 'training' })}
            className="group relative text-left bg-white border border-slate-200 p-1 rounded-[2rem] hover:-translate-y-2 hover:border-cyan-400 hover:shadow-[0_20px_50px_rgba(6,182,212,0.15)] transition-all duration-500 shadow-xl shadow-slate-200/50"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-white/80 backdrop-blur-md p-10 rounded-[1.8rem] h-full flex flex-col justify-between overflow-hidden">
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-400/10 rounded-full blur-[60px] group-hover:bg-cyan-400/20 transition-colors duration-500" />
              
              <div>
                <div className="w-16 h-16 rounded-2xl mb-8 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 group-hover:bg-cyan-500 group-hover:text-white group-hover:border-cyan-400 group-hover:scale-110 transition-all duration-500 shadow-md">
                  <BrainCircuit className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black mb-4 text-slate-800 group-hover:text-cyan-600 transition-colors duration-300 tracking-tight">
                  Evolutionary Training
                </h3>
                <p className="text-base text-slate-500 leading-relaxed mb-8">
                  Deploy a population of agents utilizing genetic algorithms. The environment will forcefully evolve driving behaviors through mutation, crossover, and rigorous fitness selection over successive generations.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {['Genetic Algorithms', 'Neural Topology', 'Mutation Scaling'].map((tag, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-500 group-hover:border-cyan-300 group-hover:text-cyan-600 group-hover:bg-cyan-50 transition-colors">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </button>

          {/* Adversarial Suite Card */}
          <button 
            onClick={() => onComplete({ project: selectedProject, mode: 'adversarial' })}
            className="group relative text-left bg-white border border-slate-200 p-1 rounded-[2rem] hover:-translate-y-2 hover:border-pink-400 hover:shadow-[0_20px_50px_rgba(236,72,153,0.15)] transition-all duration-500 shadow-xl shadow-slate-200/50"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pink-400/10 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-white/80 backdrop-blur-md p-10 rounded-[1.8rem] h-full flex flex-col justify-between overflow-hidden">
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-pink-400/10 rounded-full blur-[60px] group-hover:bg-pink-400/20 transition-colors duration-500" />
              
              <div>
                <div className="w-16 h-16 rounded-2xl mb-8 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 group-hover:bg-pink-500 group-hover:text-white group-hover:border-pink-400 group-hover:scale-110 transition-all duration-500 shadow-md">
                  <Car className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black mb-4 text-slate-800 group-hover:text-pink-600 transition-colors duration-300 tracking-tight">
                  Adversarial Testing
                </h3>
                <p className="text-base text-slate-500 leading-relaxed mb-8">
                  Inject a pre-trained "Perfect Brain" into highly volatile scenarios. The simulation actively generates erratic edge-cases and hostile dynamics specifically designed to induce catastrophic failure.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {['Pre-trained Upload', 'Hostile Environment', 'Robustness Analysis'].map((tag, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-500 group-hover:border-pink-300 group-hover:text-pink-600 group-hover:bg-pink-50 transition-colors">
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
