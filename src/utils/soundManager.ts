class SoundManager {
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
}

export default SoundManager 