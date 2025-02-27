export interface SimonTile {
  index: number;
  color: string;
  isActive: boolean;
  label: string;
}

export type SimonSequence = number[];

export interface SimonGameState {
  sequence: SimonSequence;
  playerSequence: SimonSequence;
  score: number;
  isPlaying: boolean;
  isShowingSequence: boolean;
  currentStep: number;
  highScore: number;
}

export interface SimonGameConfig {
  initialLength: number;
  maxLength: number;
  playbackSpeed: number;
}

export interface SimonSoundConfig {
  tileClick: string;
  success: string;
  gameOver: string;
  sequence: string[];
}

export type SimonDifficulty = 'easy' | 'medium' | 'hard';

export interface SimonTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

export interface SimonTileAnimation {
  type: 'activate' | 'success' | 'error';
  duration: number;
  startTime: number;
}

export interface SimonStats {
  gamesPlayed: number;
  highScore: number;
  totalScore: number;
  averageScore: number;
  longestSequence: number;
  lastPlayed: string;
} 