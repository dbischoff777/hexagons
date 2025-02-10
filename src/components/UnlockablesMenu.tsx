import React from 'react';
import { getUnlockedRewards, getTheme, THEMES } from '../utils/progressionUtils';
import { getPlayerProgress } from '../utils/progressionUtils';
import './UnlockablesMenu.css';

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
  const tiles = rewards.filter(r => r.type === 'tile');

  // Add click handler for the overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
                    {!isUnlocked && (
                      <span className="unlock-level">
                        Unlocks at Level {rewards.find(r => r.id === theme.id)?.levelRequired}
                      </span>
                    )}
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
                className={`tile-item ${tile.unlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="tile-preview">
                  {tile.preview || '🎲'}
                </div>
                <div className="tile-info">
                  <span className="tile-name">{tile.name}</span>
                  <span className="tile-description">{tile.description}</span>
                  {!tile.unlocked && (
                    <div className="unlock-progress">
                      <div className="progress-text">
                        Level {progress.level} / {tile.levelRequired}
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${Math.min(100, (progress.level / tile.levelRequired) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="unlockables-section">
          <h3>Power-ups</h3>
          <div className="powerups-grid">
            {powerUps.map(powerup => (
              <div 
                key={powerup.id}
                className={`powerup-item ${powerup.unlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="powerup-preview">
                  {powerup.preview || '⚡'}
                </div>
                <div className="powerup-info">
                  <span className="powerup-name">{powerup.name}</span>
                  <span className="powerup-description">{powerup.description}</span>
                  {!powerup.unlocked && (
                    <div className="unlock-progress">
                      <div className="progress-text">
                        Level {progress.level} / {powerup.levelRequired}
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${Math.min(100, (progress.level / powerup.levelRequired) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
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