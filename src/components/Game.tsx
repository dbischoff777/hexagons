import { useEffect, useRef, useState, useCallback } from 'react'
import { PowerUpState, ComboState, GameState, PlacedTile } from '../types/index'
import { createTileWithRandomEdges, hexToPixel, getAdjacentTiles, getAdjacentPositions, getAdjacentDirection, COLORS, updateMirrorTileEdges } from '../utils/hexUtils'
import { INITIAL_TIME, hasMatchingEdges, formatTime, updateTileValues, isGridFull } from '../utils/gameUtils'
import SoundManager from '../utils/soundManager'
import './Game.css'
import { useAccessibility } from '../contexts/AccessibilityContext'
import { drawAccessibilityOverlay, findPotentialMatches } from '../utils/accessibilityUtils'
import { TutorialState } from '../types/tutorial'
import { TUTORIAL_STEPS } from '../constants/tutorialSteps'
import { TutorialMessage } from './TutorialMessage'
import { saveGameState, loadGameState, updateStatistics, clearSavedGame, getStatistics } from '../utils/gameStateUtils'
import Particles from './Particles'
import { Achievement } from '../types/achievements'
import { updateTilesPlaced, updateScore, updateCombo, updateAchievements, updateGridClears } from '../utils/achievementUtils'
import AchievementPopup from './AchievementPopup'
import ConfirmModal from './ConfirmModal'
import { DailyChallenge } from '../types/dailyChallenge'
import { getDailyChallenge, updateDailyChallengeProgress, isDailyChallengeCompleted } from '../utils/dailyChallengeUtils'
import DailyChallengeHUD from './DailyChallengeHUD'
import DailyChallengeComplete from './DailyChallengeComplete'
import { 
  addExperience, 
  EXPERIENCE_VALUES, 
  getCurrentLevelInfo, 
  getPlayerProgress, 
  getTheme,
  LEVEL_BLOCKS,
  PROGRESSION_KEY,
} from '../utils/progressionUtils'
import LevelProgress from './LevelProgress'
import LevelRoadmap from './LevelRoadmap'
import BadgePopup from './BadgePopup'
import { Badge } from '../types/progression'
import { Companion } from '../types/companion'
import CompanionHUD from './CompanionHUD'
import { COMPANIONS } from '../types/companion'
import type { CompanionId } from '../types/companion'
import UpgradeModal from './UpgradeModal'
import { getInitialUpgradeState, purchaseUpgrade, getUpgradeEffect, saveUpgradeState } from '../utils/upgradeUtils'
import { UpgradeState } from '../types/upgrades'

interface GameProps {
  musicEnabled: boolean
  soundEnabled: boolean
  timedMode: boolean
  onGameOver: () => void
  tutorial?: boolean
  onSkipTutorial?: () => void
  onExit: () => void
  onStartGame: (withTimer: boolean, targetScore?: number) => void
  savedGameState?: GameState | null
  isDailyChallenge?: boolean
  isLevelMode?: boolean
  targetScore?: number
}

const rotateTileEdges = (edges: { color: string }[]) => {
  return [...edges.slice(-1), ...edges.slice(0, -1)]
}

// Add this near the top of the file, outside the component
const SCORE_FEEDBACK = {
  // Regular matches
  LOW: [
    { emoji: '✨💫', text: 'Nice!' },
    { emoji: '💎✨', text: 'Good!' },
    { emoji: '👍💫', text: 'Cool!' },
  ],
  MEDIUM: [
    { emoji: '🌟💫', text: 'Great!' },
    { emoji: '💫⭐', text: 'Awesome!' },
    { emoji: '⭐✨', text: 'Sweet!' },
  ],
  HIGH: [
    { emoji: '🔥⚡', text: 'Amazing!' },
    { emoji: '⚡💥', text: 'Fantastic!' },
    { emoji: '💥🔥', text: 'Incredible!' },
  ],
  EPIC: [
    { emoji: '🌈✨', text: 'EPIC!' },
    { emoji: '👑💫', text: 'LEGENDARY!' },
    { emoji: '💎✨', text: 'BRILLIANT!' },
  ],
  
  // Combos
  COMBO: [
    { emoji: '👍💫', text: '2x COMBO!' },
    { emoji: '🔥💫', text: '3x COMBO!' },
    { emoji: '⚡💫', text: '4x COMBO!' },
    { emoji: '💫✨', text: '5x COMBO!' },
    { emoji: '🌟💫', text: '6x COMBO!' },
    { emoji: '💥⚡', text: '7x COMBO!' },
    { emoji: '👑✨', text: '8x COMBO!' },
    { emoji: '🌈💫', text: 'MEGA COMBO!' },
  ],
  
  // Grid clears
  CLEAR: [
    { emoji: '🎪✨', text: 'CLEAR!' },         // Default clear
    { emoji: '🎮💫', text: 'GOOD CLEAR!' },    // 25+ points
    { emoji: '🎯⚡', text: 'GREAT CLEAR!' },   // 50+ points
    { emoji: '🏆💫', text: 'AMAZING CLEAR!' }, // 75+ points
    { emoji: '👑✨', text: 'EPIC CLEAR!' },    // 100+ points
  ] as const,
  
  // Quick placements
  QUICK: [
    { emoji: '⚡💨', text: 'QUICK!' },
    { emoji: '💨✨', text: 'SWIFT!' },
    { emoji: '🚀💫', text: 'SPEEDY!' },
  ]
}

const getRandomFeedback = (category: keyof typeof SCORE_FEEDBACK) => {
  const options = SCORE_FEEDBACK[category]
  return options[Math.floor(Math.random() * options.length)]
}

const getFeedbackForScore = (score: number) => {
  if (score >= 100) return getRandomFeedback('EPIC')
  if (score >= 75) return getRandomFeedback('HIGH')
  if (score >= 50) return getRandomFeedback('MEDIUM')
  return getRandomFeedback('LOW')
}

const getFeedbackForCombo = (comboCount: number) => {
  const index = Math.min(comboCount - 2, SCORE_FEEDBACK.COMBO.length - 1);
  return SCORE_FEEDBACK.COMBO[index] || { emoji: '🔥', text: 'Combo!' };
};

const getFeedbackForClear = (clearScore: number) => {
  if (clearScore >= 100) return SCORE_FEEDBACK.CLEAR[4];
  if (clearScore >= 75 && SCORE_FEEDBACK.CLEAR[3]) return SCORE_FEEDBACK.CLEAR[3];
  if (clearScore >= 50) return SCORE_FEEDBACK.CLEAR[2];
  if (clearScore >= 25) return SCORE_FEEDBACK.CLEAR[1];
  return SCORE_FEEDBACK.CLEAR[0];
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

// Add this helper function at the top level
const getNextLevelInfo = (currentBlock: number, currentLevel: number, blocks: typeof LEVEL_BLOCKS) => {
  // Find current block
  const block = blocks.find(b => b.blockNumber === currentBlock);
  if (!block) return null;

  // If there are more levels in current block
  if (currentLevel < block.levels.length) {
    return {
      block: currentBlock,
      level: currentLevel + 1,
      pointsRequired: block.levels[currentLevel].pointsRequired
    };
  }

  // If we need to move to next block
  const nextBlock = blocks.find(b => b.blockNumber === currentBlock + 1);
  if (nextBlock && nextBlock.levels.length > 0) {
    return {
      block: nextBlock.blockNumber,
      level: 1,
      pointsRequired: nextBlock.levels[0].pointsRequired
    };
  }

  return null;
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
  isDailyChallenge,
  isLevelMode = false,
  targetScore
}: GameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cols = 7
  const [upgradeState, setUpgradeState] = useState<UpgradeState>(getInitialUpgradeState());
  
  // Move createNewTile here, before any state that depends on it
  const createNewTile = useCallback((): PlacedTile => {
    const powerUpChance = getUpgradeEffect(upgradeState, 'powerUpChance');
    const mirrorChance = getUpgradeEffect(upgradeState, 'mirrorTileChance');
    
    if (Math.random() < mirrorChance) {
      return {
        ...createTileWithRandomEdges(0, 0),
        isPlaced: false,
        type: 'mirror' as const
      };
    }
    
    if (Math.random() < powerUpChance) {
      const powerUpTypes = ['freeze', 'colorShift', 'multiplier'] as const;
      const randomPowerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
      
      return {
        ...createTileWithRandomEdges(0, 0),
        isPlaced: false,
        type: 'normal' as const,
        powerUp: {
          type: randomPowerUp,
          duration: randomPowerUp === 'freeze' ? 5 : 15,
          multiplier: randomPowerUp === 'multiplier' ? 2 : undefined,
          active: false
        }
      };
    }
    
    return {
      ...createTileWithRandomEdges(0, 0),
      isPlaced: false,
      type: 'normal' as const
    };
  }, [upgradeState]);

  // Now initialize states that depend on createNewTile
  const [placedTiles, setPlacedTiles] = useState<PlacedTile[]>(
    savedGameState?.placedTiles ?? [{
      ...createTileWithRandomEdges(0, 0),
      isPlaced: true
    }]
  )
  
  const [nextTiles, setNextTiles] = useState<PlacedTile[]>(() => 
    savedGameState?.nextTiles ?? [
      createNewTile(),
      createNewTile(),
      createNewTile()
    ]
  );

  const [score, setScore] = useState<number>(savedGameState?.score ?? 0)
  const [timeLeft, setTimeLeft] = useState<number>(
    savedGameState?.timeLeft ?? (timedMode ? INITIAL_TIME : Infinity)
  )
  const [isGameOver, setIsGameOver] = useState<boolean>(false)
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | null>(null)
  const [scorePopups, setScorePopups] = useState<{
    score: number;
    x: number;
    y: number;
    id: number;
    emoji: string;
    text: string;
    type: 'score' | 'combo' | 'quick' | 'clear';
  }[]>([])
  const [boardRotation, setBoardRotation] = useState<number>(savedGameState?.boardRotation ?? 0)
  const [showWarning, setShowWarning] = useState(false)
  const [showRotationText, setShowRotationText] = useState(false)
  const soundManager = SoundManager.getInstance()
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
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null)
  const [showDailyComplete, setShowDailyComplete] = useState(false)
  const [playerProgress, setPlayerProgress] = useState(getPlayerProgress())
  const theme = getTheme(playerProgress.selectedTheme || 'default')
  const [showLevelRoadmap, setShowLevelRoadmap] = useState(false)
  const [newBadges, setNewBadges] = useState<Badge[]>([])
  const [confirmMessage, setConfirmMessage] = useState<string>("")
  const [particleIntensity, setParticleIntensity] = useState(0.3)
  const [particleColor, setParticleColor] = useState(theme.colors.primary)
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
  const [previousScore, setPreviousScore] = useState(0);
  const [lastAction, setLastAction] = useState<{
    type: 'match' | 'combo' | 'clear' | 'ability';
    value?: number;
    abilityName?: string;
  } | undefined>();
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState<{
    show: boolean;
    level: string;
    score: number;
    targetScore: number;
    nextLevel: string;
    bonusPoints: number;
    isNextLevelUnlock?: boolean;
  } | null>(null);

  // Add this effect to update previousScore when score changes
  useEffect(() => {
    setPreviousScore(score);
  }, [score]);

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

  // Update rotation timer effect
  useEffect(() => {
    if (!isGameOver) {
      const warningTimer = setInterval(() => {
        setShowWarning(true)
        setShowRotationText(true)
        setTimeout(() => {
          setShowWarning(false)
          setShowRotationText(false)
          
          // Start a smooth rotation animation
          let startTime: number | null = null
          const duration = 2000 // 2 seconds duration
          const startRotation = boardRotation
          const targetRotation = startRotation + 180
          
          const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            
            // Smooth easing function
            const easeProgress = progress < 0.5
              ? 2 * progress * progress // Ease in
              : -1 + (4 - 2 * progress) * progress // Ease out
            
            const currentRotation = startRotation + (targetRotation - startRotation) * easeProgress
            
            setBoardRotation(currentRotation % 360)
            
            if (progress < 1) {
              requestAnimationFrame(animate)
            } else {
              // Update tile positions after animation completes
              setPlacedTiles(tiles => tiles.map(tile => ({
                ...tile,
                edges: rotateTileEdges(tile.edges)
              })))
            }
          }
          
          requestAnimationFrame(animate)
        }, 1500)
      }, 30000) // Increased to 30 seconds
      
      return () => clearInterval(warningTimer)
    }
  }, [isGameOver, boardRotation])

  // Remove the grid-full rotation effect since rotation should only happen on timer
  useEffect(() => {
    if (isGridFull(placedTiles, cols) && !isGameOver && !tutorialState.active) {
      // Only show warning, don't rotate
      setShowWarning(true)
      setTimeout(() => {
        setShowWarning(false)
      }, 2000)
    }
  }, [placedTiles, cols, isGameOver, tutorialState.active])

  // Main game effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 1000
    canvas.height = 800

    const drawHexagonWithColoredEdges = (
      x: number, 
      y: number, 
      size: number, 
      tile?: PlacedTile, 
      isMatched: boolean = false, 
      isSelected: boolean = false
    ) => {
      const points: [number, number][] = []
      
      // Calculate all points first
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3
        const xPos = x + size * Math.cos(angle)
        const yPos = y + size * Math.sin(angle)
        points.push([xPos, yPos])
      }

      // Draw valid placement highlight
      if (selectedTileIndex !== null) {
        ctx.beginPath()
        points.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point[0], point[1])
          else ctx.lineTo(point[0], point[1])
        })
        ctx.closePath()
        
        // Create pulsing glow effect
        const pulseIntensity = Math.sin(Date.now() / 200) * 0.2 + 0.4 // Values between 0.2 and 0.6
        ctx.fillStyle = `rgba(0, 255, 159, ${pulseIntensity * 0.2})`
        ctx.fill()
        
        // Add neon outline
        ctx.strokeStyle = '#00FF9F'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])  // Dashed line
        ctx.stroke()
        ctx.setLineDash([])  // Reset dash
      }

      // Draw selection highlight first (if selected)
      if (isSelected) {
        ctx.beginPath();
        points.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point[0], point[1]);
          else ctx.lineTo(point[0], point[1]);
        });
        ctx.closePath();
        
        // Enhanced cyberpunk glow effect
        const glowGradient = ctx.createRadialGradient(x, y, size * 0.5, x, y, size * 1.5);
        glowGradient.addColorStop(0, 'rgba(0, 255, 255, 0.4)');  // Cyan core
        glowGradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.2)'); // Magenta mid
        glowGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');    // Fade out
        ctx.fillStyle = glowGradient;
        ctx.fill();
        
        // Neon border effect
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FF00FF';
        ctx.stroke();
        
        // Selection indicator with enhanced glow
        ctx.fillStyle = '#00FFFF';
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 20;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('▼', x, y - size - 10);
      }

      // Add enhanced shadow for depth
      ctx.shadowColor = 'rgba(0, 255, 255, 0.3)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 2;

      // Apply theme colors with enhanced contrast
      if (tile?.isPlaced) {
        if (isMatched) {
          // Create gradient for matched tiles
          const matchGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
          matchGradient.addColorStop(0, theme.colors.accent);
          matchGradient.addColorStop(1, theme.colors.secondary);
          ctx.fillStyle = matchGradient;
        } else {
          // Create gradient for normal tiles
          const normalGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
          normalGradient.addColorStop(0, theme.colors.secondary);
          normalGradient.addColorStop(1, theme.colors.background);
          ctx.fillStyle = normalGradient;
        }
      }

      // For rainbow tiles
      if (tile?.isJoker) {
        // Create rainbow gradient
        const gradient = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(0.2, '#ffff00');
        gradient.addColorStop(0.4, '#00ff00');
        gradient.addColorStop(0.6, '#00ffff');
        gradient.addColorStop(0.8, '#0000ff');
        gradient.addColorStop(1, '#ff00ff');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 6;
      }

      // Draw hexagon with rounded corners
      ctx.beginPath()
      points.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point[0], point[1])
        else ctx.lineTo(point[0], point[1])
      })
      ctx.closePath()
      ctx.fill()

      // Reset shadow for edges
      ctx.shadowColor = 'none'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0

      // Draw edges
      if (tile?.edges) {
        for (let i = 0; i < 6; i++) {
          const start = points[i]
          const end = points[(i + 1) % 6]
          
          if (settings.isColorBlind) {
            // In colorblind mode, use only black/white for edges
            ctx.strokeStyle = isMatched ? '#FFFFFF' : '#888888'
            ctx.lineWidth = isSelected ? 6 : 4  // Increased from 4:2
          } else {
            const color = tile.edges[i].color
            
            // Regular color mode with wider edges
            if (tile.isJoker) {
              // For joker tiles, use a solid color instead of gradient
              ctx.strokeStyle = '#FFFFFF'
              ctx.shadowColor = '#FFFFFF'
              ctx.shadowBlur = 10
            } else {
              const gradient = ctx.createLinearGradient(start[0], start[1], end[0], end[1])
              gradient.addColorStop(0, color)
              gradient.addColorStop(1, color)
              ctx.strokeStyle = gradient
            }
            ctx.lineWidth = isSelected ? 7 : 5  // Increased from 5:3
          }
          
          ctx.beginPath()
          ctx.moveTo(start[0], start[1])
          ctx.lineTo(end[0], end[1])
          ctx.stroke()
        }

        // Special joker indicator and number for joker tiles
        if (tile.isJoker) {
          // Draw star above the number
          ctx.fillStyle = '#FFFFFF'
          ctx.shadowColor = '#FFFFFF'
          ctx.shadowBlur = 15
          ctx.font = 'bold 20px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('★', x, y - 12)  // Move star up

          // Draw number below the star
          ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
          ctx.shadowBlur = 2
          ctx.fillStyle = isSelected ? '#1a1a1a' : '#2d2d2d'
          ctx.font = `bold ${isSelected ? 24 : 22}px Arial`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(tile.value.toString(), x, y + 12)  // Move number down

          // Show joker info when selected
          if (isSelected) {
            // Draw info box above tile
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
            ctx.lineWidth = 1
            const text = 'Matches any color'
            const padding = 10
            const boxWidth = ctx.measureText(text).width + padding * 2
            const boxHeight = 30
            const boxX = x - boxWidth / 2
            const boxY = y - size * 2

            // Draw box with rounded corners
            ctx.beginPath()
            ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 5)
            ctx.fill()
            ctx.stroke()

            // Draw description text
            ctx.fillStyle = '#fff'
            ctx.font = '14px Arial'
            ctx.fillText(text, x, boxY + boxHeight/2)
          }
        } else if (tile.powerUp) {
          // Define power-up specific colors and icons
          const powerUpStyles = {
            freeze: {
              glow: '#00FFFF',
              icon: '❄️'
            },
            colorShift: {
              glow: '#FF00FF',
              icon: '🎨'
            },
            multiplier: {
              glow: '#FFD700',
              icon: '✨'
            }
          };

          const style = powerUpStyles[tile.powerUp.type];
          
          // Draw power-up icon above the number
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = style.glow;
          ctx.shadowBlur = 15;
          ctx.font = 'bold 20px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(style.icon, x, y - 12);  // Move icon up

          // Draw number below the icon
          ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
          ctx.shadowBlur = 2;
          ctx.fillStyle = isSelected ? '#1a1a1a' : '#2d2d2d';
          ctx.font = `bold ${isSelected ? 24 : 22}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tile.value.toString(), x, y + 12);  // Move number down

          // Show power-up info when selected
          if (isSelected) {
            const descriptions = {
              freeze: 'Freezes Timer (5s)',
              colorShift: 'Changes Adjacent Colors',
              multiplier: 'Double Points (15s)'
            };

            // Draw info box above tile
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.strokeStyle = style.glow;
            ctx.lineWidth = 2;
            const text = descriptions[tile.powerUp.type];
            const padding = 10;
            const boxWidth = ctx.measureText(text).width + padding * 2;
            const boxHeight = 30;
            const boxX = x - boxWidth / 2;
            const boxY = y - size * 2;

            // Draw box with rounded corners and glow
            ctx.shadowColor = style.glow;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 5);
            ctx.fill();
            ctx.stroke();

            // Draw description text
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowBlur = 2;
            ctx.font = '14px Arial';
            ctx.fillText(text, x, boxY + boxHeight/2);
          }
        } else if (tile.value > 0 && tile.type !== 'mirror') {  // Add check for non-mirror tiles
          // Regular tile number
          // Add dark outline for better contrast
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 3
          ctx.shadowColor = '#000000'
          ctx.shadowBlur = 4
          ctx.font = 'bold 24px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          // Draw text stroke first (outline)
          ctx.strokeText(tile.value.toString(), x, y)  // Use actual x, y for main grid
          
          // Then draw the bright text
          ctx.fillStyle = '#FFFFFF' // Always use white for better visibility
          ctx.shadowColor = '#00FFFF' // Cyan glow
          ctx.shadowBlur = 8
          ctx.fillText(tile.value.toString(), x, y)  // Use actual x, y for main grid
          
          // Reset shadow
          ctx.shadowBlur = 0
        }
      }

      // Draw accessibility overlay
      if (tile && (settings.isColorBlind || settings.showEdgeNumbers)) {
        drawAccessibilityOverlay(ctx, tile, x, y, size, settings)
      }
      // Add mirror tile indicator and visual effects
      if (tile?.type === 'mirror') {
        // Draw mirror symbol above the number
        ctx.fillStyle = '#FFFFFF'
        ctx.shadowColor = '#FFFFFF'
        ctx.shadowBlur = 15
        ctx.font = 'bold 20px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('↔', x, y - 12)  // Use x,y coordinates for main board

        // Draw number below the symbol
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
        ctx.shadowBlur = 2
        ctx.fillStyle = isSelected ? '#1a1a1a' : '#2d2d2d'  // Use isSelected parameter
        ctx.font = `bold ${isSelected ? 24 : 22}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(tile.value.toString(), x, y + 12)  // Use x,y coordinates for main board

        // Show mirror info when selected (matching power-up info style)
        if (isSelected) {  // Use isSelected parameter instead of selectedTileIndex
          // Draw info box above tile
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
          ctx.strokeStyle = '#00FFFF'
          ctx.lineWidth = 2
          const text = 'Mirrors Adjacent Colors'
          const padding = 10
          const boxWidth = ctx.measureText(text).width + padding * 2
          const boxHeight = 30
          const boxX = x - boxWidth / 2
          const boxY = y - size * 2  // Position relative to tile size

          // Draw box with rounded corners and glow
          ctx.shadowColor = '#00FFFF'
          ctx.shadowBlur = 10
          ctx.beginPath()
          ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 5)
          ctx.fill()
          ctx.stroke()

          // Draw description text
          ctx.fillStyle = '#FFFFFF'
          ctx.shadowBlur = 2
          ctx.font = '14px Arial'
          ctx.fillText(text, x, boxY + boxHeight/2)

          // Add arrow pointer like power-ups
          ctx.beginPath()
          ctx.moveTo(x - 8, boxY + boxHeight)
          ctx.lineTo(x + 8, boxY + boxHeight)
          ctx.lineTo(x, boxY + boxHeight + 8)
          ctx.closePath()
          ctx.fillStyle = '#00FFFF'
          ctx.fill()
        }
      }

      // Add scale animation for newly placed tiles
      const animation = animatingTiles.find(
        animTile => tile && animTile.q === tile.q && animTile.r === tile.r
      );
      
      if (animation) {
        ctx.save();
        
        if (animation.type === 'place') {
          // Placement animation - scale effect
          const progress = (Date.now() % 500) / 500;
          const scale = 1 + Math.sin(progress * Math.PI) * 0.1;
          ctx.translate(x, y);
          ctx.scale(scale, scale);
          ctx.translate(-x, -y);
        } else if (animation.type === 'match') {
          // Match animation - glow pulse
          const progress = (Date.now() % 800) / 800;
          const glowIntensity = Math.sin(progress * Math.PI * 2) * 10 + 15;
          ctx.shadowColor = theme.colors.accent;
          ctx.shadowBlur = glowIntensity;
        }
      }

      if (animation) {
        ctx.restore();
      }

      // Add glow effect for matches
      if (isMatched) {
        ctx.shadowColor = theme.colors.accent;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        points.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point[0], point[1]);
          else ctx.lineTo(point[0], point[1]);
        });
        ctx.closePath();
        ctx.stroke();
      }
    }

    const centerX = canvas.width / 2 - 100
    const centerY = canvas.height / 2
    const tileSize = 40
    const rows = 7
    const nextPiecesX = centerX + 400
    const nextPiecesY = 200

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (!isGameOver) {
        // Save the current context state
        ctx.save()
        
        // Move to center, rotate, then move back
        ctx.translate(centerX, centerY)
        ctx.rotate((boardRotation * Math.PI) / 180)
        ctx.translate(-centerX, -centerY)

        // Draw grid with valid placement highlights
        for (let q = -rows; q <= rows; q++) {
          for (let r = Math.max(-cols, -q-cols); r <= Math.min(cols, -q+cols); r++) {
            const s = -q - r
            if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= Math.floor(cols/2)) {
              const { x, y } = hexToPixel(q, r, centerX, centerY, tileSize)
              drawHexagonWithColoredEdges(x, y, tileSize, undefined, false)
            }
          }
        }

        // Draw all placed tiles in one batch
        placedTiles.forEach(tile => {
          const { x, y } = hexToPixel(tile.q, tile.r, centerX, centerY, tileSize)
          const isMatched = hasMatchingEdges(tile, placedTiles, settings.isColorBlind)
          drawHexagonWithColoredEdges(x, y, tileSize, tile, isMatched)
        })

        // Restore the context to its original state
        ctx.restore()

        // Draw cursor tile without rotation
        if (selectedTileIndex !== null && mousePosition) {
          ctx.globalAlpha = 0.6
          drawHexagonWithColoredEdges(
            mousePosition.x,
            mousePosition.y,
            tileSize,
            nextTiles[selectedTileIndex],
            false,
            true
          )
          ctx.globalAlpha = 1.0
        }
      } else {
        // Draw only game over screen
        // Dark overlay with slight red tint
        ctx.fillStyle = 'rgba(25, 0, 0, 0.9)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Game Over container
        const containerWidth = 400
        const containerHeight = 500
        const containerX = (canvas.width - containerWidth) / 2
        const containerY = (canvas.height - containerHeight) / 2

        // Draw container with gradient background
        const gradient = ctx.createLinearGradient(containerX, containerY, containerX, containerY + containerHeight)
        gradient.addColorStop(0, '#2C0A1E')
        gradient.addColorStop(1, '#1A0712')
        ctx.fillStyle = gradient
        ctx.roundRect(containerX, containerY, containerWidth, containerHeight, 15)
        ctx.fill()

        // Container border with glow
        ctx.strokeStyle = '#FF4D6D'
        ctx.lineWidth = 3
        ctx.shadowColor = '#FF4D6D'
        ctx.shadowBlur = 15
        ctx.roundRect(containerX, containerY, containerWidth, containerHeight, 15)
        ctx.stroke()
        ctx.shadowBlur = 0

        // Game Over text
        ctx.font = 'bold 48px Arial'
        ctx.fillStyle = '#FF8FA3'
        ctx.textAlign = 'center'
        ctx.fillText('GAME OVER', canvas.width / 2, containerY + 80)

        // Final Score text
        ctx.font = 'bold 32px Arial'
        ctx.fillStyle = '#FF4D6D'
        ctx.fillText('Final Score', canvas.width / 2, containerY + 180)
        
        // Score with glow
        ctx.font = 'bold 56px Arial'
        ctx.fillStyle = '#FFFFFF'
        ctx.shadowColor = '#FF4D6D'
        ctx.shadowBlur = 10
        ctx.fillText(score.toString(), canvas.width / 2, containerY + 260)
        ctx.shadowBlur = 0

        // Draw button container last
        const buttonContainerHeight = 100
        const buttonContainerY = containerY + containerHeight - buttonContainerHeight

        // Button container background
        ctx.fillStyle = 'rgba(44, 10, 30, 0.95)'
        ctx.beginPath()
        ctx.roundRect(containerX, buttonContainerY, containerWidth, buttonContainerHeight, [0, 0, 15, 15])
        ctx.fill()

        // Play Again button
        const buttonWidth = 200
        const buttonHeight = 50
        const buttonX = canvas.width / 2 - buttonWidth / 2
        const buttonY = buttonContainerY + (buttonContainerHeight - buttonHeight) / 2

        // Draw button with hover effect
        ctx.fillStyle = '#FF4D6D'
        ctx.shadowColor = '#FF4D6D'
        ctx.shadowBlur = mousePosition && 
          mousePosition.x >= buttonX && mousePosition.x <= buttonX + buttonWidth &&
          mousePosition.y >= buttonY && mousePosition.y <= buttonY + buttonHeight ? 15 : 5
        ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 10)
        ctx.fill()

        // Button text
        ctx.shadowBlur = 0
        ctx.font = 'bold 24px Arial'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText('Play Again', canvas.width / 2, buttonY + buttonHeight/2 + 8)
      }
    }

    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      if (isGameOver) {
        const containerHeight = 500
        const buttonContainerHeight = 100
        const buttonWidth = 200
        const buttonHeight = 50
        const buttonX = canvas.width / 2 - buttonWidth / 2
        const buttonY = (canvas.height - containerHeight) / 2 + containerHeight - buttonContainerHeight + (buttonContainerHeight - buttonHeight) / 2

        if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
            mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
          // Reset game state
          setPlacedTiles([{
            ...createTileWithRandomEdges(0, 0),
            isPlaced: true
          }])
          setScore(0)
          setTimeLeft(timedMode ? INITIAL_TIME : Infinity)
          setIsGameOver(false)
          setNextTiles([
            createNewTile(),
            createNewTile(),
            createNewTile()
          ])
          setSelectedTileIndex(null)
          return
        }
        return
      }

      // Check if click is in next pieces area
      nextTiles.forEach((tile, index) => {
        const pieceX = nextPiecesX
        const pieceY = nextPiecesY + index * 100
        const distance = Math.sqrt((mouseX - pieceX) ** 2 + (mouseY - pieceY) ** 2)
        
        if (distance < tileSize && !tile.isPlaced) {
          setSelectedTileIndex(index)
          return
        }
      })

      // If a tile is selected and click is on the grid
      if (selectedTileIndex !== null) {
        // Adjust click coordinates based on rotation
        const adjustedX = mouseX - centerX
        const adjustedY = mouseY - centerY
        
        // Apply inverse rotation to get true grid coordinates
        const angle = (-boardRotation * Math.PI) / 180
        const rotatedX = adjustedX * Math.cos(angle) - adjustedY * Math.sin(angle)
        const rotatedY = adjustedX * Math.sin(angle) + adjustedY * Math.cos(angle)
        
        // Calculate grid position using rotated coordinates
        const q = Math.round((rotatedX + centerX - centerX) / (tileSize * 1.5))
        const r = Math.round((rotatedY + centerY - centerY - q * tileSize * Math.sqrt(3)/2) / (tileSize * Math.sqrt(3)))
        const s = -q - r

        const isValidPosition = Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= Math.floor(cols/2)
        const isOccupied = placedTiles.some(tile => tile.q === q && tile.r === r)

        if (isValidPosition && !isOccupied) {
          const selectedTile = nextTiles[selectedTileIndex]
          
          // Create the new tile
          let newTile: PlacedTile = { 
            ...selectedTile, 
            q, 
            r,
            value: 0,
            isPlaced: true,
            type: 'normal',
            hasBeenMatched: false  // Initialize as not matched
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
                x: q * tileSize + tileSize / 2,
                y: r * tileSize + tileSize / 2 - 40,
                emoji: feedback.emoji,
                text: 'Mirror Match!',
                type: 'score'
              });
              
              // Update score
              setScore(prev => prev + mirrorPoints);
              soundManager.playSound('mirror');
            }
          }
          
          // Inside handleClick where we create newPlacedTiles:

          // First, create initial tiles with updated values
          const initialPlacedTiles: PlacedTile[] = updateTileValues([...placedTiles, newTile]);

          // Then, in a separate step, mark matched tiles
          const newPlacedTiles: PlacedTile[] = initialPlacedTiles.map((tile: PlacedTile): PlacedTile => ({
            ...tile,
            hasBeenMatched: tile.hasBeenMatched || hasMatchingEdges(tile, initialPlacedTiles, settings.isColorBlind)
          }));

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

          // Award points for any matches
          if (matchCount > 0) {
            handleMatches(matchCount);
            
            const basePoints = matchCount * 5;  // 5 points per matching edge
            const feedback = getFeedbackForScore(basePoints);
            
            addScorePopup({
              score: basePoints,
              x: canvas.width / 2,
              y: canvas.height / 2 - 100,
              emoji: feedback.emoji,
              text: matchCount === 1 ? 'Edge Match!' : 'Multiple Matches!',
              type: 'score'
            });
            
            setScore(prevScore => prevScore + basePoints);
            addTileAnimation(q, r, 'match');
            setLastAction({ type: 'match', value: matchCount * 5 });
          }

          // Check for matches for grid-full bonus
          const matchingTiles = newPlacedTiles.filter((tile: PlacedTile) => 
            hasMatchingEdges(tile, newPlacedTiles, settings.isColorBlind)
          );
          
          // Additional bonus for clearing tiles when grid is full
          if (matchingTiles.length >= 3 && isGridFull(newPlacedTiles, cols)) {
            handleGridClear();
          }
          
          // Update board with new tile
          setPlacedTiles(newPlacedTiles)
          
          // Add this line to activate power-up if present
          if (selectedTile.powerUp) {
            activatePowerUp(selectedTile)
          }
          
          // Generate new tile for the used slot
          const newTiles = [...nextTiles]
          newTiles[selectedTileIndex] = createNewTile()  // Replace direct creation with a function call
          setNextTiles(newTiles)
          setSelectedTileIndex(null)

          // Update combo only if there's a match
          if (matchCount > 0) {
            const now = Date.now();
            const timeSinceLastPlacement = now - combo.lastPlacementTime;
            const quickPlacement = timeSinceLastPlacement < 2000;

            // Handle quick placement bonus with dynamic multiplier
            if (quickPlacement) {
              const quickMultiplier = calculateDynamicMultiplier(
                SCORING_CONFIG.quickPlacement.baseMultiplier,
                SCORING_CONFIG.quickPlacement.levelScaling,
                SCORING_CONFIG.quickPlacement.maxMultiplier,
                playerProgress.level,
                combo.count // Use combo count to increase quick bonus
              );
              
              const quickBonus = Math.round(matchCount * SCORING_CONFIG.baseMatch * quickMultiplier);
              const quickInfo = getRandomFeedback('QUICK');
              
              setTimeout(() => {
                addScorePopup({
                  score: quickBonus,
                  x: canvas.width / 2,
                  y: canvas.height / 2 + 25,
                  emoji: quickInfo.emoji,
                  text: `${quickInfo.text}`,
                  type: 'quick'
                });

                setPreviousScore(score);
                setTimeout(() => {
                  setScore(prevScore => prevScore + quickBonus);
                }, 50);
              }, 200);
            }

            // Update the combo handling with dynamic multiplier
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

            // Calculate base match score with combo multiplier
            const baseMatchScore = matchCount * SCORING_CONFIG.baseMatch;
            const comboBonus = Math.round(baseMatchScore * (newComboState.multiplier - 1));
            
            if (comboBonus > 0) {
              const comboInfo = getFeedbackForCombo(newComboState.count);
              addScorePopup({
                score: comboBonus,
                x: canvas.width / 2,
                y: canvas.height / 2 + 50,
                emoji: comboInfo?.emoji ?? '🔥',
                text: comboInfo?.text ?? 'Combo!',
                type: 'combo'
              });
              setScore(prevScore => prevScore + comboBonus);
              setLastAction({ type: 'combo', value: combo.count });
            }
          } else {
            // Reset combo if no match
            setCombo({
              count: 0,
              timer: 0,
              multiplier: 1,
              lastPlacementTime: 0
            });
          }

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

          // Inside handleClick function, where we handle successful tile placement
          if (isValidPosition && !isOccupied) {
            setPreviousState({
              placedTiles,
              nextTiles,
              score
            });

            // Calculate base score from matches
            const baseMatchScore = matchCount * 5;
            let newTotalScore = score + baseMatchScore;

            // Check if grid is full and there are matches
            const isGridFullWithMatches = matchCount > 0 && isGridFull(newPlacedTiles, cols);
            
            if (isGridFullWithMatches) {
              // Calculate clear bonus
              const matchingTiles = newPlacedTiles.filter(tile => 
                hasMatchingEdges(tile, newPlacedTiles, settings.isColorBlind)
              );
              const totalMatchScore = matchingTiles.reduce((sum, tile) => sum + tile.value, 0);
              const multiplier = matchingTiles.length;
              const clearBonus = calculateScore(totalMatchScore * multiplier * 2);
              
              // Add clear bonus to total score
              newTotalScore += clearBonus;

              // Show clear bonus popup
              const clearInfo = getFeedbackForClear(clearBonus);
              addScorePopup({
                score: clearBonus,
                x: canvasRef.current?.width ?? 0 / 2,
                y: canvasRef.current?.height ?? 0 / 2 - 50,
                emoji: clearInfo?.emoji ?? '✨',
                text: clearInfo?.text ?? 'Clear!',
                type: 'clear'
              });
            }

            // Check for achievements
            checkAchievements({
              tilesPlaced: 1,
              comboCount: combo.count,
              score: newTotalScore,
              clearBonus: isGridFullWithMatches
            });

            // Update the score with the total including clear bonus
            setScore(newTotalScore);

            // Update daily challenge objectives
            if (isDailyChallenge) {
              updateObjectives(matchCount, combo.count, newTotalScore);
            }

            // Check for level completion with the new total score
            if (isLevelMode && targetScore && newTotalScore >= targetScore && !isGameOver) {
              const { currentBlock, currentLevel } = getCurrentLevelInfo(newTotalScore);
              
              setIsGameOver(true);
              
              // Show congratulations modal
              setShowLevelComplete({
                show: true,
                level: `${currentBlock}-${currentLevel}`,
                score: newTotalScore,
                targetScore,
                nextLevel: `${currentBlock}-${currentLevel + 1}`,
                bonusPoints: Math.floor((newTotalScore - targetScore) / 100)
              });
              
              // Update player progress
              const progress = getPlayerProgress();
              progress.points = Math.max(progress.points || 0, newTotalScore);
              localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progress));
              
              onGameOver();
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
      const rect = canvas.getBoundingClientRect()
      setMousePosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      })
    }

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
  }, [placedTiles, nextTiles, selectedTileIndex, score, timeLeft, isGameOver, mousePosition, settings])

  // Add power-up activation handler
  const activatePowerUp = (tile: PlacedTile) => {
    if (!tile.powerUp) return

    const { type } = tile.powerUp
    soundManager.playSound('powerUp')

    switch (type) {
      case 'freeze':
        setPowerUps(prev => ({
          ...prev,
          freeze: { active: true, remainingTime: tile.powerUp!.duration! }
        }))
        break

      case 'colorShift':
        const adjacentTiles = getAdjacentTiles(tile, placedTiles)
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)]
        const updatedTiles = placedTiles.map(t => {
          if (adjacentTiles.includes(t)) {
            return {
              ...t,
              edges: t.edges.map(() => ({ color: randomColor }))
            }
            return t
          }
          return t
        })
        setPlacedTiles(updatedTiles)
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

  // Modify the timer effect to only show timer in timed mode
  useEffect(() => {
    if (timedMode && timeLeft > 0 && !isGameOver) {
      const timer = setInterval(() => {
        if (!powerUps.freeze.active) {
          setTimeLeft(prev => prev - 1);
        }
      }, 1000);
      return () => clearInterval(timer);
    } else if (timedMode && timeLeft === 0) {
      setIsGameOver(true);
      onGameOver();
    }
  }, [timeLeft, isGameOver, timedMode, powerUps.freeze.active, onGameOver]);

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

  // Update score calculation to include combo multiplier
  const calculateScore = (baseScore: number) => {
    const scoreMultiplier = getUpgradeEffect(upgradeState, 'scoreMultiplier');
    const matchBonus = getUpgradeEffect(upgradeState, 'matchBonus');
    const comboBonus = getUpgradeEffect(upgradeState, 'comboBonus');
    
    const powerUpMultiplier = powerUps.multiplier.active ? powerUps.multiplier.value : 1;
    const finalMultiplier = scoreMultiplier * powerUpMultiplier * (combo.multiplier + comboBonus);
    
    return Math.round((baseScore + matchBonus) * finalMultiplier);
  };

  // Modify the addScorePopup function to handle popup clearing and positioning better
  const addScorePopup = useCallback(({ score, x, y, emoji, text, type }: {
    score: number;
    x: number;
    y: number;
    emoji: string;
    text: string;
    type: 'score' | 'combo' | 'quick' | 'clear';
  }) => {
    const position = getPopupPosition(type, x, y);
    const newPopupId = Date.now() + Math.random(); // Make ID more unique
    
    // First, clear any existing popup of the same type
    setScorePopups(prev => {
      // Remove existing popups of the same type
      const filtered = prev.filter(p => p.type !== type);
      
      // Add the new popup
      return [...filtered, {
        score,
        x: position.x,
        y: position.y,
        id: newPopupId,
        emoji,
        text,
        type
      }];
    });

    // Play appropriate sound based on type
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

    // Remove this specific popup after animation
    setTimeout(() => {
      setScorePopups(prev => prev.filter(p => p.id !== newPopupId));
    }, 800);
  }, []);

  // Update the getPopupPosition function to better space out popups
  const getPopupPosition = (type: 'score' | 'combo' | 'quick' | 'clear', baseX: number, baseY: number) => {
    const spacing = 100; // Base spacing between popups
    switch (type) {
      case 'score':
        return { x: baseX, y: baseY - spacing };
      case 'quick':
        return { x: baseX - spacing * 1.5, y: baseY }; // Further left
      case 'combo':
        return { x: baseX + spacing * 1.5, y: baseY }; // Further right
      case 'clear':
        return { x: baseX, y: baseY + spacing }; // Lower
      default:
        return { x: baseX, y: baseY };
    }
  };

  // Update the cleanup effect
  useEffect(() => {
    const POPUP_DURATION = 800 // Slightly shorter than animation duration

    if (scorePopups.length > 0) {
      const timer = setTimeout(() => {
        setScorePopups([])
      }, POPUP_DURATION)

      return () => clearTimeout(timer)
    }
  }, [scorePopups])

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
      
      // Update player's points with their score
      updatePlayerPoints(score)

      // Update achievements with time
      updateAchievements({
        highestScore: Math.max(score, getStatistics().highScore),
        highestCombo: Math.max(combo.count, getStatistics().longestCombo),
        fastestGameTime: Math.min(playTime, getStatistics().fastestGameTime || Infinity)
      });

      // Update statistics
      updateStatistics({
        gamesPlayed: 1,
        totalScore: score,
        highScore: Math.max(score, getStatistics().highScore),
        totalPlayTime: playTime,
        longestCombo: Math.max(combo.count, getStatistics().longestCombo),
        lastPlayed: new Date().toISOString()
      });
      clearSavedGame();
    }
  }, [isGameOver, score, combo.count]);

  // Modify the auto-save effect
  useEffect(() => {
    if (!isGameOver && !tutorialState.active) {
      const gameState: GameState = {
        placedTiles,
        nextTiles,
        score,
        timeLeft,
        moveHistory: previousState ? [previousState] : [],
        startTime: loadGameState()?.startTime ?? Date.now(),
        timedMode,
        boardRotation: boardRotation === 0 || boardRotation === 180 ? boardRotation : 0, // Ensure only valid rotations are saved
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
  }, [placedTiles, nextTiles, score, timeLeft, previousState, isGameOver, tutorialState.active, boardRotation, powerUps, combo, musicEnabled, soundEnabled, companion])

  // Add this function to handle undoing moves
  const handleUndo = () => {
    if (previousState) {
      setPlacedTiles(previousState.placedTiles)
      setNextTiles(previousState.nextTiles)
      setScore(previousState.score)
      setPreviousState(null)
      soundManager.playSound('undo')
    }
  }

  // Modify the exit handler
  const handleExit = () => {
    const confirmMessage = tutorialState.active
      ? "Are you sure you want to exit the tutorial? Your progress won't be saved."
      : "Are you sure you want to exit? Your progress will be lost.";
    
    setShowExitConfirm(true);
    setConfirmMessage(confirmMessage);
  }

  // Keep this effect for handling achievement popups
  useEffect(() => {
    if (newAchievements.length > 0) {
      // Play achievement sound
      soundManager.playSound('powerUp');
      
      // Save achievement state with current values
      updateAchievements({
        highestScore: Math.max(score, getStatistics().highScore),
        highestCombo: Math.max(combo.count, getStatistics().longestCombo),
        totalTilesPlaced: placedTiles.length
      });
    }
  }, [newAchievements, score, combo.count, placedTiles.length]);

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
          return { ...obj, current: Math.min(newScore ?? score, obj.target) };
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

    updateDailyChallengeProgress(updatedObjectives, newScore ?? score);

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
        setBoardRotation(normalizedRotation);
        
        // If the rotation changed, update tile edges accordingly
        if (normalizedRotation !== savedGameState.boardRotation) {
          const rotationDiff = normalizedRotation - savedGameState.boardRotation;
          const rotations = Math.round(rotationDiff / 60); // Number of 60-degree rotations needed
          
          setPlacedTiles(savedGameState.placedTiles.map(tile => ({
            ...tile,
            edges: Array(Math.abs(rotations)).fill(null).reduce(
              (edges) => rotateTileEdges(edges),
              tile.edges
            )
          })));
        } else {
          setPlacedTiles(savedGameState.placedTiles);
        }
      } else {
        // If rotation is already normalized, just set the values directly
        setBoardRotation(savedGameState.boardRotation ?? 0);
        setPlacedTiles(savedGameState.placedTiles);
      }
      
      // ... rest of saved state loading ...
    }
  }, [savedGameState, isGameOver]);

  // Add this effect to handle dynamic particle changes
  useEffect(() => {
    // Increase intensity based on score milestones
    const baseIntensity = 0.3;
    const scoreMultiplier = Math.min(score / 1000, 1);
    setParticleIntensity(baseIntensity + scoreMultiplier * 0.7);

    // Change particle color based on score and matches
    if (score > 1000) {
      setParticleColor(theme.colors.accent);
    } else if (score > 500) {
      setParticleColor(theme.colors.secondary);
    } else {
      setParticleColor(theme.colors.primary);
    }
  }, [score, theme]);

  // Add this effect to handle background changes
  useEffect(() => {
    const getBackgroundGlow = () => {
      if (score > 1500) return `radial-gradient(circle, ${theme.colors.accent}22 0%, ${theme.colors.background} 70%)`;
      if (score > 1000) return `radial-gradient(circle, ${theme.colors.secondary}22 0%, ${theme.colors.background} 60%)`;
      if (score > 500) return `radial-gradient(circle, ${theme.colors.primary}22 0%, ${theme.colors.background} 50%)`;
      return `radial-gradient(circle, ${theme.colors.background} 0%, ${theme.colors.background} 100%)`;
    };

    setBackgroundGlow(getBackgroundGlow());
  }, [score, theme]);

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

      case 'colorSync':
        // Temporarily make adjacent tiles match colors
        setPlacedTiles(prev => {
          const newTiles = [...prev];
          newTiles.forEach(tile => {
            const adjacentPositions = getAdjacentPositions(tile.q, tile.r);
            const hasAdjacentTiles = adjacentPositions.some(pos => 
              newTiles.some(t => t.q === pos.q && t.r === pos.r)
            );
            if (hasAdjacentTiles) {
              tile.temporaryColorMatch = true;
            }
          });
          return newTiles;
        });
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

  // Add this effect to handle temporary color matches
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
      const pointsEarned = Math.floor(score / 100); // 1 point per 100 score
      setUpgradeState(prev => {
        const newState = {
          ...prev,
          points: prev.points + pointsEarned
        };
        saveUpgradeState(newState);
        return newState;
      });
    }
  }, [isGameOver, score]);

  // Modify the awardUpgradePoints function to remove unused reason parameter
  const awardUpgradePoints = useCallback((amount: number) => {
    setUpgradeState(prev => {
      const newState = {
        ...prev,
        points: prev.points + amount
      };
      saveUpgradeState(newState);
      return newState;
    });
  }, []);

  // Modify the match handling code to award points for multiple matches
  const handleMatches = (matchCount: number) => {
    if (matchCount >= UPGRADE_POINT_REWARDS.match.threshold) {
      const bonusPoints = Math.floor(
        (matchCount - UPGRADE_POINT_REWARDS.match.threshold) * 
        UPGRADE_POINT_REWARDS.match.bonus
      );
      const totalPoints = UPGRADE_POINT_REWARDS.match.base + bonusPoints;
      awardUpgradePoints(totalPoints);
    }
  };

  // Modify the combo handling code
  useEffect(() => {
    if (combo.count >= UPGRADE_POINT_REWARDS.combo.threshold) {
      const bonusPoints = Math.floor(
        (combo.count - UPGRADE_POINT_REWARDS.combo.threshold) * 
        UPGRADE_POINT_REWARDS.combo.bonus
      );
      const totalPoints = UPGRADE_POINT_REWARDS.combo.base + bonusPoints;
      awardUpgradePoints(totalPoints);
    }
  }, [combo.count]);

  // Modify handleGridClear to use the helper function
  const handleGridClear = () => {
    if (isGameOver) return;

    const matchingTiles = placedTiles.filter(tile => 
      hasMatchingEdges(tile, placedTiles, settings.isColorBlind)
    );
    
    const totalMatchScore = matchingTiles.reduce((sum, tile) => sum + tile.value, 0);
    const multiplier = matchingTiles.length;
    const clearBonus = calculateScore(totalMatchScore * multiplier * 2);
    
    // Get feedback with guaranteed default value
    const clearInfo = getFeedbackForClear(clearBonus);
    
    // Award upgrade points
    awardUpgradePoints(UPGRADE_POINT_REWARDS.clear.points);
    
    // Show clear bonus popup
    addScorePopup({
      score: clearBonus,
      x: canvasRef.current?.width ?? 0 / 2,
      y: canvasRef.current?.height ?? 0 / 2 - 50,
      emoji: clearInfo?.emoji ?? '✨',
      text: clearInfo?.text ?? 'Clear!',
      type: 'clear'
    });
    
    // Calculate new total score
    const newScore = score + clearBonus;
    
    // Update score first
    setScore(newScore);
    
    // Update objectives if in daily challenge
    if (isDailyChallenge) {
      updateObjectives(matchingTiles.length, combo.count, newScore);
    }

    // Check for level completion
    if (isLevelMode && !isGameOver) {
      const { currentBlock, currentLevel } = getCurrentLevelInfo(newScore);
      const nextLevel = getNextLevelInfo(currentBlock, currentLevel, LEVEL_BLOCKS);

      if (nextLevel && newScore >= nextLevel.pointsRequired) {
        setIsGameOver(true);
        
        setShowLevelComplete({
          show: true,
          level: `${currentBlock}-${currentLevel}`,
          score: newScore,
          targetScore: nextLevel.pointsRequired,
          nextLevel: `${nextLevel.block}-${nextLevel.level}`,
          bonusPoints: Math.floor((newScore - nextLevel.pointsRequired) / 100),
          isNextLevelUnlock: true
        });
        
        // Update player progress
        const progress = getPlayerProgress();
        progress.points = Math.max(progress.points || 0, newScore);
        progress.unlockedLevels = progress.unlockedLevels || {};
        
        // Unlock the next level
        const nextLevelKey = `${nextLevel.block}-${nextLevel.level}`;
        progress.unlockedLevels[nextLevelKey] = true;
        
        // Save the updated progress
        localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progress));
        
        onGameOver();
      }
    }
    
    // Remove matching tiles after a delay
    setTimeout(() => {
      setPlacedTiles(prev => 
        prev.filter(tile => !hasMatchingEdges(tile, prev, settings.isColorBlind))
      );
    }, 500);
  };

  // Modify the achievement handling code
  useEffect(() => {
    if (newAchievements.length > 0) {
      awardUpgradePoints(UPGRADE_POINT_REWARDS.achievement.points);
    }
  }, [newAchievements]);

  // Modify the level up handling code
  useEffect(() => {
    const oldLevel = playerProgress.level;
    if (playerProgress.level > oldLevel) {
      awardUpgradePoints(UPGRADE_POINT_REWARDS.levelUp.points);
    }
  }, [playerProgress.level]);

  // Modify the daily challenge completion code
  useEffect(() => {
    if (isDailyChallenge && showDailyComplete) {
      awardUpgradePoints(UPGRADE_POINT_REWARDS.dailyChallenge.points);
    }
  }, [isDailyChallenge, showDailyComplete]);

  // 2. Modify the upgrade button to show when upgrades are available
  const canUpgrade = useCallback(() => {
    const { tileUpgrades, gridUpgrades, points } = upgradeState;
    return [...tileUpgrades, ...gridUpgrades].some(upgrade => 
      upgrade.currentLevel < upgrade.maxLevel && points >= upgrade.cost
    );
  }, [upgradeState]);

  // Add effect to check for level completion
  useEffect(() => {
    if (isLevelMode && !isGameOver && score > 0) {  // Add score > 0 check
      const { currentBlock, currentLevel } = getCurrentLevelInfo(score);
      const nextLevel = getNextLevelInfo(currentBlock, currentLevel, LEVEL_BLOCKS);

      // Check if we've reached the target for the next level
      if (nextLevel && score >= nextLevel.pointsRequired) {
        // Prevent multiple triggers
        setIsGameOver(true);
        
        // Show congratulations modal with next level unlock info
        setShowLevelComplete({
          show: true,
          level: `${currentBlock}-${currentLevel}`,
          score,
          targetScore: nextLevel.pointsRequired,
          nextLevel: `${nextLevel.block}-${nextLevel.level}`,
          bonusPoints: Math.floor((score - nextLevel.pointsRequired) / 100),
          isNextLevelUnlock: true
        });
        
        // Update player progress to unlock the next level
        const progress = getPlayerProgress();
        progress.points = Math.max(progress.points || 0, score);
        progress.unlockedLevels = progress.unlockedLevels || {};
        
        // Unlock the next level
        const nextLevelKey = `${nextLevel.block}-${nextLevel.level}`;
        progress.unlockedLevels[nextLevelKey] = true;
        
        // Save the updated progress
        localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progress));
        
        // Call onGameOver last
        onGameOver();
      }
    }
  }, [isLevelMode, score, isGameOver, onGameOver]); // Keep these dependencies

  return (
    <div
      className="game-container"
      style={{
        background: backgroundGlow,
        transition: 'background 1s ease-in-out'
      }}
    >
      <div className="game-header">
        <LevelProgress progress={playerProgress} />
        {!tutorialState.active && (
          <button 
            className={`upgrade-button cyberpunk-button ${canUpgrade() ? 'can-upgrade' : ''}`}
            onClick={() => setShowUpgrades(true)}
          >
            <span className="icon">⚡</span>
            Upgrades
          </button>
        )}
      </div>
      <Particles 
        intensity={particleIntensity} 
        color={particleColor}
      />
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
        <div className="score">
          Score
          <span className="score-value">
            {score.toLocaleString()}
          </span>
          {score > previousScore && (
            <div className="score-increment-container">
              <span className="score-increment">
                +{(score - previousScore).toLocaleString()}
              </span>
            </div>
          )}
        </div>
        <div className="timer-container">
          {timedMode && (
            <div className={`timer ${
              timeLeft > INITIAL_TIME * 0.5 ? 'safe' : 
              timeLeft > INITIAL_TIME * 0.25 ? 'warning' : 
              'danger'
            }`}>
              Time: {formatTime(timeLeft)}
            </div>
          )}
          <div className="power-up-indicator">
            {powerUps.freeze.active && (
              <div className="power-up-timer active">
                ❄️ {powerUps.freeze.remainingTime}s
              </div>
            )}
            {powerUps.multiplier.active && (
              <div className="power-up-timer active">
                ✨ {powerUps.multiplier.remainingTime}s
              </div>
            )}
          </div>
        </div>
      </div>
      {showCompanion && (
        <CompanionHUD 
          companion={companion}
          score={score}
          combo={combo.count}
          lastAction={lastAction}  // Add this state to track game events
        />
      )}
      <div className="board-container">
        <canvas 
          ref={canvasRef} 
          className={`
            game-board 
            ${isGridFull(placedTiles, cols) ? 'grid-full' : ''}
            ${showWarning ? 'rotation-warning' : ''}
            ${animatingTiles.length > 0 ? 'has-animations' : ''}
          `}
        />
        {showRotationText && (
          <div className="rotation-text">
            Rotation Incoming!
          </div>
        )}

        <div className="next-tiles-container">
          <div className="next-tiles">
            {nextTiles.map((tile, index) => (
              <div 
                key={index} 
                className={`next-tile ${selectedTileIndex === index ? 'selected' : ''}`}
                onClick={() => setSelectedTileIndex(selectedTileIndex === index ? null : index)}
              >
                <canvas
                  ref={el => {
                    if (el) {
                      const ctx = el.getContext('2d')
                      if (ctx) {
                        el.width = 100
                        el.height = 100
                        
                        // Draw tile background
                        ctx.fillStyle = 'rgba(26, 26, 46, 0.9)'
                        ctx.beginPath()
                        ctx.arc(50, 50, 40, 0, Math.PI * 2)
                        ctx.fill()

                        // Draw tile edges
                        tile.edges.forEach((edge, i) => {
                          const angle = (i * Math.PI) / 3
                          const startX = 50 + 35 * Math.cos(angle)
                          const startY = 50 + 35 * Math.sin(angle)
                          const endX = 50 + 35 * Math.cos(angle + Math.PI / 3)
                          const endY = 50 + 35 * Math.sin(angle + Math.PI / 3)

                          ctx.beginPath()
                          ctx.moveTo(startX, startY)
                          ctx.lineTo(endX, endY)
                          ctx.strokeStyle = edge.color
                          ctx.lineWidth = selectedTileIndex === index ? 5 : 3
                          ctx.stroke()
                        })

                        // Draw selection indicator
                        if (selectedTileIndex === index) {
                          ctx.strokeStyle = '#00FF9F'
                          ctx.lineWidth = 3
                          ctx.setLineDash([5, 5])
                          ctx.beginPath()
                          ctx.arc(50, 50, 45, 0, Math.PI * 2)
                          ctx.stroke()
                          ctx.setLineDash([])
                        }

                        // Draw tile value if it exists
                        if (tile.value > 0 && tile.type !== 'mirror') {  // Add check for non-mirror tiles
                          ctx.strokeStyle = '#000000';
                          ctx.lineWidth = 3;
                          ctx.shadowColor = '#000000';
                          ctx.shadowBlur = 4;
                          ctx.font = 'bold 24px Arial';
                          ctx.textAlign = 'center';
                          ctx.textBaseline = 'middle';
                          
                          // Use fixed coordinates (50,50) for preview tiles
                          ctx.strokeText(tile.value.toString(), 50, 50);
                          
                          // Then draw the bright text
                          ctx.fillStyle = '#FFFFFF'; // Always use white for better visibility
                          ctx.shadowColor = '#00FFFF'; // Cyan glow
                          ctx.shadowBlur = 8;
                          ctx.fillText(tile.value.toString(), 50, 50);
                          
                          // Reset shadow
                          ctx.shadowBlur = 0
                        }

                        // Draw power-up indicator if present
                        if (tile.powerUp) {
                          const powerUpIcons = {
                            freeze: '❄️',
                            colorShift: '🎨',
                            multiplier: '✨'
                          };
                          ctx.font = '16px Arial';
                          ctx.fillText(powerUpIcons[tile.powerUp.type], 50, 20);
                        }

                        // Draw mirror symbol
                        if (tile.type === 'mirror') {
                          // Draw mirror symbol above the number
                          ctx.fillStyle = '#FFFFFF'
                          ctx.shadowColor = '#FFFFFF'
                          ctx.shadowBlur = 15
                          ctx.font = 'bold 20px Arial'
                          ctx.textAlign = 'center'
                          ctx.textBaseline = 'middle'
                          ctx.fillText('↔', 50, 38)  // Use fixed coordinates for preview

                          // Draw number below the symbol
                          ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
                          ctx.shadowBlur = 2
                          ctx.fillStyle = selectedTileIndex === index ? '#1a1a1a' : '#2d2d2d'
                          ctx.font = `bold ${selectedTileIndex === index ? 24 : 22}px Arial`
                          ctx.textAlign = 'center'
                          ctx.textBaseline = 'middle'
                          ctx.fillText(tile.value.toString(), 50, 62)

                          // Show mirror info when selected (matching power-up info style)
                          if (selectedTileIndex === index) {
                            // Draw info box above tile
                            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
                            ctx.strokeStyle = '#00FFFF'
                            ctx.lineWidth = 2
                            const text = 'Mirrors Adjacent Colors'
                            const padding = 10
                            const boxWidth = ctx.measureText(text).width + padding * 2
                            const boxHeight = 30
                            const boxX = 50 - boxWidth / 2
                            const boxY = -40  // Position at top of preview tile

                            // Draw box with rounded corners and glow
                            ctx.shadowColor = '#00FFFF'
                            ctx.shadowBlur = 10
                            ctx.beginPath()
                            ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 5)
                            ctx.fill()
                            ctx.stroke()

                            // Draw description text
                            ctx.fillStyle = '#FFFFFF'
                            ctx.shadowBlur = 2
                            ctx.font = '14px Arial'
                            ctx.fillText(text, 50, boxY + boxHeight/2)

                            // Add arrow pointer like power-ups
                            ctx.beginPath()
                            ctx.moveTo(50 - 8, boxY + boxHeight)
                            ctx.lineTo(50 + 8, boxY + boxHeight)
                            ctx.lineTo(50, boxY + boxHeight + 8)
                            ctx.closePath()
                            ctx.fillStyle = '#00FFFF'
                            ctx.fill()
                          }
                        }
                      }
                    }
                  }}
                  style={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    transform: selectedTileIndex === index ? 'scale(1.1)' : 'scale(1)'
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
            Undo Last Move
          </button>
        </div>
      </div>

      {scorePopups.map(popup => (
        <div
          key={popup.id}
          className="score-popup"
          data-type={popup.type}
          style={{
            left: `${popup.x}px`,
            top: `${popup.y}px`
          }}
        >
          <span className="emoji">{popup.emoji}</span>
          <div className="popup-content">
            <div className="popup-text">{popup.text}</div>
            <div className="popup-score">+{popup.score}</div>
          </div>
        </div>
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
      {showExitConfirm && (
        <ConfirmModal
          message={confirmMessage}
          onConfirm={() => {
            setShowExitConfirm(false);
            onExit();
          }}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}
      {isDailyChallenge && (
        <DailyChallengeHUD objectives={dailyChallenge?.objectives || []} />
      )}
      {showDailyComplete && (
        <DailyChallengeComplete
          score={score}
          onExit={onExit}
        />
      )}
      {showLevelRoadmap && (
        <div className="roadmap-overlay">
          <LevelRoadmap 
            currentPoints={score} 
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
      <style>
        {`
          @keyframes placeTile {
            0% { transform: scale(1.1); opacity: 0.8; }
            50% { transform: scale(0.95); }
            100% { transform: scale(1); opacity: 1; }
          }

          @keyframes matchGlow {
            0% { filter: drop-shadow(0 0 5px ${theme.colors.accent}66); }
            50% { filter: drop-shadow(0 0 15px ${theme.colors.accent}); }
            100% { filter: drop-shadow(0 0 5px ${theme.colors.accent}66); }
          }

          .game-board {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            will-change: transform;
          }

          .tile-placed {
            animation: placeTile 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            will-change: transform, opacity;
          }

          .tile-matched {
            animation: matchGlow 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            will-change: filter;
          }

          // ... existing styles ...

          .game-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            width: 100%;
          }

          .cyberpunk-button {
            background: linear-gradient(45deg, #1a1a2e, #2a2a40);
            border: 2px solid rgba(0, 255, 159, 0.3);
            border-radius: 4px;
            color: #00ff9f;
            padding: 8px 16px;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 0 10px rgba(0, 255, 159, 0.3);
          }

          .cyberpunk-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 0 20px rgba(0, 255, 159, 0.5);
          }

          .cyberpunk-button .icon {
            font-size: 1.2em;
          }

          @keyframes glowPulse {
            0% { box-shadow: 0 0 10px rgba(0, 255, 159, 0.3); }
            50% { box-shadow: 0 0 20px rgba(0, 255, 159, 0.5); }
            100% { box-shadow: 0 0 10px rgba(0, 255, 159, 0.3); }
          }

          .cyberpunk-button.can-upgrade {
            background: linear-gradient(45deg, #00ff9f, #00b8ff);
            border-color: #00ff9f;
            animation: glowPulse 2s infinite;
          }

          .cyberpunk-button:not(.can-upgrade) {
            opacity: 0.8;
          }

          @keyframes glowPulse {
            0% { box-shadow: 0 0 10px rgba(0, 255, 159, 0.3); }
            50% { box-shadow: 0 0 20px rgba(0, 255, 159, 0.5); }
            100% { box-shadow: 0 0 10px rgba(0, 255, 159, 0.3); }
          }

          .cyberpunk-button.can-upgrade {
            background: linear-gradient(45deg, #00ff9f, #00b8ff);
            border-color: #00ff9f;
            animation: glowPulse 2s infinite;
          }

          .cyberpunk-button:not(.can-upgrade) {
            opacity: 0.8;
          }

          .upgrade-points {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 255, 159, 0.1);
            padding: 8px 16px;
            border-radius: 20px;
            color: #00ff9f;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 8px;
            border: 1px solid rgba(0, 255, 159, 0.3);
          }

          .upgrade-points .icon {
            font-size: 1.2em;
          }

          .points-earned-popup {
            position: absolute;
            right: 0;
            color: #00ff9f;
            font-weight: bold;
            pointer-events: none;
          }

          @keyframes floatUp {
            0% {
              opacity: 1;
              transform: translateY(0);
            }
            100% {
              opacity: 0;
              transform: translateY(-20px);
            }
          }

          .level-complete-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }

          .level-complete-modal {
            background: rgba(26, 26, 46, 0.95);
            border: 2px solid #00FF9F;
            border-radius: 15px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            text-align: center;
            box-shadow: 0 0 30px rgba(0, 255, 159, 0.3);
          }

          .level-complete-modal h2 {
            color: #00FF9F;
            font-size: 2em;
            margin-bottom: 20px;
            text-shadow: 0 0 10px rgba(0, 255, 159, 0.5);
          }

          .level-stats {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin: 20px 0;
          }

          .stat {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
          }

          .stat.bonus {
            background: rgba(0, 255, 159, 0.1);
            border: 1px solid rgba(0, 255, 159, 0.3);
          }

          .value {
            font-weight: bold;
            color: #00FF9F;
          }

          .next-level {
            font-size: 1.2em;
            color: #00FFFF;
            margin: 20px 0;
          }

          .level-complete-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 20px;
          }

          .cyberpunk-button.primary {
            background: linear-gradient(45deg, #00FF9F, #00FFFF);
            color: #1a1a2e;
            font-weight: bold;
          }
        `}
      </style>
      <UpgradeModal
        isOpen={showUpgrades}
        onClose={() => setShowUpgrades(false)}
        tileUpgrades={upgradeState.tileUpgrades}
        gridUpgrades={upgradeState.gridUpgrades}
        points={upgradeState.points}
        onUpgrade={handleUpgrade}
      />
      {showLevelComplete && (
        <div className="level-complete-overlay">
          <div className="level-complete-modal">
            <h2>
              {showLevelComplete.isNextLevelUnlock 
                ? '🎉 Next Level Unlocked! 🎉'
                : `Level ${showLevelComplete.level} Complete! 🎉`}
            </h2>
            <div className="level-stats">
              <div className="stat">
                <span>Your Score</span>
                <span className="value">{showLevelComplete.score.toLocaleString()}</span>
              </div>
              <div className="stat">
                <span>
                  {showLevelComplete.isNextLevelUnlock ? 'Unlock Requirement' : 'Target Score'}
                </span>
                <span className="value">{showLevelComplete.targetScore.toLocaleString()}</span>
              </div>
              {showLevelComplete.bonusPoints > 0 && (
                <div className="stat bonus">
                  <span>Bonus Points</span>
                  <span className="value">+{showLevelComplete.bonusPoints}</span>
                </div>
              )}
            </div>
            <div className="next-level">
              {showLevelComplete.isNextLevelUnlock 
                ? `Unlocked: Level ${showLevelComplete.nextLevel}!`
                : `Next Level: ${showLevelComplete.nextLevel}`}
            </div>
            <div className="level-complete-buttons">
              <button 
                className="cyberpunk-button"
                onClick={() => {
                  setShowLevelComplete(null);
                  onExit();
                }}
              >
                Back to Roadmap
              </button>
              <button 
                className="cyberpunk-button primary"
                onClick={() => {
                  setShowLevelComplete(null);
                  onStartGame(false);
                }}
              >
                {showLevelComplete.isNextLevelUnlock ? 'Play Unlocked Level' : 'Play Next Level'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Game 