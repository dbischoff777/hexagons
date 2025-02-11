export type CompanionAbilityEffect = 
  | 'timeBonus'
  | 'scoreBoost'
  | 'colorSync'
  | 'comboExtend';

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

// Define default abilities first
const DEFAULT_ABILITIES: CompanionAbility[] = [
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
  {
    id: 'colorSync',
    name: 'Color Sync',
    description: 'Makes adjacent tiles match colors temporarily',
    icon: '🎨',
    effect: 'colorSync',
    cooldown: 60,
    currentCooldown: 0,
    duration: 5,
    isActive: false
  },
  {
    id: 'comboExtend',
    name: 'Combo Sustain',
    description: 'Extends the current combo timer',
    icon: '⚡',
    effect: 'comboExtend',
    cooldown: 40,
    currentCooldown: 0,
    duration: 5,
    isActive: false
  }
];

export const COMPANIONS = {
  default: {
    id: 'default',
    name: 'Pixel',
    avatar: '🤖',
    description: 'Your trusty digital companion',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES
  },
  cyber_cat: {
    id: 'cyber_cat',
    name: 'Neon Whiskers',
    avatar: '🐱',
    description: 'A digital feline with glowing whiskers',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES
  },
  ghost: {
    id: 'ghost',
    name: 'Phantom Bit',
    avatar: '👻',
    description: 'A playful digital spirit',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES
  },
  alien: {
    id: 'alien',
    name: 'Cosmic Debug',
    avatar: '👾',
    description: 'An otherworldly debugging assistant',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES
  },
  dragon: {
    id: 'dragon',
    name: 'Data Dragon',
    avatar: '🐲',
    description: 'A powerful digital wyrm',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES
  },
  unicorn: {
    id: 'unicorn',
    name: 'Binary Unicorn',
    avatar: '🦄',
    description: 'A majestic digital steed',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES
  },
  wizard: {
    id: 'wizard',
    name: 'Code Wizard',
    avatar: '🧙‍♂️',
    description: 'A master of digital spells',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES
  },
  ninja: {
    id: 'ninja',
    name: 'Silent Byte',
    avatar: '🥷',
    description: 'A stealthy digital warrior',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES
  },
  phoenix: {
    id: 'phoenix',
    name: 'Reboot Phoenix',
    avatar: '🦅',
    description: 'A legendary bird of digital rebirth',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES
  },
  octopus: {
    id: 'octopus',
    name: 'Multi-Thread',
    avatar: '🐙',
    description: 'A multi-tasking digital cephalopod',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES
  },
  crystal: {
    id: 'crystal',
    name: 'Crystal Core',
    avatar: '💎',
    description: 'A crystalline digital entity',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES
  },
  star: {
    id: 'star',
    name: 'Binary Star',
    avatar: '⭐',
    description: 'A radiant digital celestial',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES
  }
} as const;

export const INITIAL_COMPANION = COMPANIONS.default;

// Add unlock requirements for companions
export const COMPANION_UNLOCKS = {
  default: { level: 5 },
  cyber_cat: { level: 10 },
  ghost: { level: 15 },
  alien: { level: 20 },
  dragon: { level: 25 },
  unicorn: { level: 30 },
  wizard: { level: 35 },
  ninja: { level: 40 },
  phoenix: { level: 45 },
  octopus: { level: 45 },
  crystal: { level: 50 },
  star: { level: 55 }
} as const;

// Helper type for companion IDs
export type CompanionId = keyof typeof COMPANIONS; 