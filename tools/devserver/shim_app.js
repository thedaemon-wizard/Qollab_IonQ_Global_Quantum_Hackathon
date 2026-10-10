// Stand-in for Qollab's Python bridge in the local harness: each exported function has
// .callPromising(...args), which POSTs the call to server.py. Backend objects are sent by name.
function make(name) {
  const fn = () => {
    throw new Error('call with .callPromising()');
  };
  fn.callPromising = async (...args) => {
    const payload = args.map((a) => (a && typeof a === 'object' && 'name' in a ? { __backend__: a.name } : a));
    const response = await fetch(`/call/${name}`, { method: 'POST', body: JSON.stringify({ args: payload }) });
    const out = await response.json();
    if (!out.ok) throw new Error(out.error);
    return out.value;
  };
  return fn;
}

export const config_json = make('config_json');
export const describe_backend_json = make('describe_backend_json');
export const run_json = make('run_json');
export const theory_json = make('theory_json');
export const circuits_json = make('circuits_json');
export const geometry_json = make('geometry_json');
export const rosenfeld_json = make('rosenfeld_json');
export const experiments_json = make('experiments_json');
export const recorded_runs_json = make('recorded_runs_json');
export const selftest_json = make('selftest_json');
export const send_file_json = make('send_file_json');
