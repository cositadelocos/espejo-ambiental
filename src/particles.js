/**
 * particles.js — Motor de partículas con física de dispersión
 *
 * Cada partícula pertenece a una capa de profundidad (layer) que determina
 * su tamaño, opacidad y velocidad. El movimiento orgánico se genera con
 * ruido de Perlin tridimensional (x, y, tiempo).
 *
 * Modo IDLE: deriva continua y no repetitiva.
 * Modo DISPERSIÓN: fuerza repulsiva desde el centro de la pantalla.
 * Modo RETORNO: la fuerza se desvanece, el ruido toma el control.
 *
 * Las partículas nunca se destruyen → reutilización implícita (object pooling).
 */

class Particle {
  /**
   * @param {object} p      Instancia de p5.js
   * @param {object} cfg    CONFIG.particles
   * @param {object} layer  Descriptor de capa (CONFIG.particles.layers[i])
   */
  constructor(p, cfg, layer) {
    this.p     = p;
    this.cfg   = cfg;
    this.layer = layer;

    // Offsets únicos de ruido → movimientos no correlacionados entre partículas
    this.noiseOffsetX = p.random(10000);
    this.noiseOffsetY = p.random(10000);

    this._init();
  }

  _init() {
    const p     = this.p;
    const layer = this.layer;

    this.x  = p.random(p.width);
    this.y  = p.random(p.height);
    this.vx = p.random(-0.5, 0.5);
    this.vy = p.random(-0.5, 0.5);

    this.size      = p.random(layer.sizeMin, layer.sizeMax);
    this.baseAlpha = p.random(80, 220) * layer.alphaMult;
    this.alpha     = this.baseAlpha;
    this.speedMult = layer.speedMult;

    // Fase individual para micro-oscilación de opacidad (efecto respiración)
    this.alphaPhase = p.random(p.TWO_PI);
    this.alphaFreq  = p.random(0.006, 0.022);

    // Color HSB con variación individual
    const col = CONFIG.colors.idle;
    this.hue = p.random(col.hueMin, col.hueMax);
    this.sat = p.random(col.satMin, col.satMax);
    this.bri = p.random(col.briMin, col.briMax);
  }

  /**
   * Actualiza física de la partícula.
   * @param {number} t              Tiempo acumulado (para Perlin)
   * @param {object|null} dispData  { cx, cy, strength } o null
   */
  update(t, dispData) {
    const p   = this.p;
    const cfg = this.cfg;

    // ── Campo vectorial de Perlin → movimiento orgánico ──────────────────
    const angle = p.noise(
      this.x  * cfg.noiseScale + this.noiseOffsetX,
      this.y  * cfg.noiseScale + this.noiseOffsetY,
      t
    ) * p.TWO_PI * 2.5;

    const force = cfg.baseSpeed * this.speedMult * cfg.driftForce * 60;
    this.vx += p.cos(angle) * force;
    this.vy += p.sin(angle) * force;

    // ── Fuerza de dispersión ──────────────────────────────────────────────
    if (dispData && dispData.strength > 0.001) {
      const { cx, cy, strength } = dispData;
      const dx = this.x - cx;
      const dy = this.y - cy;
      const distSq  = dx * dx + dy * dy;
      const maxDist = cfg.disperseRadius * (1 + this.layer.speedMult * 0.4);

      if (distSq < maxDist * maxDist) {
        const dist = Math.sqrt(distSq) || 0.001;
        const t_   = 1 - dist / maxDist;
        const mag  = t_ * t_ * cfg.disperseForce * strength;
        this.vx += (dx / dist) * mag;
        this.vy += (dy / dist) * mag;
      }
    }

    // ── Fricción → velocidad acotada ─────────────────────────────────────
    this.vx *= cfg.friction;
    this.vy *= cfg.friction;

    this.x += this.vx * this.speedMult;
    this.y += this.vy * this.speedMult;

    // Wrap-around: la partícula reaparece en el lado opuesto
    const m = 12;
    if (this.x < -m)         this.x = p.width  + m;
    if (this.x > p.width+m)  this.x = -m;
    if (this.y < -m)         this.y = p.height + m;
    if (this.y > p.height+m) this.y = -m;

    // Micro-oscilación de opacidad
    this.alpha = this.baseAlpha
      + p.sin(t * this.alphaFreq * 60 + this.alphaPhase) * 22;
    this.alpha = p.constrain(this.alpha, 25, 255);
  }

  draw() {
    const p = this.p;
    p.noStroke();

    // Halo exterior difuso (simula difusión en el aire)
    if (this.size > 2) {
      p.fill(this.hue, this.sat * 0.55, this.bri, this.alpha * 0.22);
      p.ellipse(this.x, this.y, this.size * 2.6, this.size * 2.6);
    }

    // Núcleo de la partícula
    p.fill(this.hue, this.sat, this.bri, this.alpha);
    p.ellipse(this.x, this.y, this.size, this.size);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class ParticleSystem {
  /** @param {object} p - Instancia de p5.js */
  constructor(p) {
    this.p         = p;
    this.particles = [];
    this.noiseTime = 0;

    // Estado de dispersión
    this._disperse = null; // { cx, cy, strength, active }

    this._build();
  }

  /** Construye el pool según CONFIG */
  _build() {
    const cfg   = CONFIG.particles;
    this.particles = [];
    cfg.layers.forEach(layer => {
      const n = Math.round(cfg.count * layer.fraction);
      for (let i = 0; i < n; i++) {
        this.particles.push(new Particle(this.p, cfg, layer));
      }
    });
  }

  /** Cambia la cantidad de partículas (reconstruye el pool) */
  resize(newCount) {
    CONFIG.particles.count = newCount;
    this._build();
  }

  // ── Control de dispersión ─────────────────────────────────────────────

  /** Activa la dispersión desde el punto (cx, cy) con onda de choque visible */
  disperseFrom(cx, cy) {
    this._disperse = {
      cx,
      cy,
      strength: 0,
      active:   true,
    };

    // Crear anillos de onda de choque que distorsionan visualmente el espacio
    const p = this.p;
    const maxR = Math.max(p.width, p.height) * 0.95;
    this.shockwaves = [
      { cx, cy, r: 10, maxR, speed: 32, alpha: 255, strokeW: 8 },
      { cx, cy, r: 0,  maxR: maxR * 0.8, speed: 20, alpha: 200, strokeW: 4 },
      { cx, cy, r: -40, maxR: maxR * 0.6, speed: 12, alpha: 160, strokeW: 2 }
    ];
  }

  /** Desactiva la dispersión — las partículas retornan gradualmente */
  returnToIdle() {
    if (this._disperse) {
      this._disperse.active = false;
    }
    this.shockwaves = [];
  }

  // ── Bucle principal ───────────────────────────────────────────────────

  update() {
    this.noiseTime += CONFIG.particles.noiseTimeStep;

    // Gestión de la intensidad de dispersión (fade in explosivo / fade out)
    const d = this._disperse;
    if (d) {
      d.strength = d.active
        ? Math.min(1.0, d.strength + 0.08)   // fade in mucho más enérgico
        : Math.max(0.0, d.strength - 0.005);  // fade out suave

      if (!d.active && d.strength <= 0) this._disperse = null;
    }

    // Actualizar ondas de choque
    if (this.shockwaves && this.shockwaves.length > 0) {
      this.shockwaves.forEach(sw => {
        sw.r += sw.speed;
        sw.alpha = Math.max(0, sw.alpha - (sw.speed * 0.85));
      });
      this.shockwaves = this.shockwaves.filter(sw => sw.alpha > 0 && sw.r < sw.maxR);
    }

    for (const pt of this.particles) {
      pt.update(this.noiseTime, this._disperse);
    }
  }

  draw() {
    const p = this.p;

    // Dibujar ondas de choque atmosféricas si existen
    if (this.shockwaves && this.shockwaves.length > 0) {
      p.push();
      p.noFill();
      for (const sw of this.shockwaves) {
        if (sw.r > 0 && sw.alpha > 0) {
          p.stroke(195, 80, 100, sw.alpha);
          p.strokeWeight(sw.strokeW);
          p.ellipse(sw.cx, sw.cy, sw.r * 2, sw.r * 2);

          // Anillo difuso secundario
          p.stroke(220, 40, 100, sw.alpha * 0.35);
          p.strokeWeight(sw.strokeW * 3);
          p.ellipse(sw.cx, sw.cy, sw.r * 2, sw.r * 2);
        }
      }
      p.pop();
    }

    for (const pt of this.particles) {
      pt.draw();
    }
  }

  get disperseStrength() {
    return this._disperse?.strength ?? 0;
  }
}
