/*
  GALERÍA DE FOTOS (.gallery-item): al pasar el cursor, la foto crece suave hasta ocupar casi
  toda la pantalla, con un botón CONTACTA al Instagram; al quitar el cursor vuelve a su sitio.
  En el móvil se abre y se cierra tocando.
*/
(() => {
  const conRaton = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const capa = document.createElement('div');
  capa.className = 'zoom-capa';
  const grande = document.createElement('img');
  grande.className = 'zoom-img';
  grande.alt = '';
  // Botón CONTACTA (lleva al Instagram) que aparece sobre la foto ampliada
  const boton = document.createElement('a');
  boton.className = 'info-btn contacta zoom-contacta';
  boton.href = 'https://www.instagram.com/ochentaveinte__/';
  boton.target = '_blank'; boton.rel = 'noopener';
  boton.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.4" cy="6.6" r="1.3" fill="currentColor"/></svg><span>Contacta</span>';
  document.body.append(capa, grande, boton);
  let abierta = null, bloqueada = null, cerrando = 0, enCierre = false;

  const destino = fig => {
    const r = fig.getBoundingClientRect();
    let H = innerHeight * .88, W = H * r.width / r.height;
    if (W > innerWidth * .92) { W = innerWidth * .92; H = W * r.height / r.width; }
    return { r, W, H, x: (innerWidth - W) / 2, y: (innerHeight - H) / 2 };
  };
  const enMiniatura = (d) => `translate(${d.r.left - d.x}px, ${d.r.top - d.y}px) scale(${d.r.width / d.W})`;

  const abrir = fig => {
    if (abierta || enCierre) return;
    const img = fig.querySelector('img'), d = destino(fig);
    abierta = fig;
    grande.src = img.currentSrc || img.src; grande.alt = img.alt;
    Object.assign(grande.style, { left: d.x + 'px', top: d.y + 'px', width: d.W + 'px', height: d.H + 'px',
      transition: 'none', transform: enMiniatura(d) });
    grande.classList.add('is-visible');
    fig.classList.add('is-zoom');
    grande.getBoundingClientRect();  // fija el punto de partida antes de animar
    grande.style.transition = '';
    grande.style.transform = 'none';
    capa.classList.add('is-visible');
    boton.style.left = (d.x + d.W / 2) + 'px';
    boton.style.top = (d.y + d.H - 28) + 'px';
    boton.classList.add('is-visible');
  };
  const cerrar = () => {
    const fig = abierta;
    if (!fig) return;
    abierta = null; bloqueada = conRaton ? fig : null; enCierre = true;
    // vuelve encogiéndose suave hasta su hueco en la galería
    grande.style.transform = enMiniatura(destino(fig));
    capa.classList.remove('is-visible');
    boton.classList.remove('is-visible');
    cerrando = setTimeout(() => {
      grande.classList.remove('is-visible'); fig.classList.remove('is-zoom'); enCierre = false;
    }, 480);
  };

  document.querySelectorAll('.gallery-item').forEach(fig => {
    if (!conRaton) fig.addEventListener('click', () => abrir(fig));
  });
  if (conRaton) {
    // tras cerrar, esa foto no se vuelve a abrir hasta que el cursor sale de ella
    const dentro = (el, e) => { const r = el.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; };
    document.addEventListener('mousemove', e => {
      // se cierra en cuanto el cursor sale de la foto grande (y de su miniatura)
      // (cuenta también el camino entre la miniatura y la foto grande, para poder pasar de una a otra)
      if (abierta) {
        const a = abierta.getBoundingClientRect(), g = grande.getBoundingClientRect();
        const x0 = Math.min(a.left, g.left), x1 = Math.max(a.right, g.right), y0 = Math.min(a.top, g.top), y1 = Math.max(a.bottom, g.bottom);
        const enPuente = e.clientX >= x0 && e.clientX <= x1 && e.clientY >= Math.max(a.top, g.top) && e.clientY <= Math.min(a.bottom, g.bottom);
        if (!dentro(grande, e) && !dentro(abierta, e) && !enPuente) cerrar();
        return;
      }
      const fig = e.target.closest && e.target.closest('.gallery-item');
      if (bloqueada && fig !== bloqueada) bloqueada = null;
      if (fig && fig !== bloqueada) abrir(fig);
    });
  }
  grande.addEventListener('click', cerrar);
  capa.addEventListener('click', cerrar);
  addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });
  addEventListener('scroll', () => { if (abierta && !conRaton) cerrar(); }, { passive: true });
})();
