interface Profile {
  name: string;
  avatar: string;
  stats: {
    gamesPlayed: number;
    highScore: number;
    totalScore: number;
    gridClears: number;
  };
  achievements: string[];
  // Add new fields for Firebase auth
  uid?: string;
  email?: string;
  photoURL?: string;
}

export type { Profile }; 