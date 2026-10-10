// A minimal finite-state machine shared by the Bell Lab and the Repeater views.
// states: { name: { on: { EVENT: 'next' | (ctx, payload) => 'next' } } }

export function createMachine({ initial, states, context = {} }) {
  let current = initial;
  const listeners = new Set();
  const ctx = { ...context };
  return {
    get state() {
      return current;
    },
    ctx,
    can(event) {
      return Boolean(states[current] && states[current].on && states[current].on[event]);
    },
    send(event, payload) {
      const target = states[current] && states[current].on && states[current].on[event];
      if (!target) return false;
      const next = typeof target === 'function' ? target(ctx, payload) : target;
      if (!next || !states[next]) return false;
      const prev = current;
      current = next;
      for (const fn of listeners) fn(current, prev, event, payload);
      return true;
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
