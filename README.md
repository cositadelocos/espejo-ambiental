# 🌫️ Espejo Ambiental Interactivo
### Puente Aranda, Bogotá — Prototipo Universitario

> **Concepto:** HACER VISIBLE LO INVISIBLE  
> Una instalación de arte digital que comunica la calidad del aire mediante una experiencia visual inmersiva.

---

## Fase actual: FASE 1 — Estructura y Animación

| Estado | Componente |
|--------|-----------|
| ✅ | Sistema de partículas con ruido de Perlin |
| ✅ | Texto de invitación con pulsación |
| ✅ | Viñeta radial y efecto de profundidad |
| ✅ | Trail / efecto niebla |
| ✅ | Indicador FPS + ajuste de partículas |
| ✅ | Servidor local con `npx serve` |
| ⏳ | Máquina de estados (Fase 2) |
| ⏳ | MediaPipe (Fase 3) |
| ⏳ | Información ambiental (Fase 4) |

---

## Inicio rápido

### Opción A — Con Node.js (recomendado)

```bash
# Desde la carpeta del proyecto
npx serve . --listen 3000
```

Luego abre en tu navegador:  
**http://localhost:3000**

### Opción B — Extensión VS Code

Instala **Live Server** de Ritwick Dey y haz clic derecho en `index.html` → *Open with Live Server*.

### Opción C — Doble clic (limitaciones)

Abrir `index.html` directamente con doble clic puede funcionar, pero las fases 3 y 4 (cámara) **requieren** servidor local o HTTPS.

---

## Controles de teclado (Fase 1)

| Tecla | Acción |
|-------|--------|
| `F` | Mostrar / ocultar contador FPS |
| `+` / `=` | Aumentar partículas (+300) |
| `-` | Reducir partículas (−300) |
| `D` | Panel de debug (disponible en Fase 2) |

---

## Rendimiento esperado

| Hardware | Partículas recomendadas | FPS esperados |
|----------|------------------------|---------------|
| Gama alta | 3000 | 60 |
| Gama media | 1800 (por defecto) | 55–60 |
| Gama baja | 800 | 40–60 |

Ajusta `CONFIG.particles.count` en [`src/config.js`](src/config.js) o usa `+` / `-` en tiempo real.

---

## Estructura del proyecto

```
INNOVACIÓN/
├── index.html              ← Punto de entrada
├── styles.css              ← Sistema de diseño CSS
├── README.md               ← Este archivo
└── src/
    ├── config.js           ← Configuración global (ajustar aquí primero)
    ├── particles.js        ← Motor de partículas + física Perlin
    └── main.js             ← Sketch p5.js principal
```

### Archivos a crear en fases siguientes

```
src/
    ├── stateMachine.js     ← Fase 2: IDLE / DETECTED / REVEAL / INFORMATION / RESET
    ├── presenceDetection.js← Fase 3: MediaPipe + modo simulación
    ├── environmentalData.js← Fase 4: Datos DEMO / futura API IBOCA
    ├── recommendations.js  ← Fase 4: Mensajes y recomendaciones
    ├── interface.js        ← Fase 4: UI informativa
    └── debugPanel.js       ← Fase 2: Panel de depuración (tecla D)
```

---

## Notas técnicas importantes

### Cámara y HTTPS
La API `getUserMedia` de MediaPipe **requiere** un contexto seguro:
- `localhost` siempre funciona ✅
- `127.0.0.1` funciona ✅  
- IP de red local (`192.168.x.x`) **necesita HTTPS** → usar [ngrok](https://ngrok.com/) o certificado autofirmado

### Datos ambientales — Estado de la investigación
El **IBOCA** (Sistema de Información sobre Calidad del Aire de Bogotá) y la Red de Monitoreo no exponen una API pública con CORS habilitado accesible directamente desde el navegador.  
**Plan alternativo documentado en Fase 4:** proxy ligero con Node.js o datos estáticos actualizados manualmente con script de scraping.

---

## Cómo comprobar que la Fase 1 funciona

1. Abre `http://localhost:3000`
2. Debes ver fondo oscuro (#080a10) con partículas en movimiento
3. En el centro debe aparecer el texto *"¿Sabes qué aire estás respirando?"* pulsando suavemente
4. El contador FPS en esquina superior derecha debe mostrar ≥ 50 FPS
5. Presiona `+` para ver más partículas, `-` para reducirlas
6. Presiona `F` para ocultar el contador FPS

---

*Desarrollado como prototipo universitario — Datos en modo DEMO, no representan mediciones reales.*
