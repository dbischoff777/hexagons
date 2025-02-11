import { SeasonalTheme } from '../types/progression';

export const SEASONAL_THEMES: SeasonalTheme[] = [
  {
    id: 'spring2024',
    name: '🌸 Cherry Blossom',
    description: 'Limited spring theme with sakura colors',
    startDate: '2023-01-01',
    endDate: '2025-12-31',
    colors: {
      background: '#2D1832',
      primary: '#FFB7E0',
      secondary: '#9C4670',
      accent: '#FF80B0'
    },
    icon: '🌸'
  },
  {
    id: 'neon2023',
    name: '💫 Cosmic Neon',
    description: 'Limited cosmic theme with vibrant neon colors',
    startDate: '2023-01-01',
    endDate: '2025-12-31',
    colors: {
      background: '#0F0F2D',
      primary: '#FF00FF',
      secondary: '#4D0F99',
      accent: '#00FFFF'
    },
    icon: '💫'
  },
  {
    id: 'winter2023',
    name: '❄️ Winter Frost',
    description: 'Limited winter theme with icy colors',
    startDate: '2023-11-01',
    endDate: '2025-02-29',
    colors: {
      background: '#0B1B3D',
      primary: '#80FFFF',
      secondary: '#3D6B99',
      accent: '#FFFFFF'
    },
    icon: '❄️'
  },
  // Add more seasonal themes as needed
];

export const getActiveSeasonalThemes = (): SeasonalTheme[] => {
  const now = new Date();
  console.log('Checking seasonal themes:', {
    currentDate: now,
    themes: SEASONAL_THEMES.map(theme => ({
      id: theme.id,
      startDate: new Date(theme.startDate),
      endDate: new Date(theme.endDate),
      isActive: now >= new Date(theme.startDate) && now <= new Date(theme.endDate)
    }))
  });

  return SEASONAL_THEMES.filter(theme => {
    const start = new Date(theme.startDate);
    const end = new Date(theme.endDate);
    return now >= start && now <= end;
  });
}; 