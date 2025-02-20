import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HexPuzzlePiece, drawHexImageTile, createHexPuzzle } from '../utils/hexImageUtils';
import { hexToPixel } from '../utils/hexUtils';
import { loadAndTileSvg } from '../utils/svgTileUtils';
import './HexPuzzleMode.css';
import SpringModal from './SpringModal';
import LevelProgress from './LevelProgress';
import { PlayerProgress } from '../types/progression';
import { getPlayerProgress } from '../utils/progressionUtils';
import Particles from './Particles';
import PreventContextMenu from './PreventContextMenu';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { DEFAULT_SCHEME } from '../utils/colorSchemes';
import { getTheme } from '../utils/progressionUtils';
import { updateStatistics } from '../utils/gameStateUtils';
import ScorePopup from './ScorePopup';
import { ScorePopupData } from '../types/scorePopup';
import cuteFrenchie from '../assets/images/cuteFrenchie.jpg';
import cutePuppy from '../assets/images/cutePuppy.jpg';
import unicorn from '../assets/images/unicorn.jpg';
import unicornColor from '../assets/images/unicornColor.jpg';
import spaceman from '../assets/images/spaceman.svg';
import spacemanColor from '../assets/images/spacemanColor.jpg';
import spacegirl from '../assets/images/spacegirl.svg';
import shroomColor from '../assets/images/shroomColor.jpg';
import { generateValidPositions } from '../utils/svgTileUtils';

// Define an interface for puzzle images
interface PuzzleImage {
  id: string;
  src: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description?: string;
  type?: 'jpg' | 'svg';
}

// Create an array of available puzzle images
const PUZZLE_IMAGES: PuzzleImage[] = [
  {
    id: 'cuteFrenchie',
    src: cuteFrenchie,
    name: 'Cute Frenchie',
    difficulty: 'easy',
    description: 'A cute French Bulldog portrait',
    type: 'jpg'
  },
  {
    id: 'cutePuppy',
    src: cutePuppy,
    name: 'Cute Puppy',
    difficulty: 'medium',
    description: 'A cute puppy portrait',
    type: 'jpg'
  },
  {
    id: 'unicorn',
    src: unicorn,
    name: 'Unicorn',
    difficulty: 'hard',
    type: 'jpg'
  },
  {
    id: 'unicornColor',
    src: unicornColor,
    name: 'Unicorn Color',
    difficulty: 'hard',
  },
  {
    id: 'spaceman',
    src: spaceman,
    name: 'Spaceman',
    difficulty: 'hard',
  },  
  {
    id: 'spacemanColor',
    src: spacemanColor,
    name: 'Spaceman Color',
    difficulty: 'hard',
  },
  {
    id: 'spacegirl',
    src: spacegirl,
    name: 'Spacegirl',
    difficulty: 'hard',
  },    
  {
    id: 'shroomColor',
    src: shroomColor,
    name: 'Shroom Color',
    difficulty: 'hard',
  },
];

interface HexPuzzleModeProps {
  onComplete: () => void;
  onExit: () => void;
}

// Add this helper function near the top of the file
const createNormalizedSvgUrl = (svgUrl: string): Promise<string> => {
  return fetch(svgUrl)
    .then(response => response.text())
    .then(svgText => {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;

      // Normalize colors in the SVG
      const normalizeElement = (element: Element) => {
        element.removeAttribute('style');
        element.setAttribute('fill', '#000000');
        element.setAttribute('fill-opacity', '1');
        element.setAttribute('stroke', 'none');
      };

      // Process all elements including the root
      normalizeElement(svgElement);
      const elements = svgElement.getElementsByTagName('*');
      for (let i = 0; i < elements.length; i++) {
        normalizeElement(elements[i]);
      }

      // Create a blob URL for the normalized SVG
      const normalizedSvg = new XMLSerializer().serializeToString(svgDoc);
      const blob = new Blob([normalizedSvg], { type: 'image/svg+xml' });
      return URL.createObjectURL(blob);
    });
};

// Add these interfaces at the top of the file
interface PuzzleFilter {
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
}

const HexPuzzleMode: React.FC<HexPuzzleModeProps> = ({ onComplete, onExit }) => {
  const [gridRadius, setGridRadius] = useState(5); // Default to 5 rings
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement>(null);
  const [pieces, setPieces] = useState<HexPuzzlePiece[]>([]);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isPuzzleStarted, setIsPuzzleStarted] = useState(false);
  const [allTileOptions, setAllTileOptions] = useState<HexPuzzlePiece[]>([]);
  const [visibleTileOptions, setVisibleTileOptions] = useState<HexPuzzlePiece[]>([]);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ x: number, y: number } | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress>(() => getPlayerProgress());
  const [score, setScore] = useState(0);
  // Get accessibility settings
  const { settings } = useAccessibility();
  const isColorBlind = settings.isColorBlind;
  const currentScheme = DEFAULT_SCHEME;

  // Get theme from player progress
  const progress = getPlayerProgress();
  const theme = getTheme(progress.selectedTheme || 'default');

  // Use color scheme based on accessibility settings
  const colors = isColorBlind ? currentScheme.colors : DEFAULT_SCHEME.colors;
  // Update particle color to use theme or colorblind colors
  const [particleIntensity] = useState(0.5);
  const particleColor = isColorBlind ? colors[2] : theme.colors.primary;

  // Update the tile size and canvas dimensions
  const tileSize = 35; // Keep the tile size constant
  const canvasWidth = 1000;
  const canvasHeight = 1000;
  
  // Update valid positions to include all fifth ring positions
  const validPositions = useMemo(() => generateValidPositions(gridRadius), [gridRadius]);

  // Add scoring constants
  const SCORING = {
    correctPlacement: 100,
    gridClear: 4000,
    combo: {
      base: 50,
      multiplier: 1.5
    }
  };

  // Add XP constants similar to Game.tsx
  const XP_REWARDS = {
    correctPlacement: 100,
    puzzleCompletion: 500
  };

  // Add this array at the top of the component
  const PLACEMENT_MESSAGES = [
    { text: "Perfect!", emojis: "✨ 🎯" },
    { text: "Excellent!", emojis: "🌟 ⭐" },
    { text: "Great Move!", emojis: "💫 ✨" },
    { text: "Spot On!", emojis: "🎯 ✨" },
    { text: "Brilliant!", emojis: "💫 🌟" },
    { text: "Amazing!", emojis: "⭐ ✨" },
    { text: "Fantastic!", emojis: "🌟 💫" },
    { text: "Well Done!", emojis: "✨ ⭐" },
    { text: "Superb!", emojis: "🎯 💫" },
    { text: "Outstanding!", emojis: "⭐ 🌟" }
  ];

  // Add wrong placement messages array
  const WRONG_PLACEMENT_MESSAGES = [
    { text: "Not Quite!", emojis: "❌ 🤔" },
    { text: "Try Again!", emojis: "💫 🎯" },
    { text: "Almost!", emojis: "👀 ✨" },
    { text: "Keep Trying!", emojis: "💪 ⚡" },
    { text: "Wrong Spot!", emojis: "🔄 💭" },
    { text: "Misplaced!", emojis: "🎲 🔍" },
    { text: "Not There!", emojis: "❓ 💫" },
    { text: "Different Spot!", emojis: "🔄 ✨" }
  ];

  // Add state for tracking significant pieces
  const [totalSignificantPieces, setTotalSignificantPieces] = useState(0);
  const [placedSignificantPieces, setPlacedSignificantPieces] = useState(0);

  // Add state for tracking completion statistics
  const [startTime, setStartTime] = useState<number | null>(null);
  const [completionStats, setCompletionStats] = useState({
    timeTaken: 0,
    totalPieces: 0,
    score: 0
  });

  // Add state for score popups
  const [scorePopups, setScorePopups] = useState<ScorePopupData[]>([]);

  // Add state to track current puzzle
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleImage | null>(null);
  const [selectedPuzzle, setSelectedPuzzle] = useState<PuzzleImage | null>(null);

  // Load image and initialize puzzle
  useEffect(() => {
    if (!currentPuzzle || !isPuzzleStarted) return;

    const loadImage = async () => {
      try {
        let imageUrl;
        if (currentPuzzle.type === 'svg') {
          const tiledSvg = await loadAndTileSvg(currentPuzzle.src, tileSize, gridRadius);
          const svgBlob = new Blob([tiledSvg], { type: 'image/svg+xml' });
          imageUrl = URL.createObjectURL(svgBlob);
        } else {
          imageUrl = currentPuzzle.src;
        }

        const img = new Image();
        img.onload = async () => {
          try {
            const gridPixelWidth = tileSize * Math.sqrt(3) * (gridRadius * 2);
            
            const { pieces: puzzlePieces, scaledImage } = await createHexPuzzle(
              img,
              tileSize,
              {
                targetWidth: gridPixelWidth,
                targetHeight: gridPixelWidth,
                maintainAspectRatio: false
              },
              validPositions
            );

            setImage(scaledImage);
            
            // Clear any existing pieces and options
            setAllTileOptions([]);
            setVisibleTileOptions([]);
            setPieces([]);
            
            // Get only the unsolved (significant) pieces for tile options
            const significantPieces = puzzlePieces.filter(piece => {
              const isSignificant = !piece.isSolved;
              console.debug(`Filtering piece ${piece.id}:`, {
                position: `q:${piece.correctPosition.q}, r:${piece.correctPosition.r}`,
                isSolved: piece.isSolved,
                isSignificant
              });
              return isSignificant;
            });
            
            console.debug('Filtered pieces:', {
              total: puzzlePieces.length,
              significant: significantPieces.length,
              solved: puzzlePieces.filter(p => p.isSolved).length
            });
            
            // Initialize tile options with ONLY significant pieces
            const shuffledPieces = [...significantPieces].sort(() => Math.random() - 0.5);
            setAllTileOptions(shuffledPieces);
            
            // Set first 3 significant pieces as visible options
            setVisibleTileOptions(shuffledPieces.slice(0, 3));

            // Initialize all pieces (including empty ones that are already solved)
            setPieces(puzzlePieces);

            // Set total significant pieces count
            setTotalSignificantPieces(significantPieces.length);
            setPlacedSignificantPieces(0);

          } catch (error) {
            console.error('Error creating puzzle:', error);
          }
        };

        img.src = imageUrl;
      } catch (error) {
        console.error('Error loading or processing image:', error);
      }
    };

    loadImage();
  }, [currentPuzzle, isPuzzleStarted, tileSize, gridRadius, validPositions]);

  // Update the pixelToHex function
  const pixelToHex = (x: number, y: number, centerX: number, centerY: number, size: number) => {
    // Convert to relative coordinates from center
    const relX = (x - centerX) / size;
    const relY = (y - centerY) / size;

    // Convert to axial coordinates using flat-topped hex formula
    const q = (2/3 * relX);
    const r = (-1/3 * relX + Math.sqrt(3)/3 * relY);

    // Use cube coordinates for better rounding
    let rx = q;
    let ry = r;
    let rz = -rx-ry;

    // Round cube coordinates
    let x_round = Math.round(rx);
    let y_round = Math.round(ry);
    let z_round = Math.round(rz);

    // Fix rounding errors
    const x_diff = Math.abs(x_round - rx);
    const y_diff = Math.abs(y_round - ry);
    const z_diff = Math.abs(z_round - rz);

    if (x_diff > y_diff && x_diff > z_diff) {
      x_round = -y_round-z_round;
    } else if (y_diff > z_diff) {
      y_round = -x_round-z_round;
    } else {
      z_round = -x_round-y_round;
    }

    // Convert back to axial coordinates
    return {
      q: x_round,
      r: y_round
    };
  };

  // Update the handleCanvasClick function
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = gameCanvasRef.current;
    if (!canvas || !isPuzzleStarted) return;

    const rect = canvas.getBoundingClientRect();
    
    // Calculate scale factors
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Apply scaling to get the correct canvas coordinates
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    // Convert pixel coordinates to hex coordinates
    const gridPosition = pixelToHex(
      x,
      y,
      canvas.width/2,
      canvas.height/2,
      tileSize // Remove the 0.8 scale factor
    );

    // Check if the position is valid
    const isValidPosition = validPositions.some(([q, r]) => 
      q === gridPosition.q && r === gridPosition.r
    );

    if (selectedTileIndex !== null && isValidPosition) {
      placeTileOnGrid(selectedTileIndex, gridPosition);
      setSelectedTileIndex(null);
    }
  };

  // Background canvas - draw grid and image pieces together
  useEffect(() => {
    const canvas = backgroundCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Calculate center position
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // Update hex cell colors with darker values
    const hexBorderColor = `rgba(255, 255, 255, 0.15)`;
    const hexGlowColor = `rgba(255, 255, 255, 0.05)`;

    validPositions.forEach(([q, r]) => {
      const { x, y } = hexToPixel(q, r, centerX, centerY, tileSize);
      
      // Find the piece at this position
      const piece = pieces.find(p => 
        p.correctPosition.q === q && p.correctPosition.r === r
      );

      // Draw hex cell background and grid
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const pointX = x + tileSize * Math.cos(angle);
        const pointY = y + tileSize * Math.sin(angle);
        if (i === 0) ctx.moveTo(pointX, pointY);
        else ctx.lineTo(pointX, pointY);
      }
      ctx.closePath();

      // Darker background for all tiles
      const gradient = ctx.createRadialGradient(
        x, y, 0,
        x, y, tileSize
      );
      gradient.addColorStop(0, 'rgba(26, 26, 46, 0.9)');
      gradient.addColorStop(1, 'rgba(26, 26, 46, 0.6)');
      ctx.fillStyle = gradient;
      ctx.fill();

      // Regular glow for all tiles
      ctx.strokeStyle = hexGlowColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw hex border
      ctx.strokeStyle = hexBorderColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw the image piece if it exists
      if (image && piece) {
        if (isPuzzleStarted && !piece.isSolved) {
          ctx.globalAlpha = 0.4;
        } else {
          ctx.globalAlpha = 1.0;
        }
        drawHexImageTile(
          ctx,
          image,
          piece,
          x,
          y,
          tileSize
        );
        ctx.globalAlpha = 1.0;

        // Add highlight effect for correctly placed pieces
        const isCorrectlyPlaced = 
          piece.currentPosition.q === piece.correctPosition.q && 
          piece.currentPosition.r === piece.correctPosition.r &&
          piece.isSolved; // Add this condition to ensure it's a solved piece

        if (isCorrectlyPlaced) {
          // Use theme color for the glow
          const glowColor = isColorBlind ? colors[2] : theme.colors.primary;
          
          // Add outer glow with increased intensity
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 20;  // Increased from 15
          
          // Draw hex outline with glow
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const pointX = x + tileSize * Math.cos(angle);
            const pointY = y + tileSize * Math.sin(angle);
            if (i === 0) ctx.moveTo(pointX, pointY);
            else ctx.lineTo(pointX, pointY);
          }
          ctx.closePath();
          
          // Add radial gradient highlight with adjusted opacities
          const highlightGradient = ctx.createRadialGradient(
            x, y, 0,
            x, y, tileSize * 1.2
          );
          highlightGradient.addColorStop(0, `${glowColor}4D`);  // 30% opacity
          highlightGradient.addColorStop(0.4, `${glowColor}33`); // 20% opacity
          highlightGradient.addColorStop(0.8, `${glowColor}1A`); // 10% opacity
          highlightGradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = highlightGradient;
          ctx.fill();
          
          // Add bright border with pulsing effect
          const time = Date.now() * 0.001; // Convert to seconds
          const pulseIntensity = 0.7 + 0.3 * Math.sin(time * 2); // Pulse between 0.7 and 1.0
          
          ctx.strokeStyle = `${glowColor}${Math.floor(pulseIntensity * 255).toString(16).padStart(2, '0')}`; // Dynamic opacity
          ctx.lineWidth = 3;
          ctx.stroke();
          
          // Reset shadow
          ctx.shadowBlur = 0;
        }
      }
    });

    ctx.restore();
  }, [image, pieces, isPuzzleStarted, tileSize, canvasWidth, canvasHeight]);

  // Game canvas - draw only active/selected pieces
  useEffect(() => {
    const canvas = gameCanvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw preview at cursor position if tile is selected
    if (selectedTileIndex !== null && cursorPosition) {
      const selectedTile = visibleTileOptions[selectedTileIndex];
      if (selectedTile) {
        ctx.save();
        
        ctx.globalAlpha = 0.8;
        ctx.shadowColor = 'rgba(0, 255, 159, 0.6)';
        ctx.shadowBlur = 25;
        
        // Draw at cursor position
        drawHexImageTile(
          ctx,
          image,
          selectedTile,
          cursorPosition.x,
          cursorPosition.y,
          tileSize
        );

        // Add hex outline
        ctx.strokeStyle = 'rgba(0, 255, 159, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const pointX = cursorPosition.x + tileSize * Math.cos(angle);
          const pointY = cursorPosition.y + tileSize * Math.sin(angle);
          if (i === 0) ctx.moveTo(pointX, pointY);
          else ctx.lineTo(pointX, pointY);
        }
        ctx.closePath();
        ctx.stroke();
        
        ctx.restore();
      }
    }

    ctx.restore();
  }, [image, selectedTileIndex, cursorPosition, visibleTileOptions]);

  // Update placeTileOnGrid to track significant piece placement
  const placeTileOnGrid = (tileIndex: number, position: { q: number, r: number } | null) => {
    if (!position) return;

    const selectedTile = visibleTileOptions[tileIndex];
    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    
    // Get the position for the popup
    const rect = canvas.getBoundingClientRect();
    const { x, y } = hexToPixel(
      position.q,
      position.r,
      canvas.width/2,
      canvas.height/2,
      tileSize
    );
    
    // Convert canvas coordinates to screen coordinates
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    const screenX = rect.left + (x * scaleX);
    const screenY = rect.top + (y * scaleY);

    // Check if placement is correct
    const isCorrectPlacement = 
      position.q === selectedTile.correctPosition.q && 
      position.r === selectedTile.correctPosition.r;

    if (isCorrectPlacement) {
      // Get random success message
      const message = PLACEMENT_MESSAGES[Math.floor(Math.random() * PLACEMENT_MESSAGES.length)];

      // Add success popup
      const popup: ScorePopupData = {
        id: Date.now(),
        x: screenX,
        y: screenY,
        score: SCORING.correctPlacement,
        text: message.text,
        emoji: message.emojis,
        type: "score"
      };

      setScorePopups(prev => [...prev, popup]);

      // Remove popup after animation
      setTimeout(() => {
        setScorePopups(prev => prev.filter(p => p.id !== popup.id));
      }, 2000);

      // Update placed pieces count
      setPlacedSignificantPieces(prev => prev + 1);

      // Update pieces state with correct placement
      setPieces(prevPieces => {
        const newPieces = [...prevPieces];
        const pieceIndex = newPieces.findIndex(p => p.id === selectedTile.id);
        if (pieceIndex !== -1) {
          newPieces[pieceIndex] = {
            ...selectedTile,
            currentPosition: position,
            isSolved: true
          };
        }
        return newPieces;
      });

      // Handle scoring and XP for correct placement
      setScore(prevScore => {
        const newScore = prevScore + SCORING.correctPlacement;
        
        // Update player progress with XP reward
        const updatedProgress = {
          ...playerProgress,
          experience: playerProgress.experience + XP_REWARDS.correctPlacement
        };
        
        // Check if player leveled up
        if (updatedProgress.experience >= playerProgress.experienceToNext) {
          updatedProgress.level += 1;
          updatedProgress.experience -= playerProgress.experienceToNext;
          updatedProgress.experienceToNext = Math.floor(playerProgress.experienceToNext * 1.5);
          
          // Show level up popup
          const levelUpPopup: ScorePopupData = {
            id: Date.now() + 1, // Ensure unique ID
            x: screenX,
            y: screenY - 50, // Show above the score popup
            score: 0,
            text: `Level ${updatedProgress.level}!`,
            emoji: "🎮 ⭐",
            type: "score"
          };
          
          setScorePopups(prev => [...prev, levelUpPopup]);
          
          // Remove level up popup after animation
          setTimeout(() => {
            setScorePopups(prev => prev.filter(p => p.id !== levelUpPopup.id));
          }, 2000);
        }
        
        setPlayerProgress(updatedProgress);
        return newScore;
      });

      // Remove the correctly placed tile from options
      setAllTileOptions(prev => prev.filter(t => t.id !== selectedTile.id));
      setVisibleTileOptions(prev => {
        const newVisible = prev.filter(t => t.id !== selectedTile.id);
        // Add next tile if available
        if (allTileOptions.length > prev.length) {
          const nextTile = allTileOptions.find(t => 
            !prev.some(p => p.id === t.id) && t.id !== selectedTile.id
          );
          if (nextTile) {
            newVisible.push(nextTile);
          }
        }
        return newVisible;
      });

      // Check if all significant pieces have been placed correctly
      if (placedSignificantPieces + 1 === totalSignificantPieces) {
        const endTime = Date.now();
        const timeTaken = startTime ? (endTime - startTime) / 1000 : 0;
        
        const finalScore = score + SCORING.gridClear;
        
        // Calculate completion statistics - remove emptyPieces
        setCompletionStats({
          timeTaken,
          totalPieces: totalSignificantPieces, // Only count significant pieces
          score: finalScore
        });

        // Update game statistics with correct properties
        updateStatistics({
          highScore: finalScore,
          totalPlayTime: Math.round(timeTaken),
          gamesPlayed: 1, // Use gamesPlayed instead of gamesCompleted
          lastPlayed: new Date().toISOString()
        });

        // Update puzzle completion to include bonus XP
        setScore(prevScore => {
          const updatedScore = prevScore + SCORING.gridClear;
          
          // Add completion XP bonus
          const updatedProgress = {
            ...playerProgress,
            experience: playerProgress.experience + XP_REWARDS.puzzleCompletion
          };
          
          // Check for level up
          if (updatedProgress.experience >= playerProgress.experienceToNext) {
            updatedProgress.level += 1;
            updatedProgress.experience -= playerProgress.experienceToNext;
            updatedProgress.experienceToNext = Math.floor(playerProgress.experienceToNext * 1.5);
          }
          
          setPlayerProgress(updatedProgress);
          return updatedScore;
        });
        
        setIsPuzzleStarted(false);
        setShowCompletionModal(true);
      }
    } else {
      // Get random wrong placement message
      const message = WRONG_PLACEMENT_MESSAGES[Math.floor(Math.random() * WRONG_PLACEMENT_MESSAGES.length)];

      // Add wrong placement popup
      const popup: ScorePopupData = {
        id: Date.now(),
        x: screenX,
        y: screenY,
        score: 0,
        text: message.text,
        emoji: message.emojis,
        type: "wrong"
      };

      setScorePopups(prev => [...prev, popup]);

      // Remove popup after animation
      setTimeout(() => {
        setScorePopups(prev => prev.filter(p => p.id !== popup.id));
      }, 2000);

      // Return tile to options list
      setVisibleTileOptions(prev => {
        const newVisible = [...prev];
        // Remove from current position
        newVisible.splice(tileIndex, 1);
        // Add back to a random position in visible tiles
        const insertIndex = Math.floor(Math.random() * (newVisible.length + 1));
        newVisible.splice(insertIndex, 0, selectedTile);
        return newVisible;
      });
    }
  };

  // Draw next tile options
  const drawNextTileOption = (
    ctx: CanvasRenderingContext2D,
    tile: HexPuzzlePiece,
    isSelected: boolean
  ) => {
    ctx.save();
    
    // Add glow effect
    ctx.shadowColor = 'rgba(0, 255, 159, 0.4)';
    ctx.shadowBlur = isSelected ? 20 : 15;
    
    // Draw the tile image
    drawHexImageTile(
      ctx,
      image!, // Add non-null assertion since we know image is loaded at this point
      tile,
      50,  // Center X of the canvas
      50,  // Center Y of the canvas
      tileSize * 0.8  // Slightly smaller for next tiles
    );

    // Add selection indicator
    if (isSelected) {
      ctx.strokeStyle = 'rgba(0, 255, 159, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(50, 50, 42, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Add hover effect
    if (isSelected) {
      const gradient = ctx.createRadialGradient(50, 50, 0, 50, 50, 50);
      gradient.addColorStop(0, 'rgba(0, 255, 159, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 255, 159, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(50, 50, 45, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  // Apply theme colors to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--background-gradient', `linear-gradient(180deg, 
      ${theme.colors.background}F2 0%,
      ${theme.colors.background}FA 100%
    )`);
    root.style.setProperty('--primary-color', theme.colors.primary);
    root.style.setProperty('--secondary-color', theme.colors.secondary);
    root.style.setProperty('--accent-color', theme.colors.accent);
  }, [theme]);

  // Update puzzle start logic
  const handlePuzzleSelect = (puzzle: PuzzleImage) => {
    setSelectedPuzzle(puzzle);
    setCurrentPuzzle(puzzle);
  };

  // Define RingSelector component inside main component
  const RingSelector: React.FC<{
    value: number;
    onChange: (rings: number) => void;
  }> = ({ value, onChange }) => {
    return (
      <div className="ring-selector">
        <label>Grid Size</label>
        <div className="ring-controls">
          <button 
            onClick={() => onChange(Math.max(2, value - 1))}
            disabled={value <= 2}
            aria-label="Decrease grid size"
          >
            −
          </button>
          <span>{value} Rings</span>
          <button 
            onClick={() => onChange(Math.min(7, value + 1))}
            disabled={value >= 7}
            aria-label="Increase grid size"
          >
            +
          </button>
        </div>
        <div className="info-text">
          {value === 2 ? "Easiest" : value === 7 ? "Hardest" : ""}
          {value > 2 && value < 7 && `${value * value * 3} pieces`}
        </div>
      </div>
    );
  };

  // Define PuzzleSelector component inside main component
  const PuzzleSelector: React.FC<{
    onSelect: (puzzle: PuzzleImage) => void;
    theme: any;
    isColorBlind: boolean;
    colors: string[];
    ringCount: number;
    onRingChange: (rings: number) => void;
  }> = ({ onSelect, theme, isColorBlind, colors, ringCount, onRingChange }) => {
    const [normalizedUrls, setNormalizedUrls] = useState<Record<string, string>>({});
    const [filter, setFilter] = useState<PuzzleFilter>({ difficulty: 'all' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6; // Adjust based on screen size

    // Create normalized URLs for all puzzle images
    useEffect(() => {
      const loadNormalizedUrls = async () => {
        const urls: Record<string, string> = {};
        for (const puzzle of PUZZLE_IMAGES) {
          if (puzzle.type === 'svg') {
            urls[puzzle.id] = await createNormalizedSvgUrl(puzzle.src);
          } else {
            urls[puzzle.id] = puzzle.src; // Use JPG directly
          }
        }
        setNormalizedUrls(urls);
      };

      loadNormalizedUrls();
      return () => {
        Object.values(normalizedUrls).forEach(url => {
          if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
      };
    }, []);

    // Filter and paginate puzzles
    const filteredPuzzles = PUZZLE_IMAGES.filter(puzzle => {
      return filter.difficulty === 'all' || puzzle.difficulty === filter.difficulty;
    });

    const totalPages = Math.ceil(filteredPuzzles.length / itemsPerPage);
    const paginatedPuzzles = filteredPuzzles.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

    // Handle keyboard navigation
    const handleKeyNavigation = (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          setCurrentPage(prev => Math.max(1, prev - 1));
          break;
        case 'ArrowRight':
          setCurrentPage(prev => Math.min(totalPages, prev + 1));
          break;
        case 'Home':
          setCurrentPage(1);
          break;
        case 'End':
          setCurrentPage(totalPages);
          break;
      }
    };

    return (
      <div 
        className="puzzle-selector"
        role="region" 
        aria-label="Puzzle Selection Menu"
        onKeyDown={handleKeyNavigation}
      >
        <h2 className="puzzle-selector-title">Select a Puzzle</h2>
        
        {/* Add ring selector before filters */}
        <RingSelector value={ringCount} onChange={onRingChange} />
        
        <div className="puzzle-filters">
          <div className="difficulty-filters" role="radiogroup" aria-label="Filter by difficulty">
            {['all', 'easy', 'medium', 'hard'].map((difficulty) => (
              <button
                key={difficulty}
                className={`difficulty-filter ${filter.difficulty === difficulty ? 'active' : ''}`}
                onClick={() => {
                  setFilter({ difficulty: difficulty as PuzzleFilter['difficulty'] });
                  setCurrentPage(1);
                }}
                aria-pressed={filter.difficulty === difficulty}
              >
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Show results summary */}
        <div className="results-summary" aria-live="polite">
          {filteredPuzzles.length === 0 ? (
            <p>No puzzles found matching your criteria</p>
          ) : (
            <p>Showing {paginatedPuzzles.length} of {filteredPuzzles.length} puzzles</p>
          )}
        </div>

        <div 
          className="puzzle-grid"
          role="list"
          aria-label="Available Puzzles"
        >
          {paginatedPuzzles.map((puzzle) => (
            <button 
              key={puzzle.id}
              className="puzzle-card"
              onClick={() => onSelect(puzzle)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelect(puzzle);
                }
              }}
              style={{
                '--card-glow': isColorBlind ? colors[2] : theme.colors.primary
              } as React.CSSProperties}
              role="listitem"
              aria-label={`${puzzle.name} - ${puzzle.difficulty} difficulty${puzzle.description ? ` - ${puzzle.description}` : ''}`}
            >
              <div className="puzzle-preview" aria-hidden="true">
                {normalizedUrls[puzzle.id] ? (
                  <img 
                    src={normalizedUrls[puzzle.id]} 
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <div className="loading-placeholder" />
                )}
              </div>
              <div className="puzzle-info">
                <h3>{puzzle.name}</h3>
                <span 
                  className={`difficulty ${puzzle.difficulty}`}
                  aria-label={`Difficulty: ${puzzle.difficulty}`}
                >
                  {puzzle.difficulty.charAt(0).toUpperCase() + puzzle.difficulty.slice(1)}
                </span>
                {puzzle.description && (
                  <p>{puzzle.description}</p>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Add pagination controls */}
        {totalPages > 1 && (
          <div className="pagination-controls" role="navigation" aria-label="Puzzle pages">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              ←
            </button>
            
            <span aria-label={`Page ${currentPage} of ${totalPages}`}>
              {currentPage} / {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              →
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <PreventContextMenu>
      <div className="particles-container">
        <Particles 
          intensity={particleIntensity}
          color={particleColor}
          width={window.innerWidth}
          height={window.innerHeight}
        />
      </div>
      <div 
        className="hex-puzzle-mode"
        style={{
          '--hex-color': isColorBlind ? colors[2] : theme.colors.primary,
          '--accent-color': isColorBlind ? colors[0] : theme.colors.accent,
          '--background-dark': `${theme.colors.background}99`,
        } as React.CSSProperties}
      >
        {!selectedPuzzle ? (
          // Show puzzle selector if no puzzle is selected
          <PuzzleSelector 
            onSelect={handlePuzzleSelect}
            theme={theme}
            isColorBlind={isColorBlind}
            colors={colors}
            ringCount={gridRadius}
            onRingChange={setGridRadius}
          />
        ) : (
          // Show puzzle game once puzzle is selected
          <>
            <LevelProgress progress={playerProgress} />
            <div className="score" data-label="Score">
              <div className="score-value">{score}</div>
            </div>
            <div className="hex-puzzle-board-container">
              <div className="hex-puzzle-game-board">
                <div className="hex-puzzle-canvas-wrapper">
                  <canvas
                    ref={backgroundCanvasRef}
                    width={canvasWidth}
                    height={canvasHeight}
                  />
                  <canvas
                    ref={gameCanvasRef}
                    width={canvasWidth}
                    height={canvasHeight}
                    onClick={handleCanvasClick}
                    onMouseMove={(e) => {
                      const canvas = gameCanvasRef.current;
                      if (!canvas) return;
                      const rect = canvas.getBoundingClientRect();
                      
                      // Get the actual displayed dimensions
                      const displayWidth = rect.width;
                      const displayHeight = rect.height;
                      
                      // Convert screen coordinates to canvas space
                      const scaleX = canvas.width / displayWidth;
                      const scaleY = canvas.height / displayHeight;
                      
                      // Get mouse position in canvas coordinates
                      const mouseX = (e.clientX - rect.left) * scaleX;
                      const mouseY = (e.clientY - rect.top) * scaleY;

                      // Adjust for the canvas scale transformation
                      const adjustedX = mouseX;
                      const adjustedY = mouseY;
                      
                      setCursorPosition({
                        x: adjustedX,
                        y: adjustedY
                      });
                    }}
                    onMouseLeave={() => setCursorPosition(null)}
                  />
                </div>
              </div>
            </div>

            {!isPuzzleStarted ? (
              <button 
                className="hex-puzzle-start-button"
                onClick={() => {
                  setPieces(prevPieces => 
                    prevPieces.map((piece, index) => ({
                      ...piece,
                      currentPosition: { 
                        q: -10,
                        r: index
                      },
                      isSolved: false
                    }))
                  );
                  setIsPuzzleStarted(true);
                  setStartTime(Date.now());
                }}
              >
                Start Puzzle
              </button>
            ) : (
              <div className="hex-puzzle-next-tiles-container">
                <div className="hex-puzzle-next-tiles">
                  {visibleTileOptions.map((tile, index) => (
                    <div 
                      key={tile.id}
                      className={`hex-puzzle-next-tile ${selectedTileIndex === index ? 'selected' : ''}`}
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
                              drawNextTileOption(ctx, tile, selectedTileIndex === index);
                            }
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        
        <button 
          className="hex-puzzle-exit-button" 
          onClick={() => {
            if (isPuzzleStarted) {
              setShowExitModal(true);
            } else {
              // If we're in selection screen, exit directly
              onExit();
            }
          }}
        >
          Exit {isPuzzleStarted ? 'Puzzle' : 'Mode'}
        </button>

        {/* Modals */}
        <SpringModal
          isOpen={showExitModal}
          onClose={() => setShowExitModal(false)}
          title="Exit Puzzle"
          message="Are you sure you want to exit? Your progress will be lost."
          variant="danger"
        >
          <button className="modal-button cancel" onClick={() => setShowExitModal(false)}>
            Stay
          </button>
          <button className="modal-button confirm" onClick={onExit}>
            Exit
          </button>
        </SpringModal>

        <SpringModal
          isOpen={showCompletionModal}
          onClose={() => {
            setShowCompletionModal(false);
            onComplete();
          }}
          title="Puzzle Completed!"
          message={
            <div className="completion-stats">
              <div className="completion-stat">
                <label>Time</label>
                <span>{Math.floor(completionStats.timeTaken / 60)}m {Math.round(completionStats.timeTaken % 60)}s</span>
              </div>
              <div className="completion-stat">
                <label>Score</label>
                <span>{completionStats.score}</span>
              </div>
              <div className="completion-stat">
                <label>Pieces Placed</label>
                <span>{completionStats.totalPieces}</span>
              </div>
            </div>
          }
        >
          <button 
            className="modal-button confirm"
            onClick={() => {
              setShowCompletionModal(false);
              onComplete();
            }}
          >
            Continue
          </button>
        </SpringModal>

        {/* Add score popups */}
        {scorePopups.map(popup => (
          <ScorePopup key={popup.id} popup={popup} />
        ))}
      </div>
    </PreventContextMenu>
  );
};

export default HexPuzzleMode; 