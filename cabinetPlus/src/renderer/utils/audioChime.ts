// Utilitaire de Synthèse Sonore Web Audio (Carillon "Ding-Dong" d'Appel Médical)
export const playCallChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Fréquences pour un carillon élégant (Note E5 659.25Hz -> Note B5 987.77Hz -> Note E6 1318.5Hz)
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      // Enveloppe d'amplitude (Attaque douce, déclin naturel)
      gain.gain.setValueAtTime(0.01, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    // Arpège triple carillon type aéroport / hôpital (Sol-Do-Mi)
    playNote(523.25, 0, 0.6);   // Do5
    playNote(659.25, 0.15, 0.7);  // Mi5
    playNote(783.99, 0.35, 1.2);  // Sol5
  } catch (err) {
    console.error('Erreur génération son d\'appel:', err);
  }
};
