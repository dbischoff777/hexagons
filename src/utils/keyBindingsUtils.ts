import { KeyBindings } from '../types/index';

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