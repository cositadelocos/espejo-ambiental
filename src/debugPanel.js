/**
 * debugPanel.js — Panel de depuración (tecla D)
 *
 * Para uso en desarrollo y pruebas.
 * Ocultar completamente para la presentación pública.
 * Accede al estado global a través del objeto window.App.
 */

class DebugPanel {
  constructor() {
    this.visible = false;
    this.el = document.getElementById('debug-panel');
    this._build();
  }

  _build() {
    this.el.innerHTML = `
      <div class="dbg-header">
        <span class="dbg-title">⚙ DEPURACIÓN</span>
        <button class="dbg-close" id="dbg-close">✕</button>
      </div>

      <div class="dbg-grid">
        <span class="dbg-label">Estado</span>
        <span class="dbg-value accent" id="dbg-state">IDLE</span>

        <span class="dbg-label">Presencia</span>
        <span class="dbg-value" id="dbg-presence">—</span>

        <span class="dbg-label">Detección</span>
        <span class="dbg-value" id="dbg-camera">simulación</span>

        <span class="dbg-label">FPS</span>
        <span class="dbg-value" id="dbg-fps">—</span>

        <span class="dbg-label">Partículas</span>
        <span class="dbg-value" id="dbg-particles">—</span>

        <span class="dbg-label">Escenario</span>
        <span class="dbg-value" id="dbg-scenario">—</span>
      </div>

      <div class="dbg-divider"></div>

      <div class="dbg-actions">
        <button class="dbg-btn primary" id="dbg-sim-on">▶ Simular presencia</button>
        <button class="dbg-btn"         id="dbg-sim-off">⏹ Simular ausencia</button>
        <button class="dbg-btn"         id="dbg-next-scene">⟳ Siguiente escenario</button>
        <button class="dbg-btn warn"    id="dbg-reset">↺ Reiniciar</button>
      </div>

      <div class="dbg-divider"></div>

      <label class="dbg-label">Partículas: <span id="dbg-pcount">1800</span></label>
      <input type="range" id="dbg-pslider"
             min="200" max="3000" step="100" value="1800"
             class="dbg-slider" />

      <div class="dbg-divider"></div>

      <div class="dbg-hints">
        <kbd>D</kbd> panel &nbsp;
        <kbd>Esp</kbd> presencia &nbsp;
        <kbd>+/-</kbd> partículas &nbsp;
        <kbd>N</kbd> escenario &nbsp;
        <kbd>R</kbd> reiniciar &nbsp;
        <kbd>F</kbd> FPS
      </div>
    `;

    // ── Botones ──────────────────────────────────────────────────────────
    document.getElementById('dbg-close').onclick = () => this.toggle();

    document.getElementById('dbg-sim-on').onclick = () => {
      App.presenceDetector?.simulatePresence(true);
    };
    document.getElementById('dbg-sim-off').onclick = () => {
      App.presenceDetector?.simulatePresence(false);
    };
    document.getElementById('dbg-next-scene').onclick = () => App.nextScenario?.();
    document.getElementById('dbg-reset').onclick = () => {
      App.presenceDetector?.simulatePresence(false);
      App.stateMachine?.transition('IDLE');
    };

    const slider = document.getElementById('dbg-pslider');
    slider.oninput = () => {
      const n = parseInt(slider.value);
      document.getElementById('dbg-pcount').textContent = n;
      App.particleSystem?.resize(n);
    };
  }

  toggle() {
    this.visible = !this.visible;
    this.el.classList.toggle('visible', this.visible);
  }

  /** Actualizar valores en vivo. Llamar cada frame (solo opera si está visible). */
  update(fps) {
    if (!this.visible) return;
    const sm = App.stateMachine;
    const pd = App.presenceDetector;
    const ps = App.particleSystem;

    const $ = id => document.getElementById(id);
    $('dbg-state').textContent    = sm?.state ?? '—';
    $('dbg-presence').textContent = pd?.isDetected ? '✅ detectada' : '◌ ausente';
    $('dbg-camera').textContent   = pd?.mode ?? '—';
    $('dbg-fps').textContent      = fps + ' fps';
    $('dbg-particles').textContent = ps?.particles.length ?? '—';
    $('dbg-scenario').textContent  = App.currentScenario?.category ?? '—';

    // Sincronizar slider con partículas reales
    const slider = document.getElementById('dbg-pslider');
    if (ps && slider && document.activeElement !== slider) {
      slider.value = ps.particles.length;
      document.getElementById('dbg-pcount').textContent = ps.particles.length;
    }
  }
}
