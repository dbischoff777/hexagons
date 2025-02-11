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
  personality: CompanionPersonality;
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

// First, let's create default personalities that we can reuse
const DEFAULT_PERSONALITY: CompanionPersonality = {
  greetings: [
    "Hello! Ready to play some Hex?",
    "Systems online! Let's make some matches!",
    "Beep boop! Game time! 🤖"
  ],
  smallMatch: [
    "Nice match! Keep it up!",
    "That's the way! 👍",
    "Every match counts!"
  ],
  bigMatch: [
    "INCREDIBLE MATCH! 🎯",
    "You're on fire! 🔥",
    "Now that's what I call a match! ⚡"
  ],
  smallCombo: [
    "Combo started! Let's build it!",
    "Good rhythm! Keep going!",
    "That's the combo spirit!"
  ],
  bigCombo: [
    "COMBO MASTER! 🌟",
    "You're unstoppable! 💫",
    "What a combo streak! 🎯"
  ],
  abilityUse: [
    "Power-up time! 💪",
    "Let me help you with that!",
    "Special ability incoming! ✨"
  ],
  idle: [
    "The grid is full of possibilities...",
    "Remember to check for matching edges!",
    "I'm analyzing optimal moves... 🤔"
  ]
};

export const COMPANIONS = {
  default: {
    id: 'default',
    name: 'Pixel',
    avatar: '🤖',
    description: 'Your trusty digital companion',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES,
    personality: DEFAULT_PERSONALITY
  },
  cyber_cat: {
    id: 'cyber_cat',
    name: 'Neon Whiskers',
    avatar: '🐱',
    description: 'A digital feline with glowing whiskers',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES,
    personality: {
      greetings: [
        "Meow! Ready for some digital fun? 🐱",
        "Purr-fect timing! Let's play!",
        "The cyber-whiskers are tingling!"
      ],
      smallMatch: [
        "Paw-some match! 🐾",
        "Keep those matches coming! Meow!",
        "That's the spirit! Purr..."
      ],
      bigMatch: [
        "MEOW-VELOUS MATCH! 🐱✨",
        "You're cat-tastic! 🐱🔥",
        "Now that's what I call a purr-fect match!"
      ],
      smallCombo: [
        "Purr-fect combo start!",
        "Keep the rhythm going, meow!",
        "That's the way to combo!"
      ],
      bigCombo: [
        "ULTIMATE FELINE COMBO! 🐱⚡",
        "You're absolutely claw-some! 🐾",
        "Meow-gnificent combo streak!"
      ],
      abilityUse: [
        "Time for some cat magic! ✨",
        "Watch this feline power! 🐱",
        "Meow-gical ability incoming!"
      ],
      idle: [
        "Just cat-culating the next move... 🐱",
        "These tiles are purr-fectly aligned...",
        "My whiskers sense a match nearby!"
      ]
    }
  },
  ghost: {
    id: 'ghost',
    name: 'Phantom Bit',
    avatar: '👻',
    description: 'A playful digital spirit',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES,
    personality: {
      greetings: [
        "BOO! Ready to haunt some hexagons? 👻",
        "Spookily good to see you!",
        "Let's make some ghostly matches!"
      ],
      smallMatch: [
        "Spooktacular match!",
        "Hauntingly good!",
        "That's the spirit! 👻"
      ],
      bigMatch: [
        "PARANORMAL MATCH! 👻✨",
        "You're supernaturally good!",
        "That match was to die for!"
      ],
      smallCombo: [
        "A ghostly combo appears!",
        "Keep the spirits high!",
        "Haunting combo time!"
      ],
      bigCombo: [
        "SPECTRAL COMBO MASTERY! 👻⚡",
        "You're scarily good at this!",
        "Otherworldly combo streak!"
      ],
      abilityUse: [
        "Channeling spirit power! ✨",
        "Ghostly ability activated!",
        "Time for some paranormal help!"
      ],
      idle: [
        "Floating through possibilities...",
        "I sense a match in the spirit realm...",
        "These hexagons are haunted with potential!"
      ]
    }
  },
  alien: {
    id: 'alien',
    name: 'Cosmic Debug',
    avatar: '👾',
    description: 'An otherworldly debugging assistant',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES,
    personality: DEFAULT_PERSONALITY
  },
  dragon: {
    id: 'dragon',
    name: 'Data Dragon',
    avatar: '🐲',
    description: 'A powerful digital wyrm',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES,
    personality: DEFAULT_PERSONALITY
  },
  unicorn: {
    id: 'unicorn',
    name: 'Binary Unicorn',
    avatar: '🦄',
    description: 'A majestic digital steed',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES,
    personality: DEFAULT_PERSONALITY
  },
  wizard: {
    id: 'wizard',
    name: 'Code Wizard',
    avatar: '🧙‍♂️',
    description: 'A master of digital spells',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES,
    personality: DEFAULT_PERSONALITY
  },
  ninja: {
    id: 'ninja',
    name: 'Silent Byte',
    avatar: '🥷',
    description: 'A stealthy digital warrior',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES,
    personality: DEFAULT_PERSONALITY
  },
  phoenix: {
    id: 'phoenix',
    name: 'Reboot Phoenix',
    avatar: '🦅',
    description: 'A legendary bird of digital rebirth',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES,
    personality: DEFAULT_PERSONALITY
  },
  octopus: {
    id: 'octopus',
    name: 'Multi-Thread',
    avatar: '🐙',
    description: 'A multi-tasking digital cephalopod',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES,
    personality: DEFAULT_PERSONALITY
  },
  crystal: {
    id: 'crystal',
    name: 'Crystal Core',
    avatar: '💎',
    description: 'A crystalline digital entity',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES,
    personality: DEFAULT_PERSONALITY
  },
  star: {
    id: 'star',
    name: 'Binary Star',
    avatar: '⭐',
    description: 'A radiant digital celestial',
    level: 1,
    experience: 0,
    experienceToNext: 200,
    abilities: DEFAULT_ABILITIES,
    personality: DEFAULT_PERSONALITY
  }
};

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
};

// Helper type for companion IDs
export type CompanionId = keyof typeof COMPANIONS;

// Add to the existing types
interface CompanionPersonality {
  greetings: ReadonlyArray<string>;
  smallMatch: ReadonlyArray<string>;
  bigMatch: ReadonlyArray<string>;
  smallCombo: ReadonlyArray<string>;
  bigCombo: ReadonlyArray<string>;
  abilityUse: ReadonlyArray<string>;
  idle: ReadonlyArray<string>;
} 