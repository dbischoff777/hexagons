import { PopupType, PopupPosition, ScorePopupData } from '../types/scorePopup';

export const getPopupPosition = (type: PopupType, baseX: number, baseY: number): PopupPosition => {
  const spacing = 100; // Base spacing between popups
  
  switch (type) {
    case 'score':
      return { x: baseX, y: baseY - spacing };
    case 'quick':
      return { x: baseX - spacing * 1.5, y: baseY }; // Further left
    case 'combo':
      return { x: baseX + spacing * 1.5, y: baseY }; // Further right
    case 'clear':
      // For grid clear, use the center of the canvas
      return { x: window.innerWidth / 2, y: window.innerHeight / 2 }; // Center of screen
    default:
      return { x: baseX, y: baseY };
  }
};

export const createScorePopup = ({
  score,
  x,
  y,
  emoji,
  text,
  type
}: Omit<ScorePopupData, 'id'>): ScorePopupData => {
  const position = getPopupPosition(type, x, y);
  return {
    score,
    x: position.x,
    y: position.y,
    id: Date.now() + Math.random(),
    emoji,
    text,
    type
  };
}; 