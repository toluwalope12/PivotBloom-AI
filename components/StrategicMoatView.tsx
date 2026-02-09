
import React from 'react';
import { StrategicMoat } from '../types';

interface StrategicMoatViewProps {
  moat: StrategicMoat;
}

const StrategicMoatView: React.FC<StrategicMoatViewProps> = ({ moat }) => {
  return (
    <div className="w-full glass rounded-3xl border border-violet-500/30 p-8 shadow-[0_0_50px_rgba(124,58,237,0.15)] animate-in fade-in zoom-in-95 duration-700">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div className="space-y-2">
          <div className="text-[10px] uppercase font-bold tracking-[0.3em] text-violet-500">Verdict: My Competitive Edge Discovered</div>
          <h2 className="text-3xl font-bold tracking-tighter text-slate-100">{moat.title}</h2>
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">{moat.summary}</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Moat Strength</div>
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`w-6 h-1 rounded-full ${i < 4 ? 'bg-violet-500' : 'bg-slate-800'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {moat.correlations.map((item, idx) => (
          <div key={idx} className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 hover:border-violet-500/30 transition-all group overflow-hidden relative">
            <div className="text-[9px] uppercase font-bold text-slate-500 mb-3 tracking-widest">Strategic Correlation #{idx + 1}</div>
            <div className="flex flex-col space-y-4 relative z-10">
              <div>
                <div className="text-[10px] text-slate-600 mb-0.5 uppercase">Surface Detail</div>
                <div className="text-xs font-semibold text-slate-300">{item.surface}</div>
              </div>
              
              {/* SVG Synthesis Correlation Line */}
              <div className="relative h-10 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <path 
                    d="M50 0 C 50 20, 50 20, 50 40" 
                    stroke="currentColor" 
                    strokeWidth="0.5" 
                    className="text-violet-500/30 group-hover:text-violet-500/60 transition-colors" 
                    strokeDasharray="4 2" 
                  />
                  <circle cx="50" cy="20" r="2.5" fill="currentColor" className="text-violet-500 animate-pulse" />
                  <path 
                    d="M40 20 L60 20" 
                    stroke="currentColor" 
                    strokeWidth="0.5" 
                    className="text-violet-500/20" 
                  />
                </svg>
              </div>

              <div>
                <div className="text-[10px] text-violet-500/70 mb-0.5 uppercase">Hidden Trajectory Power</div>
                <div className="text-sm font-bold text-violet-100 group-hover:text-violet-400 transition-colors">{item.hidden}</div>
              </div>
              <div className="text-[11px] text-slate-500 italic">
                {item.impact}
              </div>
            </div>
            
            {/* Background Decorative Element */}
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-violet-600/5 blur-xl group-hover:bg-violet-600/10 transition-all rounded-full pointer-events-none" />
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center border border-violet-500/30">
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="text-xs font-medium text-slate-400">
            <span className="text-violet-400 font-bold uppercase mr-2">Career Verdict:</span>
            {moat.verdict}
          </div>
        </div>
        <button className="px-6 py-2 bg-violet-600 hover:bg-violet-700 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-violet-600/20">
          Lock Competitive Edge
        </button>
      </div>
    </div>
  );
};

export default StrategicMoatView;
