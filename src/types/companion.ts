export type CompanionAbilityEffect = 
  | 'timeBonus'
  | 'scoreBoost'
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
    "Woof! Ready to play? 🐾",
    "Tail wags and happy barks! Let's go! 🐕",
    "*Excited bouncing* Game time!",
    "*Playful bark* Hi friend!",
    "*Tilts head* Ready when you are!",
    "Woof woof! Let's make some matches! 🦴"
  ],
  smallMatch: [
    "*Happy tail wag* Good match!",
    "Woof! Nice one! 🐾",
    "*Playful bounce* Keep going!",
    "*Perks ears* That's it!",
    "Arf! You're doing great! 🦴",
    "*Excited panting* Another match!"
  ],
  bigMatch: [
    "*Jumps excitedly* AMAZING MATCH! 🌟",
    "WOOF WOOF! INCREDIBLE! ⭐",
    "*Zoomies* THAT WAS AWESOME!",
    "*Happy spins* PAWSOME MATCH! 🐾",
    "*Excited barking* YOU'RE ON FIRE! 🔥",
    "*Bouncing around* SPECTACULAR! ✨"
  ],
  smallCombo: [
    "*Tail wagging faster* Combo started!",
    "*Alert ears* Keep the combo going!",
    "Arf! That's the spirit! 🐾",
    "*Playful stance* More combos coming!",
    "*Happy panting* You're on a roll!",
    "*Perked ears* Getting warmed up!"
  ],
  bigCombo: [
    "*Super zoomies* COMBO MASTER! 🌟",
    "*Excited jumping* UNSTOPPABLE! ⚡",
    "*Happy spins* WHAT A STREAK! 🎯",
    "*Rapid tail wags* INCREDIBLE COMBO!",
    "*Joyful barking* YOU'RE AMAZING! ✨",
    "*Bouncing with joy* PAWFECT COMBO! 🐾"
  ],
  abilityUse: [
    "*Alert stance* Time for a power-up! 💫",
    "*Protective bark* Let me help! 🐕",
    "*Determined look* Special move incoming!",
    "*Focused stance* Watch this trick! ✨",
    "*Playful growl* Time to show off! 🌟",
    "*Tail pointing* Here comes help! 🐾"
  ],
  idle: [
    "*Curious head tilt* I see some matches...",
    "*Sniffing around* Something good here...",
    "*Watchful pose* I'll help you find matches!",
    "*Alert ears* I sense a good move...",
    "*Gentle tail wag* Take your time...",
    "*Patient sitting* We'll find the right match!"
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