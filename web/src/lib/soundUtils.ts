// Web Audio Synthesizer sound utilities for Western Boys Salon SaaS
// 100% zero-dependency audio synthesis; works reliably without MP3 assets.

// Play ascending alert chime when a new customer booking/token request arrives at counter
export const playNewBookingChime = () => {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.35, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    masterGain.connect(ctx.destination);

    // 4-Note Crisp Bell Cascade: C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz) -> C6 (1046.50Hz)
    const notes = [
      { freq: 523.25, time: 0.00, dur: 0.20 },
      { freq: 659.25, time: 0.12, dur: 0.20 },
      { freq: 783.99, time: 0.24, dur: 0.25 },
      { freq: 1046.50, time: 0.36, dur: 0.70 },
    ];

    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      oscGain.gain.setValueAtTime(0.8, now + note.time);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);

      osc.connect(oscGain);
      oscGain.connect(masterGain);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.dur);
    });
  } catch (err) {
    console.warn('Web Audio booking chime could not play:', err);
  }
};

// Play "Now Serving" customer calling chime
export const playCallChime = () => {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.25); // E5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, now + 0.25);
    osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.55); // G5

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.3);
    osc2.start(now + 0.25);
    osc2.stop(now + 0.9);
  } catch (e) {
    console.warn('Audio chime could not play:', e);
  }
};
