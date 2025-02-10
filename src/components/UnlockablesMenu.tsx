import React from 'react';
import { getUnlockedRewards, getTheme, THEMES } from '../utils/progressionUtils';
import { getPlayerProgress } from '../utils/progressionUtils';
import './UnlockablesMenu.css';
import { UnlockableReward } from '../types/progression';

interface UnlockablesMenuProps {
  onSelectTheme: (themeId: string) => void;
  onClose: () => void;
}

const UnlockablesMenu: React.FC<UnlockablesMenuProps> = ({ onSelectTheme, onClose }) => {
  const rewards = getUnlockedRewards();
  const progress = getPlayerProgress();
  const currentTheme = getTheme(progress.selectedTheme || 'default');

  const powerUps = rewards.filter(r => r.type === 'powerup');
  const themes = [
    {
      type: 'theme' as const,
      id: 'default',
      name: 'Default',
      description: 'The classic neon theme',
      levelRequired: 1,
      unlocked: true
    },
    ...rewards.filter(r => r.type === 'theme')
  ];
  const tiles = rewards.filter(r => r.type === 'tile' || r.type === 'special_tile');

  // Add click handler for the overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderUnlockLevel = (item: UnlockableReward) => (
    !item.unlocked && (
      <span className="unlock-level">
        Unlocks at Level {item.levelRequired}
      </span>
    )
  );

  return (
    <div className="unlockables-overlay" onClick={handleOverlayClick}>
      <div className="unlockables-container">
        <h2>Unlockables</h2>
        
        <div className="unlockables-section">
          <h3>Themes</h3>
          <div className="themes-grid">
            {themes.map(theme => {
              const isUnlocked = theme.unlocked || theme.id === 'default';
              const themeConfig = THEMES.find(t => t.id === theme.id) || THEMES[0];
              return (
                <div 
                  key={theme.id}
                  className={`theme-item ${isUnlocked ? 'unlocked' : 'locked'} ${currentTheme.id === theme.id ? 'selected' : ''}`}
                  onClick={() => isUnlocked && onSelectTheme(theme.id)}
                >
                  <div 
                    className="theme-preview"
                    style={{
                      background: themeConfig.colors.background,
                      border: `2px solid ${themeConfig.colors.primary}`
                    }}
                  >
                    <div className="preview-element" style={{ background: themeConfig.colors.primary }} />
                    <div className="preview-element" style={{ background: themeConfig.colors.secondary }} />
                    <div className="preview-element" style={{ background: themeConfig.colors.accent }} />
                  </div>
                  <div className="theme-info">
                    <span className="theme-name">{theme.name}</span>
                    {renderUnlockLevel(theme)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="unlockables-section">
          <h3>Special Tiles</h3>
          <div className="tiles-grid">
            {tiles.map(tile => (
              <div 
                key={tile.id}
                className={`theme-item ${tile.unlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="theme-preview">
                  {tile.preview || '🎲'}
                </div>
                <div className="theme-info">
                  <span className="theme-name">{tile.name}</span>
                  <span className="theme-description">{tile.description}</span>
                  {renderUnlockLevel(tile)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="unlockables-section">
          <h3>Power-ups</h3>
          <div className="themes-grid">
            {powerUps.map(powerup => (
              <div 
                key={powerup.id}
                className={`theme-item ${powerup.unlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="theme-preview">
                  {powerup.preview || '⚡'}
                </div>
                <div className="theme-info">
                  <span className="theme-name">{powerup.name}</span>
                  <span className="theme-description">{powerup.description}</span>
                  {renderUnlockLevel(powerup)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnlockablesMenu; 