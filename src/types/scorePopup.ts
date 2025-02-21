export type PopupType = 'score' | 'combo' | 'quick' | 'clear' | 'wrong' | 'bonus';

export interface ScorePopupData {
  id: number;
  x: number;
  y: number;
  score: number;
  text: string;
  emoji: string;
  type: PopupType;
}

export interface PopupPosition {
  x: number;
  y: number;
} 