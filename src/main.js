/**
 * main.js — Sketch principal p5.js + Orquestador de la experiencia
 *
 * Responsabilidades:
 * - Espejo ambiental: proyecta la cámara en vivo de fondo con partículas flotando sobre la persona.
 * - Orquestación de estados (IDLE → DETECTED → REVEAL → INFORMATION → RESET → IDLE).
 * - Integración con Capa de Datos Ambientales (Puente Aranda) y Recomendaciones Pedagógicas.
 * - Renderizado de UI estilo Apple iOS a través de Interface.
 */

// ── Objeto global de coordinación ─────────────────────────────────────────
window.App = {
  stateMachine:     null,
  particleSystem:   null,
  presenceDetector: null,
  debugPanel:       null,
  scenarioIndex:    0,
  currentScenario:  null,

  /** Avanza al siguiente escenario DEMO */
  nextScenario() {
    const total = window.ENVIRONMENTAL_DATA ? window.ENVIRONMENTAL_DATA.SCENARIOS.length : 1;
    this.scenarioIndex = (this.scenarioIndex + 1) % total;
    this.currentScenario = window.ENVIRONMENTAL_DATA ?
      window.ENVIRONMENTAL_DATA.getScenarioByIndex(this.scenarioIndex) : null;

    // Si la información está visible, actualizarla en vivo
    if (this.stateMachine?.is('INFORMATION')) {
      window.Interface?.show(
        this.currentScenario,
        CONFIG.timings.infoDisplayDuration,
        () => this.stateMachine.transition('RESET')
      );
    }
  },
};

// ── Sketch p5.js ──────────────────────────────────────────────────────────
const sketch = (p) => {

  // Variables de rendimiento y animación
  let _shakeAmount = 0;
  let _textTime    = 0;
  let _showFPS     = CONFIG.debug.showFPS;
  let _fpsCount    = 0;
  let _fpsDisplay  = 60;
  let _fpsTimer    = 0;

  // ── SETUP ──────────────────────────────────────────────────────────────
  p.setup = () => {
    const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent('canvas-container');
    p.colorMode(p.HSB, 360, 100, 100, 255);

    // Inicializar escenario actual
    if (window.ENVIRONMENTAL_DATA) {
      App.currentScenario = window.ENVIRONMENTAL_DATA.getScenarioByIndex(App.scenarioIndex);
    }

    // ── Máquina de estados ─────────────────────────────────────────────
    const sm = new StateMachine();
    App.stateMachine = sm;

    sm.on('IDLE',        _onIdle)
      .on('DETECTED',    _onDetected)
      .on('REVEAL',      _onReveal)
      .on('INFORMATION', _onInformation)
      .on('RESET',       _onReset)
      .onChange(_onAnyTransition);

    // ── Sistema de partículas ──────────────────────────────────────────
    App.particleSystem = new ParticleSystem(p);

    // ── Detector de presencia ──────────────────────────────────────────
    const pd = new PresenceDetector({
      onPresenceChange: _handlePresence,
      onStatusChange:   _handleCameraStatus,
    });
    App.presenceDetector = pd;
    pd.init(); // Asíncrono no bloqueante

    // ── Panel de depuración ────────────────────────────────────────────
    App.debugPanel = new DebugPanel();

    // ── Solicitar ubicación GPS para el mapa Apple Maps ────────────────
    window.LocationMap?.requestCurrentLocation();

    _fpsTimer = p.millis();
  };

  // ── DRAW ───────────────────────────────────────────────────────────────
  p.draw = () => {
    // IMPORTANTE: Limpiar el canvas para que el video de la cámara (espejo)
    // sea visible debajo y las partículas floten por encima de la persona reflejada
    p.clear();

    // Sacudida de pantalla en transición REVEAL
    p.push();
    if (_shakeAmount > 0) {
      p.translate(
        (Math.random() - 0.5) * _shakeAmount,
        (Math.random() - 0.5) * _shakeAmount
      );
      _shakeAmount = Math.max(0, _shakeAmount - 0.95);
    }

    // Actualizar y dibujar partículas sobre el reflejo del usuario
    App.particleSystem.update();
    App.particleSystem.draw();
    p.pop();

    // Texto de reposo estilo Apple (solo en IDLE y DETECTED)
    const sm = App.stateMachine;
    if (sm?.isAny('IDLE', 'DETECTED')) {
      const fade = sm.is('DETECTED') ? 0.25 : 1.0;
      _drawIdleText(fade);
    }

    if (_showFPS) _drawFPS();
    _textTime += 0.016;

    // Actualizar panel de depuración
    App.debugPanel?.update(_fpsDisplay);

    _fpsCount++;
    const now = p.millis();
    if (now - _fpsTimer >= 1000) {
      _fpsDisplay = _fpsCount;
      _fpsCount   = 0;
      _fpsTimer   = now;
    }
  };

  // ── Handlers de estado ─────────────────────────────────────────────────

  function _onIdle() {
    App.particleSystem.returnToIdle();
    window.Interface?.hide();
    _updateCamStatus();
  }

  function _onDetected() {
    // Feedback sonoro sutil y anticipación de presencia
    window.AudioEffects?.playPresenceDetected();
    // Pausa deliberada para confirmar intención de cercanía
    App.stateMachine.schedule(CONFIG.timings.detectionHold, 'REVEAL');
  }

  function _onReveal() {
    // Sacudida de pantalla enérgica y vibración háptica
    _shakeAmount = 28;
    document.body.classList.add('vibrating-shockwave');
    setTimeout(() => {
      document.body.classList.remove('vibrating-shockwave');
    }, 700);

    // Sonido cinemático de explosión de aire y vibración física
    window.AudioEffects?.playShockwaveBurst();

    // Dispersión centrífuga de partículas con ondas de choque visuales
    App.particleSystem.disperseFrom(p.width / 2, p.height / 2);

    // Al terminar la dispersión, desplegar la hoja informativa estilo iOS
    App.stateMachine.schedule(CONFIG.timings.disperseDuration, 'INFORMATION');
  }

  function _onInformation() {
    // Mostrar interfaz Apple iOS con barra de temporizador
    window.Interface?.show(
      App.currentScenario,
      CONFIG.timings.infoDisplayDuration,
      () => App.stateMachine.transition('RESET')
    );

    // Temporizador de auto-retorno al modo espejo
    App.stateMachine.schedule(CONFIG.timings.infoDisplayDuration, 'RESET');
  }

  function _onReset() {
    window.Interface?.hide();
    App.particleSystem.returnToIdle();
    App.stateMachine.schedule(CONFIG.timings.resetDuration, 'IDLE');
  }

  function _onAnyTransition(prev, next) {
    _updateCamStatus();
  }

  // ── Gestión de presencia ────────────────────────────────────────────────

  function _handlePresence(detected) {
    const sm = App.stateMachine;
    if (!sm) return;

    if (detected) {
      if (sm.is('IDLE')) {
        sm.transition('DETECTED');
      } else if (sm.is('INFORMATION')) {
        // La persona continúa frente a la pantalla: extender temporizador
        sm.clearScheduled();
        sm.schedule(CONFIG.timings.infoDisplayDuration, 'RESET');
      } else if (sm.is('RESET')) {
        sm.transition('INFORMATION');
      }
    } else {
      if (sm.is('DETECTED')) {
        sm.transition('IDLE');
      } else if (sm.is('INFORMATION')) {
        // La persona se retiró: programar reinicio breve
        sm.clearScheduled();
        sm.schedule(CONFIG.timings.resetHoldDelay, 'RESET');
      }
    }
  }

  // ── Estado de cámara ───────────────────────────────────────────────────

  function _handleCameraStatus(status) {
    const dot   = document.getElementById('cam-dot');
    const label = document.getElementById('cam-label');
    if (!dot || !label) return;

    const map = {
      'loading':          ['active',   '⟳ Iniciando espejo…'],
      'active':           ['active',   '● Espejo en vivo'],
      'mp-error':         ['inactive', '◌ Simulación activa (Espacio)'],
      'cam-error':        ['error',    '✕ Sin acceso a cámara'],
      'permission-denied':['error',    '✕ Permiso denegado'],
      'inactive':         ['inactive', '◌ Modo simulación'],
    };

    const [cls, text] = map[status] ?? ['inactive', status];
    dot.className     = `status-dot ${cls}`;
    label.textContent = text;
  }

  function _updateCamStatus() {
    const pd = App.presenceDetector;
    if (!pd) return;
    if (pd.mode === 'cámara') {
      _handleCameraStatus('active');
    } else {
      _handleCameraStatus(pd.simulationMode ? 'inactive' : 'active');
    }
  }

  // ── Funciones de dibujo ────────────────────────────────────────────────

  function _drawIdleText(alpha = 1.0) {
    const cx    = p.width  / 2;
    const cy    = p.height * 0.78; // Posicionado elegantemente en el tercio inferior
    const pulse = 0.5 + 0.5 * Math.sin(_textTime * 1.5);

    p.push();
    p.colorMode(p.RGB, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.noStroke();

    // Pastilla de cristal de fondo estilo Dynamic Island / iOS Pill
    const pillW = Math.min(460, p.width * 0.88);
    const pillH = 68;
    const pillA = (35 + pulse * 15) * alpha;

    p.fill(12, 14, 20, pillA * 2.2);
    p.stroke(255, 255, 255, (25 + pulse * 15) * alpha);
    p.strokeWeight(1);
    p.rect(cx - pillW / 2, cy - pillH / 2, pillW, pillH, 34);

    // Texto de la pregunta principal
    p.noStroke();
    p.fill(255, 255, 255, (210 + pulse * 45) * alpha);
    p.textSize(17);
    p.textStyle(p.BOLD);
    p.textFont('system-ui, -apple-system, sans-serif');
    p.text('¿Sabes qué aire estás respirando en este momento?', cx, cy - 11);

    // Indicación de acción
    p.fill(180, 210, 245, (160 + pulse * 40) * alpha);
    p.textSize(12);
    p.textStyle(p.NORMAL);
    p.text('Mírate en el espejo · Acércate para revelar la polución invisible', cx, cy + 13);

    p.pop();
  }

  function _drawFPS() {
    p.push();
    p.colorMode(p.RGB, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(11);
    p.textFont('system-ui, -apple-system, sans-serif');
    p.noStroke();
    const col = _fpsDisplay >= 50
      ? [48, 209, 88] : _fpsDisplay >= 30
      ? [255, 214, 10] : [255, 69, 58];
    p.fill(...col, 190);
    p.text(
      `FPS: ${_fpsDisplay} · ${App.particleSystem?.particles.length ?? 0} partículas`,
      p.width - 16, 16
    );
    p.pop();
  }

  // ── Eventos del navegador y teclado ────────────────────────────────────

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  p.keyPressed = () => {
    const k = p.key.toLowerCase();
    const K = p.keyCode;

    if (k === 'd') App.debugPanel?.toggle();
    if (k === 'f') _showFPS = !_showFPS;
    if (k === 'r') {
      App.presenceDetector?.simulatePresence(false);
      App.stateMachine?.transition('IDLE');
    }
    if (k === 'n') App.nextScenario?.();

    // Espacio → Simular presencia (toggle)
    if (K === 32) {
      const pd = App.presenceDetector;
      if (pd) pd.simulatePresence(!pd.isDetected);
    }

    // +/= → más partículas
    if (p.key === '+' || p.key === '=') {
      const n = Math.min(CONFIG.particles.count + 300, CONFIG.particles.countHigh);
      App.particleSystem?.resize(n);
    }
    // - → menos partículas
    if (p.key === '-') {
      const n = Math.max(CONFIG.particles.count - 300, 200);
      App.particleSystem?.resize(n);
    }
  };
};

// ── Inicialización ─────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Desvanecer loader
  setTimeout(() => {
    document.getElementById('loader')?.classList.add('hidden');
  }, 700);

  new p5(sketch);
});
