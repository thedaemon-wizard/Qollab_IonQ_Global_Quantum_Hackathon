// The only place that calls Python. main.js imports the Python module (Qollab resolves
// `import * as app from 'bellkit.app'`) and hands it here together with the injected backend.
// Every call passes and returns JSON strings; calls are queued so that Python never runs two
// of them at once (an IonQ job suspends Python while it waits for the network).

let py = null;
let target = null; // the injected backend (named apart from Qollab's own `backend`)
let queue = Promise.resolve();
let inFlight = 0;
const busyListeners = new Set();

export class ApiError extends Error {
  constructor(fn, message, kind) {
    super(message);
    this.fn = fn;
    this.kind = kind;
  }
}

export function init(pythonModule, injectedBackend) {
  py = pythonModule;
  target = injectedBackend;
}

export function onBusy(fn) {
  busyListeners.add(fn);
  return () => busyListeners.delete(fn);
}

function setBusy(delta) {
  inFlight += delta;
  for (const fn of busyListeners) fn(inFlight > 0);
}

/** Last line of a Python traceback, split into exception name and message. */
function parsePythonError(err) {
  const text = String((err && err.message) || err || 'unknown error').trim();
  const lines = text.split('\n').filter((l) => l.trim());
  const last = lines[lines.length - 1] || text;
  const match = last.match(/^([\w.]+(?:Error|Backend|Large|Exception)):\s*(.*)$/);
  if (match) return { kind: match[1].split('.').pop(), message: match[2] };
  return { kind: 'Error', message: last };
}

function call(fn, ...args) {
  const run = async () => {
    if (!py) throw new ApiError(fn, 'Python is not connected', 'NotReady');
    setBusy(1);
    // Let the browser paint the "working" state before Python blocks the main thread.
    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
    try {
      const out = await py[fn].callPromising(...args);
      return JSON.parse(String(out));
    } catch (err) {
      if (err instanceof ApiError) throw err;
      const { kind, message } = parsePythonError(err);
      throw new ApiError(fn, message, kind);
    } finally {
      setBusy(-1);
    }
  };
  const result = queue.then(run, run);
  queue = result.catch(() => undefined);
  return result;
}

const json = (value) => JSON.stringify(value ?? {});

export const api = {
  backendName: () => String((target && target.name) || 'unknown'),
  config: () => call('config_json'),
  describeBackend: () => call('describe_backend_json', target),
  run: (request) => call('run_json', target, json(request)),
  theory: (request) => call('theory_json', json(request)),
  circuits: (request) => call('circuits_json', json(request)),
  geometry: (points) => call('geometry_json', json(points)),
  rosenfeld: () => call('rosenfeld_json'),
  experiments: () => call('experiments_json'),
  recorded: () => call('recorded_runs_json'),
  selftest: () => call('selftest_json'),
  /** Hand a file to Qollab's console (the frame cannot download files itself). */
  sendFile: (name, mime, base64) => call('send_file_json', name, mime, base64),
};
