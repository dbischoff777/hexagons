import { PowerUpState, ComboState } from '../types';

export class ScoreHandler {
  private currentScore: number = 0;
  private previousScore: number = 0;

  constructor(initialScore: number = 0) {
    this.currentScore = initialScore;
    this.previousScore = initialScore;
    console.log('ScoreHandler initialized with:', initialScore);
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
    console.log('ScoreHandler setScore:', {
      previous: this.currentScore,
      new: newScore,
      change: newScore - this.currentScore
    });
    this.previousScore = this.currentScore;
    this.currentScore = newScore;
    return this.currentScore;
  }

  // Add points to current score
  addPoints(points: number): number {
    console.log('ScoreHandler addPoints:', {
      current: this.currentScore,
      adding: points,
      newTotal: this.currentScore + points
    });
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

    const finalScore = Math.round(basePoints * multiplier);
    console.log('ScoreHandler calculateScore:', {
      basePoints,
      powerUpMultiplier: powerUps.multiplier.active ? powerUps.multiplier.value : 1,
      comboMultiplier: combo.multiplier,
      totalMultiplier: multiplier,
      finalScore
    });
    return finalScore;
  }
} 