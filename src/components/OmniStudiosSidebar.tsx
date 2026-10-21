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
  Bot
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
}

export const OmniStudiosSidebar: React.FC<OmniStudiosSidebarProps> = ({
  isOpen,
  onClose,
  selectedStudio,
  onSelectStudio,
  onOpenOmniAIChat,
  onOpenSettings,
  onOpenVault,
}) => {
  const [pressedStudioId, setPressedStudioId] = useState<string | null>(null);

  if (!isOpen) return null;

  const studios = [
    { 
      id: 'motion', 
      name: 'OmniMotion', 
      desc: 'Video Editor & CapCut Timeline', 
      icon: Video, 
      accentColor: 'text-cyan-400' 
    },
    { 
      id: 'beat', 
      name: 'OmniBeat', 
      desc: 'Music Video & Beat Sync Engine', 
      icon: Film, 
      accentColor: 'text-purple-400' 
    },
    { 
      id: 'wave', 
      name: 'OmniWave', 
      desc: 'Full-Fidelity AI Song Producer', 
      icon: Music, 
      accentColor: 'text-amber-400' 
    },
    { 
      id: 'code', 
      name: 'OmniCode', 
      desc: 'Autonomous Coding & Stack Engine', 
      icon: Code, 
      accentColor: 'text-emerald-400' 
    },
    { 
      id: 'forge', 
      name: 'OmniForge', 
      desc: 'Full-Stack App & Component Builder', 
      icon: Hammer, 
      accentColor: 'text-indigo-400' 
    },
    { 
      id: 'imagine', 
      name: 'OmniImagine', 
      desc: 'Magic Eraser & Photo Alchemy', 
      icon: Wand2, 
      accentColor: 'text-pink-400' 
    },
    { 
      id: 'analyzer', 
      name: 'OmniAnalyzer', 
      desc: 'Site, UX & Social Media Auditor', 
      icon: Search, 
      accentColor: 'text-blue-400' 
    },
    { 
      id: 'style', 
      name: 'OmniStyle', 
      desc: 'Wardrobe, Fashion & Aesthetic Lab', 
      icon: Shirt, 
      accentColor: 'text-violet-400' 
    },
    { 
      id: 'spatial', 
      name: 'Spatial 3D', 
      desc: 'Three.js Volumetric Spatial Canvas', 
      icon: Rotate3d, 
      accentColor: 'text-teal-400' 
    },
    { 
      id: 'mockup', 
      name: 'Viral Mockup', 
      desc: 'Social Feed Safe Zones & Devices', 
      icon: Smartphone, 
      accentColor: 'text-rose-400' 
    },
    { 
      id: 'cosmic', 
      name: 'Cosmic UI Lab', 
      desc: 'Generative Interface Sandbox', 
      icon: Palette, 
      accentColor: 'text-fuchsia-400' 
    },
    { 
      id: 'architect', 
      name: 'OmniArchitect', 
      desc: 'Database & Backend API Schemas', 
      icon: Database, 
      accentColor: 'text-sky-400' 
    },
    { 
      id: 'automations', 
      name: 'Automations', 
      desc: 'Autonomous Multi-Agent Workflows', 
      icon: Workflow, 
      accentColor: 'text-yellow-400' 
    },
    { 
      id: 'connect', 
      name: 'OmniConnect', 
      desc: 'App Integrations & OAuth Hub', 
      icon: Network, 
      accentColor: 'text-emerald-400' 
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-start font-sans">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in"
      />

      {/* Slide-over Drawer from Left */}
      <div className="relative w-84 max-w-[88vw] bg-[#090b14] border-r border-slate-800/80 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        
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
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TOP PROMINENT BUTTON: OmniAI - Your Digital Shadow */}
        <div className="p-3 border-b border-slate-800/80 bg-gradient-to-b from-[#0c0f1c] to-[#090b14] shrink-0">
          <button
            onClick={() => {
              onOpenOmniAIChat?.();
              onClose();
            }}
            className="w-full p-3 rounded-2xl studio-keycap-3d text-left transition-all group flex items-center gap-3 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#00f2fe]"
          >
            <div className="w-10 h-10 rounded-xl bg-black border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-inner">
              <HoloOrb phase="idle" size="xs" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-sm text-white tracking-wide group-hover:text-cyan-300 transition-colors">
                  OmniAI
                </h2>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-bold">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 tracking-normal font-sans mt-0.5">
                Your Digital Shadow
              </p>
            </div>

            <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>
        </div>

        {/* Studios Section Header */}
        <div className="px-3.5 pt-3 pb-1.5 flex items-center justify-between text-[10px] font-mono uppercase text-slate-400 font-bold shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#00f2fe]" />
            <span>CREATIVE STUDIOS ({studios.length})</span>
          </div>
          <span className="text-[9px] text-cyan-400/80 lowercase">spur-of-moment</span>
        </div>

        {/* Studios List with 3D Keycap Edge Highlighting */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-2 no-scrollbar">
          {studios.map((st) => {
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
              >
                {/* 3D Icon Hull */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner transition-colors ${
                  isSelected 
                    ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300' 
                    : 'bg-black/60 group-hover:border-white/20'
                } ${st.accentColor}`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Studio Typography: Prominently bold name & plain-language description */}
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

                {/* Dimensional Chevron */}
                <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                  isSelected ? 'text-[#00f2fe]' : 'text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5'
                }`} />
              </button>
            );
          })}
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
    </div>
  );
};

