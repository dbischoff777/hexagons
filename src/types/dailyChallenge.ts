export interface DailyObjective {
  type: 'score' | 'matches' | 'combos' | 'time';
  target: number;
  current: number;
}

export interface DailyChallenge {
  id: string;
  date: string;
  initialTiles: Array<{
    q: number;
    r: number;
    edges: Array<{ color: string }>;
  }>;
  nextTilesSequence: Array<Array<{ color: string }[]>>;
  objectives: DailyObjective[];
  completed?: boolean;
  highScore?: number;
} 