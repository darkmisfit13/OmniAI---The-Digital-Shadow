import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('OmniAI Error Boundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#000000] text-slate-100 flex flex-col items-center justify-center p-6 text-center font-mono">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/40 border border-cyan-500/50 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_25px_rgba(0,242,254,0.25)]">
            ⚡
          </div>
          <h1 className="text-xl font-bold text-white mb-2 tracking-wider">
            OMNI AI RECOVERY CONSOLE
          </h1>
          <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
            The neural interface encountered an unexpected interruption. Your state is safely preserved.
          </p>
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 max-w-lg w-full text-left text-[11px] text-red-400 font-mono mb-6 overflow-x-auto">
            {this.state.error?.message || 'Unknown runtime anomaly'}
          </div>
          <button
            onClick={this.handleReset}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00f2fe] via-[#7f00ff] to-[#0575e6] text-black font-bold text-xs shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:brightness-110 active:scale-95 transition"
          >
            Re-Initialize System
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
