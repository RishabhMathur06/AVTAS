import { useState, useEffect } from 'react';
import { X, FolderPlus, Settings, LayoutGrid, Activity, Database, FolderOpen, Play } from 'lucide-react';

export default function ProjectSidebar({ 
  isOpen, 
  onClose, 
  currentProject, 
  currentSessionId,
  onLoadSession,
  simMode = 'training',
  onOpenProjectList,
  onOpenSettings,
  onSwitchProject 
}) {
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [projectData, setProjectData] = useState(null);

  useEffect(() => {
    if (isOpen && currentProject?.id) {
      fetch(`/api/projects/${currentProject.id}`)
        .then(res => res.json())
        .then(data => setProjectData(data))
        .catch(err => console.error("Failed to fetch project data", err));
    }
  }, [isOpen, currentProject]);

  const handleCreateProject = async () => {
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
      setNewProjectName('');
      setIsCreating(false);
      onSwitchProject(savedProject);
    } catch (err) {
      console.error("Failed to create project", err);
    }
  };

  if (!isOpen) return null;

  const sessions = projectData?.sessions || currentProject?.sessions || [];
  const trainingSessions = sessions.filter(s => s.mode === 'training');
  const adversarialSessions = sessions.filter(s => s.mode === 'adversarial');

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" 
        onClick={onClose}
      />
      <div className="fixed top-0 left-0 h-full w-80 bg-white border-r border-slate-200 z-[101] flex flex-col shadow-2xl transform transition-transform duration-300">
        
        {/* Header - Current Project Name */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-500">
            <LayoutGrid className="w-5 h-5" />
            <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase truncate max-w-[180px]" title={currentProject?.name || 'Workspace'}>
              {currentProject?.name || 'Workspace'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          <div className="space-y-6">
            {/* Training Sessions */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Activity className="w-3.5 h-3.5" /> Vehicle Training
              </h3>
              <div className="space-y-2">
                {trainingSessions.length > 0 ? trainingSessions.map(session => {
                  const isActive = currentSessionId === session.id;
                  return (
                    <button 
                      key={session.id}
                      onClick={() => onLoadSession(projectData || currentProject, 'training', session)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between border ${
                        isActive 
                          ? 'bg-cyan-50 border-cyan-200 text-cyan-700 shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span className="truncate pr-2 font-medium">{session.name || `Session ${session.id.slice(-4)}`}</span>
                      {isActive && <span className="text-[9px] font-bold uppercase tracking-wider bg-cyan-500 text-white px-1.5 py-0.5 rounded">Active</span>}
                    </button>
                  );
                }) : (
                  <div className="text-xs text-slate-400 italic">No training sessions found.</div>
                )}
              </div>
            </div>

            {/* Adversarial Sessions */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Database className="w-3.5 h-3.5" /> Adversarial Test
              </h3>
              <div className="space-y-2">
                {adversarialSessions.length > 0 ? adversarialSessions.map(session => {
                  const isActive = currentSessionId === session.id;
                  return (
                    <button 
                      key={session.id}
                      onClick={() => onLoadSession(projectData || currentProject, 'adversarial', session)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between border ${
                        isActive 
                          ? 'bg-pink-50 border-pink-200 text-pink-700 shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span className="truncate pr-2 font-medium">{session.name || `Session ${session.id.slice(-4)}`}</span>
                      {isActive && <span className="text-[9px] font-bold uppercase tracking-wider bg-pink-500 text-white px-1.5 py-0.5 rounded">Active</span>}
                    </button>
                  );
                }) : (
                  <div className="text-xs text-slate-400 italic">No adversarial sessions found.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-2">
          <button 
            onClick={() => {
              onClose();
              onOpenProjectList();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-md font-mono uppercase tracking-wider mb-2"
            title="Back to Workspace Dashboard"
          >
            <LayoutGrid className="w-4 h-4 text-cyan-400" />
            <span>Workspaces</span>
          </button>

          <button 
            onClick={() => {
              onClose();
              onOpenProjectList();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-100 transition-colors shadow-sm"
          >
            <FolderOpen className="w-4 h-4 text-slate-500" />
            Open Project
          </button>

          {isCreating ? (
            <div className="space-y-2 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
              <input 
                type="text"
                placeholder="Project name..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-cyan-500 mb-2"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={handleCreateProject} className="flex-1 px-3 py-1.5 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white font-bold text-xs rounded-lg hover:from-cyan-500 hover:to-cyan-600 transition-colors shadow-sm">
                  Save
                </button>
                <button onClick={() => setIsCreating(false)} className="flex-1 px-3 py-1.5 bg-slate-200 text-slate-600 font-bold text-xs rounded-lg hover:bg-slate-300 transition-colors shadow-sm">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-100 transition-colors shadow-sm"
            >
              <FolderPlus className="w-4 h-4 text-slate-500" />
              Create New Project
            </button>
          )}

          <button 
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 mt-2 rounded-xl border border-transparent text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all shadow-sm"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            Settings
          </button>
        </div>

      </div>
    </>
  );
}
