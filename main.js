// Bell-Test Lab - entry point. Qollab injects `backend` (the simulator chosen in the Run
// dialog) and resolves the Python import below. Physics and statistics are computed in Python
// (bellkit/); this file only builds the interface.
import * as app from 'bellkit.app';
import { api, init, onBusy } from './ui/core/api.js';
import { h } from './ui/core/dom.js';
import { icon } from './ui/core/icons.js';
import { createRouter } from './ui/core/router.js';
import { createStore } from './ui/core/store.js';
import { themeToggle } from './ui/core/theme.js';
import { mathReady } from './ui/core/tex.js';
import { createTour } from './ui/core/tour.js';
import { VIEWS } from './ui/views/index.js';

const root = document.getElementById('bk-root');
const loading = document.getElementById('bk-loading');

async function start() {
  init(app, backend);
  const formulas = mathReady(); // Temml from jsDelivr; plain Unicode formulas if it cannot load
  const [config, backendInfo] = [await api.config(), await api.describeBackend()];
  await formulas;

  const store = createStore({
    runs: [], // every run of this session, newest last
    last: {}, // last report per module
    ionqJobsUsed: 0,
  });

  const header = document.getElementById('bk-header');
  const brand = document.getElementById('bk-brand');
  brand.replaceChildren(icon('atom', { size: 22 }), h('span', null, 'Bell-Test Lab'),
    h('span', { class: 'muted small long' }, 'one CHSH experiment, a ladder of certificates'));

  const busy = h('span', { class: 'busy', hidden: true, role: 'status' },
    h('span', { class: 'spinner', 'aria-hidden': 'true' }), h('span', { class: 'busy-label' }, 'Python is working…'));
  onBusy((on) => {
    busy.hidden = !on;
    root.setAttribute('aria-busy', on ? 'true' : 'false');
  });
  const profile = backendInfo.profile;
  const chipClass = profile.refuse ? 'bad' : profile.id === config.default_profile.id ? 'warn' : 'good';
  const backendChip = h('span', { class: `chip ${chipClass}`, title: `Run profile: ${profile.label}` },
    icon('server', { size: 16 }), h('span', null, backendInfo.name), h('span', { class: 'muted chip-detail' }, `· ${profile.label}`));
  const theme = themeToggle(root);
  // on a phone the label is visually hidden (it stays the button's name), so the header keeps to two rows
  const tourBtn = h('button', { class: 'btn', type: 'button', title: 'Guided tour' }, icon('school'), h('span', { class: 'btn-label' }, 'Guided tour'));

  header.append(h('span', { class: 'spacer' }), busy, backendChip, tourBtn, theme.element);
  // The header is sticky and wraps to more rows on narrow frames. Its height (--hdr) keeps
  // focused fields, scrolled-to targets and the sticky nav out from under it.
  const syncHeader = () => document.documentElement.style.setProperty('--hdr', `${Math.ceil(header.getBoundingClientRect().height)}px`);
  syncHeader();
  if (typeof ResizeObserver === 'function') new ResizeObserver(syncHeader).observe(header);

  const ctx = { api, store, config, backend: backendInfo, root, theme };
  const router = createRouter({
    nav: document.getElementById('bk-nav'),
    main: document.getElementById('bk-main'),
    views: VIEWS,
    ctx,
  });
  ctx.router = router;
  const tour = createTour(ctx);
  ctx.tour = tour;
  tourBtn.addEventListener('click', () => tour.start(tourBtn));

  // The skip link moves focus without changing the URL (a hash change would add history
  // entries to the page that embeds this frame).
  document.querySelector('.skip-link').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('bk-main').focus();
  });

  loading.remove();
  await router.go('overview');
}

try {
  await start();
} catch (err) {
  loading.textContent = `The lab could not start: ${err && err.message ? err.message : err}`;
  loading.setAttribute('role', 'alert');
  console.error(err);
}

// Keep main.js running: Qollab's sendFile and the backend stay available only while it does.
await new Promise(() => {});
