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
        left: `${popup.x}px`,
        top: `${popup.y}px`
      }}
    >
      <span className="emoji">{popup.emoji}</span>
      <div className="popup-content">
        <div className="popup-text">{popup.text}</div>
        <div className="popup-score">+{popup.score}</div>
      </div>
    </div>
  );
};

export default ScorePopup; 