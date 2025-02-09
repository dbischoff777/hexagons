export interface TutorialHighlightArea {
  type: 'grid' | 'nextPieces' | 'selectedPiece' | 'validPlacements' | 'matches' | 'powerups' | 'combo' | 'fullGrid'
}

export interface TutorialStep {
  id: string
  message: string
  position: 'center' | 'right'
  highlightArea: TutorialHighlightArea | null
  requiresAction?: 'select' | 'rotate' | 'place'
}

export interface TutorialState {
  active: boolean
  currentStep: number
  rotationCount: number
  hasPlaced: boolean
} 