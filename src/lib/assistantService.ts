export type AssistantPhase = 
  | 'idle' 
  | 'typing' 
  | 'listening' 
  | 'processing' 
  | 'responding' 
  | 'error';

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'omni' | 'council';
  text: string;
  timestamp: string;
  mode?: 'normal' | 'council';
  studioContext?: string;
  attachedFile?: {
    name: string;
    type: string;
    dataUrl?: string;
  };
  councilData?: {
    question: string;
    consensusSummary: string;
    consensusScore: number;
    verdict: string;
    modelAnswers: {
      modelName: string;
      provider: string;
      roleBadge: string;
      status: string;
      answer: string;
    }[];
  };
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  studioContext: string | null;
  messages: AssistantMessage[];
}

type PhaseListener = (phase: AssistantPhase) => void;
type MessageListener = (messages: AssistantMessage[]) => void;
type ConversationListener = (conversations: Conversation[], activeId: string) => void;
type ContextListener = (studio: string | null) => void;

const STORAGE_KEY = 'omni_conversations_v1';
const ACTIVE_ID_KEY = 'omni_active_convo_id_v1';

class AssistantService {
  private phase: AssistantPhase = 'idle';
  private phaseListeners: Set<PhaseListener> = new Set();
  private messageListeners: Set<MessageListener> = new Set();
  private conversationListeners: Set<ConversationListener> = new Set();
  private contextListeners: Set<ContextListener> = new Set();
  private currentStudioContext: string | null = null;
  private typingTimer: any = null;
  private errorTimer: any = null;

  private conversations: Conversation[] = [];
  private activeConversationId: string = 'convo-default';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Conversation[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.conversations = parsed;
          const savedActiveId = localStorage.getItem(ACTIVE_ID_KEY);
          if (savedActiveId && this.conversations.some(c => c.id === savedActiveId)) {
            this.activeConversationId = savedActiveId;
          } else {
            this.activeConversationId = this.conversations[0].id;
          }
          return;
        }
      }
    } catch (err) {
      console.warn('Could not load saved conversations from localStorage:', err);
    }

    // Initialize with a single clean session
    const defaultConvo: Conversation = {
      id: `convo-${Date.now()}`,
      title: 'Current Session',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      studioContext: null,
      messages: [
        {
          id: 'init-1',
          sender: 'omni',
          text: "I'm OmniAI, your creative assistant and digital shadow. Whether you're cutting video in Midnight Motion, synthesizing beats in HoloTone, or working with code, I adapt to your current studio. How can I help you right now?",
          timestamp: 'Just now',
          mode: 'normal',
        },
      ],
    };

    this.conversations = [defaultConvo];
    this.activeConversationId = defaultConvo.id;
    this.persistToStorage();
  }

  private persistToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.conversations));
      localStorage.setItem(ACTIVE_ID_KEY, this.activeConversationId);
    } catch (err) {
      console.warn('Could not persist conversations to localStorage:', err);
    }
  }

  // --- Phase Management ---
  public getPhase(): AssistantPhase {
    return this.phase;
  }

  public setPhase(newPhase: AssistantPhase) {
    if (this.phase === newPhase) return;
    this.phase = newPhase;
    this.phaseListeners.forEach((listener) => {
      try {
        listener(this.phase);
      } catch (err) {
        console.error('Error in phase listener:', err);
      }
    });

    // Auto-recovery for error state
    if (newPhase === 'error') {
      if (this.errorTimer) clearTimeout(this.errorTimer);
      this.errorTimer = setTimeout(() => {
        if (this.phase === 'error') {
          this.setPhase('idle');
        }
      }, 3000);
    }
  }

  public subscribePhase(listener: PhaseListener): () => void {
    this.phaseListeners.add(listener);
    listener(this.phase);
    return () => this.phaseListeners.delete(listener);
  }

  public notifyTyping() {
    this.setPhase('typing');
    if (this.typingTimer) clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      if (this.phase === 'typing') {
        this.setPhase('idle');
      }
    }, 1600);
  }

  // --- Studio Context ---
  public setStudioContext(studioName: string | null) {
    this.currentStudioContext = studioName;
    const active = this.getActiveConversation();
    if (active && studioName && !active.studioContext) {
      active.studioContext = studioName;
      this.persistToStorage();
      this.emitConversations();
    }
    this.contextListeners.forEach((listener) => {
      try {
        listener(studioName);
      } catch (err) {
        console.error('Error in context listener:', err);
      }
    });
  }

  public getStudioContext(): string | null {
    return this.currentStudioContext;
  }

  public subscribeStudioContext(listener: ContextListener): () => void {
    this.contextListeners.add(listener);
    listener(this.currentStudioContext);
    return () => this.contextListeners.delete(listener);
  }

  // --- Conversation Management ---
  public getConversations(): Conversation[] {
    return this.conversations;
  }

  public getActiveConversationId(): string {
    return this.activeConversationId;
  }

  public getActiveConversation(): Conversation {
    const found = this.conversations.find((c) => c.id === this.activeConversationId);
    if (found) return found;
    return this.conversations[0];
  }

  public createNewConversation(title?: string, studioContext?: string | null): Conversation {
    const newConvo: Conversation = {
      id: `convo-${Date.now()}`,
      title: title || (studioContext ? `${studioContext} Session` : 'New Conversation'),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      studioContext: studioContext || this.currentStudioContext,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'omni',
          text: studioContext 
            ? `Started a new session adapted to ${studioContext}. How can I assist with your current work?` 
            : "Started a fresh conversation workspace. What are we building today?",
          timestamp: 'Just now',
          mode: 'normal',
          studioContext: studioContext || this.currentStudioContext || undefined,
        },
      ],
    };

    this.conversations = [newConvo, ...this.conversations];
    this.activeConversationId = newConvo.id;
    this.persistToStorage();
    this.emitConversations();
    this.emitMessages();
    return newConvo;
  }

  public switchConversation(id: string) {
    if (this.conversations.some((c) => c.id === id)) {
      this.activeConversationId = id;
      this.persistToStorage();
      this.emitConversations();
      this.emitMessages();
    }
  }

  public deleteConversation(id: string) {
    if (this.conversations.length <= 1) {
      // If deleting the only conversation, reset it instead of leaving zero conversations
      this.clearCurrentConversation();
      return;
    }

    this.conversations = this.conversations.filter((c) => c.id !== id);
    if (this.activeConversationId === id) {
      this.activeConversationId = this.conversations[0].id;
    }
    this.persistToStorage();
    this.emitConversations();
    this.emitMessages();
  }

  public clearCurrentConversation() {
    const active = this.getActiveConversation();
    if (active) {
      active.messages = [
        {
          id: `reset-${Date.now()}`,
          sender: 'omni',
          text: "Conversation refreshed. I'm ready for whatever task or studio you're working in.",
          timestamp: 'Just now',
          mode: 'normal',
        },
      ];
      active.updatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.persistToStorage();
      this.emitConversations();
      this.emitMessages();
    }
  }

  public clearMessages() {
    this.clearCurrentConversation();
  }

  public subscribeConversations(listener: ConversationListener): () => void {
    this.conversationListeners.add(listener);
    listener(this.conversations, this.activeConversationId);
    return () => this.conversationListeners.delete(listener);
  }

  public subscribeMessages(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    listener(this.getActiveConversation().messages);
    return () => this.messageListeners.delete(listener);
  }

  public getMessages(): AssistantMessage[] {
    return this.getActiveConversation().messages;
  }

  private emitMessages() {
    const current = this.getActiveConversation().messages;
    this.messageListeners.forEach((listener) => {
      try {
        listener(current);
      } catch (err) {
        console.error('Error in message listener:', err);
      }
    });
  }

  private emitConversations() {
    this.conversationListeners.forEach((listener) => {
      try {
        listener(this.conversations, this.activeConversationId);
      } catch (err) {
        console.error('Error in conversation listener:', err);
      }
    });
  }

  // --- Send Message Action with Live State Transitions & Real Persistence ---
  public async sendMessage(
    text: string,
    mode: 'normal' | 'council' = 'normal',
    attachedFile?: { name: string; type: string; dataUrl: string } | null,
    specificStudioContext?: string | null
  ): Promise<AssistantMessage | null> {
    const trimmed = text.trim();
    if (!trimmed && !attachedFile) return null;

    const activeConvo = this.getActiveConversation();
    const activeStudio = specificStudioContext || activeConvo.studioContext || this.currentStudioContext;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Add user message
    const userMsg: AssistantMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: trimmed || (attachedFile ? `Attached: ${attachedFile.name}` : ''),
      timestamp: nowTime,
      mode,
      studioContext: activeStudio || undefined,
      attachedFile: attachedFile || undefined,
    };

    activeConvo.messages = [...activeConvo.messages, userMsg];
    activeConvo.updatedAt = nowTime;

    // Auto-title conversation if currently default
    if (activeConvo.title === 'Current Session' || activeConvo.title === 'New Conversation') {
      const generatedTitle = trimmed.slice(0, 32) + (trimmed.length > 32 ? '...' : '');
      activeConvo.title = generatedTitle;
    }

    this.persistToStorage();
    this.emitMessages();
    this.emitConversations();

    // 2. Set Orb to State C: Thinking / Processing
    this.setPhase('processing');

    try {
      if (mode === 'normal') {
        const tone = localStorage.getItem('omniai_tone') || 'natural';
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            studioContext: activeStudio,
            imageBase64: attachedFile?.dataUrl,
            tone,
          }),
        });

        if (!res.ok) {
          throw new Error(`Chat API responded with status ${res.status}`);
        }

        const data = await res.json();

        // 3. Set Orb to State D: Responding
        this.setPhase('responding');

        const replyMsg: AssistantMessage = {
          id: `omni-${Date.now()}`,
          sender: 'omni',
          text: data.reply || "I've reviewed your request. Let's continue.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode: 'normal',
          studioContext: activeStudio || undefined,
        };

        activeConvo.messages = [...activeConvo.messages, replyMsg];
        activeConvo.updatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.persistToStorage();
        this.emitMessages();
        this.emitConversations();

        setTimeout(() => {
          if (this.phase === 'responding') {
            this.setPhase('idle');
          }
        }, 2200);

        return replyMsg;
      } else {
        // Multi-LLM Council Mode
        const res = await fetch('/api/council', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: trimmed,
            studioContext: activeStudio,
          }),
        });

        if (!res.ok) {
          throw new Error(`Council API responded with status ${res.status}`);
        }

        const data = await res.json();

        this.setPhase('responding');

        const councilReply: AssistantMessage = {
          id: `council-${Date.now()}`,
          sender: 'council',
          text: data.verdict || "The Council has reached consensus.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode: 'council',
          councilData: data,
          studioContext: activeStudio || undefined,
        };

        activeConvo.messages = [...activeConvo.messages, councilReply];
        activeConvo.updatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.persistToStorage();
        this.emitMessages();
        this.emitConversations();

        setTimeout(() => {
          if (this.phase === 'responding') {
            this.setPhase('idle');
          }
        }, 2400);

        return councilReply;
      }
    } catch (err) {
      console.error('OmniAI request failed:', err);
      this.setPhase('error');

      const fallbackMsg: AssistantMessage = {
        id: `err-${Date.now()}`,
        sender: 'omni',
        text: "I encountered a brief connection error while processing that. Please try sending your message again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode,
        studioContext: activeStudio || undefined,
      };

      activeConvo.messages = [...activeConvo.messages, fallbackMsg];
      this.persistToStorage();
      this.emitMessages();
      this.emitConversations();
      return fallbackMsg;
    }
  }
}

export const assistantService = new AssistantService();
