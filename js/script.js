// Archivo: script.js - JS de ejemplo: menú móvil, fecha automática y validación simple
document.addEventListener('DOMContentLoaded', function () {
  // Actualizar año en el footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Toggle del menú móvil
  const navToggle = document.querySelector('.nav-toggle');
  const primaryNav = document.getElementById('primary-nav');
  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', function () {
      const expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', String(!expanded));
      // Usamos aria-hidden en nav para manejar visibilidad en CSS
      primaryNav.setAttribute('aria-hidden', String(expanded));
    });
    // Asegurar estado inicial
    primaryNav.setAttribute('aria-hidden', 'true');
  }

  // Validación simple del formulario de contacto
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = form.querySelector('#name');
      const email = form.querySelector('#email');
      if (!name.value.trim()) {
        alert('Por favor, escribe tu nombre.');
        name.focus();
        return;
      }
      if (!email.value.includes('@')) {
        alert('Por favor, escribe un email válido.');
        email.focus();
        return;
      }
      // Aquí normalmente enviarías los datos al servidor
      alert('Gracias, el formulario ha sido enviado (simulado).');
      form.reset();
    });
  }
  
  // Manejo de la visualización dinámica del valor de belleza
  (function () {
    const regForm = document.getElementById('register-form');
    if (!regForm) return;
    const bellezaInput = regForm.querySelector('#r-belleza');
    if (!bellezaInput) return;

    // Crear contenedor si no existe
    let bellezaMsg = document.getElementById('belleza-msg');
    if (!bellezaMsg) {
      bellezaMsg = document.createElement('div');
      bellezaMsg.id = 'belleza-msg';
      bellezaMsg.className = 'muted';
      bellezaMsg.setAttribute('aria-live', 'polite');
      bellezaMsg.style.marginTop = '.25rem';
      bellezaMsg.style.color = '#ededed';
      bellezaInput.insertAdjacentElement('afterend', bellezaMsg);
    }

    function updateBellezaMessage(val) {
      const n = Number(val);
      let msg = '';
      if (!Number.isFinite(n) || n < 0) {
        msg = '';
      } else if (n <= 2) {
        msg = 'Feísimo';
      } else if (n >= 3 && n <= 5) {
        msg = 'No me sangran los ojos al mirarme al espejo';
      } else if (n >= 6 && n <= 7) {
        msg = 'Aceptable';
      } else if (n >= 8 && n <= 9) {
        msg = 'Soy un bellezón';
      } else if (n === 10) {
        msg = 'No hay nadie más guapo que yo.';
      } else {
        msg = '';
      }
      bellezaMsg.textContent = msg;
    }

    bellezaInput.addEventListener('input', function (e) { updateBellezaMessage(e.target.value); });
    // inicializar
    updateBellezaMessage(bellezaInput.value);
  })();

});

  // Registro de usuario: envío al backend
  const regForm = document.getElementById('register-form');
  if (regForm) {
    const bellezaInput = regForm.querySelector('#r-belleza');
    const bellezaValue = document.getElementById('belleza-value');
    if (bellezaInput && bellezaValue) {
      bellezaInput.addEventListener('input', function () { bellezaValue.textContent = this.value; });
    }

    regForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const feedback = document.getElementById('register-feedback');
      const data = {
        nombre: regForm.nombre.value.trim(),
        edad: parseInt(regForm.edad.value, 10) || null,
        sexo: regForm.sexo.value || null,
        sexualidad: regForm.sexualidad.value || null,
        altura: regForm.altura.value ? parseFloat(regForm.altura.value) : null,
        belleza: regForm.belleza.value ? parseInt(regForm.belleza.value, 10) : null,
        estudios: regForm.estudios.value.trim() || null
      };

      // Validaciones básicas
      if (!data.nombre) { feedback.textContent = 'El nombre es obligatorio.'; regForm.nombre.focus(); return; }
      if (data.edad !== null && (data.edad < 0 || data.edad > 150)) { feedback.textContent = 'Edad inválida.'; regForm.edad.focus(); return; }

      feedback.textContent = 'Registrando...';
      try {
        const resp = await fetch('/api/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        if (!resp.ok) throw new Error('Error en el servidor');
        const result = await resp.json();
        feedback.textContent = result.message || 'Registro completado.';
        regForm.reset();
        if (bellezaValue) bellezaValue.textContent = '5';
      } catch (err) {
        console.error(err);
        feedback.textContent = 'No se pudo registrar. Intenta más tarde.';
      }
    });
  }
