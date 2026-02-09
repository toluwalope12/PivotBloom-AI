
import React from 'react';
import { Phase, Milestone } from '../types';
import { PHASE_LABELS } from '../constants';

interface PhaseIndicatorProps {
  currentPhase: Phase;
  onNavigate: (p: Phase) => void;
  milestones: Milestone[];
}

const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ currentPhase, onNavigate, milestones }) => {
  const phases = [Phase.INTELLIGENCE, Phase.SIMULATION, Phase.TRAJECTORY, Phase.STUDIO, Phase.ARCHIVE];
  const hasMilestones = milestones && milestones.length > 0;

  return (
    <nav className="flex items-center space-x-1 glass px-4 py-2.5 rounded-[32px] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      {phases.map((phase, idx) => {
        const isActive = phase === currentPhase;
        const isPast = phases.indexOf(currentPhase) > idx;
        
        // Locking logic: Trajectory and Studio require roadmap data
        const isLocked = (phase === Phase.TRAJECTORY || phase === Phase.STUDIO) && !hasMilestones;
        
        return (
          <React.Fragment key={phase}>
            <button 
              onClick={() => !isLocked && onNavigate(phase)}
              disabled={isLocked}
              className={`flex flex-col items-center space-y-1.5 px-6 py-3 rounded-2xl transition-all duration-700 relative group ${
                isActive 
                  ? 'text-violet-400 bg-violet-600/10' 
                  : isLocked 
                    ? 'text-slate-500 cursor-default' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title={isLocked ? "Requires Roadmap Activation" : ""}
            >
              {/* Status Dot */}
              <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                isActive 
                  ? 'bg-violet-400 shadow-[0_0_15px_rgba(167,139,250,1)] scale-125' 
                  : isPast 
                    ? 'bg-violet-900' 
                    : isLocked 
                      ? 'bg-slate-800' 
                      : 'bg-slate-600'
              }`} />
              
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-500 ${
                isActive 
                  ? 'opacity-100 scale-105' 
                  : isLocked 
                    ? 'opacity-40' 
                    : 'opacity-70 group-hover:opacity-100'
              }`}>
                {PHASE_LABELS[phase]}
              </span>
              
              {isLocked && (
                <div className="absolute -top-1 -right-1 flex items-center">
                  <svg className="w-2.5 h-2.5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-violet-400 rounded-full blur-[2px] shadow-[0_0_10px_rgba(167,139,250,0.5)]" />
              )}
            </button>
            {idx < phases.length - 1 && (
              <div className="w-4 h-[1px] bg-white/5" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default PhaseIndicator;
