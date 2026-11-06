// VALLA DE LÁMINAS: una valla de madera negra en círculo que gira sin fin, con las láminas colgadas de clavos
// Para añadir una lámina, copia una línea y cambia nombre, descripción e imagen.
const LAMINAS = [
  // tam: ancho y alto de la imagen en píxeles (si falta, 1400 × 1925); las apaisadas cuelgan más anchas
  // pinzas: dónde muerde cada pinza, en proporción al ancho de la lámina (0 es el centro), igual que en la foto
  { nombre: 'Lámina 01', detalle: 'Impresión en funda, con su percha de pinzas', imagen: '../img/obras/lamina-1.webp', percha: '../img/obras/percha-1.webp', pinzas: [-.426, .446] },
  { nombre: 'Lámina 02', detalle: 'Impresión en funda, con su percha de pinzas', imagen: '../img/obras/lamina-2.webp', percha: '../img/obras/percha-2.webp', pinzas: [-.434, .464] },
  { nombre: 'Lámina 03', detalle: 'Obra original, con su percha de pinzas', imagen: '../img/obras/lamina-3.webp', percha: '../img/obras/percha-1.webp', pinzas: [-.43, .45], tam: [1100, 1552] },
  { nombre: 'Lámina 04', detalle: 'Obra original, con su percha de pinzas', imagen: '../img/obras/lamina-4.webp', percha: '../img/obras/percha-2.webp', pinzas: [-.43, .45], tam: [1100, 1560] },
  { nombre: 'Lámina 05', detalle: 'Obra original, con su percha de pinzas', imagen: '../img/obras/lamina-5.webp', percha: '../img/obras/percha-1.webp', pinzas: [-.43, .45], tam: [1100, 1557] },
  { nombre: 'Lámina 06', detalle: 'Obra original, con su percha de pinzas', imagen: '../img/obras/lamina-6.webp', percha: '../img/obras/percha-2.webp', pinzas: [-.43, .45], tam: [1500, 1062] },
  { nombre: 'Lámina 07', detalle: 'Obra original, con su percha de pinzas', imagen: '../img/obras/lamina-7.webp', percha: '../img/obras/percha-1.webp', pinzas: [-.43, .45], tam: [1100, 1546] },
  { nombre: 'Lámina 08', detalle: 'Obra original, con su percha de pinzas', imagen: '../img/obras/lamina-8.webp', percha: '../img/obras/percha-2.webp', pinzas: [-.43, .45], tam: [1500, 1047] },
  { nombre: 'Lámina 09', detalle: 'Obra original, con su percha de pinzas', imagen: '../img/obras/lamina-9.webp', percha: '../img/obras/percha-1.webp', pinzas: [-.43, .45], tam: [1100, 1583] },
  { nombre: 'Lámina 10', detalle: 'Obra original, con su percha de pinzas', imagen: '../img/obras/lamina-10.webp', percha: '../img/obras/percha-2.webp', pinzas: [-.43, .45], tam: [1100, 1564] },
  { nombre: 'Lámina 11', detalle: 'Obra original, con su percha de pinzas', imagen: '../img/obras/lamina-11.webp', percha: '../img/obras/percha-1.webp', pinzas: [-.43, .45], tam: [1100, 1468] },
  { nombre: 'Lámina 12', detalle: 'Obra original, con su percha de pinzas', imagen: '../img/obras/lamina-12.webp', percha: '../img/obras/percha-2.webp', pinzas: [-.43, .45], tam: [1100, 1468] },
  { nombre: 'Lámina 13', detalle: 'Obra original, con su percha de pinzas', imagen: '../img/obras/lamina-13.webp', percha: '../img/obras/percha-1.webp', pinzas: [-.43, .45], tam: [1100, 1467] },
  { nombre: 'Lámina 14', detalle: 'Obra original, con su percha de pinzas', imagen: '../img/obras/lamina-14.webp', percha: '../img/obras/percha-2.webp', pinzas: [-.43, .45], tam: [1100, 1466] },
  { nombre: 'Lámina 15', detalle: 'Obra original, con su percha de pinzas', imagen: '../img/obras/lamina-15.webp', percha: '../img/obras/percha-1.webp', pinzas: [-.43, .45], tam: [1100, 1468] },
  { nombre: 'Lámina 16', detalle: 'Obra original, con su percha de pinzas', imagen: '../img/obras/lamina-16.webp', percha: '../img/obras/percha-2.webp', pinzas: [-.43, .45], tam: [1100, 1466] },
];

(function () {
  const canvas = document.querySelector('.armario-canvas');
  const box = canvas.parentElement;
  const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); }
  catch (e) { document.querySelector('.armario-fallback').hidden = false; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const FONDO = '#0c0b0a';
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FONDO);
  scene.fog = new THREE.Fog(FONDO, 3.2, 7.5);
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 40);

  const lienzo = (w, h, dibujar, srgb = true) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    dibujar(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.encoding = THREE.sRGBEncoding;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  };

  // ---------- Madera pintada de negro: vetas verticales que asoman bajo la pintura ----------
  const vetas = (g, w, h, base, claro) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const x = Math.random() * w, a = Math.random() * .09;
      g.strokeStyle = `rgba(${claro},${a})`; g.lineWidth = .5 + Math.random() * 2.2;
      g.beginPath(); g.moveTo(x, 0);
      for (let y = 0; y <= h; y += 32) g.lineTo(x + Math.sin(y * .01 + i) * 3 + (Math.random() - .5) * 1.5, y);
      g.stroke();
    }
    // nudos de la madera
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 4 + Math.random() * 7;
      const gr = g.createRadialGradient(x, y, 0, x, y, r * 2.4);
      gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(.4, `rgba(${claro},.06)`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * 1.2, r * 2.4, 0, 0, 7); g.fill();
    }
    // desconchones de la pintura
    for (let i = 0; i < 900; i++) {
      g.fillStyle = Math.random() < .5 ? 'rgba(0,0,0,.25)' : `rgba(${claro},.05)`;
      g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 3);
    }
  };
  const maderaTex = lienzo(256, 1024, (g, w, h) => vetas(g, w, h, '#1b1a19', '210,200,185'));
  const maderaRug = lienzo(256, 1024, (g, w, h) => vetas(g, w, h, '#b8b8b8', '255,255,255'), false);
  [maderaTex, maderaRug].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(9, 1.4); });
  const madera = new THREE.MeshStandardMaterial({ map: maderaTex, roughnessMap: maderaRug, roughness: .85, metalness: 0, color: '#9a958e' });

  // ---------- La valla: un círculo de listones con la punta redonda ----------
  const R = 2.2;              // radio del círculo de la valla
  const ANCHO = .09, ALTO = 1.42, GRUESO = .024, PASO = .155;
  const N = Math.round(2 * Math.PI * R / PASO);
  const forma = new THREE.Shape();
  forma.moveTo(-ANCHO / 2, 0); forma.lineTo(ANCHO / 2, 0); forma.lineTo(ANCHO / 2, ALTO - ANCHO / 2);
  forma.absarc(0, ALTO - ANCHO / 2, ANCHO / 2, 0, Math.PI, false); forma.lineTo(-ANCHO / 2, 0);
  const geoListon = new THREE.ExtrudeGeometry(forma, { depth: GRUESO, bevelEnabled: true, bevelThickness: .004, bevelSize: .004, bevelSegments: 2, curveSegments: 10 });
  geoListon.translate(0, 0, -GRUESO / 2);

  const valla = new THREE.Group();
  scene.add(valla);
  const listones = new THREE.InstancedMesh(geoListon, madera, N);
  listones.castShadow = listones.receiveShadow = true;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2;
    // cada listón un pelín distinto: algo más alto o bajo y ligeramente torcido, como una valla de verdad
    e3.set((Math.random() - .5) * .012, a, (Math.random() - .5) * .018);
    q.setFromEuler(e3);
    s.set(1, 1 + (Math.random() - .5) * .025, 1);
    m.compose(new THREE.Vector3(Math.sin(a) * R, .02, Math.cos(a) * R), q, s);
    listones.setMatrixAt(i, m);
  }
  valla.add(listones);

  // Travesaños por dentro (los listones van clavados a ellos)
  const travesano = (y) => {
    const g = new THREE.CylinderGeometry(R - GRUESO / 2 - .022, R - GRUESO / 2 - .022, .085, 160, 1, true);
    const t = new THREE.Mesh(g, madera); t.position.y = y; t.material.side = THREE.DoubleSide;
    t.castShadow = t.receiveShadow = true; valla.add(t);
    const g2 = new THREE.CylinderGeometry(R - GRUESO / 2 - .045, R - GRUESO / 2 - .045, .085, 160, 1, true);
    const t2 = new THREE.Mesh(g2, madera); t2.position.y = y; valla.add(t2);
  };
  travesano(.28); travesano(1.08);
  // Postes cada cierto trecho
  const geoPoste = new THREE.BoxGeometry(.075, ALTO - .12, .075);
  for (let i = 0; i < 8; i++) {
    const a = (i + .5) / 8 * Math.PI * 2;
    const p = new THREE.Mesh(geoPoste, madera);
    p.position.set(Math.sin(a) * (R - .08), (ALTO - .12) / 2, Math.cos(a) * (R - .08)); p.rotation.y = a;
    p.castShadow = true; valla.add(p);
  }

  // ---------- Suelo de tierra y cemento ----------
  const sueloTex = lienzo(1024, 1024, (g, w, h) => {
    g.fillStyle = '#1d1a17'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const v = Math.random() * .16;
      g.fillStyle = Math.random() < .5 ? `rgba(0,0,0,${v})` : `rgba(200,185,160,${v * .35})`;
      g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3);
    }
  });
  sueloTex.wrapS = sueloTex.wrapT = THREE.RepeatWrapping; sueloTex.repeat.set(5, 5);
  const suelo = new THREE.Mesh(new THREE.CircleGeometry(14, 64), new THREE.MeshStandardMaterial({ map: sueloTex, roughness: .95 }));
  suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true; scene.add(suelo);

  // ---------- Luces ----------
  scene.add(new THREE.HemisphereLight('#d9cbb0', '#0a0908', .35));
  const foco = new THREE.SpotLight('#ffe6c2', 1.7, 16, .62, .55, 1.2);
  foco.position.set(.9, 3.2, R + 2.4); foco.target.position.set(0, .95, R);
  foco.castShadow = true; foco.shadow.mapSize.set(2048, 2048); foco.shadow.bias = -.0005; foco.shadow.radius = 5;
  scene.add(foco, foco.target);
  const relleno = new THREE.DirectionalLight('#8fa0c0', .25); relleno.position.set(-4, 2, 3); scene.add(relleno);

  // ---------- Láminas colgadas con su percha de pinzas de un tornillo de la valla ----------
  // Medidas sacadas de las fotos: todo es proporcional al ancho de la lámina (PW)
  const PW = .32, PH = PW * 1925 / 1400;
  const BW = PW * .783, BH = PW * .085, BD = .02;          // listón de madera de la percha
  const ALAMBRE = PW * 1.12;                               // ancho del alambre cromado
  const cargador = new THREE.TextureLoader();
  const textura = (url, alCargar) => cargador.load(url, (t) => {
    t.encoding = THREE.sRGBEncoding; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); alCargar && alCargar(t);
  });
  const cromo = new THREE.MeshStandardMaterial({ color: '#e4e6ea', metalness: 1, roughness: .18 });
  const plasticoNegro = new THREE.MeshStandardMaterial({ color: '#070708', metalness: 0, roughness: .62, envMapIntensity: .2 });
  const tornilloMat = new THREE.MeshStandardMaterial({ color: '#9a978f', metalness: .9, roughness: .4 });

  // reflejos para el cromo y el barniz: un entorno sencillo cálido arriba y oscuro abajo
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = lienzo(64, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#fff3dc'); gr.addColorStop(.4, '#8a7d6c'); gr.addColorStop(.6, '#25221f'); gr.addColorStop(1, '#050505');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = pmrem.fromEquirectangular(envTex).texture;

  // Gancho: tubo que sube del centro del listón y se curva hacia la izquierda, como en las fotos
  const ganchoCurva = new THREE.CatmullRomCurve3([
    [0, 0], [0, .03], [0, .05], [-.003, .064], [-.013, .074], [-.026, .074], [-.036, .066], [-.04, .055], [-.038, .046], [-.033, .042],
  ].map(([x, y]) => new THREE.Vector3(x, y, 0)));
  const geoGancho = new THREE.TubeGeometry(ganchoCurva, 60, .0022, 10, false);
  const CONTACTO = new THREE.Vector3(-.009, .0715, 0);     // punto del gancho que apoya en el tornillo

  // Alambre en rectángulo con las puntas redondeadas que atraviesa el listón
  const alambreForma = (() => {
    const g = new THREE.Group(), r = .0016, alto = BH * .42, lado = ALAMBRE / 2 - alto / 2;
    [alto / 2, -alto / 2].forEach(y => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, lado * 2, 8), cromo);
      c.rotation.z = Math.PI / 2; c.position.y = y; g.add(c);
    });
    [-1, 1].forEach(sg => {
      const t = new THREE.Mesh(new THREE.TorusGeometry(alto / 2, r, 8, 16, Math.PI), cromo);
      t.position.x = sg * lado; t.rotation.z = sg > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(t);
    });
    g.position.y = -BH * .12;
    return g;
  });

  // Pinza negra de las de las fotos: cuerpo de plástico, dos patillas cromadas y la mordaza abajo
  const geoPinzaCuerpo = new THREE.BoxGeometry(.031, .042, .011);
  const geoPinzaMordaza = new THREE.BoxGeometry(.033, .02, .014);
  const pinza = (x, yAlambre) => {
    const g = new THREE.Group(); g.position.set(x, yAlambre, .0);
    const anilla = new THREE.Mesh(new THREE.TorusGeometry(.005, .0014, 6, 12), cromo); anilla.rotation.y = Math.PI / 2; g.add(anilla);
    const cuerpo = new THREE.Mesh(geoPinzaCuerpo, plasticoNegro); cuerpo.position.y = -.026; cuerpo.castShadow = true; g.add(cuerpo);
    const mordaza = new THREE.Mesh(geoPinzaMordaza, plasticoNegro); mordaza.position.y = -.054; mordaza.castShadow = true; g.add(mordaza);
    [-.007, .007].forEach(px => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(.0013, .0013, .032, 6), cromo);
      p.position.set(px, -.018, .0065); g.add(p);
      const b = new THREE.Mesh(new THREE.SphereGeometry(.0024, 10, 8), cromo); b.position.set(px, -.003, .0068); g.add(b);
    });
    return g;
  };

  const SLOTS = (() => { let n = Math.floor(2 * Math.PI * R / .58); return n - (n % LAMINAS.length || 0); })();
  const ALTURA_TORNILLO = 1.25;
  const laminas = [];
  for (let k = 0; k < SLOTS; k++) {
    const l = LAMINAS[k % LAMINAS.length];
    // el tornillo va en el listón más cercano
    const a = Math.round(k / SLOTS * N) / N * Math.PI * 2;
    const soporte = new THREE.Group();
    soporte.rotation.y = a;
    soporte.position.set(Math.sin(a) * (R + GRUESO / 2), ALTURA_TORNILLO, Math.cos(a) * (R + GRUESO / 2));
    valla.add(soporte);
    const tornillo = new THREE.Mesh(new THREE.CylinderGeometry(.0026, .0026, .03, 8), tornilloMat);
    tornillo.rotation.x = Math.PI / 2; tornillo.position.z = .014; soporte.add(tornillo);
    const cabeza = new THREE.Mesh(new THREE.CylinderGeometry(.0055, .0045, .003, 14), tornilloMat);
    cabeza.rotation.x = Math.PI / 2; cabeza.position.z = .029; soporte.add(cabeza);

    // todo lo que cuelga gira alrededor del tornillo
    const pendulo = new THREE.Group(); pendulo.position.z = .019; soporte.add(pendulo);
    const percha = new THREE.Group(); percha.position.copy(CONTACTO).multiplyScalar(-1); percha.position.y -= BH / 2 + .004;
    pendulo.add(percha);
    // el gancho sale de la parte de arriba del listón
    const gancho = new THREE.Mesh(geoGancho, cromo); gancho.position.y = BH / 2; gancho.castShadow = true; percha.add(gancho);
    const arandela = new THREE.Mesh(new THREE.CylinderGeometry(.0045, .0045, .003, 12), cromo); arandela.position.y = BH / 2 + .0015; percha.add(arandela);
    // listón de madera con la foto de su madera
    const maderaPercha = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: .42, clearcoat: .6, clearcoatRoughness: .25 });
    const cantos = new THREE.MeshPhysicalMaterial({ color: '#a98a5a', roughness: .5, clearcoat: .5 });
    textura(l.percha, (t) => { maderaPercha.map = t; maderaPercha.needsUpdate = true; cantos.map = t; cantos.color.set('#b49770'); cantos.needsUpdate = true; });
    const liston = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD), [cantos, cantos, cantos, cantos, maderaPercha, cantos]);
    liston.castShadow = true; percha.add(liston);
    percha.add(alambreForma());
    const yAlambreAbajo = -BH * .12 - BH * .21;
    l.pinzas.forEach(px => percha.add(pinza(px * PW, yAlambreAbajo)));
    // la lámina: la foto enderezada, tal cual, sujeta por las pinzas
    const papelMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .8, metalness: 0, envMapIntensity: .12 });
    textura(l.imagen, (t) => { papelMat.map = t; papelMat.needsUpdate = true; });
    const [tw, th] = l.tam || [1400, 1925];
    const pw = tw > th ? PW * 1.4 : PW, ph = pw * th / tw;
    const papel = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, .0015), [plasticoNegro, plasticoNegro, plasticoNegro, plasticoNegro, papelMat, new THREE.MeshStandardMaterial({ color: '#d9d4c8', roughness: .9 })]);
    papel.material[0] = papel.material[1] = papel.material[2] = papel.material[3] = new THREE.MeshStandardMaterial({ color: '#e8e4da', roughness: .9 });
    papel.position.set(0, -BH / 2 - .006 - ph / 2, -.001); papel.castShadow = papel.receiveShadow = true; percha.add(papel);
    laminas.push({ a, indice: k % LAMINAS.length, pendulo, giro: 0, vel: 0, fase: Math.random() * 6 });
  }
  // ---------- Movimiento: la valla gira sola; se puede arrastrar ----------
  let rot = 0, velRot = sinMovimiento ? 0 : .06, arrastrando = false, ultX = 0, ultT = 0, quieto = 0;
  const VEL_CRUCERO = sinMovimiento ? 0 : .06;
  canvas.addEventListener('pointerdown', (e) => { arrastrando = true; ultX = e.clientX; ultT = performance.now(); canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; });
  canvas.addEventListener('pointermove', (e) => {
    if (!arrastrando) return;
    const now = performance.now(), dx = e.clientX - ultX;
    const d = dx / box.clientWidth * 1.1;
    rot += d; velRot = d / Math.max(.008, (now - ultT) / 1000);
    ultX = e.clientX; ultT = now;
  });
  const soltar = () => { arrastrando = false; quieto = performance.now(); canvas.style.cursor = ''; };
  canvas.addEventListener('pointerup', soltar); canvas.addEventListener('pointercancel', soltar);

  // flechas e info de la lámina que queda delante
  const nombre = document.querySelector('.info-name'), detalle = document.querySelector('.info-color-name'), num = document.querySelector('.info-num');
  let delante = -1, objetivo = null;
  const irA = (paso) => {
    const sig = Math.round(-rot / (Math.PI * 2) * SLOTS) + paso;
    objetivo = -sig / SLOTS * Math.PI * 2;
  };
  document.querySelector('.info-btn.prev')?.addEventListener('click', () => irA(-1));
  document.querySelector('.info-btn.next')?.addEventListener('click', () => irA(1));

  function ajustar() {
    const w = box.clientWidth, h = box.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // la cámara se aleja lo justo para que quepa la lámina entera con su percha (y de ancho en pantallas estrechas)
    const dist = Math.max(1.3, .62 / camera.aspect / Math.tan(THREE.MathUtils.degToRad(18)));
    if (camera.aspect < 1.6) {
      // Móvil: cámara más lejos y algo más alta, mirando un poco hacia abajo,
      // para que se vea el círculo entero de la valla girando
      const lejos = dist * 1.3;
      camera.position.set(0, 1.6, R + lejos);
      camera.lookAt(0, .82, R - .45);
      scene.fog.near = lejos + .6; scene.fog.far = lejos + 6.5;
    } else {
      camera.position.set(0, 1.04, R + dist);
      camera.lookAt(0, .97, R - .2);
      scene.fog.near = 3.2; scene.fog.far = 7.5;
    }
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', ajustar); ajustar();

  const reloj = new THREE.Clock();
  let antes = 0;
  function animar() {
    const t = reloj.getElapsedTime(), dt = Math.min(.05, t - antes); antes = t;
    const rotAntes = rot;
    if (objetivo !== null) {
      rot += (objetivo - rot) * Math.min(1, dt * 3.2);
      if (Math.abs(objetivo - rot) < .002) { objetivo = null; quieto = performance.now(); velRot = 0; }
    } else if (!arrastrando) {
      // tras soltarla, frena con inercia y al rato vuelve a girar despacio
      const espera = performance.now() - quieto > 2500;
      velRot += ((espera ? VEL_CRUCERO : 0) - velRot) * Math.min(1, dt * (espera ? .5 : 1.6));
      rot += velRot * dt;
    }
    valla.rotation.y = rot;
    const w = (rot - rotAntes) / Math.max(dt, 1e-4);   // velocidad de giro real

    // cada lámina es un péndulo colgado del tornillo: el giro la empuja y se balancea con algo de aire
    laminas.forEach(l => {
      const aire = sinMovimiento ? 0 : Math.sin(t * .9 + l.fase) * .012 + Math.sin(t * 2.3 + l.fase * 2) * .004;
      const fuerza = -w * .05 + aire;
      l.vel += ((fuerza - l.giro) * 18 - l.vel * 2.2) * dt;
      l.giro += l.vel * dt;
      l.pendulo.rotation.z = l.giro;
    });

    // qué lámina está delante
    const slot = ((Math.round(-rot / (Math.PI * 2) * SLOTS) % SLOTS) + SLOTS) % SLOTS;
    const i = laminas[slot].indice;
    if (i !== delante && nombre) {
      delante = i;
      nombre.textContent = LAMINAS[i].nombre;
      if (detalle) detalle.textContent = LAMINAS[i].detalle;
      if (num) num.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(LAMINAS.length).padStart(2, '0');
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animar);
  }
  animar();
})();
