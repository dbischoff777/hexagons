import { ColorScheme } from '../types/colors'

// Regular color scheme
export const DEFAULT_SCHEME: ColorScheme = {
  name: 'Default',
  colors: [
    '#FF1177', // Pink
    '#FFE900', // Yellow
    '#00FF9F', // Green
    '#00FFFF', // Cyan
    '#4D4DFF', // Blue
    '#B14FFF'  // Purple
  ]
}

// Color blind friendly scheme
export const COLORBLIND_SCHEME: ColorScheme = {
  name: 'Colorblind',
  colors: [
    '#FF8B8B', // Light Red
    '#FFD700', // Gold
    '#4FB477', // Sage Green
    '#7EC8E3', // Sky Blue
    '#000000', // Black
    '#FFFFFF'  // White
  ],
  patterns: {
    '#FF8B8B': `
      <pattern id="pattern-circles" patternUnits="userSpaceOnUse" width="10" height="10">
        <circle cx="5" cy="5" r="2" fill="currentColor"/>
      </pattern>
    `,
    '#FFD700': `
      <pattern id="pattern-squares" patternUnits="userSpaceOnUse" width="10" height="10">
        <rect x="2" y="2" width="6" height="6" fill="currentColor"/>
      </pattern>
    `,
    '#4FB477': `
      <pattern id="pattern-lines" patternUnits="userSpaceOnUse" width="10" height="10">
        <line x1="0" y1="5" x2="10" y2="5" stroke="currentColor" stroke-width="2"/>
      </pattern>
    `,
    '#7EC8E3': `
      <pattern id="pattern-zigzag" patternUnits="userSpaceOnUse" width="10" height="10">
        <path d="M0 2 L5 8 L10 2" stroke="currentColor" fill="none" stroke-width="2"/>
      </pattern>
    `,
    '#000000': `
      <pattern id="pattern-dots" patternUnits="userSpaceOnUse" width="10" height="10">
        <circle cx="2" cy="2" r="1" fill="currentColor"/>
        <circle cx="8" cy="8" r="1" fill="currentColor"/>
      </pattern>
    `,
    '#FFFFFF': `
      <pattern id="pattern-cross" patternUnits="userSpaceOnUse" width="10" height="10">
        <path d="M3 3 L7 7 M7 3 L3 7" stroke="currentColor" stroke-width="2"/>
      </pattern>
    `
  }
} 