/**
 * recommendations.js — Sistema pedagógico de recomendaciones contextualizadas
 *
 * Estructurado en 3 niveles de comprensión humana:
 * Nivel 1: ¿CÓMO ESTÁ EL AIRE? (Diagnóstico directo, sin tecnicismos opacos)
 * Nivel 2: ¿QUÉ SIGNIFICA PARA TI? (Explicación biológica y poblacional)
 * Nivel 3: ¿QUÉ PUEDES HACER HOY? (Recomendaciones accionables en la parada SITP y en la calle)
 *
 * Basado en guías de la OMS, Secretaría Distrital de Ambiente de Bogotá (SDA)
 * y literatura médica sobre material particulado PM2.5 / PM10.
 */

window.RECOMMENDATIONS = (() => {

  const GUIDELINES = {
    BUENA: {
      diagnostico: {
        titulo: 'Aire Limpio y Saludable',
        texto: 'La atmósfera en Puente Aranda está despejada. La ventilación natural ha dispersado los contaminantes habituales.',
      },
      impactoSalud: {
        titulo: 'Condición Óptima para Respirar',
        texto: 'No existe riesgo para ningún grupo de edad. El paso del aire a través de los pulmones es seguro y sin irritantes.',
      },
      acciones: {
        titulo: 'Aprovecha el Entorno',
        items: [
          'Ideal para esperar el transporte o caminar sin ninguna restricción.',
          'Excelente momento para realizar actividad física o ejercicio al aire libre.',
          'Puedes ventilar naturalmente tu hogar o lugar de trabajo abriendo ventanas.',
        ],
      },
    },

    MODERADA: {
      diagnostico: {
        titulo: 'Calidad de Aire Aceptable',
        texto: 'Se registra una presencia habitual de material particulado por el tránsito mixto en vías como la Carrera 68 y Autopista Sur.',
      },
      impactoSalud: {
        titulo: 'Atención a Personas Sensibles',
        texto: 'La mayoría de transeúntes no sentirá molestias inmediatas. Sin embargo, personas con asma o rinitis pueden percibir ligera sequedad en la garganta.',
      },
      acciones: {
        titulo: 'Consejos para tu Recorrido',
        items: [
          'Si sufres de asma o rinitis alérgica, mantén a la mano tu inhalador o medicación preventiva.',
          'Si vas a esperar mucho tiempo en la parada del bus SITP, aléjate un paso del borde de la calzada para evitar bocanadas directas de humo diésel.',
          'Ciclistas y peatones: pueden continuar su trayecto manteniendo buena hidratación.',
        ],
      },
    },

    'REGULAR · RIESGO MODERADO': {
      diagnostico: {
        titulo: 'Concentración Elevada de Contaminantes',
        texto: 'Las micropartículas superan el límite sugerido. El tráfico pesado y la actividad de bodegas industriales están cargando el aire local.',
      },
      impactoSalud: {
        titulo: 'Impacto en Vías Respiratorias',
        texto: 'El material particulado (PM2.5) es 30 veces más delgado que un cabello: entra directamente a los bronquiolos pulmonares, pudiendo provocar tos o ardor en ojos.',
      },
      acciones: {
        titulo: 'Medidas de Autocuidado en Calle',
        items: [
          'Grupos sensibles (niños, adultos mayores, gestantes): reduzcan esfuerzos físicos intensos en la calle.',
          'En paraderos con congestión vehicular, el uso de tapabocas con filtro (N95 o KN95) reduce notablemente la inhalación de hollín.',
          'Evita permanecer en esquinas con trancones pesados donde los camiones aceleran desde cero.',
        ],
      },
    },

    'MALA · ALTO RIESGO': {
      diagnostico: {
        titulo: 'Alerta: Atmósfera Contaminada',
        texto: 'Condición crítica en Puente Aranda. Se presenta acumulación densa de partículas suspendidas y gases de combustión diésel.',
      },
      impactoSalud: {
        titulo: 'Riesgo Respiratorio y Cardiovascular',
        texto: 'Cualquier persona puede experimentar irritación ocular, picazón de garganta y fatiga. Aumenta la probabilidad de crisis en pacientes con enfermedades crónicas.',
      },
      acciones: {
        titulo: 'Acciones Prioritarias de Protección',
        items: [
          'Usa tapabocas mientras esperas tu transporte público o caminas por corredores viales.',
          'Si viajas en bus o vehículo propio, mantén las ventanillas cerradas en zonas de embotellamiento.',
          'Suspende actividades deportivas o recreativas al aire libre hasta que los niveles disminuyan.',
          'Al llegar a tu destino, lávate la cara con agua fresca e hidrata tu garganta.',
        ],
      },
    },

    'MUY MALA · PELIGROSA': {
      diagnostico: {
        titulo: 'Emergencia Ambiental Severa',
        texto: 'Niveles extremos de polución en Puente Aranda. Situación análoga a una alerta ambiental distrital con riesgo generalizado.',
      },
      impactoSalud: {
        titulo: 'Efecto Adverso Generalizado',
        texto: 'Riesgo agudo para toda la población. Las partículas finas pueden ingresar al torrente sanguíneo provocando inflamación sistémica.',
      },
      acciones: {
        titulo: 'Protocolo de Emergencia',
        items: [
          'Uso obligatorio y permanente de mascarilla de alta eficiencia (N95) en exteriores.',
          'Permanece en interiores siempre que sea posible con puertas y ventanas ajustadas.',
          'Prioriza el teletrabajo o desplazamientos estrictamente esenciales.',
        ],
      },
    },
  };

  /**
   * Obtiene el paquete de recomendaciones para una categoría dada
   */
  function getForCategory(category) {
    return GUIDELINES[category] || GUIDELINES['MODERADA'];
  }

  return {
    GUIDELINES,
    getForCategory,
  };
})();
