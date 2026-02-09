
import React from 'react';

interface ReasoningLogProps {
  logs: string[];
  isOpen: boolean;
  onClose: () => void;
}

const ReasoningLog: React.FC<ReasoningLogProps> = ({ logs, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 glass z-[100] p-6 flex flex-col border-l border-violet-500/30 shadow-[0_0_100px_rgba(124,58,237,0.1)] animate-in slide-in-from-right duration-500 overflow-hidden">
      {/* Scanline Persona Overlay */}
      <div className="scanline" />
      
      <div className="flex justify-between items-center mb-8 relative z-30">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-violet-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(167,139,250,1)]" />
          <h2 className="text-[10px] font-black tracking-[0.4em] text-violet-400 uppercase reasoning-font">Thought Trace Terminal</h2>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-all hover:rotate-90">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 reasoning-font text-[11px] leading-relaxed relative z-30 custom-scrollbar pr-2">
        {logs.map((log, i) => (
          <div key={i} className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="text-violet-500 font-bold opacity-30 text-[9px] tracking-widest"># CYCLE_{logs.length - i}.{Math.floor(Math.random() * 9999)}</div>
              <div className="w-1.5 h-1.5 rounded-full bg-violet-600/20" />
            </div>
            <div className="text-slate-300 font-medium">
              <span className="text-violet-400 mr-2">»</span>
              {log}
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-700 italic space-y-4 opacity-30">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} />
            </svg>
            <span className="text-[10px] uppercase tracking-[0.2em] font-black">No reasoning cycles initiated.</span>
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-white/5 relative z-30">
        <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-[0.3em] text-slate-700">
          <span>Buffer: Synchronized</span>
          <span className="animate-pulse">Active Sync</span>
        </div>
      </div>
    </div>
  );
};

export default ReasoningLog;
