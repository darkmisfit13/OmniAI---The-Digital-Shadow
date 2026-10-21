import React from 'react';
import { 
  Film, 
  Video, 
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
  ChevronLeft,
  Sparkles,
  Layers
} from 'lucide-react';

// Import all dedicated studios
import { OmniMotionStudio } from './studios/OmniMotionStudio';
import { OmniBeatStudio } from './studios/OmniBeatStudio';
import { OmniWaveStudio } from './studios/OmniWaveStudio';
import { OmniCodeStudio } from './studios/OmniCodeStudio';
import { OmniForgeStudio } from './studios/OmniForgeStudio';
import { OmniImagineStudio } from './studios/OmniImagineStudio';
import { OmniAnalyzerStudio } from './studios/OmniAnalyzerStudio';
import { OmniStyleStudio } from './studios/OmniStyleStudio';
import { OmniSpatial3DStudio } from './studios/OmniSpatial3DStudio';
import { OmniViralMockupStudio } from './studios/OmniViralMockupStudio';
import { OmniCosmicUILab } from './studios/OmniCosmicUILab';
import { OmniArchitectStudio } from './studios/OmniArchitectStudio';
import { OmniAutomationsStudio } from './studios/OmniAutomationsStudio';
import { OmniConnectCatalog } from './studios/OmniConnectCatalog';

export type StudioId = 
  | 'motion' 
  | 'beat' 
  | 'wave' 
  | 'imagine' 
  | 'code' 
  | 'forge' 
  | 'analyzer' 
  | 'style' 
  | 'spatial' 
  | 'mockup' 
  | 'cosmic' 
  | 'architect' 
  | 'automations' 
  | 'connect';

interface OmniStudiosViewProps {
  onInsertToKeyboard?: (text: string) => void;
  currentScreenName?: string;
  onSaveToVault?: (asset: any) => void;
  selectedStudio: StudioId;
  onSelectStudio?: (id: StudioId) => void;
  onBackToHome?: () => void;
  onOpenSidebar?: () => void;
  onOpenAssistant?: () => void;
}

export const studioMeta: Record<StudioId, { name: string; tag: string; icon: any; alias: string }> = {
  motion: { name: 'Midnight Motion', tag: 'Video Editing Studio', icon: Video, alias: 'OmniMotion' },
  beat: { name: 'Nocturne Visions', tag: 'AI Music Video Generator', icon: Film, alias: 'OmniBeat' },
  wave: { name: 'HoloTone', tag: 'AI Music Creation Studio', icon: Music, alias: 'OmniWave' },
  imagine: { name: 'Phantom Studio', tag: 'Image Editing & Enhancements', icon: Wand2, alias: 'OmniImagine' },
  code: { name: 'Cipher Core', tag: 'AI Code & Terminal IDE', icon: Code, alias: 'OmniCode' },
  forge: { name: 'OmniForge', tag: 'Full-Stack Component Studio', icon: Hammer, alias: 'OmniForge' },
  analyzer: { name: 'Prism Lens', tag: 'Site, UX & Content Auditor', icon: Search, alias: 'OmniAnalyzer' },
  style: { name: 'Velour', tag: 'Wardrobe, Fashion & Aesthetic Lab', icon: Shirt, alias: 'OmniStyle' },
  spatial: { name: 'Aether 3D', tag: 'Spatial Three.js Studio', icon: Rotate3d, alias: 'Spatial 3D' },
  mockup: { name: 'Viral Frame', tag: 'Social Media Mockup Studio', icon: Smartphone, alias: 'Viral Mockup' },
  cosmic: { name: 'Nova Canvas', tag: 'Generative UI Sandbox', icon: Palette, alias: 'Cosmic UI Lab' },
  architect: { name: 'Schema Matrix', tag: 'Database & API Architecture', icon: Database, alias: 'OmniArchitect' },
  automations: { name: 'Synapse Workflow', tag: 'Autonomous Multi-Agent Lab', icon: Workflow, alias: 'Automations' },
  connect: { name: 'Nexus Bridge', tag: 'Integration Catalog & OAuth Hub', icon: Network, alias: 'OmniConnect' },
};

export const OmniStudiosView: React.FC<OmniStudiosViewProps> = ({
  onInsertToKeyboard,
  currentScreenName,
  onSaveToVault,
  selectedStudio = 'motion',
  onSelectStudio,
  onBackToHome,
  onOpenSidebar,
  onOpenAssistant,
}) => {
  const meta = studioMeta[selectedStudio] || studioMeta.motion;
  const Icon = meta.icon;

  return (
    <div className="h-full flex flex-col bg-[#07090e] text-slate-100 overflow-hidden font-sans">
      
      {/* Sleek Mobile Studio Top Bar with Back & Switch Buttons */}
      <div className="h-11 px-3 bg-[#0a0d16] border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="p-1 -ml-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-0.5 text-xs font-semibold"
              aria-label="Back to main station"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-800">
            <Icon className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-xs text-white">{meta.name}</span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              — {meta.tag}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Ask OmniAI about this Studio */}
          {onOpenAssistant && (
            <button
              onClick={onOpenAssistant}
              className="px-2 py-1 rounded-lg bg-cyan-950/70 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-[10px] font-mono font-bold flex items-center gap-1 transition-all shadow-sm"
              title={`Ask OmniAI about ${meta.name}`}
            >
              <Sparkles className="w-3 h-3 text-[#00f2fe]" />
              <span className="hidden xs:inline">Ask Omni</span>
            </button>
          )}

          {/* Change Studio button */}
          {onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              aria-label="Switch studio"
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              <span className="hidden xs:inline">Switch</span>
            </button>
          )}
        </div>
      </div>

      {/* Render the Active Studio Component with studio-canvas layout */}
      <div className="flex-1 overflow-y-auto studio-canvas">
        {selectedStudio === 'motion' && <OmniMotionStudio onSaveToVault={onSaveToVault} />}
        {selectedStudio === 'beat' && <OmniBeatStudio onSaveToVault={onSaveToVault} />}
        {selectedStudio === 'wave' && <OmniWaveStudio onSaveToVault={onSaveToVault} />}
        {selectedStudio === 'code' && <OmniCodeStudio />}
        {selectedStudio === 'forge' && <OmniForgeStudio />}
        {selectedStudio === 'imagine' && <OmniImagineStudio onSaveToVault={onSaveToVault} />}
        {selectedStudio === 'analyzer' && <OmniAnalyzerStudio />}
        {selectedStudio === 'style' && <OmniStyleStudio onSaveToVault={onSaveToVault} />}
        {selectedStudio === 'spatial' && <OmniSpatial3DStudio />}
        {selectedStudio === 'mockup' && <OmniViralMockupStudio onSaveToVault={onSaveToVault} />}
        {selectedStudio === 'cosmic' && <OmniCosmicUILab />}
        {selectedStudio === 'architect' && <OmniArchitectStudio />}
        {selectedStudio === 'automations' && <OmniAutomationsStudio />}
        {selectedStudio === 'connect' && <OmniConnectCatalog />}
      </div>

    </div>
  );
};
