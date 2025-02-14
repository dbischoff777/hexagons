import { TutorialStep } from '../types/tutorial'

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    message: 'Welcome to HexMatch! Let\'s learn how to play this exciting puzzle game.',
    position: 'center',
    highlightArea: null
  },
  {
    id: 'grid',
    message: 'This is your game grid. You\'ll place hexagonal tiles here to create matches and score points.',
    position: 'center',
    highlightArea: { type: 'grid' }
  },
  {
    id: 'next-pieces',
    message: 'These are your next pieces. Each piece has colored edges that you\'ll need to match with other tiles.',
    position: 'right',
    highlightArea: { type: 'nextPieces' }
  },
  {
    id: 'select-piece',
    message: 'Click on any of these pieces to select it. Try selecting one now!',
    position: 'right',
    highlightArea: { type: 'nextPieces' },
    requiresAction: 'select'
  },
  {
    id: 'rotate',
    message: 'Great! You can rotate the selected piece by right-clicking. Try rotating it a few times!',
    position: 'right',
    requiresAction: 'rotate',
    highlightArea: { type: 'selectedPiece' }
  },
  {
    id: 'place',
    message: 'Now click on any empty hex on the grid to place your piece. Try to match colors with adjacent edges!',
    position: 'center',
    requiresAction: 'place',
    highlightArea: { type: 'validPlacements' }
  },
  {
    id: 'matching',
    message: 'When 1 or more edges of the same color connect, they\'ll match and score points! The more matches, the higher your score.',
    position: 'center',
    highlightArea: { type: 'matches' }
  },
  {
    id: 'powerups',
    message: 'Look out for special tiles with power-ups! ❄️ Freezes time, 🎨 Changes colors, ✨ Doubles points.',
    position: 'center',
    highlightArea: { type: 'powerups' }
  },
  {
    id: 'combos',
    message: 'Making quick matches builds your combo multiplier. Chain matches together for bonus points!',
    position: 'center',
    highlightArea: { type: 'combo' }
  },
  {
    id: 'grid-clear',
    message: 'Fill the grid with tiles, then make matches to clear them for big bonuses!',
    position: 'center',
    highlightArea: { type: 'fullGrid' }
  },
  {
    id: 'complete',
    message: 'You\'re ready to play! Remember: match colors, build combos, and watch out for the grid rotation!',
    position: 'center',
    highlightArea: null
  }
] 