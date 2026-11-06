// VALLA DE LÁMINAS: una valla de malla metálica en círculo que gira sin fin, con las láminas flotando delante
// Para añadir una lámina, copia una línea y cambia nombre, descripción e imagen.
const LAMINAS = [
  // tam: ancho y alto de la imagen en píxeles (si falta, 1400 × 1925); las apaisadas flotan más anchas
  { nombre: 'Lámina 01', detalle: 'Impresión en funda', imagen: '../img/obras/lamina-1.webp', tam: [1100, 1420] },
  { nombre: 'Lámina 02', detalle: 'Impresión en funda', imagen: '../img/obras/lamina-2.webp', tam: [1100, 1420] },
  { nombre: 'Lámina 03', detalle: 'Obra original', imagen: '../img/obras/lamina-3.webp', tam: [1100, 1552] },
  { nombre: 'Lámina 04', detalle: 'Obra original', imagen: '../img/obras/lamina-4.webp', tam: [1100, 1560] },
  { nombre: 'Lámina 05', detalle: 'Obra original', imagen: '../img/obras/lamina-5.webp', tam: [1100, 1557] },
  { nombre: 'Lámina 06', detalle: 'Obra original', imagen: '../img/obras/lamina-6.webp', tam: [1500, 1062] },
  { nombre: 'Lámina 07', detalle: 'Obra original', imagen: '../img/obras/lamina-7.webp', tam: [1100, 1546] },
  { nombre: 'Lámina 08', detalle: 'Obra original', imagen: '../img/obras/lamina-8.webp', tam: [1500, 1047] },
  { nombre: 'Lámina 09', detalle: 'Obra original', imagen: '../img/obras/lamina-9.webp', tam: [1100, 1583] },
  { nombre: 'Lámina 10', detalle: 'Obra original', imagen: '../img/obras/lamina-10.webp', tam: [1100, 1564] },
  { nombre: 'Lámina 11', detalle: 'Obra original', imagen: '../img/obras/lamina-11.webp', tam: [1100, 1468] },
  { nombre: 'Lámina 12', detalle: 'Obra original', imagen: '../img/obras/lamina-12.webp', tam: [1100, 1468] },
  { nombre: 'Lámina 13', detalle: 'Obra original', imagen: '../img/obras/lamina-13.webp', tam: [1100, 1467] },
  { nombre: 'Lámina 14', detalle: 'Obra original', imagen: '../img/obras/lamina-14.webp', tam: [1100, 1466] },
  { nombre: 'Lámina 15', detalle: 'Obra original', imagen: '../img/obras/lamina-15.webp', tam: [1100, 1468] },
  { nombre: 'Lámina 16', detalle: 'Obra original', imagen: '../img/obras/lamina-16.webp', tam: [1100, 1466] },
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

  // ---------- Acero galvanizado: alambre y tubos que reflejan la luz ----------
  // textura de galvanizado: manchas claras y oscuras muy suaves y vetas finas, para que el brillo no sea de plástico
  const galvTex = lienzo(512, 512, (g, w, h) => {
    g.fillStyle = '#c9ccd0'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 15 + Math.random() * 60;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      const c = Math.random() < .5 ? '255,255,255' : '90,96,104';
      gr.addColorStop(0, `rgba(${c},${.06 + Math.random() * .1})`); gr.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 4000; i++) {
      g.fillStyle = Math.random() < .5 ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.06)';
      g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 6, 1);
    }
  });
  const galvRug = lienzo(256, 256, (g, w, h) => {
    g.fillStyle = '#5a5a5a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3000; i++) {
      const v = 60 + Math.random() * 90 | 0;
      g.fillStyle = `rgba(${v},${v},${v},.5)`; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 4, 1 + Math.random() * 2);
    }
  }, false);
  [galvTex, galvRug].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; });
  const alambreMat = new THREE.MeshStandardMaterial({ color: '#d4d8dc', metalness: 1, roughness: .3, map: galvTex, roughnessMap: galvRug, envMapIntensity: 1.8 });
  const tuboMat = new THREE.MeshStandardMaterial({ color: '#c3c7cb', metalness: 1, roughness: .26, map: galvTex, roughnessMap: galvRug, envMapIntensity: 1.7 });

  // ---------- La valla: malla de simple torsión (rombos) en círculo, con postes y tubo arriba ----------
  const R = 2.2;              // radio del círculo de la valla
  const ALTO = 1.42, GRUESO = .006;
  const ROMBO_W = .062;                                     // ancho del rombo, como una malla de 50 mm
  const N = 2 * Math.round(2 * Math.PI * R / ROMBO_W);     // alambres en zigzag que forman la malla (número par)
  const PASO = 2 * Math.PI * R / N;                        // cada alambre va de su sitio al del vecino y vuelve
  const ALTO_MALLA = ALTO - .05;
  const filas = Math.round(ALTO_MALLA / (ROMBO_W * .5));
  // un alambre sube en zigzag; en cada pico se engancha con el del lado y pasa por delante o por detrás
  // (los pares y los impares van a contrapié, así se cierran los rombos)
  const alambre = (fase) => {
    const puntos = [];
    for (let j = 0; j <= filas; j++) {
      const lado = (j + fase) % 2;
      puntos.push(new THREE.Vector3(lado * PASO - PASO / 2, .04 + j * ALTO_MALLA / filas, (lado ? 1 : -1) * GRUESO * .35));
    }
    // arriba los alambres acaban retorcidos en un gancho, como en la foto
    const t = puntos[puntos.length - 1], sg = t.x > 0 ? -1 : 1;
    puntos.push(new THREE.Vector3(t.x + sg * .005, t.y + .02, t.z + .004), new THREE.Vector3(t.x + sg * .014, t.y + .027, t.z + .006), new THREE.Vector3(t.x + sg * .02, t.y + .017, t.z + .004));
    const camino = new THREE.CurvePath();
    for (let i = 0; i < puntos.length - 1; i++) camino.add(new THREE.LineCurve3(puntos[i], puntos[i + 1]));
    return new THREE.TubeGeometry(camino, puntos.length * 2, .0016, 5, false);
  };

  const valla = new THREE.Group();
  scene.add(valla);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1);
  [0, 1].forEach(fase => {
    const malla = new THREE.InstancedMesh(alambre(fase), alambreMat, N / 2);
    malla.castShadow = malla.receiveShadow = true;
    for (let k = 0; k < N / 2; k++) {
      const i = k * 2 + fase, a = (i + .5) / N * Math.PI * 2;
      // la malla nunca está perfecta: un pelín combada hacia fuera o hacia dentro
      e3.set((Math.random() - .5) * .006, a, 0);
      q.setFromEuler(e3);
      const r = R + Math.sin(i * .11) * .004;
      m.compose(new THREE.Vector3(Math.sin(a) * r, 0, Math.cos(a) * r), q, s);
      malla.setMatrixAt(k, m);
    }
    valla.add(malla);
  });

  // Tubo arriba y alambre tensor abajo, por dentro de la malla
  const aro = (y, grosor, dentro, mat) => {
    const t = new THREE.Mesh(new THREE.TorusGeometry(R - dentro, grosor, 12, 240), mat);
    t.rotation.x = Math.PI / 2; t.position.y = y; t.castShadow = t.receiveShadow = true; valla.add(t);
  };
  aro(ALTO - .02, .017, .022, tuboMat);
  aro(.75, .0026, .008, alambreMat);
  aro(.08, .0026, .008, alambreMat);
  // Postes redondos con su caperuza, cada cierto trecho
  const geoPoste = new THREE.CylinderGeometry(.024, .024, ALTO + .04, 24);
  const geoCapa = new THREE.SphereGeometry(.028, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  for (let i = 0; i < 8; i++) {
    const a = (i + .5) / 8 * Math.PI * 2;
    const p = new THREE.Mesh(geoPoste, tuboMat);
    p.position.set(Math.sin(a) * (R - .03), (ALTO + .04) / 2, Math.cos(a) * (R - .03));
    p.castShadow = p.receiveShadow = true; valla.add(p);
    const c = new THREE.Mesh(geoCapa, tuboMat); c.position.set(p.position.x, ALTO + .04, p.position.z); valla.add(c);
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

  // ---------- Láminas flotando delante de la malla ----------
  // Medidas sacadas de las fotos: todo es proporcional al ancho de la lámina (PW)
  const PW = .32;
  const cargador = new THREE.TextureLoader();
  const textura = (url, alCargar) => cargador.load(url, (t) => {
    t.encoding = THREE.sRGBEncoding; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); alCargar && alCargar(t);
  });

  // reflejos para el metal: un taller oscuro con focos y ventanales, para que el acero brille de verdad
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = lienzo(1024, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#5a5248'); gr.addColorStop(.45, '#2a2622'); gr.addColorStop(.55, '#15130f'); gr.addColorStop(1, '#040404');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // cielo nublado claro por arriba, como en la foto
    const cielo = g.createLinearGradient(0, 0, 0, h * .3);
    cielo.addColorStop(0, 'rgba(225,230,236,.85)'); cielo.addColorStop(1, 'rgba(225,230,236,0)');
    g.fillStyle = cielo; g.fillRect(0, 0, w, h * .3);
    // focos y ventanas: manchas muy claras que hacen los brillos en el alambre
    const caja = (x, y, bw, bh, c, alfa) => {
      g.save(); g.shadowColor = c; g.shadowBlur = 30; g.fillStyle = c; g.globalAlpha = alfa; g.fillRect(x, y, bw, bh); g.restore();
    };
    caja(w * .46, h * .12, w * .1, h * .1, '#fff2da', 1);       // foco principal, delante y arriba
    caja(w * .08, h * .22, w * .14, h * .16, '#dfe8f5', .8);    // ventanal frío a un lado
    caja(w * .74, h * .26, w * .06, h * .2, '#ffe0b0', .7);     // luz cálida al otro lado
    caja(0, h * .47, w, h * .025, '#8a7f70', .5);               // línea de horizonte
  });
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = pmrem.fromEquirectangular(envTex).texture;

  const SLOTS = (() => { let n = Math.floor(2 * Math.PI * R / .58); return n - (n % LAMINAS.length || 0); })();
  const ALTURA = .98;          // altura del centro de las láminas
  const SEPARACION = .075;     // lo que flotan por delante de la malla
  const laminas = [];
  for (let k = 0; k < SLOTS; k++) {
    const l = LAMINAS[k % LAMINAS.length];
    const a = k / SLOTS * Math.PI * 2;
    const soporte = new THREE.Group();
    soporte.rotation.y = a;
    soporte.position.set(Math.sin(a) * (R + SEPARACION), ALTURA, Math.cos(a) * (R + SEPARACION));
    valla.add(soporte);
    // la lámina flota sola, sin nada que la sujete; se mece despacio en el aire
    const pendulo = new THREE.Group(); soporte.add(pendulo);
    const papelMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .8, metalness: 0, envMapIntensity: .12 });
    textura(l.imagen, (t) => { papelMat.map = t; papelMat.needsUpdate = true; });
    const [tw, th] = l.tam || [1400, 1925];
    const pw = tw > th ? PW * 1.4 : PW, ph = pw * th / tw;
    const canto = new THREE.MeshStandardMaterial({ color: '#e8e4da', roughness: .9 });
    const papel = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, .0015), [canto, canto, canto, canto, papelMat, new THREE.MeshStandardMaterial({ color: '#d9d4c8', roughness: .9 })]);
    papel.castShadow = papel.receiveShadow = true; pendulo.add(papel);
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
    // la cámara se aleja lo justo para que quepa la lámina entera (y de ancho en pantallas estrechas)
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

    // cada lámina flota: sube y baja despacio, y el giro de la valla la inclina un poco, como si la empujara el aire
    laminas.forEach(l => {
      const aire = sinMovimiento ? 0 : Math.sin(t * .7 + l.fase) * .02 + Math.sin(t * 1.9 + l.fase * 2) * .006;
      const fuerza = -w * .04 + aire;
      l.vel += ((fuerza - l.giro) * 10 - l.vel * 2.4) * dt;
      l.giro += l.vel * dt;
      l.pendulo.rotation.z = l.giro;
      l.pendulo.rotation.y = sinMovimiento ? 0 : Math.sin(t * .5 + l.fase * 3) * .05;
      l.pendulo.position.y = sinMovimiento ? 0 : Math.sin(t * 1.1 + l.fase) * .012;
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
