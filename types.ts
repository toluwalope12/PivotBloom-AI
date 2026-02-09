
export enum Phase {
  LANDING = 'LANDING',
  AUTH = 'AUTH',
  INTELLIGENCE = 'INTELLIGENCE',
  SIMULATION = 'SIMULATION',
  TRAJECTORY = 'TRAJECTORY',
  STUDIO = 'STUDIO',
  ARCHIVE = 'ARCHIVE'
}

export interface Resource {
  label: string;
  url: string;
  isGrounded?: boolean;
  type: 'video' | 'course' | 'article';
}

export interface Milestone {
  id: string;
  title: string;
  whyItMatters: string;
  timeline: string;
  status: 'Active' | 'Strategic Goal' | 'Completed';
  resources: Resource[];
}

export interface StrategicMoat {
  title: string;
  summary: string;
  correlations: Array<{
    surface: string;
    hidden: string;
    impact: string;
  }>;
  verdict: string;
}

export interface InterviewReport {
  id: string;
  timestamp: number;
  score: number;
  summary: string;
  strengths: string[];
  growthAreas: string[];
  executivePresenceAudit?: string;
  verbalQuality?: string;
  composure?: string;
  behavioralPerformance?: string;
}

export interface ProfessionalContext {
  skills: string[];
  gaps: string[];
  goals: string;
  moatInsights: string[];
  strengthScore: number;
  interviewReadiness: number;
  onboarding?: {
    targetRole: string;
    experienceLevel: string;
  };
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  reasoning?: string;
  data?: any;
  files?: Array<{ name: string; type: string; data: string }>;
  isStreaming?: boolean;
}

export interface ForgeArtifact {
  id: string;
  type: 'RESUME' | 'EMAIL' | 'ROADMAP';
  draft: string;
  critique: string;
  polished: string;
  timestamp: number;
}

export interface AppState {
  currentPhase: Phase;
  history: Message[];
  reasoningLog: string[];
  professionalContext: ProfessionalContext;
  isLiveActive: boolean;
  uploadedFiles: Array<{ name: string; type: string; data: string }>;
  currentArtifact?: ForgeArtifact;
  milestones: Milestone[];
  vault: {
    artifacts: ForgeArtifact[];
    moats: StrategicMoat[];
    reports: InterviewReport[];
  };
  streak: number;
  lastVisit: number;
  user?: {
    name: string;
    email: string;
    provider: string;
  };
}
