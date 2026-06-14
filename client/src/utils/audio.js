/**
 * Synthesizes walkie-talkie static/squelch sounds and beep tones using the Web Audio API.
 * This runs completely client-side and does not require loading external audio files.
 */

export const playWalkieTalkieStatic = (duration = 0.35) => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Create white noise buffer
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;
    
    // Filter to limit band (walkie talkie radio sound - narrow band)
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200, ctx.currentTime); // focus around 1.2 kHz
    filter.Q.setValueAtTime(1.5, ctx.currentTime);
    
    const gainNode = ctx.createGain();
    // Shape envelope: quick attack, stay, quick release
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.05); // quick start click
    gainNode.gain.setValueAtTime(0.35, ctx.currentTime + duration - 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration); // quick fade out click
    
    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    noiseNode.start(0);
    noiseNode.stop(ctx.currentTime + duration);
  } catch (error) {
    console.error("Failed to play walkie-talkie static noise: ", error);
  }
};

export const playWalkieTalkieBeep = (isSend = false) => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = "sine";
    if (isSend) {
      // Send: Double short beep
      osc.frequency.setValueAtTime(980, ctx.currentTime);
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.02);
      gainNode.gain.setValueAtTime(0.12, ctx.currentTime + 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.10);
      
      const osc2 = ctx.createOscillator();
      const gainNode2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(980, ctx.currentTime + 0.12);
      gainNode2.gain.setValueAtTime(0, ctx.currentTime + 0.12);
      gainNode2.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.14);
      gainNode2.gain.setValueAtTime(0.12, ctx.currentTime + 0.20);
      gainNode2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc2.connect(gainNode2);
      gainNode2.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.11);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.23);
    } else {
      // Receive: Classic single radio squelch-beep
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.14);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime + 0.10);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch (error) {
    console.error("Failed to play walkie-talkie beep: ", error);
  }
};
