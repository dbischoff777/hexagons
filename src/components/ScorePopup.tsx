import { ScorePopupData } from '../types/scorePopup';
import './ScorePopup.css';

interface ScorePopupProps {
  popup: ScorePopupData;
}

const ScorePopup: React.FC<ScorePopupProps> = ({ popup }) => {
  return (
    <div
      className="score-popup"
      data-type={popup.type}
      style={{
        left: `${popup.x}px`,  // Use pixel values since we calculated viewport coordinates
        top: `${popup.y}px`
      }}
    >
      <span className="emoji">{popup.emoji}</span>
      <div className="popup-content">
        <div className="popup-text">{popup.text}</div>
        {/* Only show score if it's not a wrong placement */}
        {popup.type !== 'wrong' && popup.score > 0 && (
          <div className="popup-score">+{popup.score}</div>
        )}
      </div>
    </div>
  );
};

export default ScorePopup; 