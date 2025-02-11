import React from 'react';
import { Companion, COMPANIONS, CompanionId } from '../types/companion';
import './CompanionHUD.css';

interface CompanionHUDProps {
  companion: Companion;
}

const CompanionHUD: React.FC<CompanionHUDProps> = ({ companion }) => {
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