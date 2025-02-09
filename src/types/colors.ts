export interface ColorScheme {
  name: string
  colors: string[]
  patterns?: {
    [key: string]: string // SVG pattern definitions
  }
}

export interface ColorModeState {
  isColorBlind: boolean
  currentScheme: ColorScheme
} 