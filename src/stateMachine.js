/**
 * stateMachine.js — Máquina de estados de la experiencia
 *
 * IDLE → DETECTED → REVEAL → INFORMATION → RESET → IDLE
 *
 * REGLA CRÍTICA: cada llamada a transition() cancela TODOS los
 * temporizadores pendientes antes de cambiar de estado.
 * Esto previene condiciones de carrera entre transiciones.
 */

const STATES = Object.freeze({
  IDLE:        'IDLE',
  DETECTED:    'DETECTED',
  REVEAL:      'REVEAL',
  INFORMATION: 'INFORMATION',
  RESET:       'RESET',
});

class StateMachine {
  constructor() {
    this.current   = STATES.IDLE;
    this._timers   = new Set();
    this._handlers = {};   // { [state]: [fn, ...] }
    this._onChange = [];   // se llaman en toda transición
  }

  /** Registra un callback para cuando se entra al estado `state` */
  on(state, fn) {
    (this._handlers[state] ??= []).push(fn);
    return this; // encadenable
  }

  /** Callback que se dispara en CUALQUIER transición: fn(prev, next) */
  onChange(fn) {
    this._onChange.push(fn);
    return this;
  }

  /**
   * Transiciona al nuevo estado.
   * Cancela todos los temporizadores pendientes.
   * @returns {boolean} false si ya está en ese estado
   */
  transition(newState) {
    if (this.current === newState) return false;
    const prev = this.current;
    this._clearTimers();
    this.current = newState;
    console.debug(`[SM] ${prev} → ${newState}`);
    (this._handlers[newState] ?? []).forEach(fn => fn(prev));
    this._onChange.forEach(fn => fn(prev, newState));
    return true;
  }

  /**
   * Programa una transición automática tras `ms` ms.
   * Se cancela automáticamente si hay cualquier otra transición antes.
   */
  schedule(ms, targetState) {
    const id = setTimeout(() => {
      this._timers.delete(id);
      this.transition(targetState);
    }, ms);
    this._timers.add(id);
    return id;
  }

  /**
   * Cancela temporizadores sin cambiar de estado.
   * Útil para extender el tiempo de permanencia en un estado.
   */
  clearScheduled() {
    this._clearTimers();
  }

  _clearTimers() {
    this._timers.forEach(clearTimeout);
    this._timers.clear();
  }

  is(state)       { return this.current === state; }
  isAny(...states){ return states.includes(this.current); }
  get state()     { return this.current; }
}
