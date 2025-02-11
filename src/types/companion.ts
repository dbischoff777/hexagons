export type CompanionAbilityEffect = 
  | 'timeBonus'
  | 'scoreBoost';

export interface CompanionAbility {
  id: string;
  name: string;
  description: string;
  icon: string;
  effect: CompanionAbilityEffect;
  cooldown: number;
  currentCooldown: number;
  duration?: number;
  isActive: boolean;
}

export interface Companion {
  id: string;
  name: string;
  avatar: string;
  level: number;
  experience: number;
  experienceToNext: number;
  abilities: CompanionAbility[];
}

export const INITIAL_COMPANION: Companion = {
  id: 'default',
  name: 'Pixel',
  avatar: '🤖',
  level: 1,
  experience: 0,
  experienceToNext: 200,
  abilities: [
    {
      id: 'timeBonus',
      name: 'Time Freeze',
      description: 'Freezes the timer temporarily',
      icon: '⌛',
      effect: 'timeBonus',
      cooldown: 60,
      currentCooldown: 0,
      duration: 10,
      isActive: false
    },
    {
      id: 'scoreBoost',
      name: 'Score Boost',
      description: 'Doubles points earned temporarily',
      icon: '✨',
      effect: 'scoreBoost',
      cooldown: 45,
      currentCooldown: 0,
      duration: 15,
      isActive: false
    },
  ]
}; 