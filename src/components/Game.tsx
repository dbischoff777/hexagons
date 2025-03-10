import { useEffect, useRef, useState, useCallback, useMemo, useLayoutEffect } from 'react'
import { PowerUpState, ComboState, GameState, PlacedTile } from '../types/index'
import { createTileWithRandomEdges, hexToPixel, getAdjacentTiles, getAdjacentDirection, COLORS, updateMirrorTileEdges } from '../utils/hexUtils'
import { INITIAL_TIME, formatTime, isGridFull } from '../utils/gameUtils'
import { SoundManager } from '../utils/soundManager'
import './Game.css'
import { useAccessibility } from '../contexts/AccessibilityContext'
import { findPotentialMatches } from '../utils/accessibilityUtils'
import { TutorialState } from '../types/tutorial'
import { TUTORIAL_STEPS } from '../constants/tutorialSteps'
import { TutorialMessage } from './TutorialMessage'
import { saveGameState, loadGameState, updateStatistics, clearSavedGame, getStatistics } from '../utils/gameStateUtils'
import Particles from './Particles'
import { Achievement } from '../types/achievements'
import { updateTilesPlaced, updateScore, updateCombo, updateAchievements, updateGridClears } from '../utils/achievementUtils'
import AchievementPopup from './AchievementPopup'
import { DailyChallenge } from '../types/dailyChallenge'
import { getDailyChallenge, updateDailyChallengeProgress, isDailyChallengeCompleted } from '../utils/dailyChallengeUtils'
import { 
  addExperience, 
  EXPERIENCE_VALUES, 
  getCurrentLevelInfo, 
  getPlayerProgress, 
  getTheme,
  LEVEL_BLOCKS,
  PROGRESSION_KEY,
  getNextLevelInfo
} from '../utils/progressionUtils'
import LevelProgress from './LevelProgress'
import LevelRoadmap from './LevelRoadmap'
import BadgePopup from './BadgePopup'
import { Badge } from '../types/progression'
import { Companion } from '../types/companion'
/* import CompanionHUD from './CompanionHUD' */
import { COMPANIONS } from '../types/companion'
import type { CompanionId } from '../types/companion'
import UpgradeModal from './UpgradeModal'
import { getInitialUpgradeState, purchaseUpgrade, saveUpgradeState } from '../utils/upgradeUtils'
import { UpgradeState } from '../types/upgrades'
import { unlockNextLevel, LevelCompletion } from '../utils/levelUtils'
import './LevelCompleteOverlay.css'
import FrenchBulldog from './FrenchBulldog'
import bulldogConfig from '../config/bulldogConfig.json'
import { animateRotation, rotateTileEdges, setupRotationTimer } from '../utils/rotationUtils';
import '../styles/rotation.css';
import { 
  getFeedbackForScore,
  handleTileMatches,
  updateTileValues,
  hasMatchingEdges, 
} from '../utils/matchingUtils';
import { RotationState } from '../utils/rotationUtils';
import { createInitialTile, createTiles } from '../utils/tileFactory';
import '../styles/tiles.css';
import ScorePopup from './ScorePopup';
import { ScorePopupData } from '../types/scorePopup';
import { createScorePopup } from '../utils/popupUtils';
import { drawHexagonWithColoredEdges } from '../utils/hexagonRenderer'
import { formatScore } from '../utils/formatNumbers';
import SpringModal from './SpringModal'
import { handleKeyboardPlacement, loadKeyBindings } from '../utils/keyBindingsUtils'
import CustomCursor from './CustomCursor';
import { createDebugLogger } from '../utils/debugUtils';
import DailyChallengeHUD from './DailyChallengeHUD';
import { DailyObjective } from '../types/dailyChallenge';
import { ScoreHandler } from '../utils/scoreHandler';

const DEBUG = createDebugLogger('Game');

interface GameProps {
  musicEnabled: boolean
  soundEnabled: boolean
  timedMode: boolean
  onGameOver: () => void
  tutorial?: boolean
  onSkipTutorial?: () => void
  onExit: (forced?: boolean) => void
  onStartGame: (withTimer: boolean, targetScore?: number) => void
  savedGameState?: GameState | null
  isDailyChallenge?: boolean
  isLevelMode: boolean
  targetScore?: number
  currentBlock?: number
  currentLevel?: number
  onLevelComplete: (isComplete: boolean) => void;
  showLevelComplete: boolean;
  rotationEnabled: boolean  // Add this line
}

// Add these scoring constants near the top of the file
const SCORING_CONFIG = {
  baseMatch: 5, // Base points per matching edge
  quickPlacement: {
    baseMultiplier: 1.2,
    levelScaling: 0.1, // Increases by 10% per level
    maxMultiplier: 3.0
  },
  combo: {
    baseMultiplier: 1.5,
    levelScaling: 0.15, // Increases by 15% per level
    maxMultiplier: 4.0
  }
};

// Add this helper function to calculate dynamic multipliers
const calculateDynamicMultiplier = (
  base: number,
  scaling: number,
  max: number,
  level: number,
  streakCount: number = 1
) => {
  const levelBonus = 1 + (level - 1) * scaling;
  const streakBonus = 1 + (streakCount - 1) * 0.2; // 20% increase per streak
  return Math.min(base * levelBonus * streakBonus, max);
};

// Add these constants near the top of the file
const UPGRADE_POINT_REWARDS = {
  match: {
    base: 1,  // Base points for matches
    threshold: 3, // Minimum matches needed
    bonus: 0.5   // Additional points per match above threshold
  },
  combo: {
    base: 2,     // Base points for combos
    threshold: 4, // Minimum combo needed
    bonus: 1     // Additional points per combo level above threshold
  },
  clear: {
    points: 5    // Points for clearing the grid
  },
  achievement: {
    points: 10   // Points for unlocking achievements
  },
  levelUp: {
    points: 15   // Points for leveling up
  },
  dailyChallenge: {
    points: 20   // Points for completing daily challenge
  }
};

// Add at the top with other type definitions
type GridPosition = [number, number];

// Define the exact positions we expect in a radius 3 hexagonal grid
const VALID_POSITIONS: GridPosition[] = [
  // Center
  [0, 0],
  
  // Inner ring (6 positions)
  [1, 0], [0, 1], [-1, 1], 
  [-1, 0], [0, -1], [-1, -1],
  
  // Middle ring (12 positions)
  [2, 0], [1, 1], [0, 2], [-1, 2], 
  [-2, 1], [-2, 0], [0, -2], [1, 2],
  [1, -2], [2, -2], [-2, -1], [-1, -2],
  
  // Outer ring (18 positions)
  [3, 0], [2, 1],  [0, 3],
  [-1, 3], [-2, 2], [-3, 1], 
  [0, -3], [1, -3], [3, -3],
  [3, -1], [3, -2], [-3, 0],
  [-3, 2], [-3, 3], [-2, 3],
  [-2, -2], [-3, -1], [-1, -3],
].sort((a, b) => {
  // Sort by ring number first, then by angle
  const ringA = Math.max(Math.abs(a[0]), Math.abs(a[1]), Math.abs(-a[0]-a[1]));
  const ringB = Math.max(Math.abs(b[0]), Math.abs(b[1]), Math.abs(-b[0]-b[1]));
  if (ringA !== ringB) return ringA - ringB;
  
  // Within same ring, sort by angle
  const angleA = Math.atan2(a[1], a[0]);
  const angleB = Math.atan2(b[1], b[0]);
  return angleA - angleB;
}) as GridPosition[];

// Add this helper function to get ring number for a position
const getRingNumber = (q: number, r: number): number => {
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(-q-r));
};

// Add the constant for grid clear points
const GRID_CLEAR_POINTS = 1000;

// Add the cleanup function
const cleanupGridAnimations = (wrapper: HTMLElement) => {
  // Remove the animation class
  wrapper.classList.remove('grid-full');
  
  // Clean up CSS variables
  wrapper.style.removeProperty('--theme-primary');
  wrapper.style.removeProperty('--theme-accent');
  
  // Remove all animation elements
  const elements = wrapper.querySelectorAll('.hex-ripple, .tile-flash');
  elements.forEach((el: Element) => el.remove());
};

// Add this component inside Game.tsx but before your main Game component
const FPSCounter = () => {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let animationFrameId: number;

    const tick = () => {
      frameCount.current++;
      const now = performance.now();
      const delta = now - lastTime.current;

      if (delta >= 1000) {
        const currentFps = Math.round((frameCount.current * 1000) / delta);
        setFps(currentFps);
        frameCount.current = 0;
        lastTime.current = now;
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const getFpsClass = () => {
    if (fps >= 55) return 'high';
    if (fps >= 30) return 'medium';
    return 'low';
  };

  return (
    <div className={`fps-debug ${getFpsClass()}`}>
      FPS: {fps}
    </div>
  );
};

const Game: React.FC<GameProps> = ({ 
  musicEnabled, 
  soundEnabled, 
  timedMode, 
  onGameOver, 
  tutorial = false, 
  onSkipTutorial, 
  onExit, 
  onStartGame, 
  savedGameState, 
  isDailyChallenge = false,
  isLevelMode,
  targetScore,
  currentBlock,
  currentLevel,
  onLevelComplete,
  showLevelComplete: isLevelComplete,
  rotationEnabled
}: GameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Calculate center based on canvas size
  const centerX = canvasRef.current ? canvasRef.current.width / 2 : 0;
  const centerY = canvasRef.current ? canvasRef.current.height / 2 : 0;
  
  const cols = 7
  const rows = Math.floor(cols/2); // This matches our hexagonal grid radius
  const [upgradeState, setUpgradeState] = useState<UpgradeState>(getInitialUpgradeState());
  
  // Now initialize states that depend on createNewTile
  const [placedTiles, setPlacedTiles] = useState<PlacedTile[]>([
    savedGameState?.placedTiles?.[0] ?? createInitialTile()
  ]);
  
  const [nextTiles, setNextTiles] = useState<PlacedTile[]>(() => 
    savedGameState?.nextTiles ?? createTiles(3, upgradeState)
  );

  const [scoreHandler] = useState(() => new ScoreHandler(savedGameState?.score ?? 0));

  const [timeLeft, setTimeLeft] = useState<number>(
    savedGameState?.timeLeft ?? (timedMode ? INITIAL_TIME : Infinity)
  )
  const [isGameOver, setIsGameOver] = useState<boolean>(false)
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | null>(null)
  const [scorePopups, setScorePopups] = useState<ScorePopupData[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUpState>(
    savedGameState?.powerUps ?? {
      freeze: { active: false, remainingTime: 0 },
      colorShift: { active: false },
      multiplier: { active: false, value: 1, remainingTime: 0 }
    }
  )
  const [combo, setCombo] = useState<ComboState>(
    savedGameState?.combo ?? {
      count: 0,
      timer: 0,
      multiplier: 1,
      lastPlacementTime: 0
    }
  )
  const { settings } = useAccessibility()
  const [tutorialState, setTutorialState] = useState<TutorialState>({
    active: tutorial,
    currentStep: 0,
    rotationCount: 0,
    hasPlaced: false
  })
  const [previousState, setPreviousState] = useState<{
    placedTiles: PlacedTile[]
    nextTiles: PlacedTile[]
    score: number
  } | null>(null)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null)
  const [showDailyComplete, setShowDailyComplete] = useState(false)
  const [playerProgress, setPlayerProgress] = useState(getPlayerProgress())
  const [currentTheme, setCurrentTheme] = useState(() => {
    const playerProgress = getPlayerProgress();
    return getTheme(playerProgress.selectedTheme || 'default');
  });
  const [showLevelRoadmap, setShowLevelRoadmap] = useState(false)
  const [newBadges, setNewBadges] = useState<Badge[]>([])
  const [particleIntensity, setParticleIntensity] = useState(0.5)
  const [particleColor, setParticleColor] = useState(currentTheme.colors.primary)
  const [backgroundGlow, setBackgroundGlow] = useState('');
  const [animatingTiles, setAnimatingTiles] = useState<{ q: number, r: number, type: 'place' | 'match' | 'hint' }[]>([]);
  const [companion, setCompanion] = useState<Companion>(() => {
    const progress = getPlayerProgress();
    const selectedCompanion = COMPANIONS[progress.selectedCompanion as CompanionId] || COMPANIONS.default;
    return {
      ...selectedCompanion,
      abilities: [...selectedCompanion.abilities],
      personality: {
        ...selectedCompanion.personality,
        greetings: [...selectedCompanion.personality.greetings],
        smallMatch: [...selectedCompanion.personality.smallMatch],
        bigMatch: [...selectedCompanion.personality.bigMatch],
        smallCombo: [...selectedCompanion.personality.smallCombo],
        bigCombo: [...selectedCompanion.personality.bigCombo],
        abilityUse: [...selectedCompanion.personality.abilityUse],
        idle: [...selectedCompanion.personality.idle]
      }
    };
  });
  const [showCompanion, setShowCompanion] = useState(false);
  const [lastAction, setLastAction] = useState<{
    type: 'match' | 'combo' | 'clear' | 'ability';
    value?: number;
    abilityName?: string;
  } | undefined>();
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState<LevelCompletion | null>(null);

  // Add a state to track initialization
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Add this state near other state declarations
  const [showExitPrompt, setShowExitPrompt] = useState(false);

  // Replace the separate rotation states with a single state
  const [rotationState, setRotationState] = useState<RotationState>({
    boardRotation: savedGameState?.boardRotation ?? 0,
    showWarning: false,
    showRotationText: false,
    isRotating: false
  });

  // Add these calculations based on the canvas size
  const tileSize = 40;

  // Add this state to track the current grid position
  const [currentGridPosition, setCurrentGridPosition] = useState<{ q: number, r: number }>({ q: 0, r: 0 });

  // Add this state to track initialization
  const [isInitializing, setIsInitializing] = useState(false);

  // Add this at the top with other refs
  const lastStateRef = useRef<string>('');

  const awardUpgradePoints = useCallback((points: number) => {
    setUpgradeState(prev => ({
      ...prev,
      points: prev.points + points
    }));
  }, []);

  const updateParticleEffect = useCallback((intensity: number) => {
    setParticleIntensity(intensity);
  }, []);

  const playGameSound = useCallback((soundType: string) => {
    if (soundEnabled) {
      soundManager.playSound(soundType);
    }
  }, [soundEnabled]);

  const handleGameAchievement = useCallback((_type: 'level' | 'daily' | 'achievement', points: number) => {
    awardUpgradePoints(points);
    playGameSound('achievement');
    updateParticleEffect(1);
  }, [playGameSound, updateParticleEffect, awardUpgradePoints]);

  // Update the initialization effect
  useEffect(() => {
    if (!isInitialized && !isInitializing && isLevelMode) {
      setIsInitializing(true);
      
      // Get current level info based on score
      const { currentBlock, currentLevel } = getCurrentLevelInfo(scoreHandler.getScore());
      
      // Get next level info using the utility function
      const nextLevel = getNextLevelInfo(currentBlock, currentLevel, LEVEL_BLOCKS);
      const effectiveTargetScore = nextLevel?.pointsRequired ?? 10000;
      
      DEBUG.log('Game initializing with level mode:', {
        isLevelMode,
        targetScore: effectiveTargetScore,
        currentBlock,
        currentLevel,
        nextLevel,
        source: 'Game initialization'
      });
      
      // Only update target score if it's not already set
      if (!targetScore) {
        onStartGame(true, effectiveTargetScore);
      }
      setIsInitialized(true);
      setIsInitializing(false);
    }
  }, [isLevelMode, isInitialized, isInitializing, scoreHandler.getScore(), onStartGame, targetScore]);

  // Create constants for log messages to ensure consistency
  const LOG_MESSAGES = {
    PROPS_RECEIVED: 'Game props received',
    STATE_UPDATED: 'Game state updated'
  } as const;

  // Add a memo for the game state to prevent unnecessary updates
  const gameState = useMemo(() => ({
    isLevelMode,
    targetScore,
    currentBlock,
    currentLevel,
    isDailyChallenge,
    isGameOver,
    score: scoreHandler.getScore(),
    timedMode,
    isInitialized,
    rotationEnabled
  }), [
    isLevelMode,
    targetScore,
    currentBlock,
    currentLevel,
    isDailyChallenge,
    isGameOver,
    scoreHandler.getScore(),
    timedMode,
    isInitialized,
    rotationEnabled
  ]);

  // Single effect for state updates
  useEffect(() => {
    if (!isInitialized) return;
    
    const stateKey = JSON.stringify(gameState);
    if (stateKey !== lastStateRef.current) {
      lastStateRef.current = stateKey;
      DEBUG.log(LOG_MESSAGES.STATE_UPDATED, gameState);
    }
  }, [isInitialized, gameState]);

  // Add a memo for props to prevent unnecessary updates
  const gameProps = useMemo(() => ({
    isLevelMode,
    targetScore,
    currentBlock,
    currentLevel,
    isDailyChallenge,
    timedMode
  }), [
    isLevelMode,
    targetScore,
    currentBlock,
    currentLevel,
    isDailyChallenge,
    timedMode
  ]);

  // Single effect for props updates
  useEffect(() => {
    const propsKey = JSON.stringify(gameProps);
    if (propsKey !== lastPropsRef.current) {
      lastPropsRef.current = propsKey;
      DEBUG.log(LOG_MESSAGES.PROPS_RECEIVED, gameProps);
    }
  }, [gameProps]);

  // Add this ref at the top with other refs
  const lastPropsRef = useRef<string>('');

  // Remove any other debug logging effects

  // 1. Modify handleScoreChange to be more efficient and add debugging
  const handleScoreChange = useCallback((points: number) => {
    console.log('handleScoreChange called with points:', points, {
      currentScore: scoreHandler.getScore(),
      willBecome: scoreHandler.getScore() + points
    });
    scoreHandler.addPoints(points);
  }, [scoreHandler]);

  // Move addTileAnimation outside useEffect and memoize it
  const addTileAnimation = useCallback((q: number, r: number, type: 'place' | 'match' | 'hint') => {
    setAnimatingTiles(prev => [...prev, { q, r, type }]);
    
    // Remove animation after duration
    setTimeout(() => {
      setAnimatingTiles(prev => prev.filter(tile => 
        !(tile.q === q && tile.r === r && tile.type === type)
      ));
    }, type === 'place' ? 500 : type === 'match' ? 800 : 600);
  }, []);

  // 3. Fix the rotation effect to prevent cascading updates
  useEffect(() => {
    if (!rotationEnabled || isGameOver || rotationState.isRotating) return;

    const cleanup = setupRotationTimer(
      isGameOver,
      rotationEnabled,
      () => {
        setRotationState(prev => ({
          ...prev,
          showWarning: true,
          showRotationText: true
        }));
      },
      () => {
        const cleanupAnimation = animateRotation(
          rotationState.boardRotation,
          (newState) => {
            setRotationState(newState);
          },
          () => {
            // Don't update tiles at all - the visual rotation is handled by CSS transform
          }
        );

        return cleanupAnimation;
      }
    );

    return cleanup;
  }, [isGameOver, rotationEnabled, rotationState.boardRotation]);

  // Main game effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 1000
    canvas.height = 800

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (!isGameOver || isLevelMode) {
        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate((rotationState.boardRotation * Math.PI) / 180)
        ctx.translate(-centerX, -centerY)

        // Draw base grid first
        for (let q = -rows; q <= rows; q++) {
          for (let r = Math.max(-cols, -q-cols); r <= Math.min(cols, -q+cols); r++) {
            const s = -q - r
            if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= Math.floor(cols/2)) {
              const { x, y } = hexToPixel(q, r, centerX, centerY, tileSize)
              drawHexagonWithColoredEdges({
                ctx, x, y, size: tileSize, settings, theme: currentTheme, selectedTileIndex, animatingTiles
              })
            }
          }
        }

        // Draw placed tiles separately
        placedTiles.forEach(tile => {
          const { x, y } = hexToPixel(tile.q, tile.r, centerX, centerY, tileSize)
          const isMatched = tile.hasBeenMatched || false
          const isSelected = selectedTileIndex !== null && tile === placedTiles[selectedTileIndex]
          
          drawHexagonWithColoredEdges({
            ctx, x, y, size: tileSize, tile, isMatched, isSelected, settings, theme: currentTheme, selectedTileIndex, animatingTiles
          })
        })

        ctx.restore()

        // Draw cursor tile without rotation
        if (selectedTileIndex !== null && mousePosition) {
          ctx.globalAlpha = 0.6;
          drawHexagonWithColoredEdges({
            ctx,
            x: mousePosition.x,
            y: mousePosition.y,
            size: tileSize,
            tile: nextTiles[selectedTileIndex],
            isSelected: true,
            settings,
            theme: currentTheme,
            selectedTileIndex,
            animatingTiles,
            showInfoBox: true,  // Show info box for cursor tile
            isCursorTile: true
          });
          ctx.globalAlpha = 1;
        }
      }
    }

    // First, create a helper function to calculate grid coordinates
    const calculateGridCoordinates = (event: MouseEvent, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      
      // Get the actual displayed dimensions after CSS transform
      const displayWidth = rect.width;
      const displayHeight = rect.height;
      
      // Convert screen coordinates to canvas space
      const scaleX = canvas.width / displayWidth;
      const scaleY = canvas.height / displayHeight;
      
      // Get mouse position in canvas coordinates
      const mouseX = (event.clientX - rect.left) * scaleX;
      const mouseY = (event.clientY - rect.top) * scaleY;
      
      // Adjust for center offset
      const adjustedX = mouseX - centerX;
      const adjustedY = mouseY - centerY;
      
      // Apply rotation
      const angle = (-rotationState.boardRotation * Math.PI) / 180;
      const rotatedX = adjustedX * Math.cos(angle) - adjustedY * Math.sin(angle);
      const rotatedY = adjustedY * Math.cos(angle) + adjustedX * Math.sin(angle);
      
      // Calculate hex grid spacing
      const spacing = 1.1;
      const hexSize = tileSize * spacing;
      
      // Calculate floating point coordinates
      const qf = rotatedX / (hexSize * 1.5);
      const rf = (rotatedY - qf * hexSize * Math.sqrt(3)/2) / (hexSize * Math.sqrt(3));
      const sf = -qf - rf;
      
      // Snap to nearest hex
      const q = Math.round(qf);
      const r = Math.round(rf);
      const s = -q - r;

      return {
        mouseRaw: { x: mouseX, y: mouseY },
        centerPoint: { x: centerX, y: centerY },
        cssScale: scaleX,
        canvasScale: canvas.width / displayWidth,
        adjusted: { x: adjustedX, y: adjustedY },
        rotated: { x: rotatedX, y: rotatedY },
        floatingPoint: { q: qf, r: rf, s: sf },
        gridCoords: { q, r, s },
        pixelPosition: hexToPixel(q, r, centerX, centerY, tileSize)
      };
    };

    // Then modify the handleClick function to use this helper
    const handleClick = (event: MouseEvent | KeyboardEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Add check for spacebar/keyboard placement
      const isKeyboardPlacement = event instanceof KeyboardEvent && 
        (event.key === ' ' || event.key === 'Enter') &&
        selectedTileIndex !== null && 
        currentGridPosition;

      // For keyboard placement, use current grid position
      if (isKeyboardPlacement) {
        const { q, r } = currentGridPosition;
        const isValidPosition = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q-r)) <= Math.floor(cols/2);
        const isOccupied = placedTiles.some(tile => tile.q === q && tile.r === r);

        if (isValidPosition && !isOccupied && selectedTileIndex !== null) {
          // Create new tile at current grid position
          const selectedTile = nextTiles[selectedTileIndex];
          setPlacedTiles(prevTiles => [...prevTiles, {
            ...selectedTile,
            q,
            r,
            isPlaced: true,
            type: selectedTile.type || 'normal',
            value: 0
          }]);

          // Update next tiles
          const newTiles = [...nextTiles];
          newTiles[selectedTileIndex] = createTileWithRandomEdges(0, 0);
          setNextTiles(newTiles);
          setSelectedTileIndex(null);

          if (soundEnabled) {
            soundManager.playSound('tilePlaced');
          }
        }
        return;
      }

      // Handle mouse placement (existing click logic)
      const mouseEvent = event as MouseEvent;
      const gridCalc = calculateGridCoordinates(mouseEvent, canvas);

      // Use the next-tile canvas dimensions
      const tileRadius = 40;

      // Update next tiles click detection
      nextTiles.forEach((tile, index) => {
        const tileElement = document.querySelector(`.next-tile:nth-child(${index + 1}) canvas`);
        if (tileElement) {
          const tileBounds = tileElement.getBoundingClientRect();
          const tileX = (tileBounds.left + tileBounds.width/2 - canvas.getBoundingClientRect().left) * gridCalc.canvasScale;
          const tileY = (tileBounds.top + tileBounds.height/2 - canvas.getBoundingClientRect().top) * gridCalc.canvasScale;
          
          const dx = gridCalc.mouseRaw.x - tileX;
          const dy = gridCalc.mouseRaw.y - tileY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance <= tileRadius && !tile.isPlaced) {
            setSelectedTileIndex(selectedTileIndex === index ? null : index);
            if (soundEnabled) {
              soundManager.playSound('buttonClick');
            }
            return;
          }
        }
      });

      // Handle game over state
      if (isGameOver) {
        const buttonY = canvas.height / 2 + 100;
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonX = canvas.width / 2 - buttonWidth / 2;

        if (gridCalc.mouseRaw.x >= buttonX && gridCalc.mouseRaw.x <= buttonX + buttonWidth &&
            gridCalc.mouseRaw.y >= buttonY && gridCalc.mouseRaw.y <= buttonY + buttonHeight) {
          resetGame();
          return;
        }
        return;
      }

      // Handle tile placement
      if (selectedTileIndex !== null) {
        const { q, r, s } = gridCalc.gridCoords;
        const isValidPosition = Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= Math.floor(cols/2);
        const isOccupied = placedTiles.some(tile => tile.q === q && tile.r === r);

        if (isValidPosition && !isOccupied) {
          const selectedTile = nextTiles[selectedTileIndex]
          
          // Create new tile with original coordinates
          let newTile: PlacedTile = { 
            ...selectedTile, 
            q, 
            r,
            value: 0,
            isPlaced: true,
            type: selectedTile.type || 'normal',  // Preserve the tile type
            hasBeenMatched: false,
            powerUp: selectedTile.powerUp  // Explicitly preserve the powerUp property
          }

          // If board is rotated 180 degrees, only rotate the edges
          if (Math.abs(rotationState.boardRotation % 360) === 180) {
            newTile.edges = [...newTile.edges.slice(3), ...newTile.edges.slice(0, 3)];
          }

          // If it's a mirror tile, update its edges based on adjacent tiles
          if (newTile.type === 'mirror') {
            const { tile: updatedTile, points: mirrorPoints } = updateMirrorTileEdges(newTile, placedTiles);
            newTile = updatedTile;
            
            if (mirrorPoints > 0) {
              // Add score popup for mirror matches
              const feedback = getFeedbackForScore(mirrorPoints);
              addScorePopup({
                score: mirrorPoints,
                x: (canvas.width / 2) * 0.2,  // Apply same horizontal scale factor as other popups
                y: (canvas.height / 2 - 50) * 0.8,  // Apply same vertical scale factor as other popups
                emoji: feedback.emoji,
                text: 'Mirror Match!',
                type: 'score'
              });
              
              // Update score
              handleScoreChange(mirrorPoints);
              soundManager.playSound('mirror');
            }
          }
          
          // Create initial tiles with updated values
          const initialPlacedTiles: PlacedTile[] = updateTileValues([...placedTiles, newTile]);

          // Then, in a separate step, mark matched tiles
          const newPlacedTiles: PlacedTile[] = initialPlacedTiles.map((tile: PlacedTile): PlacedTile => {
            const updated = {
              ...tile,
              hasBeenMatched: tile.hasBeenMatched || hasMatchingEdges(tile, initialPlacedTiles, settings.isColorBlind),
              powerUp: tile.powerUp
            };
            return updated;
          });

          // Get the updated tile with its correct value
          const updatedPlacedTile = newPlacedTiles.find(tile => tile.q === q && tile.r === r)!;
          
          // Count matching edges
          const adjacentTiles = getAdjacentTiles(updatedPlacedTile, newPlacedTiles);
          let matchCount = 0;
          
          // Check each edge for matches
          updatedPlacedTile.edges.forEach((edge: { color: string }, index: number) => {
            const adjacentTile = adjacentTiles.find((t: PlacedTile) => 
              getAdjacentDirection(updatedPlacedTile.q, updatedPlacedTile.r, t.q, t.r) === index
            );
            
            if (adjacentTile) {
              const adjacentEdgeIndex = (getAdjacentDirection(adjacentTile.q, adjacentTile.r, updatedPlacedTile.q, updatedPlacedTile.r) + 3) % 6;
              if (edge.color === adjacentTile.edges[adjacentEdgeIndex].color) {
                matchCount++;
              }
            }
          });

          // Inside handleClick where we handle matches
          if (matchCount > 0) {
            handleTilePlacement(updatedPlacedTile, newPlacedTiles);
            setPlacedTiles(newPlacedTiles);
            addTileAnimation(q, r, 'match');
            setLastAction({ type: 'match', value: matchCount * SCORING_CONFIG.baseMatch });

            // Remove grid clear check here since it's handled in the effect
            addScorePopup({
              score: matchCount * SCORING_CONFIG.baseMatch,
              x: canvas.width / 2,
              y: canvas.height / 2 - 100,
              emoji: getFeedbackForScore(matchCount * SCORING_CONFIG.baseMatch).emoji,
              text: matchCount === 1 ? 'Edge Match!' : 'Multiple Matches!',
              type: 'score'
            });
          }

          // Check for matches for grid-full bonus
          const matchingTiles = newPlacedTiles.filter((tile: PlacedTile) => 
            hasMatchingEdges(tile, newPlacedTiles, settings.isColorBlind)
          );
          
          // Update board with new tile
          setPlacedTiles(newPlacedTiles)
          
          // Move power-up activation after tile placement
          if (selectedTile.powerUp) {
            // Find the newly placed tile in the updated tiles array
            const placedPowerUpTile = newPlacedTiles.find(t => t.q === q && t.r === r);
            if (placedPowerUpTile) {
              activatePowerUp(placedPowerUpTile);
            }
          }
          
          // Generate new tile for the used slot
          const newTiles = [...nextTiles]
          newTiles[selectedTileIndex] = createTileWithRandomEdges(0, 0);
          setNextTiles(newTiles)
          setSelectedTileIndex(null)

          // When selecting a tile, calculate potential matches
          if (settings.showMatchHints || settings.isColorBlind) {
            const hints = findPotentialMatches(selectedTile, placedTiles, settings.isColorBlind)
            // Update tile matchPotential based on hints
            setPlacedTiles(prev => prev.map(tile => ({
              ...tile,
              matchPotential: hints
                .filter(hint => {
                  const tileKey = `${tile.q},${tile.r}`
                  const hintKey = `${hint.targetEdge.q},${hint.targetEdge.r}`
                  return tileKey === hintKey
                })
                .map(hint => hint.strength)
            })))
          }

          // Inside handleClick where we handle successful tile placement
          if (isValidPosition && !isOccupied) {
            setPreviousState({
              placedTiles,
              nextTiles,
              score: scoreHandler.getScore()
            });

            // Remove grid clear check from here since it's handled in the effect
            // const isGridFullWithMatches = isGridFull(newPlacedTiles, cols);
            // if (isGridFullWithMatches) { ... }

            // Check for achievements
            checkAchievements({
              tilesPlaced: 1,
              comboCount: combo.count,
              score: scoreHandler.getScore(),
              clearBonus: false // Let the effect handle grid clear
            });

            // Update daily challenge objectives
            if (isDailyChallenge) {
              updateObjectives(matchCount, combo.count, scoreHandler.getScore());
            }
          }

          // Inside handleClick where matches are handled
          if (matchingTiles.length >= 3) {
            awardExperience('match', EXPERIENCE_VALUES.match * matchingTiles.length);
          }
          // Where combos are handled
          if (combo.count > 1) {
            awardExperience('combo', EXPERIENCE_VALUES.combo * combo.count);
          }

          // Where grid clears are handled
          if (matchingTiles.length >= 3 && isGridFull(newPlacedTiles, cols)) {
            awardExperience('clear', EXPERIENCE_VALUES.clear);
          }
        }
      }

      if (tutorialState.active) {
        const currentStep = TUTORIAL_STEPS[tutorialState.currentStep]
        
        if (currentStep.requiresAction === 'select' && selectedTileIndex !== null) {
          progressTutorial()
        } else if (currentStep.requiresAction === 'place') {
          setTutorialState(prev => ({ ...prev, hasPlaced: true }))
          progressTutorial()
        }
      }
    }

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault()
      if (selectedTileIndex !== null) {
        soundManager.playSound('tileRotate')
        const newTiles = [...nextTiles]
        newTiles[selectedTileIndex] = {
          ...newTiles[selectedTileIndex],
          edges: rotateTileEdges(newTiles[selectedTileIndex].edges)
        }
        setNextTiles(newTiles)
      }

      if (tutorialState.active) {
        const currentStep = TUTORIAL_STEPS[tutorialState.currentStep]
        if (currentStep.requiresAction === 'rotate') {
          setTutorialState(prev => {
            const newRotationCount = prev.rotationCount + 1
            if (newRotationCount >= 3) { // Require 3 rotations before progressing
              progressTutorial()
              return { ...prev, rotationCount: 0 }
            }
            return { ...prev, rotationCount: newRotationCount }
          })
        }
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      
      // Get the actual displayed dimensions
      const displayWidth = rect.width;
      const displayHeight = rect.height;
      
      // Convert screen coordinates to canvas space
      const scaleX = canvas.width / displayWidth;
      const scaleY = canvas.height / displayHeight;
      
      // Get mouse position in canvas coordinates
      const mouseX = (event.clientX - rect.left) * scaleX;
      const mouseY = (event.clientY - rect.top) * scaleY;
      
      setMousePosition({
        x: mouseX,
        y: mouseY
      });
    };

    // Add the context menu event listener with the click handler
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)
    canvas.addEventListener('contextmenu', handleContextMenu)

    draw()

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
      canvas.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [
      placedTiles,
      nextTiles,
      selectedTileIndex,
    mousePosition, 
      isGameOver,
      rotationState.boardRotation,
    settings
  ]) // Removed dependencies that change too frequently

  // Add power-up activation handler
  const activatePowerUp = (tile: PlacedTile) => {
    if (!tile.powerUp) {
      return;
    }

    const { type } = tile.powerUp;
    soundManager.playSound('powerUp');

    switch (type) {
      case 'colorShift':
        // Get the current tiles from state to ensure we have the latest state
        const currentTiles = [...placedTiles, tile]; // Include the new tile
        const adjacentTiles = getAdjacentTiles(tile, currentTiles);
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        
        const updatedTiles = currentTiles.map(t => {
          if (t.q === tile.q && t.r === tile.r) {
            return tile;
          }
          if (adjacentTiles.includes(t)) {
            return {
              ...t,
              edges: t.edges.map(() => ({ color: randomColor }))
            }
          }
          return t;
        });
        
        setPlacedTiles(updatedTiles);
        break;
      case 'freeze':
        setPowerUps(prev => ({
          ...prev,
          freeze: { active: true, remainingTime: tile.powerUp!.duration! }
        }))
        break

      case 'multiplier':
        setPowerUps(prev => ({
          ...prev,
          multiplier: { 
            active: true, 
            value: tile.powerUp!.multiplier!, 
            remainingTime: tile.powerUp!.duration! 
          }
        }))
        break
    }
  }

  // Add power-up timer effect
  useEffect(() => {
    if (!isGameOver) {
      const timer = setInterval(() => {
        setPowerUps((prev: PowerUpState) => ({
          freeze: {
            active: prev.freeze.remainingTime > 0,
            remainingTime: Math.max(0, prev.freeze.remainingTime - 1)
          },
          colorShift: prev.colorShift,
          multiplier: {
            active: prev.multiplier.remainingTime > 0,
            value: prev.multiplier.remainingTime > 0 ? prev.multiplier.value : 1,
            remainingTime: Math.max(0, prev.multiplier.remainingTime - 1)
          }
        }))
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [isGameOver])

  // Update the timer effect to only show timer in timed mode and not level mode
  useEffect(() => {
    if (timedMode && !isLevelMode && timeLeft > 0 && !isGameOver) {
      const timer = setInterval(() => {
        if (!powerUps.freeze.active) {
          setTimeLeft(prev => prev - 1);
        }
      }, 1000);
      return () => clearInterval(timer);
    } else if (timedMode && !isLevelMode && timeLeft === 0) {
      setIsGameOver(true);
      onGameOver();
    }
  }, [timeLeft, isGameOver, timedMode, isLevelMode, powerUps.freeze.active, onGameOver]);

  // Add combo timer effect
  useEffect(() => {
    if (combo.timer > 0) {
      const timer = setInterval(() => {
        setCombo(prev => ({
          ...prev,
          timer: Math.max(0, prev.timer - 1)
        }))
      }, 1000)
      return () => clearInterval(timer)
    } else if (combo.count > 0) {
      // Reset combo when timer runs out
      setCombo({
        count: 0,
        timer: 0,
        multiplier: 1,
        lastPlacementTime: 0
      })
    }
  }, [combo.timer])

  // Modify the addScorePopup function to handle popup clearing and positioning better
  const addScorePopup = useCallback(({ score, x, y, emoji, text, type }: Omit<ScorePopupData, 'id'>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get canvas rect to calculate relative position
    const canvasRect = canvas.getBoundingClientRect();
    
    // Create popup with position relative to viewport
    const newPopup = createScorePopup({
      score,
      x: canvasRect.left + (x / canvas.width * 0.2) * canvasRect.width,  // Convert to viewport coordinates
      y: canvasRect.top + (y / canvas.height * 0.8) * canvasRect.height,  // Convert to viewport coordinates
      emoji,
      text,
      type
    });
    
    setScorePopups(prev => {
      const filtered = prev.filter(p => p.type !== type);
      return [...filtered, newPopup];
    });

    if (soundEnabled) {
      switch (type) {
        case 'combo':
          soundManager.playSound('combo');
          break;
        case 'clear':
          soundManager.playSound('clear');
          break;
        case 'quick':
          soundManager.playSound('quick');
          break;
        default:
          soundManager.playSound('score');
      }
    }
  }, [soundEnabled]);

  // Update the cleanup effect
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];  // Change type from number[] to NodeJS.Timeout[]
    
    scorePopups.forEach(popup => {
      const duration = popup.type === 'score' ? 2000 : 800;
      const timeout = setTimeout(() => {
        setScorePopups(prev => prev.filter(p => p.id !== popup.id));
      }, duration);
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [scorePopups]);

  // Add tutorial progress function
  const progressTutorial = () => {
    if (tutorialState.currentStep < TUTORIAL_STEPS.length - 1) {
      setTutorialState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        rotationCount: 0,
        hasPlaced: false
      }))
    } else {
      setTutorialState(prev => ({
        ...prev,
        active: false
      }))
    }
  }

  // Add effect to handle tutorial prop changes
  useEffect(() => {
    setTutorialState(prev => ({ ...prev, active: tutorial }))
  }, [tutorial])

  // Modify the game over effect to track game duration internally
  useEffect(() => {
    if (isGameOver) {
      const gameEndTime = Date.now()
      const gameStartTime = tutorialState.active ? gameEndTime : loadGameState()?.startTime ?? gameEndTime
      const playTime = (gameEndTime - gameStartTime) / 1000
      
      const finalScore = scoreHandler.getScore();
      
      // Update player's points with their score
      updatePlayerPoints(finalScore)

      // Update achievements with time
      updateAchievements({
        highestScore: Math.max(finalScore, getStatistics().highScore),
        highestCombo: Math.max(combo.count, getStatistics().longestCombo),
        fastestGameTime: Math.min(playTime, getStatistics().fastestGameTime || Infinity)
      });

      // Update statistics
      updateStatistics({
        gamesPlayed: 1,
        totalScore: finalScore,
        highScore: Math.max(finalScore, getStatistics().highScore),
        totalPlayTime: playTime,
        longestCombo: Math.max(combo.count, getStatistics().longestCombo),
        lastPlayed: new Date().toISOString()
      });
      clearSavedGame();
    }
  }, [isGameOver, combo.count]);

  // Modify the auto-save effect
  useEffect(() => {
    if (!isGameOver && !tutorialState.active) {
      const gameState: GameState = {
        placedTiles,
        nextTiles,
        score: scoreHandler.getScore(),
        timeLeft,
        moveHistory: previousState ? [previousState] : [],
        startTime: loadGameState()?.startTime ?? Date.now(),
        timedMode,
        boardRotation: rotationState.boardRotation === 0 || rotationState.boardRotation === 180 ? rotationState.boardRotation : 0, // Ensure only valid rotations are saved
      powerUps,
      combo,
        audioSettings: {
          musicEnabled,
          soundEnabled
        },
        companion
      }
      saveGameState(gameState)
    }
  }, [placedTiles, nextTiles, timeLeft, previousState, isGameOver, tutorialState.active, rotationState.boardRotation, powerUps, combo, musicEnabled, soundEnabled, companion])

  // Add this function to handle undoing moves
  const handleUndo = () => {
    if (previousState) {
      setPlacedTiles(previousState.placedTiles)
      setNextTiles(previousState.nextTiles)
      handleScoreChange(previousState.score);
      setPreviousState(null)
      soundManager.playSound('undo')
    }
  }

  // Remove the duplicate handleExit declarations and combine their functionality
  const handleExit = useCallback(() => {
    // Perform cleanup before showing exit prompt
    setShowExitPrompt(true);
    
    // Clear any ongoing animations or effects
    setAnimatingTiles([]);
    setParticleIntensity(0.5);
    setBackgroundGlow('');
    
    // Reset game state
    if (wrapperRef.current) {
      cleanupGridAnimations(wrapperRef.current);
    }
  }, []);

  // Add new function to handle actual exit
  const confirmExit = useCallback(() => {
    clearSavedGame();
    onLevelComplete(false);
    onExit(true);
  }, [onExit, onLevelComplete]);

  const handleLevelCompleteExit = useCallback(() => {
    clearSavedGame();
    onLevelComplete(true);
    onExit(false);
  }, [onLevelComplete, onExit]);

  const handleLevelCompleteNext = useCallback(() => {
    if (showLevelComplete?.nextLevel) {
      const [nextBlock, nextLevel] = showLevelComplete.nextLevel.split('-').map(Number);
      
      // Get the current block's data
      const currentBlock = LEVEL_BLOCKS.find(b => b.blockNumber === nextBlock);
      if (!currentBlock) return;

      // Get the next level's data
      const nextLevelData = currentBlock.levels[nextLevel - 1];
      if (!nextLevelData) return;

    /*   console.log('Starting next level:', {
        block: nextBlock,
        level: nextLevel,
        targetScore: nextLevelData.pointsRequired,
        source: 'Level Complete Next'
      }); */

      onStartGame(false, nextLevelData.pointsRequired);
      setShowLevelComplete(null);
    }
  }, [showLevelComplete, onStartGame]);

  // Keep this effect for handling achievement popups
  useEffect(() => {
    if (newAchievements.length > 0) {
      // Play achievement sound
      soundManager.playSound('powerUp');
      
      // Save achievement state with current values
      updateAchievements({
        highestScore: Math.max(scoreHandler.getScore(), getStatistics().highScore),
        highestCombo: Math.max(combo.count, getStatistics().longestCombo),
        totalTilesPlaced: placedTiles.length
      });
    }
  }, [newAchievements, scoreHandler.getScore(), combo.count, placedTiles.length]);

  // Add this new function in the Game component
  const checkAchievements = ({
    tilesPlaced,
    comboCount,
      score,
    clearBonus
  }: {
    tilesPlaced: number;
    comboCount: number;
    score: number;
    clearBonus: boolean;
  }) => {
    const newAchievements: Achievement[] = [];

    // Check tiles placed achievements
    if (tilesPlaced > 0) {
      const tilesAchievements = updateTilesPlaced(tilesPlaced);
      newAchievements.push(...tilesAchievements);
    }

    // Check combo achievements
    if (comboCount > 0) {
      const comboAchievements = updateCombo(comboCount);
      newAchievements.push(...comboAchievements);
    }

    // Check score achievements
    const scoreAchievements = updateScore(score);
    newAchievements.push(...scoreAchievements);

    // Check for grid clear achievements if applicable
    if (clearBonus) {
      const clearAchievements = updateGridClears(1);
      newAchievements.push(...clearAchievements);
    }

    // Add any new achievements to the popup queue
    if (newAchievements.length > 0) {
      setNewAchievements(prev => [...prev, ...newAchievements]);
    }
  };

  // Modify the daily challenge initialization effect
  useEffect(() => {
    if (isDailyChallenge) {
      const challenge = getDailyChallenge();
      setDailyChallenge(challenge);
      
      // Set up initial board state with complete PlacedTile properties
      setPlacedTiles(challenge.initialTiles.map(tile => ({
        ...tile,
        isPlaced: true,
        value: 0,
        type: 'normal'
      })));
      setNextTiles(challenge.nextTilesSequence[0].map(edges => ({
        ...createTileWithRandomEdges(0, 0),
        edges,
        isPlaced: false
      })));

      // Ensure objectives are initialized
      updateDailyChallengeProgress(challenge.objectives, 0);
    } else {
      // Clear daily challenge state when not in daily challenge mode
      setDailyChallenge(null);
    }

    // Cleanup function
    return () => {
      if (!isDailyChallenge) {
        setDailyChallenge(null);
      }
    };
  }, [isDailyChallenge]);

  // Modify the tile placement logic to update objectives
  const updateObjectives = (matchCount: number, comboCount: number, newScore?: number) => {
    if (!dailyChallenge) return;

    const updatedObjectives = dailyChallenge.objectives.map(obj => {
      switch (obj.type) {
        case 'score':
          return { ...obj, current: Math.min(newScore ?? scoreHandler.getScore(), obj.target) };
        case 'matches':
          return { ...obj, current: Math.min(obj.current + matchCount, obj.target) };
        case 'combos':
          return { ...obj, current: Math.min(Math.max(obj.current, comboCount), obj.target) };
        default:
          return obj;
      }
    });

    setDailyChallenge(prev => prev ? {
      ...prev,
      objectives: updatedObjectives
    } : null);

    updateDailyChallengeProgress(updatedObjectives, newScore ?? scoreHandler.getScore());

    // Show completion screen instead of immediate exit
    if (isDailyChallengeCompleted(updatedObjectives)) {
      setShowDailyComplete(true);
    }
  };

  // Modify the awardExperience function
  const awardExperience = (type: 'match' | 'combo' | 'clear' | 'challenge' | 'achievement', value: number) => {
    const { progress, newBadges } = addExperience({ type, value });
    setPlayerProgress(progress);
    if (newBadges.length > 0) {
      setNewBadges(prev => [...prev, ...newBadges]);
    }
  };

  // Add this function near other state updates
  const updatePlayerPoints = (newScore: number) => {
    const progress = getPlayerProgress();
    progress.points = Math.max(progress.points || 0, newScore);
    localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progress));
  };

  // Inside the Game component, update the initialization code
  useEffect(() => {
    if (savedGameState && !isGameOver) {
      // Only normalize rotation when first loading a saved game
      if (savedGameState.boardRotation !== undefined && savedGameState.boardRotation !== 0 && savedGameState.boardRotation !== 180) {
        // Normalize to either 0 or 180 degrees
        const normalizedRotation = savedGameState.boardRotation >= 90 ? 180 : 0;
        setRotationState(prev => ({
          ...prev,
          boardRotation: normalizedRotation
        }));
        
        // If the rotation changed, update tile edges accordingly
        if (normalizedRotation !== savedGameState.boardRotation) {
          const rotationDiff = normalizedRotation - savedGameState.boardRotation;
          const rotations = Math.abs(Math.round(rotationDiff / 60)); // Number of 60-degree rotations needed
          
          setPlacedTiles(savedGameState.placedTiles.map(tile => ({
            ...tile,
            edges: Array(rotations).fill(null).reduce(
              (edges) => rotateTileEdges(edges),
              tile.edges
            )
          })));
        } else {
          setPlacedTiles(savedGameState.placedTiles);
        }
      } else {
        // If rotation is already normalized, just set the values directly
        setRotationState(prev => ({
          ...prev,
          boardRotation: savedGameState.boardRotation ?? 0
        }));
        setPlacedTiles(savedGameState.placedTiles);
      }
      
      // Load the rest of the saved state
      setNextTiles(savedGameState.nextTiles);
      handleScoreChange(savedGameState.score);
      setTimeLeft(savedGameState.timeLeft);
      setPowerUps(savedGameState.powerUps);
      setCombo(savedGameState.combo);
      if (savedGameState.companion) {
        setCompanion(savedGameState.companion);
      }
    }
  }, [savedGameState, isGameOver]);

  // Add this effect to handle dynamic particle changes
  useEffect(() => {
    // Increase intensity based on score milestones
    const baseIntensity = 0.3;
    const scoreMultiplier = Math.min(scoreHandler.getScore() / 1000, 1);
    setParticleIntensity(baseIntensity + scoreMultiplier * 0.7);

    // Change particle color based on score and matches
    if (scoreHandler.getScore() > 1000) {
      setParticleColor(currentTheme.colors.accent);
    } else if (scoreHandler.getScore() > 500) {
      setParticleColor(currentTheme.colors.secondary);
    } else {
      setParticleColor(currentTheme.colors.primary);
    }
  }, [scoreHandler.getScore(), currentTheme]);

  // Add this effect to handle background changes
  useEffect(() => {
    const getBackgroundGlow = () => {
      if (scoreHandler.getScore() > 1500) return `radial-gradient(circle, ${currentTheme.colors.accent}22 0%, ${currentTheme.colors.background} 70%)`;
      if (scoreHandler.getScore() > 1000) return `radial-gradient(circle, ${currentTheme.colors.secondary}22 0%, ${currentTheme.colors.background} 60%)`;
      if (scoreHandler.getScore() > 500) return `radial-gradient(circle, ${currentTheme.colors.primary}22 0%, ${currentTheme.colors.background} 50%)`;
      return `radial-gradient(circle, ${currentTheme.colors.background} 0%, ${currentTheme.colors.background} 100%)`;
    };

    setBackgroundGlow(getBackgroundGlow());
  }, [scoreHandler.getScore(), currentTheme]);

  // Add match animation effect
  useEffect(() => {
    const matchedTiles = placedTiles.filter(tile => 
      hasMatchingEdges(tile, placedTiles, settings.isColorBlind)
    );

    if (matchedTiles.length > 0) {
      // Add matched tiles to animation
      matchedTiles.forEach(tile => {
        addTileAnimation(tile.q, tile.r, 'match');
      });
      
      // Increase particle effects for matches
      setParticleIntensity(1);
      setTimeout(() => {
        setParticleIntensity(0.3);
      }, 1000);
    }
  }, [placedTiles]);

  // Add companion ability handler
  const handleActivateAbility = useCallback((abilityId: string) => {
    const ability = companion.abilities.find(a => a.id === abilityId);
    if (!ability || ability.currentCooldown > 0 || ability.isActive) return;

    // Calculate level-based multipliers
    const levelMultiplier = 1 + (companion.level - 1) * 0.1; // 10% increase per level
    const durationMultiplier = 1 + (companion.level - 1) * 0.15; // 15% increase per level

    setCompanion(prev => ({
      ...prev,
      abilities: prev.abilities.map(a => 
        a.id === abilityId 
          ? { ...a, isActive: true, currentCooldown: a.cooldown }
          : a
      )
    }));

    // Handle ability effects with scaled values
    switch (ability.effect) {
      case 'timeBonus':
        // Slow down time with increased duration
        setPowerUps(prev => ({
          ...prev,
          freeze: { 
            active: true, 
            remainingTime: Math.floor((ability.duration ?? 10) * durationMultiplier)
          }
        }));
        break;
        
      case 'scoreBoost':
        // Increase score multiplier with both higher multiplier and duration
        setPowerUps(prev => ({
          ...prev,
          multiplier: { 
            active: true, 
            value: 1 + levelMultiplier, // Scales from 2x to 3x based on level
            remainingTime: Math.floor((ability.duration ?? 15) * durationMultiplier)
          }
        }));
        break;

      case 'comboExtend':
        // Extend the current combo timer
        setCombo(prev => ({
          ...prev,
          timer: prev.timer + 5, // Add 5 seconds to combo timer
        }));
        break;
    }
    setLastAction({ type: 'ability', abilityName: ability.name });
  }, [companion, nextTiles, selectedTileIndex, placedTiles]);

  // Update the companion experience gain to scale with level
  useEffect(() => {
    const matchedTiles = placedTiles.filter(tile => 
      hasMatchingEdges(tile, placedTiles, settings.isColorBlind)
    );

    if (matchedTiles.length > 0) {
      setCompanion(prev => {
        // Reduced base experience and level bonus
        const levelBonus = 1 + (prev.level - 1) * 0.1; // Reduced from 0.2 to 0.1 (10% more exp per level)
        const expGain = Math.floor(matchedTiles.length * 5 * levelBonus); // Reduced base exp from 10 to 5
        const newExp = prev.experience + expGain;
        
        if (newExp >= prev.experienceToNext) {
          // Make leveling up harder with each level
          const newExperienceToNext = Math.floor(prev.experienceToNext * 1.8); // Increased multiplier from 1.5 to 1.8
          
          return {
            ...prev,
            level: prev.level + 1,
            experience: newExp - prev.experienceToNext,
            experienceToNext: newExperienceToNext,
            // Reduce cooldowns more gradually
            abilities: prev.abilities.map(ability => ({
              ...ability,
              cooldown: Math.max(15, ability.cooldown - Math.floor(prev.level / 2)) // Slower cooldown reduction
            }))
          };
        }
        
        return {
          ...prev,
          experience: newExp
        };
      });
    }
  }, [placedTiles]);

  // Add companion cooldown effect
  useEffect(() => {
    if (!isGameOver) {
      const timer = setInterval(() => {
        setCompanion(prev => ({
          ...prev,
          abilities: prev.abilities.map(ability => ({
            ...ability,
            currentCooldown: Math.max(0, ability.currentCooldown - 1),
            isActive: ability.currentCooldown > 0 && ability.isActive
          }))
        }));
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isGameOver]);

  // Update the companion ability auto-activation effect
  useEffect(() => {
    if (!isGameOver) {
      const abilityTimers = companion.abilities.map((ability) => {
        return setInterval(() => {
          if (ability.currentCooldown === 0 && !ability.isActive) {
            // Automatically activate the ability
            handleActivateAbility(ability.id);
            
            // Play a sound effect
            soundManager.playSound('powerUp');
          }
        }, 100); // Check more frequently for better responsiveness
      });
      
      // Clean up all timers
      return () => {
        abilityTimers.forEach(timer => clearInterval(timer));
      };
    }
  }, [isGameOver, companion.abilities, handleActivateAbility]);

  // Update the companion visibility effect
  useEffect(() => {
    const progress = getPlayerProgress();
    setShowCompanion(!!progress.selectedCompanion);
  }, []);

  // Remove the temporary color match effect
  useEffect(() => {
    const clearColorMatches = () => {
      setPlacedTiles(prev => 
        prev.map(tile => ({
          ...tile,
          temporaryColorMatch: false
        }))
      );
    };

    const colorSyncAbility = companion.abilities.find(a => a.id === 'colorSync');
    if (colorSyncAbility?.isActive) {
      const timer = setTimeout(() => {
        clearColorMatches();
      }, (colorSyncAbility.duration ?? 5) * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [companion.abilities]);

  // Update the companion change event listener effect
  useEffect(() => {
    const handleCompanionChange = (e: CustomEvent<{ companionId: CompanionId }>) => {
      const newCompanion = COMPANIONS[e.detail.companionId];
      setCompanion(newCompanion);
    };

    window.addEventListener('companionChanged', handleCompanionChange as EventListener);
    return () => {
      window.removeEventListener('companionChanged', handleCompanionChange as EventListener);
    };
  }, []);

  // Add this function to handle upgrades
  const handleUpgrade = (upgradeId: string, type: 'tile' | 'grid') => {
    const newState = purchaseUpgrade(upgradeState, upgradeId, type);
    setUpgradeState(newState);
    soundManager.playSound('powerUp');
  };

  // Modify the game over effect to award upgrade points
  useEffect(() => {
    if (isGameOver) {
      // ... existing game over code ...

      // Award upgrade points based on score
      const pointsEarned = Math.floor(scoreHandler.getScore() / 100); // 1 point per 100 score
      setUpgradeState(prev => {
        const newState = {
          ...prev,
          points: prev.points + pointsEarned
        };
        saveUpgradeState(newState); 
        return newState;
      });
    }
  }, [isGameOver, scoreHandler.getScore()]);

  const handleGridClear = (points: number) => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    
    if (wrapper && canvas) {
      cleanupGridAnimations(wrapper);
      wrapper.classList.add('grid-full');
      
      // Get the game board scale from CSS variable
      const boardScale = parseFloat(getComputedStyle(document.documentElement)
        .getPropertyValue('--scale')) || 1;
      
      // Get canvas dimensions and scale
      const rect = canvas.getBoundingClientRect();
      const scaleX = (rect.width / canvas.width) * boardScale;
      const scaleY = (rect.height / canvas.height) * boardScale;
      
      // Set theme colors and tile size as CSS variables
      wrapper.style.setProperty('--theme-primary', currentTheme.colors.primary);
      wrapper.style.setProperty('--theme-accent', currentTheme.colors.accent);
      wrapper.style.setProperty('--tile-size', `${tileSize * scaleX}px`);
      
      // Create ripple effects
      for (let i = 1; i <= 3; i++) {
        const ripple = document.createElement('div');
        ripple.className = `hex-ripple ripple-${i}`;
        wrapper.appendChild(ripple);
      }
      
      // Create flash effects for all valid positions
      VALID_POSITIONS.forEach(([q, r]) => {
        const flash = document.createElement('div');
        const ring = getRingNumber(q, r);
        flash.className = `tile-flash ring-${ring}`;
        
        const { x: canvasX, y: canvasY } = hexToPixel(q, r, centerX, centerY, tileSize);
        const wrapperCenterX = wrapper.offsetWidth / 2;
        const wrapperCenterY = wrapper.offsetHeight / 2;
        
        const finalX = wrapperCenterX + (canvasX - centerX) * scaleX;
        const finalY = wrapperCenterY + (canvasY - centerY) * scaleY;
        
        flash.style.left = `${finalX}px`;
        flash.style.top = `${finalY}px`;
        flash.style.transform = 'translate(-50%, -50%)';
        
        const scaledSize = tileSize * scaleX;
        flash.style.width = `${scaledSize * 0.866}px`;
        flash.style.height = `${scaledSize}px`;
        
        wrapper.appendChild(flash);
      });
  
      // Add score popup
      addScorePopup({
        score: points,
        x: centerX,
        y: centerY,
        type: 'clear',
        emoji: '✨',
        text: 'Grid Clear!'
      });
  
      // Play sound effect
      if (soundEnabled) {
        soundManager.playSound('gridClear');
      }
  
      // Clean up effects after animation
      const cleanupTimeout = setTimeout(() => {
        cleanupGridAnimations(wrapper);
        setPlacedTiles([createInitialTile()]);
      }, 1200);
  
      return () => clearTimeout(cleanupTimeout);
    }
  };

  // Update the grid full check effect
  useEffect(() => {
    const checkGridFull = () => {
      if (isGridFull(placedTiles, cols) && !isGameOver && !tutorialState.active) {
        // Calculate grid clear points with all bonuses
        const gridClearPoints = scoreHandler.calculateScore(GRID_CLEAR_POINTS, powerUps, combo);
        
        // Clear tiles first
        setPlacedTiles([createInitialTile()]);
        
        // Then add score and trigger animations
        handleScoreChange(gridClearPoints);
        handleGridClear(gridClearPoints);

        // Update objectives if in daily challenge
        if (isDailyChallenge) {
          updateObjectives(0, combo.count, scoreHandler.getScore());
        }

        // Award experience for grid clear
        awardExperience('clear', EXPERIENCE_VALUES.clear);
      }
    };

    checkGridFull();
  }, [placedTiles, cols, isGameOver, tutorialState.active]);

  // Modify the achievement handling code
  useEffect(() => {
    if (newAchievements.length > 0) {
      handleGameAchievement('achievement', UPGRADE_POINT_REWARDS.achievement.points);
    }
  }, [newAchievements, handleGameAchievement]);

  // Modify the level up handling code
  useEffect(() => {
    const oldLevel = playerProgress.level;
    if (playerProgress.level > oldLevel) {
      handleGameAchievement('level', UPGRADE_POINT_REWARDS.levelUp.points);
    }
  }, [playerProgress.level, handleGameAchievement]);

  // Modify the daily challenge completion code
  useEffect(() => {
    if (isDailyChallenge && showDailyComplete) {
      handleGameAchievement('daily', UPGRADE_POINT_REWARDS.dailyChallenge.points);
    }
  }, [isDailyChallenge, showDailyComplete, handleGameAchievement]);

/*   // 2. Modify the upgrade button to show when upgrades are available
  const canUpgrade = useCallback(() => {
    const { tileUpgrades, gridUpgrades, points } = upgradeState;
    return [...tileUpgrades, ...gridUpgrades].some(upgrade => 
      upgrade.currentLevel < upgrade.maxLevel && points >= upgrade.cost
    );
  }, [upgradeState]); */

  // Update the checkLevelCompletion function
  const checkLevelCompletion = useCallback(() => {
    if (!isLevelMode || isGameOver || !scoreHandler.getScore() || !currentBlock || !currentLevel) return;

    const effectiveTargetScore = targetScore ?? 10000;
    
    if (scoreHandler.getScore() >= effectiveTargetScore && !isLevelComplete) {
      // Unlock the next level in progression system
      const completion = unlockNextLevel(scoreHandler.getScore(), currentBlock, currentLevel);
      
      if (completion) {
        // Calculate bonus points based on how much we exceeded the target
        const bonusPoints = Math.floor((scoreHandler.getScore() - effectiveTargetScore) / 100);
        
        // Show level complete modal with completion data
        setShowLevelComplete({
          ...completion,
          targetScore: effectiveTargetScore,
          bonusPoints: bonusPoints,
          message: 'Level Complete!'
        });
        
        // Only trigger these once when level is completed
        if (!isLevelComplete) {
          handleGameAchievement('level', UPGRADE_POINT_REWARDS.levelUp.points);
          onLevelComplete(true);
        }
      }
    }
  }, [
      isLevelMode,
    isGameOver,
    scoreHandler.getScore(),
    currentBlock,
    currentLevel,
      targetScore,
      isLevelComplete,
    handleGameAchievement,
    onLevelComplete
  ]);

  // Update the level completion effect
  useEffect(() => {
    if (!isLevelComplete) {
      checkLevelCompletion();
    }
  }, [checkLevelCompletion, isLevelComplete]);

  // Add this effect to update theme colors
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-accent', currentTheme.colors.accent);
    document.documentElement.style.setProperty('--theme-secondary', currentTheme.colors.secondary);
    document.documentElement.style.setProperty('--theme-background', currentTheme.colors.background);
  }, [currentTheme]);

  // Add this helper function outside the component
  const getRandomPhrase = (phrases: readonly string[]): string => {
    return phrases[Math.floor(Math.random() * phrases.length)];
  };

  // Inside the Game component, modify the getCompanionPhrase function
  const getCompanionPhrase = useMemo(() => {
    return (action?: {
      type: 'match' | 'combo' | 'clear' | 'ability';
      value?: number;
      abilityName?: string;
    }): string => {
      //console.log('getCompanionPhrase called with action:', action);

      if (!action) {
        //console.log('No action provided, returning empty string');
        return '';
      }

      const { personality } = companion;
      
      switch (action.type) {
        case 'match':
          if (action.value && action.value >= 15) {
            return getRandomPhrase(personality.bigMatch);
          }
          return getRandomPhrase(personality.smallMatch);
        
        case 'combo':
          if (action.value && action.value >= 4) {
            return getRandomPhrase(personality.bigCombo);
          }
          return getRandomPhrase(personality.smallCombo);
        
        case 'clear':
          return getRandomPhrase(personality.bigMatch);
        
        case 'ability':
          if (!action.abilityName) {
            return getRandomPhrase(personality.idle);
          }
          const phrase = getRandomPhrase(personality.abilityUse);
          return phrase.replace('{ability}', action.abilityName);
        
        default:
          return getRandomPhrase(personality.idle);
      }
    };
  }, [companion.personality]); // Only recreate if personality changes

  // Update the speech timing effect to include debouncing
  useEffect(() => {
    //console.log('Speech effect triggered with lastAction:', lastAction);
    
    if (lastAction) {
      //console.log('Starting speech timer for action:', lastAction);
      
      // Clear any existing timers
      const timer = setTimeout(() => {
        //console.log('Speech timer completed, clearing lastAction');
        setLastAction(undefined);
      }, 3000);
      
      return () => {
        //console.log('Cleaning up speech timer');
        clearTimeout(timer);
      };
    }
  }, [lastAction]);

  // In the FrenchBulldog component render, memoize the phrase
  const currentPhrase = useMemo(() => getCompanionPhrase(lastAction), [lastAction, getCompanionPhrase]);

  const soundManager = SoundManager.getInstance();

  const resetGame = () => {
    setPlacedTiles([createInitialTile()]);
    setNextTiles(createTiles(3, upgradeState));
    handleScoreChange(0);
    setTimeLeft(timedMode ? INITIAL_TIME : Infinity);
    setIsGameOver(false);
    setSelectedTileIndex(null);
  };

  // 4. Update the particle effect to prevent unnecessary updates
  useEffect(() => {
    if (particleIntensity !== 0.3) {
      const timer = setTimeout(() => {
        requestAnimationFrame(() => {
          setParticleIntensity(0.3);
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [particleIntensity]);

  // Add the context menu handler
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Modify the handleKeyPress function to include number key handling
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Handle rotation keys
    if (selectedTileIndex !== null) {
      if (event.key.toLowerCase() === 'q') {
        // Counter-clockwise rotation
        soundManager.playSound('tileRotate');
        setNextTiles(prev => {
          const newTiles = [...prev];
          newTiles[selectedTileIndex] = {
            ...newTiles[selectedTileIndex],
            edges: rotateTileEdges(newTiles[selectedTileIndex].edges, true)
          };
          return newTiles;
        });
      } else if (event.key.toLowerCase() === 'e') {
        // Clockwise rotation
        soundManager.playSound('tileRotate');
        setNextTiles(prev => {
          const newTiles = [...prev];
          newTiles[selectedTileIndex] = {
            ...newTiles[selectedTileIndex],
            edges: rotateTileEdges(newTiles[selectedTileIndex].edges)
          };
          return newTiles;
        });
      }
    }

    // Handle tile selection keys (1-3)
    const tileIndex = parseInt(event.key) - 1;
    if (tileIndex >= 0 && tileIndex < nextTiles.length) {
      // Only select if the tile hasn't been placed yet
      if (!nextTiles[tileIndex].isPlaced) {
        soundManager.playSound('buttonClick');
        setSelectedTileIndex(selectedTileIndex === tileIndex ? null : tileIndex);

        // Handle tutorial progression if needed
        if (tutorialState.active) {
          const currentStep = TUTORIAL_STEPS[tutorialState.currentStep];
          if (currentStep.requiresAction === 'select') {
            progressTutorial();
          }
        }
      }
    }
  }, [selectedTileIndex, soundManager, nextTiles, tutorialState, progressTutorial]);

  // Add this effect to handle keyboard events
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  // Keep the moveTile function simple but update mouse position
  const moveTile = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!currentGridPosition) {
      // Start from center if no position selected
      setCurrentGridPosition({ q: 0, r: 0 });
      const { x, y } = hexToPixel(0, 0, centerX, centerY, tileSize);
      setMousePosition({ x, y });
      return;
    }

    let { q, r } = currentGridPosition;

    switch (direction) {
      case 'up':
        r--;
        break;
      case 'down':
        r++;
        break;
      case 'left':
        q--;
        break;
      case 'right':
        q++;
        break;
    }

    // Calculate s-coordinate for cubic coordinates
    const s = -q - r;

    // Check if new position is within hex grid bounds
    const maxDistance = Math.floor(cols/2);
    if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= maxDistance) {
      setCurrentGridPosition({ q, r });
      const { x, y } = hexToPixel(q, r, centerX, centerY, tileSize);
      setMousePosition({ x, y });
    }
  }, [currentGridPosition, centerX, centerY, tileSize, cols]);

  // Reset grid position when selecting a new tile
  useEffect(() => {
    if (selectedTileIndex !== null) {
      setCurrentGridPosition({ q: 0, r: 0 });
      const { x, y } = hexToPixel(0, 0, centerX, centerY, tileSize);
      setMousePosition({ x, y });
    }
  }, [selectedTileIndex, centerX, centerY, tileSize]);

  // Modify the handleKeyDown function
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isGameOver) return;

      // Load current key bindings
      const currentBindings = loadKeyBindings();

      switch (event.key.toLowerCase()) {
        case currentBindings.moveUp:
          event.preventDefault();
          moveTile('up');
          break;
        case currentBindings.moveDown:
          event.preventDefault();
          moveTile('down');
          break;
        case currentBindings.moveLeft:
          event.preventDefault();
          moveTile('left');
          break;
        case currentBindings.moveRight:
          event.preventDefault();
          moveTile('right');
          break;
        case currentBindings.placeTile:
          event.preventDefault();
          if (selectedTileIndex !== null) {
            handleKeyboardPlacement({
              currentGridPosition,
              selectedTileIndex,
              placedTiles,
              nextTiles,
              cols,
              soundEnabled,
              powerUps,
              combo,
              upgradeState,
              centerX,
              centerY,
              boardRotation: rotationState.boardRotation,
              settings,
              onTilesUpdate: (updatedTiles) => {
                setPlacedTiles(updatedTiles);
              },
              onPlacement: (newTile) => {
                // Generate new tile for the used slot
                const newTiles = [...nextTiles];
                newTiles[selectedTileIndex] = createTileWithRandomEdges(0, 0);
                setNextTiles(newTiles);
                setSelectedTileIndex(null);

                // Only add animation, don't call handleTilePlacement
                addTileAnimation(newTile.q, newTile.r, 'match');
              },
              onScoreUpdate: (newScore) => {
                handleScoreChange(newScore);
              },
              onComboUpdate: (newComboState) => {
                setCombo(newComboState);
              },
              addScorePopup: (popupData) => {
                addScorePopup(popupData);
              }
            });
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isGameOver,
    moveTile,
    currentGridPosition,
    selectedTileIndex,
    placedTiles,
    nextTiles,
    cols,
    settings,
    soundEnabled,
    powerUps,
    combo,
    upgradeState,
    centerX,
    centerY,
    handleScoreChange,
    scoreHandler,
    addScorePopup,
    rotationState.boardRotation
  ]);

  // Add a helper function to handle tile placement effects
  const handleTilePlacement = (newTile: PlacedTile, currentTiles: PlacedTile[]) => {
    // Use centralized matching logic
    const { matchCount } = handleTileMatches(
      newTile,
      currentTiles,
      upgradeState,
      powerUps,
      combo
    );

    if (matchCount > 0) {
      const basePoints = matchCount * SCORING_CONFIG.baseMatch;
      const now = Date.now();
      const timeSinceLastPlacement = now - combo.lastPlacementTime;
      const quickPlacement = timeSinceLastPlacement < 2000;

      const newComboState = {
        count: quickPlacement ? combo.count + 1 : 1,
        timer: 3,
        multiplier: calculateDynamicMultiplier(
          SCORING_CONFIG.combo.baseMultiplier,
          SCORING_CONFIG.combo.levelScaling,
          SCORING_CONFIG.combo.maxMultiplier,
          playerProgress.level,
          quickPlacement ? combo.count + 1 : 1
        ),
        lastPlacementTime: now
      };
      setCombo(newComboState);

      // Calculate all score components in one place
      const comboBonus = Math.round(basePoints * (newComboState.multiplier - 1));
      const quickBonus = quickPlacement ? Math.round(basePoints * 0.5) : 0;
      const matchBonus = matchCount >= UPGRADE_POINT_REWARDS.match.threshold ? 
        UPGRADE_POINT_REWARDS.match.base + 
        Math.floor((matchCount - UPGRADE_POINT_REWARDS.match.threshold) * UPGRADE_POINT_REWARDS.match.bonus) : 0;

      // Single score update
      const totalPoints = basePoints + comboBonus + quickBonus + matchBonus;
      handleScoreChange(totalPoints);

      // Add match animation
      addTileAnimation(newTile.q, newTile.r, 'match');

      // Play match sound
      if (soundEnabled) {
        soundManager.playSound('match');
      }

      // Add popups for each score component
      addScorePopup({
        score: basePoints,
        x: centerX,
        y: centerY - 100,
        emoji: getFeedbackForScore(basePoints).emoji,
        text: matchCount === 1 ? 'Edge Match!' : 'Multiple Matches!',
        type: 'score'
      });

      if (comboBonus > 0) {
        addScorePopup({
          score: comboBonus,
          x: centerX,
          y: centerY + 50,
          emoji: '🔥',
          text: 'Combo!',
          type: 'combo'
        });
      }

      if (quickBonus > 0) {
        addScorePopup({
          score: quickBonus,
          x: centerX,
          y: centerY + 25,
          emoji: '⚡',
          text: 'Quick!',
          type: 'quick'
        });
      }
    }
  }

  // Add state for daily challenge objectives
  const [dailyObjectives, setDailyObjectives] = useState<DailyObjective[]>(() => {
    if (isDailyChallenge) {
      return getDailyChallenge().objectives;
    }
    return [];
  });

  // Update objectives when score changes
  useEffect(() => {
    if (isDailyChallenge) {
      const updatedObjectives = dailyObjectives.map(obj => {
        if (obj.type === 'score') {
          return { ...obj, current: scoreHandler.getScore() };
        }
        // Add other objective updates as needed
        return obj;
      });
      setDailyObjectives(updatedObjectives);
      updateDailyChallengeProgress(updatedObjectives, scoreHandler.getScore());
    }
  }, [scoreHandler.getScore(), isDailyChallenge]);

  // Add these sharing functions inside the Game component
  const getShareMessage = () => {
    if (!showLevelComplete) {
      return '🎮 Just played Hex Puzzle!\n🔥 Can you beat my score?';
    }
    
    return `🎮 Just completed Level ${showLevelComplete.level} in Hex Puzzle!\n` +
      `🎯 Score: ${showLevelComplete.score.toLocaleString()}\n` +
      `✨ Target: ${showLevelComplete.targetScore.toLocaleString()}\n` +
      `${showLevelComplete.bonusPoints > 0 ? `🌟 Bonus: +${showLevelComplete.bonusPoints}\n` : ''}` +
      `🔥 Can you beat my score?`;
  };

  const handleShare = (platform: 'whatsapp' | 'x' | 'facebook') => {  // Change 'twitter' to 'x'
    const message = encodeURIComponent(getShareMessage());
    const url = encodeURIComponent(window.location.href);

    const shareUrls = {
      whatsapp: `https://wa.me/?text=${message}`,
      x: `https://x.com/intent/tweet?text=${message}&url=${url}`,  // Update URL
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${message}`
    };

    window.open(shareUrls[platform], '_blank', 'noopener,noreferrer');
  };

  // Add cleanup effect with correct types
  useLayoutEffect(() => {
    // Cleanup function that runs when component unmounts or when game exits
    return () => {
      // Clear all timeouts and intervals using window
      const timeoutId = window.setTimeout(() => {}, 0);
      for (let i = timeoutId; i >= 0; i--) {
        window.clearTimeout(i);
      }

      // Clear all animation frames using window
      const animationFrameId = window.requestAnimationFrame(() => {});
      for (let i = animationFrameId; i >= 0; i--) {
        window.cancelAnimationFrame(i);
      }

      // Clean up grid animations
      const wrapper = wrapperRef.current;
      if (wrapper) {
        cleanupGridAnimations(wrapper);
      }

      // Stop all sounds
      soundManager.stopBackgroundMusic();
    };
  }, []); // Empty dependency array means this runs once on mount and cleanup on unmount

  // Add game over cleanup effect
  useEffect(() => {
    if (isGameOver) {
      // Clear animations and effects
      setAnimatingTiles([]);
      setParticleIntensity(0.5);
      setBackgroundGlow('');
      
      // Clean up grid animations
      if (wrapperRef.current) {
        cleanupGridAnimations(wrapperRef.current);
      }
    }
  }, [isGameOver]);

  useEffect(() => {
    const handleThemeChange = () => {
      const playerProgress = getPlayerProgress();
      setCurrentTheme(getTheme(playerProgress.selectedTheme || 'default'));
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  // Add a rotate button for mobile devices
  const handleRotateButtonClick = () => {
    if (!rotationEnabled) return;
    
    // Rotate the selected tile clockwise (same as pressing 'E')
    if (selectedTileIndex !== null) {
      // Update the tile by rotating its edges
      setNextTiles(prev => 
        prev.map((tile, idx) => 
          idx === selectedTileIndex 
            ? { ...tile, edges: [...tile.edges.slice(-1), ...tile.edges.slice(0, -1)] } 
            : tile
        )
      );
      
      if (soundEnabled) {
        soundManager.playSound('tileRotate');
      }
    }
  };

  return (
    <div 
      className={`game ${tutorial ? 'tutorial-mode' : ''}`}
      ref={wrapperRef}
      onContextMenu={handleContextMenu}
      style={{
        '--theme-accent': currentTheme.colors.accent,
        '--theme-secondary': currentTheme.colors.secondary,
      } as React.CSSProperties}
    >
      <CustomCursor 
        color={currentTheme.colors.primary}
        hide={selectedTileIndex !== null}
      />
      <div className="particles-container">
        <Particles 
          intensity={particleIntensity}
          color={particleColor}
          width={window.innerWidth}
          height={window.innerHeight}
        />
      </div>
      <div className="game-header">
        <LevelProgress 
          level={playerProgress.level}
          experience={playerProgress.experience}
          nextLevelXP={playerProgress.experienceToNext}
        />
      </div>
      {tutorialState.active ? (
        <div className="tutorial-buttons">
          <button 
            className="skip-tutorial-button"
            onClick={onSkipTutorial}
          >
            Skip Tutorial
          </button>
        </div>
      ) : (
        <button 
          className="exit-button"
          onClick={handleExit}
        >
          Exit Game
        </button>
      )}
      <div className="game-hud">
        <div 
          className="score" 
          data-label=""
        >
          <span className="score-value">
            {formatScore(scoreHandler.getScore())}
          </span>
        </div>
        <div className="timer-container">
          {timedMode && !isLevelMode && (
            <div className={`timer ${
              timeLeft > INITIAL_TIME * 0.5 ? 'safe' : 
              timeLeft > INITIAL_TIME * 0.25 ? 'warning' : 
              'danger'
            }`}>
              Time: {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </div>
      {showCompanion && (
        <FrenchBulldog
          onClick={() => {
            //console.log('Companion clicked');
          }}
          phrase={currentPhrase}
          hideSpeech={!lastAction}
          abilities={companion.abilities}
          customConfig={bulldogConfig}
          onConfigChange={(newConfig) => {
            console.log('Companion config changed:', newConfig);
          }}
        />
      )}
      <div className="board-container">
        <div className="game-board">
          <div ref={wrapperRef} className="canvas-wrapper">
            <canvas 
              ref={canvasRef} 
              className={[
                rotationState.showWarning && 'rotation-warning',
                animatingTiles.length > 0 && 'has-animations'
              ].filter(Boolean).join(' ')}
            />
          </div>
          {/* Power-up indicators */}
          <div className="power-up-indicator">
            {powerUps.freeze.active && (
              <div className="power-up-timer active" data-type="freeze">
                <span className="power-up-icon">❄️</span>
                <span className="power-up-text">Time Freeze:</span>
                <span className="timer-value">{powerUps.freeze.remainingTime}s</span>
              </div>
            )}
            {powerUps.multiplier.active && (
              <div className="power-up-timer active" data-type="multiplier">
                <span className="power-up-icon">✨</span>
                <span className="power-up-text">Score x{powerUps.multiplier.value}:</span>
                <span className="timer-value">{powerUps.multiplier.remainingTime}s</span>
              </div>
            )}
          </div>
          {rotationState.showRotationText && (
            <div className="rotation-text">
              <span className="rotation-text-full">Rotation Incoming!</span>
              <span className="rotation-text-short">Rotating!</span>
            </div>
          )}
        </div>
        
        {/* Other elements */}
        <div className="next-tiles-container">
          {/* Add the rotate button for mobile devices */}
          {rotationEnabled && (
            <div className="rotate-button" onClick={handleRotateButtonClick}>
              <span style={{ position: 'relative', zIndex: 51 }}>↻</span>
            </div>
          )}
          <div className="next-tiles">
            {nextTiles.map((tile, index) => (
              <div 
                key={index}  // Just use index as key since PlacedTile doesn't have id
                className={`next-tile ${selectedTileIndex === index ? 'selected' : ''}`}
                onClick={() => setSelectedTileIndex(selectedTileIndex === index ? null : index)}
              >
                <canvas
                  width={100}
                  height={100}
                  ref={el => {
                    if (el) {
                      const ctx = el.getContext('2d');
                      if (ctx) {
                        ctx.clearRect(0, 0, 100, 100);
                        
                        // Draw tile background
                        ctx.fillStyle = 'var(--background-dark)';
                        ctx.beginPath();
                        ctx.arc(50, 50, 40, 0, Math.PI * 2);
                        ctx.fill();

                        // Draw tile edges
                        tile.edges.forEach((edge, i) => {
                          const angle = (i * Math.PI) / 3;
                          const startX = 50 + 35 * Math.cos(angle);
                          const startY = 50 + 35 * Math.sin(angle);
                          const endX = 50 + 35 * Math.cos(angle + Math.PI / 3);
                          const endY = 50 + 35 * Math.sin(angle + Math.PI / 3);

                          ctx.beginPath();
                          ctx.moveTo(startX, startY);
                          ctx.lineTo(endX, endY);
                          ctx.strokeStyle = edge.color;
                          ctx.lineWidth = selectedTileIndex === index ? 5 : 3;
                          ctx.stroke();
                        });

                        // Draw selection indicator
                        if (selectedTileIndex === index) {
                          ctx.strokeStyle = 'var(--hex-color)';
                          ctx.lineWidth = 3;
                          ctx.setLineDash([5, 5]);
                          ctx.beginPath();
                          ctx.arc(50, 50, 45, 0, Math.PI * 2);
                          ctx.stroke();
                          ctx.setLineDash([]);
                        }

                        // Draw tile value if it exists (for normal tiles only)
                        if (tile.value > 0 && !tile.isJoker && tile.type !== 'mirror' && !tile.powerUp) {
                          ctx.strokeStyle = '#000000';
                          ctx.lineWidth = 3;
                          ctx.shadowColor = '#000000';
                          ctx.shadowBlur = 4;
                          ctx.font = 'bold 24px Arial';
                          ctx.textAlign = 'center';
                          ctx.textBaseline = 'middle';
                          
                          // Draw text stroke first (outline)
                          ctx.strokeText(tile.value.toString(), 50, 50);
                          
                          // Then draw the bright text
                          ctx.fillStyle = '#FFFFFF';
                          ctx.shadowColor = '#00FFFF';
                          ctx.shadowBlur = 8;
                          ctx.fillText(tile.value.toString(), 50, 50);
                          
                          // Reset shadow
                          ctx.shadowBlur = 0;
                        }

                        // Handle joker tiles
                        if (tile.isJoker) {
                          // Draw star symbol above the number
                          ctx.fillStyle = '#FFFFFF';
                          ctx.shadowColor = '#FFFFFF';
                          ctx.shadowBlur = 15;
                          ctx.font = 'bold 20px Arial';
                          ctx.textAlign = 'center';
                          ctx.textBaseline = 'middle';
                          ctx.fillText('★', 50, 38);

                          // Draw number below the star
                          ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
                          ctx.shadowBlur = 2;
                          ctx.fillStyle = selectedTileIndex === index ? '#1a1a1a' : '#2d2d2d';
                          ctx.font = `bold ${selectedTileIndex === index ? 24 : 22}px Arial`;
                          ctx.textAlign = 'center';
                          ctx.textBaseline = 'middle';
                          ctx.fillText(tile.value.toString(), 50, 62);

                          // Add rainbow border effect for joker tiles
                          const gradient = ctx.createLinearGradient(10, 10, 90, 90);
                          gradient.addColorStop(0, '#ff0000');
                          gradient.addColorStop(0.2, '#ffff00');
                          gradient.addColorStop(0.4, '#00ff00');
                          gradient.addColorStop(0.6, '#00ffff');
                          gradient.addColorStop(0.8, '#0000ff');
                          gradient.addColorStop(1, '#ff00ff');
                          
                          ctx.strokeStyle = gradient;
                          ctx.lineWidth = 4;
                          ctx.beginPath();
                          ctx.arc(50, 50, 42, 0, Math.PI * 2);
                          ctx.stroke();
                        }

                        // Handle mirror tiles
                        else if (tile.type === 'mirror') {
                          // Draw mirror symbol above the number
                          ctx.fillStyle = '#FFFFFF';
                          ctx.shadowColor = '#FFFFFF';
                          ctx.shadowBlur = 15;
                          ctx.font = 'bold 20px Arial';
                          ctx.textAlign = 'center';
                          ctx.textBaseline = 'middle';
                          ctx.fillText('⇄', 50, 38);

                          // Draw number below the symbol
                          ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
                          ctx.shadowBlur = 2;
                          ctx.fillStyle = selectedTileIndex === index ? '#1a1a1a' : '#2d2d2d';
                          ctx.font = `bold ${selectedTileIndex === index ? 24 : 22}px Arial`;
                          ctx.textAlign = 'center';
                          ctx.textBaseline = 'middle';
                          ctx.fillText(tile.value.toString(), 50, 62);
                        }

                        // Handle power-up tiles
                        else if (tile.powerUp) {
                          const powerUpIcons = {
                            freeze: '❄️',
                            colorShift: '🎨',
                            multiplier: '✨'
                          };

                          // Draw power-up icon above the number
                          ctx.fillStyle = '#FFFFFF';
                          ctx.shadowColor = '#FFFFFF';
                          ctx.shadowBlur = 15;
                          ctx.font = 'bold 20px Arial';
                          ctx.textAlign = 'center';
                          ctx.textBaseline = 'middle';
                          ctx.fillText(powerUpIcons[tile.powerUp.type], 50, 38);

                          // Draw number below the icon
                          ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
                          ctx.shadowBlur = 2;
                          ctx.fillStyle = selectedTileIndex === index ? '#1a1a1a' : '#2d2d2d';
                          ctx.font = `bold ${selectedTileIndex === index ? 24 : 22}px Arial`;
                          ctx.textAlign = 'center';
                          ctx.textBaseline = 'middle';
                          ctx.fillText(tile.value.toString(), 50, 62);
                        }
                      }
                    }
                  }}
                />
              </div>
            ))}
          </div>
          <button 
            className="undo-button"
            onClick={handleUndo}
            disabled={!previousState}
          >
            Undo
          </button>
        </div>
      </div>

      {scorePopups.map(popup => (
        <ScorePopup key={popup.id} popup={popup} />
      ))}
      {newAchievements.length > 0 && (
        <AchievementPopup
          achievement={newAchievements[0]}
          onComplete={() => setNewAchievements(prev => prev.slice(1))}
        />
      )}
      {tutorialState.active && (
        <TutorialMessage 
          step={TUTORIAL_STEPS[tutorialState.currentStep]}
          canProgress={!TUTORIAL_STEPS[tutorialState.currentStep].requiresAction || 
            (TUTORIAL_STEPS[tutorialState.currentStep].requiresAction === 'select' && selectedTileIndex !== null) ||
            (TUTORIAL_STEPS[tutorialState.currentStep].requiresAction === 'rotate' && tutorialState.rotationCount >= 3) ||
            (TUTORIAL_STEPS[tutorialState.currentStep].requiresAction === 'place' && tutorialState.hasPlaced)
          }
          onNext={progressTutorial}
        />
      )}
      {showLevelRoadmap && (
        <div className="roadmap-overlay">
          <LevelRoadmap 
            currentPoints={scoreHandler.getScore()} 
            onStartGame={(withTimer) => {
              setShowLevelRoadmap(false);
              onGameOver();
              onExit();
              onStartGame(withTimer);
            }}
          />
          <button className="close-roadmap" onClick={() => setShowLevelRoadmap(false)}>
            Close
          </button>
        </div>
      )}
      {newBadges.length > 0 && (
        <BadgePopup
          badge={newBadges[0]}
          onComplete={() => setNewBadges(prev => prev.slice(1))}
        />
      )}
      <UpgradeModal
        isOpen={showUpgrades}
        onClose={() => setShowUpgrades(false)}
        tileUpgrades={upgradeState.tileUpgrades}
        gridUpgrades={upgradeState.gridUpgrades}
        points={upgradeState.points}
        onUpgrade={handleUpgrade}
      />
      {showLevelComplete && (
        <div className="level-complete__overlay">
          <div className="level-complete__modal">
            <h2 className="level-complete__title">{showLevelComplete.message || 'Level Complete!'}</h2>
            <div className="level-complete__stats">
              <div className="level-complete__stat-item">
                <span className="level-complete__stat-label">Current Level</span>
                <span className="level-complete__stat-value">{showLevelComplete.level}</span>
              </div>
              <div className="level-complete__stat-item">
                <span className="level-complete__stat-label">Your Score</span>
                <span className="level-complete__stat-value">{showLevelComplete.score.toLocaleString()}</span>
              </div>
              <div className="level-complete__stat-item">
                <span className="level-complete__stat-label">Target Score</span>
                <span className="level-complete__stat-value">{showLevelComplete.targetScore.toLocaleString()}</span>
              </div>
              {showLevelComplete.bonusPoints > 0 && (
                <div className="level-complete__stat-item bonus">
                  <span className="level-complete__stat-label">Bonus Points</span>
                  <span className="level-complete__stat-value">+{showLevelComplete.bonusPoints}</span>
                </div>
              )}
            </div>
            <div className="level-complete__share">
              <div className="level-complete__share-text">
                Share your achievement!
              </div>
              <div className="level-complete__share-buttons">
                <button 
                  className="share-button whatsapp"
                  onClick={() => handleShare('whatsapp')}
                >
                  📱 WhatsApp
                </button>
                <button 
                  className="share-button x"
                  onClick={() => handleShare('x')}
                >
                  🐦 X
                </button>
                <button 
                  className="share-button facebook"
                  onClick={() => handleShare('facebook')}
                >
                  👥 Facebook
                </button>
              </div>
            </div>
            <div className="level-complete__buttons">
              <button 
                className="level-complete__button"
                onClick={handleLevelCompleteExit}
              >
                BACK TO MENU
              </button>
              {showLevelComplete.isNextLevelUnlock && (
                <button 
                  className="level-complete__button level-complete__button--primary"
                  onClick={handleLevelCompleteNext}
                >
                  PLAY NEXT LEVEL
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {showExitPrompt && (
        <SpringModal
          isOpen={showExitPrompt}
          onClose={() => setShowExitPrompt(false)}
          title="Exit Game?"
          message="Are you sure you want to exit? Your progress will be lost."
          variant="danger"
        >
          <button 
            className="modal-button cancel"
            onClick={() => setShowExitPrompt(false)}
          >
            CONTINUE PLAYING
          </button>
          <button 
            className="modal-button confirm danger"
            onClick={confirmExit}
          >
            EXIT GAME
          </button>
        </SpringModal>
      )}

      {/* Add DailyChallengeHUD */}
      {isDailyChallenge && (
        <DailyChallengeHUD objectives={dailyObjectives} />
      )}
      <FPSCounter />
    </div>
  )
}

export default Game 