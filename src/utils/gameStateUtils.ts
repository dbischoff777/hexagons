import { GameState } from '../types'
import { GameStatistics } from '../types/index'

const STORAGE_KEYS = {
  SAVED_GAME: 'hexmatch_saved_game',
  STATISTICS: 'hexmatch_statistics'
}


const DEFAULT_STATISTICS: GameStatistics = {
  gamesPlayed: 0,
  totalScore: 0,
  highScore: 0,
  totalPlayTime: 0,
  longestCombo: 0,
  lastPlayed: new Date().toISOString(),
  fastestGameTime: Infinity
}

export const saveGameState = (state: GameState) => {
  localStorage.setItem(STORAGE_KEYS.SAVED_GAME, JSON.stringify(state))
}

export const loadGameState = (): GameState | null => {
  const saved = localStorage.getItem(STORAGE_KEYS.SAVED_GAME)
  return saved ? JSON.parse(saved) : null
}

export const clearSavedGame = () => {
  localStorage.removeItem(STORAGE_KEYS.SAVED_GAME)
}

export const getStatistics = (): GameStatistics => {
  const stored = localStorage.getItem(STORAGE_KEYS.STATISTICS)
  if (!stored) {
    return DEFAULT_STATISTICS
  }
  return JSON.parse(stored)
}

export const updateStatistics = (update: Partial<GameStatistics>) => {
  const current = getStatistics()
  const newStats = {
    ...current,
    ...update
  }
  localStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(newStats))
}