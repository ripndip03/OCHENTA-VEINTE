// ARMARIO 3D DE CAMISETAS
// Para cada camiseta: nombre, color, tono (color de la tela y del puntito) y las fotos de delante y detrás
// (mejor PNG con fondo transparente, p. ej. "../img/ropa/negra-frente.png"). Sin foto se dibuja una de ejemplo.
const CAMISETAS = [
  { nombre: 'Estrella dorada', color: 'Negro · estampado oro', tono: '#1c1c1c', frente: '../img/ropa/estrella-frente.webp', espalda: '../img/ropa/estrella-espalda.webp' },
];
const LOGO = '../img/logo-ov.svg';

(function () {
  const canvas = document.querySelector('.armario-canvas');
  const box = canvas.parentElement;
  const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch (e) {
    document.querySelector('.armario-fallback').hidden = false;
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0c0b0a');
  scene.fog = new THREE.Fog('#0c0b0a', 7, 14);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  const mira = new THREE.Vector3(0, 1.5, 0);

  // ---------- Texturas hechas en canvas ----------
  const lienzo = (w, h, dibujar) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    dibujar(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  };
  const ruido = (g, w, h, fuerza, n) => {
    for (let i = 0; i < n; i++) {
      const v = Math.random() * fuerza;
      g.fillStyle = Math.random() < .5 ? `rgba(0,0,0,${v})` : `rgba(255,255,255,${v * .6})`;
      g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
  };

  // Entorno para los reflejos del metal: luz cálida arriba, oscuro abajo
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envEscena = new THREE.Scene();
  const envTex = lienzo(64, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#fff1d6'); gr.addColorStop(.35, '#8a7a66'); gr.addColorStop(.55, '#2a2622'); gr.addColorStop(1, '#050505');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  envEscena.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ map: envTex, side: THREE.BackSide })));
  scene.environment = pmrem.fromScene(envEscena, 0.02).texture;

  const hormigon = lienzo(512, 512, (g, w, h) => {
    g.fillStyle = '#5b5854'; g.fillRect(0, 0, w, h);
    ruido(g, w, h, .25, 26000);
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) { g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (Math.random() - .5) * 60; y += Math.random() * 40; g.lineTo(x, y); } g.stroke(); }
    for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(0,0,0,${.06 + Math.random() * .08})`; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 40 + Math.random() * 90, 20 + Math.random() * 50, 0, 0, 7); g.fill(); }
  });
  hormigon.wrapS = hormigon.wrapT = THREE.RepeatWrapping;

  const malla = lienzo(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#c9ccce'; g.lineWidth = 5; g.lineCap = 'round';
    // rombo de valla metálica (alambre trenzado)
    g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w / 2, 0); g.lineTo(w, h / 2); g.lineTo(w / 2, h); g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 0); g.stroke();
  });
  malla.wrapS = malla.wrapT = THREE.RepeatWrapping;

  const madera = lienzo(512, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7a5a38'); gr.addColorStop(1, '#5a4029');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(40,25,12,${.15 + Math.random() * .3})`; g.lineWidth = .5 + Math.random() * 1.5; g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); g.bezierCurveTo(w * .3, y + (Math.random() - .5) * 10, w * .6, y + (Math.random() - .5) * 10, w, y + (Math.random() - .5) * 6); g.stroke(); }
    ruido(g, w, h, .2, 6000);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3);
  });

  const peligro = lienzo(512, 64, (g, w, h) => {
    g.fillStyle = '#d9a400'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#141414';
    for (let x = -h; x < w + h; x += 64) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 32, h); g.lineTo(x + 32 + h, 0); g.lineTo(x + h, 0); g.fill(); }
    ruido(g, w, h, .35, 5000);
  });

  // ---------- Materiales ----------
  const acero = new THREE.MeshStandardMaterial({ color: '#b4b8bc', metalness: .92, roughness: .32 });
  const aceroOscuro = new THREE.MeshStandardMaterial({ color: '#6d7276', metalness: .85, roughness: .45 });
  const percha = new THREE.MeshStandardMaterial({ color: '#d5d8db', metalness: 1, roughness: .2 });

  // ---------- Suelo y pared ----------
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ map: hormigon, roughness: .92, color: '#9a958e' }));
  hormigon.repeat.set(6, 6);
  suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true; scene.add(suelo);
  const paredTex = hormigon.clone(); paredTex.needsUpdate = true; paredTex.repeat.set(4, 1.6);
  const pared = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), new THREE.MeshStandardMaterial({ map: paredTex, roughness: 1, color: '#4a4744' }));
  pared.position.set(0, 4, -2.2); pared.receiveShadow = true; scene.add(pared);

  // ---------- Andamio ----------
  const andamio = new THREE.Group(); scene.add(andamio);
  const tubo = (a, b, r = .03, mat = acero) => {
    const d = new THREE.Vector3().subVectors(b, a);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 20), mat);
    m.position.copy(a).addScaledVector(d, .5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    m.castShadow = true; m.receiveShadow = true; andamio.add(m); return m;
  };
  const grapa = (p) => {
    const g = new THREE.Mesh(new THREE.BoxGeometry(.1, .09, .09), aceroOscuro);
    g.position.copy(p); g.castShadow = true; andamio.add(g);
    const tornillo = new THREE.Mesh(new THREE.CylinderGeometry(.014, .014, .13, 8), aceroOscuro);
    tornillo.rotation.x = Math.PI / 2; tornillo.position.copy(p); andamio.add(tornillo);
  };
  const X = 2.35, ZF = .05, ZB = -.85, ALTO = 3.2, BARRA = 2.45;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  [[-X, ZF], [X, ZF], [-X, ZB], [X, ZB]].forEach(([x, z]) => {
    tubo(V(x, 0, z), V(x, ALTO, z), .032);
    const placa = new THREE.Mesh(new THREE.BoxGeometry(.18, .015, .18), aceroOscuro);
    placa.position.set(x, .008, z); placa.receiveShadow = true; andamio.add(placa);
  });
  [BARRA, ALTO - .05, .45].forEach(y => {
    tubo(V(-X - .2, y, ZF), V(X + .2, y, ZF), y === BARRA ? .03 : .028); grapa(V(-X, y, ZF)); grapa(V(X, y, ZF));
    tubo(V(-X - .2, y, ZB), V(X + .2, y, ZB), .028); grapa(V(-X, y, ZB)); grapa(V(X, y, ZB));
    tubo(V(-X, y + .07, ZB - .15), V(-X, y + .07, ZF + .15), .026); tubo(V(X, y + .07, ZB - .15), V(X, y + .07, ZF + .15), .026);
  });
  tubo(V(-X, .45, ZB), V(X, ALTO - .05, ZB), .026); // diagonal de atrás

  // Tablones del andamio: el del medio partido y combado, al de atrás le falta un trozo que está en el suelo
  const maderaMat = new THREE.MeshStandardMaterial({ map: madera, roughness: .85 });
  madera.wrapS = madera.wrapT = THREE.RepeatWrapping; madera.repeat.set(.42, 3.4);
  const ANCHO_TAB = .28, GRUESO = .04;
  // tablón de x0 a x1 (vista desde arriba); los extremos rotos llevan dientes de astilla
  const tablon = (x0, x1, roto0, roto1) => {
    const f = new THREE.Shape(), w = ANCHO_TAB / 2;
    const dientes = (x, z0, z1, hacia) => { const n = 6; for (let k = 1; k < n; k++) { const z = z0 + (z1 - z0) * k / n; f.lineTo(x + hacia * (Math.random() * .09 + (k % 2) * .05), z); } };
    f.moveTo(x0, -w); f.lineTo(x1, -w);
    if (roto1) dientes(x1, -w, w, 1);
    f.lineTo(x1, w); f.lineTo(x0, w);
    if (roto0) dientes(x0, w, -w, -1);
    f.closePath();
    const geo = new THREE.ExtrudeGeometry(f, { depth: GRUESO, bevelEnabled: false });
    geo.rotateX(Math.PI / 2); geo.translate(0, GRUESO / 2, 0);
    const m = new THREE.Mesh(geo, maderaMat); m.castShadow = m.receiveShadow = true; return m;
  };
  const astilla = (pos, rotZ, rotY) => {
    const a = new THREE.Mesh(new THREE.BoxGeometry(.16 + Math.random() * .1, .012, .018), maderaMat);
    a.position.copy(pos); a.rotation.set(0, rotY, rotZ); a.castShadow = true; return a;
  };
  const Y_TAB = .5, L = X + .15;
  // delante: roto en el centro, el trozo cuelga hacia abajo
  const zDelante = ZF - .15;
  const t0a = tablon(-L, -.62, false, true); t0a.position.set(0, Y_TAB, zDelante); andamio.add(t0a);
  const t0b = tablon(.34, L, true, false); t0b.position.set(0, Y_TAB, zDelante); andamio.add(t0b);
  const colgado = new THREE.Group(); colgado.position.set(-.62, Y_TAB, zDelante); andamio.add(colgado);
  const t0c = tablon(0, .78, true, true); colgado.add(t0c); colgado.rotation.set(.08, .06, -.62);
  [V(-.66, Y_TAB + .01, zDelante - .06), V(-.6, Y_TAB + .01, zDelante + .07), V(.38, Y_TAB + .01, zDelante)].forEach((p, k) => andamio.add(astilla(p, (k - 1) * .4, k * .5)));
  // medio: partido por la mitad, cada trozo cae hacia el hueco desde su apoyo
  const zMedio = ZF - .44;
  [[-L, -.15, -1], [.12, L, 1]].forEach(([x0, x1, lado]) => {
    const apoyo = new THREE.Group(); apoyo.position.set(lado < 0 ? -L : L, Y_TAB, zMedio); andamio.add(apoyo);
    const t = tablon(x0 - apoyo.position.x, x1 - apoyo.position.x, lado > 0, lado < 0);
    apoyo.add(t); apoyo.rotation.z = lado < 0 ? -.13 : .11; apoyo.rotation.x = lado * .03;
    const punta = new THREE.Vector3(lado < 0 ? x1 - apoyo.position.x : x0 - apoyo.position.x, 0, 0);
    for (let k = 0; k < 3; k++) apoyo.add(astilla(punta.clone().add(V(lado * -.04, .01, (k - 1) * .08)), (Math.random() - .5) * .5, lado * (Math.random() * .3)));
  });
  // atrás: le falta un trozo
  const zAtras = ZF - .73;
  const t2a = tablon(-L, .55, false, true); t2a.position.set(0, Y_TAB, zAtras); andamio.add(t2a);
  const t2b = tablon(1.35, L, true, false); t2b.position.set(0, Y_TAB, zAtras); andamio.add(t2b);
  const caido = tablon(-.38, .38, true, true); caido.position.set(.95, .02, zAtras + .55); caido.rotation.set(.04, .5, .12); scene.add(caido);
  [V(.62, .03, zAtras + .2), V(1.2, .02, zAtras + .75), V(.4, .015, zAtras + .9)].forEach((p, k) => scene.add(astilla(p, 0, k * 1.1 + .3)));

  // Rodapié de peligro, partido donde cae el tablón
  const rodapieMat = new THREE.MeshStandardMaterial({ map: peligro, roughness: .7 });
  [[-L, -.5], [.3, L]].forEach(([x0, x1]) => {
    const r = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, .11, .02), rodapieMat);
    r.position.set((x0 + x1) / 2, .575, ZF + .02); r.castShadow = true; andamio.add(r);
  });
  const rodapieCaido = new THREE.Mesh(new THREE.BoxGeometry(.75, .11, .02), rodapieMat);
  rodapieCaido.position.set(-.05, .2, ZF + .16); rodapieCaido.rotation.set(-.35, .1, .5); rodapieCaido.castShadow = true; scene.add(rodapieCaido);

  // Vallas de obra detrás (dos paneles con malla y pies de hormigón)
  const mallaMat = new THREE.MeshStandardMaterial({ map: malla, alphaTest: .5, metalness: .8, roughness: .4, side: THREE.DoubleSide });
  const mallaSombra = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: malla, alphaTest: .5 });
  [0].forEach(cx => {
    const w = 4.5, h = 1.95, y0 = .62, z = -.55;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mallaMat);
    malla.repeat.set(w * 9, h * 9);
    m.position.set(cx, y0 + h / 2, z); m.castShadow = true; m.receiveShadow = true; m.customDepthMaterial = mallaSombra; andamio.add(m);
    tubo(V(cx - w / 2, y0, z), V(cx - w / 2, y0 + h, z), .02, aceroOscuro); tubo(V(cx + w / 2, y0, z), V(cx + w / 2, y0 + h, z), .02, aceroOscuro);
    tubo(V(cx - w / 2, y0, z), V(cx + w / 2, y0, z), .02, aceroOscuro); tubo(V(cx - w / 2, y0 + h, z), V(cx + w / 2, y0 + h, z), .02, aceroOscuro);
  });

  // Lámpara de obra colgada del andamio
  const bombilla = new THREE.Mesh(new THREE.SphereGeometry(.05, 16, 12), new THREE.MeshStandardMaterial({ emissive: '#ffb347', emissiveIntensity: 3, color: '#000' }));
  bombilla.position.set(-X + .25, ALTO - .35, ZF + .1); scene.add(bombilla);
  const cable = tubo(V(-X + .25, ALTO - .05, ZF + .1), V(-X + .25, ALTO - .3, ZF + .1), .006, new THREE.MeshStandardMaterial({ color: '#111' }));
  cable.castShadow = false;

  // ---------- Luces ----------
  scene.add(new THREE.HemisphereLight('#ffe2bd', '#1a1612', .45));
  const foco = new THREE.SpotLight('#ffd9ad', 2.2, 14, Math.PI / 6, .55, 1.2);
  foco.position.set(.6, 5.2, 3.6); foco.target.position.set(0, 1.4, 0);
  foco.castShadow = true; foco.shadow.mapSize.set(2048, 2048); foco.shadow.bias = -.0004; foco.shadow.radius = 4;
  scene.add(foco, foco.target);
  const luzBombilla = new THREE.PointLight('#ff9d3c', 1.1, 4.5, 2);
  luzBombilla.position.copy(bombilla.position); scene.add(luzBombilla);
  const contra = new THREE.DirectionalLight('#9fb4ff', .25); contra.position.set(-3, 3, -4); scene.add(contra);

  // ---------- Camisetas ----------
  const ANCHO = 1, ALTO_T = 1.206; // tamaño de la camiseta (proporción de las fotos)
  const CUELLO = -.105; // altura del borde del cuello respecto al gancho: la percha sale por dentro del cuello
  const forma = (g, s) => {
    g.beginPath();
    g.moveTo(70 * s, 14 * s); g.quadraticCurveTo(100 * s, 36 * s, 130 * s, 14 * s);
    g.lineTo(188 * s, 40 * s); g.lineTo(170 * s, 92 * s); g.lineTo(150 * s, 84 * s); g.lineTo(150 * s, 214 * s);
    g.lineTo(50 * s, 214 * s); g.lineTo(50 * s, 84 * s); g.lineTo(30 * s, 92 * s); g.lineTo(12 * s, 40 * s); g.closePath();
  };
  const logoImg = new Image(); logoImg.src = LOGO;
  const texturaCamiseta = (tono, espalda) => lienzo(600, 660, (g, w, h) => {
    const s = 3;
    g.save(); forma(g, s); g.clip();
    g.fillStyle = tono; g.fillRect(0, 0, w, h);
    // pliegues y volumen de la tela
    const lat = g.createLinearGradient(0, 0, w, 0);
    lat.addColorStop(0, 'rgba(0,0,0,.45)'); lat.addColorStop(.28, 'rgba(0,0,0,.05)'); lat.addColorStop(.5, 'rgba(255,255,255,.06)'); lat.addColorStop(.72, 'rgba(0,0,0,.05)'); lat.addColorStop(1, 'rgba(0,0,0,.5)');
    g.fillStyle = lat; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 7; i++) {
      const x = 170 + Math.random() * 260, gr = g.createLinearGradient(x - 18, 0, x + 18, 0);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.5, `rgba(0,0,0,${.12 + Math.random() * .14})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - 18, 260 + Math.random() * 120, 36, 400);
    }
    const arriba = g.createLinearGradient(0, 0, 0, h); arriba.addColorStop(0, 'rgba(255,255,255,.08)'); arriba.addColorStop(.4, 'rgba(0,0,0,0)'); arriba.addColorStop(1, 'rgba(0,0,0,.3)');
    g.fillStyle = arriba; g.fillRect(0, 0, w, h);
    ruido(g, w, h, .12, 30000);
    // cuello y costuras
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 10;
    g.beginPath(); g.moveTo(70 * s, 14 * s); g.quadraticCurveTo(100 * s, (espalda ? 22 : 36) * s, 130 * s, 14 * s); g.stroke();
    g.lineWidth = 2; g.setLineDash([5, 4]);
    g.beginPath(); g.moveTo(50 * s, 206 * s); g.lineTo(150 * s, 206 * s); g.stroke();
    g.beginPath(); g.moveTo(30 * s, 84 * s); g.lineTo(52 * s, 76 * s); g.moveTo(170 * s, 84 * s); g.lineTo(148 * s, 76 * s); g.stroke();
    g.setLineDash([]);
    if (!espalda && logoImg.complete && logoImg.naturalWidth) { g.globalAlpha = .92; g.drawImage(logoImg, 112 * s, 54 * s, 24 * s, 28 * s); g.globalAlpha = 1; }
    g.restore();
  });
  const texturaFoto = (src) => { const t = new THREE.TextureLoader().load(src); t.encoding = THREE.sRGBEncoding; return t; };

  const geoCamiseta = (lado) => {
    const geo = new THREE.PlaneGeometry(ANCHO, ALTO_T, 40, 44);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), u = x / (ANCHO / 2);
      const cuerpo = Math.max(0, 1 - u * u * 1.4);
      p.setZ(i, lado * (.014 + .045 * cuerpo + .003 * Math.sin(y * 22 + x * 6) * cuerpo));
    }
    geo.computeVertexNormals();
    return geo;
  };
  const geoDelante = geoCamiseta(1), geoDetras = geoCamiseta(1);

  const curvaPercha = () => {
    const camino = new THREE.CurvePath();
    camino.add(new THREE.CatmullRomCurve3([V(.045, -.035, 0), V(.055, .015, 0), V(.03, .052, 0), V(-.01, .058, 0), V(-.045, .03, 0), V(-.05, -.01, 0), V(-.02, -.06, 0), V(0, -.1, 0), V(0, -.14, 0)]));
    camino.add(new THREE.LineCurve3(V(0, -.14, 0), V(-.36, -.31, 0)));
    camino.add(new THREE.LineCurve3(V(-.36, -.31, 0), V(.36, -.31, 0)));
    camino.add(new THREE.LineCurve3(V(.36, -.31, 0), V(0, -.14, 0)));
    return camino;
  };
  const geoPercha = new THREE.TubeGeometry(curvaPercha(), 160, .007, 8, false);

  const prendas = CAMISETAS.map((c, i) => {
    const grupo = new THREE.Group();
    const giro = new THREE.Group(); grupo.add(giro);
    const percha3d = new THREE.Mesh(geoPercha, percha); percha3d.castShadow = true; giro.add(percha3d);
    const hacerCara = (foto, espalda, geo) => {
      const map = foto ? texturaFoto(foto) : texturaCamiseta(c.tono, espalda);
      const mat = new THREE.MeshStandardMaterial({ map, alphaTest: .5, roughness: .95, side: THREE.FrontSide });
      const m = new THREE.Mesh(geo, mat);
      m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: .5 });
      m.castShadow = true; m.receiveShadow = true;
      m.position.y = CUELLO - ALTO_T / 2;
      m.userData.indice = i;
      return m;
    };
    const delante = hacerCara(c.frente, false, geoDelante);
    const detras = hacerCara(c.espalda, true, geoDetras); detras.rotation.y = Math.PI;
    giro.add(delante, detras);
    grupo.position.set(0, BARRA, ZF);
    scene.add(grupo);
    return { grupo, giro, caras: [delante, detras], x: 0, rot: 0, escala: 1.35, balanceo: 0, fase: Math.random() * 6 };
  });
  // Redibuja las camisetas de ejemplo cuando el logo ya está cargado
  logoImg.onload = () => prendas.forEach((p, i) => {
    if (!CAMISETAS[i].frente) { p.caras[0].material.map = texturaCamiseta(CAMISETAS[i].tono, false); p.caras[0].material.needsUpdate = true; }
  });

  // ---------- Estado e interfaz ----------
  let actual = Math.floor(CAMISETAS.length / 2), deEspalda = false;
  const $ = (q) => document.querySelector(q);
  function pintarInfo() {
    const c = CAMISETAS[actual];
    $('.info-num').textContent = `${String(actual + 1).padStart(2, '0')} / ${String(CAMISETAS.length).padStart(2, '0')}`;
    $('.info-name').textContent = c.nombre;
    $('.info-color-name').textContent = c.color;
    $('.info-dot').style.background = c.tono;
    $('.flip').textContent = deEspalda ? 'Ver delante' : 'Ver espalda';
  }
  const elegir = (i) => { if (i === actual) deEspalda = !deEspalda; else { actual = (i + CAMISETAS.length) % CAMISETAS.length; deEspalda = false; prendas[actual].balanceo = .12; } pintarInfo(); };
  $('.prev').addEventListener('click', () => elegir(actual - 1));
  $('.next').addEventListener('click', () => elegir(actual + 1));
  $('.flip').addEventListener('click', () => { deEspalda = !deEspalda; pintarInfo(); });
  if (CAMISETAS.length < 2) { $('.prev').hidden = true; $('.next').hidden = true; }
  pintarInfo();

  // Ratón / dedo: tocar elige o gira, deslizar cambia de camiseta
  const ray = new THREE.Raycaster(), puntero = new THREE.Vector2(), raton = { x: 0, y: 0 };
  let inicio = null;
  const aPuntero = (e) => { const r = canvas.getBoundingClientRect(); puntero.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); return r; };
  canvas.addEventListener('pointerdown', (e) => { inicio = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!inicio) return;
    const dx = e.clientX - inicio.x; inicio = null;
    if (Math.abs(dx) > 40) { elegir(actual + (dx < 0 ? 1 : -1)); return; }
    aPuntero(e); ray.setFromCamera(puntero, camera);
    const hit = ray.intersectObjects(prendas.flatMap(p => p.caras))[0];
    if (hit) elegir(hit.object.userData.indice);
  });
  canvas.addEventListener('pointermove', (e) => {
    const r = aPuntero(e);
    raton.x = puntero.x; raton.y = puntero.y;
    ray.setFromCamera(puntero, camera);
    const hit = ray.intersectObjects(prendas.flatMap(p => p.caras))[0];
    canvas.style.cursor = hit ? 'pointer' : 'grab';
    if (hit) { const p = prendas[hit.object.userData.indice]; p.balanceo = Math.max(p.balanceo, .05); }
  });
  canvas.addEventListener('pointerleave', () => { raton.x = raton.y = 0; });

  // ---------- Tamaño y animación ----------
  function ajustar() {
    const w = box.clientWidth, h = box.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const dist = Math.max(4.1, 3.1 / (2 * Math.tan(THREE.MathUtils.degToRad(17.5)) * camera.aspect));
    camera.userData.dist = dist;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', ajustar); ajustar();

  const reloj = new THREE.Clock();
  function animar() {
    const t = reloj.getElapsedTime(), dt = Math.min(reloj.getDelta(), .05);
    const k = sinMovimiento ? 1 : .12;
    prendas.forEach((p, i) => {
      const d = i - actual;
      const objetivoX = d === 0 ? 0 : Math.sign(d) * (.86 + (Math.abs(d) - 1) * .25);
      const objetivoRot = d === 0 ? (deEspalda ? Math.PI : 0) : Math.sign(d) * -1.25;
      const objetivoEscala = d === 0 ? 1.35 : 1.1;
      p.x += (objetivoX - p.x) * k; p.rot += (objetivoRot - p.rot) * k; p.escala += (objetivoEscala - p.escala) * k;
      p.grupo.position.x = p.x;
      p.grupo.position.z = ZF + (d === 0 ? .02 : -Math.abs(d) * .004);
      p.giro.rotation.y = p.rot;
      p.grupo.scale.setScalar(p.escala);
      if (!sinMovimiento) { p.balanceo *= .985; p.grupo.rotation.z = Math.sin(t * 2.6 + p.fase) * p.balanceo; }
    });
    const dist = camera.userData.dist;
    const px = sinMovimiento ? 0 : raton.x * .35, py = sinMovimiento ? 0 : raton.y * .18;
    camera.position.x += (px - camera.position.x) * .05;
    camera.position.y += (2.05 + py - camera.position.y) * .05;
    camera.position.z = dist;
    camera.lookAt(mira);
    luzBombilla.intensity = 1.05 + Math.sin(t * 13) * .03 + (Math.random() < .01 ? -.3 : 0);
    renderer.render(scene, camera);
    requestAnimationFrame(animar);
  }
  camera.position.set(0, 1.75, 5);
  animar();
})();
