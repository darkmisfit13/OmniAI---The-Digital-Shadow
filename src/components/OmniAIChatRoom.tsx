import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  ChevronLeft, 
  Plus, 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  Users, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Trash2,
  Bot,
  AlertCircle,
  MessageSquare,
  Clock,
  Layers,
  Code as CodeIcon
} from 'lucide-react';
import { HoloOrb } from './HoloOrb';
import { assistantService, AssistantMessage, AssistantPhase, Conversation } from '../lib/assistantService';
import { omniVoice } from '../lib/omniVoice';

export interface OmniAIChatRoomHandle {
  focusComposer: () => void;
}

interface OmniAIChatRoomProps {
  onBackToPrevious?: () => void;
  onBackToMain?: () => void;
  previousDestinationName?: string;
  onOpenSidebar?: () => void;
  onInsertToKeyboard?: (text: string) => void;
  onSaveToVault?: (asset: { title: string; content: string; type: string; timestamp?: string }) => void;
}

export const OmniAIChatRoom = forwardRef<OmniAIChatRoomHandle, OmniAIChatRoomProps>(({
  onBackToPrevious,
  onBackToMain,
  previousDestinationName = 'Keys',
  onOpenSidebar,
  onInsertToKeyboard,
  onSaveToVault,
}, ref) => {
  const handleBack = onBackToMain || onBackToPrevious;
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string>('');
  const [orbPhase, setOrbPhase] = useState<AssistantPhase>('idle');
  const [activeMode, setActiveMode] = useState<'normal' | 'council'>('normal');
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string; dataUrl: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<string | null>(null);
  const [expandedCouncilCards, setExpandedCouncilCards] = useState<Record<string, boolean>>({});
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [isConvoDropdownOpen, setIsConvoDropdownOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Expose focusComposer to parent
  useImperativeHandle(ref, () => ({
    focusComposer: () => {
      textareaRef.current?.focus();
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    },
  }));

  // Synchronize with shared AssistantService
  useEffect(() => {
    const unsubConvos = assistantService.subscribeConversations((convos, activeId) => {
      setConversations(convos);
      setActiveConvoId(activeId);
    });

    const unsubMessages = assistantService.subscribeMessages(setMessages);
    const unsubPhase = assistantService.subscribePhase(setOrbPhase);

    return () => {
      unsubConvos();
      unsubMessages();
      unsubPhase();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, orbPhase]);

  const activeConversation = conversations.find(c => c.id === activeConvoId) || conversations[0];

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

  // Real Web Speech API with honest browser capability detection
  const handleToggleMic = () => {
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
      setSpeechNotice('Microphone speech recognition is not supported in this browser. Please type your message.');
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
      setSpeechNotice('Microphone access is unavailable.');
      setTimeout(() => setSpeechNotice(null), 4000);
    }
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !attachedFile) || orbPhase === 'processing') return;

    const userText = inputText;
    const currentAttachment = attachedFile;

    setInputText('');
    setAttachedFile(null);

    const reply = await assistantService.sendMessage(
      userText,
      activeMode,
      currentAttachment
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

  const handleCopyCode = (codeKey: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(codeKey);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  const toggleExpandCouncil = (id: string) => {
    setExpandedCouncilCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Structured response & code block formatting
  const renderMessageContent = (text: string, msgId: string) => {
    // Check for markdown code blocks (```lang ... ```)
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let blockIndex = 0;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index),
        });
      }

      parts.push({
        type: 'code',
        language: match[1] || 'code',
        content: match[2].trim(),
        key: `${msgId}-code-${blockIndex++}`,
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex),
      });
    }

    if (parts.length === 0) {
      return <div className="whitespace-pre-wrap font-sans">{text}</div>;
    }

    return (
      <div className="space-y-2.5 font-sans leading-relaxed">
        {parts.map((p, i) => {
          if (p.type === 'code') {
            const isCopied = copiedCodeIdx === p.key;
            return (
              <div key={i} className="my-2 rounded-xl bg-black/80 border border-slate-700/80 overflow-hidden shadow-inner font-mono text-xs">
                <div className="px-3 py-1.5 bg-[#090b14] border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-cyan-300">
                    <CodeIcon className="w-3.5 h-3.5" />
                    <span>{p.language || 'Code snippet'}</span>
                  </span>
                  <button
                    onClick={() => handleCopyCode(p.key!, p.content)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 hover:text-white transition"
                    title="Copy code"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 overflow-x-auto text-slate-200 text-[11.5px] leading-relaxed selection:bg-cyan-500/30">
                  <code>{p.content}</code>
                </pre>
              </div>
            );
          }
          return (
            <div key={i} className="whitespace-pre-wrap">
              {p.content}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#05060a] text-slate-100 overflow-hidden font-sans select-none relative">
      
      {/* 1. DEDICATED WORKSPACE SUBHEADER / TOOLBAR (Complements global header without duplicate orbs) */}
      <div className="px-3.5 py-2 bg-[#090b14] border-b border-white/10 flex items-center justify-between shrink-0 z-20 shadow-md">
        
        {/* Left: Return Navigation & Conversation Switcher */}
        <div className="flex items-center gap-2 min-w-0">
          {handleBack && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white transition active:scale-95 shrink-0"
              title={`Return to ${previousDestinationName}`}
              aria-label={`Return to ${previousDestinationName}`}
            >
              <ChevronLeft className="w-4 h-4 text-cyan-400" />
              <span className="truncate max-w-[130px]">
                {previousDestinationName}
              </span>
            </button>
          )}

          {/* Conversation Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsConvoDropdownOpen(!isConvoDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 border border-white/10 hover:border-cyan-500/40 text-xs font-mono transition text-slate-200"
              title="Switch or manage conversation sessions"
              aria-label="Conversation sessions menu"
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-[180px] font-semibold text-white">
                {activeConversation?.title || 'Session'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {isConvoDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-64 bg-[#0a0d18] border border-cyan-500/30 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in">
                <div className="flex items-center justify-between pb-1.5 px-1 border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase font-bold">
                  <span>Sessions ({conversations.length})</span>
                  <button
                    onClick={() => {
                      assistantService.createNewConversation();
                      setIsConvoDropdownOpen(false);
                    }}
                    className="flex items-center gap-1 text-cyan-400 hover:text-white font-bold"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Session</span>
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto py-1 space-y-1 no-scrollbar">
                  {conversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        assistantService.switchConversation(c.id);
                        setIsConvoDropdownOpen(false);
                      }}
                      className={`w-full p-2 rounded-xl text-left text-xs transition flex items-center justify-between ${
                        c.id === activeConvoId
                          ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-200'
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-semibold truncate text-[11px] text-white">{c.title}</p>
                        <p className="text-[9px] font-mono text-slate-500">{c.updatedAt} • {c.messages.length} msgs</p>
                      </div>
                      {c.id === activeConvoId && (
                        <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Studio Context Badge & Clear Action */}
        <div className="flex items-center gap-1.5 shrink-0">
          {activeConversation?.studioContext && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/50 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span className="truncate max-w-[140px]">{activeConversation.studioContext}</span>
            </div>
          )}

          {/* Voice Output Toggle */}
          <button
            onClick={() => {
              const next = omniVoice.toggleVoice();
              if (next) omniVoice.speak('Voice frequency active.');
            }}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 transition"
            title="Toggle Voice Synthesizer"
            aria-label="Toggle Voice"
          >
            {omniVoice.getVoiceEnabled() ? (
              <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          {/* Clear Current Session */}
          <button
            onClick={() => assistantService.clearCurrentConversation()}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition"
            title="Clear Current Conversation"
            aria-label="Clear Conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Speech Notice Banner */}
      {speechNotice && (
        <div className="px-3 py-1.5 bg-amber-950/60 border-b border-amber-500/30 text-amber-200 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px]">{speechNotice}</span>
          </div>
          <button onClick={() => setSpeechNotice(null)} className="text-amber-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. SPACIOUS CONVERSATION STREAM */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar select-text">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isCouncil = msg.sender === 'council';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              {/* Message Header */}
              <div className="flex items-center gap-2 mb-1 px-1 text-[11px] font-mono text-slate-400">
                <span
                  className={
                    isUser
                      ? 'text-cyan-400 font-bold'
                      : isCouncil
                      ? 'text-purple-400 font-bold'
                      : 'text-slate-200 font-bold'
                  }
                >
                  {isUser ? 'You' : isCouncil ? 'Unified Multi-LLM Council' : 'OmniAI'}
                </span>
                <span>•</span>
                <span>{msg.timestamp}</span>
                {msg.studioContext && (
                  <>
                    <span>•</span>
                    <span className="text-slate-500">{msg.studioContext}</span>
                  </>
                )}
              </div>

              {/* Message Card */}
              <div
                className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed max-w-[92%] sm:max-w-[85%] break-words relative group ${
                  isUser
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-lg shadow-cyan-950/40'
                    : isCouncil
                    ? 'bg-[#120f20] border border-purple-500/30 text-slate-100 rounded-tl-none shadow-xl'
                    : 'bg-[#0a0d16] border border-slate-800 text-slate-100 rounded-tl-none shadow-lg'
                }`}
              >
                {/* File Attachment Preview */}
                {msg.attachedFile && (
                  <div className="mb-2.5 p-2 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2">
                    {msg.attachedFile.dataUrl?.startsWith('data:image') && (
                      <img
                        src={msg.attachedFile.dataUrl}
                        alt="attachment"
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-cyan-300 truncate font-semibold">
                        {msg.attachedFile.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {msg.attachedFile.type || 'Attached Media'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Structured Text & Code Block Content */}
                {renderMessageContent(msg.text, msg.id)}

                {/* Multi-LLM Council Breakdown */}
                {isCouncil && msg.councilData && (
                  <div className="mt-3.5 pt-3 border-t border-purple-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-purple-300 font-bold tracking-wider">
                        Quorum Consensus: {msg.councilData.consensusScore}%
                      </span>
                      <button
                        onClick={() => toggleExpandCouncil(msg.id)}
                        className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-white"
                      >
                        <span>{expandedCouncilCards[msg.id] ? 'Collapse Perspectives' : 'Inspect 6 LLM Nodes'}</span>
                        {expandedCouncilCards[msg.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    {expandedCouncilCards[msg.id] && (
                      <div className="grid grid-cols-1 gap-2 pt-1 animate-in fade-in">
                        {msg.councilData.modelAnswers.map((model, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-black/60 border border-purple-500/20 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-100 font-mono">
                                {model.modelName}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-950 text-purple-300 border border-purple-500/40 font-semibold">
                                {model.roleBadge}
                              </span>
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              {model.answer}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Card Actions: Copy & Insert into Keyboard */}
                {!isUser && (
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-end gap-1.5">
                    {onInsertToKeyboard && (
                      <button
                        onClick={() => onInsertToKeyboard(msg.text)}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/70 border border-cyan-800 text-cyan-300 hover:border-cyan-400 transition"
                        title="Send text into Volumetric Keyboard"
                      >
                        Insert to Keys
                      </button>
                    )}
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Dynamic Thinking/Generating State with Living Orb */}
        {orbPhase === 'processing' && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0a0d16] border border-amber-500/30 text-amber-300 text-xs w-fit animate-pulse">
            <HoloOrb phase="processing" size="xs" />
            <div className="flex flex-col">
              <span className="font-mono font-bold">
                {activeMode === 'council' ? 'The Council is deliberating...' : 'OmniAI is thinking...'}
              </span>
              <span className="text-[10px] text-slate-400">
                {activeMode === 'council' ? 'Gathering perspectives across 6 LLM nodes' : 'Processing your prompt'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. PROMINENT PROMPT COMPOSER */}
      <footer className="p-3 sm:p-4 bg-[#080a12] border-t border-white/10 shrink-0">
        
        {/* Top of Prompt Box Row: Routing Mode on Far Right */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
              Dialogue Target:
            </span>
          </div>

          {/* Clean Segmented Control: [ Normal ] [ Council ] */}
          <div className="flex items-center p-0.5 rounded-xl bg-black/80 border border-slate-700/80 shadow-inner">
            <button
              onClick={() => setActiveMode('normal')}
              className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeMode === 'normal'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_12px_rgba(0,242,254,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-3 h-3" />
              <span>Normal</span>
            </button>

            <button
              onClick={() => setActiveMode('council')}
              className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeMode === 'council'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-[0_0_12px_rgba(127,0,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Council</span>
            </button>
          </div>
        </div>

        {/* Attachment Preview (if any) */}
        {attachedFile && (
          <div className="mb-2 p-2 rounded-xl bg-slate-900 border border-cyan-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              {attachedFile.dataUrl.startsWith('data:image') && (
                <img
                  src={attachedFile.dataUrl}
                  alt="preview"
                  className="w-8 h-8 rounded-lg object-cover"
                />
              )}
              <span className="text-[11px] font-mono text-cyan-300 truncate">
                {attachedFile.name}
              </span>
            </div>
            <button
              onClick={() => setAttachedFile(null)}
              className="p-1 text-slate-400 hover:text-rose-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* The Prompt Composer Bar */}
        <div className="flex items-end gap-2 bg-[#05060a] border border-slate-700/80 focus-within:border-cyan-500/80 rounded-2xl p-2 shadow-inner transition-all">
          
          {/* + Sign at far left to upload files */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.txt,.json,.ts,.js,.py,.rs"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 active:scale-95 transition shrink-0"
            title="Upload image, video, audio or file (+)"
            aria-label="Upload File (+)"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Voice Mic Button */}
          <button
            onClick={handleToggleMic}
            className={`p-2.5 rounded-xl border transition shrink-0 ${
              isRecording
                ? 'bg-purple-600/30 border-purple-500 text-purple-300 animate-pulse'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-400'
            }`}
            title={isRecording ? 'Stop Voice Recording' : 'Speak / Voice Dictation'}
            aria-label="Voice Dictation"
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Textarea Composer */}
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              activeMode === 'council'
                ? 'Ask a complex question for the Multi-LLM Council to analyze...'
                : activeConversation?.studioContext
                ? `Ask OmniAI about ${activeConversation.studioContext}...`
                : 'Ask OmniAI anything (Shift+Enter for new line)...'
            }
            rows={1}
            className="flex-1 bg-transparent border-0 focus:ring-0 text-slate-100 placeholder-slate-500 text-xs sm:text-sm resize-none py-2 px-1 focus:outline-none max-h-36 no-scrollbar font-sans"
          />

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={(!inputText.trim() && !attachedFile) || orbPhase === 'processing'}
            className={`p-2.5 rounded-xl font-bold transition shrink-0 ${
              activeMode === 'council'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md shadow-purple-500/30'
                : 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/30'
            } disabled:opacity-30 disabled:scale-100 active:scale-95`}
            title="Send Message (Enter)"
            aria-label="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
});

OmniAIChatRoom.displayName = 'OmniAIChatRoom';
