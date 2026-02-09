
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { SIMULATOR_SYSTEM_INSTRUCTION } from '../constants';
import { generatePerformanceReview, runAuditorEngine } from '../geminiService';
import { InterviewReport, Milestone } from '../types';

interface InterviewSimulatorProps {
  isActive: boolean;
  onClose: () => void;
  onFinish: (report: InterviewReport) => void;
  onReasoning: (reasoning: string) => void;
  onNavigateToArchive: () => void;
  onMilestonesDetected?: (milestones: Milestone[]) => void;
}

const SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const AUDIT_INTERVAL = 5000; 
const FRAME_RATE = 1; // Send 1 frame per second for multimodal context

export const InterviewSimulator: React.FC<InterviewSimulatorProps> = ({ 
  isActive, 
  onClose, 
  onFinish, 
  onReasoning, 
  onNavigateToArchive,
  onMilestonesDetected 
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState<{user: string, model: string}>({user: '', model: ''});
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [behavioralTip, setBehavioralTip] = useState<string>("Simulation initialized.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [isSignalPulse, setIsSignalPulse] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptRef = useRef<string>("");
  const behavioralNotesRef = useRef<string[]>([]);
  const auditTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoFrameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnalyzedTranscriptRef = useRef<string>("");
  const modelAccumulatedTextRef = useRef<string>("");

  useEffect(() => {
    if (isActive) startSession();
    else stopSession();
    return () => stopSession();
  }, [isActive]);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
      
      // 5ms linear fade to stop audio popping/jitter at chunk boundaries
      const fadeFrames = Math.floor(sampleRate * 0.005);
      for (let i = 0; i < fadeFrames && i < frameCount; i++) {
        const fade = i / fadeFrames;
        channelData[i] *= fade;
        channelData[frameCount - 1 - i] *= fade;
      }
    }
    return buffer;
  };

  const encode = (float32: Float32Array) => {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) int16[i] = float32[i] * 32768;
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const performAudit = async () => {
    if (!isActive) return;
    const currentFullTranscript = transcriptRef.current;
    const newText = currentFullTranscript.replace(lastAnalyzedTranscriptRef.current, "").trim();
    if (newText.length === 0) return;
    
    if (newText.length < 20) {
       setBehavioralTip("Maintaining executive poise. I am ready when you are.");
       return;
    }
    
    try {
      onReasoning("Executive Presence Auditor processing signals...");
      const tip = await runAuditorEngine(newText);
      if (tip) {
        setBehavioralTip(tip);
        behavioralNotesRef.current.push(tip);
        lastAnalyzedTranscriptRef.current = currentFullTranscript;
      }
    } catch (e) {
      console.error("Auditor failure", e);
    }
  };

  const startSession = async () => {
    setIsConnecting(true);
    const greeting = "I'm here with you. Let's practice that executive poise.";
    setTranscription(prev => ({ ...prev, model: greeting }));
    modelAccumulatedTextRef.current = greeting;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
      
      await outputCtx.resume();
      audioContextRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(16384, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const max = Math.max(...inputData.map(Math.abs));
              setVolumeLevel(max);
              sessionPromise.then(s => s.sendRealtimeInput({
                media: { data: encode(inputData), mimeType: 'audio/pcm;rate=16000' }
              }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            
            auditTimerRef.current = setInterval(performAudit, AUDIT_INTERVAL);

            // Multimodal Frame Streaming
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            videoFrameTimerRef.current = setInterval(() => {
              if (videoRef.current && isActive) {
                canvas.width = videoRef.current.videoWidth || 640;
                canvas.height = videoRef.current.videoHeight || 480;
                ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                  if (blob) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64 = (reader.result as string).split(',')[1];
                      sessionPromise.then(s => s.sendRealtimeInput({
                        media: { data: base64, mimeType: 'image/jpeg' }
                      }));
                    };
                    reader.readAsDataURL(blob);
                  }
                }, 'image/jpeg', 0.5);
              }
            }, 1000 / FRAME_RATE);
          },
          onmessage: async (msg) => {
            if (msg.serverContent?.outputTranscription) {
              const text = msg.serverContent.outputTranscription.text || "";
              setTranscription(prev => ({ ...prev, model: prev.model + text }));
              transcriptRef.current += text;
              modelAccumulatedTextRef.current += text;

              // Robust extraction for voice-sim milestones
              const milestoneMatch = modelAccumulatedTextRef.current.match(/<milestones>([\s\S]*?)<\/milestones>/);
              if (milestoneMatch && onMilestonesDetected) {
                try {
                  const cleanedJson = milestoneMatch[1].replace(/```json|```/g, '').trim();
                  const milestones = JSON.parse(cleanedJson);
                  
                  if (Array.isArray(milestones) && milestones.length > 0) {
                    setIsSignalPulse(true);
                    setTimeout(() => setIsSignalPulse(false), 2000);
                    
                    onReasoning("Trajectory detected via multimodal signals.");
                    onMilestonesDetected(milestones);
                    setTimeout(() => handleFinishSession(), 2500);
                  }
                } catch (e) {
                  // Catch errors silently during stream accumulations
                }
              }
            }
            if (msg.serverContent?.inputTranscription) {
              const text = msg.serverContent.inputTranscription.text || "";
              setTranscription(prev => ({ ...prev, user: text }));
              transcriptRef.current += text;
            }
            const audioBase64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioBase64) {
              setIsModelSpeaking(true);
              const ctx = audioContextRef.current;
              if (!ctx) return;
              
              const buffer = await decodeAudioData(decode(audioBase64), ctx, OUTPUT_SAMPLE_RATE, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsModelSpeaking(false);
              };
              const scheduledTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
              source.start(scheduledTime);
              nextStartTimeRef.current = scheduledTime + buffer.duration;
              sourcesRef.current.add(source);
            }
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SIMULATOR_SYSTEM_INSTRUCTION,
          inputAudioTranscription: {}, 
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'aoede' } } }
        }
      });
      sessionRef.current = sessionPromise;
    } catch (err) { 
      setIsConnecting(false); 
      onClose();
    }
  };

  const stopSession = () => {
    if (sourcesRef.current) {
      sourcesRef.current.forEach(source => {
        try { source.stop(); source.disconnect(); } catch (e) {}
      });
      sourcesRef.current.clear();
    }
    if (sessionRef.current) sessionRef.current.then((s: any) => s.close());
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    if (auditTimerRef.current) clearInterval(auditTimerRef.current);
    if (videoFrameTimerRef.current) clearInterval(videoFrameTimerRef.current);
    setIsModelSpeaking(false);
  };

  const handleFinishSession = async () => {
    stopSession();
    setIsAnalyzing(true);
    try {
      onReasoning("Finalizing Diagnostic Performance Review...");
      const review = await generatePerformanceReview(transcriptRef.current, behavioralNotesRef.current.join(", "), (retry) => {
        setIsCoolingDown(true);
        onReasoning(`Synthesizing insights... retry ${retry}`);
      });
      setIsCoolingDown(false);
      onFinish({ ...review, id: crypto.randomUUID(), timestamp: Date.now() } as InterviewReport);
      onNavigateToArchive();
    } catch (e) {
      onClose();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderTranscript = (text: string) => {
    if (!text) return null;
    // Remove the raw milestones block from the visual transcript for elite cleanliness
    const visibleText = text.replace(/<milestones>[\s\S]*?<\/milestones>/g, '');
    const parts = visibleText.split(/(!TIP:.*?)(?=[.!?\n]|$)/g);
    return parts.map((part, i) => (
      part.startsWith('!TIP:') 
        ? <span key={i} className="text-orange-400 font-bold drop-shadow-sm">{part}</span>
        : <span key={i}>{part}</span>
    ));
  };

  if (!isActive) return null;

  return (
    <div className="w-full max-h-screen overflow-y-auto custom-scrollbar flex flex-col space-y-8 py-6 pb-32 animate-in fade-in">
      <div className="flex justify-between items-center px-2 shrink-0">
        <h2 className="text-3xl font-bold tracking-tight text-white italic">Executive Simulation</h2>
        <div className="flex items-center space-x-4">
          {isSignalPulse && (
            <div className="px-4 py-2 rounded-xl bg-violet-600/30 text-violet-300 text-[9px] font-black uppercase tracking-[0.2em] border border-violet-500 animate-pulse flex items-center">
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-2 animate-ping" />
              Trajectory Signal Synchronized
            </div>
          )}
          <div className="px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-violet-500/20 bg-slate-900 text-violet-400">
            Multimodal Auditor Active
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start shrink-0">
        <div className="flex flex-col space-y-4 min-h-0">
          <div className="relative rounded-[40px] overflow-hidden bg-black border border-white/10 max-h-[450px] w-full shadow-2xl flex-shrink-0">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full min-h-[400px] max-h-[450px] aspect-video object-cover scale-x-[-1]" 
            />
            
            <div className="absolute top-[350px] inset-x-0 h-1 bg-slate-800/50">
               <div className="h-full bg-violet-600 transition-all duration-75 shadow-[0_0_15px_rgba(124,58,237,0.6)]" style={{ width: `${Math.min(100, volumeLevel * 400)}%` }} />
            </div>

            <div className="absolute bottom-0 inset-x-0 h-[100px] p-6 bg-slate-950/60 backdrop-blur-md border-t border-white/10 flex flex-col justify-center">
                <div className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1 flex items-center relative z-10">
                  <span className="w-2 h-2 bg-violet-500 rounded-full mr-2 animate-pulse" />
                  Signal Presence
                </div>
                <div className="text-sm text-white font-medium italic leading-relaxed relative z-10 animate-in fade-in line-clamp-2">
                  {isCoolingDown ? "Strategizing next move..." : `"${behavioralTip}"`}
                </div>
            </div>

            <div className="absolute top-6 left-8 flex items-center space-x-2 z-10">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">LIVE_AUDIT_PROTOCOL</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-4 min-h-0">
          <div className="min-h-[400px] glass rounded-[40px] p-10 border border-white/10 relative flex flex-col shadow-inner overflow-hidden">
            {/* Visual Signal Detected Pulse Background */}
            {isSignalPulse && <div className="absolute inset-0 bg-violet-600/5 animate-pulse z-0" />}
            
            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 pr-2">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div className={`w-40 h-40 rounded-full bg-violet-600/10 blur-[80px] transition-all duration-700 ${isModelSpeaking ? 'scale-150 opacity-100' : 'scale-50 opacity-0'}`} />
              </div>
              <div className="space-y-6">
                <div className="text-violet-50 text-xl font-light leading-relaxed whitespace-pre-wrap">
                  {transcription.model ? renderTranscript(transcription.model) : (isConnecting ? "Listening..." : "I'm ready.")}
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={handleFinishSession} 
            disabled={isAnalyzing} 
            className="w-full py-5 bg-violet-600 hover:bg-violet-700 border border-violet-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 flex-shrink-0"
          >
            {isAnalyzing ? "Synthesizing Career Diagnosis..." : "End Session & Analyze"}
          </button>
        </div>
      </div>
    </div>
  );
};
