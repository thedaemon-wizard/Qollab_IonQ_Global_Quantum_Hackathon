// three.js view of the symmetric section (E00, E11, m) of the CHSH correlation sets:
// no-signalling cube, local polytope and the boundary of the quantum set (TLM), with points.
// Rendering is on demand (no loop unless auto-rotate is on) and stops while hidden.
// Axes: three.js x = E00, y = m = (E01 + E10)/2, z = E11.

export function webgl2Available() {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch {
    return false;
  }
}

export async function createCorrSet3d(container, { colors, labels }) {
  const THREE = await import('three');
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  const { ConvexGeometry } = await import('three/addons/geometries/ConvexGeometry.js');
  const { CSS2DRenderer, CSS2DObject } = await import('three/addons/renderers/CSS2DRenderer.js');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.inset = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  labelRenderer.domElement.setAttribute('aria-hidden', 'true');
  container.append(renderer.domElement, labelRenderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 4 / 3, 0.1, 50);
  const home = new THREE.Vector3(3.1, 2.0, 3.4);
  camera.position.copy(home);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.target.set(0, 0, 0);
  controls.minDistance = 2;
  controls.maxDistance = 9;

  const groups = { ns: new THREE.Group(), local: new THREE.Group(), quantum: new THREE.Group(), points: new THREE.Group(), werner: new THREE.Group() };
  Object.values(groups).forEach((g) => scene.add(g));
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const light = new THREE.DirectionalLight(0xffffff, 0.9);
  light.position.set(3, 5, 4);
  scene.add(light);

  const mats = {};
  function material(key, opts) {
    mats[key] = mats[key] || opts();
    return mats[key];
  }

  // no-signalling cube [-1, 1]^3 and axes labels
  const cube = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 2, 2)), material('ns', () => new THREE.LineBasicMaterial({ color: 0x888888 })));
  groups.ns.add(cube);
  const axisLabel = (text, pos) => {
    const el = document.createElement('div');
    el.className = 'label3d';
    el.textContent = text;
    const obj = new CSS2DObject(el);
    obj.position.copy(pos);
    return obj;
  };
  groups.ns.add(axisLabel(labels.x, new THREE.Vector3(1.35, -1, -1)), axisLabel(labels.y, new THREE.Vector3(-1, 1.3, -1)), axisLabel(labels.z, new THREE.Vector3(-1, -1, 1.35)));

  // local polytope: |E00 - E11| + 2|m| <= 2 inside the cube (six vertices)
  const lv = [[1, 1, 1], [1, -1, 1], [-1, 1, -1], [-1, -1, -1], [1, 0, -1], [-1, 0, 1]].map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const localGeo = new ConvexGeometry(lv);
  groups.local.add(new THREE.Mesh(localGeo, material('local', () => new THREE.MeshStandardMaterial({ color: 0x999999, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }))));
  groups.local.add(new THREE.LineSegments(new THREE.EdgesGeometry(localGeo), material('localEdge', () => new THREE.LineBasicMaterial({ color: 0x999999 }))));

  function setQuantum(mesh) {
    groups.quantum.clear();
    const n = mesh.grid.length;
    for (const sign of [1, -1]) {
      const pos = [];
      const idx = [];
      for (let i = 0; i < n; i += 1) {
        for (let j = 0; j < n; j += 1) pos.push(mesh.grid[i], sign * mesh.quantum_half_height[i][j], mesh.grid[j]);
      }
      for (let i = 0; i < n - 1; i += 1) {
        for (let j = 0; j < n - 1; j += 1) {
          const a = i * n + j;
          idx.push(a, a + 1, a + n, a + 1, a + n + 1, a + n);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      groups.quantum.add(new THREE.Mesh(geo, material('quantum', () => new THREE.MeshStandardMaterial({ color: 0x56b4e9, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false }))));
      groups.quantum.add(new THREE.LineSegments(new THREE.WireframeGeometry(geo), material('quantumWire', () => new THREE.LineBasicMaterial({ color: 0x56b4e9, transparent: true, opacity: 0.25 }))));
    }
  }

  // Werner family v * Tsirelson point, v in [0, 1]
  const s2 = Math.SQRT1_2;
  groups.werner.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(s2, s2, -s2)]),
    material('werner', () => new THREE.LineDashedMaterial({ color: 0xe69f00, dashSize: 0.06, gapSize: 0.04 }))));
  groups.werner.children[0].computeLineDistances();

  function setPoints(points) {
    groups.points.clear();
    for (const p of points) {
      const [e00, e11, m] = p.sym;
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 14), new THREE.MeshStandardMaterial({ color: p.color }));
      mesh.position.set(e00, m, e11);
      groups.points.add(mesh);
      const lab = axisLabel(p.name, new THREE.Vector3(e00, m + 0.12, e11));
      groups.points.add(lab);
    }
    render();
  }

  function applyColors(c) {
    mats.ns.color.set(c.muted);
    mats.local.color.set(c.local);
    mats.localEdge.color.set(c.local);
    if (mats.quantum) { mats.quantum.color.set(c.quantum); mats.quantumWire.color.set(c.quantum); }
    mats.werner.color.set(c.werner);
    render();
  }

  let width = 0;
  let height = 0;
  function resize() {
    const r = container.getBoundingClientRect();
    width = Math.max(200, r.width);
    height = Math.max(150, r.height);
    renderer.setSize(width, height, false);
    labelRenderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  }
  function render() {
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  controls.addEventListener('change', render);

  let raf = 0;
  let visible = true;
  function loop() {
    if (!controls.autoRotate || !visible) { raf = 0; return; }
    controls.update();
    raf = requestAnimationFrame(loop);
  }

  const api = {
    setQuantum: (mesh) => { setQuantum(mesh); applyColors(colors()); },
    setPoints,
    show(key, on) { groups[key].visible = on; render(); },
    rotate(dAz, dPolar) {
      const offset = camera.position.clone().sub(controls.target);
      const sph = new THREE.Spherical().setFromVector3(offset);
      sph.theta += dAz;
      sph.phi = Math.min(Math.PI - 0.15, Math.max(0.15, sph.phi + dPolar));
      offset.setFromSpherical(sph);
      camera.position.copy(controls.target).add(offset);
      camera.lookAt(controls.target);
      render();
    },
    zoom(f) {
      const offset = camera.position.clone().sub(controls.target).multiplyScalar(f);
      if (offset.length() < controls.minDistance || offset.length() > controls.maxDistance) return;
      camera.position.copy(controls.target).add(offset);
      render();
    },
    reset() { camera.position.copy(home); controls.target.set(0, 0, 0); camera.lookAt(0, 0, 0); render(); },
    autoRotate(on) {
      controls.autoRotate = on;
      controls.autoRotateSpeed = 1.2;
      if (on && !raf) loop();
    },
    setVisible(v) { visible = v; if (v) { resize(); if (controls.autoRotate) loop(); } },
    recolor() { applyColors(colors()); },
    pngBase64() { render(); return renderer.domElement.toDataURL('image/png').split(',')[1]; },
    revision: THREE.REVISION,
  };
  resize();
  applyColors(colors());
  return api;
}
