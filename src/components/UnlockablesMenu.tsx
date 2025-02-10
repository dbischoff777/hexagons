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

  const drawThemePreview = (
    ctx: CanvasRenderingContext2D, 
    colors: { background: string; primary: string; secondary: string; accent: string; },
    width: number,
    height: number
  ) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    // Draw a hexagon tile preview
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height) * 0.3;

    // Draw hexagon
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = centerX + size * Math.cos(angle);
      const y = centerY + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    // Fill with secondary color (tile background)
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size);
    gradient.addColorStop(0, colors.secondary);
    gradient.addColorStop(1, colors.background);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw edges with primary color
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw a small score popup preview
    const popupWidth = width * 0.4;
    const popupHeight = height * 0.2;
    const popupX = width * 0.55;
    const popupY = height * 0.2;

    // Popup background
    ctx.fillStyle = colors.accent;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.roundRect(popupX, popupY, popupWidth, popupHeight, 5);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Popup border
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Add text preview
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+100', popupX + popupWidth/2, popupY + popupHeight/2);
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
                  <canvas 
                    className="theme-preview"
                    width={120}
                    height={80}
                    ref={canvas => {
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          drawThemePreview(ctx, themeConfig.colors, canvas.width, canvas.height);
                        }
                      }
                    }}
                  />
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