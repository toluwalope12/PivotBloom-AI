
import React from 'react';
import { Milestone, Resource } from '../types';

interface RoadmapVisualizerProps {
  milestones: Milestone[];
  onToggleStatus: (id: string) => void;
  onSaveToVault?: () => void;
  isLoading?: boolean;
  onRedirectToCoach?: () => void;
}

export const RoadmapVisualizer: React.FC<RoadmapVisualizerProps> = ({ 
  milestones, 
  onToggleStatus, 
  onSaveToVault, 
  isLoading,
  onRedirectToCoach
}) => {
  if (isLoading) {
    return (
      <div className="w-full h-96 glass rounded-3xl flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin shadow-[0_0_20px_rgba(124,58,237,0.2)]" />
        <div className="text-[10px] font-bold uppercase tracking-[0.5em] text-violet-400 animate-pulse text-center">Synthesizing Grounded Trajectory...</div>
      </div>
    );
  }

  if (!milestones || milestones.length === 0) {
    return (
      <div className="w-full glass rounded-[40px] p-20 text-center flex flex-col items-center space-y-8 border border-dashed border-white/10 animate-in fade-in slide-in-from-bottom-4">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center opacity-50">
          <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white tracking-tight italic">Trajectory Standby</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium">No roadmap detected. Start a session with the Coach to generate a grounded strategic bento grid.</p>
        </div>
        <button 
          onClick={onRedirectToCoach}
          className="px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-violet-900/40 transition-all hover:scale-105"
        >
          Start Coaching Session
        </button>
      </div>
    );
  }

  const completedCount = milestones.filter(m => m.status === 'Completed').length;
  const progressPercent = Math.round((completedCount / milestones.length) * 100);

  return (
    <div className="w-full max-h-screen overflow-y-auto custom-scrollbar pr-2 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="w-full space-y-12 py-8">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-6 pb-6 border-b border-white/5">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
               <div className="w-2 h-8 bg-violet-600 rounded-full" />
               <h3 className="text-4xl font-black tracking-tighter uppercase italic text-white">Strategic Trajectory</h3>
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-4 py-1.5 bg-violet-600/20 rounded-full border border-violet-500/30 text-[10px] font-bold text-violet-400 uppercase tracking-widest">
                Pivot Completion: {progressPercent}%
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Grounded Search Active
              </div>
            </div>
          </div>
          
          {onSaveToVault && (
            <button 
              onClick={onSaveToVault}
              className="px-10 py-4 bg-violet-600 hover:bg-violet-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-2xl shadow-violet-600/30 transition-all hover:scale-105"
            >
              Persist to Vault
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 auto-rows-fr">
          {milestones.map((milestone, idx) => (
            <div 
              key={milestone.id}
              className={`glass rounded-[40px] border p-10 transition-all duration-500 group relative flex flex-col h-full ${
                milestone.status === 'Completed' 
                ? 'border-violet-500/20 opacity-60' 
                : 'border-white/5 hover:border-violet-500/40 shadow-2xl hover:bg-violet-600/5'
              } ${idx % 4 === 0 ? 'lg:col-span-2' : ''}`}
            >
              {/* Index Badge */}
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl z-20 group-hover:bg-violet-600 transition-colors">
                <span className="text-lg font-black text-white italic">{idx + 1}</span>
              </div>

              <div className="flex justify-between items-start mb-6">
                <div 
                  onClick={() => onToggleStatus(milestone.id)}
                  className={`cursor-pointer w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                    milestone.status === 'Completed' ? 'bg-violet-600 border-violet-400' : 'bg-slate-900 border-slate-700 group-hover:border-violet-500'
                  }`}
                >
                  {milestone.status === 'Completed' ? (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} /></svg>
                  ) : (
                    <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{milestone.timeline}</span>
                </div>
              </div>

              <div className="space-y-4 mb-8 flex-1 flex flex-col">
                <h3 className={`text-2xl font-bold tracking-tight leading-tight ${milestone.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                  {milestone.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-400 font-medium flex-grow">
                  {milestone.whyItMatters}
                </p>
              </div>

              <div className="space-y-4 pt-8 border-t border-white/5 mt-auto">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Curated Intelligence</h4>
                  <div className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center border border-white/10" title="Grounded via Google Search">
                    <svg className="w-3 h-3 text-violet-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {milestone.resources.map((res: Resource, i) => (
                    <a 
                      key={i}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-violet-500/20 transition-all hover:translate-x-1 group/res"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${res.type === 'video' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          {res.type === 'video' ? (
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 15.5l6-3.5-6-3.5v7zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-300 group-hover/res:text-white transition-colors">{res.label}</span>
                          <span className="text-[8px] uppercase tracking-widest text-slate-600 font-bold">{res.type}</span>
                        </div>
                      </div>
                      <svg className="w-3 h-3 text-slate-700 group-hover/res:text-violet-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} /></svg>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
