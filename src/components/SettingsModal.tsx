import React from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import './SettingsModal.css';
import { KeyBindings } from '../types/index';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  musicEnabled: boolean;
  soundEnabled: boolean;
  rotationEnabled: boolean;
  onMusicToggle: (enabled: boolean) => void;
  onSoundToggle: (enabled: boolean) => void;
  onRotationToggle: (enabled: boolean) => void;
  keyBindings: KeyBindings;
  onKeyBindingChange: (binding: Partial<KeyBindings>) => void;
}

const DEFAULT_KEY_BINDINGS: KeyBindings = {
  rotateClockwise: 'e',
  rotateCounterClockwise: 'q',
  selectTile1: '1',
  selectTile2: '2',
  selectTile3: '3',
  placeTile: ' ',
  moveUp: 'arrowup',
  moveDown: 'arrowdown',
  moveLeft: 'arrowleft',
  moveRight: 'arrowright'
};

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  musicEnabled,
  soundEnabled,
  rotationEnabled,
  onMusicToggle,
  onSoundToggle,
  onRotationToggle,
  keyBindings: providedBindings,
  onKeyBindingChange
}) => {
  const { settings, updateSettings } = useAccessibility();

  if (!isOpen) return null;

  // Merge provided bindings with defaults
  const keyBindings = { ...DEFAULT_KEY_BINDINGS, ...providedBindings };

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
                  {settings.isColorBlind ? '👁️ ON' : '👁️ OFF'}
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

          <div>
            <h3>Key Bindings</h3>
            <div className="settings-section">
              <div className="setting-item">
                <label>Move Up</label>
                <button 
                  className="setting-button key-binding"
                  onClick={() => {
                    const handler = (e: KeyboardEvent) => {
                      e.preventDefault();
                      onKeyBindingChange({ moveUp: e.key.toLowerCase() });
                      window.removeEventListener('keydown', handler);
                    };
                    window.addEventListener('keydown', handler);
                  }}
                >
                  {keyBindings.moveUp === 'arrowup' ? '↑' : keyBindings.moveUp.toUpperCase()}
                </button>
              </div>
              
              <div className="setting-item">
                <label>Move Down</label>
                <button 
                  className="setting-button key-binding"
                  onClick={() => {
                    const handler = (e: KeyboardEvent) => {
                      e.preventDefault();
                      onKeyBindingChange({ moveDown: e.key.toLowerCase() });
                      window.removeEventListener('keydown', handler);
                    };
                    window.addEventListener('keydown', handler);
                  }}
                >
                  {keyBindings.moveDown === 'arrowdown' ? '↓' : keyBindings.moveDown.toUpperCase()}
                </button>
              </div>
              
              <div className="setting-item">
                <label>Move Left</label>
                <button 
                  className="setting-button key-binding"
                  onClick={() => {
                    const handler = (e: KeyboardEvent) => {
                      e.preventDefault();
                      onKeyBindingChange({ moveLeft: e.key.toLowerCase() });
                      window.removeEventListener('keydown', handler);
                    };
                    window.addEventListener('keydown', handler);
                  }}
                >
                  {keyBindings.moveLeft === 'arrowleft' ? '←' : keyBindings.moveLeft.toUpperCase()}
                </button>
              </div>
              
              <div className="setting-item">
                <label>Move Right</label>
                <button 
                  className="setting-button key-binding"
                  onClick={() => {
                    const handler = (e: KeyboardEvent) => {
                      e.preventDefault();
                      onKeyBindingChange({ moveRight: e.key.toLowerCase() });
                      window.removeEventListener('keydown', handler);
                    };
                    window.addEventListener('keydown', handler);
                  }}
                >
                  {keyBindings.moveRight === 'arrowright' ? '→' : keyBindings.moveRight.toUpperCase()}
                </button>
              </div>

              <div className="setting-item">
                <label>Rotate Clockwise</label>
                <button 
                  className="setting-button key-binding"
                  onClick={() => {
                    const handler = (e: KeyboardEvent) => {
                      e.preventDefault();
                      onKeyBindingChange({ rotateClockwise: e.key.toLowerCase() });
                      window.removeEventListener('keydown', handler);
                    };
                    window.addEventListener('keydown', handler);
                  }}
                >
                  {keyBindings.rotateClockwise.toUpperCase()}
                </button>
              </div>
              <div className="setting-item">
                <label>Rotate Counter-Clockwise</label>
                <button 
                  className="setting-button key-binding"
                  onClick={() => {
                    const handler = (e: KeyboardEvent) => {
                      e.preventDefault();
                      onKeyBindingChange({ rotateCounterClockwise: e.key.toLowerCase() });
                      window.removeEventListener('keydown', handler);
                    };
                    window.addEventListener('keydown', handler);
                  }}
                >
                  {keyBindings.rotateCounterClockwise.toUpperCase()}
                </button>
              </div>
              {[1, 2, 3].map(num => (
                <div key={num} className="setting-item">
                  <label>Select Next Tile {num}</label>
                  <button 
                    className="setting-button key-binding"
                    onClick={() => {
                      const handler = (e: KeyboardEvent) => {
                        e.preventDefault();
                        onKeyBindingChange({ [`selectTile${num}`]: e.key.toLowerCase() } as Partial<KeyBindings>);
                        window.removeEventListener('keydown', handler);
                      };
                      window.addEventListener('keydown', handler);
                    }}
                  >
                    {keyBindings[`selectTile${num}` as keyof KeyBindings].toUpperCase()}
                  </button>
                </div>
              ))}
              <div className="setting-item">
                <label>Place Tile</label>
                <button 
                  className="setting-button key-binding"
                  onClick={() => {
                    const handler = (e: KeyboardEvent) => {
                      e.preventDefault();
                      onKeyBindingChange({ placeTile: e.key.toLowerCase() });
                      window.removeEventListener('keydown', handler);
                    };
                    window.addEventListener('keydown', handler);
                  }}
                >
                  {(keyBindings?.placeTile || ' ') === ' ' ? 'SPACE' : (keyBindings?.placeTile || ' ').toUpperCase()}
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