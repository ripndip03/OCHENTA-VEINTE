/*
  CARRUSELES CIRCULARES (Artistas y Ropa)
  Cualquier fila con class="row-viewport is-loop" se convierte en un anillo 3D
  de tarjetas que gira despacio sin fin, como la valla de Láminas.
  Todos los aros giran A LA VEZ: comparten la misma posición (contada en tarjetas),
  así la tarjeta de delante cambia en todos al mismo tiempo.
  - Se pueden arrastrar (ratón o dedo) y usar las flechas: se mueven todos juntos.
  - Se paran mientras el ratón está encima de cualquiera, y vuelven a girar al rato.
  - Si hay pocas tarjetas se repiten para que el círculo quede lleno.
*/
(function () {
  const MIN_TARJETAS = 10;    // el anillo nunca tiene menos tarjetas que esto
  // grados: el círculo se ve un poco desde arriba, con las de atrás asomando (algo más en móvil)
  const inclinacion = () => window.innerWidth <= 768 ? -14 : -10;
  const PAUSA = 4;            // segundos que se queda cada tarjeta delante
  const GIRO = 1.8;           // segundos que tarda en girar a la siguiente
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Estado común a todos los aros (posición en "tarjetas")
  let pos = 0, objetivo = null, vel = 0, encima = 0, arrastrando = null, ultimoToque = -1e9;
  let giro = null, quietoDesde = performance.now();  // giro automático: {desde, hasta, t0}
  const aros = [];

  document.querySelectorAll('.row-viewport.is-loop').forEach(viewport => {
    const anillo = viewport.querySelector('.row-track');
    const originales = Array.from(anillo.children);
    if (!originales.length) return;

    // Rellena el círculo repitiendo las tarjetas (las copias no se leen ni se tabulan)
    const tarjetas = originales.slice();
    while (tarjetas.length < MIN_TARJETAS) {
      originales.forEach(el => {
        const c = el.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        c.tabIndex = -1;
        anillo.appendChild(c);
        tarjetas.push(c);
      });
    }
    viewport.classList.add('is-ring');
    anillo.classList.add('ring');
    const n = tarjetas.length;
    const paso = 360 / n;
    const aro = { viewport, anillo, tarjetas, n, paso, radio: 0 };

    aro.medir = () => {
      const ancho = tarjetas[0].offsetWidth;
      aro.radio = Math.round((ancho / 2) / Math.tan(Math.PI / n) + ancho * .06);
      aro.girada = [];  // se recalcula en pintar()
    };
    aro.pintar = () => {
      const angulo = pos * paso;
      // La tarjeta de delante queda siempre en el mismo sitio (donde está el halo), aunque el círculo esté inclinado
      const inc = inclinacion(), t = inc * Math.PI / 180;
      anillo.style.transform = `translate3d(0, ${(aro.radio * Math.sin(t)).toFixed(1)}px, ${(-aro.radio * Math.cos(t)).toFixed(1)}px) rotateX(${inc}deg) rotateY(${-angulo}deg)`;
      const delante = ((Math.round(pos) % n) + n) % n;
      tarjetas.forEach((el, i) => {
        // Cuánto mira cada tarjeta hacia delante (1 = de frente, -1 = de espaldas)
        const frente = Math.cos((i * paso - angulo) * Math.PI / 180);
        // Las de detrás se giran para mirar hacia dentro: así se ven al fondo formando el círculo
        const detras = frente < 0;
        if (aro.girada[i] !== detras) {
          aro.girada[i] = detras;
          el.style.transform = `translate(-50%, -50%) rotateY(${i * paso}deg) translateZ(${aro.radio}px)` + (detras ? ' rotateY(180deg)' : '');
        }
        el.style.filter = frente >= 0
          ? `brightness(${(.4 + .6 * frente).toFixed(2)})`
          : `brightness(${(.42 + .12 * frente).toFixed(2)}) blur(${(-frente * 1.2).toFixed(1)}px)`;
        el.style.pointerEvents = frente > .55 ? '' : 'none';
        el.classList.toggle('is-front', i === delante);
      });
    };

    // Flechas: mueven todos los aros una tarjeta
    const ir = dir => {
      const base = objetivo !== null ? objetivo : Math.round(pos);
      objetivo = base + dir; vel = 0; ultimoToque = performance.now();
    };
    viewport.querySelector('.prev').addEventListener('click', () => ir(-1));
    viewport.querySelector('.next').addEventListener('click', () => ir(1));

    // Arrastrar con ratón o dedo (si se arrastra, no abre la tarjeta)
    anillo.addEventListener('pointerdown', e => {
      arrastrando = aro; aro.movido = 0; aro.ultX = e.clientX; vel = 0; objetivo = null;
      ultimoToque = performance.now();
    });
    anillo.addEventListener('click', e => { if (aro.movido > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    anillo.addEventListener('dragstart', e => e.preventDefault());

    viewport.addEventListener('mouseenter', () => { encima++; });
    viewport.addEventListener('mouseleave', () => { encima = Math.max(0, encima - 1); });
    viewport.addEventListener('focusin', e => {
      // Con teclado: gira hasta la tarjeta enfocada
      if (arrastrando || !e.target.matches(':focus-visible')) return;
      const i = tarjetas.indexOf(e.target.closest('.row-card'));
      if (i >= 0) { const d = (((i - pos) % n) + n * 1.5) % n - n / 2; objetivo = Math.round(pos + d); }
    });

    aros.push(aro);
  });
  if (!aros.length) return;

  window.addEventListener('pointermove', e => {
    const aro = arrastrando;
    if (!aro) return;
    const dx = e.clientX - aro.ultX; aro.ultX = e.clientX; aro.movido += Math.abs(dx);
    // px -> tarjetas: el ancho de una tarjeta arrastrado = una tarjeta
    const d = -dx / aro.tarjetas[0].offsetWidth;
    pos += d; vel = d / .016;
    ultimoToque = performance.now();
  });
  const soltar = () => {
    if (!arrastrando) return;
    arrastrando = null; ultimoToque = performance.now();
    vel = Math.max(-6, Math.min(6, vel));
    // Al soltar, se queda con una tarjeta justo delante
    objetivo = Math.round(pos + vel * .35); vel = 0;
  };
  window.addEventListener('pointerup', soltar);
  window.addEventListener('pointercancel', soltar);

  let visible = true;
  if ('IntersectionObserver' in window) {
    const vistos = new Set();
    const io = new IntersectionObserver(es => {
      es.forEach(e => e.isIntersecting ? vistos.add(e.target) : vistos.delete(e.target));
      visible = vistos.size > 0;
    });
    aros.forEach(a => io.observe(a.viewport));
  }

  let antes = performance.now();
  const bucle = t => {
    const dt = Math.min(.05, (t - antes) / 1000); antes = t;
    if (visible && !document.hidden) {
      if (arrastrando) {
        giro = null; quietoDesde = t;
      } else if (objetivo !== null) {
        giro = null;
        pos += (objetivo - pos) * Math.min(1, dt * 5);
        if (Math.abs(objetivo - pos) < .002) { pos = objetivo; objetivo = null; quietoDesde = t; }
      } else if (giro) {
        // Giro automático suave a la siguiente tarjeta (todos los aros a la vez)
        const k = Math.min(1, (t - giro.t0) / (GIRO * 1000));
        const e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        pos = giro.desde + (giro.hasta - giro.desde) * e;
        if (k >= 1) { pos = giro.hasta; giro = null; quietoDesde = t; }
      } else if (!sinMovimiento && !encima && t - ultimoToque > 2500 && t - quietoDesde > PAUSA * 1000) {
        const desde = Math.round(pos);
        giro = { desde: pos, hasta: desde + 1, t0: t };
      }
      // El halo dorado solo brilla cuando hay una tarjeta justo delante
      const halo = Math.max(0, 1 - Math.abs(pos - Math.round(pos)) * 6);
      aros.forEach(a => a.viewport.style.setProperty('--halo', halo.toFixed(2)));
      aros.forEach(a => a.pintar());
    }
    requestAnimationFrame(bucle);
  };

  const medirTodo = () => { aros.forEach(a => { a.medir(); a.pintar(); }); };
  medirTodo();
  window.addEventListener('resize', medirTodo);
  requestAnimationFrame(bucle);
})();
