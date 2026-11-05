/*
  LISTA DE ARTISTAS DEL CARRUSEL
  ------------------------------
  Para añadir un artista, copia una línea y cambia los datos:
    nombre: como sale en la tarjeta
    enlace: su página (crea artistas/nombre.html copiando otra)
    foto:   opcional, una imagen en img/ (si no hay, sale el logo dorado)
  El orden de la lista es el orden del carrusel. Da igual cuántos haya: gira en bucle.
*/
window.ARTISTAS = [
  { nombre: 'Chey',      enlace: 'artistas/chey.html' },
  { nombre: 'Celestica', enlace: 'artistas/celestica.html' },
  { nombre: 'Bruno',     enlace: 'artistas/bruno.html' },
  { nombre: 'Stefy',     enlace: 'artistas/stefy.html' },
  // { nombre: 'Nuevo', enlace: 'artistas/nuevo.html', foto: 'img/artistas/nuevo.jpg' },
];

// Pinta las tarjetas de la lista (el giro lo hace js/carrusel.js)
(function () {
  const track = document.querySelector('[data-carrusel="artistas"] .row-track');
  if (!track) return;
  window.ARTISTAS.forEach(a => {
    const el = document.createElement('a');
    el.className = 'row-card';
    el.href = a.enlace;
    const media = document.createElement('span');
    media.className = 'row-card-media';
    const img = document.createElement('img');
    img.alt = '';
    if (a.foto) { img.src = a.foto; img.loading = 'lazy'; }
    else { img.className = 'row-card-logo'; img.src = 'img/logo-ov.svg'; }
    media.appendChild(img);
    const titulo = document.createElement('span');
    titulo.className = 'row-card-title';
    titulo.textContent = a.nombre;
    el.append(media, titulo);
    track.appendChild(el);
  });
})();
