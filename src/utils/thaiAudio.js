// Procedural Thai festive ambient sound using Web Audio API
// (Soft Ranad / Khim pentatonic scale + warm soothing night resonance)

class ThaiSoundscape {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.intervalId = null;
    // Thai pentatonic scale frequencies (Ranad / Khim inspired)
    this.scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playNote(freq, time, duration = 2.5) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Warm bell/chime timbre
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    // Envelope
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.08, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + duration);
  }

  start() {
    this.init();
    this.isPlaying = true;

    // Play periodic soothing bell/khim melodies
    const playRandomChord = () => {
      if (!this.isPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const note1 = this.scale[Math.floor(Math.random() * this.scale.length)];
      const note2 = this.scale[Math.floor(Math.random() * this.scale.length)];
      this.playNote(note1, now, 2.8);
      this.playNote(note2, now + 0.3, 2.5);
    };

    playRandomChord();
    this.intervalId = setInterval(playRandomChord, 3200);
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }
}

export const soundscape = new ThaiSoundscape();
