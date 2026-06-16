class SoundServiceManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.value = -12;
      compressor.knee.value = 8;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.01;
      compressor.release.value = 0.1;

      this.masterGain.connect(compressor);
      compressor.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.8;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private getNoiseBuffer(duration: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const size = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  // --- 1. Routine Completed (✅) ---
  playRoutineCompletion() {
    this.init();
    const t = this.ctx!.currentTime;
    
    // Hardwood dowel strike (short noise/square burst)
    const clack = this.ctx!.createOscillator();
    clack.type = 'square';
    clack.frequency.setValueAtTime(600, t);
    clack.frequency.exponentialRampToValueAtTime(50, t + 0.05);
    const clackGain = this.ctx!.createGain();
    clackGain.gain.setValueAtTime(0, t);
    clackGain.gain.linearRampToValueAtTime(0.4, t + 0.01);
    clackGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    clack.connect(clackGain);
    clackGain.connect(this.masterGain!);
    clack.start(t);
    clack.stop(t + 0.1);

    // D6 Glockenspiel (1174.66 Hz)
    const glock = this.ctx!.createOscillator();
    glock.type = 'sine';
    glock.frequency.value = 1174.66;
    const glockGain = this.ctx!.createGain();
    glockGain.gain.setValueAtTime(0, t + 0.04);
    glockGain.gain.linearRampToValueAtTime(0.5, t + 0.06);
    glockGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    glock.connect(glockGain);
    glockGain.connect(this.masterGain!);
    glock.start(t + 0.04);
    glock.stop(t + 0.4);
  }

  // --- 2. Daily Completion (🎯) ---
  playDailyCompletion() {
    this.init();
    const t = this.ctx!.currentTime;
    
    // Arpeggio: C4, E4, G4, C5
    const freqs = [261.63, 329.63, 392.00, 523.25];
    
    const delay = this.ctx!.createDelay();
    delay.delayTime.value = 0.12;
    const feedback = this.ctx!.createGain();
    feedback.gain.value = 0.25;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(this.masterGain!);

    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'triangle'; // synthetic xylophone
      osc.frequency.value = f;
      const gain = this.ctx!.createGain();
      const start = t + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      gain.connect(delay);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  // --- 3. Streak Maintained (🔥) ---
  playStreakMaintained() {
    this.init();
    const t = this.ctx!.currentTime;
    
    const noise = this.ctx!.createBufferSource();
    noise.buffer = this.getNoiseBuffer(0.5);
    const noiseFilter = this.ctx!.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(4000, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, t + 0.4);
    const noiseGain = this.ctx!.createGain();
    noiseGain.gain.setValueAtTime(0, t);
    noiseGain.gain.linearRampToValueAtTime(0.2, t + 0.02);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain!);
    noise.start(t);

    const ding = this.ctx!.createOscillator();
    ding.type = 'triangle';
    ding.frequency.value = 1500;
    const dingGain = this.ctx!.createGain();
    dingGain.gain.setValueAtTime(0, t);
    dingGain.gain.linearRampToValueAtTime(0.4, t + 0.02);
    dingGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    ding.connect(dingGain);
    dingGain.connect(this.masterGain!);
    ding.start(t);
    ding.stop(t + 0.6);
  }

  // --- 4. New Personal Record (🏆) ---
  playPersonalBest() {
    this.init();
    const t = this.ctx!.currentTime;
    
    // G major swell: G3, B3, D4, G4
    const freqs = [196, 246.94, 293.66, 392];
    const synthGain = this.ctx!.createGain();
    synthGain.gain.setValueAtTime(0, t);
    synthGain.gain.linearRampToValueAtTime(0.3, t + 0.2); 
    synthGain.gain.exponentialRampToValueAtTime(0.01, t + 1.2);
    
    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.linearRampToValueAtTime(3000, t + 0.2);
    filter.connect(synthGain);
    synthGain.connect(this.masterGain!);

    freqs.forEach(f => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + 1.3);
    });

    // Sub bass G2
    const sub = this.ctx!.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 98;
    const subGain = this.ctx!.createGain();
    subGain.gain.setValueAtTime(0, t);
    subGain.gain.linearRampToValueAtTime(0.4, t + 0.2);
    subGain.gain.exponentialRampToValueAtTime(0.01, t + 1.2);
    sub.connect(subGain);
    subGain.connect(this.masterGain!);
    sub.start(t);
    sub.stop(t + 1.3);

    // High frequency synth sweep
    const sweep = this.ctx!.createOscillator();
    sweep.type = 'sine';
    sweep.frequency.setValueAtTime(2000, t + 0.2);
    sweep.frequency.linearRampToValueAtTime(5000, t + 1.0);
    const sweepGain = this.ctx!.createGain();
    sweepGain.gain.setValueAtTime(0, t + 0.2);
    sweepGain.gain.linearRampToValueAtTime(0.1, t + 0.4);
    sweepGain.gain.exponentialRampToValueAtTime(0.01, t + 1.2);
    sweep.connect(sweepGain);
    sweepGain.connect(this.masterGain!);
    sweep.start(t + 0.2);
    sweep.stop(t + 1.3);
  }

  // --- 5. 7-Day Streak (🌟) ---
  play7DayStreak() {
    this.init();
    const t = this.ctx!.currentTime;
    
    // A4, C#5, E5
    const freqs = [440, 554.37, 659.25];
    
    const delay = this.ctx!.createDelay();
    delay.delayTime.value = 0.2;
    const feedback = this.ctx!.createGain();
    feedback.gain.value = 0.3;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(this.masterGain!);

    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      
      const fmOsc = this.ctx!.createOscillator();
      fmOsc.type = 'triangle';
      fmOsc.frequency.value = f * 2.5; 
      const fmGain = this.ctx!.createGain();
      fmGain.gain.setValueAtTime(f * 2, t);
      fmOsc.connect(fmGain);
      fmGain.connect(osc.frequency);
      
      const gain = this.ctx!.createGain();
      const start = t + i * 0.3;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.4, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, start + (i === 2 ? 1.5 : 0.4));
      
      osc.connect(gain);
      fmOsc.start(start);
      osc.start(start);
      fmOsc.stop(start + 2.0);
      osc.stop(start + 2.0);
      
      gain.connect(this.masterGain!);
      gain.connect(delay);
    });
  }

  // --- 6. 30-Day Streak (👑) ---
  play30DayStreak() {
    this.init();
    const t = this.ctx!.currentTime;
    
    // Digital orchestra C-E-G chord swell
    const chord = [130.81, 196.00, 261.63, 329.63]; // C3, G3, C4, E4
    chord.forEach(f => {
      const osc = this.ctx!.createOscillator(); 
      osc.type = 'sawtooth'; 
      osc.frequency.value = f;
      const g = this.ctx!.createGain(); 
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.15, t + 0.8);
      g.gain.exponentialRampToValueAtTime(0.01, t + 2.0);
      osc.connect(g); 
      g.connect(this.masterGain!); 
      osc.start(t); 
      osc.stop(t+2);
    });

    // Cascading harp glissando
    const harp = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.5]; // C4 -> C6
    harp.forEach((f, i) => {
      const osc = this.ctx!.createOscillator(); 
      osc.type = 'sine'; 
      osc.frequency.value = f;
      const g = this.ctx!.createGain(); 
      const start = t + i * 0.06;
      g.gain.setValueAtTime(0, start); 
      g.gain.linearRampToValueAtTime(0.1, start + 0.02); 
      g.gain.exponentialRampToValueAtTime(0.01, start + 0.5);
      osc.connect(g); 
      g.connect(this.masterGain!); 
      osc.start(start); 
      osc.stop(start+0.5);
    });

    // Warm boom
    const boom = this.ctx!.createOscillator(); 
    boom.type = 'sine'; 
    boom.frequency.setValueAtTime(120, t); 
    boom.frequency.exponentialRampToValueAtTime(40, t+0.5);
    const bg = this.ctx!.createGain(); 
    bg.gain.setValueAtTime(0.5, t); 
    bg.gain.exponentialRampToValueAtTime(0.01, t+1.5);
    boom.connect(bg); 
    bg.connect(this.masterGain!); 
    boom.start(t); 
    boom.stop(t+1.5);
  }

  // --- 7. 100-Day Streak (💯) ---
  play100DayStreak() {
    this.init();
    const t = this.ctx!.currentTime;
    
    // C-G-C Brass Fanfare (C4, G4, C5)
    const seq = [
       {f:261.63, start:0, dur:0.2}, 
       {f:392.00, start:0.25, dur:0.2}, 
       {f:523.25, start:0.5, dur:1.5}
    ];
    
    seq.forEach(n => {
      [1, 1.01].forEach(detune => {
        const osc = this.ctx!.createOscillator(); 
        osc.type = 'sawtooth'; 
        osc.frequency.value = n.f * detune;
        const g = this.ctx!.createGain(); 
        g.gain.setValueAtTime(0, t+n.start);
        g.gain.linearRampToValueAtTime(0.15, t+n.start+0.05); 
        g.gain.exponentialRampToValueAtTime(0.01, t+n.start+n.dur);
        osc.connect(g); 
        g.connect(this.masterGain!); 
        osc.start(t+n.start); 
        osc.stop(t+n.start+n.dur+0.1);
      });
    });

    // Heavy orchestral crash
    const noise = this.ctx!.createBufferSource(); 
    noise.buffer = this.getNoiseBuffer(2);
    const nf = this.ctx!.createBiquadFilter(); 
    nf.type = 'bandpass'; 
    nf.frequency.value = 3000;
    const ng = this.ctx!.createGain(); 
    ng.gain.setValueAtTime(0, t+0.5); 
    ng.gain.linearRampToValueAtTime(0.25, t+0.55); 
    ng.gain.exponentialRampToValueAtTime(0.01, t+2.5);
    noise.connect(nf); 
    nf.connect(ng); 
    ng.connect(this.masterGain!); 
    noise.start(t+0.5);

    // Choral Pad
    const padOsc = this.ctx!.createOscillator(); 
    padOsc.type = 'sine'; 
    padOsc.frequency.value = 523.25;
    const padG = this.ctx!.createGain(); 
    padG.gain.setValueAtTime(0, t+0.5); 
    padG.gain.linearRampToValueAtTime(0.15, t+1.0); 
    padG.gain.exponentialRampToValueAtTime(0.01, t+3.0);
    padOsc.connect(padG); 
    padG.connect(this.masterGain!); 
    padOsc.start(t+0.5); 
    padOsc.stop(t+3.5);
  }

  // --- 8. Confetti Celebration (🎉) ---
  playConfetti() {
    this.init();
    const t = this.ctx!.currentTime;
    
    // Snare hollow pop - enhanced to be like a cannon pop
    const thump = this.ctx!.createOscillator();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(150, t);
    thump.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    const thumpGain = this.ctx!.createGain();
    thumpGain.gain.setValueAtTime(1, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    thump.connect(thumpGain);
    thumpGain.connect(this.masterGain!);
    thump.start(t);
    thump.stop(t + 0.2);

    const noise = this.ctx!.createBufferSource(); 
    noise.buffer = this.getNoiseBuffer(0.2);
    const bandpass = this.ctx!.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1000;
    const ng = this.ctx!.createGain(); 
    ng.gain.setValueAtTime(0.8, t); 
    ng.gain.exponentialRampToValueAtTime(0.01, t+0.2);
    noise.connect(bandpass); 
    bandpass.connect(ng); 
    ng.connect(this.masterGain!); 
    noise.start(t);

    // Random tinkles
    for(let i=0; i<15; i++) {
        const osc = this.ctx!.createOscillator(); 
        osc.type = 'sine';
        osc.frequency.value = 2000 + Math.random() * 3000;
        const g = this.ctx!.createGain();
        const start = t + 0.05 + Math.random() * 0.8;
        g.gain.setValueAtTime(0, start); 
        g.gain.linearRampToValueAtTime(0.05, start+0.01); 
        g.gain.exponentialRampToValueAtTime(0.01, start+0.2);
        
        const panner = this.ctx!.createStereoPanner();
        panner.pan.value = Math.random() * 2 - 1;
        
        osc.connect(g); 
        g.connect(panner); 
        panner.connect(this.masterGain!);
        osc.start(start); 
        osc.stop(start+0.3);
    }
  }

  // --- 9. Perfect Day (✨) ---
  playPerfectDay() {
    this.init();
    const t = this.ctx!.currentTime;
    
    // FM synth swell F4 -> A4
    const carrier = this.ctx!.createOscillator(); 
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(349.23, t);
    carrier.frequency.exponentialRampToValueAtTime(440, t+0.4);
    
    const mod = this.ctx!.createOscillator(); 
    mod.type = 'sine'; 
    mod.frequency.value = 200;
    const modGain = this.ctx!.createGain(); 
    modGain.gain.value = 300;
    mod.connect(modGain); 
    modGain.connect(carrier.frequency);

    const g = this.ctx!.createGain(); 
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.25, t+0.4); 
    g.gain.exponentialRampToValueAtTime(0.01, t+1.0);
    
    carrier.connect(g); 
    g.connect(this.masterGain!);
    
    carrier.start(t); 
    mod.start(t); 
    carrier.stop(t+1.1); 
    mod.stop(t+1.1);
  }

  // --- 10. Timer Started (⏰) ---
  playTimerStart() {
    this.init();
    const t = this.ctx!.currentTime;
    // Dual stage clack
    [0, 0.05].forEach(start => {
      const noise = this.ctx!.createBufferSource(); 
      noise.buffer = this.getNoiseBuffer(0.02);
      const bp = this.ctx!.createBiquadFilter(); 
      bp.type = 'bandpass'; 
      bp.frequency.value = 1500;
      const g = this.ctx!.createGain(); 
      g.gain.setValueAtTime(0.6, t+start); 
      g.gain.exponentialRampToValueAtTime(0.01, t+start+0.02);
      noise.connect(bp); 
      bp.connect(g); 
      g.connect(this.masterGain!); 
      noise.start(t+start);
    });
  }

  // --- 11. Timer Paused (⏸) ---
  playTimerPause() {
    this.init();
    const t = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator(); 
    osc.type = 'triangle'; 
    osc.frequency.value = 130.81; // C3
    const g = this.ctx!.createGain(); 
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.4, t+0.01); 
    g.gain.exponentialRampToValueAtTime(0.01, t+0.1);
    osc.connect(g); 
    g.connect(this.masterGain!); 
    osc.start(t); 
    osc.stop(t+0.15);
  }

  // --- 12. Timer Resumed (▶) ---
  playTimerResume() {
    this.init();
    const t = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator(); 
    osc.type = 'triangle'; 
    osc.frequency.value = 196.00; // G3
    const g = this.ctx!.createGain(); 
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.4, t+0.01); 
    g.gain.exponentialRampToValueAtTime(0.01, t+0.1);
    osc.connect(g); 
    g.connect(this.masterGain!); 
    osc.start(t); 
    osc.stop(t+0.15);
  }

  // --- 13. Timer Finished (🔔) ---
  playTimerComplete() {
    this.init();
    const t = this.ctx!.currentTime;
    // Brass bowl 432Hz with natural slow attack and long unbroken decay
    [432, 434, 864].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator(); 
        osc.type = 'sine'; 
        osc.frequency.value = freq;
        const g = this.ctx!.createGain(); 
        g.gain.setValueAtTime(0, t);
        const maxVol = i === 2 ? 0.05 : 0.2;
        g.gain.linearRampToValueAtTime(maxVol, t+0.4); 
        g.gain.exponentialRampToValueAtTime(0.001, t+2.0);
        osc.connect(g); 
        g.connect(this.masterGain!); 
        osc.start(t); 
        osc.stop(t+2.5);
    });
  }

  // --- 14. Pomodoro Work Session Complete (🍅) ---
  playPomodoroWorkComplete() {
    this.init();
    const t = this.ctx!.currentTime;
    // Cowbell approx
    [540, 800].forEach(freq => {
        const osc = this.ctx!.createOscillator(); 
        osc.type = 'square'; 
        osc.frequency.value = freq;
        const g = this.ctx!.createGain(); 
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.15, t+0.01); 
        g.gain.exponentialRampToValueAtTime(0.01, t+0.3);
        osc.connect(g); 
        g.connect(this.masterGain!); 
        osc.start(t); 
        osc.stop(t+0.4);
    });
    // Noise blast
    const noise = this.ctx!.createBufferSource(); 
    noise.buffer = this.getNoiseBuffer(0.1);
    const g2 = this.ctx!.createGain(); 
    g2.gain.setValueAtTime(0.3, t); 
    g2.gain.exponentialRampToValueAtTime(0.01, t+0.1);
    noise.connect(g2); 
    g2.connect(this.masterGain!); 
    noise.start(t);
  }

  // --- 15. Break Started (☕) ---
  playPomodoroBreakStart() {
    this.init();
    const t = this.ctx!.currentTime;
    // Chime glissando
    const freqs = [587.33, 880, 1174.66, 1479.98, 1760];
    freqs.forEach((f, i) => {
        const osc = this.ctx!.createOscillator(); 
        osc.type = 'sine'; 
        osc.frequency.value = f;
        const g = this.ctx!.createGain(); 
        const start = t + i*0.06;
        g.gain.setValueAtTime(0, start); 
        g.gain.linearRampToValueAtTime(0.1, start+0.02); 
        g.gain.exponentialRampToValueAtTime(0.01, start+0.5);
        osc.connect(g); 
        g.connect(this.masterGain!); 
        osc.start(start); 
        osc.stop(start+0.6);
    });
    // Wave pad
    const noise = this.ctx!.createBufferSource(); 
    noise.buffer = this.getNoiseBuffer(1.0);
    const nf = this.ctx!.createBiquadFilter(); 
    nf.type = 'lowpass'; 
    nf.frequency.value = 400;
    const ng = this.ctx!.createGain(); 
    ng.gain.setValueAtTime(0, t); 
    ng.gain.linearRampToValueAtTime(0.2, t+0.3); 
    ng.gain.exponentialRampToValueAtTime(0.01, t+1.0);
    noise.connect(nf); 
    nf.connect(ng); 
    ng.connect(this.masterGain!); 
    noise.start(t);
  }

  // --- 16. Break Complete () ---
  playPomodoroBreakComplete() {
    this.init();
    const t = this.ctx!.currentTime;
    // Whoosh up
    const osc = this.ctx!.createOscillator(); 
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, t); 
    osc.frequency.exponentialRampToValueAtTime(600, t+0.4);
    const g = this.ctx!.createGain(); 
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.2, t+0.4); 
    g.gain.exponentialRampToValueAtTime(0.01, t+0.5);
    osc.connect(g); 
    g.connect(this.masterGain!); 
    osc.start(t); 
    osc.stop(t+0.6);
    
    // Pop
    const noise = this.ctx!.createBufferSource(); 
    noise.buffer = this.getNoiseBuffer(0.05);
    const ng = this.ctx!.createGain(); 
    ng.gain.setValueAtTime(0, t+0.45); 
    ng.gain.linearRampToValueAtTime(0.3, t+0.46); 
    ng.gain.exponentialRampToValueAtTime(0.01, t+0.5);
    noise.connect(ng); 
    ng.connect(this.masterGain!); 
    noise.start(t+0.45);
  }

  // --- Extras ---
  playNegativeFeedback() {
    this.init(); 
    const t = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator(); 
    osc.type = 'triangle'; 
    osc.frequency.setValueAtTime(200, t); 
    osc.frequency.exponentialRampToValueAtTime(150, t+0.3);
    const g = this.ctx!.createGain(); 
    g.gain.setValueAtTime(0, t); 
    g.gain.linearRampToValueAtTime(0.2, t+0.05); 
    g.gain.exponentialRampToValueAtTime(0.01, t+0.3);
    osc.connect(g); 
    g.connect(this.masterGain!); 
    osc.start(t); 
    osc.stop(t+0.4);
  }

  playCountdownTick() {
    this.init(); 
    const t = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator(); 
    osc.type = 'triangle'; 
    osc.frequency.value = 1000;
    const g = this.ctx!.createGain(); 
    g.gain.setValueAtTime(0, t); 
    g.gain.linearRampToValueAtTime(0.1, t+0.01); 
    g.gain.exponentialRampToValueAtTime(0.01, t+0.05);
    osc.connect(g); 
    g.connect(this.masterGain!); 
    osc.start(t); 
    osc.stop(t+0.1);
  }

  playCountdownFinish() {
    this.playTimerComplete();
  }
}

export const SoundService = new SoundServiceManager();
