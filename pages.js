/* LIGHTHOUSE content pages — About/Contact/Support/Terms.
   A trimmed cousin of main.js: same brand chrome (nav, particle field,
   click sonar, magnetic buttons), no Lenis/GSAP/dive — these pages are
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

  /* ---------- Full-page mouse-reactive particle field ---------- */
  var bgCanvas = document.getElementById('bg-canvas');
  if (bgCanvas && !reduced) {
    var bctx = bgCanvas.getContext('2d');
    var particles = [];
    var mouse = { x: -1000, y: -1000 };
    var lowTier = (navigator.deviceMemory && navigator.deviceMemory <= 3) || innerWidth < 400;

    function resizeBg() {
      bgCanvas.width = innerWidth;
      bgCanvas.height = innerHeight;
      seedParticles();
    }
    function Particle() {
      this.x = Math.random() * bgCanvas.width;
      this.y = Math.random() * bgCanvas.height;
      this.size = Math.random() * 1.5 + 0.5;
      this.baseX = this.x; this.baseY = this.y;
      this.density = Math.random() * 30 + 1;
      this.opacity = Math.random() * 0.5 + 0.15;
      this.isAccent = Math.random() > 0.95;
      this.driftX = (Math.random() - 0.5) * 0.4;
      this.driftY = (Math.random() - 0.5) * 0.4;
    }
    Particle.prototype.draw = function () {
      bctx.fillStyle = this.isAccent ? 'rgba(93,202,165,' + this.opacity + ')' : 'rgba(255,255,255,' + this.opacity + ')';
      bctx.beginPath(); bctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); bctx.fill();
    };
    Particle.prototype.update = function () {
      this.baseX += this.driftX; this.baseY += this.driftY;
      if (this.baseX > bgCanvas.width) this.baseX = 0; if (this.baseX < 0) this.baseX = bgCanvas.width;
      if (this.baseY > bgCanvas.height) this.baseY = 0; if (this.baseY < 0) this.baseY = bgCanvas.height;
      var dx = mouse.x - this.x, dy = mouse.y - this.y;
      var dist = Math.sqrt(dx * dx + dy * dy), maxDist = 150;
      if (dist < maxDist) {
        var force = (maxDist - dist) / maxDist;
        var fx = (dx / dist) * force * this.density, fy = (dy / dist) * force * this.density;
        this.x -= isNaN(fx) ? 0 : fx; this.y -= isNaN(fy) ? 0 : fy;
      } else {
        this.x -= (this.x - this.baseX) / 20; this.y -= (this.y - this.baseY) / 20;
      }
      this.draw();
    };
    function seedParticles() {
      particles = [];
      var count = Math.min((bgCanvas.width * bgCanvas.height) / 8000, lowTier ? 60 : 260);
      for (var i = 0; i < count; i++) particles.push(new Particle());
    }
    function animateBg() {
      bctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      for (var i = 0; i < particles.length; i++) particles[i].update();
      requestAnimationFrame(animateBg);
    }
    document.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
    document.addEventListener('mouseleave', function () { mouse.x = -1000; mouse.y = -1000; });
    resizeBg(); animateBg();
    window.addEventListener('resize', resizeBg);
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
