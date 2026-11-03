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

  return {
    IBOCA_LEVELS,
    SCENARIOS: SCENARIOS.map(enrichRecord),
    getLevel,
    enrichRecord,
    getScenarioByIndex(index) {
      const safeIdx = ((index % SCENARIOS.length) + SCENARIOS.length) % SCENARIOS.length;
      return enrichRecord(SCENARIOS[safeIdx]);
    },
  };
})();
