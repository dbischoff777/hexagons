import { ColorScheme } from '../types/colors';

// Define the pattern type
interface ColorPatterns {
  [key: string]: string;
}

// No need for local ColorScheme interface since we import it

// Extended interface for colorblind scheme
interface ColorBlindScheme extends ColorScheme {
  patterns?: ColorPatterns;
}

// Update DEFAULT_SCHEME to match the interface
export const DEFAULT_SCHEME: ColorScheme = {
  name: 'default',
  colors: {
    background: '#1a1a2e',
    primary: '#00FF9F',
    secondary: '#00CCFF',
    accent: '#FF1177',
    text: '#FFFFFF'
  }
};

// Update colorblind scheme to match the interface
export const COLORBLIND_SCHEME: ColorScheme = {
  name: 'colorblind',
  colors: {
    background: '#1a1a2e',
    primary: '#FF8B8B',   // Light Red
    secondary: '#FFD700', // Gold
    accent: '#4FB477',    // Sage Green
    text: '#FFFFFF'
  },
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
    `
  }
} 