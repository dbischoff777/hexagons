import React from 'react';
import BulldogCustomizer from './BulldogCustomizer';
import bulldogConfig from '../config/bulldogConfig.json';
import { getUnlockedCustomizations } from '../utils/customizationUtils';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { getPlayerProgress, getTheme } from '../utils/progressionUtils';
import { DEFAULT_SCHEME } from '../utils/colorSchemes';
import CustomCursor from './CustomCursor';
import './CustomizeBuddyMenu.css';

interface CustomizeBuddyMenuProps {
  onClose: () => void;
  onCustomizeChange: (config: typeof bulldogConfig) => void;
  currentBulldogConfig: typeof bulldogConfig;
}

const CustomizeBuddyMenu: React.FC<CustomizeBuddyMenuProps> = ({
  onClose,
  onCustomizeChange,
  currentBulldogConfig
}) => {
  const { settings } = useAccessibility();
  const isColorBlind = settings.isColorBlind;
  const playerProgress = getPlayerProgress();
  const theme = getTheme(playerProgress.selectedTheme || 'default');

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="customize-overlay" 
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
      <div className="customize-container">
        <BulldogCustomizer 
          onConfigChange={onCustomizeChange}
          currentConfig={currentBulldogConfig}
          unlockedOptions={getUnlockedCustomizations()}
        />
      </div>
    </div>
  );
};

export default CustomizeBuddyMenu; 