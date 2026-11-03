/**
 * interface.js — Sistema de interfaz visual Apple iOS para Pantalla Vertical (Tótem SITP / Celular)
 *
 * Optimizaciones clave:
 * - Cero barras de deslizamiento (No-scroll, viewport 100vh exacto)
 * - Mapa integrado Apple Maps Dark con la ubicación real del usuario / computador
 * - 3 Niveles pedagógicos concisos y legibles a distancia
 * - Estética Dynamic Island y Liquid Glassmorphism
 */

window.Interface = (() => {

  let _progressInterval = null;
  let _progressStartTime = 0;
  let _progressDuration = 0;

  /**
   * Renderiza la interfaz vertical completa sin scroll
   * @param {object} record - Registro ambiental
   * @param {number} durationMs - Duración del temporizador
   * @param {function} onDismiss - Callback de cierre manual
   */
  function show(record, durationMs = 13000, onDismiss = null) {
    const overlay = document.getElementById('ui-overlay');
    if (!overlay) return;

    const recs = window.RECOMMENDATIONS ?
      window.RECOMMENDATIONS.getForCategory(record.category) : null;

    document.body.classList.add('state-information');

    // Consultar distancia a la estación más cercana
    const nearInfo = window.LocationMap ? window.LocationMap.getNearestStationDistance() : null;
    const distText = nearInfo ? `A ${nearInfo.distanceKm} km de Estación ${nearInfo.station.name}` : 'Puente Aranda, Bogotá';

    overlay.innerHTML = `
      <div class="ios-vertical-kiosk" id="ios-kiosk" role="dialog" aria-modal="true">

        <!-- ── Dynamic Island Pill (Top) ─────────────────────────────── -->
        <header class="ios-island">
          <div class="island-left">
            <span class="island-live-dot"></span>
            <span class="island-station">${record.station.split('·')[0]}</span>
          </div>
          <div class="island-right">
            <span class="island-badge">EN VIVO</span>
            <span class="island-time">${record.timestamp}</span>
          </div>
        </header>

        <!-- ── Contenedor Kiosk Vertical Sin Scroll ──────────────────── -->
        <main class="ios-sheet-vertical">

          <!-- 1. Hero Widget AQI (Apple Weather) -->
          <section class="ios-hero-compact" style="--aqi-color: ${record.color}; --aqi-glow: ${record.colorGlow};">
            <div class="hero-header-compact">
              <div class="hero-left-meta">
                <span class="hero-tag">CALIDAD DEL AIRE · PUENTE ARANDA</span>
                <span class="hero-status-pill" style="background:${record.colorBg}; border-color:${record.colorBorder}; color:${record.color};">
                  ${record.category}
                </span>
              </div>
              <div class="hero-pollutant-badge">
                <span class="pollutant-sym">${record.pollutant}</span>
                <span class="pollutant-num">${record.pollutantValue}</span>
              </div>
            </div>

            <div class="hero-metric-row-compact">
              <div class="hero-aqi-value-compact">${record.aqi}</div>
              <div class="hero-context-compact">
                <div class="hero-unit-label">Índice IBOCA / AQI</div>
                <div class="hero-who-sub">${record.whoComparison}</div>
              </div>
            </div>

            <!-- Barra de gradiente continuo estilo Apple Weather -->
            <div class="ios-aqi-slider-compact">
              <div class="ios-aqi-slider-track">
                <div class="ios-aqi-slider-thumb" style="left: ${record.barPercentage}%;"></div>
              </div>
              <div class="ios-aqi-slider-labels">
                <span>Buena</span>
                <span>50</span>
                <span>Moderada</span>
                <span>150</span>
                <span>Peligrosa</span>
              </div>
            </div>
          </section>

          <!-- 2. Sección dividida: Mapa GPS y Diagnóstico -->
          <div class="ios-split-grid">

            <!-- Tarjeta Mapa Apple Maps Dark -->
            <article class="ios-card-widget ios-map-card">
              <div class="widget-mini-header">
                <div class="mini-icon-title">
                  <span class="map-pulse-dot"></span>
                  <span class="widget-mini-title">Tu Ubicación (GPS / Casa)</span>
                </div>
                <span class="map-dist-pill">${distText}</span>
              </div>
              <!-- Contenedor del Mapa Leaflet -->
              <div id="ios-map-container" class="ios-map-view"></div>
            </article>

            <!-- Tarjeta Diagnóstico e Impacto Fisiológico -->
            <article class="ios-card-widget ios-health-card">
              <div class="widget-mini-header">
                <div class="mini-icon-title">
                  <svg class="mini-svg" viewBox="0 0 24 24" fill="none" stroke="${record.color}" stroke-width="2">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                  <span class="widget-mini-title">Impacto en tu Salud</span>
                </div>
              </div>
              <p class="health-lead">${recs ? recs.diagnostico.titulo : 'Diagnóstico atmosférico'}</p>
              <p class="health-body">${recs ? recs.impactoSalud.texto : record.description}</p>
            </article>

          </div>

          <!-- 3. Acciones Recomendadas en Paradero SITP / Vía Pública -->
          <article class="ios-card-widget ios-actions-card" style="border-color:${record.colorBorder};">
            <div class="widget-mini-header">
              <div class="mini-icon-title">
                <svg class="mini-svg" viewBox="0 0 24 24" fill="none" stroke="${record.color}" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span class="widget-mini-title" style="color:${record.color};">¿Qué hacer ahora en la calle?</span>
              </div>
            </div>
            <ul class="action-items-compact">
              ${recs && recs.acciones ? recs.acciones.items.slice(0, 2).map(item => `
                <li>
                  <span class="action-bullet" style="background:${record.color}"></span>
                  <span>${item}</span>
                </li>
              `).join('') : `<li>Sigue las pautas preventivas locales.</li>`}
            </ul>
          </article>

          <!-- 4. Footer Compacto con Barra de Temporizador -->
          <footer class="ios-kiosk-footer">
            <div class="kiosk-footer-row">
              <span class="footer-rmcab-tag">📍 RMCAB Bogotá · Estación Puente Aranda</span>
              <button class="ios-btn-dismiss-compact" id="ios-btn-dismiss" type="button">
                <span>Continuar</span>
                <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                  <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
            <div class="ios-timer-bar">
              <div class="ios-timer-progress" id="ios-timer-progress"></div>
            </div>
          </footer>

        </main>
      </div>
    `;

    overlay.classList.add('visible');

    // Inicializar mapa Apple Maps Dark Mode con la ubicación del usuario
    if (window.LocationMap) {
      window.LocationMap.init('ios-map-container', record.color);
    }

    // Botón de descarte manual
    const btnDismiss = document.getElementById('ios-btn-dismiss');
    if (btnDismiss && onDismiss) {
      btnDismiss.addEventListener('click', onDismiss);
    }

    _startTimerProgress(durationMs);
  }

  function _startTimerProgress(durationMs) {
    if (_progressInterval) clearInterval(_progressInterval);
    const bar = document.getElementById('ios-timer-progress');
    if (!bar) return;

    _progressStartTime = performance.now();
    _progressDuration = durationMs;

    _progressInterval = setInterval(() => {
      const elapsed = performance.now() - _progressStartTime;
      const pct = Math.min(100, (elapsed / _progressDuration) * 100);
      if (bar) bar.style.width = `${pct}%`;
      if (elapsed >= _progressDuration) {
        clearInterval(_progressInterval);
      }
    }, 50);
  }

  function hide() {
    if (_progressInterval) {
      clearInterval(_progressInterval);
      _progressInterval = null;
    }

    document.body.classList.remove('state-information');
    const overlay = document.getElementById('ui-overlay');
    if (!overlay) return;

    overlay.classList.remove('visible');
    setTimeout(() => {
      overlay.innerHTML = '';
    }, 600);
  }

  return {
    show,
    hide,
  };
})();
