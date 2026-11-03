/**
 * interface.js — Rediseño UI/UX Pantalla de Calidad del Aire (Bogotá Aire)
 *
 * Especificación:
 * - Minimalismo inspirado en iOS (SF Pro Display / system-ui)
 * - Pantalla vertical adaptada a tablet o televisor
 * - Paleta limpia: fondo #F7F8FC, tarjetas blancas #FFFFFF (radius 28px, sombra suave)
 * - Tarjeta 1: Índice de calidad del aire (AQI gigante, categoría, PM2.5, barra de escala de colores)
 * - Tarjeta 2: Recomendación destacada dinámica según categoría (fondo de advertencia en niveles altos)
 * - Tarjeta 3: Tu ubicación GPS (mapa existente Leaflet con marcador GPS, sin botones ni controles)
 * - Tarjeta 4: ¿Por qué? (explicación cotidiana del impacto en la salud según el nivel de contaminación)
 * - Cero botones, cero menús, cero controles de navegación
 */

window.Interface = (() => {

  let _progressInterval = null;
  let _clockInterval    = null;
  let _progressStartTime = 0;
  let _progressDuration  = 0;

  /**
   * Obtiene la configuración de diseño, recomendaciones y explicaciones dinámicas
   * según el valor numérico del AQI y la categoría oficial.
   */
  function _getDesignData(record) {
    const aqi = typeof record.aqi === 'number' ? record.aqi : 75;

    let key = 'moderate';
    let categoryName = 'Moderada';
    let pillBg = '#FFF3D6';
    let pillColor = '#B27B00';
    let recBg = '#FFF8E7';
    let recBorder = 'rgba(255, 178, 28, 0.28)';
    let recIconColor = '#D97706';
    let thumbPct = 30;

    if (aqi <= 50) {
      key = 'good';
      categoryName = 'Buena';
      pillBg = '#E6F9EE';
      pillColor = '#279652';
      recBg = '#F0FDF4';
      recBorder = 'rgba(72, 200, 120, 0.28)';
      recIconColor = '#279652';
      thumbPct = 10;
    } else if (aqi <= 100) {
      key = 'moderate';
      categoryName = 'Moderada';
      pillBg = '#FFF3D6';
      pillColor = '#B27B00';
      recBg = '#FFF8E7';
      recBorder = 'rgba(255, 178, 28, 0.28)';
      recIconColor = '#D97706';
      thumbPct = 30;
    } else if (aqi <= 150) {
      key = 'sensitive';
      categoryName = 'Dañina para grupos sensibles';
      pillBg = '#FFEBD4';
      pillColor = '#D96B00';
      recBg = '#FFF4E8';
      recBorder = 'rgba(255, 120, 30, 0.28)';
      recIconColor = '#D96B00';
      thumbPct = 50;
    } else if (aqi <= 200) {
      key = 'unhealthy';
      categoryName = 'Dañina';
      pillBg = '#FFE4E6';
      pillColor = '#D32F2F';
      recBg = '#FEF2F2';
      recBorder = 'rgba(240, 68, 85, 0.35)';
      recIconColor = '#D32F2F';
      thumbPct = 70;
    } else if (aqi <= 300) {
      key = 'very_unhealthy';
      categoryName = 'Muy dañina';
      pillBg = '#F3E8FF';
      pillColor = '#7E22CE';
      recBg = '#FAF5FF';
      recBorder = 'rgba(147, 51, 234, 0.35)';
      recIconColor = '#7E22CE';
      thumbPct = 85;
    } else {
      key = 'hazardous';
      categoryName = 'Peligrosa';
      pillBg = '#FEE2E2';
      pillColor = '#991B1B';
      recBg = '#FEF2F2';
      recBorder = 'rgba(220, 38, 38, 0.50)';
      recIconColor = '#991B1B';
      thumbPct = 96;
    }

    // Mensajes oficiales del JSON de referencia
    const recommendations = {
      good: 'Disfruta tus actividades al aire libre. La calidad del aire es favorable.',
      moderate: 'Si puedes, evita realizar actividad física intensa al aire libre.',
      sensitive: 'Personas sensibles deben reducir el esfuerzo físico prolongado al aire libre.',
      unhealthy: 'Reduce las actividades al aire libre y evita el ejercicio intenso.',
      very_unhealthy: 'Evita permanecer al aire libre. Busca espacios interiores.',
      hazardous: 'Permanece en interiores y limita al máximo la exposición al aire exterior.',
    };

    const explanations = {
      good: 'La concentración de contaminantes es mínima y el aire es completamente seguro para respirar libremente.',
      moderate: 'La calidad del aire puede afectar tu salud, especialmente si tienes problemas respiratorios.',
      sensitive: 'Partículas microscópicas en el ambiente pueden irritar ojos, garganta y pulmones en personas sensibles.',
      unhealthy: 'La cantidad de contaminantes en el aire puede provocar tos, fatiga respiratoria o molestias al respirar.',
      very_unhealthy: 'Los niveles de polución son críticos y pueden ocasionar daño respiratorio severo en poco tiempo.',
      hazardous: 'Alerta sanitaria máxima: las concentraciones tóxicas en el aire representan un peligro severo e inmediato para la salud de todos.',
    };

    return {
      key,
      categoryName,
      pillBg,
      pillColor,
      recBg,
      recBorder,
      recIconColor,
      thumbPct,
      recommendation: recommendations[key],
      explanation: explanations[key],
    };
  }

  /**
   * Renderiza la pantalla vertical rediseñada
   * @param {object} record - Registro ambiental
   * @param {number} durationMs - Duración del temporizador antes de volver a modo espejo
   * @param {function} onDismiss - Callback al cumplirse el temporizador
   */
  function show(record, durationMs = 13000, onDismiss = null) {
    const overlay = document.getElementById('ui-overlay');
    if (!overlay) return;

    document.body.classList.add('state-information');

    const design = _getDesignData(record);

    // Nombre de la estación para el encabezado
    let stationName = 'Estación Local';
    if (record.station) {
      stationName = record.station.replace(/^Estación\s*/i, '').split('·')[0].split('(')[0].trim();
      if (!stationName.toLowerCase().startsWith('estación')) {
        stationName = `Estación ${stationName}`;
      }
    }

    // Formatear valor de PM2.5
    const pmVal    = record.pollutantValue || '8.2 µg/m³';
    const pmNumber = typeof record.pollutantValue === 'number'
      ? `${record.pollutantValue} µg/m³`
      : (record.pollutantValue || '8.2 µg/m³');

    // Hora inicial formateada
    const _fmt = () => new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });

    // Segundos restantes inicial
    const totalSec = Math.round(durationMs / 1000);

    overlay.innerHTML = `
      <div class="bga-kiosk-wrapper" role="region" aria-label="Panel de Calidad del Aire de Bogotá">
        <div class="bga-kiosk-panel">

          <!-- ── A. Encabezado ─────────────────────────────────────────── -->
          <header class="bga-header">
            <div class="bga-header-left">
              <h1 class="bga-city">Bogotá</h1>
              <div class="bga-station-status">
                <span class="bga-status-dot"></span>
                <span class="bga-station-label">${stationName}</span>
              </div>
            </div>
            <div class="bga-header-right">
              <div class="bga-clock" id="bga-clock">${_fmt()}</div>
            </div>
          </header>

          <!-- ── B. Calidad del Aire ───────────────────────────────────── -->
          <section class="bga-card bga-card-air">
            <span class="bga-card-subtitle">Índice de calidad del aire</span>
            <div class="bga-aqi-number">${record.aqi}</div>
            <div class="bga-pill-wrap">
              <span class="bga-category-pill" style="background:${design.pillBg}; color:${design.pillColor};">
                ${design.categoryName}
              </span>
            </div>
            <div class="bga-pollutant-row">
              ${record.pollutant || 'PM2.5'} · ${pmNumber}
            </div>
            <div class="bga-scale-container">
              <div class="bga-scale-bar">
                <span class="bga-scale-seg bga-seg-good" title="Buena"></span>
                <span class="bga-scale-seg bga-seg-moderate" title="Moderada"></span>
                <span class="bga-scale-seg bga-seg-sensitive" title="Sensible"></span>
                <span class="bga-scale-seg bga-seg-unhealthy" title="Dañina"></span>
                <span class="bga-scale-seg bga-seg-hazardous" title="Peligrosa"></span>
                <div class="bga-scale-thumb" style="left: ${design.thumbPct}%;"></div>
              </div>
              <div class="bga-scale-labels">
                <span>Buena</span>
                <span>Moderada</span>
                <span>Peligrosa</span>
              </div>
            </div>
          </section>

          <!-- ── B2. Explicación PM2.5 ─────────────────────────────────── -->
          <section class="bga-card bga-card-pm25">
            <div class="bga-pm25-row">
              <div class="bga-pm25-block">
                <span class="bga-pm25-term">PM2.5</span>
                <span class="bga-pm25-desc">Partículas microscópicas contaminantes que pueden entrar profundamente en los pulmones.</span>
              </div>
            </div>
            <div class="bga-pm25-divider"></div>
            <div class="bga-pm25-row">
              <div class="bga-pm25-block">
                <span class="bga-pm25-value">${pmNumber}</span>
                <span class="bga-pm25-desc">Cantidad de esas partículas presentes en cada metro cúbico de aire.</span>
              </div>
            </div>
          </section>

          <!-- ── C. Recomendación ──────────────────────────────────────── -->
          <section class="bga-card bga-card-rec" style="background:${design.recBg}; border:1px solid ${design.recBorder};">
            <div class="bga-rec-header">
              <svg class="bga-shield-icon" viewBox="0 0 24 24" fill="none" stroke="${design.recIconColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <h2 class="bga-rec-title">Recomendación</h2>
            </div>
            <p class="bga-rec-body">
              ${design.recommendation}
            </p>
          </section>

          <!-- ── D. Ubicación GPS ──────────────────────────────────────── -->
          <section class="bga-card bga-card-map">
            <h2 class="bga-map-title">Tu ubicación GPS</h2>
            <div id="ios-map-container" class="bga-map-view"></div>
            <div class="bga-gps-footer">
              <span class="bga-gps-dot"></span>
              <span class="bga-gps-text">GPS activo</span>
            </div>
          </section>

          <!-- ── E. ¿Por qué? ──────────────────────────────────────────── -->
          <section class="bga-card bga-card-why">
            <div class="bga-why-header">
              <svg class="bga-info-icon" viewBox="0 0 24 24" fill="none" stroke="#64708A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <h2 class="bga-why-title">¿Por qué?</h2>
            </div>
            <p class="bga-why-body">
              ${design.explanation}
            </p>
          </section>

          <!-- ── Temporizador + countdown ──────────────────────────────── -->
          <div class="bga-timer-section">
            <span class="bga-countdown-label" id="bga-countdown-label">Esta información se cerrará en <strong id="bga-countdown-sec">${totalSec}</strong>s</span>
            <div class="bga-timer-track">
              <div class="bga-timer-fill" id="bga-timer-fill"></div>
            </div>
          </div>

        </div>
      </div>
    `;

    overlay.classList.add('visible');

    // Inicializar mapa original conservando proveedor y marcador GPS
    if (window.LocationMap) {
      window.LocationMap.init('ios-map-container', record.color || '#FFCC35');
    }

    _startTimerProgress(durationMs, onDismiss);
  }

  function _startTimerProgress(durationMs, onFinish) {
    if (_progressInterval) clearInterval(_progressInterval);
    if (_clockInterval)    clearInterval(_clockInterval);

    const fill        = document.getElementById('bga-timer-fill');
    const clockEl     = document.getElementById('bga-clock');
    const countdownEl = document.getElementById('bga-countdown-sec');

    _progressStartTime = performance.now();
    _progressDuration  = durationMs;
    const totalSec     = Math.round(durationMs / 1000);

    // Reloj en tiempo real (actualiza cada segundo)
    _clockInterval = setInterval(() => {
      if (clockEl) {
        clockEl.textContent = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
    }, 1000);

    _progressInterval = setInterval(() => {
      const elapsed = performance.now() - _progressStartTime;
      const pct = Math.min(100, (elapsed / _progressDuration) * 100);
      if (fill) fill.style.width = `${pct}%`;

      // Actualizar segundos restantes
      const remaining = Math.max(0, totalSec - Math.floor(elapsed / 1000));
      if (countdownEl) countdownEl.textContent = remaining;

      if (elapsed >= _progressDuration) {
        clearInterval(_progressInterval);
        clearInterval(_clockInterval);
        _progressInterval = null;
        _clockInterval    = null;
        if (onFinish) onFinish();
      }
    }, 250);
  }

  function hide() {
    if (_progressInterval) {
      clearInterval(_progressInterval);
      _progressInterval = null;
    }
    if (_clockInterval) {
      clearInterval(_clockInterval);
      _clockInterval = null;
    }

    document.body.classList.remove('state-information');
    const overlay = document.getElementById('ui-overlay');
    if (!overlay) return;

    overlay.classList.remove('visible');
    setTimeout(() => {
      overlay.innerHTML = '';
    }, 450);
  }

  return {
    show,
    hide,
  };
})();
