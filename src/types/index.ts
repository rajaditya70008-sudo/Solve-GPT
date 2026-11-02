export type CreationMode = 'auto' | 'chat' | 'solver' | 'photo' | 'video';
export type TabType = 'solver' | 'photos' | 'videos' | 'chat';

export interface ChatRole {
  id: string;
  name: string;
  description: string;
  icon: string;
  model: 'gemini-3.8-flash' | 'gemini-4-argon' | 'gemini-3.1-flash-lite';
  systemInstruction: string;
  enableSearch?: boolean;
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface ProblemStep {
  stepNumber: number;
  title: string;
  instruction: string;
  keyInsight?: string;
  photoPrompt?: string;
  videoPrompt?: string;
}

export interface ProblemSolution {
  title: string;
  category: string;
  summary: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | string;
  estimatedTime: string;
  requiredTools: string[];
  safetyPrecautions?: string[];
  steps: ProblemStep[];
  preventionTips?: string[];
  alternativeSolutions?: string[];
}

export interface GeneratedPhoto {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  style?: string;
  createdAt: number;
  explanation?: string;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  duration: string;
  resolution: string;
  createdAt: number;
  thumbnail?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  modelUsed?: string;
  sources?: GroundingSource[];
  photoData?: GeneratedPhoto;
  videoData?: GeneratedVideo;
  solutionData?: ProblemSolution;
  messageType?: 'text' | 'photo' | 'video' | 'solution';
  referenceImage?: string;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}
