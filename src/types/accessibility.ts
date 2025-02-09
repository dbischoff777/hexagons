export interface AccessibilitySettings {
  isColorBlind: boolean
  showEdgeNumbers: boolean  // Show numbers on edges to help match
  showMatchHints: boolean   // Show visual hints for potential matches
  usePatterns: boolean      // Use patterns instead of/in addition to colors
}

export interface EdgeIndicator {
  position: number  // 0-5 for hexagon edges
  value: string | number  // Allow both symbols and numbers
  color: string
  pattern?: string
  q: number  // Add these coordinates
  r: number
}

export interface MatchHint {
  sourceEdge: EdgeIndicator
  targetEdge: EdgeIndicator
  strength: number  // How good the match is (1-3)
} 