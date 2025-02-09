import { GameState, GameStatistics } from '../types'

const STORAGE_KEYS = {
  SAVED_GAME: 'hexmatch_saved_game',
  STATISTICS: 'hexmatch_statistics'
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

export const updateStatistics = (stats: Partial<GameStatistics>) => {
  const currentStats = getStatistics()
  const updatedStats = {
    ...currentStats,
    ...stats,
    gamesPlayed: (currentStats.gamesPlayed || 0) + (stats.gamesPlayed ? 1 : 0),
    averageScore: stats.totalScore 
      ? Math.round((currentStats.totalScore + stats.totalScore) / (currentStats.gamesPlayed + 1))
      : currentStats.averageScore
  }
  localStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(updatedStats))
  return updatedStats
}

export const getStatistics = (): GameStatistics => {
  const saved = localStorage.getItem(STORAGE_KEYS.STATISTICS)
  return saved ? JSON.parse(saved) : {
    gamesPlayed: 0,
    highScore: 0,
    totalScore: 0,
    totalMatches: 0,
    averageScore: 0,
    longestCombo: 0,
    totalPlayTime: 0,
    lastPlayed: new Date().toISOString()
  }
} 