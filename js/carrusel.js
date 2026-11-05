/*
  CARRUSELES CIRCULARES (Artistas y Ropa)
  Cualquier fila con class="row-viewport is-loop" se convierte en un anillo 3D
  de tarjetas que gira despacio sin fin, como la valla de Láminas.
  - Se puede arrastrar (ratón o dedo) y usar las flechas.
  - Se para mientras el ratón está encima, y vuelve a girar al rato.
  - Si hay pocas tarjetas se repiten para que el círculo quede lleno.
*/
(function () {
  const MIN_TARJETAS = 10;    // el anillo nunca tiene menos tarjetas que esto
  const VELOCIDAD = 9;        // grados por segundo cuando gira solo
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.row-viewport.is-loop').forEach((viewport, fila) => {
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

    let radio = 0;
    const medir = () => {
      const ancho = tarjetas[0].offsetWidth;
      radio = Math.round((ancho / 2) / Math.tan(Math.PI / n) + ancho * .06);
      tarjetas.forEach((el, i) => {
        el.style.transform = `translate(-50%, -50%) rotateY(${i * paso}deg) translateZ(${radio}px)`;
      });
      anillo.style.setProperty('--radio', radio + 'px');
    };

    // Giro: ángulo actual, objetivo de las flechas y velocidad
    let angulo = fila * paso / 2, objetivo = null, encima = false, arrastrando = false;
    let ultX = 0, vel = 0, ultimoToque = -1e9, visible = true, antes = performance.now();

    const pintar = () => {
      anillo.style.transform = `translateZ(${-radio}px) rotateY(${-angulo}deg)`;
      tarjetas.forEach((el, i) => {
        // Cuánto mira cada tarjeta hacia delante (1 = de frente, -1 = de espaldas)
        const frente = Math.cos((i * paso - angulo) * Math.PI / 180);
        el.style.filter = `brightness(${(.35 + .65 * Math.max(0, frente)).toFixed(2)})`;
        el.style.pointerEvents = frente > .55 ? '' : 'none';
        el.classList.toggle('is-front', frente > .97);
      });
    };

    const bucle = (t) => {
      const dt = Math.min(.05, (t - antes) / 1000); antes = t;
      if (visible && !document.hidden) {
        if (objetivo !== null) {
          angulo += (objetivo - angulo) * Math.min(1, dt * 8);
          if (Math.abs(objetivo - angulo) < .05) { angulo = objetivo; objetivo = null; }
        } else if (arrastrando) {
          vel *= Math.pow(.001, dt);  // si se deja el dedo quieto, no sale disparado al soltar
        } else {
          if (Math.abs(vel) > .5) { angulo += vel * dt; vel *= Math.pow(.05, dt); }  // inercia al soltar
          else if (!sinMovimiento && !encima && t - ultimoToque > 2500) angulo += VELOCIDAD * dt;
        }
        pintar();
      }
      requestAnimationFrame(bucle);
    };

    // Flechas: lleva la tarjeta anterior/siguiente al frente
    const ir = dir => {
      const base = objetivo !== null ? objetivo : Math.round(angulo / paso) * paso;
      objetivo = base + dir * paso; vel = 0; ultimoToque = performance.now();
    };
    viewport.querySelector('.prev').addEventListener('click', () => ir(-1));
    viewport.querySelector('.next').addEventListener('click', () => ir(1));

    // Arrastrar con ratón o dedo (si se arrastra, no abre la tarjeta)
    let movido = 0;
    const gradosPorPx = () => 360 / (2 * Math.PI * radio) * 1.1;
    anillo.addEventListener('pointerdown', e => {
      arrastrando = true; movido = 0; ultX = e.clientX; vel = 0; objetivo = null;
      ultimoToque = performance.now();
    });
    window.addEventListener('pointermove', e => {
      if (!arrastrando) return;
      const dx = e.clientX - ultX; ultX = e.clientX; movido += Math.abs(dx);
      const d = -dx * gradosPorPx();
      angulo += d; vel = d / .016;
      ultimoToque = performance.now();
    });
    const soltar = () => {
      if (!arrastrando) return;
      arrastrando = false; ultimoToque = performance.now();
      if (Math.abs(vel) < 20) vel = 0;
      vel = Math.max(-400, Math.min(400, vel));
    };
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
    anillo.addEventListener('click', e => { if (movido > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    anillo.addEventListener('dragstart', e => e.preventDefault());

    viewport.addEventListener('mouseenter', () => { encima = true; });
    viewport.addEventListener('mouseleave', () => { encima = false; });
    viewport.addEventListener('focusin', e => {
      // Con teclado: gira hasta la tarjeta enfocada
      if (arrastrando || !e.target.matches(':focus-visible')) return;
      const i = tarjetas.indexOf(e.target.closest('.row-card'));
      if (i >= 0) { const d = ((i * paso - angulo) % 360 + 540) % 360 - 180; objetivo = angulo + d; }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(viewport);
    }

    medir(); pintar();
    window.addEventListener('resize', () => { medir(); pintar(); });
    requestAnimationFrame(bucle);
  });
})();
