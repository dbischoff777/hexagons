import React, { useState, useEffect } from 'react';
import { Companion, COMPANIONS, CompanionId } from '../types/companion';
import CompanionSpeech from './CompanionSpeech';
import './CompanionHUD.css';

interface CompanionHUDProps {
  companion: Companion;
  score: number;
  combo: number;
  lastAction?: {
    type: 'match' | 'combo' | 'clear' | 'ability';
    value?: number;
    abilityName?: string;
  };
}

const CompanionHUD: React.FC<CompanionHUDProps> = ({ 
  companion, 
  score, 
  combo, 
  lastAction 
}) => {
  const [speech, setSpeech] = useState<{
    message: string;
    type: 'normal' | 'excited' | 'ability' | 'achievement';
    key: number;
  } | null>(null);

  // Personality-based responses
  const getPersonalityResponse = (type: string, value?: number) => {
    const personality = COMPANIONS[companion.id as CompanionId].personality;
    
    switch (type) {
      case 'greeting':
        return personality.greetings[Math.floor(Math.random() * personality.greetings.length)];
      case 'match':
        return value && value > 50 
          ? personality.bigMatch[Math.floor(Math.random() * personality.bigMatch.length)]
          : personality.smallMatch[Math.floor(Math.random() * personality.smallMatch.length)];
      case 'combo':
        return value && value > 3
          ? personality.bigCombo[Math.floor(Math.random() * personality.bigCombo.length)]
          : personality.smallCombo[Math.floor(Math.random() * personality.smallCombo.length)];
      case 'ability':
        return personality.abilityUse[Math.floor(Math.random() * personality.abilityUse.length)];
      default:
        return personality.idle[Math.floor(Math.random() * personality.idle.length)];
    }
  };

  // Handle companion reactions
  useEffect(() => {
    if (lastAction) {
      let message = '';
      let type: 'normal' | 'excited' | 'ability' | 'achievement' = 'normal';

      switch (lastAction.type) {
        case 'match':
          message = getPersonalityResponse('match', lastAction.value);
          type = lastAction.value && lastAction.value > 50 ? 'excited' : 'normal';
          break;
        case 'combo':
          message = getPersonalityResponse('combo', lastAction.value);
          type = lastAction.value && lastAction.value > 3 ? 'excited' : 'normal';
          break;
        case 'ability':
          message = `${getPersonalityResponse('ability')}\n${lastAction.abilityName} activated!`;
          type = 'ability';
          break;
        case 'clear':
          message = "Amazing grid clear! Let's keep the momentum going! ✨";
          type = 'achievement';
          break;
      }

      setSpeech({ message, type, key: Date.now() });
    }
  }, [lastAction, companion.id]);

  // Random idle messages
  useEffect(() => {
    const idleTimer = setInterval(() => {
      if (Math.random() < 0.1 && !speech) { // 10% chance every interval
        setSpeech({
          message: getPersonalityResponse('idle'),
          type: 'normal',
          key: Date.now()
        });
      }
    }, 20000); // Check every 20 seconds

    return () => clearInterval(idleTimer);
  }, [speech, companion.id]);

  // Initial greeting
  useEffect(() => {
    setSpeech({
      message: getPersonalityResponse('greeting'),
      type: 'normal',
      key: Date.now()
    });
  }, [companion.id]);

  return (
    <div className="companion-hud">
      <div className="companion-info">
        <div className="companion-avatar">
          {COMPANIONS[companion.id as CompanionId].avatar}
          <div className="companion-level">Lvl {companion.level}</div>
        </div>
        <div className="companion-progress">
          <div 
            className="experience-bar"
            style={{ 
              width: `${(companion.experience / companion.experienceToNext) * 100}%`
            }}
          />
          <span className="experience-text">
            {companion.experience}/{companion.experienceToNext} XP
          </span>
        </div>
        {speech && (
          <CompanionSpeech
            key={speech.key}
            message={speech.message}
            type={speech.type}
          />
        )}
      </div>
      <div className="companion-abilities">
        {companion.abilities.map(ability => (
          <button
            key={ability.id}
            className={`ability-button ${ability.isActive ? 'active' : ''}`}
            disabled={true}
            title={`${ability.description} (Activates automatically when ready)`}
          >
            <div className="ability-icon">{ability.icon}</div>
            <span className="ability-name">{ability.name}</span>
            {ability.currentCooldown > 0 ? (
              <div className="cooldown-overlay">
                {ability.currentCooldown}s
              </div>
            ) : !ability.isActive && (
              <div className="ready-overlay">
                Ready!
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CompanionHUD; 