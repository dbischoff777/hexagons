import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SimonGameState, SimonTheme, SimonDifficulty } from '../types/simon';
import { generateSimonSequence, checkSequenceMatch } from '../utils/simonUtils';
import { drawHexagonWithColoredEdges } from '../utils/hexagonRenderer';
import { hexToPixel } from '../utils/hexUtils';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { SoundManager } from '../utils/soundManager';
import { useAnnouncer } from '../hooks/useAnnouncer';
import CustomCursor from '../components/CustomCursor';
import SpringModal from '../components/SpringModal';
import { DEFAULT_SCHEME } from '../utils/colorSchemes';
import { getPlayerProgress, getTheme } from '../utils/progressionUtils';
import '../styles/simonMode.css';

interface SimonModeProps {
  onGameOver: () => void;
  onExit: () => void;
  difficulty?: SimonDifficulty;
  soundEnabled: boolean;
  onDifficultyChange?: (difficulty: SimonDifficulty) => void;
}

const DIFFICULTY_CONFIG = {
  easy: { initialLength: 2, maxLength: 8, playbackSpeed: 1000 },
  medium: { initialLength: 3, maxLength: 12, playbackSpeed: 800 },
  hard: { initialLength: 4, maxLength: 16, playbackSpeed: 600 }
};

const POSITIONS = [
  { q: 0, r: 0, label: 'Center' }, // Center
  { q: 1, r: 0, label: 'Bottom Right' }, // Bottom Right
  { q: 0, r: 1, label: 'Bottom Center' }, // Bottom Center
  { q: -1, r: 1, label: 'Bottom Left' }, // Bottom Left
  { q: -1, r: 0, label: 'Top Left' }, // Top Left
  { q: 0, r: -1, label: 'Top Center' }, // Top Center
  { q: 1, r: -1, label: 'Top Right' } // Top Right
];

const DEFAULT_THEME: SimonTheme = {
  colors: {
    primary: '#FFFFFF',
    secondary: '#666666',
    accent: '#00FF00',
    background: '#000000',
    text: '#FFFFFF'
  }
};

const SimonMode: React.FC<SimonModeProps> = ({
  onGameOver,
  onExit,
  difficulty = 'easy',
  soundEnabled,
  onDifficultyChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef<number>(0);
  const [gameState, setGameState] = useState<SimonGameState>({
    sequence: [],
    playerSequence: [],
    score: 0,
    isPlaying: false,
    isShowingSequence: false,
    currentStep: 0,
    highScore: 0
  });
  
  const { settings } = useAccessibility();
  const soundManager = SoundManager.getInstance();
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null);
  const lastInteractionTime = useRef(Date.now());
  const announce = useAnnouncer();
  const isColorBlind = settings.isColorBlind;
  const playerProgress = getPlayerProgress();
  const theme = getTheme(playerProgress.selectedTheme || 'default');
  const currentTileSizeRef = useRef(60);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const drawBoard = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!ctx.canvas) return;
    
    if (gameLoopRef.current !== null) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const tileSize = Math.min(ctx.canvas.width, ctx.canvas.height) * 0.17;
    currentTileSizeRef.current = tileSize;

    // Helper function to convert hex to rgb
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    // Draw background with subtle pulse during sequence
    const bgPulse = gameState.isShowingSequence ? 
      Math.sin(Date.now() / 500) * 0.1 + 0.9 : 
      1;
    const bgRgb = hexToRgb(theme.colors.background);
    ctx.fillStyle = `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, ${bgPulse})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw each tile
    POSITIONS.forEach((pos, index) => {
      const { x, y } = hexToPixel(pos.q, pos.r, centerX, centerY, tileSize);
      const isActive = activeTile === index;
      const isCurrentInSequence = gameState.isShowingSequence && gameState.currentStep === index;
      const isInSequence = gameState.sequence.includes(index);
      const isClicked = !gameState.isShowingSequence && gameState.currentStep === index;
      
      drawHexagonWithColoredEdges({
        ctx,
        x,
        y,
        size: tileSize,
        settings,
        theme,
        selectedTileIndex: null,
        animatingTiles: [],
        isSimonMode: true,
        simonTileIndex: index,
        isSimonActive: isActive || isCurrentInSequence || isClicked,
        isSimonSequence: isInSequence,
        showInfoBox: false,
        isCursorTile: false
      });

      // Add extra glow for active tiles and clicked tiles
      if (isActive || isCurrentInSequence || isClicked) {
        ctx.save();
        const glowIntensity = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        const glowRgb = hexToRgb(theme.colors.accent);
        
        // Outer glow
        const gradient = ctx.createRadialGradient(
          x, y, 0,
          x, y, tileSize * 1.8
        );
        gradient.addColorStop(0, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, ${glowIntensity * 0.6})`);
        gradient.addColorStop(0.5, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, ${glowIntensity * 0.3})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = 'screen';
        ctx.beginPath();
        ctx.arc(x, y, tileSize * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Inner glow
        const innerGradient = ctx.createRadialGradient(
          x, y, 0,
          x, y, tileSize * 0.8
        );
        innerGradient.addColorStop(0, `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, ${glowIntensity * 0.8})`);
        innerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(x, y, tileSize * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Add accessibility label if needed
      if (settings.usePatterns) {
        ctx.save();
        ctx.fillStyle = theme.colors.text;
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pos.label, x, y);
        ctx.restore();
      }
    });

    // Draw game over overlay
    if (isGameOver) {
      ctx.save();
      
      // Add dark overlay with cyberpunk gradient using theme colors
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, ctx.canvas.width
      );
      const overlayRgb = hexToRgb(theme.colors.background);
      gradient.addColorStop(0, `rgba(${overlayRgb.r}, ${overlayRgb.g}, ${overlayRgb.b}, 0.85)`);
      gradient.addColorStop(0.5, `rgba(${overlayRgb.r}, ${overlayRgb.g}, ${overlayRgb.b}, 0.92)`);
      gradient.addColorStop(1, `rgba(${overlayRgb.r}, ${overlayRgb.g}, ${overlayRgb.b}, 0.97)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      // Add glitch effect
      const time = Date.now();
      const glitchOffset = Math.sin(time / 200) * 5;
      
      // Draw "Game Over" text with glitch effect using theme colors
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Shadow/glow layers using theme accent color
      const accentRgb = hexToRgb(theme.colors.accent);
      ctx.shadowColor = `rgb(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b})`;
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = glitchOffset;
      ctx.fillStyle = `rgb(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b})`;
      ctx.fillText('GAME OVER', centerX + glitchOffset, centerY - 40);
      
      // Complementary color for second layer
      ctx.shadowColor = theme.colors.secondary;
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = -glitchOffset;
      ctx.fillStyle = theme.colors.secondary;
      ctx.fillText('GAME OVER', centerX - glitchOffset, centerY - 40);
      
      // Main text
      ctx.shadowColor = theme.colors.primary;
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.fillStyle = theme.colors.primary;
      ctx.fillText('GAME OVER', centerX, centerY - 40);

      // Draw score
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = theme.colors.accent;
      ctx.shadowColor = theme.colors.accent;
      ctx.shadowBlur = 10;
      ctx.fillText(`Score: ${gameState.score}`, centerX, centerY + 20);
      
      // Draw high score
      ctx.fillStyle = theme.colors.secondary;
      ctx.shadowColor = theme.colors.secondary;
      ctx.fillText(`High Score: ${gameState.highScore}`, centerX, centerY + 60);
      
      ctx.restore();
    }

    gameLoopRef.current = requestAnimationFrame(() => drawBoard(ctx));
  }, [activeTile, gameState.currentStep, gameState.isShowingSequence, gameState.sequence, settings, theme, isGameOver, gameState.score, gameState.highScore]);

  const cleanup = useCallback(() => {
    if (gameLoopRef.current !== null) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    if (sequenceTimeoutRef.current !== null) {
      clearTimeout(sequenceTimeoutRef.current);
      sequenceTimeoutRef.current = null;
    }
    currentIndexRef.current = 0;
    setActiveTile(null);
    setShowFeedback(false);
    setFeedbackType(null);
  }, []);

  // Canvas size management
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const size = Math.min(containerWidth * 0.9, containerHeight * 0.7);

      canvas.width = size;
      canvas.height = size;

      // Start game loop
      if (gameLoopRef.current === null) {
        drawBoard(ctx);
      }
    };

    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      cleanup();
    };
  }, [drawBoard, cleanup]);

  // Update game loop when game state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawBoard(ctx);
  }, [drawBoard, gameState.currentStep, gameState.isShowingSequence, activeTile]);

  const handleGameOver = useCallback(() => {
    cleanup();
    if (soundEnabled) {
      soundManager.playSound('gameOver');
    }
    announce('Game Over! Your score was ' + gameState.score);
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      highScore: Math.max(prev.highScore, prev.score)
    }));
    setIsGameOver(true);
  }, [cleanup, soundEnabled, announce, gameState.score]);

  const showActionFeedback = useCallback((success: boolean) => {
    setFeedbackType(success ? 'success' : 'error');
    setShowFeedback(true);
    setTimeout(() => {
      setShowFeedback(false);
      setFeedbackType(null);
    }, 300);
  }, []);

  const handleTileClick = useCallback((tileIndex: number) => {

    const now = Date.now();
    lastInteractionTime.current = now;


    const newPlayerSequence = [...gameState.playerSequence, tileIndex];
    
    if (soundEnabled) {
      soundManager.playTileSound(tileIndex);
    }

    announce(POSITIONS[tileIndex].label);
    
    // Enhanced visual feedback for clicks
    setActiveTile(tileIndex);
    setGameState(prev => ({
      ...prev,
      currentStep: tileIndex
    }));

    // Longer activation time for better visibility
    setTimeout(() => {
      setActiveTile(null);
      setGameState(prev => ({
        ...prev,
        currentStep: -1
      }));
      // Add a brief delay before allowing next click
      setTimeout(() => {
        lastInteractionTime.current = Date.now();
      }, 50);
    }, 600); // Increased from 400ms to 600ms for better visibility

    const isMatch = checkSequenceMatch(newPlayerSequence, gameState.sequence);

    showActionFeedback(isMatch);

    if (!isMatch) {
      console.log('Game over - sequence mismatch');
      // Add visual feedback before game over
      setTimeout(() => {
        handleGameOver();
      }, 500);
      return;
    }

    setGameState(prev => ({
      ...prev,
      playerSequence: newPlayerSequence
    }));

    if (newPlayerSequence.length === gameState.sequence.length) {
      const config = DIFFICULTY_CONFIG[difficulty];
      
      if (gameState.sequence.length >= config.maxLength) {
        announce('Congratulations! You completed all levels!');
        setGameState(prev => ({
          ...prev,
          isPlaying: false,
          highScore: Math.max(prev.highScore, prev.score + 1)
        }));
        onGameOver();
        return;
      }

      setTimeout(() => {
        const newSequence = generateSimonSequence(gameState.sequence.length + 1);
        console.log('Starting next sequence:', newSequence);
        if (soundEnabled) {
          soundManager.playSound('success');
        }
        announce('Correct! Watch the next sequence.');
        setGameState(prev => ({
          ...prev,
          sequence: newSequence,
          playerSequence: [],
          score: prev.score + 1,
          isShowingSequence: true,
          currentStep: -1
        }));
      }, 500);
    }
  }, [gameState, difficulty, soundEnabled, handleGameOver, announce, showActionFeedback]);

  const startNewGame = useCallback(() => {
    console.log('Starting new game');
    cleanup();
    const config = DIFFICULTY_CONFIG[difficulty];
    const newSequence = generateSimonSequence(config.initialLength);
    console.log('Initial sequence:', newSequence);
    
    setIsGameOver(false);
    // Set initial state before showing sequence
    setGameState(prev => ({
      sequence: newSequence,
      playerSequence: [],
      score: 0,
      isPlaying: true,
      isShowingSequence: false,  // Start false, will be set to true after a small delay
      currentStep: -1,
      highScore: prev.highScore
    }));

    // Small delay before starting sequence to ensure state is properly initialized
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        isShowingSequence: true
      }));
    }, 100);
  }, [difficulty, cleanup]);

  const playSequence = useCallback(() => {
    cleanup();
    console.log('Starting sequence playback:', gameState.sequence);
    announce('Watch the sequence');
    
    const config = DIFFICULTY_CONFIG[difficulty];
    const sequence = gameState.sequence;
    let timeoutIds: NodeJS.Timeout[] = [];
    
    // Initial delay before starting sequence
    const initialDelay = 500;
    
    // Set initial state
    timeoutIds.push(setTimeout(() => {
        setGameState(prev => ({
            ...prev,
            isShowingSequence: true,
            currentStep: -1
        }));
    }, initialDelay));
    
    // Play each tile in sequence
    sequence.forEach((tileIndex, index) => {
        // Turn tile on
        const onDelay = initialDelay + (index * config.playbackSpeed);
        timeoutIds.push(setTimeout(() => {
            console.log(`Playing step ${index + 1} of ${sequence.length} - Tile: ${tileIndex}`);
            setActiveTile(tileIndex);
            setGameState(prev => ({
                ...prev,
                isShowingSequence: true,
                currentStep: tileIndex
            }));
            if (soundEnabled) {
                soundManager.playTileSound(tileIndex);
            }
            announce(POSITIONS[tileIndex].label);
        }, onDelay));

        // Turn tile off
        const offDelay = onDelay + (config.playbackSpeed * 0.6);
        timeoutIds.push(setTimeout(() => {
            setActiveTile(null);
            setGameState(prev => ({
                ...prev,
                isShowingSequence: true,
                currentStep: -1
            }));
        }, offDelay));
    });

    // End sequence and enable player input
    const endDelay = initialDelay + (sequence.length * config.playbackSpeed) + 500;
    const endSequenceTimeout = setTimeout(() => {
        console.log('Sequence complete, enabling player input');
        setGameState(prev => ({
            ...prev,
            isShowingSequence: false,
            currentStep: -1
        }));
        setActiveTile(null);
        announce('Your turn! Repeat the sequence.');
    }, endDelay);
    timeoutIds.push(endSequenceTimeout);

    // Store first timeout ID for cleanup reference
    sequenceTimeoutRef.current = timeoutIds[0];

    // Return cleanup function
    return () => {
        console.log('Cleaning up sequence timeouts');
        timeoutIds.forEach(clearTimeout);
    };
}, [gameState.sequence, difficulty, soundEnabled, announce, cleanup]);

  // Add debug logging to sequence state changes
  useEffect(() => {
    console.log('Sequence state changed:', {
      isShowingSequence: gameState.isShowingSequence,
      sequenceLength: gameState.sequence.length,
      currentStep: gameState.currentStep
    });
  }, [gameState.isShowingSequence, gameState.sequence, gameState.currentStep]);

  useEffect(() => {
    if (gameState.isShowingSequence && gameState.sequence.length > 0) {
      playSequence();
      return () => {
        if (sequenceTimeoutRef.current) {
          clearTimeout(sequenceTimeoutRef.current);
        }
      };
    }
  }, [gameState.isShowingSequence, gameState.sequence, playSequence]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('Canvas clicked', {
      isPlaying: gameState.isPlaying,
      isShowingSequence: gameState.isShowingSequence
    });

    if (!gameState.isPlaying || gameState.isShowingSequence) {
      console.log('Click ignored - game not playing or showing sequence');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('No canvas reference');
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const tileSize = currentTileSizeRef.current;

    console.log('Click coordinates', {
      raw: { x: event.clientX, y: event.clientY },
      scaled: { x, y },
      center: { x: centerX, y: centerY },
      tileSize,
      canvasSize: { width: canvas.width, height: canvas.height }
    });

    // Simple distance-based detection
    let clickedTileIndex = -1;
    let minDistance = Infinity;
    let debugDistances: { index: number, distance: number, position: { x: number, y: number } }[] = [];

    POSITIONS.forEach((pos, index) => {
      const tilePos = hexToPixel(pos.q, pos.r, centerX, centerY, tileSize);
      const distance = Math.sqrt(
        Math.pow(x - tilePos.x, 2) + 
        Math.pow(y - tilePos.y, 2)
      );
      
      debugDistances.push({
        index,
        distance,
        position: tilePos
      });

      if (distance <= tileSize * 0.8 && distance < minDistance) {
        minDistance = distance;
        clickedTileIndex = index;
      }
    });

    console.log('Tile distances:', debugDistances);
    console.log('Clicked tile:', clickedTileIndex, clickedTileIndex !== -1 ? POSITIONS[clickedTileIndex] : 'none');

    if (clickedTileIndex !== -1) {
      handleTileClick(clickedTileIndex);
    }
  }, [gameState.isPlaying, gameState.isShowingSequence, handleTileClick]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!gameState.isPlaying || gameState.isShowingSequence) return;

      const keyNumber = parseInt(event.key);
      if (keyNumber >= 1 && keyNumber <= 7) {
        handleTileClick(keyNumber - 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.isPlaying, gameState.isShowingSequence, handleTileClick]);

  const handleExitClick = useCallback(() => {
    setShowExitModal(true);
  }, []);

  const handleConfirmExit = useCallback(() => {
    setShowExitModal(false);
    onExit();
  }, [onExit]);

  // Add combo multipliers and time-based bonuses
  const calculateScore = (sequenceLength: number, timeTaken: number, difficulty: SimonDifficulty) => {
    const basePoints = 100;
    const difficultyMultiplier = { easy: 1, medium: 2, hard: 3 };
    const timeBonus = Math.max(0, 1 - (timeTaken / 1000)); // Bonus for quick responses
    return Math.floor(basePoints * sequenceLength * difficultyMultiplier[difficulty] * (1 + timeBonus));
  };

  return (
    <div 
      className={`simon-mode ${showFeedback ? `feedback-${feedbackType}` : ''} ${
        gameState.isShowingSequence ? 'showing-sequence' : ''
      } ${isGameOver ? 'game-over' : ''}`}
      role="application"
      aria-label="Simon Says Game"
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
      
      <SpringModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Exit Game"
        message="Are you sure you want to exit? Your progress will be lost."
        variant="danger"
      >
        <button 
          className="modal-button confirm danger"
          onClick={() => setShowExitModal(false)}
        >
          Cancel
        </button>
        <button 
          className="modal-button cancel"
          onClick={handleConfirmExit}
        >
          Exit
        </button>
      </SpringModal>

      <div className="simon-header">
        <div className="simon-stats">
          <div className="simon-score" role="status">
            Score: {gameState.score}
          </div>
          <div className="simon-high-score" role="status">
            High Score: {gameState.highScore}
          </div>
        </div>
        <div className="simon-difficulty">
          <label htmlFor="difficulty">Difficulty:</label>
          <select 
            id="difficulty"
            value={difficulty}
            onChange={(e) => onDifficultyChange?.(e.target.value as SimonDifficulty)}
            disabled={gameState.isPlaying}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        className="simon-canvas"
        onClick={handleCanvasClick}
        role="grid"
        aria-label="Simon game board"
        tabIndex={0}
      />

      <div className="simon-controls">
        <button 
          className="simon-exit-button"
          onClick={handleExitClick}
          aria-label="Exit game"
          disabled={gameState.isShowingSequence}
        >
          Exit
        </button>
        
        {isGameOver ? (
          <div className="simon-game-over-controls">
            <button 
              className="simon-start-button"
              onClick={startNewGame}
              aria-label="Play again"
            >
              Play Again
            </button>
          </div>
        ) : !gameState.isPlaying ? (
          <button 
            className="simon-start-button"
            onClick={startNewGame}
            aria-label="Start new game"
          >
            Start Game
          </button>
        ) : null}
      </div>

      <div className="visually-hidden" role="status" aria-live="polite">
        {isGameOver 
          ? `Game Over! Final score: ${gameState.score}. High score: ${gameState.highScore}`
          : gameState.isShowingSequence 
            ? 'Watch and remember the sequence'
            : gameState.isPlaying 
              ? 'Your turn to repeat the sequence'
              : 'Press Start Game to begin'}
      </div>
    </div>
  );
};

export default SimonMode; 