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
   * Sonido y vibración cuando se detecta a la persona llegando.
   * Genera una corriente de aire y resonancia que se acumula durante los 3 segundos.
   */
  function playPresenceDetected() {
    try {
      // Vibración sutil inicial en móvil
      if (navigator.vibrate) {
        navigator.vibrate([40, 30, 60]);
      }

      const ctx = _getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // 1. Resonancia armónica de fondo que asciende durante los 3 segundos
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, now);
      osc.frequency.exponentialRampToValueAtTime(170, now + 2.7);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 1.2);
      gain.gain.linearRampToValueAtTime(0.22, now + 2.6);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.95);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 3.0);

      // 2. Corriente de aire sutil generada con ruido filtrado (viento interactivo)
      const bufferSize = Math.floor(ctx.sampleRate * 2.8);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.linearRampToValueAtTime(560, now + 2.7);
      filter.Q.value = 2.0;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.12, now + 1.5);
      noiseGain.gain.linearRampToValueAtTime(0.20, now + 2.6);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2.95);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 3.0);
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
