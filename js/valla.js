// VALLA DE LÁMINAS: una valla de malla metálica en círculo que gira sin fin, con las láminas flotando delante
// Para añadir una lámina, copia una línea y cambia nombre, descripción e imagen.
const LAMINAS = [
  // leyenda: el texto que sale al lado de la lámina cuando se abre en grande (técnica, medidas, precio...)
  // tam: ancho y alto de la imagen en píxeles (si falta, 1400 × 1925); las apaisadas flotan más anchas
  { nombre: 'Lámina 01', detalle: 'Impresión en funda', leyenda: 'Aquí va la información de la obra: técnica, medidas, año y precio.', imagen: '../img/obras/lamina-1.webp', tam: [1100, 1420] },
  { nombre: 'Lámina 02', detalle: 'Impresión en funda', leyenda: 'Aquí va la información de la obra: técnica, medidas, año y precio.', imagen: '../img/obras/lamina-2.webp', tam: [1100, 1420] },
  { nombre: 'Lámina 03', detalle: 'Obra original', leyenda: 'Aquí va la información de la obra: técnica, medidas, año y precio.', imagen: '../img/obras/lamina-3.webp', tam: [1100, 1552] },
  { nombre: 'Lámina 04', detalle: 'Obra original', leyenda: 'Aquí va la información de la obra: técnica, medidas, año y precio.', imagen: '../img/obras/lamina-4.webp', tam: [1100, 1560] },
  { nombre: 'Lámina 05', detalle: 'Obra original', leyenda: 'Aquí va la información de la obra: técnica, medidas, año y precio.', imagen: '../img/obras/lamina-5.webp', tam: [1100, 1557] },
  { nombre: 'Lámina 06', detalle: 'Obra original', leyenda: 'Aquí va la información de la obra: técnica, medidas, año y precio.', imagen: '../img/obras/lamina-6.webp', tam: [1500, 1062] },
  { nombre: 'Lámina 07', detalle: 'Obra original', leyenda: 'Aquí va la información de la obra: técnica, medidas, año y precio.', imagen: '../img/obras/lamina-7.webp', tam: [1100, 1546] },
  { nombre: 'Lámina 08', detalle: 'Obra original', leyenda: 'Aquí va la información de la obra: técnica, medidas, año y precio.', imagen: '../img/obras/lamina-8.webp', tam: [1500, 1047] },
  { nombre: 'Lámina 09', detalle: 'Obra original', leyenda: 'Aquí va la información de la obra: técnica, medidas, año y precio.', imagen: '../img/obras/lamina-9.webp', tam: [1100, 1583] },
  { nombre: 'Lámina 10', detalle: 'Obra original', leyenda: 'Aquí va la información de la obra: técnica, medidas, año y precio.', imagen: '../img/obras/lamina-10.webp', tam: [1100, 1564] },
  { nombre: 'Lámina 11', detalle: 'Obra original', leyenda: 'Aquí va la información de la obra: técnica, medidas, año y precio.', imagen: '../img/obras/lamina-11.webp', tam: [1100, 1468] },
  { nombre: 'Lámina 12', detalle: 'Obra original', leyenda: 'Aquí va la información de la obra: técnica, medidas, año y precio.', imagen: '../img/obras/lamina-12.webp', tam: [1100, 1468] },
  { nombre: 'Lámina 13', detalle: 'Obra original', leyenda: 'Aquí va la información de la obra: técnica, medidas, año y precio.', imagen: '../img/obras/lamina-13.webp', tam: [1100, 1467] },
  { nombre: 'Lámina 14', detalle: 'Obra original', leyenda: 'Aquí va la información de la obra: técnica, medidas, año y precio.', imagen: '../img/obras/lamina-14.webp', tam: [1100, 1466] },
  { nombre: 'Lámina 15', detalle: 'Obra original', leyenda: 'Aquí va la información de la obra: técnica, medidas, año y precio.', imagen: '../img/obras/lamina-15.webp', tam: [1100, 1468] },
  { nombre: 'Lámina 16', detalle: 'Obra original', leyenda: 'Aquí va la información de la obra: técnica, medidas, año y precio.', imagen: '../img/obras/lamina-16.webp', tam: [1100, 1466] },
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
  const PW = .40;               // ancho de una lámina vertical (las apaisadas, 1,4 veces más)
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
    papel.userData.slot = k;
    laminas.push({ a, indice: k % LAMINAS.length, soporte, pendulo, papel, pw, ph, giro: 0, vel: 0, fase: Math.random() * 6, zoom: 0 });
  }
  // ---------- Movimiento: la valla gira sola; se puede arrastrar ----------
  let rot = 0, velRot = sinMovimiento ? 0 : .06, arrastrando = false, ultX = 0, ultT = 0, quieto = 0;
  const VEL_CRUCERO = sinMovimiento ? 0 : .06;
  // ---------- Ampliar: al pasar el cursor (o tocar en el móvil) la lámina sale de la valla y se abre en grande,
  // ocupando casi toda la pantalla, con su leyenda al lado. Al quitar el cursor vuelve suave a su sitio.
  const conRaton = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const rayo = new THREE.Raycaster(), puntero = new THREE.Vector2();
  const papeles = laminas.map(l => l.papel);
  let encima = -1, abierta = -1, abiertaEn = 0, bloqueada = -1, inicioX = 0, inicioY = 0, movido = false, cerrando = 0;
  const tocada = (x, y) => {
    const r = canvas.getBoundingClientRect();
    puntero.set((x - r.left) / r.width * 2 - 1, -(y - r.top) / r.height * 2 + 1);
    rayo.setFromCamera(puntero, camera);
    const hit = rayo.intersectObjects(papeles, false)[0];
    return hit ? hit.object.userData.slot : -1;
  };
  // dónde está la lámina en la pantalla ahora mismo (sus cuatro esquinas proyectadas)
  const esquina = new THREE.Vector3();
  const enPantalla = (l) => {
    const r = canvas.getBoundingClientRect();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      esquina.set(sx * l.pw / 2, sy * l.ph / 2, 0); l.papel.localToWorld(esquina); esquina.project(camera);
      const x = r.left + (esquina.x + 1) / 2 * r.width, y = r.top + (1 - esquina.y) / 2 * r.height;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    });
    return { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
  };
  const capa = document.createElement('div'); capa.className = 'zoom-capa';
  const ampliada = document.createElement('figure'); ampliada.className = 'lamina-grande';
  ampliada.innerHTML = '<img alt=""><figcaption class="lamina-leyenda"><p class="info-num"></p><h2 class="info-name"></h2><p class="leyenda-detalle"></p><p class="leyenda-texto"></p></figcaption>';
  document.body.append(capa, ampliada);
  const grandeImg = ampliada.querySelector('img');
  const caja = () => {
    // hueco para la imagen: casi toda la pantalla, dejando sitio a la leyenda (al lado en ordenador, debajo en móvil)
    const ancho = innerWidth, alto = innerHeight, movil = ancho < 820;
    const leyW = movil ? 0 : Math.min(340, ancho * .26), leyH = movil ? Math.min(170, alto * .24) : 0;
    const l = laminas[abierta], prop = l.pw / l.ph;
    let H = (alto - leyH) * .9, W = H * prop;
    const maxW = (ancho - leyW) * .9;
    if (W > maxW) { W = maxW; H = W / prop; }
    const totalW = W + (movil ? 0 : leyW + 32), totalH = H + (movil ? leyH + 16 : 0);
    return { x: (ancho - totalW) / 2, y: (alto - totalH) / 2, W, H, movil, leyW, leyH };
  };
  const abrir = (k) => {
    if (k === abierta) return;
    clearTimeout(cerrando);
    abierta = k; abiertaEn = performance.now();
    const l = laminas[k], dato = LAMINAS[l.indice], c = caja(), r = enPantalla(l);
    grandeImg.src = dato.imagen; grandeImg.alt = dato.nombre;
    ampliada.querySelector('.info-num').textContent = String(l.indice + 1).padStart(2, '0') + ' / ' + String(LAMINAS.length).padStart(2, '0');
    ampliada.querySelector('.info-name').textContent = dato.nombre;
    ampliada.querySelector('.leyenda-detalle').textContent = dato.detalle || '';
    ampliada.querySelector('.leyenda-texto').textContent = dato.leyenda || '';
    ampliada.classList.toggle('is-movil', c.movil);
    Object.assign(grandeImg.style, { left: c.x + 'px', top: c.y + 'px', width: c.W + 'px', height: c.H + 'px', transition: 'none',
      transform: `translate(${r.left - c.x}px, ${r.top - c.y}px) scale(${r.width / c.W}, ${r.height / c.H})` });
    const ley = ampliada.querySelector('.lamina-leyenda');
    Object.assign(ley.style, c.movil
      ? { left: c.x + 'px', top: (c.y + c.H + 16) + 'px', bottom: 'auto', width: c.W + 'px', height: c.leyH + 'px' }
      : { left: (c.x + c.W + 32) + 'px', top: 'auto', bottom: (innerHeight - c.y - c.H) + 'px', width: c.leyW + 'px', height: 'auto' });
    ampliada.classList.add('is-visible');
    grandeImg.getBoundingClientRect();     // fija el punto de partida antes de animar
    grandeImg.style.transition = ''; grandeImg.style.transform = 'none';
    ampliada.classList.add('is-abierta'); capa.classList.add('is-visible');
  };
  const cerrar = () => {
    if (abierta < 0) return;
    const r = enPantalla(laminas[abierta]), c = caja();
    grandeImg.style.transform = `translate(${r.left - c.x}px, ${r.top - c.y}px) scale(${r.width / c.W}, ${r.height / c.H})`;
    ampliada.classList.remove('is-abierta'); capa.classList.remove('is-visible');
    bloqueada = conRaton ? abierta : -1; abierta = -1; encima = -1;
    cerrando = setTimeout(() => ampliada.classList.remove('is-visible'), 520);
  };
  // con ratón: se abre al pasar por encima y se cierra al salir de la imagen grande (y de su leyenda)
  addEventListener('mousemove', (e) => {
    if (!conRaton || arrastrando) return;
    if (abierta >= 0) {
      const dentro = (el) => { const b = el.getBoundingClientRect(); return e.clientX >= b.left - 8 && e.clientX <= b.right + 8 && e.clientY >= b.top - 8 && e.clientY <= b.bottom + 8; };
      if (!dentro(grandeImg) && !dentro(ampliada.querySelector('.lamina-leyenda'))) cerrar();
      return;
    }
    if (e.target !== canvas) { encima = -1; return; }
    encima = tocada(e.clientX, e.clientY);
    if (encima !== bloqueada) bloqueada = -1; else encima = -1;   // tras cerrarla no se reabre hasta que el cursor sale de ella
    canvas.style.cursor = encima >= 0 ? 'zoom-in' : '';
    if (encima >= 0 && !ampliada.classList.contains('is-visible')) abrir(encima);
  });
  // (el clic que sigue al toque que la abrió no cuenta)
  const cerrarClic = () => { if (performance.now() - abiertaEn > 450) cerrar(); };
  capa.addEventListener('click', cerrarClic); grandeImg.addEventListener('click', cerrarClic);
  ampliada.querySelector('.lamina-leyenda').addEventListener('click', cerrarClic);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });

  canvas.addEventListener('pointerdown', (e) => {
    arrastrando = true; movido = false; ultX = inicioX = e.clientX; inicioY = e.clientY; ultT = performance.now();
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!arrastrando) return;
    if (Math.hypot(e.clientX - inicioX, e.clientY - inicioY) > 6) movido = true;
    if (!movido) return;
    canvas.style.cursor = 'grabbing';
    const now = performance.now(), dx = e.clientX - ultX;
    const d = dx / box.clientWidth * 1.1;
    rot += d; velRot = d / Math.max(.008, (now - ultT) / 1000);
    ultX = e.clientX; ultT = now;
  });
  const soltar = (e) => {
    arrastrando = false; quieto = performance.now(); canvas.style.cursor = '';
    // en el móvil (o un clic sin arrastrar): tocar una lámina la abre en grande
    if (!movido && e.type === 'pointerup') { const k = tocada(e.clientX, e.clientY); if (k >= 0) abrir(k); }
  };
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
      const lejos = dist * 1.12;
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
    if (abierta >= 0 || encima >= 0) { quieto = performance.now(); velRot *= Math.max(0, 1 - dt * 6); }  // la valla se para mientras miras una
    laminas.forEach((l, k) => {
      const aire = sinMovimiento ? 0 : Math.sin(t * .7 + l.fase) * .02 + Math.sin(t * 1.9 + l.fase * 2) * .006;
      const fuerza = -w * .04 + aire;
      l.vel += ((fuerza - l.giro) * 10 - l.vel * 2.4) * dt;
      l.giro += l.vel * dt;
      l.pendulo.rotation.z = l.giro;
      l.pendulo.rotation.y = sinMovimiento ? 0 : Math.sin(t * .5 + l.fase * 3) * .05;
      l.pendulo.position.y = sinMovimiento ? 0 : Math.sin(t * 1.1 + l.fase) * .012;
      l.papel.visible = k !== abierta || !ampliada.classList.contains('is-visible');   // la que está en grande deja su hueco
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
