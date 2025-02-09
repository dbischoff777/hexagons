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
  
  // Calculate new total score for average calculation
  const newTotalScore = (currentStats.totalScore || 0) + (stats.totalScore || 0)
  const newGamesPlayed = (currentStats.gamesPlayed || 0) + (stats.gamesPlayed || 0)
  
  const updatedStats = {
    ...currentStats,
    ...stats,
    gamesPlayed: newGamesPlayed,
    totalScore: newTotalScore,
    averageScore: newGamesPlayed > 0 ? Math.round(newTotalScore / newGamesPlayed) : 0,
    totalPlayTime: (currentStats.totalPlayTime || 0) + (stats.totalPlayTime || 0),
    highScore: Math.max(currentStats.highScore || 0, stats.highScore || 0),
    longestCombo: Math.max(currentStats.longestCombo || 0, stats.longestCombo || 0),
    lastPlayed: stats.lastPlayed || currentStats.lastPlayed
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