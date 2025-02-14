import React from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  musicEnabled: boolean;
  soundEnabled: boolean;
  rotationEnabled: boolean;
  onMusicToggle: (enabled: boolean) => void;
  onSoundToggle: (enabled: boolean) => void;
  onRotationToggle: (enabled: boolean) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  musicEnabled,
  soundEnabled,
  rotationEnabled,
  onMusicToggle,
  onSoundToggle,
  onRotationToggle
}) => {
  const { settings, updateSettings } = useAccessibility();

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <h2>Game Settings</h2>
        
        <div className="settings-group">
          <div>
            <h3>Audio</h3>
            <div className="settings-section">
              <div className="setting-item">
                <label>Music</label>
                <button 
                  className={`setting-button ${musicEnabled ? 'active' : ''}`}
                  onClick={() => onMusicToggle(!musicEnabled)}
                >
                  {musicEnabled ? '🎵 ON' : '🔇 OFF'}
                </button>
              </div>
              
              <div className="setting-item">
                <label>Sound FX</label>
                <button 
                  className={`setting-button ${soundEnabled ? 'active' : ''}`}
                  onClick={() => onSoundToggle(!soundEnabled)}
                >
                  {soundEnabled ? '🔊 ON' : '🔈 OFF'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3>Gameplay</h3>
            <div className="settings-section">
              <div className="setting-item">
                <label>Grid Rotation</label>
                <button 
                  className={`setting-button ${rotationEnabled ? 'active' : ''}`}
                  onClick={() => onRotationToggle(!rotationEnabled)}
                >
                  {rotationEnabled ? '🔄 ON' : '⭕ OFF'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3>Accessibility</h3>
            <div className="settings-section">
              <div className="setting-item">
                <label>Color Blind Mode</label>
                <button 
                  className={`setting-button ${settings.isColorBlind ? 'active' : ''}`}
                  onClick={() => updateSettings({ isColorBlind: !settings.isColorBlind })}
                >
                  {settings.isColorBlind ? '��️ ON' : '👁️ OFF'}
                </button>
              </div>

              <div className="setting-item">
                <label>Show Edge Numbers</label>
                <button 
                  className={`setting-button ${settings.showEdgeNumbers ? 'active' : ''}`}
                  onClick={() => updateSettings({ showEdgeNumbers: !settings.showEdgeNumbers })}
                >
                  {settings.showEdgeNumbers ? '🔢 ON' : '🔢 OFF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 