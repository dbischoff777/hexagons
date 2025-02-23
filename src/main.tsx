import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { getPlayerProgress, getTheme } from './utils/progressionUtils'

// Initialize theme from player progress
const playerProgress = getPlayerProgress();
const theme = getTheme(playerProgress.selectedTheme || 'default');

// Set initial CSS variables
const root = document.documentElement;
root.style.setProperty('--theme-primary', theme.colors.primary);
root.style.setProperty('--theme-secondary', theme.colors.secondary);
root.style.setProperty('--theme-accent', theme.colors.accent);
root.style.setProperty('--theme-background', theme.colors.background);
root.style.setProperty('--theme-text', theme.colors.text);

// Set scrollbar theme variables
root.style.setProperty('--scrollbar-thumb', theme.colors.primary);
root.style.setProperty('--scrollbar-track', `${theme.colors.background}40`);
root.style.setProperty('--scrollbar-hover', `${theme.colors.primary}CC`);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
