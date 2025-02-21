import React from 'react';
import { getUnlockedRewards, getTheme, THEMES } from '../utils/progressionUtils';
import { getPlayerProgress } from '../utils/progressionUtils';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { DEFAULT_SCHEME } from '../utils/colorSchemes';
import './UnlockablesMenu.css';
import { SeasonalTheme, UnlockableReward } from '../types/progression';
import { SEASONAL_THEMES, getActiveSeasonalThemes } from '../utils/seasonalThemes';
import { CompanionId } from '../types/companion';
import { PROGRESSION_KEY } from '../utils/progressionUtils';
import CustomCursor from './CustomCursor';

interface UnlockablesMenuProps {
  onSelectTheme: (themeId: string) => void;
  onSelectCompanion: (companionId: CompanionId) => void;
  onClose: () => void;
}

const DEFAULT_THEME: SeasonalTheme = {
  id: 'default',
  name: 'Default Theme',
  description: 'The classic neon theme',
  startDate: '',
  endDate: '',
  colors: {
    background: '#1a1a2e',
    primary: '#00FF9F',
    secondary: '#2d2d4d',
    accent: '#00FFFF'
  },
  icon: '🎮'
};

const UnlockablesMenu: React.FC<UnlockablesMenuProps> = ({ 
  onSelectTheme, 
  onSelectCompanion, 
  onClose
}) => {
  const { settings } = useAccessibility();
  const isColorBlind = settings.isColorBlind;
  const rewards = getUnlockedRewards();
  const progress = getPlayerProgress();
  const theme = getTheme(progress.selectedTheme || 'default');
  const activeSeasonalThemes = getActiveSeasonalThemes();
  
  console.log('Debug theme selection:', {
    rewards,
    progress,
    theme,
    activeSeasonalThemes
  });

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
    ...rewards
      .filter(r => r.type === 'theme')
      .filter(theme => !activeSeasonalThemes.some(seasonal => seasonal.id === theme.id)),
    ...activeSeasonalThemes.map(seasonal => ({
      type: 'theme' as const,
      id: seasonal.id,
      name: seasonal.name,
      description: `${seasonal.description} (Available until ${new Date(seasonal.endDate).toLocaleDateString()})`,
      levelRequired: 1,
      unlocked: true,
      seasonal: true,
      icon: seasonal.icon
    }))
  ];
  console.log('Combined themes:', themes);
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

  const getThemeTimeRemaining = (theme: typeof themes[0]) => {
    if ('seasonal' in theme) {
      const seasonal = SEASONAL_THEMES.find(s => s.id === theme.id);
      if (seasonal) {
        const end = new Date(seasonal.endDate);
        const now = new Date();
        const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return `${days} days remaining`;
      }
    }
    return null;
  };

  return (
    <div 
      className="unlockables-overlay" 
      onClick={handleOverlayClick}
      style={{
        '--theme-primary': isColorBlind ? DEFAULT_SCHEME.colors.primary : theme.colors.primary,
        '--theme-secondary': isColorBlind ? DEFAULT_SCHEME.colors.secondary : theme.colors.secondary,
        '--theme-accent': isColorBlind ? DEFAULT_SCHEME.colors.accent : theme.colors.accent,
        '--theme-background': isColorBlind ? DEFAULT_SCHEME.colors.background : theme.colors.background,
        '--theme-text': isColorBlind ? DEFAULT_SCHEME.colors.text : theme.colors.text,
      } as React.CSSProperties}
    >
      <CustomCursor 
        color={isColorBlind ? DEFAULT_SCHEME.colors.primary : theme.colors.primary}
        hide={false}
      />
      <div className="unlockables-container">
        <h2>Unlockables</h2>
        
        <div className="unlockables-section">
          <h3>Themes</h3>
          <div className="themes-grid">
            {themes.map(theme => {
              const isUnlocked = theme.unlocked || theme.id === 'default';
              const themeConfig = ('seasonal' in theme ? 
                SEASONAL_THEMES.find(t => t.id === theme.id) : 
                THEMES.find(t => t.id === theme.id)) || DEFAULT_THEME;
              const timeRemaining = getThemeTimeRemaining(theme);
              
              return (
                <div 
                  key={theme.id}
                  className={`theme-item ${isUnlocked ? 'unlocked' : 'locked'} ${
                    theme.id === 'default' ? 'selected' : ''
                  } ${timeRemaining ? 'seasonal' : ''}`}
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
                    <span className="theme-name">
                      {theme.name}
                      {'seasonal' in theme && <span className="seasonal-icon">{theme.icon}</span>}
                    </span>
                    {timeRemaining && (
                      <span className="time-remaining">{timeRemaining}</span>
                    )}
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

        <div className="unlockables-section">
          <h3>Companions</h3>
          <div className="companions-grid">
            {rewards.filter(r => r.type === 'companion').map(companionReward => {
              const isUnlocked = companionReward.unlocked;
              const isSelected = progress.selectedCompanion === companionReward.id;
              
              return (
                <div 
                  key={companionReward.id}
                  className={`theme-item ${isUnlocked ? 'unlocked' : 'locked'} ${
                    isSelected ? 'selected' : ''
                  }`}
                  onClick={() => {
                    if (isUnlocked) {
                      onSelectCompanion(companionReward.id as CompanionId);
                      const progress = getPlayerProgress();
                      progress.selectedCompanion = companionReward.id as CompanionId;
                      localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progress));
                    }
                  }}
                >
                  <div className="companion-preview">
                    <span className="companion-avatar">
                      {companionReward.preview}
                    </span>
                  </div>
                  <div className="theme-info">
                    <span className="theme-name">
                      {companionReward.name}
                    </span>
                    <span className="theme-description">
                      {companionReward.description}
                    </span>
                    {!isUnlocked && (
                      <span className="unlock-level">
                        Unlocks at Level {companionReward.levelRequired}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnlockablesMenu; 