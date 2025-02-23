import { PowerUpState, ComboState } from '../types';

export class ScoreHandler {
  private currentScore: number = 0;
  private previousScore: number = 0;

  constructor(initialScore: number = 0) {
    this.currentScore = initialScore;
    this.previousScore = initialScore;
  }

  // Get current score
  getScore(): number {
    return this.currentScore;
  }

  // Get previous score
  getPreviousScore(): number {
    return this.previousScore;
  }

  // Update score with new value
  setScore(newScore: number): number {
    this.previousScore = this.currentScore;
    this.currentScore = newScore;
    return this.currentScore;
  }

  // Add points to current score
  addPoints(points: number): number {
    return this.setScore(this.currentScore + points);
  }

  // Calculate score with basic multipliers
  calculateScore(
    basePoints: number, 
    powerUps: PowerUpState,
    combo: ComboState
  ): number {
    let multiplier = 1;
    
    // Apply power-up multiplier
    if (powerUps.multiplier.active) {
      multiplier *= powerUps.multiplier.value;
    }
    
    // Apply combo multiplier
    if (combo.multiplier > 1) {
      multiplier *= combo.multiplier;
    }

    return Math.round(basePoints * multiplier);
  }
} 