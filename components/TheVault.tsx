
import React, { useState } from 'react';
import { AppState, ForgeArtifact, StrategicMoat, InterviewReport, Milestone } from '../types';

interface TheVaultProps {
  vault: AppState['vault'];
  streak: number;
  onClose: () => void;
  onOpenArtifact: (artifact: ForgeArtifact) => void;
  onOpenMoat: (moat: StrategicMoat) => void;
}

const TheVault: React.FC<TheVaultProps> = ({ vault, streak, onClose, onOpenArtifact, onOpenMoat }) => {
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'MOATS' | 'DOCS'>('REPORTS');

  const renderDocumentContent = (art: ForgeArtifact) => {
    if (art.type === 'ROADMAP') {
      try {
        const milestones: Milestone[] = JSON.parse(art.polished);
        return (
          <div className="space-y-3 mt-4 relative">
            {/* Vertical Progress Line */}
            <div className="absolute left-[5px] top-1.5 bottom-1.5 w-[1px] bg-white/10" />
            
            {milestones.slice(0, 3).map((m, idx) => (
              <div key={idx} className="flex items-start space-x-3 relative pl-4">
                {/* Fix: Corrected status comparison to match the Milestone status type */}
                <div className={`absolute left-[-2px] top-[5px] w-2.5 h-2.5 rounded-full shrink-0 z-10 border border-slate-900 ${m.status === 'Completed' ? 'bg-violet-500 shadow-[0_0_8px_rgba(124,58,237,0.8)]' : 'bg-slate-700'}`} />
                <div className="flex flex-col min-w-0">
                  {/* Fix: Corrected status comparison to match the Milestone status type */}
                  <span className={`text-[10px] truncate font-bold uppercase tracking-widest ${m.status === 'Completed' ? 'text-violet-300' : 'text-slate-400'}`}>
                    {m.title}
                  </span>
                  <span className="text-[8px] text-slate-600 font-mono mt-0.5">{m.status}</span>
                </div>
              </div>
            ))}
            {milestones.length > 3 && (
              <div className="text-[9px] text-slate-500 italic pl-4 font-medium">
                + {milestones.length - 3} strategic steps remaining
              </div>
            )}
          </div>
        );
      } catch (e) {
        return <div className="text-[11px] text-slate-500 mt-2 line-clamp-3 leading-relaxed">Invalid trajectory encoding.</div>;
      }
    }
    
    return (
      <div className="text-[11px] text-slate-500 mt-2 line-clamp-3 leading-relaxed italic">
        "{art.polished.substring(0, 120)}..."
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
      <div className="w-full max-w-5xl h-full flex flex-col glass rounded-[40px] border border-white/10 shadow-2xl overflow-hidden">
        <div className="h-24 border-b border-white/5 flex items-center justify-between px-8 bg-slate-900/20">
          <div className="flex items-center space-x-5">
            <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/50 flex items-center justify-center">
              <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 12h14M5 16h14" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-100 uppercase">Archive</h2>
              <div className="flex items-center space-x-2 mt-1">
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Secure Trajectory Storage</p>
                 <span className="w-1 h-1 bg-slate-700 rounded-full" />
                 <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest animate-pulse">
                   {streak} Day Strategy Persistence
                 </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center justify-center px-8 border-b border-white/5 bg-slate-900/10">
          <div className="flex space-x-12">
            <button 
              onClick={() => setActiveTab('REPORTS')}
              className={`py-6 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'REPORTS' ? 'text-violet-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Sim Reports
              {activeTab === 'REPORTS' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 shadow-[0_0_8px_rgba(124,58,237,1)]" />}
            </button>
            <button 
              onClick={() => setActiveTab('MOATS')}
              className={`py-6 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'MOATS' ? 'text-violet-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Strategic Edges
              {activeTab === 'MOATS' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 shadow-[0_0_8px_rgba(124,58,237,1)]" />}
            </button>
            <button 
              onClick={() => setActiveTab('DOCS')}
              className={`py-6 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'DOCS' ? 'text-violet-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Studio Assets
              {activeTab === 'DOCS' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 shadow-[0_0_8px_rgba(124,58,237,1)]" />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-950/20">
          {activeTab === 'REPORTS' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {!vault.reports || vault.reports.length === 0 ? (
                  <div className="col-span-full py-20 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center text-slate-600 italic text-sm">
                    No simulation reports logged.
                  </div>
                ) : (
                  vault.reports.map((report) => (
                    <div 
                      key={report.id}
                      className="glass rounded-3xl p-6 border border-white/5 hover:border-violet-500/30 transition-all group relative overflow-hidden"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">Score: {report.score}</div>
                        <div className="text-[8px] font-mono text-slate-600">{new Date(report.timestamp).toLocaleDateString()}</div>
                      </div>
                      <div className="text-sm font-bold text-slate-200 line-clamp-2 mb-2 leading-snug">{report.summary}</div>
                      <div className="flex gap-1 mt-3">
                         <div className="h-1 flex-1 bg-violet-600/30 rounded-full overflow-hidden">
                           <div className="h-full bg-violet-500" style={{ width: `${report.score}%` }} />
                         </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'MOATS' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {vault.moats.length === 0 ? (
                  <div className="col-span-full py-20 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center text-slate-600 italic text-sm">
                    No strategic edges identified.
                  </div>
                ) : (
                  vault.moats.map((moat, i) => (
                    <button 
                      key={i} 
                      onClick={() => onOpenMoat(moat)}
                      className="text-left glass rounded-3xl p-6 border border-white/5 hover:border-violet-500/30 hover:bg-violet-600/5 transition-all group"
                    >
                      <div className="text-[10px] text-violet-400 font-bold uppercase tracking-widest mb-1">Signal Strategy</div>
                      <div className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors line-clamp-1">{moat.title}</div>
                      <div className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">{moat.summary}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'DOCS' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {vault.artifacts.length === 0 ? (
                  <div className="col-span-full py-20 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center text-slate-600 italic text-sm">
                    No studio assets persisted.
                  </div>
                ) : (
                  vault.artifacts.map((art, i) => (
                    <button 
                      key={art.id || i} 
                      onClick={() => onOpenArtifact(art)}
                      className="text-left glass rounded-3xl p-6 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-600/5 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">{art.type}</div>
                        <div className="text-[8px] font-mono text-slate-600">{new Date(art.timestamp).toLocaleDateString()}</div>
                      </div>
                      <div className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">Strategic Build</div>
                      {renderDocumentContent(art)}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 text-center text-[10px] text-slate-600 uppercase tracking-widest border-t border-white/5 bg-slate-900/10">
          Archive integrity verified via trajectory storage protocols.
        </div>
      </div>
    </div>
  );
};

export default TheVault;
