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
    el.className = 'row-card row-card--nombre';
    el.href = a.enlace;
    // Cara de delante: solo el nombre centrado (o la foto, si la hay)
    const media = document.createElement('span');
    media.className = 'row-card-media';
    if (a.foto) {
      const img = document.createElement('img');
      img.src = a.foto; img.alt = ''; img.loading = 'lazy';
      media.appendChild(img);
    }
    const titulo = document.createElement('span');
    titulo.className = 'row-card-title';
    titulo.textContent = a.nombre;
    // Cara de atrás: el logo OV (se ve cuando la tarjeta pasa por detrás del círculo)
    const reverso = document.createElement('span');
    reverso.className = 'row-card-reverso';
    reverso.setAttribute('aria-hidden', 'true');
    const logo = document.createElement('img');
    logo.src = 'img/logo-ov.svg'; logo.alt = '';
    reverso.appendChild(logo);
    el.append(media, titulo, reverso);
    track.appendChild(el);
  });
})();
