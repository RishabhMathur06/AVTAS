import { useState } from 'react';
import { X, FolderPlus, Settings, LayoutGrid, Eye, Activity, Database, FolderOpen } from 'lucide-react';

export default function ProjectSidebar({ 
  isOpen, 
  onClose, 
  currentProject, 
  simMode = 'training',
  onOpenProjectList,
  onOpenSettings,
  onSwitchProject 
}) {
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" 
        onClick={onClose}
      />
      <div className="fixed top-0 left-0 h-full w-80 bg-zinc-950 border-r border-zinc-900 z-[101] flex flex-col shadow-2xl transform transition-transform duration-300">
        
        {/* Header - Current Project Name */}
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-500">
            <LayoutGrid className="w-5 h-5" />
            <h2 className="text-sm font-bold tracking-wider text-white uppercase truncate max-w-[180px]" title={currentProject?.name || 'Workspace'}>
              {currentProject?.name || 'Workspace'}
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Views are now nested inside the SimulationPage right panel */}

          {/* Project Management */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Project Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={() => {
                  onClose();
                  onOpenProjectList();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm font-medium text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900 transition-colors"
              >
                <FolderOpen className="w-4 h-4 text-zinc-500" />
                Open Project
              </button>

              {isCreating ? (
                <div className="space-y-2 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                  <input 
                    type="text"
                    placeholder="Project name..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500 mb-2"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={handleCreateProject} className="flex-1 px-3 py-1.5 bg-amber-500 text-black font-bold text-xs rounded-lg hover:bg-amber-400 transition-colors">
                      Save
                    </button>
                    <button onClick={() => setIsCreating(false)} className="flex-1 px-3 py-1.5 bg-zinc-800 text-zinc-300 font-bold text-xs rounded-lg hover:bg-zinc-700 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm font-medium text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900 transition-colors"
                >
                  <FolderPlus className="w-4 h-4 text-zinc-500" />
                  Create New Project
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Settings Footer */}
        <div className="p-6 border-t border-zinc-900 bg-zinc-950/50">
          <button 
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
          >
            <Settings className="w-5 h-5 text-zinc-500" />
            Settings
          </button>
        </div>

      </div>
    </>
  );
}
