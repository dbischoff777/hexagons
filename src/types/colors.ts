export interface ColorScheme {
  name: string
  colors: {
    background: string
    primary: string
    secondary: string
    accent: string
    text: string
  }
  patterns?: {
    [key: string]: string // SVG pattern definitions
  }
}

export interface ColorModeState {
  isColorBlind: boolean
  currentScheme: ColorScheme
} 