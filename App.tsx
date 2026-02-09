
import React, { useState, useRef, useEffect } from 'react';
import { Phase, Message, AppState, ForgeArtifact, ProfessionalContext, InterviewReport, Milestone, StrategicMoat } from './types';
import { PHASE_LABELS } from './constants';
import { getGeminiStream, generateArtifact, getVoiceResponse, synthesizeProfessionalContext, extractRoadmap } from './geminiService';
import ReasoningLog from './components/ReasoningLog';
import { InterviewSimulator } from './components/InterviewSimulator';
import { ArtifactGenerator } from './components/ArtifactGenerator';
import { RoadmapVisualizer } from './components/RoadmapVisualizer';
import StrategicMoatView from './components/StrategicMoatView';
import TheVault from './components/TheVault';
import PhaseIndicator from './components/PhaseIndicator';

const STORAGE_KEY = 'pivot_bloom_v5_final';

const INITIAL_CONTEXT: ProfessionalContext = {
  skills: [],
  gaps: [],
  goals: '',
  moatInsights: [],
  strengthScore: 0,
  interviewReadiness: 0
};

const REASONING_STATES = [
  'Extricating leadership signals...',
  'Analyzing market moats...',
  'Architecting bespoke Trajectory...',
  'Synchronizing benchmarks...',
  'Finalizing reinvention...'
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
      currentPhase: Phase.LANDING,
      history: [],
      reasoningLog: [],
      professionalContext: INITIAL_CONTEXT,
      isLiveActive: false,
      uploadedFiles: [],
      milestones: [],
      vault: { artifacts: [], moats: [], reports: [] },
      streak: 1,
      lastVisit: Date.now()
    };
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isArchitecting, setIsArchitecting] = useState(false);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentMoat, setCurrentMoat] = useState<StrategicMoat | null>(null);
  const [pendingFile, setPendingFile] = useState<{name: string, type: string, data: string} | null>(null);
  
  // Onboarding state
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({ targetRole: '', experienceLevel: '' });

  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Immediate Voice Welcome Trigger
  useEffect(() => {
    if (state.currentPhase === Phase.INTELLIGENCE && state.history.length === 0) {
      speakText("Welcome back. I'm ready to architect your transition.");
    }
  }, [state.currentPhase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.history, isLoading, isArchitecting]);

  const resumeAudio = async () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
  };

  const speakText = async (text: string) => {
    await resumeAudio();
    const cleanText = text.replace(/<[^>]*>?|!TIP:|^.*TRANSCRIPTION:.*$/gim, '').trim();
    if (!cleanText || cleanText.length < 2) return;

    try {
      const base64Audio = await getVoiceResponse(cleanText);
      if (base64Audio) {
        const audioCtx = audioCtxRef.current!;
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const buffer = await decodeAudioData(bytes, audioCtx, 24000, 1);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start();
      }
    } catch (err) { console.error(err); }
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sr: number, ch: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / ch;
    const buffer = ctx.createBuffer(ch, frameCount, sr);
    for (let c = 0; c < ch; c++) {
      const cData = buffer.getChannelData(c);
      for (let i = 0; i < frameCount; i++) cData[i] = dataInt16[i * ch + c] / 32768.0;
    }
    return buffer;
  };

  const addReasoning = (log: string) => {
    setState(prev => ({ ...prev, reasoningLog: [log, ...prev.reasoningLog.slice(0, 49)] }));
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPendingFile({ name: file.name, type: file.type, data: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if ((!input.trim() && !pendingFile) || isLoading) return;
    await resumeAudio();
    setIsLoading(true);
    setIsThinking(true);
    setProcessingStage(REASONING_STATES[0]);

    const userMsg: Message = { 
      role: 'user', 
      text: input, 
      files: pendingFile ? [pendingFile] : [] 
    };
    const newHistory = [...state.history, userMsg];
    setState(prev => ({ ...prev, history: newHistory }));
    const currentInput = input;
    const currentFiles = pendingFile ? [pendingFile] : [];
    
    setInput('');
    setPendingFile(null);

    try {
      const stream = await getGeminiStream(currentInput, newHistory, state.currentPhase, currentFiles, (r) => {
        setIsCoolingDown(true);
        addReasoning(`Strategic cooldown triggered (${r})...`);
      });
      setIsCoolingDown(false);
      let fullText = '';
      let milestonesDetected = false;

      for await (const chunk of stream) {
        if (isThinking) { setIsThinking(false); setIsArchitecting(true); }
        const chunkText = chunk.text || "";
        fullText += chunkText;
        if (fullText.length > 200) setProcessingStage(REASONING_STATES[2]);

        // Zero-Latency Roadmap Detection: Detect <milestones> and </milestones> tags
        if (!milestonesDetected && fullText.includes('</milestones>')) {
           const milestoneMatch = fullText.match(/<milestones>([\s\S]*?)<\/milestones>/);
           if (milestoneMatch) {
             try {
                const milestoneData = milestoneMatch[1].replace(/```json|```/g, '').trim();
                const parsedMilestones = JSON.parse(milestoneData);
                if (Array.isArray(parsedMilestones) && parsedMilestones.length > 0) {
                   setState(prev => ({ ...prev, milestones: parsedMilestones }));
                   milestonesDetected = true;
                   addReasoning("Strategic Roadmap parsed and integrated.");
                }
             } catch (e) {
                console.warn("Milestone parsing failed during stream.", e);
             }
           }
        }
      }
      setIsArchitecting(false);

      // Final fallback check if not detected during stream
      if (!milestonesDetected) {
        const finalMilestoneMatch = fullText.match(/<milestones>([\s\S]*?)<\/milestones>/);
        if (finalMilestoneMatch) {
          try {
            const finalParsed = JSON.parse(finalMilestoneMatch[1].replace(/```json|```/g, '').trim());
            if (Array.isArray(finalParsed)) {
              setState(prev => ({ ...prev, milestones: finalParsed }));
            }
          } catch (e) {}
        }
      }

      const cleanText = fullText.replace(/<[^>]*>([\s\S]*?)<\/[^>]*>/g, '').trim();
      const updatedHistory: Message[] = [...newHistory, { role: 'model', text: cleanText }];
      
      addReasoning("Synchronizing global professional context...");
      const profile = await synthesizeProfessionalContext(updatedHistory);
      
      setState(prev => ({
        ...prev,
        history: updatedHistory,
        professionalContext: { ...prev.professionalContext, ...profile },
        reasoningLog: ["Executive alignment complete.", ...prev.reasoningLog]
      }));
      speakText(cleanText);
    } catch (e: any) {
      addReasoning(`Fatal error: ${e.message}`);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
      setIsArchitecting(false);
    }
  };

  const advancePhase = (p: Phase) => {
    addReasoning(`Phase shift: ${PHASE_LABELS[p]}.`);
    resumeAudio();
    setState(prev => ({ ...prev, currentPhase: p }));
    if (p !== Phase.ARCHIVE) setCurrentMoat(null);
  };

  const handleAuthSuccess = () => {
    advancePhase(Phase.INTELLIGENCE);
  };

  const triggerSignup = (e: React.MouseEvent) => {
    e.preventDefault();
    setOnboardingStep(1);
  };

  const handleOnboardingNext = () => {
    if (onboardingStep === 1) {
      if (!onboardingData.targetRole) return;
      setOnboardingStep(2);
    } else if (onboardingStep === 2) {
      if (!onboardingData.experienceLevel) return;
      setOnboardingStep(0);
      setState(prev => ({
        ...prev,
        professionalContext: {
          ...prev.professionalContext,
          onboarding: onboardingData
        }
      }));
      advancePhase(Phase.INTELLIGENCE);
    }
  };

  const toggleRecording = () => {
    resumeAudio();
    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); }
    else {
      const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SR) return;
      const rec = new SR();
      rec.continuous = true; rec.interimResults = true;
      rec.onresult = (e: any) => { for (let i = e.resultIndex; i < e.results.length; ++i) if (e.results[i].isFinal) setInput(v => v + e.results[i][0].transcript); };
      rec.onend = () => setIsRecording(false);
      rec.start();
      recognitionRef.current = rec;
      setIsRecording(true);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-50 selection:bg-violet-500/30 relative">
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 blur-[150px] pointer-events-none" />
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 shrink-0 bg-slate-950/90 backdrop-blur-xl z-40">
        <div className="flex items-center space-x-4">
           <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center font-bold shadow-lg shadow-violet-600/40">PB</div>
           <span className="text-sm font-bold tracking-tight text-white uppercase tracking-tighter">PivotBloom</span>
        </div>
        {state.currentPhase !== Phase.LANDING && state.currentPhase !== Phase.AUTH && (
          <button onClick={() => setIsLogOpen(true)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all border border-white/5 text-[10px] font-bold uppercase tracking-widest">Thought Trace</button>
        )}
      </header>

      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-6 overflow-hidden relative z-10">
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar pt-8 pb-32 space-y-12 pr-2">
          {state.currentPhase === Phase.LANDING && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-10 animate-in fade-in zoom-in-95">
              <h1 className="text-5xl md:text-7xl font-light tracking-tighter text-white leading-tight">Stuck in the <span className="text-violet-400 font-bold italic">Wrong Career?</span></h1>
              <p className="text-slate-400 text-lg md:text-xl font-light max-w-2xl">Elite career coaching engineered for the next level of leadership.</p>
              <button onClick={() => advancePhase(Phase.AUTH)} className="px-12 py-6 bg-violet-600 hover:bg-violet-700 text-white rounded-full text-sm font-bold uppercase tracking-widest shadow-2xl">Begin Assessment →</button>
            </div>
          )}

          {state.currentPhase === Phase.AUTH && onboardingStep === 0 && (
            <div className="h-full flex flex-col items-center justify-center space-y-12 max-w-lg mx-auto w-full animate-in fade-in duration-700">
              <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">Welcome to your Executive Edge.</h2>
                <p className="text-slate-400 text-lg font-light">Let’s map your next peak.</p>
              </div>
              <div className="glass p-10 rounded-[48px] border border-white/10 w-full space-y-6 shadow-2xl">
                <div className="grid grid-cols-1 gap-4">
                  <button onClick={handleAuthSuccess} className="w-full flex items-center justify-center space-x-4 py-5 bg-white text-slate-900 rounded-3xl hover:bg-slate-200 transition-all text-xs font-black uppercase tracking-widest shadow-xl">
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.47-1.92 4.64-1.17 1.34-3 2.13-5.92 2.13-4.71 0-8.59-3.32-8.59-8.4s3.88-8.4 8.59-8.4c2.51 0 4.38.99 5.73 2.26l2.36-2.36C18.17 1.64 15.65 0 12.48 0 5.58 0 0 5.58 0 12.48s5.58 12.48 12.48 12.48c3.75 0 6.58-1.24 8.75-3.52 2.25-2.25 2.96-5.4 2.96-7.84 0-.75-.06-1.47-.19-2.13h-11.52z" fill="currentColor"/></svg>
                    <span>Google Secure Access</span>
                  </button>
                  <button onClick={handleAuthSuccess} className="w-full flex items-center justify-center space-x-4 py-5 bg-[#0077b5] text-white rounded-3xl hover:bg-[#006097] transition-all text-xs font-black uppercase tracking-widest shadow-xl shadow-[#0077b5]/20">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                    <span>LinkedIn Executive Connect</span>
                  </button>
                </div>
                <div className="pt-4 text-center">
                  <button onClick={triggerSignup} className="text-[10px] font-black uppercase tracking-widest text-violet-400 hover:text-violet-300 transition-colors border-b border-violet-500/30 pb-0.5">
                    Don't have an Account? Sign Up Here
                  </button>
                </div>
                <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest">Architecture integrity verified by PivotBloom v5 Protocols</p>
              </div>
            </div>
          )}

          {onboardingStep > 0 && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
              <div className="glass p-12 rounded-[56px] border border-white/10 w-full max-w-xl space-y-10 shadow-[0_0_100px_rgba(124,58,237,0.1)]">
                <div className="space-y-4">
                   <div className="flex items-center space-x-3">
                     {[1, 2].map(s => (
                       <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${onboardingStep >= s ? 'w-12 bg-violet-600' : 'w-4 bg-slate-800'}`} />
                     ))}
                   </div>
                   <h3 className="text-4xl font-black text-white italic tracking-tight">
                     {onboardingStep === 1 ? "Where are we headed?" : "Assess your base."}
                   </h3>
                   <p className="text-slate-400 font-light">
                     {onboardingStep === 1 ? "Define the summit of your next leadership peak." : "Be honest about your years of leadership experience."}
                   </p>
                </div>
                <div className="space-y-6">
                  {onboardingStep === 1 && (
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="e.g. VP of Product in FinTech" 
                      value={onboardingData.targetRole}
                      onChange={(e) => setOnboardingData(d => ({ ...d, targetRole: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleOnboardingNext()}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-3xl py-6 px-8 text-xl text-white outline-none focus:border-violet-500 transition-all placeholder:text-slate-700"
                    />
                  )}
                  {onboardingStep === 2 && (
                    <div className="grid grid-cols-1 gap-4">
                      {['Early Management (1-5 yrs)', 'Mid-Level Executive (5-10 yrs)', 'Senior Leadership (10-15 yrs)', 'VP/C-Suite Tier (15+ yrs)'].map(lvl => (
                        <button 
                          key={lvl}
                          onClick={() => setOnboardingData(d => ({ ...d, experienceLevel: lvl }))}
                          className={`w-full py-5 rounded-3xl border text-xs font-black uppercase tracking-widest transition-all ${onboardingData.experienceLevel === lvl ? 'bg-violet-600 text-white border-violet-500 shadow-xl' : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/20'}`}
                        >
                          {lvl}
                        </button> 
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleOnboardingNext}
                  disabled={(onboardingStep === 1 && !onboardingData.targetRole) || (onboardingStep === 2 && !onboardingData.experienceLevel)}
                  className="w-full py-6 bg-white text-slate-900 rounded-[32px] text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-2xl disabled:opacity-30"
                >
                  Confirm Strategy Protocol
                </button>
              </div>
            </div>
          )}

          {state.currentPhase === Phase.INTELLIGENCE && (
            <div className="h-full flex flex-col max-w-4xl mx-auto w-full animate-in fade-in duration-500">
               <div className="flex-1 space-y-8">
                 {state.history.length === 0 && (
                   <div className="flex justify-center py-20">
                     <div className="text-center space-y-6 max-w-md">
                        <div className="w-16 h-16 bg-violet-600/20 border border-violet-500/40 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                          <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">Ready for your next peak?</h3>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">Share your vision or upload your current credentials to begin our architectural alignment.</p>
                     </div>
                   </div>
                 )}
                 {state.history.map((msg, i) => (
                   <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                      <div className={`max-w-[75%] p-6 rounded-[28px] ${msg.role === 'user' ? 'bg-violet-600 text-white rounded-br-none' : 'glass border-white/10 rounded-bl-none shadow-xl'}`}>
                         <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                         {msg.files && msg.files.map((f, fi) => (
                           <div key={fi} className="mt-4 p-3 bg-black/40 rounded-xl border border-white/10 flex items-center space-x-3">
                              <div className="p-2 bg-violet-500/20 rounded-lg"><svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth={2}/></svg></div>
                              <div className="text-[10px] font-bold text-slate-300 truncate max-w-[150px]">{f.name}</div>
                           </div>
                         ))}
                      </div>
                   </div>
                 ))}
                 {(isThinking || isArchitecting) && (
                   <div className="flex justify-start">
                     <div className="p-6 rounded-[28px] glass border border-violet-500/30 space-y-3 min-w-[200px]">
                        <div className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">{processingStage || "Architecting..."}</div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-violet-500 w-full animate-progress-glow" />
                        </div>
                     </div>
                   </div>
                 )}
                 <div ref={messagesEndRef} />
               </div>
               
               {/* Controls area */}
               <div className="fixed bottom-24 left-0 right-0 z-40 px-6 flex flex-col items-center pointer-events-none">
                 <div className="max-w-4xl w-full flex flex-col items-center pointer-events-auto gap-4">
                    {state.milestones.length > 0 && (
                      <button 
                        onClick={() => advancePhase(Phase.TRAJECTORY)} 
                        className="px-10 py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-full text-[11px] font-bold uppercase tracking-[0.2em] shadow-2xl border border-violet-400/50 flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 animate-in slide-in-from-bottom-4"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
                        <span>View Strategic Trajectory</span>
                      </button>
                    )}
                    <div className="w-full flex flex-col items-center">
                      {pendingFile && (
                        <div className="mb-4 animate-in slide-in-from-bottom-2 flex items-center space-x-4 bg-slate-900/80 backdrop-blur-md px-6 py-4 rounded-[28px] border border-violet-500/30 shadow-2xl">
                          <div className="p-3 bg-violet-600/20 rounded-2xl">
                             <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth={2}/></svg>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">File Attached</span>
                            <span className="text-xs font-bold text-white max-w-[200px] truncate">{pendingFile.name}</span>
                          </div>
                          <button onClick={() => setPendingFile(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2}/></svg></button>
                        </div>
                      )}
                      <div className="w-full glass p-2 rounded-full border border-white/10 flex items-center shadow-2xl backdrop-blur-3xl">
                          <button onClick={handleFileClick} className="p-3 rounded-full text-slate-400 hover:text-white transition-all hover:bg-white/5"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg></button>
                          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.txt" />
                          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} className="flex-1 bg-transparent border-none text-sm px-4 text-slate-200 outline-none" placeholder="Share your vision or career credentials..." />
                          <button onClick={toggleRecording} className={`p-3 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-white'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v10a3 3 0 01-3 33 0 01-3-3V7a3 3 0 013-3z" /></svg></button>
                          <button onClick={handleSend} disabled={isLoading} className="bg-violet-600 p-3 rounded-full text-white hover:bg-violet-700 disabled:opacity-50 transition-all active:scale-90"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}/></svg></button>
                      </div>
                    </div>
                 </div>
               </div>
            </div>
          )}

          {state.currentPhase === Phase.SIMULATION && (
            <InterviewSimulator isActive={true} onClose={() => advancePhase(Phase.INTELLIGENCE)} onFinish={(r) => setState(v => ({...v, vault: {...v.vault, reports: [r, ...v.vault.reports]}}))} onReasoning={addReasoning} onNavigateToArchive={() => advancePhase(Phase.ARCHIVE)} onMilestonesDetected={(m) => setState(v => ({...v, milestones: m}))} />
          )}

          {state.currentPhase === Phase.TRAJECTORY && (
            <RoadmapVisualizer milestones={state.milestones} isLoading={isLoading} onToggleStatus={(id) => setState(v => ({...v, milestones: v.milestones.map(m => m.id === id ? {...m, status: m.status === 'Completed' ? 'Active' : 'Completed'} : m)}))} onRedirectToCoach={() => advancePhase(Phase.INTELLIGENCE)} onSaveToVault={() => advancePhase(Phase.ARCHIVE)} />
          )}

          {state.currentPhase === Phase.STUDIO && (
            <ArtifactGenerator artifact={state.currentArtifact} onGenerate={(t) => { setIsLoading(true); generateArtifact(t, state.history).then(a => { setState(v => ({...v, currentArtifact: a, vault: {...v.vault, artifacts: [a, ...v.vault.artifacts]}})); setIsLoading(false); }); }} onSave={(a) => setState(v => ({...v, vault: {...v.vault, artifacts: [a, ...v.vault.artifacts]}}))} isLoading={isLoading} />
          )}

          {state.currentPhase === Phase.ARCHIVE && (
            <div className="space-y-8 animate-in fade-in duration-700">
              {currentMoat && <div className="mb-12"><StrategicMoatView moat={currentMoat} /></div>}
              <TheVault vault={state.vault} streak={state.streak} onClose={() => advancePhase(Phase.INTELLIGENCE)} onOpenArtifact={(art) => setState(v => ({...v, currentArtifact: art, currentPhase: Phase.STUDIO}))} onOpenMoat={(m) => setCurrentMoat(m)} />
            </div>
          )}
        </div>
      </main>

      {state.currentPhase !== Phase.LANDING && state.currentPhase !== Phase.AUTH && (
        <footer className="h-24 border-t border-white/5 bg-slate-950/80 backdrop-blur-xl shrink-0 z-50 flex items-center justify-center">
          <PhaseIndicator 
            currentPhase={state.currentPhase} 
            onNavigate={advancePhase} 
            milestones={state.milestones}
          />
        </footer>
      )}
      <ReasoningLog logs={state.reasoningLog} isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} />
      <style>{`
        @keyframes progress-glow { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } } 
        .animate-progress-glow { animation: progress-glow 1.5s infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(124, 58, 237, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(124, 58, 237, 0.5); }
      `}</style>
    </div>
  );
};

export default App;
