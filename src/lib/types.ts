import { Timestamp } from "firebase/firestore";

export interface SentenceFeedback {
  sentence: string;
  feedback: string;
  bandScore: number;
  improvements: string;
}

export interface BandScores {
  taskAchievement: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
  overall: number;
}

export interface VocabWord {
  word: string;
  definition: string;
  example: string;
  partOfSpeech: string;
}

export interface GrammarStructure {
  name: string;
  explanation: string;
  template: string;
  example: string;
  usageNote: string;
}

export interface TaskFeedback {
  taskNumber: 1 | 2;
  sentences: SentenceFeedback[];
  bandScores: BandScores;
  generalComment: string;
  vocabulary: VocabWord[];
  grammarStructures: GrammarStructure[];
}

export interface ReportData {
  id?: string;
  taskNumber: 1 | 2;
  prompt: string;
  userText: string;
  imageUrl?: string;
  feedback: TaskFeedback;
  createdAt: Timestamp | any;
  essayLength: number;
}

export interface UserData {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  createdAt?: Timestamp;
  subscription?: {
    plan: "free" | "pro";
    expiresAt?: Timestamp;
  };
}
