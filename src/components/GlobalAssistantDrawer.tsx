import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Plus, 
  Mic, 
  MicOff, 
  Bot, 
  Users, 
  Maximize2, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Trash2,
  Check,
  Copy,
  AlertCircle
} from 'lucide-react';
import { HoloOrb } from './HoloOrb';
import { assistantService, AssistantMessage, AssistantPhase } from '../lib/assistantService';
import { omniVoice } from '../lib/omniVoice';

interface GlobalAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudioName?: string | null;
  onNavigateToDedicatedChat?: () => void;
}

export const GlobalAssistantDrawer: React.FC<GlobalAssistantDrawerProps> = ({
  isOpen,
  onClose,
  currentStudioName,
  onNavigateToDedicatedChat,
}) => {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [phase, setPhase] = useState<AssistantPhase>('idle');
  const [inputText, setInputText] = useState('');
  const [activeMode, setActiveMode] = useState<'normal' | 'council'>('normal');
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string; dataUrl: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Subscribe to shared assistant service
  useEffect(() => {
    const unsubMessages = assistantService.subscribeMessages(setMessages);
    const unsubPhase = assistantService.subscribePhase(setPhase);
    return () => {
      unsubMessages();
      unsubPhase();
    };
  }, []);

  // Sync studio context with assistant service
  useEffect(() => {
    if (currentStudioName) {
      assistantService.setStudioContext(currentStudioName);
    }
  }, [currentStudioName]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, phase, isOpen]);

  // Focus textarea when drawer opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ESC key listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    assistantService.notifyTyping();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        type: file.type,
        dataUrl: reader.result as string,
      });
      assistantService.notifyTyping();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Real Speech Recognition with honest capability reporting
  const handleToggleVoiceDictation = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      assistantService.setPhase('idle');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechNotice('Voice input is not supported in this browser. Please type your message.');
      setTimeout(() => setSpeechNotice(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        assistantService.setPhase('listening');
        setSpeechNotice(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          assistantService.notifyTyping();
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsRecording(false);
        assistantService.setPhase('idle');
        setSpeechNotice('Could not access microphone. Please check browser permissions.');
        setTimeout(() => setSpeechNotice(null), 4000);
      };

      recognition.onend = () => {
        setIsRecording(false);
        assistantService.setPhase('idle');
      };

      recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setIsRecording(false);
      assistantService.setPhase('idle');
      setSpeechNotice('Microphone access unavailable.');
      setTimeout(() => setSpeechNotice(null), 4000);
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !attachedFile) || phase === 'processing') return;

    const text = inputText;
    const file = attachedFile;

    setInputText('');
    setAttachedFile(null);

    const reply = await assistantService.sendMessage(
      text,
      activeMode,
      file,
      currentStudioName
    );

    if (reply && omniVoice.getVoiceEnabled() && activeMode === 'normal') {
      omniVoice.speak(reply.text);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusDisplay = () => {
    switch (phase) {
      case 'typing':
        return { label: 'Typing...', color: 'text-cyan-400' };
      case 'listening':
        return { label: 'Listening to Voice...', color: 'text-purple-400' };
      case 'processing':
        return { label: 'Thinking...', color: 'text-amber-400' };
      case 'responding':
        return { label: 'Responding...', color: 'text-cyan-300' };
      case 'error':
        return { label: 'Re-syncing...', color: 'text-rose-400' };
      case 'idle':
      default:
        return { label: 'Ready', color: 'text-emerald-400' };
    }
  };

  const status = getStatusDisplay();

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden flex justify-end font-sans select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Global OmniAI Assistant Panel"
    >
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Container (Right side on Desktop, Full/Slide on Mobile) */}
      <div className="relative w-full sm:w-[440px] max-w-full bg-[#080911] border-l border-white/10 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        
        {/* 1. Header with Living Orb, Studio Context & Quick Actions */}
        <header className="p-3.5 border-b border-white/10 bg-[#06070d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* The Living Primary Orb */}
            <HoloOrb phase={phase} size="sm" />
            
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bold text-xs font-mono tracking-wider text-white">
                  Omni<span className="text-[#00f2fe]">AI</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">•</span>
                <span className={`text-[10px] font-mono font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>

              {/* Active Studio Context Indicator */}
              <div className="flex items-center gap-1 text-[9.5px] font-mono text-slate-400 mt-1 truncate">
                <span className="text-cyan-400/90 font-semibold truncate">
                  {currentStudioName || 'Main Keyboard Station'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Expand to Full Page Dedicated Chat */}
            {onNavigateToDedicatedChat && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToDedicatedChat();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition"
                title="Open Dedicated Full-Screen Chat Room"
                aria-label="Open Full-Screen Chat"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}

            {/* Clear session */}
            <button
              onClick={() => assistantService.clearMessages()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition"
              title="Clear Conversation"
              aria-label="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close Drawer */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
              title="Close Assistant Panel (Esc)"
              aria-label="Close Assistant Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Studio Context Banner (Reinforces that OmniAI adapts to current studio) */}
        {currentStudioName && (
          <div className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-950/40 to-indigo-950/30 border-b border-cyan-500/20 flex items-center justify-between text-[10px] font-mono shrink-0">
            <span className="text-cyan-300/90 truncate flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">Adapted to: {currentStudioName}</span>
            </span>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider shrink-0 ml-2">Active Context</span>
          </div>
        )}

        {/* Speech / Permission Notice Banner */}
        {speechNotice && (
          <div className="px-3 py-2 bg-amber-950/50 border-b border-amber-500/30 text-amber-200 text-xs flex items-center gap-2 shrink-0 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px] leading-tight flex-1">{speechNotice}</span>
            <button onClick={() => setSpeechNotice(null)} className="p-0.5 text-amber-400 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* 2. Messages Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 select-text">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isCouncil = msg.sender === 'council';

            return (
              <div 
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
              >
                {/* Sender badge & timestamp */}
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-mono text-slate-400">
                  <span className={isUser ? 'text-slate-300 font-bold' : isCouncil ? 'text-purple-400 font-bold' : 'text-cyan-400 font-bold'}>
                    {isUser ? 'You' : isCouncil ? 'Multi-LLM Council' : 'OmniAI'}
                  </span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                  {msg.studioContext && (
                    <>
                      <span>•</span>
                      <span className="text-slate-500 truncate max-w-[140px]">{msg.studioContext}</span>
                    </>
                  )}
                </div>

                {/* Message Bubble */}
                <div 
                  className={`rounded-2xl p-3 text-xs leading-relaxed max-w-[90%] break-words relative group ${
                    isUser
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-md shadow-cyan-900/30'
                      : isCouncil
                      ? 'bg-[#120f20] border border-purple-500/30 text-slate-200 rounded-tl-none shadow-lg'
                      : 'bg-[#0f111c] border border-white/10 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  {/* Attached File Preview */}
                  {msg.attachedFile && (
                    <div className="mb-2 p-1.5 rounded-lg bg-black/40 border border-white/10 flex items-center gap-2">
                      {msg.attachedFile.dataUrl?.startsWith('data:image') && (
                        <img 
                          src={msg.attachedFile.dataUrl} 
                          alt="preview" 
                          className="w-10 h-10 rounded object-cover" 
                        />
                      )}
                      <span className="text-[10px] font-mono text-cyan-300 truncate">
                        {msg.attachedFile.name}
                      </span>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap font-sans">
                    {msg.text}
                  </div>

                  {/* Council Breakdown Details (if present) */}
                  {msg.councilData?.modelAnswers && (
                    <div className="mt-2.5 pt-2 border-t border-purple-500/20 space-y-1.5">
                      <div className="text-[9.5px] font-mono uppercase text-purple-300 font-bold">
                        Consensus Breakdown ({msg.councilData.consensusScore}% Agreement)
                      </div>
                      <div className="space-y-1">
                        {msg.councilData.modelAnswers.slice(0, 3).map((ma, idx) => (
                          <div key={idx} className="p-1.5 rounded bg-black/50 border border-white/5 text-[10.5px]">
                            <div className="flex items-center justify-between font-mono text-[9px] text-slate-400">
                              <span className="font-bold text-white">{ma.modelName}</span>
                              <span className="text-purple-400">{ma.roleBadge}</span>
                            </div>
                            <p className="mt-0.5 text-slate-300 line-clamp-2">{ma.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Copy Button */}
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="absolute -bottom-2 -right-2 p-1 rounded-md bg-slate-900 border border-white/10 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition shadow-sm"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Thinking / Responding live indicator inside the stream */}
          {phase === 'processing' && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0f111c] border border-amber-500/30 text-amber-300 text-xs w-fit animate-pulse">
              <HoloOrb phase="processing" size="xs" />
              <span className="font-mono text-[11px]">OmniAI is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 3. Input Console & Dual Mode Selector */}
        <footer className="p-3 bg-[#06070d] border-t border-white/10 shrink-0 space-y-2">
          {/* Top-right of prompt box: Mode Toggle [ Normal ] vs [ Council ] */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400">Routing Mode:</span>
            </div>

            <div className="flex items-center p-0.5 rounded-xl bg-black border border-white/10 shadow-inner">
              <button
                onClick={() => setActiveMode('normal')}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1 ${
                  activeMode === 'normal'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_10px_rgba(0,242,254,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bot className="w-3 h-3" />
                <span>Normal</span>
              </button>

              <button
                onClick={() => setActiveMode('council')}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1 ${
                  activeMode === 'council'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-[0_0_10px_rgba(127,0,255,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>Council</span>
              </button>
            </div>
          </div>

          {/* Attached file chip */}
          {attachedFile && (
            <div className="p-1.5 rounded-lg bg-slate-900 border border-cyan-500/40 flex items-center justify-between text-xs">
              <span className="text-cyan-300 font-mono text-[11px] truncate">{attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} className="text-slate-400 hover:text-rose-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* The Prompt Box */}
          <div className="flex items-end gap-1.5 bg-[#090b14] border border-white/10 focus-within:border-cyan-500/70 rounded-2xl p-1.5 shadow-inner transition-colors">
            {/* + sign at far left for file upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.txt,.json,.ts,.js,.py"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:text-cyan-400 active:scale-95 transition shrink-0"
              title="Upload file or image (+)"
              aria-label="Upload file"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Voice Dictation (Real Web Speech API with honest state) */}
            <button
              onClick={handleToggleVoiceDictation}
              className={`p-2 rounded-xl border transition shrink-0 ${
                isRecording
                  ? 'bg-purple-600/30 border-purple-500 text-purple-300 animate-pulse'
                  : 'bg-slate-900 border-white/5 text-slate-400 hover:text-cyan-400'
              }`}
              title={isRecording ? 'Stop Voice Recording' : 'Dictate with Voice'}
              aria-label="Voice Dictation"
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Input textarea */}
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                activeMode === 'council'
                  ? 'Ask the Multi-LLM Council a complex question...'
                  : currentStudioName
                  ? `Ask OmniAI about ${currentStudioName}...`
                  : 'Ask OmniAI anything...'
              }
              rows={1}
              className="flex-1 bg-transparent border-0 focus:ring-0 text-slate-100 placeholder-slate-500 text-xs resize-none py-2 px-1 focus:outline-none max-h-24 font-sans no-scrollbar"
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={(!inputText.trim() && !attachedFile) || phase === 'processing'}
              className={`p-2 rounded-xl font-bold transition shrink-0 ${
                activeMode === 'council'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md'
                  : 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 shadow-md'
              } disabled:opacity-25 active:scale-95`}
              title="Send message"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};
