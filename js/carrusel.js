/*
  CARRUSELES GIRATORIOS (Artistas y Ropa)
  Cualquier fila con class="row-viewport is-loop" gira en bucle: las tarjetas se
  repiten a los lados para que nunca se acabe, gira sola cada pocos segundos y se
  para mientras alguien la toca, pasa el ratón o usa las flechas.
*/
(function () {
  const ESPERA = 3500; // ms entre giros
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.row-viewport.is-loop').forEach((viewport, i) => {
    const track = viewport.querySelector('.row-track');
    const originales = Array.from(track.children);
    const n = originales.length;
    if (!n) return;

    // Copia a la izquierda y a la derecha (ocultas para lectores de pantalla y teclado)
    const copia = el => {
      const c = el.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.tabIndex = -1;
      return c;
    };
    originales.forEach(el => track.appendChild(copia(el)));
    originales.slice().reverse().forEach(el => track.insertBefore(copia(el), track.firstChild));

    const cards = track.children;
    const paso = () => cards[1].offsetLeft - cards[0].offsetLeft;
    const vuelta = () => cards[n].offsetLeft - cards[0].offsetLeft; // ancho de una lista entera

    // Siempre en la copia del centro: si se sale, salta a la tarjeta equivalente sin que se note
    const centrar = () => { track.scrollLeft = vuelta(); };
    const recolocar = () => {
      const v = vuelta();
      if (track.scrollLeft < v * .5) track.scrollLeft += v;
      else if (track.scrollLeft >= v * 1.5) track.scrollLeft -= v;
    };
    let quieto;
    track.addEventListener('scroll', () => {
      clearTimeout(quieto);
      quieto = setTimeout(recolocar, 140);
    }, { passive: true });

    const mover = dir => track.scrollBy({ left: dir * paso(), behavior: 'smooth' });

    let pausado = false, visible = true, reloj;
    const reiniciar = () => {
      clearInterval(reloj);
      if (sinMovimiento) return;
      reloj = setInterval(() => { if (!pausado && visible && !document.hidden) mover(1); }, ESPERA);
    };
    viewport.querySelector('.prev').addEventListener('click', () => { mover(-1); reiniciar(); });
    viewport.querySelector('.next').addEventListener('click', () => { mover(1); reiniciar(); });

    const pausa = v => () => { pausado = v; if (!v) reiniciar(); };
    viewport.addEventListener('mouseenter', pausa(true));
    viewport.addEventListener('mouseleave', pausa(false));
    viewport.addEventListener('focusin', pausa(true));
    viewport.addEventListener('focusout', pausa(false));
    let soltar;
    track.addEventListener('touchstart', () => { clearTimeout(soltar); pausado = true; }, { passive: true });
    track.addEventListener('touchend', () => { soltar = setTimeout(pausa(false), 2500); }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(viewport);
    }

    centrar();
    window.addEventListener('load', centrar);
    window.addEventListener('resize', centrar);
    setTimeout(reiniciar, i * 1700); // cada fila gira a su ritmo, no todas a la vez
  });
})();
