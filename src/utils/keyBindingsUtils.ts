import { KeyBindings } from '../types';
import { PlacedTile, PowerUpState, ComboState } from '../types';
import { SoundManager } from './soundManager';
import { UpgradeState } from '../types/upgrades';
import { ScorePopupData } from '../types/scorePopup';
import { isGridFull } from '../utils/gameUtils';
import { processPlacementMatches, processGridClearMatches } from './matchingUtils';

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
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
    q = -q;
    r = -r;
  }

  const s = -q - r;
  const isValidPosition = Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= Math.floor(cols/2);
  const isOccupied = placedTiles.some(tile => tile.q === q && tile.r === r);

  if (isValidPosition && !isOccupied) {
    const selectedTile = nextTiles[selectedTileIndex];
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

    // Check for quick placement
    const now = Date.now();
    const timeSinceLastPlacement = now - combo.lastPlacementTime;
    const quickPlacement = timeSinceLastPlacement < 2000;

    // Process matches using centralized logic
    const { matchCount, updatedTiles, matchScore, comboState } = processPlacementMatches(
      newTile,
      placedTiles,
      settings,
      upgradeState,
      powerUps,
      combo,
      quickPlacement
    );

    // Update tiles
    onTilesUpdate(updatedTiles);

    if (matchCount > 0) {
      // Add score popup for matches
      addScorePopup({
        score: matchScore,
        x: centerX,
        y: centerY - 100,
        emoji: '✨',
        text: matchCount === 1 ? 'Edge Match!' : 'Multiple Matches!',
        type: 'score'
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
          type: 'quick'
        });
        onScoreUpdate(matchScore + quickBonus);
      } else {
        onScoreUpdate(matchScore);
      }

      onComboUpdate(comboState);
    }

    // Check for grid-full bonus
    if (isGridFull(updatedTiles, cols)) {
      const matchingTiles = processGridClearMatches(updatedTiles, settings);

      if (matchingTiles.length > 0) {
        if (soundEnabled) {
          SoundManager.getInstance().playSound('match');
        }

        const gridBonus = 1000;
        addScorePopup({
          score: gridBonus,
          x: centerX,
          y: centerY,
          emoji: '🎯',
          text: 'Grid Clear!',
          type: 'clear'
        });

        onScoreUpdate(gridBonus);
        onComboUpdate({
          ...comboState,
          count: comboState.count + 1,
          multiplier: comboState.multiplier * 1.5
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

    onPlacement(newTile);
  }
}; 