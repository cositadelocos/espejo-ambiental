/**
 * config.js — Parámetros globales del sistema
 * Todos los valores ajustables están centralizados aquí.
 * Modifica este archivo para calibrar la experiencia.
 */
window.CONFIG = {

  // ── Sistema de partículas ──────────────────────────────────────────────
  particles: {
    count:     1800,
    countLow:  800,
    countHigh: 3000,

    layers: [
      { fraction: 0.5,  sizeMin: 1,   sizeMax: 2.5, speedMult: 0.3,  alphaMult: 0.4 },
      { fraction: 0.35, sizeMin: 2,   sizeMax: 4,   speedMult: 0.65, alphaMult: 0.7 },
      { fraction: 0.15, sizeMin: 3.5, sizeMax: 6.5, speedMult: 1.0,  alphaMult: 1.0 },
    ],

    noiseScale:    0.003,
    noiseTimeStep: 0.0008,
    baseSpeed:     0.6,
    driftForce:    0.012,
    friction:      0.985,

    disperseRadius: 230,
    disperseForce:  4.2,
  },

  // ── Paleta visual ──────────────────────────────────────────────────────
  colors: {
    background: [8, 10, 16],
    trailAlpha: 18,
    idle: {
      hueMin: 192, hueMax: 240,
      satMin: 40,  satMax: 90,
      briMin: 50,  briMax: 92,
    },
  },

  // ── Texto de reposo ────────────────────────────────────────────────────
  idleText: {
    phrase:        '¿Sabes qué aire estás respirando?',
    hint:          'Acércate para descubrirlo',
    phraseFontSize: 18,
    hintFontSize:   13,
    pulseSpeed:     0.025,
  },

  // ── Sacudida de pantalla ───────────────────────────────────────────────
  shake: {
    maxAmount: 12,   // píxeles de desplazamiento máximo
    decay:     0.65, // reducción por frame
  },

  // ── Interacción de presencia física (agitación del aire) ────────────────
  presence: {
    swirlRadius:   320,  // radio de perturbación de aire alrededor de la persona
    swirlForce:    3.8,  // fuerza de vórtice / remolino
    pushForce:     2.6,  // fuerza de desplazamiento aerodinámico al pasar
    speedBoost:    2.4,  // aceleración de las partículas suspendidas
  },

  // ── Temporizadores (ms) ───────────────────────────────────────────────
  timings: {
    detectionHold:       5000, // 5 segundos de interacción con las partículas antes de revelar
    disperseDuration:    1400,
    infoDisplayDuration: 22000,
    resetDuration:       2200,
    resetHoldDelay:      3500,
  },

  // ── Debug ─────────────────────────────────────────────────────────────
  debug: {
    showFPS: true,
  },
};
