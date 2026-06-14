class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5; // default volume
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(
    freq: number,
    type: OscillatorType,
    duration: number,
    vol: number = 1,
    attack: number = 0.05,
    release: number = 0.1
  ) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    // Envelope
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + attack);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime + duration - release);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  private playSequence(
    notes: { freq: number; type: OscillatorType; duration: number; delay: number; vol?: number }[]
  ) {
    if (!this.ctx || !this.masterGain) return;
    
    notes.forEach((note) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, this.ctx!.currentTime + note.delay);

      const vol = note.vol || 1;
      const attack = 0.02;
      const release = 0.05;

      gain.gain.setValueAtTime(0, this.ctx!.currentTime + note.delay);
      gain.gain.linearRampToValueAtTime(vol, this.ctx!.currentTime + note.delay + attack);
      gain.gain.setValueAtTime(vol, this.ctx!.currentTime + note.delay + note.duration - release);
      gain.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + note.delay + note.duration);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(this.ctx!.currentTime + note.delay);
      osc.stop(this.ctx!.currentTime + note.delay + note.duration);
    });
  }

  // --- Routine Completion Sounds ---
  
  // Soft pop / pleasant chime
  playRoutineCompletion() {
    this.init();
    this.playSequence([
      { freq: 440, type: 'sine', duration: 0.15, delay: 0, vol: 0.4 },
      { freq: 554.37, type: 'sine', duration: 0.25, delay: 0.1, vol: 0.4 },
    ]);
  }

  // Daily Completion: Richer success sequence
  playDailyCompletion() {
    this.init();
    this.playSequence([
      { freq: 523.25, type: 'sine', duration: 0.15, delay: 0, vol: 0.3 },     // C5
      { freq: 659.25, type: 'sine', duration: 0.15, delay: 0.15, vol: 0.3 },  // E5
      { freq: 783.99, type: 'sine', duration: 0.15, delay: 0.3, vol: 0.3 },   // G5
      { freq: 1046.50, type: 'sine', duration: 0.4, delay: 0.45, vol: 0.4 }   // C6
    ]);
  }

  // Perfect Day: Warm success melody (1-2 seconds max)
  playPerfectDay() {
    this.init();
    this.playSequence([
      { freq: 440, type: 'triangle', duration: 0.2, delay: 0, vol: 0.3 },
      { freq: 554.37, type: 'triangle', duration: 0.2, delay: 0.2, vol: 0.3 },
      { freq: 659.25, type: 'triangle', duration: 0.2, delay: 0.4, vol: 0.3 },
      { freq: 880, type: 'triangle', duration: 0.6, delay: 0.6, vol: 0.4 },
    ]);
  }

  // --- Streak Milestone Sounds ---
  playMilestone(streak: number) {
    this.init();
    if (streak >= 100) {
      // 100 Day Streak: Epic
      this.playSequence([
        { freq: 523.25, type: 'square', duration: 0.2, delay: 0, vol: 0.2 },
        { freq: 659.25, type: 'square', duration: 0.2, delay: 0.2, vol: 0.2 },
        { freq: 783.99, type: 'square', duration: 0.2, delay: 0.4, vol: 0.2 },
        { freq: 1046.50, type: 'square', duration: 0.2, delay: 0.6, vol: 0.2 },
        { freq: 1567.98, type: 'square', duration: 0.6, delay: 0.8, vol: 0.3 }, // G6
      ]);
    } else if (streak >= 30) {
      this.playSequence([
        { freq: 440, type: 'triangle', duration: 0.15, delay: 0, vol: 0.3 },
        { freq: 554.37, type: 'triangle', duration: 0.15, delay: 0.15, vol: 0.3 },
        { freq: 880, type: 'triangle', duration: 0.5, delay: 0.3, vol: 0.4 },
      ]);
    } else if (streak >= 14) {
      this.playSequence([
        { freq: 392.00, type: 'triangle', duration: 0.15, delay: 0, vol: 0.3 }, // G4
        { freq: 523.25, type: 'triangle', duration: 0.15, delay: 0.15, vol: 0.3 }, // C5
        { freq: 783.99, type: 'triangle', duration: 0.4, delay: 0.3, vol: 0.4 }, // G5
      ]);
    } else if (streak >= 7) {
      this.playSequence([
        { freq: 329.63, type: 'sine', duration: 0.15, delay: 0, vol: 0.4 }, // E4
        { freq: 440, type: 'sine', duration: 0.15, delay: 0.15, vol: 0.4 }, // A4
        { freq: 659.25, type: 'sine', duration: 0.4, delay: 0.3, vol: 0.5 }, // E5
      ]);
    } else { // 3 days
      this.playSequence([
        { freq: 440, type: 'sine', duration: 0.15, delay: 0, vol: 0.4 },
        { freq: 554.37, type: 'sine', duration: 0.4, delay: 0.15, vol: 0.4 }
      ]);
    }
  }

  playPersonalBest() {
    this.init();
    // Trophy achievement sound, rising success tones
    this.playSequence([
      { freq: 523.25, type: 'triangle', duration: 0.12, delay: 0, vol: 0.3 },
      { freq: 587.33, type: 'triangle', duration: 0.12, delay: 0.12, vol: 0.3 },
      { freq: 659.25, type: 'triangle', duration: 0.12, delay: 0.24, vol: 0.3 },
      { freq: 783.99, type: 'triangle', duration: 0.12, delay: 0.36, vol: 0.3 },
      { freq: 1046.50, type: 'triangle', duration: 0.6, delay: 0.48, vol: 0.4 },
    ]);
  }

  // --- Timer Sounds ---
  
  // Timer Started: Soft click
  playTimerStart() {
    this.init();
    this.playTone(800, 'sine', 0.1, 0.4, 0.01, 0.05);
  }

  // Timer Paused: Gentle pause
  playTimerPause() {
    this.init();
    this.playSequence([
      { freq: 600, type: 'sine', duration: 0.1, delay: 0, vol: 0.3 },
      { freq: 400, type: 'sine', duration: 0.15, delay: 0.1, vol: 0.3 },
    ]);
  }

  // Timer Resumed: short confirmation
  playTimerResume() {
    this.init();
    this.playSequence([
      { freq: 400, type: 'sine', duration: 0.1, delay: 0, vol: 0.2 },
      { freq: 600, type: 'sine', duration: 0.15, delay: 0.1, vol: 0.3 },
    ]);
  }

  // Timer Completed: completion bell
  playTimerComplete() {
    this.init();
    this.playSequence([
      { freq: 523.25, type: 'triangle', duration: 0.2, delay: 0, vol: 0.3 },
      { freq: 659.25, type: 'triangle', duration: 0.2, delay: 0.2, vol: 0.3 },
      { freq: 1046.50, type: 'triangle', duration: 0.8, delay: 0.4, vol: 0.3 }, // lingering bell
    ]);
  }

  // Pomodoro completed
  playPomodoroWorkComplete() {
    this.init();
    this.playSequence([
      { freq: 659.25, type: 'sine', duration: 0.15, delay: 0, vol: 0.4 },
      { freq: 880, type: 'sine', duration: 0.5, delay: 0.15, vol: 0.4 },
    ]);
  }

  // Break Started
  playPomodoroBreakStart() {
    this.init();
    this.playSequence([
      { freq: 440, type: 'sine', duration: 0.2, delay: 0, vol: 0.2 },
      { freq: 349.23, type: 'sine', duration: 0.6, delay: 0.2, vol: 0.2 }, // gentle drop
    ]);
  }

  // Break Complete
  playPomodoroBreakComplete() {
    this.init();
    this.playSequence([
      { freq: 440, type: 'sine', duration: 0.15, delay: 0, vol: 0.3 },
      { freq: 554.37, type: 'sine', duration: 0.15, delay: 0.15, vol: 0.3 },
      { freq: 659.25, type: 'sine', duration: 0.5, delay: 0.3, vol: 0.4 },
    ]);
  }

  // Countdown Sounds (last 3 seconds): Tick
  playCountdownTick() {
    this.init();
    this.playTone(1000, 'sine', 0.05, 0.2, 0.01, 0.02);
  }

  playCountdownFinish() {
    this.init();
    this.playSequence([
      { freq: 880, type: 'sine', duration: 0.3, delay: 0, vol: 0.4 },
    ]);
  }

  // Negative Feedback (missed after 12:00 AM)
  playNegativeFeedback() {
    this.init();
    this.playSequence([
      { freq: 300, type: 'triangle', duration: 0.2, delay: 0, vol: 0.2 },
      { freq: 250, type: 'triangle', duration: 0.4, delay: 0.2, vol: 0.2 },
    ]);
  }
}

export const audioSystem = new AudioManager();
