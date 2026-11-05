/*
  CARRUSELES CIRCULARES (Artistas y Ropa)
  Cualquier fila con class="row-viewport is-loop" se convierte en un anillo 3D
  de tarjetas que gira despacio sin fin, como la valla de Láminas.
  Cuando giran solos, todos los aros dan el paso A LA VEZ (al mismo ritmo).
  - Cada aro se mueve por su cuenta con sus flechas o arrastrándolo (ratón o dedo).
  - Un aro se para mientras el ratón está encima o justo después de tocarlo.
  - Si hay pocas tarjetas se repiten para que el círculo quede lleno.
*/
(function () {
  const MIN_TARJETAS = 10;    // el anillo nunca tiene menos tarjetas que esto
  // grados: el círculo se ve un poco desde arriba, con las de atrás asomando (algo más en móvil)
  const inclinacion = () => window.innerWidth <= 768 ? -14 : -10;
  const PAUSA = 4;            // segundos que se queda cada tarjeta delante
  const GIRO = 1.8;           // segundos que tarda en girar a la siguiente
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Cada aro tiene su propia posición (en "tarjetas"); el reloj del giro automático es común
  let arrastrando = null, siguienteGiro = performance.now() + PAUSA * 1000;
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
    const aro = { viewport, anillo, tarjetas, n, paso, radio: 0,
      pos: 0, objetivo: null, vel: 0, giro: null, encima: false, ultimoToque: -1e9 };

    aro.medir = () => {
      const ancho = tarjetas[0].offsetWidth;
      aro.radio = Math.round((ancho / 2) / Math.tan(Math.PI / n) + ancho * .06);
      aro.girada = [];  // se recalcula en pintar()
    };
    aro.pintar = () => {
      const pos = aro.pos, angulo = pos * paso;
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
          el.classList.toggle('is-detras', detras);  // si la tarjeta tiene reverso, se ve el reverso
        }
        el.style.filter = frente >= 0
          ? `brightness(${(.4 + .6 * frente).toFixed(2)})`
          : `brightness(${(.42 + .12 * frente).toFixed(2)}) blur(${(-frente * 1.2).toFixed(1)}px)`;
        el.style.pointerEvents = frente > .55 ? '' : 'none';
        el.classList.toggle('is-front', i === delante);
      });
    };

    // Flechas: mueven solo este aro una tarjeta
    const ir = dir => {
      const base = aro.objetivo !== null ? aro.objetivo : Math.round(aro.pos);
      aro.objetivo = base + dir; aro.giro = null; aro.ultimoToque = performance.now();
    };
    viewport.querySelector('.prev').addEventListener('click', () => ir(-1));
    viewport.querySelector('.next').addEventListener('click', () => ir(1));

    // Arrastrar con ratón o dedo (si se arrastra, no abre la tarjeta)
    anillo.addEventListener('pointerdown', e => {
      arrastrando = aro; aro.movido = 0; aro.ultX = e.clientX; aro.vel = 0; aro.objetivo = null; aro.giro = null;
      aro.ultimoToque = performance.now();
    });
    anillo.addEventListener('click', e => { if (aro.movido > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    anillo.addEventListener('dragstart', e => e.preventDefault());

    viewport.addEventListener('mouseenter', () => { aro.encima = true; });
    viewport.addEventListener('mouseleave', () => { aro.encima = false; });
    viewport.addEventListener('focusin', e => {
      // Con teclado: gira hasta la tarjeta enfocada
      if (arrastrando || !e.target.matches(':focus-visible')) return;
      const i = tarjetas.indexOf(e.target.closest('.row-card'));
      if (i >= 0) { const d = (((i - aro.pos) % n) + n * 1.5) % n - n / 2; aro.objetivo = Math.round(aro.pos + d); aro.giro = null; }
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
    aro.pos += d; aro.vel = d / .016;
    aro.ultimoToque = performance.now();
  });
  const soltar = () => {
    const aro = arrastrando;
    if (!aro) return;
    arrastrando = null; aro.ultimoToque = performance.now();
    const vel = Math.max(-6, Math.min(6, aro.vel));
    // Al soltar, se queda con una tarjeta justo delante
    aro.objetivo = Math.round(aro.pos + vel * .35); aro.vel = 0;
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
      // Reloj común: cada PAUSA + GIRO segundos, los aros que estén quietos dan un paso a la vez
      const toca = t >= siguienteGiro;
      if (toca) siguienteGiro = t + (PAUSA + GIRO) * 1000;
      aros.forEach(a => {
        if (arrastrando === a) {
          a.giro = null;
        } else if (a.objetivo !== null) {
          a.pos += (a.objetivo - a.pos) * Math.min(1, dt * 5);
          if (Math.abs(a.objetivo - a.pos) < .002) { a.pos = a.objetivo; a.objetivo = null; }
        } else if (a.giro) {
          const k = Math.min(1, (t - a.giro.t0) / (GIRO * 1000));
          const e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
          a.pos = a.giro.desde + (a.giro.hasta - a.giro.desde) * e;
          if (k >= 1) { a.pos = a.giro.hasta; a.giro = null; }
        } else if (toca && !sinMovimiento && !a.encima && t - a.ultimoToque > 2500) {
          a.giro = { desde: a.pos, hasta: Math.round(a.pos) + 1, t0: t };
        }
        // El halo dorado solo brilla cuando hay una tarjeta justo delante
        const halo = Math.max(0, 1 - Math.abs(a.pos - Math.round(a.pos)) * 6);
        a.viewport.style.setProperty('--halo', halo.toFixed(2));
        a.pintar();
      });
    }
    requestAnimationFrame(bucle);
  };

  const medirTodo = () => { aros.forEach(a => { a.medir(); a.pintar(); }); };
  medirTodo();
  window.addEventListener('resize', medirTodo);
  requestAnimationFrame(bucle);
})();
