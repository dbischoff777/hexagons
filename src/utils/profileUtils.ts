import { Profile } from '../types/profile';

const PROFILE_KEY = 'hex_puzzle_profile';

export const getProfile = (): Profile => {
  const savedProfile = localStorage.getItem(PROFILE_KEY);
  if (savedProfile) {
    return JSON.parse(savedProfile);
  }

  // Return default profile if none exists
  const defaultProfile: Profile = {
    name: 'Player',
    avatar: '/avatars/default.png',
    stats: {
      gamesPlayed: 0,
      highScore: 0,
      totalScore: 0,
      gridClears: 0
    },
    achievements: []
  };

  return defaultProfile;
};

export const updateProfile = (profile: Profile): void => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};