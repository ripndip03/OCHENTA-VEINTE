/*
  FORMULARIO "¿TE LLAMAMOS NOSOTROS?"
  El cliente elige Móvil o Gmail en el desplegable, escribe su dato y lo envía.
  Nos llega por correo a CORREO_DESTINO (servicio gratuito FormSubmit: la primera vez
  manda un correo de activación a esa dirección; hay que pulsar el botón y ya funciona).
  El cliente no ve nunca este correo en la página.
*/
(function () {
  const CORREO_DESTINO = '';  // <-- aquí va el correo donde queréis recibir los contactos

  const form = document.querySelector('.contacto-form');
  if (!form) return;
  const via = form.querySelector('select[name="via"]');
  const dato = form.querySelector('input[name="dato"]');
  const acepto = form.querySelector('input[name="acepto"]');
  const estado = form.querySelector('.contacto-estado');
  const boton = form.querySelector('.contacto-enviar');

  const modos = {
    movil: { type: 'tel', inputmode: 'tel', autocomplete: 'tel', placeholder: 'Tu número de móvil' },
    email: { type: 'email', inputmode: 'email', autocomplete: 'email', placeholder: 'tucorreo@gmail.com' }
  };
  const cambiar = () => {
    const m = modos[via.value];
    Object.entries(m).forEach(([k, v]) => dato.setAttribute(k, v));
    dato.setAttribute('aria-label', m.placeholder);
    dato.value = ''; estado.textContent = ''; form.classList.remove('is-error');
  };
  via.addEventListener('change', cambiar);

  const valido = () => {
    const v = dato.value.trim();
    if (via.value === 'movil') return /^\+?[\d\s().-]{9,}$/.test(v) && v.replace(/\D/g, '').length >= 9;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  };
  const aviso = (txt, error) => { estado.textContent = txt; form.classList.toggle('is-error', !!error); };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!valido()) return aviso(via.value === 'movil' ? 'Revisa el número: tiene que tener al menos 9 cifras.' : 'Revisa el correo: parece que falta algo.', true);
    if (!acepto.checked) return aviso('Marca la casilla para que podamos contactarte.', true);
    if (!CORREO_DESTINO) return aviso('El formulario aún no está conectado. Escríbenos por Instagram mientras tanto.', true);
    boton.disabled = true; aviso('Enviando…');
    try {
      const r = await fetch('https://formsubmit.co/ajax/' + CORREO_DESTINO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: 'Nuevo contacto desde la web Ochenta - Veinte',
          _template: 'table', _captcha: 'false',
          'Quiere que le contactemos por': via.value === 'movil' ? 'Móvil' : 'Gmail',
          'Dato de contacto': dato.value.trim()
        })
      });
      if (!r.ok) throw new Error(r.status);
      form.reset(); cambiar();
      aviso('¡Hecho! Te contactaremos muy pronto.');
    } catch (err) {
      aviso('No se ha podido enviar. Prueba otra vez o escríbenos por Instagram.', true);
    } finally {
      boton.disabled = false;
    }
  });
})();
