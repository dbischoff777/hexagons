import React, { useEffect, useState } from 'react';
import './CompanionSpeech.css';

interface CompanionSpeechProps {
  message: string;
  duration?: number;
  type?: 'normal' | 'excited' | 'ability' | 'achievement';
}

const CompanionSpeech: React.FC<CompanionSpeechProps> = ({ 
  message, 
  duration = 3000,
  type = 'normal' 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!isVisible) return null;

  return (
    <div className={`companion-speech ${type}`}>
      <div className="speech-bubble">
        {message}
      </div>
      <div className="speech-pointer" />
    </div>
  );
};

export default CompanionSpeech; 