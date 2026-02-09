import React, { useState } from 'react';
import { ForgeArtifact } from '../types';
import { printArtifactAsPDF } from '../geminiService';

interface ArtifactGeneratorProps {
  artifact?: ForgeArtifact;
  onGenerate: (type: 'RESUME' | 'EMAIL' | 'ROADMAP') => void;
  onSave: (artifact: ForgeArtifact) => void;
  isLoading: boolean;
  history?: ForgeArtifact[];
}

export const ArtifactGenerator: React.FC<ArtifactGeneratorProps> = ({ artifact, onGenerate, onSave, isLoading, history = [] }) => {
  const [activeTab, setActiveTab] = useState<'DRAFT' | 'REFINE'>('DRAFT');
  const [editedText, setEditedText] = useState(artifact?.polished || '');

  React.useEffect(() => {
    if (artifact) {
      setEditedText(artifact.polished);
    }
  }, [artifact]);

  const handleDownload = () => {
    // Uses the helper from geminiService which calls html2pdf.js
    printArtifactAsPDF('artifact-content');
  };

  return (
    <div className="w-full flex flex-col space-y-8 py-6 animate-in slide-in-from-bottom-8 duration-700 h-full flex-1 min-h-0">
      <div className="flex justify-between items-center px-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-white italic">Design Studio</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Artifact Synthesis Tier: Elite</p>
        </div>
        <div className="flex items-center space-x-4">
           {!artifact && (
             <div className="flex space-x-3">
               {(['RESUME', 'EMAIL', 'ROADMAP'] as const).map(type => (
                 <button 
                  key={type} 
                  onClick={() => onGenerate(type)} 
                  disabled={isLoading} 
                  className="px-6 py-3 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/30 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                 >
                   Build {type}
                 </button>
               ))}
             </div>
           )}
           {artifact && (
             <div className="flex space-x-3">
               <button 
                onClick={handleDownload} 
                className="px-8 py-3.5 bg-violet-600 hover:bg-violet-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-violet-600/30 transition-all hover:scale-105"
               >
                 Export Strategic PDF
               </button>
               <button 
                onClick={() => onSave({ ...artifact, id: crypto.randomUUID(), polished: editedText, timestamp: Date.now() })} 
                className="px-8 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all shadow-lg"
               >
                 Persist to Archive
               </button>
             </div>
           )}
        </div>
      </div>

      <div className="flex-1 flex flex-col glass rounded-[48px] border border-white/10 overflow-hidden min-h-[500px] shadow-2xl relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/5 blur-[120px] pointer-events-none" />
        
        <div className="flex items-center justify-between px-10 border-b border-white/5 bg-slate-900/10">
          <div className="flex">
            <button 
              onClick={() => setActiveTab('DRAFT')} 
              className={`py-6 px-10 text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'DRAFT' ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Strategic Draft
              {activeTab === 'DRAFT' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-400 shadow-[0_0_12px_rgba(124,58,237,1)]" />}
            </button>
            <button 
              onClick={() => setActiveTab('REFINE')} 
              className={`py-6 px-10 text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'REFINE' ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Refinement Engine
              {activeTab === 'REFINE' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-400 shadow-[0_0_12px_rgba(124,58,237,1)]" />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-16 custom-scrollbar relative z-10">
          <div id="artifact-content">
          {artifact ? (
            <div className="max-w-3xl mx-auto prose prose-invert">
              {activeTab === 'DRAFT' ? (
                <textarea 
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full h-full bg-transparent p-0 text-slate-200 font-light leading-relaxed text-lg outline-none resize-none min-h-[400px]"
                  spellCheck={false}
                />
              ) : (
                <div className="space-y-10">
                  <div className="p-10 bg-violet-600/5 border border-violet-500/20 rounded-[32px]">
                    <div className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-4">Architect's Critique</div>
                    <p className="text-sm font-medium italic text-slate-300">"{artifact.critique}"</p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4">Directives for Refinement</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        'Synthesize for Conciseness', 
                        'Elevate Strategic Tone', 
                        'Target VC Resonance', 
                        'Bullet-Point Transformation'
                      ].map(action => (
                        <button 
                          key={action} 
                          className="p-6 bg-white/5 border border-white/5 hover:border-violet-500/40 rounded-[24px] text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-all text-left"
                          onClick={() => setActiveTab('DRAFT')}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-32 space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-slate-800 border border-white/10 flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-bold text-white tracking-tight">Studio Standby</h4>
                <p className="text-[10px] max-w-xs mx-auto uppercase tracking-widest text-slate-500 leading-relaxed font-bold">Select an asset protocol above to initialize strategic build-cycle.</p>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[8px] text-slate-700 uppercase tracking-[0.5em] font-black">Architecture integrity verified by PivotBloom v5 Protocols</p>
      </div>
    </div>
  );
};
