import { KeyBindings } from '../types';
import { PlacedTile, PowerUpState, ComboState } from '../types';
import { hasMatchingEdges, updateTileValues, calculateScore } from './matchingUtils';
import { SoundManager } from './soundManager';
import { getAdjacentTiles, getAdjacentDirection } from './hexUtils';
import { UpgradeState } from '../types/upgrades';
import { ScorePopupData, PopupType } from '../types/scorePopup';
import { isGridFull } from '../utils/gameUtils';

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  rotateClockwise: 'e',
  rotateCounterClockwise: 'q',
  selectTile1: '1',
  selectTile2: '2',
  selectTile3: '3'
};

const KEY_BINDINGS_STORAGE_KEY = 'hexagons-key-bindings';

export const loadKeyBindings = (): KeyBindings => {
  const saved = localStorage.getItem(KEY_BINDINGS_STORAGE_KEY);
  return saved ? JSON.parse(saved) : DEFAULT_KEY_BINDINGS;
};

export const saveKeyBindings = (bindings: KeyBindings): void => {
  localStorage.setItem(KEY_BINDINGS_STORAGE_KEY, JSON.stringify(bindings));
};

interface HandleKeyboardPlacementParams {
  currentGridPosition: { q: number; r: number } | null;
  selectedTileIndex: number | null;
  placedTiles: PlacedTile[];
  nextTiles: PlacedTile[];
  cols: number;
  soundEnabled: boolean;
  onPlacement: (newTile: PlacedTile) => void;
  onScoreUpdate: (score: number) => void;
  onComboUpdate: (comboData: ComboState) => void;
  addScorePopup: (data: Omit<ScorePopupData, 'id'>) => void;
  powerUps: PowerUpState;
  combo: ComboState;
  upgradeState: UpgradeState;
  centerX: number;
  centerY: number;
  boardRotation: number;
  settings: { isColorBlind: boolean };
  onTilesUpdate: (tiles: PlacedTile[]) => void;
}

export const handleKeyboardPlacement = ({
  currentGridPosition,
  selectedTileIndex,
  placedTiles,
  nextTiles,
  cols,
  soundEnabled,
  onPlacement,
  onScoreUpdate,
  onComboUpdate,
  addScorePopup,
  powerUps,
  combo,
  upgradeState,
  centerX,
  centerY,
  boardRotation,
  settings,
  onTilesUpdate
}: HandleKeyboardPlacementParams): void => {
  if (selectedTileIndex === null || !currentGridPosition) return;

  // Adjust coordinates based on board rotation
  let { q, r } = currentGridPosition;
  if (Math.abs(boardRotation % 360) >= 90 && Math.abs(boardRotation % 360) < 270) {
    // Board is rotated 180 degrees, invert coordinates
    q = -q;
    r = -r;
  }

  const s = -q - r;

  // Validate position
  const isValidPosition = Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= Math.floor(cols/2);
  const isOccupied = placedTiles.some(tile => tile.q === q && tile.r === r);

  if (isValidPosition && !isOccupied) {
    const selectedTile = nextTiles[selectedTileIndex];
    
    // Create new tile with adjusted coordinates
    const newTile: PlacedTile = {
      ...selectedTile,
      q,
      r,
      isPlaced: true,
      type: selectedTile.type || 'normal',
      value: 0,
      hasBeenMatched: false,
      powerUp: selectedTile.powerUp
    };

    // Create initial tiles with updated values
    const initialPlacedTiles: PlacedTile[] = updateTileValues([...placedTiles, newTile]);

    // Then, in a separate step, mark matched tiles
    const updatedTiles: PlacedTile[] = initialPlacedTiles.map((tile: PlacedTile): PlacedTile => {
      return {
        ...tile,
        hasBeenMatched: tile.hasBeenMatched || hasMatchingEdges(tile, initialPlacedTiles, settings.isColorBlind),
        powerUp: tile.powerUp
      };
    });

    // Update all tiles in the game
    onTilesUpdate(updatedTiles);

    // Get the updated tile with its correct value
    const updatedPlacedTile = updatedTiles.find(tile => tile.q === q && tile.r === r)!;
    
    // Count matching edges
    const adjacentTiles = getAdjacentTiles(updatedPlacedTile, updatedTiles);
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

    if (matchCount > 0) {
      const basePoints = matchCount * 5;
      const matchScore = calculateScore(basePoints, upgradeState, powerUps, combo);

      // Update combo
      const now = Date.now();
      const timeSinceLastPlacement = now - combo.lastPlacementTime;
      const quickPlacement = timeSinceLastPlacement < 2000;

      const newComboState: ComboState = {
        count: quickPlacement ? combo.count + 1 : 1,
        timer: 3,
        multiplier: quickPlacement ? combo.multiplier * 1.5 : 1,
        lastPlacementTime: now
      };

      // Add score popup for matches
      addScorePopup({
        score: matchScore,
        x: centerX,
        y: centerY - 100,
        emoji: '✨',
        text: matchCount === 1 ? 'Edge Match!' : 'Multiple Matches!',
        type: 'score' as PopupType
      });

      // Handle quick placement bonus
      if (quickPlacement) {
        const quickBonus = Math.round(matchScore * 0.2);
        addScorePopup({
          score: quickBonus,
          x: centerX,
          y: centerY + 25,
          emoji: '⚡',
          text: 'Quick!',
          type: 'quick' as PopupType
        });
        onScoreUpdate(matchScore + quickBonus);
      } else {
        onScoreUpdate(matchScore);
      }

      onComboUpdate(newComboState);
    }

    // Check for grid-full bonus only if the grid is actually full
    if (isGridFull(updatedTiles, cols)) {
      const matchingTiles = updatedTiles.filter((tile: PlacedTile) => 
        checkForMatches(tile, updatedTiles, settings)
      );

      // If we have matching tiles and the grid is full, handle the grid-full bonus
      if (matchingTiles.length > 0) {
        // Play match sound
        if (soundEnabled) {
          const soundManager = SoundManager.getInstance();
          soundManager.playSound('match');
        }

        // Add score popup for grid-full bonus
        const gridBonus = 1000; // Base grid clear bonus
        addScorePopup({
          score: gridBonus,
          x: centerX,
          y: centerY,
          emoji: '🎯',
          text: 'Grid Clear!',
          type: 'clear' as PopupType
        });

        // Update score
        onScoreUpdate(gridBonus);

        // Update combo for grid clear
        onComboUpdate({
          ...combo,
          count: combo.count + 1,
          multiplier: combo.multiplier * 1.5,
          lastPlacementTime: Date.now()
        });
      }
    }

    // Play sound effects
    if (soundEnabled) {
      const soundManager = SoundManager.getInstance();
      soundManager.playSound('tilePlaced');
      if (matchCount > 0) {
        soundManager.playSound('match');
      }
    }

    // Call the placement callback with the updated tiles
    onPlacement(newTile);
  }
};

// Add helper function to check for matches
export const checkForMatches = (
  tile: PlacedTile, 
  placedTiles: PlacedTile[], 
  settings: { isColorBlind: boolean }
): boolean => {
  return hasMatchingEdges(tile, placedTiles, settings.isColorBlind);
}; 