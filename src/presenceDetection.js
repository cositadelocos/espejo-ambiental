/**
 * presenceDetection.js — Detección de presencia con MediaPipe
 *
 * Usa MediaPipe Tasks Vision (FaceDetector blaze_face_short_range)
 * para detectar si hay una persona frente a la pantalla.
 *
 * PRIVACIDAD: Solo detecta presencia (sí/no). No identifica, no graba,
 * no transmite imágenes. Todo el procesamiento ocurre localmente.
 *
 * Si MediaPipe o la cámara no están disponibles, activa automáticamente
 * el modo de simulación para que la experiencia siga funcionando.
 *
 * REQUISITO: la app debe ejecutarse en localhost o HTTPS para que
 * el navegador permita acceso a la cámara (getUserMedia).
 */

class PresenceDetector {
  /**
   * @param {object} opts
   * @param {function} opts.onPresenceChange  fn(detected: boolean)
   * @param {function} opts.onStatusChange    fn(status: string)
   */
  constructor(opts = {}) {
    this.onPresenceChange = opts.onPresenceChange ?? (() => {});
    this.onStatusChange   = opts.onStatusChange   ?? (() => {});
    this.onPositionChange = opts.onPositionChange ?? (() => {});

    this.simulationMode = true;   // activo hasta que la cámara esté lista
    this.isRunning      = false;
    this.isReady        = false;
    this.lastFacePos    = null;

    this._detected      = false;
    this._debounceIn    = 0;
    this._debounceOut   = 0;
    this.DEBOUNCE_IN    = 6;   // frames para confirmar presencia
    this.DEBOUNCE_OUT   = 14;  // frames para confirmar ausencia (más conservador)

    this._faceDetector  = null;
    this._video         = null;
    this._stream        = null;
    this._rafId         = null;
    this._lastVideoTime = -1;
  }

  // ── Inicialización ────────────────────────────────────────────────────

  /**
   * Intenta inicializar MediaPipe y la cámara en segundo plano.
   * Si falla en cualquier paso, activa silenciosamente el modo simulación.
   * NO lanza excepciones — es completamente no bloqueante.
   */
  async init() {
    this.onStatusChange('loading');

    const mpOk = await this._loadMediaPipe();
    if (!mpOk) {
      this.onStatusChange('mp-error');
      console.warn('[Presence] MediaPipe no disponible → modo simulación activo.');
      return false;
    }

    const camOk = await this._startCamera();
    if (!camOk) return false;

    this.simulationMode = false;
    this.isRunning      = true;
    this.isReady        = true;
    this.onStatusChange('active');
    this._startDetectionLoop();
    return true;
  }

  async _loadMediaPipe() {
    try {
      // Import dinámico del bundle ES Module (no requiere <script> extra)
      const vision = await import(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs'
      );
      const { FaceDetector, FilesetResolver } = vision;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      this._faceDetector = await FaceDetector.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_detector/' +
            'blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
          delegate: 'GPU',
        },
        runningMode:              'VIDEO',
        minDetectionConfidence:   0.5,
        minSuppressionThreshold:  0.3,
      });

      console.info('[Presence] MediaPipe FaceDetector cargado correctamente.');
      return true;
    } catch (e) {
      console.warn('[Presence] Error cargando MediaPipe:', e.message);
      return false;
    }
  }

  async _startCamera() {
    try {
      this._video = document.getElementById('camera-feed');
      if (!this._video) throw new Error('Elemento #camera-feed no encontrado en el DOM.');

      this._stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width:      { ideal: 640 },
          height:     { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      this._video.srcObject = this._stream;
      await this._video.play();
      this._video.classList.add('active');
      console.info('[Presence] Cámara iniciada y reflejo espejo activado.');
      return true;

    } catch (e) {
      console.warn('[Presence] Error de cámara:', e.name, '—', e.message);
      this._video?.classList.remove('active');
      const status = e.name === 'NotAllowedError' ? 'permission-denied' : 'cam-error';
      this.onStatusChange(status);
      return false;
    }
  }

  // ── Bucle de detección ─────────────────────────────────────────────────

  _startDetectionLoop() {
    const loop = () => {
      if (!this.isRunning) return;

      // Solo procesar si el video tiene un frame nuevo
      if (this._video.readyState >= 2 &&
          this._video.currentTime !== this._lastVideoTime) {
        this._lastVideoTime = this._video.currentTime;

        try {
          const result = this._faceDetector.detectForVideo(
            this._video,
            performance.now()
          );
          const hasFace = result.detections && result.detections.length > 0;
          let facePos = null;
          if (hasFace) {
            const bbox = result.detections[0].boundingBox;
            const vw = this._video.videoWidth  || 640;
            const vh = this._video.videoHeight || 480;
            // Eje horizontal invertido para alinearse con el efecto espejo CSS (scaleX(-1))
            const normX = 1 - (bbox.originX + bbox.width / 2) / vw;
            const normY = (bbox.originY + bbox.height / 2) / vh;
            facePos = {
              normX: Math.max(0.05, Math.min(0.95, normX)),
              normY: Math.max(0.05, Math.min(0.95, normY)),
            };
            this.lastFacePos = facePos;
          }
          this._processDetection(hasFace, facePos);
        } catch (_) {
          // Ignorar errores de frame individual (pérdidas de datos de video)
        }
      }

      this._rafId = requestAnimationFrame(loop);
    };

    this._rafId = requestAnimationFrame(loop);
  }

  /** Aplica debounce a la señal de detección para evitar parpadeos */
  _processDetection(hasFace, facePos) {
    if (hasFace) {
      this._debounceIn++;
      this._debounceOut = 0;
      if (this._debounceIn >= this.DEBOUNCE_IN && !this._detected) {
        this._detected = true;
        this.onPresenceChange(true, facePos);
      } else if (this._detected && facePos) {
        this.onPositionChange(facePos);
      }
    } else {
      this._debounceOut++;
      this._debounceIn = 0;
      if (this._debounceOut >= this.DEBOUNCE_OUT && this._detected) {
        this._detected = false;
        this.onPresenceChange(false, null);
      }
    }
  }

  // ── API pública ────────────────────────────────────────────────────────

  /**
   * Simula presencia manualmente (para pruebas sin cámara o teclado).
   * Funciona siempre, incluso cuando la cámara está activa.
   */
  simulatePresence(active, normX = 0.5, normY = 0.45) {
    const was = this._detected;
    this._detected = active;
    const pos = active ? { normX, normY } : null;
    this.lastFacePos = pos;
    if (was !== active) {
      this.onPresenceChange(active, pos);
    } else if (active && pos) {
      this.onPositionChange(pos);
    }
  }

  /** Detiene la cámara y libera los recursos */
  stop() {
    this.isRunning = false;
    if (this._rafId)  cancelAnimationFrame(this._rafId);
    if (this._stream) this._stream.getTracks().forEach(t => t.stop());
    this._stream = null;
    this.onStatusChange('inactive');
  }

  get isDetected() { return this._detected; }
  get mode()       { return this.simulationMode ? 'simulación' : 'cámara'; }
}
