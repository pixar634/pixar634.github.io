/* LIGHTHOUSE content pages — About/Contact/Support/Terms.
   A trimmed cousin of main.js: same brand chrome (nav, CSS beam,
   click sonar, magnetic buttons), no Lenis — these pages are
   read, not performed, so they should load fast and scroll natively. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

  /* ---------- Nav hide/show on scroll ---------- */
  var nav = document.getElementById('nav');
  if (nav) {
    var lastY = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      nav.classList.toggle('nav--shrunk', y > 40);
      if (y > 200) {
        nav.style.transform = y > lastY ? 'translateY(-140%)' : 'translateY(0)';
      } else {
        nav.style.transform = 'translateY(0)';
      }
      lastY = y;
    }, { passive: true });
  }

  /* ---------- CSS beam tracks scroll (no canvas) ---------- */
  if (!reduced) {
    window.addEventListener('scroll', function () {
      document.documentElement.style.setProperty('--beam-rot', (window.scrollY * 0.04).toFixed(2) + 'deg');
    }, { passive: true });
  }

  /* ---------- Click sonar ---------- */
  if (!reduced) {
    document.addEventListener('pointerdown', function (e) {
      var ring = document.createElement('span');
      ring.className = 'sonar-ring';
      ring.style.left = e.clientX + 'px'; ring.style.top = e.clientY + 'px';
      document.body.appendChild(ring);
      setTimeout(function () { ring.remove(); }, 750);
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduced) {
    document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
      var strength = 0.35;
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = 'translate(' + dx * strength + 'px,' + dy * strength + 'px)';
      });
      btn.addEventListener('pointerleave', function () { btn.style.transform = 'translate(0,0)'; });
    });
  }

  /* ---------- FAQ accordion (support page) ---------- */
  document.querySelectorAll('.faqitem__q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faqitem');
      var wasOpen = item.classList.contains('is-open');
      document.querySelectorAll('.faqitem.is-open').forEach(function (el) { el.classList.remove('is-open'); });
      if (!wasOpen) item.classList.add('is-open');
    });
  });

  /* ---------- Contact form ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    var btnLabel = form.querySelector('.contactform__btn-label');
    var noteIdle = form.querySelector('[data-state-idle]');
    var noteOk = form.querySelector('[data-state-ok]');
    var noteErr = form.querySelector('[data-state-err]');
    var setState = function (state) {
      noteIdle.hidden = state !== 'idle';
      noteOk.hidden = state !== 'ok';
      noteErr.hidden = state !== 'err';
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('#cName').value.trim();
      var email = form.querySelector('#cEmail').value.trim();
      var message = form.querySelector('#cMessage').value.trim();
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !message) {
        setState('err');
        noteErr.textContent = 'PLEASE FILL EVERY FIELD WITH A VALID EMAIL';
        return;
      }
      btnLabel.textContent = 'Sending…';

      if (isLocal) {
        setTimeout(function () {
          setState('ok');
          noteOk.textContent = 'DEV PREVIEW — NOT SAVED. WORKS ON THE LIVE SITE.';
          btnLabel.textContent = 'Sent ✦';
        }, 600);
        return;
      }

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, message: message })
      }).then(function (res) {
        if (!res.ok) throw new Error('bad status ' + res.status);
        return res.json();
      }).then(function () {
        setState('ok');
        btnLabel.textContent = 'Sent ✦';
        form.reset();
      }).catch(function () {
        setState('err');
        noteErr.textContent = 'COULDN’T SEND — TRY AGAIN OR EMAIL US DIRECTLY';
        btnLabel.textContent = 'Send message';
      });
    });
  }
})();
