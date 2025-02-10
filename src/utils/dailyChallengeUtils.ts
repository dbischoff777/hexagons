import { DailyChallenge, DailyObjective } from '../types/dailyChallenge';
import { COLORS } from './hexUtils';

const CHALLENGE_STORAGE_KEY = 'hexagon_daily_challenge';

// Generate a deterministic sequence of tiles based on the date
const generateDailySequence = (seed: string): DailyChallenge => {
  const seededRandom = (max: number) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % max);
  };

  const generateEdges = () => {
    return Array.from({ length: 6 }, () => ({
      color: COLORS[seededRandom(COLORS.length)]
    }));
  };

  // Generate initial board configuration
  const initialTiles = [
    { q: 0, r: 0, edges: generateEdges() },
    { q: 1, r: 0, edges: generateEdges() },
    { q: -1, r: 1, edges: generateEdges() }
  ];

  // Generate sequence of next tiles
  const nextTilesSequence = Array.from({ length: 20 }, () => 
    Array.from({ length: 3 }, () => generateEdges())
  );

  // Generate objectives based on the seed
  const objectives: DailyObjective[] = [
    {
      type: 'score',
      target: 1000 + seededRandom(2000),
      current: 0
    },
    {
      type: 'matches',
      target: 5 + seededRandom(10),
      current: 0
    },
    {
      type: 'combos',
      target: 3 + seededRandom(5),
      current: 0
    }
  ];

  return {
    id: `daily_${seed}`,
    date: seed,
    initialTiles,
    nextTilesSequence,
    objectives
  };
};

export const getDailyChallenge = (): DailyChallenge => {
  const today = new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem(CHALLENGE_STORAGE_KEY);
  
  if (stored) {
    const challenge = JSON.parse(stored);
    if (challenge.date === today) {
      return challenge;
    }
  }

  const newChallenge = generateDailySequence(today);
  localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(newChallenge));
  return newChallenge;
};

export const updateDailyChallengeProgress = (
  objectives: DailyObjective[],
  score: number
): void => {
  const challenge = getDailyChallenge();
  challenge.objectives = objectives;
  challenge.highScore = Math.max(score, challenge.highScore || 0);
  localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(challenge));
};

export const isDailyChallengeCompleted = (objectives: DailyObjective[]): boolean => {
  return objectives.every(obj => obj.current >= obj.target);
}; 