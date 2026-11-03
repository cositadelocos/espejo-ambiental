/**
 * environmentalData.js — Capa de datos ambientales para Puente Aranda, Bogotá
 *
 * Simula y estructura los datos de calidad del aire basándose en la
 * Red de Monitoreo de Calidad del Aire de Bogotá (RMCAB) y el
 * Índice Bogotano de Calidad del Aire (IBOCA).
 *
 * Estaciones representativas de la localidad de Puente Aranda:
 * 1. Carvajal - Sevillana (Autopista Sur con Calle 45A Sur) — Corredor de tráfico pesado
 * 2. Puente Aranda (Calle 10 con Carrera 65) — Zona industrial y comercial
 * 3. Kennedy (Zona occidental adyacente a Puente Aranda)
 */

window.ENVIRONMENTAL_DATA = (() => {

  /** Categorías oficiales IBOCA con rangos y paleta oficial */
  const IBOCA_LEVELS = [
    {
      min: 0,
      max: 50,
      category: 'BUENA',
      color: '#34C759',        // Apple iOS Green
      colorBg: 'rgba(52, 199, 89, 0.16)',
      colorBorder: 'rgba(52, 199, 89, 0.35)',
      colorGlow: 'rgba(52, 199, 89, 0.45)',
      description: 'El aire es óptimo y no representa ningún riesgo.',
    },
    {
      min: 51,
      max: 100,
      category: 'MODERADA',
      color: '#FFCC00',        // Apple iOS Yellow
      colorBg: 'rgba(255, 204, 0, 0.16)',
      colorBorder: 'rgba(255, 204, 0, 0.35)',
      colorGlow: 'rgba(255, 204, 0, 0.45)',
      description: 'Calidad de aire aceptable para la mayoría de personas.',
    },
    {
      min: 101,
      max: 150,
      category: 'REGULAR · RIESGO MODERADO',
      color: '#FF9500',        // Apple iOS Orange
      colorBg: 'rgba(255, 149, 0, 0.16)',
      colorBorder: 'rgba(255, 149, 0, 0.35)',
      colorGlow: 'rgba(255, 149, 0, 0.45)',
      description: 'Puede causar molestias a grupos sensibles o vulnerables.',
    },
    {
      min: 151,
      max: 200,
      category: 'MALA · ALTO RIESGO',
      color: '#FF3B30',        // Apple iOS Red
      colorBg: 'rgba(255, 59, 48, 0.18)',
      colorBorder: 'rgba(255, 59, 48, 0.38)',
      colorGlow: 'rgba(255, 59, 48, 0.50)',
      description: 'Toda la población puede comenzar a sentir efectos adversos.',
    },
    {
      min: 201,
      max: 300,
      category: 'MUY MALA · PELIGROSA',
      color: '#AF52DE',        // Apple iOS Purple
      colorBg: 'rgba(175, 82, 222, 0.18)',
      colorBorder: 'rgba(175, 82, 222, 0.38)',
      colorGlow: 'rgba(175, 82, 222, 0.50)',
      description: 'Alerta sanitaria: condiciones nocivas para la salud de todos.',
    },
  ];

  /** Escenarios reales / demostrativos representativos de Puente Aranda */
  const SCENARIOS = [
    {
      id: 'moderada-sevillana',
      aqi: 78,
      station: 'Carvajal - Sevillana (Autopista Sur)',
      location: 'Puente Aranda, Bogotá',
      pollutant: 'PM2.5',
      pollutantValue: '26.4 µg/m³',
      pollutantFullName: 'Material Particulado fino (< 2.5 µm)',
      whoComparison: '1.7x sobre el límite diario recomendado por la OMS (15 µg/m³)',
      humidity: '68%',
      temperature: '17°C',
      context: 'Tarde despejada con flujo vehicular moderado en la Autopista Sur.',
      isDemo: true,
    },
    {
      id: 'regular-puentearanda',
      aqi: 124,
      station: 'Puente Aranda (Calle 10 con Cra 65)',
      location: 'Zona Industrial Puente Aranda, Bogotá',
      pollutant: 'PM10',
      pollutantValue: '86.1 µg/m³',
      pollutantFullName: 'Material Particulado grueso (< 10 µm)',
      whoComparison: '1.9x sobre el límite diario recomendado por la OMS (45 µg/m³)',
      humidity: '54%',
      temperature: '19°C',
      context: 'Hora pico matutina: emisiones concentradas de camiones de carga pesada y buses.',
      isDemo: true,
    },
    {
      id: 'danina-alerta',
      aqi: 168,
      station: 'Carvajal - Sevillana · Alerta Amarilla',
      location: 'Corredor Industrial Puente Aranda, Bogotá',
      pollutant: 'PM2.5',
      pollutantValue: '62.8 µg/m³',
      pollutantFullName: 'Material Particulado fino (< 2.5 µm)',
      whoComparison: '4.1x sobre el límite diario recomendado por la OMS',
      humidity: '42%',
      temperature: '21°C',
      context: 'Inversión térmica y alto tránsito diésel: la contaminación no logra dispersarse.',
      isDemo: true,
    },
    {
      id: 'buena-domingo',
      aqi: 34,
      station: 'Puente Aranda (Av. de las Américas)',
      location: 'Puente Aranda, Bogotá',
      pollutant: 'PM2.5',
      pollutantValue: '8.2 µg/m³',
      pollutantFullName: 'Material Particulado fino (< 2.5 µm)',
      whoComparison: 'Dentro de los parámetros de aire limpio de la OMS',
      humidity: '74%',
      temperature: '15°C',
      context: 'Domingo de ciclovía y restricción de transporte de carga: aire despejado.',
      isDemo: true,
    },
  ];

  /**
   * Obtiene la clasificación y color para un valor AQI dado
   */
  function getLevel(aqi) {
    for (const lvl of IBOCA_LEVELS) {
      if (aqi >= lvl.min && aqi <= lvl.max) return lvl;
    }
    return IBOCA_LEVELS[IBOCA_LEVELS.length - 1];
  }

  /**
   * Enriquece un escenario con sus datos calculados de nivel y porcentaje en barra
   */
  function enrichRecord(scenario) {
    const level = getLevel(scenario.aqi);
    // Porcentaje en escala 0-300 para la barra estilo Apple Weather
    const percentage = Math.min(100, Math.max(0, (scenario.aqi / 300) * 100));

    return {
      ...scenario,
      category: level.category,
      color: level.color,
      colorBg: level.colorBg,
      colorBorder: level.colorBorder,
      colorGlow: level.colorGlow,
      description: level.description,
      barPercentage: percentage,
      timestamp: new Date().toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  }

  /**
   * Consulta datos reales en tiempo real mediante Open-Meteo Air Quality API
   * y geocodificación inversa para la ubicación exacta del usuario.
   * Totalmente libre, sin API key, con CORS habilitado.
   * @param {number} lat Latitud GPS
   * @param {number} lon Longitud GPS
   * @returns {Promise<object|null>} Registro ambiental enriquecido
   */
  async function fetchLiveEnvironmentalData(lat, lon) {
    try {
      // 1. Geocodificación inversa para obtener barrio, localidad y ciudad
      const geoPromise = (async () => {
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`
          );
          if (res.ok) {
            const data = await res.json();
            const locality = data.locality || data.principalSubdivision || '';
            const city = data.city || data.principalSubdivision || 'Tu Ciudad';
            return {
              locality,
              city,
              country: data.countryName || 'Colombia',
              label: locality ? `${locality}, ${city}` : city,
            };
          }
        } catch (_) {}

        // Fallback a OpenStreetMap Nominatim
        try {
          const res2 = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          );
          if (res2.ok) {
            const data2 = await res2.json();
            const addr = data2.address || {};
            const locality = addr.neighbourhood || addr.suburb || addr.quarter || addr.city_district || '';
            const city = addr.city || addr.town || addr.municipality || 'Tu Ciudad';
            return {
              locality,
              city,
              country: addr.country || 'Colombia',
              label: locality ? `${locality}, ${city}` : city,
            };
          }
        } catch (_) {}

        return { locality: 'Tu Ubicación', city: 'GPS', country: '', label: 'Tu Ubicación en Tiempo Real' };
      })();

      // 2. Consulta de calidad del aire a Open-Meteo en tiempo real
      const airPromise = (async () => {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi,european_aqi`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Open-Meteo error HTTP ${res.status}`);
        return await res.json();
      })();

      const [geoInfo, airData] = await Promise.all([geoPromise, airPromise]);
      const current = airData.current || {};

      const pm25 = typeof current.pm2_5 === 'number' ? current.pm2_5 : 12.4;
      const pm10 = typeof current.pm10 === 'number' ? current.pm10 : 22.1;
      const aqi  = typeof current.us_aqi === 'number' ? current.us_aqi : Math.round(pm25 * 3.4);

      // Comparación con límites diarios OMS (15 µg/m³ para PM2.5)
      let whoComp = '';
      if (pm25 <= 15) {
        whoComp = 'Dentro de los parámetros de aire seguro de la OMS (≤ 15 µg/m³)';
      } else {
        const mult = (pm25 / 15).toFixed(1);
        whoComp = `${mult}x sobre el límite diario recomendado por la OMS (15 µg/m³)`;
      }

      let context = `Lectura satelital y de sensores en ${geoInfo.label} actualizada en vivo.`;
      if (current.carbon_monoxide) {
        context += ` CO: ${current.carbon_monoxide} µg/m³.`;
      }

      const liveScenario = {
        id: 'gps-live-realtime',
        aqi: Math.round(aqi),
        station: `Estación Local · ${geoInfo.locality || geoInfo.city}`,
        location: geoInfo.label,
        pollutant: 'PM2.5',
        pollutantValue: `${pm25.toFixed(1)} µg/m³`,
        pollutantFullName: 'Material Particulado fino (< 2.5 µm)',
        whoComparison: whoComp,
        pm10Value: `${pm10.toFixed(1)} µg/m³`,
        coValue: current.carbon_monoxide ? `${current.carbon_monoxide.toFixed(0)} µg/m³` : null,
        humidity: 'En vivo',
        temperature: 'En vivo',
        context: context,
        isLive: true,
        coords: { lat, lon },
      };

      const enriched = enrichRecord(liveScenario);
      console.info('[EnvironmentalData] Calidad de aire en tiempo real obtenida:', enriched);
      return enriched;

    } catch (err) {
      console.warn('[EnvironmentalData] Error al obtener datos reales:', err.message);
      return null;
    }
  }

  return {
    IBOCA_LEVELS,
    SCENARIOS: SCENARIOS.map(enrichRecord),
    getLevel,
    enrichRecord,
    fetchLiveEnvironmentalData,
    getScenarioByIndex(index) {
      const safeIdx = ((index % SCENARIOS.length) + SCENARIOS.length) % SCENARIOS.length;
      return enrichRecord(SCENARIOS[safeIdx]);
    },
  };
})();
