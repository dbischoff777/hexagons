import React, { useEffect, useState } from 'react';
import './FrenchBulldog.css';
import bulldogConfig from '../config/bulldogConfig.json';
import { playBarkSound } from '../utils/soundManager';
import { CompanionAbility } from '../types/companion';
interface BulldogProps {
  onClick: () => void;
  phrase: string;
  isClicked?: boolean;
  customConfig?: typeof bulldogConfig;
  onConfigChange: (config: typeof bulldogConfig) => void;
  position?: { y: number };  // Only track y position
  alwaysShowSpeech?: boolean;  // Add this prop
  abilities?: CompanionAbility[];
  hideSpeech?: boolean;
}

const FrenchBulldog: React.FC<BulldogProps> = ({ 
  onClick, 
  phrase, 
  isClicked,
  customConfig,
  onConfigChange,
  position,
  alwaysShowSpeech = false,  // Default to false
  abilities = [],
  hideSpeech = false
}) => {
  const config = customConfig ? { ...bulldogConfig, ...customConfig } : bulldogConfig;

  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number}>>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const addParticle = (x: number, y: number) => {
    const id = Date.now();
    setParticles(prev => [...prev, {id, x, y}]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id));
    }, 1000);
  };

  const handlePawHover = (paw: 'left' | 'right') => {
    const newConfig = { ...config };
    if (paw === 'left') {
      newConfig.legs.animations.leftPawRaised = true;
    } else {
      newConfig.legs.animations.rightPawRaised = true;
    }
    onConfigChange(newConfig);
    addParticle(paw === 'left' ? 30 : 90, 120);
  };

  useEffect(() => {
    const root = document.documentElement;
    
    // Set body variables
    root.style.setProperty('--bulldog-body-width', `${config.body.dimensions.width}px`);
    root.style.setProperty('--bulldog-body-height', `${config.body.dimensions.height}px`);
    root.style.setProperty('--bulldog-body-main-color', config.body.colors.main);
    root.style.setProperty('--bulldog-body-chest-color', config.body.colors.chest);
    
    // Set head variables
    root.style.setProperty('--bulldog-head-width', `${config.head.dimensions.width}px`);
    root.style.setProperty('--bulldog-head-height', `${config.head.dimensions.height}px`);
    root.style.setProperty('--bulldog-head-main-color', config.head.colors.main);
    
    // Set animation variables
    root.style.setProperty('--bulldog-breathe-duration', config.body.animations.breatheDuration);
    root.style.setProperty('--bulldog-ear-twitch-duration', config.head.animations.earTwitchDuration);
    
    // Set effect variables
    root.style.setProperty('--bulldog-glow-color', config.effects.glow.color);
    root.style.setProperty('--bulldog-glow-intensity', `${config.effects.glow.intensity}px`);
  }, [config]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const bulldogElement = document.querySelector('.french-bulldog');
      if (bulldogElement) {
        const rect = bulldogElement.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        setMousePos({ x, y });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Function to format the phrase with behavior text
  const formatPhrase = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        // This is a behavior text
        return <span key={index} className="behavior">
          {part.slice(1, -1)}
        </span>;
      }
      // This is regular speech
      return <span key={index} className="speech">{part}</span>;
    });
  };

  const handleClick = () => {
    try {
      playBarkSound();
    } catch (error) {
      console.log('Error playing sound:', error);
    }
    onClick();
  };

  // Update position styling
  const bulldogStyle = position ? {
    position: 'absolute' as const,
    left: 'calc(100% + 20px)',
    top: `${position.y}px`,
    transition: 'top 0.1s ease-out',
    zIndex: 1000
  } : {};

  return (
    <div 
      className={`french-bulldog ${isClicked ? 'clicked' : ''} ${alwaysShowSpeech ? 'always-show-speech' : ''}`} 
      onClick={handleClick}
      style={bulldogStyle}
    >
      <div className="bulldog-container">
        <div className="bulldog-body">
          <div className="body-main"></div>
          <div className="body-chest"></div>
          
          {/* Conditional rendering of accessories */}
          <div className="collar" style={{
            display: config.accessories.collar.enabled ? 'block' : 'none'
          }}>
            <div className="collar-band" style={{
              background: config.accessories.collar.colors.main,
              boxShadow: `
                inset 0 -2px 4px rgba(0, 0, 0, 0.2),
                0 0 10px ${config.accessories.collar.colors.glow}
              `
            }}></div>
            <div className="collar-tag" style={{
              background: config.accessories.collar.colors.tag,
              boxShadow: `0 0 10px ${config.accessories.collar.colors.glow}`
            }}></div>
          </div>
          
          <div className="front-legs">
            <div 
              className={`leg left ${config.legs.animations.leftPawRaised ? 'raised' : ''}`}
              onMouseEnter={() => handlePawHover('left')}
              onMouseLeave={() => {
                const newConfig = { ...config };
                newConfig.legs.animations.leftPawRaised = false;
                onConfigChange(newConfig);
              }}
            ></div>
            <div 
              className={`leg right ${config.legs.animations.rightPawRaised ? 'raised' : ''}`}
              onMouseEnter={() => handlePawHover('right')}
              onMouseLeave={() => {
                const newConfig = { ...config };
                newConfig.legs.animations.rightPawRaised = false;
                onConfigChange(newConfig);
              }}
            ></div>
          </div>
          <div className="back-legs">
            <div className="leg left"></div>
            <div className="leg right"></div>
          </div>
          
          {config.accessories.foodBowl.enabled && (
            <div className="food-bowl">
              <div className="bowl-rim"></div>
              <div className="bowl-base"></div>
              <div className="bowl-kibble">
                <div className="kibble"></div>
                <div className="kibble"></div>
                <div className="kibble"></div>
              </div>
            </div>
          )}
          
          <div className="tail"></div>
        </div>

        {/* Head section */}
        <div className="bulldog-head">
          <div className="bulldog-ears">
            <div className="ear left"></div>
            <div className="ear right"></div>
          </div>
          <div className="bulldog-face">
            <div className="bulldog-eyes">
              <div 
                className="eye left"
                style={{
                  transform: `translate(
                    ${Math.min(Math.max(mousePos.x * 0.1, -2), 2)}px,
                    ${Math.min(Math.max(mousePos.y * 0.1, -2), 2)}px
                  )`
                }}
              ></div>
              <div 
                className="eye right"
                style={{
                  transform: `translate(
                    ${Math.min(Math.max(mousePos.x * 0.1, -2), 2)}px,
                    ${Math.min(Math.max(mousePos.y * 0.1, -2), 2)}px
                  )`
                }}
              ></div>
            </div>
            <div className="bulldog-nose"></div>
            <div className="bulldog-mouth">
              <div className="mouth-line"></div>
            </div>
            <div className="bulldog-cheeks">
              <div className="cheek left"></div>
              <div className="cheek right"></div>
            </div>
          </div>
        </div>
        
        {/* Conditional rendering of effects */}
        {config.effects.sparkles.enabled && (
          <div className="sparkles">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className="sparkle"
                style={{
                  background: config.effects.sparkles.color,
                  boxShadow: `0 0 10px ${config.effects.sparkles.glowColor}`
                }}
              ></div>
            ))}
          </div>
        )}

        {/* Only show speech bubble if not hidden */}
        {!hideSpeech && (
          <div className="bulldog-speech-bubble">
            <div className="bulldog-speech-text">
              {formatPhrase(phrase)}
            </div>
            <div className="bulldog-speech-arrow"></div>
          </div>
        )}

        {/* Add abilities below the dog */}
        {abilities.length > 0 && (
          <div className="bulldog-abilities">
            {abilities.map(ability => (
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
        )}

        <div className="particle-container">
          {particles.map(particle => (
            <div
              key={particle.id}
              className="particle"
              style={{
                left: particle.x + 'px',
                top: particle.y + 'px',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FrenchBulldog; 