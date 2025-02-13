import React from 'react';
import BulldogCustomizer from './BulldogCustomizer';
import bulldogConfig from '../config/bulldogConfig.json';
import { getUnlockedCustomizations } from '../utils/customizationUtils';
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
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="customize-overlay" onClick={handleOverlayClick}>
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