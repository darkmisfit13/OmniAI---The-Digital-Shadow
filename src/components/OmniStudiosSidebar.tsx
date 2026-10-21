import React, { useState } from 'react';
import { 
  X, 
  Video, 
  Film, 
  Music, 
  Code, 
  Hammer, 
  Wand2, 
  Search, 
  Shirt, 
  Rotate3d, 
  Smartphone, 
  Palette, 
  Database, 
  Workflow, 
  Network, 
  Sparkles, 
  ChevronRight, 
  Settings, 
  FolderLock, 
  Mic, 
  Layers, 
  Terminal, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Cpu
} from 'lucide-react';
import { StudioId } from './OmniStudiosView';
import { HoloOrb } from './HoloOrb';

interface OmniStudiosSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudio: StudioId | null;
  onSelectStudio: (id: StudioId) => void;
  onOpenOmniAIChat?: () => void;
  onOpenSettings?: () => void;
  onOpenVault?: () => void;
  onOpenPlannedStudio?: (studioName: string, studioDesc: string) => void;
  isChatActive?: boolean;
}

export const OmniStudiosSidebar: React.FC<OmniStudiosSidebarProps> = ({
  isOpen,
  onClose,
  selectedStudio,
  onSelectStudio,
  onOpenOmniAIChat,
  onOpenSettings,
  onOpenVault,
  onOpenPlannedStudio,
  isChatActive = false,
}) => {
  const [pressedStudioId, setPressedStudioId] = useState<string | null>(null);
  const [isPlannedExpanded, setIsPlannedExpanded] = useState(true);
  const [selectedPlannedModal, setSelectedPlannedModal] = useState<{ name: string; desc: string; plannedDetails: string } | null>(null);

  if (!isOpen) return null;

  // 14 Core Functional Studios
  const coreStudios = [
    { 
      id: 'motion', 
      name: 'Midnight Motion', 
      desc: 'Video Editing Studio', 
      alias: 'OmniMotion',
      icon: Video, 
      accentColor: 'text-cyan-400' 
    },
    { 
      id: 'beat', 
      name: 'Nocturne Visions', 
      desc: 'AI Music Video Generator', 
      alias: 'OmniBeat',
      icon: Film, 
      accentColor: 'text-purple-400' 
    },
    { 
      id: 'wave', 
      name: 'HoloTone', 
      desc: 'AI Music Creation Studio', 
      alias: 'OmniWave',
      icon: Music, 
      accentColor: 'text-amber-400' 
    },
    { 
      id: 'imagine', 
      name: 'Phantom Studio', 
      desc: 'Image Editing & Enhancements', 
      alias: 'OmniImagine',
      icon: Wand2, 
      accentColor: 'text-pink-400' 
    },
    { 
      id: 'code', 
      name: 'Cipher Core', 
      desc: 'AI Code & Terminal IDE', 
      alias: 'OmniCode',
      icon: Code, 
      accentColor: 'text-emerald-400' 
    },
    { 
      id: 'forge', 
      name: 'OmniForge', 
      desc: 'Full-Stack Component Studio', 
      alias: 'OmniForge',
      icon: Hammer, 
      accentColor: 'text-indigo-400' 
    },
    { 
      id: 'analyzer', 
      name: 'Prism Lens', 
      desc: 'Site, UX & Content Auditor', 
      alias: 'OmniAnalyzer',
      icon: Search, 
      accentColor: 'text-blue-400' 
    },
    { 
      id: 'style', 
      name: 'Velour', 
      desc: 'Wardrobe, Fashion & Aesthetic Lab', 
      alias: 'OmniStyle',
      icon: Shirt, 
      accentColor: 'text-violet-400' 
    },
    { 
      id: 'spatial', 
      name: 'Aether 3D', 
      desc: 'Spatial Three.js Studio', 
      alias: 'Spatial 3D',
      icon: Rotate3d, 
      accentColor: 'text-teal-400' 
    },
    { 
      id: 'mockup', 
      name: 'Viral Frame', 
      desc: 'Social Media Mockup Studio', 
      alias: 'Viral Mockup',
      icon: Smartphone, 
      accentColor: 'text-rose-400' 
    },
    { 
      id: 'cosmic', 
      name: 'Nova Canvas', 
      desc: 'Generative UI Sandbox', 
      alias: 'Cosmic UI Lab',
      icon: Palette, 
      accentColor: 'text-fuchsia-400' 
    },
    { 
      id: 'architect', 
      name: 'Schema Matrix', 
      desc: 'Database & API Architecture', 
      alias: 'OmniArchitect',
      icon: Database, 
      accentColor: 'text-sky-400' 
    },
    { 
      id: 'automations', 
      name: 'Synapse Workflow', 
      desc: 'Autonomous Multi-Agent Lab', 
      alias: 'Automations',
      icon: Workflow, 
      accentColor: 'text-yellow-400' 
    },
    { 
      id: 'connect', 
      name: 'Nexus Bridge', 
      desc: 'Integration Catalog & OAuth Hub', 
      alias: 'OmniConnect',
      icon: Network, 
      accentColor: 'text-emerald-400' 
    },
  ];

  // 4 Planned Studios on Product Roadmap
  const plannedStudios = [
    {
      id: 'echovoid',
      name: 'Echo Void — Voice Studio',
      desc: 'AI Voice Cloning & Vocal Synthesis',
      icon: Mic,
      plannedDetails: 'Planned studio for expressive voice synthesis, custom tone cloning, lyric performance tracking, and emotional cadence modulation.',
      accentColor: 'text-cyan-400',
    },
    {
      id: 'sceneweaver',
      name: 'Scene Weaver — Storyboard Studio',
      desc: 'Generative Storyboarding & Shot Lists',
      icon: Film,
      plannedDetails: 'Planned studio for visual scene-by-scene storyboarding, camera angle prompt generation, script breakdowns, and cinematic flow visualization.',
      accentColor: 'text-purple-400',
    },
    {
      id: 'glyphforge',
      name: 'Glyph Forge — Brand Asset Studio',
      desc: 'Vector Iconography & Brand Typography',
      icon: Sparkles,
      plannedDetails: 'Planned studio for custom SVG glyph creation, geometric dark-aesthetic branding assets, monograms, and typography systems.',
      accentColor: 'text-pink-400',
    },
    {
      id: 'promptforge',
      name: 'Prompt Forge — Prompt Engineering Studio',
      desc: 'System Prompt Architect & Optimizer',
      icon: Terminal,
      plannedDetails: 'Planned studio for meta-prompt crafting, benchmark prompt evaluation, chain-of-thought engineering, and LLM behavior tuning.',
      accentColor: 'text-emerald-400',
    },
  ];

  const handlePlannedClick = (st: typeof plannedStudios[0]) => {
    if (onOpenPlannedStudio) {
      onOpenPlannedStudio(st.name, st.desc);
      onClose();
    } else {
      setSelectedPlannedModal(st);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden flex justify-start font-sans select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Omni Studios Navigation Drawer"
    >
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-over Drawer from Left */}
      <div className="relative w-88 max-w-[90vw] bg-[#090b14] border-r border-slate-800/80 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        
        {/* Drawer Header */}
        <div className="p-3.5 border-b border-slate-800 bg-[#07090f] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00f2fe] animate-pulse shadow-[0_0_8px_#00f2fe]" />
            <h3 className="font-bold text-xs font-mono uppercase tracking-widest text-slate-300">
              Omni Studios Drawer
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-[#00f2fe] transition-all"
            title="Close Drawer"
            aria-label="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TOP PROMINENT BUTTON: OmniAI Workspace - Full-Page Dedicated Experience */}
        <div className="p-3 border-b border-slate-800/80 bg-gradient-to-b from-[#0c0f1c] to-[#090b14] shrink-0">
          <button
            onClick={() => {
              onOpenOmniAIChat?.();
              onClose();
            }}
            className={`w-full p-3 rounded-2xl studio-keycap-3d text-left transition-all group flex items-center gap-3 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#00f2fe] ${
              isChatActive ? 'active-studio' : ''
            }`}
            aria-label="Open OmniAI Full-Page Conversation Workspace"
          >
            <div className={`w-10 h-10 rounded-xl bg-black border flex items-center justify-center shrink-0 shadow-inner ${
              isChatActive ? 'border-cyan-400 bg-cyan-950/80' : 'border-cyan-500/40'
            }`}>
              <HoloOrb phase="idle" size="xs" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-sm text-white tracking-wide group-hover:text-cyan-300 transition-colors">
                  OmniAI Workspace
                </h2>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold border ${
                  isChatActive 
                    ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_8px_rgba(0,242,254,0.4)]'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}>
                  {isChatActive ? 'ACTIVE' : 'WORKSPACE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 tracking-normal font-sans mt-0.5">
                Full-Page Conversation Workspace
              </p>
            </div>

            <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
              isChatActive ? 'text-[#00f2fe]' : 'text-cyan-400 group-hover:translate-x-0.5'
            }`} />
          </button>
        </div>

        {/* Scrollable Studios Container */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 no-scrollbar">
          
          {/* Section 1: 14 Core Functional Studios */}
          <div>
            <div className="px-1 pb-2 flex items-center justify-between text-[10px] font-mono uppercase text-slate-400 font-bold">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#00f2fe]" />
                <span>CORE STUDIOS ({coreStudios.length})</span>
              </div>
              <span className="text-[9px] text-cyan-400/80 lowercase">functional</span>
            </div>

            <div className="space-y-2">
              {coreStudios.map((st) => {
                const Icon = st.icon;
                const isSelected = selectedStudio === st.id;
                const isPressed = pressedStudioId === st.id;

                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      onSelectStudio(st.id as StudioId);
                      onClose();
                    }}
                    onTouchStart={() => setPressedStudioId(st.id)}
                    onTouchEnd={() => setPressedStudioId(null)}
                    onMouseDown={() => setPressedStudioId(st.id)}
                    onMouseUp={() => setPressedStudioId(null)}
                    onMouseLeave={() => setPressedStudioId(null)}
                    className={`w-full p-2.5 rounded-2xl studio-keycap-3d flex items-center gap-3 text-left group transition-all select-none ${
                      isSelected ? 'active-studio' : ''
                    } ${isPressed ? 'pressed' : ''}`}
                    aria-label={`Open studio ${st.name} — ${st.desc}`}
                  >
                    {/* 3D Icon Hull */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner transition-colors ${
                      isSelected 
                        ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300' 
                        : 'bg-black/60 group-hover:border-white/20'
                    } ${st.accentColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Studio Typography: Prominent name & plain-language description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white tracking-tight truncate group-hover:text-cyan-200 transition-colors">
                          {st.name}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 font-bold ml-1 shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-normal leading-tight mt-0.5 truncate group-hover:text-slate-300 transition-colors">
                        {st.desc}
                      </p>
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'text-[#00f2fe]' : 'text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: 4 Planned Studios on Roadmap */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={() => setIsPlannedExpanded(!isPlannedExpanded)}
              className="w-full px-1 pb-2 flex items-center justify-between text-[10px] font-mono uppercase text-slate-400 hover:text-slate-200 font-bold transition"
            >
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-purple-400" />
                <span>PLANNED STUDIOS ({plannedStudios.length})</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30 lowercase">
                  roadmap
                </span>
                {isPlannedExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </div>
            </button>

            {isPlannedExpanded && (
              <div className="space-y-2">
                {plannedStudios.map((st) => {
                  const Icon = st.icon;

                  return (
                    <button
                      key={st.id}
                      onClick={() => handlePlannedClick(st)}
                      className="w-full p-2.5 rounded-2xl bg-[#0b0c16]/70 border border-purple-500/20 hover:border-purple-500/50 flex items-center gap-3 text-left group transition-all opacity-85 hover:opacity-100"
                      aria-label={`View planned studio ${st.name}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-black/50 border border-purple-500/30 ${st.accentColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-200 truncate group-hover:text-purple-300 transition-colors">
                            {st.name}
                          </span>
                          <span className="text-[8.5px] font-mono px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30 uppercase font-bold shrink-0 ml-1">
                            Planned
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5 truncate">
                          {st.desc}
                        </p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-purple-500/60 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* BOTTOM SECTION: SETTINGS BLOCK & GLOBAL VAULT */}
        <div className="p-3 border-t border-slate-800 bg-[#07090f] space-y-2 shrink-0">
          {/* Settings block/button with 3D Keycap styling */}
          <button
            onClick={() => {
              onClose();
              onOpenSettings?.();
            }}
            className="w-full py-2.5 px-3 rounded-2xl studio-keycap-3d text-slate-200 hover:text-white flex items-center justify-between transition-all group active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#00f2fe]"
            aria-label="Open Settings and Admin Hub"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-cyan-950/70 border border-cyan-800/60 text-cyan-400 flex items-center justify-center shrink-0 group-hover:text-cyan-300 group-hover:border-cyan-500/60 transition-colors">
                <Settings className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <span className="block font-bold text-xs text-white">Settings & Admin</span>
                <span className="text-[10px] text-slate-400 block font-normal truncate">
                  Preferences, Workspace, PC Sync, Council Keys
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 shrink-0" />
          </button>

          {/* Vault Quick Access with 3D Keycap styling */}
          {onOpenVault && (
            <button
              onClick={() => {
                onClose();
                onOpenVault();
              }}
              className="w-full py-2 px-3 rounded-2xl studio-keycap-3d text-purple-300 hover:text-purple-200 text-xs font-medium flex items-center justify-between transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-purple-400"
              aria-label="Open Global Vault Media Library"
            >
              <div className="flex items-center gap-2">
                <FolderLock className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-semibold text-xs text-white">Global Vault Media Library</span>
              </div>
              <span className="text-[9px] font-mono text-purple-400/90 font-bold">Shared</span>
            </button>
          )}
        </div>

      </div>

      {/* Planned Studio Info Modal */}
      {selectedPlannedModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0b0c16] border border-purple-500/40 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40 font-mono text-[9px] uppercase font-bold">
                  Roadmap Studio
                </span>
              </div>
              <button 
                onClick={() => setSelectedPlannedModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{selectedPlannedModal.name}</h3>
              <p className="text-xs text-cyan-400 font-mono mt-0.5">{selectedPlannedModal.desc}</p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">
              {selectedPlannedModal.plannedDetails}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedPlannedModal(null);
                  onClose();
                  onOpenPlannedStudio?.(selectedPlannedModal.name, selectedPlannedModal.desc);
                }}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Brainstorm in OmniAI</span>
              </button>
              <button
                onClick={() => setSelectedPlannedModal(null)}
                className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
