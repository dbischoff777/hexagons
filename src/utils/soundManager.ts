export class SoundManager {
  private static instance: SoundManager
  private backgroundMusic: HTMLAudioElement
  private sounds: { [key: string]: HTMLAudioElement }
  private musicEnabled: boolean = true
  private soundEnabled: boolean = true

  private constructor() {
    // Initialize background music
    this.backgroundMusic = new Audio('/sounds/background.ogg')
    this.backgroundMusic.loop = true
    this.backgroundMusic.volume = 0.4

    // Initialize sound effects
    this.sounds = {
      tilePlaced: new Audio('/sounds/tile-placed.mp3'),
      tileRotate: new Audio('/sounds/tile-rotate.mp3'),
      match: new Audio('/sounds/match.mp3'),
      gridClear: new Audio('/sounds/grid-clear.mp3'),
      gameOver: new Audio('/sounds/game-over.mp3'),
      buttonClick: new Audio('/sounds/button-click.mp3'),
      warning: new Audio('/sounds/warning.mp3')
    }

    // Set default volumes for sound effects
    Object.values(this.sounds).forEach(sound => {
      sound.volume = 0.6
    })
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager()
    }
    return SoundManager.instance
  }

  public setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled
    if (enabled) {
      this.backgroundMusic.play().catch(() => {
        // Handle autoplay restrictions
        console.log('Music autoplay prevented')
      })
    } else {
      this.backgroundMusic.pause()
      this.backgroundMusic.currentTime = 0
    }
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled
  }

  public playSound(soundName: keyof typeof this.sounds): void {
    if (!this.soundEnabled) return

    const sound = this.sounds[soundName]
    if (sound) {
      sound.currentTime = 0
      sound.play().catch(() => {
        console.log('Sound play prevented')
      })
    }
  }

  public startBackgroundMusic(): void {
    if (this.musicEnabled) {
      this.backgroundMusic.play().catch(() => {
        console.log('Music autoplay prevented')
      })
    }
  }

  public stopBackgroundMusic(): void {
    this.backgroundMusic.pause()
    this.backgroundMusic.currentTime = 0
  }

  public stopAllSounds(): void {
    // Stop all sound effects
    Object.values(this.sounds).forEach(sound => {
      sound.pause();
      sound.currentTime = 0;
    });
    
    // Also stop background music
    this.stopBackgroundMusic();
  }

  /**
   * Plays a sound for a specific tile
   * @param tileIndex The index of the tile (0-6)
   */
  playTileSound(tileIndex: number) {
    const frequencies = [
      261.63, // C4
      293.66, // D4
      329.63, // E4
      349.23, // F4
      392.00, // G4
      440.00, // A4
      493.88  // B4
    ];

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.value = frequencies[tileIndex % frequencies.length];

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

    // Clean up
    setTimeout(() => {
      audioContext.close();
    }, 1000);
  }
}

export default SoundManager

const SOUNDS = {
  bark: '/sounds/bark.mp3',
  // Add more sounds here
};

export const playBarkSound = async () => {
  try {
    // Check if sound file exists
    const response = await fetch(SOUNDS.bark);
    if (!response.ok) {
      console.log('Bark sound file not found');
      return;
    }

    const bark = new Audio(SOUNDS.bark);
    bark.volume = 0.3;
    await bark.play();
  } catch (error) {
    console.log('Error playing sound:', error);
  }
}; 