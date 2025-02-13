import React, { useState } from 'react';
import './BulldogCustomizer.css';
import bulldogConfig from '../config/bulldogConfig.json';
import { 
  CustomizationOption, 
  isPresetUnlocked, 
  isAccessoryStyleUnlocked,
  getPresetRequiredLevel,
  getAccessoryRequiredLevel,
  LEVEL_REQUIREMENTS
} from '../utils/customizationUtils';
import { getPlayerProgress } from '../utils/progressionUtils';
interface CustomizerProps {
  onConfigChange: (newConfig: typeof bulldogConfig) => void;
  currentConfig: typeof bulldogConfig;
  unlockedOptions?: CustomizationOption[];
}

type AnimationSection = 'body' | 'head';

const BulldogCustomizer: React.FC<CustomizerProps> = ({
  onConfigChange,
  currentConfig,
  unlockedOptions = []
}) => {
  const [activeTab, setActiveTab] = useState('colors');

  // Helper function to check if an option is unlocked
  const isOptionUnlocked = (optionId: string) => {
    const option = unlockedOptions.find(opt => opt.id === optionId);
    return option?.unlocked || false;
  };

  const handleAnimationChange = (section: AnimationSection, property: string, value: string) => {
    const newConfig = { ...currentConfig };
    if (section === 'body' || section === 'head') {
      (newConfig[section].animations as any)[property] = value;
    }
    onConfigChange(newConfig);
  };

  // Update color presets with more options and coordinated accessory colors
  const COLOR_PRESETS = {
    cyberpunk: {
      main: '#7c7c7c',
      chest: '#8c8c8c',
      ears: '#6a6a6a',
      glow: '#00FF9F',
      sparkle: '#00FF9F',
      collar: '#FF5F9F',
      collarTag: '#00FF9F',
    },
    neon: {
      main: '#4a4a4a',
      chest: '#5a5a5a',
      ears: '#3a3a3a',
      glow: '#FF00FF',
      sparkle: '#FF00FF',
      collar: '#00FFFF',
      collarTag: '#FF00FF',
    },
    sunset: {
      main: '#8a8a8a',
      chest: '#9a9a9a',
      ears: '#7a7a7a',
      glow: '#FF851B',
      sparkle: '#FFD700',
      collar: '#FF4136',
      collarTag: '#FFD700',
    },
    galaxy: {
      main: '#3a3a3a',
      chest: '#4a4a4a',
      ears: '#2a2a2a',
      glow: '#9400D3',
      sparkle: '#4169E1',
      collar: '#8A2BE2',
      collarTag: '#9400D3',
    },
    ocean: {
      main: '#6a6a6a',
      chest: '#7a7a7a',
      ears: '#5a5a5a',
      glow: '#00CED1',
      sparkle: '#20B2AA',
      collar: '#4682B4',
      collarTag: '#00CED1',
    },
    forest: {
      main: '#5a5a5a',
      chest: '#6a6a6a',
      ears: '#4a4a4a',
      glow: '#32CD32',
      sparkle: '#98FB98',
      collar: '#228B22',
      collarTag: '#32CD32',
    },
    candy: {
      main: '#9a9a9a',
      chest: '#aaaaaa',
      ears: '#8a8a8a',
      glow: '#FF69B4',
      sparkle: '#FFB6C1',
      collar: '#FF1493',
      collarTag: '#FF69B4',
    },
    royal: {
      main: '#4a4a4a',
      chest: '#5a5a5a',
      ears: '#3a3a3a',
      glow: '#9370DB',
      sparkle: '#DDA0DD',
      collar: '#4B0082',
      collarTag: '#9370DB',
    }
  };

  // Add accessory presets
  const ACCESSORY_PRESETS = {
    cyberpunk: {
      collar: '#FF5F9F',
      sparkles: '#00FF9F'
    },
    neon: {
      collar: '#00FFFF',
      sparkles: '#FF00FF'
    },
    rainbow: {
      collar: '#FF1493',
      sparkles: '#FFD700'
    },
    galaxy: {
      collar: '#9400D3',
      sparkles: '#4169E1'
    }
  };

  const handleColorPresetChange = (colors: typeof COLOR_PRESETS[keyof typeof COLOR_PRESETS]) => {
    const newConfig = { ...currentConfig };
    
    // Update body and head colors
    newConfig.body.colors.main = colors.main;
    newConfig.body.colors.chest = colors.chest;
    newConfig.head.colors.ears = colors.ears;
    
    // Update effects
    newConfig.effects.glow.color = `rgba(${parseInt(colors.glow.slice(1,3), 16)}, ${parseInt(colors.glow.slice(3,5), 16)}, ${parseInt(colors.glow.slice(5,7), 16)}, 0.4)`;
    newConfig.effects.sparkles.color = colors.sparkle;
    
    // Update collar colors
    newConfig.accessories.collar.colors.main = colors.collar;
    newConfig.accessories.collar.colors.tag = colors.collarTag;
    newConfig.accessories.collar.colors.glow = `rgba(${parseInt(colors.collar.slice(1,3), 16)}, ${parseInt(colors.collar.slice(3,5), 16)}, ${parseInt(colors.collar.slice(5,7), 16)}, 0.4)`;
    
    // Update accessory glow colors
    newConfig.effects.sparkles.glowColor = `rgba(${parseInt(colors.sparkle.slice(1,3), 16)}, ${parseInt(colors.sparkle.slice(3,5), 16)}, ${parseInt(colors.sparkle.slice(5,7), 16)}, 0.6)`;
    
    onConfigChange(newConfig);
  };

  const handleAccessoryStyleChange = (colors: typeof ACCESSORY_PRESETS[keyof typeof ACCESSORY_PRESETS]) => {
    const newConfig = { ...currentConfig };
    if (newConfig.accessories.collar.enabled) {
      newConfig.accessories.collar.colors.main = colors.collar;
    }
    if (newConfig.effects.sparkles.enabled) {
      newConfig.effects.sparkles.color = colors.sparkles;
    }
    onConfigChange(newConfig);
  };

  const playerLevel = getPlayerProgress().level;

  return (
    <div className="customizer-wrapper">
      <div className="bulldog-customizer">
        <h3>Customize Your Buddy</h3>
        
        <div className="customizer-tabs">
          <button 
            className={`tab ${activeTab === 'colors' ? 'active' : ''}`}
            onClick={() => setActiveTab('colors')}
          >
            <div className="tab-content">
              <span>Colors</span>
              {isOptionUnlocked('basic_colors') ? 
                <span className="unlock-status">✨</span> : 
                <span className="unlock-status">🔒 Lvl {LEVEL_REQUIREMENTS.colors.basic}</span>
              }
            </div>
          </button>
          <button 
            className={`tab ${activeTab === 'animations' ? 'active' : ''}`}
            onClick={() => isOptionUnlocked('animations') && setActiveTab('animations')}
            disabled={!isOptionUnlocked('animations')}
          >
            <div className="tab-content">
              <span>Animations</span>
              {isOptionUnlocked('animations') ? 
                <span className="unlock-status">✨</span> : 
                <span className="unlock-status">🔒 Lvl {LEVEL_REQUIREMENTS.animations}</span>
              }
            </div>
          </button>
          <button 
            className={`tab ${activeTab === 'accessories' ? 'active' : ''}`}
            onClick={() => isOptionUnlocked('basic_accessories') && setActiveTab('accessories')}
            disabled={!isOptionUnlocked('basic_accessories')}
          >
            <div className="tab-content">
              <span>Accessories</span>
              {isOptionUnlocked('basic_accessories') ? 
                <span className="unlock-status">✨</span> : 
                <span className="unlock-status">🔒 Lvl {LEVEL_REQUIREMENTS.accessories.basic}</span>
              }
            </div>
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'colors' && (
            <section className="color-section">
              {isOptionUnlocked('basic_colors') ? (
                <div className="color-presets">
                  <h4>Color Themes</h4>
                  <div className="preset-buttons">
                    {Object.entries(COLOR_PRESETS).map(([name, colors]) => {
                      const isLocked = !isPresetUnlocked(name, playerLevel);
                      const requiredLevel = getPresetRequiredLevel(name);

                      return (
                        <div key={name} className="preset-button-wrapper">
                          <button
                            className={`preset-button ${isLocked ? 'locked' : ''}`}
                            onClick={() => !isLocked && handleColorPresetChange(colors)}
                            disabled={isLocked}
                          >
                            <div className="preset-preview">
                              <div className="preview-main" style={{ background: colors.main }}></div>
                              <div className="preview-accent" style={{ background: colors.collar }}></div>
                              <div className="preview-glow" style={{ background: colors.sparkle }}></div>
                            </div>
                            {name.charAt(0).toUpperCase() + name.slice(1)}
                          </button>
                          {isLocked && (
                            <div className="lock-overlay">
                              <span className="lock-icon">🔒</span>
                              <span className="unlock-text">Unlocks at Level {requiredLevel}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="locked-content">
                </div>
              )}
            </section>
          )}

          {activeTab === 'animations' && (
            <section className="animation-section">
              {isOptionUnlocked('animations') ? (
                <div className="animation-options">
                  <div className="animation-option">
                    <label>Breathe Duration</label>
                    <input 
                      type="range"
                      min="2"
                      max="8"
                      step="0.5"
                      value={parseFloat(currentConfig.body.animations.breatheDuration)}
                      onChange={(e) => handleAnimationChange('body', 'breatheDuration', `${e.target.value}s`)}
                    />
                    <span>{currentConfig.body.animations.breatheDuration}</span>
                  </div>
                  <div className="animation-option">
                    <label>Ear Twitch Duration</label>
                    <input 
                      type="range"
                      min="3"
                      max="10"
                      step="0.5"
                      value={parseFloat(currentConfig.head.animations.earTwitchDuration)}
                      onChange={(e) => handleAnimationChange('head', 'earTwitchDuration', `${e.target.value}s`)}
                    />
                    <span>{currentConfig.head.animations.earTwitchDuration}</span>
                  </div>
                </div>
              ) : (
                <div className="locked-content">
                </div>
              )}
            </section>
          )}

          {activeTab === 'accessories' && (
            <section className="accessories-section">
              {isOptionUnlocked('basic_accessories') ? (
                <>
                  <div className="accessory-toggles">
                    <div className="accessory-toggle">
                      <label>
                        <input 
                          type="checkbox"
                          checked={currentConfig.accessories.collar.enabled}
                          onChange={() => {
                            const newConfig = { ...currentConfig };
                            newConfig.accessories.collar.enabled = !newConfig.accessories.collar.enabled;
                            onConfigChange(newConfig);
                          }}
                        />
                        Collar
                      </label>
                    </div>
                    <div className="accessory-toggle">
                      <label>
                        <input 
                          type="checkbox"
                          checked={currentConfig.effects.sparkles.enabled}
                          onChange={() => {
                            const newConfig = { ...currentConfig };
                            newConfig.effects.sparkles.enabled = !newConfig.effects.sparkles.enabled;
                            onConfigChange(newConfig);
                          }}
                        />
                        Sparkles
                      </label>
                    </div>
                  </div>

                  <div className="accessory-styles">
                    <h4>Accessory Styles</h4>
                    <div className="style-buttons">
                      {Object.entries(ACCESSORY_PRESETS).map(([name, colors]) => {
                        const isLocked = !isAccessoryStyleUnlocked(name, playerLevel);
                        const requiredLevel = getAccessoryRequiredLevel(name);

                        return (
                          <button
                            key={name}
                            className={`style-button ${isLocked ? 'locked' : ''}`}
                            onClick={() => {
                              if (!isLocked) {
                                handleAccessoryStyleChange(colors);
                              }
                            }}
                            disabled={isLocked}
                          >
                            <div className="style-preview">
                              <div
                                className="preview-color preview-collar"
                                style={{ 
                                  '--color': colors.collar,
                                  '--color-light': `${colors.collar}99`
                                } as React.CSSProperties}
                              />
                              <div 
                                className="preview-color preview-sparkles"
                                style={{ 
                                  '--color': colors.sparkles,
                                  '--color-light': `${colors.sparkles}99`
                                } as React.CSSProperties}
                              />
                            </div>
                            <span>{name.charAt(0).toUpperCase() + name.slice(1)}</span>
                            {isLocked && (
                              <div className="lock-overlay">
                                <span className="lock-icon">🔒</span>
                                <span className="unlock-text">Unlocks at Level {requiredLevel}</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="locked-content">
                </div>
              )}
            </section>
          )}

          {(activeTab === 'animations' && !isOptionUnlocked('animations')) ||
           (activeTab === 'accessories' && !isOptionUnlocked('accessories')) && (
            <div className="locked-content">
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulldogCustomizer; 