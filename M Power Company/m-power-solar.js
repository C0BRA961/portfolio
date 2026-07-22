(function(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('bg-canvas');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(0, 0, 20);
  camera.lookAt(0, 0, -10);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setClearColor(0x0B1120, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  function sizeRenderer(){
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  sizeRenderer();

  const netGroup = new THREE.Group();
  scene.add(netGroup);

  // ---- generate node field ----
  const N = 140;
  const X_RANGE = 46, Y_RANGE = 58, Z_MIN = -28, Z_MAX = -2;
  const nodes = [];

  function nodeColor(x, y){
    const t = THREE.MathUtils.clamp((x + X_RANGE) / (X_RANGE * 2), 0, 1);
    const vt = THREE.MathUtils.clamp((y + Y_RANGE) / (Y_RANGE * 2), 0, 1);
    let hue = THREE.MathUtils.lerp(0.09, 0.78, t);
    hue += (vt - 0.5) * 0.18;
    hue = ((hue % 1) + 1) % 1;
    const sat = 0.72 + Math.random() * 0.18;
    const light = 0.52 + Math.random() * 0.14;
    return new THREE.Color().setHSL(hue, sat, light);
  }

  for (let i = 0; i < N; i++){
    const x = (Math.random() - 0.5) * X_RANGE * 2;
    const y = (Math.random() - 0.5) * Y_RANGE * 2;
    const z = Z_MIN + Math.random() * (Z_MAX - Z_MIN);
    const color = nodeColor(x, y);
    const reveal = 1 - THREE.MathUtils.clamp((y + Y_RANGE) / (Y_RANGE * 2), 0, 1); // top revealed first
    nodes.push({ x, y, z, color, reveal, size: 2.0 + Math.random() * 3.2 });
  }

  // ---- edges (within threshold distance) ----
  const THRESH = 12.5;
  const edges = [];
  const adj = Array.from({ length: N }, () => new Set());
  for (let i = 0; i < N; i++){
    for (let j = i + 1; j < N; j++){
      const a = nodes[i], b = nodes[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      if (d < THRESH){
        edges.push([i, j]);
        adj[i].add(j); adj[j].add(i);
      }
    }
  }

  // ---- triangles (mutually connected triples) for filled shard faces ----
  const triangles = [];
  edges.forEach(([i, j]) => {
    adj[i].forEach(k => {
      if (k > j && adj[j].has(k)) triangles.push([i, j, k]);
    });
  });

  // ---- shared shaders ----
  const vertHeader = `
    attribute float reveal;
    attribute vec3 vColorAttr;
    varying float vReveal;
    varying vec3 vColor;
    uniform float uProgress;
  `;

  const pointVert = `
    ${vertHeader}
    attribute float pSize;
    void main(){
      vReveal = reveal;
      vColor = vColorAttr;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = pSize * (260.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;
  const pointFrag = `
    precision mediump float;
    varying float vReveal;
    varying vec3 vColor;
    uniform float uProgress;
    void main(){
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;
      float edge = uProgress - vReveal;
      float alpha = smoothstep(-0.04, 0.06, edge);
      alpha *= smoothstep(0.5, 0.05, d);
      if (alpha <= 0.01) discard;
      gl_FragColor = vec4(vColor, alpha * 0.95);
    }
  `;

  const lineVert = `
    ${vertHeader}
    void main(){
      vReveal = reveal;
      vColor = vColorAttr;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const lineFrag = `
    precision mediump float;
    varying float vReveal;
    varying vec3 vColor;
    uniform float uProgress;
    void main(){
      float edge = uProgress - vReveal;
      float alpha = smoothstep(-0.04, 0.08, edge);
      if (alpha <= 0.01) discard;
      gl_FragColor = vec4(vColor, alpha * 0.45);
    }
  `;

  const faceFrag = `
    precision mediump float;
    varying float vReveal;
    varying vec3 vColor;
    uniform float uProgress;
    void main(){
      float edge = uProgress - vReveal;
      float alpha = smoothstep(-0.04, 0.1, edge);
      if (alpha <= 0.01) discard;
      gl_FragColor = vec4(vColor, alpha * 0.14);
    }
  `;

  const uniforms = { uProgress: { value: 1.0 } };

  // ---- points ----
  const ptPositions = new Float32Array(N * 3);
  const ptColors = new Float32Array(N * 3);
  const ptReveal = new Float32Array(N);
  const ptSize = new Float32Array(N);
  nodes.forEach((n, i) => {
    ptPositions[i*3] = n.x; ptPositions[i*3+1] = n.y; ptPositions[i*3+2] = n.z;
    ptColors[i*3] = n.color.r; ptColors[i*3+1] = n.color.g; ptColors[i*3+2] = n.color.b;
    ptReveal[i] = n.reveal;
    ptSize[i] = n.size;
  });
  const ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPositions, 3));
  ptGeo.setAttribute('vColorAttr', new THREE.BufferAttribute(ptColors, 3));
  ptGeo.setAttribute('reveal', new THREE.BufferAttribute(ptReveal, 1));
  ptGeo.setAttribute('pSize', new THREE.BufferAttribute(ptSize, 1));
  const ptMat = new THREE.ShaderMaterial({
    uniforms, vertexShader: pointVert, fragmentShader: pointFrag,
    transparent:true, depthWrite:false, blending: THREE.AdditiveBlending
  });
  netGroup.add(new THREE.Points(ptGeo, ptMat));

  // ---- lines ----
  const linePositions = new Float32Array(edges.length * 2 * 3);
  const lineColors = new Float32Array(edges.length * 2 * 3);
  const lineReveal = new Float32Array(edges.length * 2);
  edges.forEach(([i, j], idx) => {
    const a = nodes[i], b = nodes[j];
    const base = idx * 6;
    linePositions[base] = a.x; linePositions[base+1] = a.y; linePositions[base+2] = a.z;
    linePositions[base+3] = b.x; linePositions[base+4] = b.y; linePositions[base+5] = b.z;
    lineColors[base] = a.color.r; lineColors[base+1] = a.color.g; lineColors[base+2] = a.color.b;
    lineColors[base+3] = b.color.r; lineColors[base+4] = b.color.g; lineColors[base+5] = b.color.b;
    const r = Math.max(a.reveal, b.reveal);
    lineReveal[idx*2] = r; lineReveal[idx*2+1] = r;
  });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeo.setAttribute('vColorAttr', new THREE.BufferAttribute(lineColors, 3));
  lineGeo.setAttribute('reveal', new THREE.BufferAttribute(lineReveal, 1));
  const lineMat = new THREE.ShaderMaterial({
    uniforms, vertexShader: lineVert, fragmentShader: lineFrag,
    transparent:true, depthWrite:false, blending: THREE.AdditiveBlending
  });
  netGroup.add(new THREE.LineSegments(lineGeo, lineMat));

  // ---- filled shard triangles ----
  if (triangles.length){
    const facePositions = new Float32Array(triangles.length * 3 * 3);
    const faceColors = new Float32Array(triangles.length * 3 * 3);
    const faceReveal = new Float32Array(triangles.length * 3);
    triangles.forEach(([i, j, k], idx) => {
      const pts = [nodes[i], nodes[j], nodes[k]];
      const r = Math.max(pts[0].reveal, pts[1].reveal, pts[2].reveal);
      pts.forEach((p, v) => {
        const base = idx * 9 + v * 3;
        facePositions[base] = p.x; facePositions[base+1] = p.y; facePositions[base+2] = p.z;
        faceColors[base] = p.color.r; faceColors[base+1] = p.color.g; faceColors[base+2] = p.color.b;
        faceReveal[idx*3 + v] = r;
      });
    });
    const faceGeo = new THREE.BufferGeometry();
    faceGeo.setAttribute('position', new THREE.BufferAttribute(facePositions, 3));
    faceGeo.setAttribute('vColorAttr', new THREE.BufferAttribute(faceColors, 3));
    faceGeo.setAttribute('reveal', new THREE.BufferAttribute(faceReveal, 1));
    const faceMat = new THREE.ShaderMaterial({
      uniforms, vertexShader: lineVert, fragmentShader: faceFrag,
      transparent:true, depthWrite:false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    });
    netGroup.add(new THREE.Mesh(faceGeo, faceMat));
  }

  // ---- interaction ----
  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;
  });

  function scrollProgress(){
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return 0;
    return THREE.MathUtils.clamp(window.scrollY / max, 0, 1);
  }

  function updateCamera(progress){
    // dolly the camera through the field as the page is scrolled
    camera.position.y = THREE.MathUtils.lerp(22, -22, progress);
    camera.position.x += ((mouseX * 3) - camera.position.x) * 0.04;
    camera.lookAt(0, camera.position.y - 10, -12);
  }

  function render(){
    updateCamera(scrollProgress());
    netGroup.rotation.y = mouseX * 0.08;
    renderer.render(scene, camera);
  }

  function animate(){
    if (!reduceMotion) requestAnimationFrame(animate);
    render();
  }

  if (reduceMotion){
    render();
    window.addEventListener('scroll', render, { passive:true });
  } else {
    animate();
  }

  window.addEventListener('resize', () => { sizeRenderer(); render(); });
})();

document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      document.body.classList.toggle('nav-open');
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !isExpanded);
    });

    // Close nav when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        document.body.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
});