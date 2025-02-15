export type PopupType = 'score' | 'combo' | 'quick' | 'clear';

export interface ScorePopupData {
  score: number;
  x: number;
  y: number;
  id: number;
  emoji: string;
  text: string;
  type: PopupType;
}

export interface PopupPosition {
  x: number;
  y: number;
} 