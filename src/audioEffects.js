/**
 * audioEffects.js — Sistema de audio sintético y vibración háptica
 *
 * Utiliza Web Audio API para generar efectos sonoros cinematográficos
 * procedimentales (sin archivos de audio externos, sin latencia, sin CORS):
 * - Detección de presencia: barrido de resonancia atmosférica ascendente.
 * - Shockwave / Impacto de llegada: estallido de subgraves con disipación estéreo.
 * - Vibración háptica en teléfonos móviles (navigator.vibrate).
 */

window.AudioEffects = (() => {
  let _ctx = null;

  function _getAudioContext() {
    if (!_ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) _ctx = new AudioCtx();
    }
    if (_ctx && _ctx.state === 'suspended') {
      _ctx.resume();
    }
    return _ctx;
  }

  /**
   * Sonido y vibración cuando se detecta a la persona llegando
   */
  function playPresenceDetected() {
    try {
      // Vibración sutil en móvil
      if (navigator.vibrate) {
        navigator.vibrate([40, 30, 60]);
      }

      const ctx = _getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(65, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.45);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.52);
    } catch (_) {}
  }

  /**
   * Explosión de onda de choque y vibración fuerte cuando la pantalla "tiembla" y expulsa los datos
   */
  function playShockwaveBurst() {
    try {
      // Patrón de vibración táctil agresivo para teléfonos
      if (navigator.vibrate) {
        navigator.vibrate([80, 40, 140, 50, 220]);
      }

      const ctx = _getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // 1. Sub-bass boom cinematográfico
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();

      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(110, now);
      subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.85);

      subGain.gain.setValueAtTime(0.38, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.95);

      // 2. Ruido blanco / siseo atmosférico de dispersión
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(180, now + 0.4);
      filter.Q.value = 3;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.28, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.45);
    } catch (_) {}
  }

  return {
    playPresenceDetected,
    playShockwaveBurst,
  };
})();
