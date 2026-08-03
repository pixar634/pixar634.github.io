/* LIGHTHOUSE landing — Lenis + GSAP/ScrollTrigger scroll engine,
   particle field, parallax tilt, scroll-jacked dive, scout autoplay demo. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  var scrollProgress = 0;
  var nav = document.getElementById('nav');
  var lenis = null;

  /* ---------- 1. Lenis smooth scroll + nav hide/show ---------- */
  function initScroll() {
    if (reduced || typeof window.Lenis === 'undefined') {
      // native scroll — still track progress for the beacon beam + nav shrink
      window.addEventListener('scroll', function () {
        var limit = document.documentElement.scrollHeight - innerHeight;
        scrollProgress = limit > 0 ? clamp(scrollY / limit, 0, 1) : 0;
        if (nav) nav.classList.toggle('nav--shrunk', scrollY > 40);
      }, { passive: true });
      return;
    }

    lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smooth: true,
      touchMultiplier: 1.5
    });

    if (hasGSAP) {
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }

    lenis.on('scroll', function (e) {
      if (hasGSAP) ScrollTrigger.update();
      scrollProgress = e.limit > 0 ? clamp(e.scroll / e.limit, 0, 1) : 0;
      if (nav) {
        nav.classList.toggle('nav--shrunk', e.scroll > 40);
        if (e.scroll > 200) {
          nav.style.transform = e.direction === 1 ? 'translateY(-140%)' : 'translateY(0)';
        } else {
          nav.style.transform = 'translateY(0)';
        }
      }
    });
  }
  initScroll();

  document.querySelectorAll('[data-scrollto]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      if (lenis) lenis.scrollTo(target, { offset: -140 });
      else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (a.getAttribute('href') === '#join') {
        var input = document.getElementById('email');
        if (input) setTimeout(function () { input.focus({ preventScroll: true }); }, 900);
      }
    });
  });

  /* ---------- 2. Hero entrance — a cinematic cascade instead of one flat
     fade-up: the eyebrow leads, then each headline gets pulled up out of
     its own mask (the .split-line/.split-line__inner pairing exists for
     exactly this — overflow:hidden on the outer span, the text sliding up
     from below on the inner one), then the rest of the copy rises in with
     enough overlap to read as one continuous motion, not five separate
     ones. ---------- */
  if (hasGSAP && !reduced) {
    var heroTl = gsap.timeline();
    heroTl
      .fromTo('.hero__eyebrow', { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' })
      .set('.hero__title', { opacity: 1 })
      .fromTo('.split-line__inner', { yPercent: 112 }, { yPercent: 0, duration: 1.15, stagger: 0.14, ease: 'power4.out' }, '<0.15')
      .fromTo('.hero__sub, .hero__usps, .waitlist, .hero__visual',
        { y: 26, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: 'power3.out' },
        '-=0.75');
  } else {
    document.querySelectorAll('.reveal-up').forEach(function (el) { el.style.opacity = 1; });
  }

  // shared with the beacon (section 4) so background dust can react to the
  // sweeping beam even though the two live on separate canvases
  var beacon = { x: 0, y: 0, angle: -Math.PI / 3, spread: 0.16, len: 0, active: false };

  /* ---------- 3. Full-page mouse-reactive particle field ---------- */
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
      this.baseX = this.x;
      this.baseY = this.y;
      this.density = Math.random() * 30 + 1;
      this.opacity = Math.random() * 0.5 + 0.15;
      this.isAccent = Math.random() > 0.95;
      // "location" motes — dormant dust that lights up green-neon the instant
      // the rotating beacon beam sweeps across them, like a radar pass
      // revealing a hidden viewpoint, then fades as an afterglow
      this.isLocation = !lowTier && Math.random() > 0.88;
      this.glow = 0;
      this.driftX = (Math.random() - 0.5) * 0.4;
      this.driftY = (Math.random() - 0.5) * 0.4;
    }
    Particle.prototype.draw = function (now) {
      if (this.isLocation) { this.drawLocation(now); return; }
      bctx.fillStyle = this.isAccent ? 'rgba(93,202,165,' + this.opacity + ')' : 'rgba(255,255,255,' + this.opacity + ')';
      bctx.beginPath();
      bctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      bctx.fill();
    };
    Particle.prototype.drawLocation = function () {
      var inBeam = false;
      if (beacon.active && scrollProgress < 0.12) {
        var dx = this.x - beacon.x, dy = this.y - beacon.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < beacon.len * 0.6) {
          var ang = Math.atan2(dy, dx);
          var diff = Math.atan2(Math.sin(ang - beacon.angle), Math.cos(ang - beacon.angle));
          inBeam = Math.abs(diff) < beacon.spread * 1.3;
        }
      }
      // fast catch-light as the beam sweeps on, slow phosphor-style afterglow
      // as it sweeps past — traces a comet tail of neon around the rotation
      this.glow += inBeam ? (1 - this.glow) * 0.45 : -this.glow * 0.07;

      var base = this.opacity * 0.6;
      if (this.glow < 0.03) {
        bctx.fillStyle = 'rgba(93,202,165,' + base.toFixed(3) + ')';
        bctx.beginPath();
        bctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        bctx.fill();
        return;
      }
      var lit = this.glow;
      var r = this.size + lit * 1.6;
      bctx.beginPath();
      bctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      bctx.fillStyle = 'rgba(93,202,165,' + Math.min(1, base + lit).toFixed(3) + ')';
      bctx.shadowColor = 'rgba(93,202,165,0.9)';
      bctx.shadowBlur = 12 * lit;
      bctx.fill();
      bctx.shadowBlur = 0;
      if (lit > 0.25) {
        bctx.beginPath();
        bctx.arc(this.x, this.y, r + lit * 9, 0, Math.PI * 2);
        bctx.strokeStyle = 'rgba(93,202,165,' + (lit * 0.5).toFixed(3) + ')';
        bctx.lineWidth = 1;
        bctx.stroke();
      }
    };
    Particle.prototype.update = function (now) {
      this.baseX += this.driftX; this.baseY += this.driftY;
      if (this.baseX > bgCanvas.width) this.baseX = 0;
      if (this.baseX < 0) this.baseX = bgCanvas.width;
      if (this.baseY > bgCanvas.height) this.baseY = 0;
      if (this.baseY < 0) this.baseY = bgCanvas.height;

      var dx = mouse.x - this.x, dy = mouse.y - this.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var maxDist = 150;
      if (dist < maxDist) {
        var force = (maxDist - dist) / maxDist;
        var fx = (dx / dist) * force * this.density;
        var fy = (dy / dist) * force * this.density;
        this.x -= isNaN(fx) ? 0 : fx;
        this.y -= isNaN(fy) ? 0 : fy;
      } else {
        this.x -= (this.x - this.baseX) / 20;
        this.y -= (this.y - this.baseY) / 20;
      }
      this.draw(now);
    };

    function seedParticles() {
      particles = [];
      var count = (bgCanvas.width * bgCanvas.height) / 8000;
      count = Math.min(count, lowTier ? 60 : 260);
      for (var i = 0; i < count; i++) particles.push(new Particle());
    }

    function animateBg(now) {
      bctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      for (var i = 0; i < particles.length; i++) particles[i].update(now);
      requestAnimationFrame(animateBg);
    }

    document.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
    document.addEventListener('mouseleave', function () { mouse.x = -1000; mouse.y = -1000; });

    resizeBg();
    requestAnimationFrame(animateBg);
    window.addEventListener('resize', resizeBg);
  }

  /* ---------- 4. The beacon — beam sweep + ambient sonar (hero only) ---------- */
  var canvas = document.getElementById('beacon');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 1.75);
    var W = 0, H = 0, rings = [], lastRing = 0;
    var beamAngle = -Math.PI / 3;
    var running = true;

    // continuous 360° rotation, but the tower sits near the frame's corner
    // (bx=0.82W, by=0.94H) so only the up-and-left quarter of the circle
    // (-180°..-90°) actually travels far enough across the canvas to read as
    // a sweep — the rest just hugs the corner, unseen. So the rotation isn't
    // constant-speed: it sweeps that visible quarter slowly and deliberately
    // (and starts there immediately at load, so the first thing a visitor
    // sees is the beam crossing the screen), then whips through the hidden
    // three-quarters quickly to come back around.
    var SWEEP_FROM = -Math.PI, SWEEP_TO = -Math.PI / 2;
    var SWEEP_MS = 5000, REST_MS = 4000, CYCLE_MS = SWEEP_MS + REST_MS;

    // no map grid — just a handful of fixed beacons, dormant until the
    // rotating beam sweeps across them. Each one flares mint and rings once
    // caught, then fades on a slow phosphor-style afterglow: one clean sweep,
    // a few lights waking up as it passes.
    var MAP_MARKERS = [
      { x: 0.18, y: 0.34, glow: 0 }, { x: 0.42, y: 0.56, glow: 0 }, { x: 0.63, y: 0.24, glow: 0 },
      { x: 0.30, y: 0.74, glow: 0 }, { x: 0.53, y: 0.68, glow: 0 }, { x: 0.74, y: 0.42, glow: 0 }
    ];
    var drawBeacons = function (t, bx, by, angle, spread, len) {
      for (var i = 0; i < MAP_MARKERS.length; i++) {
        var m = MAP_MARKERS[i];
        var mx = m.x * W, my = m.y * H;
        var dx = mx - bx, dy = my - by;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var inBeam = false;
        if (dist < len * 0.6) {
          var ang = Math.atan2(dy, dx);
          var diff = Math.atan2(Math.sin(ang - angle), Math.cos(ang - angle));
          inBeam = Math.abs(diff) < spread * 1.3;
        }
        m.glow += inBeam ? (1 - m.glow) * 0.45 : -m.glow * 0.05;

        var idle = 0.3 + 0.15 * Math.sin(t / 1500 + i * 1.7);
        var lit = Math.max(idle, m.glow);
        var r = 2 + lit * 2.5;
        ctx.beginPath();
        ctx.arc(mx, my, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(93,202,165,' + Math.min(1, 0.3 + lit * 0.7).toFixed(3) + ')';
        ctx.shadowColor = 'rgba(93,202,165,0.9)';
        ctx.shadowBlur = 6 + lit * 14;
        ctx.fill();
        ctx.shadowBlur = 0;
        if (m.glow > 0.3) {
          ctx.beginPath();
          ctx.arc(mx, my, r + m.glow * 10, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(93,202,165,' + (m.glow * 0.5).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    };

    // the beam has to originate from *something* — on tablet/mobile that's
    // the pin glowing on the phone's own mini-map (the beacon IS that pin,
    // its light spilling out into the night); on desktop there's no phone to
    // anchor to, so it holds the old corner placement as ambient light
    var originX = 0, originY = 0;
    var heroVisualEl = document.querySelector('.hero__visual');
    var heroScreenEl = document.getElementById('heroScreen');
    var updateOrigin = function () {
      var visualShown = heroVisualEl && getComputedStyle(heroVisualEl).display !== 'none';
      if (visualShown && heroScreenEl) {
        var pr = heroScreenEl.getBoundingClientRect();
        var cr = canvas.getBoundingClientRect();
        originX = pr.left - cr.left + pr.width * 0.55;
        originY = pr.top - cr.top + pr.height * 0.42;
      } else {
        originX = W * 0.82;
        originY = H * 0.94;
      }
    };

    var sizeCanvas = function () {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      updateOrigin();
    };
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);
    window.addEventListener('load', updateOrigin); // fonts/images can shift layout after first paint

    var frame = function (t) {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      var bx = originX, by = originY;

      var phase = t % CYCLE_MS;
      if (phase < SWEEP_MS) {
        var sp = phase / SWEEP_MS;
        var eased = sp < 0.5 ? 2 * sp * sp : 1 - Math.pow(-2 * sp + 2, 2) / 2;
        beamAngle = SWEEP_FROM + eased * (SWEEP_TO - SWEEP_FROM);
      } else {
        var rp = (phase - SWEEP_MS) / REST_MS;
        beamAngle = SWEEP_TO + rp * (Math.PI * 2 - (SWEEP_TO - SWEEP_FROM));
      }
      var len = Math.max(W, H) * 1.4, spread = 0.16;
      beacon.x = bx; beacon.y = by; beacon.angle = beamAngle; beacon.spread = spread; beacon.len = len; beacon.active = true;

      drawBeacons(t, bx, by, beamAngle, spread, len);

      if (t - lastRing > 4500) { rings.push({ r: 10, a: 0.5 }); lastRing = t; }
      rings = rings.filter(function (rg) { return rg.a > 0.01; });
      rings.forEach(function (rg) {
        rg.r += 1.8; rg.a *= 0.985;
        ctx.beginPath();
        ctx.arc(bx, by, rg.r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(93,202,165,' + rg.a.toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      var g = ctx.createRadialGradient(bx, by, 0, bx, by, len);
      g.addColorStop(0, 'rgba(93,202,165,0.20)');
      g.addColorStop(0.4, 'rgba(93,202,165,0.07)');
      g.addColorStop(1, 'rgba(93,202,165,0)');
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.arc(bx, by, len, beamAngle - spread, beamAngle + spread);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#5DCAA5';
      ctx.shadowColor = 'rgba(93,202,165,0.9)'; ctx.shadowBlur = 18;
      ctx.fill();
      ctx.shadowBlur = 0;

      requestAnimationFrame(frame);
    };

    if (reduced) {
      requestAnimationFrame(function (t) { running = true; frame(t); running = false; });
    } else {
      requestAnimationFrame(frame);
      document.addEventListener('visibilitychange', function () {
        running = !document.hidden;
        if (running) requestAnimationFrame(frame);
      });
    }
  }

  /* ---------- 4b. Hero screen — the phone-in-hand mockup narrates the USP:
     a reel becomes a pin, a route, a plan. Same story as the dive section's
     first scene, just compressed into the small screen behind the hand. ---------- */
  var heroScreen = document.getElementById('heroScreen');
  if (heroScreen) {
    var heroPin = document.getElementById('heroScreenPin');
    var heroLabel = document.getElementById('heroScreenLabel');
    var heroRoutePath = document.getElementById('heroRoutePath');
    var heroBar = document.getElementById('heroScreenBar');
    var heroBarFill = heroBar ? heroBar.querySelector('i') : null;
    var HERO_ORIGIN = { x: 14, y: 86 };
    var HERO_DESTINATIONS = [
      { name: 'Dudhsagar Falls', x: 55, y: 45 },
      { name: 'Nandi Hills', x: 30, y: 65 },
      { name: 'Coorg', x: 68, y: 30 }
    ];
    var heroDestIndex = 0;
    var heroTimers = [];
    var heroClear = function () { heroTimers.forEach(clearTimeout); heroTimers = []; };
    var heroAfter = function (ms, fn) { heroTimers.push(setTimeout(fn, ms)); };

    var setHeroLabel = function (text) {
      heroLabel.classList.add('is-fading');
      heroAfter(220, function () {
        heroLabel.textContent = text;
        heroLabel.classList.remove('is-fading');
      });
    };

    var showHeroBar = function () {
      if (!heroBar) return;
      heroBarFill.style.transition = 'none';
      heroBarFill.style.width = '0%';
      heroBar.classList.add('is-visible');
      heroBar.getBoundingClientRect(); // force reflow so the fill transition below animates
      heroBarFill.style.transition = 'width 1.4s linear';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { heroBarFill.style.width = '100%'; });
      });
    };
    var hideHeroBar = function () {
      if (heroBar) heroBar.classList.remove('is-visible');
    };

    var drawHeroRoute = function (dest) {
      var mx = (HERO_ORIGIN.x + dest.x) / 2 + 8, my = (HERO_ORIGIN.y + dest.y) / 2;
      heroRoutePath.setAttribute('d', 'M' + HERO_ORIGIN.x + ',' + HERO_ORIGIN.y + ' Q' + mx + ',' + my + ' ' + dest.x + ',' + dest.y);
      var len = heroRoutePath.getTotalLength();
      heroRoutePath.style.transition = 'none';
      heroRoutePath.style.strokeDasharray = len;
      heroRoutePath.style.strokeDashoffset = len;
      heroRoutePath.getBoundingClientRect(); // force reflow so the transition below actually animates
      heroRoutePath.style.transition = 'stroke-dashoffset 1.3s var(--transition-fluid)';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { heroRoutePath.style.strokeDashoffset = 0; });
      });
    };

    var resetHeroRoute = function () {
      heroRoutePath.style.transition = 'none';
      heroRoutePath.removeAttribute('d');
      heroRoutePath.style.strokeDasharray = '';
      heroRoutePath.style.strokeDashoffset = '';
    };

    var playHeroSequence = function () {
      heroClear();
      var dest = HERO_DESTINATIONS[heroDestIndex];
      heroPin.classList.add('is-hidden');
      hideHeroBar();
      resetHeroRoute(); // blank the previous loop's line before starting fresh

      setHeroLabel('Reel saved ✦');
      heroAfter(1600, function () {
        setHeroLabel('Finding the spot…');
        showHeroBar();
        heroAfter(1700, function () {
          hideHeroBar();
          heroPin.style.left = dest.x + '%';
          heroPin.style.top = dest.y + '%';
          heroPin.classList.remove('is-hidden');
          setHeroLabel(dest.name + ' found');
          heroAfter(1600, function () {
            setHeroLabel('Mapping your route…');
            drawHeroRoute(dest);
            heroAfter(1900, function () {
              setHeroLabel('Trip planned ✦');
              heroAfter(2600, function () {
                heroDestIndex = (heroDestIndex + 1) % HERO_DESTINATIONS.length;
                playHeroSequence();
              });
            });
          });
        });
      });
    };

    if (reduced) {
      // still frame: skip straight to the payoff state, no cycling
      var stillDest = HERO_DESTINATIONS[0];
      heroPin.style.left = stillDest.x + '%';
      heroPin.style.top = stillDest.y + '%';
      heroPin.classList.remove('is-hidden');
      heroLabel.textContent = 'Trip planned ✦';
      var mx2 = (HERO_ORIGIN.x + stillDest.x) / 2 + 8, my2 = (HERO_ORIGIN.y + stillDest.y) / 2;
      heroRoutePath.setAttribute('d', 'M' + HERO_ORIGIN.x + ',' + HERO_ORIGIN.y + ' Q' + mx2 + ',' + my2 + ' ' + stillDest.x + ',' + stillDest.y);
    } else {
      playHeroSequence();
    }
  }

  /* ---------- 4c. Explore demo — tap a category, the map fills with those
     pins. Mirrors the real app's FilterPill/MapContainer: per-category
     accent colors (not the single brand mint, since this is a portrait of
     actual in-app UI), dark-cored pins with a colored ring + glow, and the
     same reveal timing as the real filter-pill dropdown (0.22s, 0.03s
     stagger, power2.out). ---------- */
  var explorePillsEl = document.getElementById('explorePills');
  var exploreMapEl = document.getElementById('exploreMap');
  var exploreCountEl = document.getElementById('exploreCount');
  if (explorePillsEl && exploreMapEl && exploreCountEl) {
    // same category words as the marquee ticker above, so the payoff is
    // legible — each one traces back to something the visitor just read
    var EXPLORE_CATS = [
      { name: 'Waterfalls', accent: '#7FE3D6', count: 14 },
      { name: 'Sunrise Drives', accent: '#E0A458', count: 31 },
      { name: 'Monsoon Treks', accent: '#8FA6C4', count: 22 },
      { name: 'Fort Loops', accent: '#D8B15E', count: 12 },
      { name: 'Lakeside Coffee', accent: '#4FB0C6', count: 9 },
      { name: 'Hidden Viewpoints', accent: '#5DCAA5', count: 18 }
    ];
    var EXPLORE_PINS = [
      { cat: 0, x: 22, y: 28 }, { cat: 0, x: 60, y: 62 },
      { cat: 1, x: 48, y: 46 }, { cat: 1, x: 80, y: 68 },
      { cat: 2, x: 38, y: 18 }, { cat: 2, x: 70, y: 44 },
      { cat: 3, x: 34, y: 42 }, { cat: 3, x: 58, y: 78 },
      { cat: 4, x: 62, y: 26 }, { cat: 4, x: 18, y: 56 },
      { cat: 5, x: 28, y: 72 }, { cat: 5, x: 78, y: 20 }
    ];
    var hexToRgba = function (hex, a) {
      var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    };

    // careful: this whole file is one shared function scope (no modules), so
    // these names are prefixed to avoid colliding with other sections' vars
    // (a plain `pinEls` here once silently aliased the Collections carousel's
    // own `pinEls` a few hundred lines down, since `var` doesn't block-scope)
    var explorePillEls = EXPLORE_CATS.map(function (cat) {
      var el = document.createElement('em');
      el.className = 'xpill';
      el.textContent = cat.name;
      el.style.setProperty('--accent', cat.accent);
      el.style.setProperty('--accent-glow', hexToRgba(cat.accent, 0.35));
      explorePillsEl.appendChild(el);
      return el;
    });
    var explorePinEls = EXPLORE_PINS.map(function (p) {
      var cat = EXPLORE_CATS[p.cat];
      var el = document.createElement('span');
      el.className = 'xpin';
      el.style.setProperty('--x', p.x + '%');
      el.style.setProperty('--y', p.y + '%');
      el.style.setProperty('--accent', cat.accent);
      el.innerHTML = '<i class="xpin__glow"></i><i class="xpin__core"></i>';
      exploreMapEl.appendChild(el);
      return { el: el, cat: p.cat };
    });

    var showExploreCategory = function (idx) {
      explorePillEls.forEach(function (el, i) { el.classList.toggle('is-active', i === idx); });
      exploreCountEl.textContent = EXPLORE_CATS[idx].count + ' PLACES IN RANGE';
      var shown = [], hidden = [];
      explorePinEls.forEach(function (p) { (p.cat === idx ? shown : hidden).push(p.el); });
      if (hasGSAP) {
        if (hidden.length) gsap.to(hidden, { opacity: 0, scale: 0.6, duration: 0.2, ease: 'power1.in' });
        gsap.fromTo(shown, { opacity: 0, y: 10, scale: 0.92 },
          { opacity: 1, y: 0, scale: 1, duration: 0.22, stagger: 0.03, ease: 'power2.out', delay: 0.15 });
      } else {
        hidden.forEach(function (p) { p.style.opacity = 0; });
        shown.forEach(function (p) { p.style.opacity = 1; });
      }
    };

    showExploreCategory(0);
    if (!reduced) {
      var exploreIndex = 0;
      setInterval(function () {
        exploreIndex = (exploreIndex + 1) % EXPLORE_CATS.length;
        showExploreCategory(exploreIndex);
      }, 2600);
    }
  }

  /* ---------- 5. Click sonar ---------- */
  if (!reduced) {
    document.addEventListener('pointerdown', function (e) {
      var ring = document.createElement('span');
      ring.className = 'sonar-ring';
      ring.style.left = e.clientX + 'px';
      ring.style.top = e.clientY + 'px';
      document.body.appendChild(ring);
      setTimeout(function () { ring.remove(); }, 750);
    });
  }

  /* ---------- 6. Magnetic buttons ---------- */
  if (finePointer && !reduced) {
    document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
      var strength = 0.35;
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = 'translate(' + dx * strength + 'px,' + dy * strength + 'px)';
      });
      btn.addEventListener('pointerleave', function () { btn.style.transform = 'translate(0,0)'; });
    });
  }

  /* ---------- 7. Page-wide parallax tilt — mouse + touch + gyroscope ---------- */
  if (!reduced) {
    var mockups = document.querySelectorAll('.parallax-mockup');
    var isGyroActive = false, baseBeta = null;

    var updateParallax = function (x, y) {
      mockups.forEach(function (m) {
        if (hasGSAP) {
          gsap.to(m, { rotateY: x, rotateX: y, duration: isGyroActive ? 0.3 : 0.8, ease: 'power2.out', transformPerspective: 1000 });
        } else {
          m.style.transform = 'perspective(1000px) rotateY(' + x + 'deg) rotateX(' + y + 'deg)';
        }
      });
    };

    if (mockups.length) {
      document.addEventListener('mousemove', function (e) {
        if (isGyroActive || !finePointer) return;
        var x = (e.clientX / innerWidth - 0.5) * 20;
        var y = (e.clientY / innerHeight - 0.5) * -20;
        updateParallax(x, y);
      });
      document.addEventListener('touchmove', function (e) {
        if (isGyroActive || !e.touches[0]) return;
        var t = e.touches[0];
        var x = (t.clientX / innerWidth - 0.5) * 25;
        var y = (t.clientY / innerHeight - 0.5) * -25;
        updateParallax(x, y);
      }, { passive: true });

      if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', function (e) {
          if (e.beta == null || e.gamma == null) return;
          isGyroActive = true;
          if (baseBeta === null) baseBeta = e.beta;
          var betaDiff = e.beta - baseBeta;
          var tiltX = Math.max(-25, Math.min(25, betaDiff));
          var tiltY = Math.max(-25, Math.min(25, e.gamma));
          updateParallax(tiltY, -tiltX);
        });
      }
    }
  }

  /* ---------- 7b. Scene 1's inner walkthrough — reel → share → result ----------
     Autoplays only while dive scene 0 is the one in front of the camera. */
  var revSteps = Array.prototype.slice.call(document.querySelectorAll('#scene1Screen .revstep'));
  var reelShareBtn = document.getElementById('reelShareBtn');
  var importStatus = document.getElementById('importStatus');
  var importBar = document.getElementById('importBar');
  var revTimers = [];
  var revClear = function () { revTimers.forEach(clearTimeout); revTimers = []; };
  var revAfter = function (ms, fn) { revTimers.push(setTimeout(fn, ms)); };

  var setRevStep = function (i) {
    revSteps.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
  };

  var playRevSequence = function () {
    if (!revSteps.length) return;
    revClear();
    setRevStep(0);
    if (reelShareBtn) reelShareBtn.classList.remove('is-tapped');
    if (importBar) importBar.style.width = '0%';
    if (importStatus) importStatus.textContent = 'DETECTING LINK…';

    revAfter(1800, function () {
      if (reelShareBtn) reelShareBtn.classList.add('is-tapped');
      revAfter(320, function () {
        setRevStep(1);
        revAfter(200, function () {
          if (importBar) importBar.style.width = '45%';
          if (importStatus) importStatus.textContent = 'READING CAPTION…';
        });
        revAfter(1000, function () {
          if (importBar) importBar.style.width = '100%';
          if (importStatus) importStatus.textContent = 'MATCHED: DUDHSAGAR FALLS ✦';
        });
        revAfter(1700, function () {
          setRevStep(2);
          if (hasGSAP) {
            gsap.fromTo(revSteps[2].querySelectorAll('.m-anim-elem'),
              { y: 20, opacity: 0, scale: 0.95 },
              { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.08, ease: 'back.out(1.2)' });
            // the route draws itself onto the map — from Bengaluru, through
            // Sakleshpur, to the falls — instead of just fading in whole
            var routePath = document.getElementById('revRoutePath');
            if (routePath) {
              var routeLen = routePath.getTotalLength();
              gsap.set(routePath, { strokeDasharray: routeLen, strokeDashoffset: routeLen });
              gsap.to(routePath, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', delay: 0.35 });
            }
          }
          revAfter(4200, playRevSequence);
        });
      });
    });
  };

  var stopRevSequence = function () { revClear(); };

  /* ---------- 7c. Scene 2's inner walkthrough — shortlist → group → invite → poll ---------- */
  var voteSteps = Array.prototype.slice.call(document.querySelectorAll('#scene2Screen .revstep'));
  var shortCards = Array.prototype.slice.call(document.querySelectorAll('#shortGrid .shortcard'));
  var groupTitleTyped = document.getElementById('groupTitleTyped');
  var groupAvatars = Array.prototype.slice.call(document.querySelectorAll('#groupAvatars b'));
  var inviteStatus = document.getElementById('inviteStatus');
  var inviteAvatars = Array.prototype.slice.call(document.querySelectorAll('#inviteAvatars b'));
  var voteTimers = [];
  var voteClear = function () { voteTimers.forEach(clearTimeout); voteTimers = []; };
  var voteAfter = function (ms, fn) { voteTimers.push(setTimeout(fn, ms)); };

  var setVoteStep = function (i) {
    voteSteps.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
  };

  var playVoteSequence = function () {
    if (!voteSteps.length) return;
    voteClear();

    // step 0 — shortlist
    setVoteStep(0);
    shortCards.forEach(function (c) { c.classList.remove('is-picked'); });
    [500, 950, 1200, 1450].forEach(function (delay, idx) {
      voteAfter(delay, function () { if (shortCards[idx]) shortCards[idx].classList.add('is-picked'); });
    });

    voteAfter(2600, function () {
      // step 1 — create group
      setVoteStep(1);
      groupTitleTyped.textContent = '';
      groupAvatars.forEach(function (b) { b.classList.remove('is-added'); });
      var title = 'Weekend in Coorg?';
      var ci = 0;
      var typeTitle = function () {
        if (ci > title.length) return;
        groupTitleTyped.textContent = title.slice(0, ci);
        ci++;
        voteAfter(42, typeTitle);
      };
      typeTitle();
      groupAvatars.forEach(function (b, idx) {
        voteAfter(850 + idx * 150, function () { b.classList.add('is-added'); });
      });

      voteAfter(2400, function () {
        // step 2 — send invite
        setVoteStep(2);
        inviteStatus.textContent = 'SENDING TO 5 FRIENDS…';
        inviteAvatars.forEach(function (b) { b.classList.remove('is-sent'); });
        inviteAvatars.forEach(function (b, idx) {
          voteAfter(300 + idx * 200, function () {
            b.classList.add('is-sent');
            if (idx === inviteAvatars.length - 1) inviteStatus.textContent = 'ALL INVITED ✦ WAITING FOR VOTES…';
          });
        });

        voteAfter(2500, function () {
          // step 3 — the live poll
          setVoteStep(3);
          var resultStep = voteSteps[3];
          gsap.fromTo(resultStep.querySelectorAll('.m-anim-elem'),
            { y: 20, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.09, ease: 'back.out(1.2)' });
          var resultTallies = resultStep.querySelectorAll('.tally i');
          if (resultTallies.length) {
            gsap.fromTo(resultTallies, { scaleX: 0 }, { scaleX: 1, duration: 0.9, stagger: 0.15, ease: 'power3.out', delay: 0.4 });
          }

          voteAfter(4200, playVoteSequence);
        });
      });
    });
  };

  var stopVoteSequence = function () { voteClear(); };

  /* ---------- 8. THE DIVE — GSAP ScrollTrigger scene stepper ---------- */
  var diveDot = document.getElementById('diveDot');
  if (hasGSAP && !reduced) {
    var scenes = Array.prototype.slice.call(document.querySelectorAll('.dive__scene'));
    var numScenes = scenes.length;
    var lastIndex = -1;

    if (numScenes) {
      ScrollTrigger.create({
        trigger: '#diveRunway',
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: function (self) {
          var progress = self.progress;
          if (diveDot) diveDot.style.top = (progress * 100).toFixed(2) + '%';

          var activeIndex = Math.floor(progress * numScenes);
          if (activeIndex === numScenes) activeIndex = numScenes - 1;
          if (activeIndex === lastIndex) return;

          scenes.forEach(function (scene, i) {
            var tallies = scene.querySelectorAll('.tally i');
            if (i === activeIndex) {
              scene.classList.add('is-active');
              gsap.to(scene, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
              gsap.fromTo(scene.querySelectorAll('.m-anim-elem'),
                { y: 25, opacity: 0, scale: 0.95 },
                { y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.1, ease: 'back.out(1.2)' });
              if (tallies.length) {
                gsap.fromTo(tallies, { scaleX: 0 }, { scaleX: 1, duration: 1, stagger: 0.2, ease: 'power3.out', delay: 0.5 });
              }
              if (i === 0) playRevSequence();
              if (i === 1) playVoteSequence();
            } else if (scene.classList.contains('is-active')) {
              scene.classList.remove('is-active');
              var yOffset = i < activeIndex ? -40 : 40;
              gsap.to(scene, { opacity: 0, y: yOffset, duration: 0.6, ease: 'power3.out' });
              gsap.to(scene.querySelectorAll('.m-anim-elem'), { opacity: 0, scale: 0.95, duration: 0.3 });
              if (tallies.length) gsap.to(tallies, { scaleX: 0, duration: 0.3 });
              if (i === 0) stopRevSequence();
              if (i === 1) stopVoteSequence();
            }
          });
          lastIndex = activeIndex;
        }
      });

      scenes.forEach(function (s, i) { gsap.set(s, i === 0 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }); });
      scenes[0].classList.add('is-active');
      playRevSequence();
      gsap.fromTo(scenes[0].querySelectorAll('.m-anim-elem'),
        { y: 25, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.1, ease: 'back.out(1.2)' });
    }
  } else {
    // reduced motion: every scene + its contents are just visible, per the CSS fallback
  }

  /* ---------- 8b. How to Reach reveal ---------- */
  if (hasGSAP && !reduced) {
    gsap.fromTo('#reachHead > *', { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: '.reach', start: 'top 72%', toggleActions: 'play none none reverse' } });
    gsap.fromTo('.reachdemo .m-anim-elem', { y: 24, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.09, ease: 'back.out(1.2)',
        scrollTrigger: { trigger: '.reachdemo', start: 'top 78%', toggleActions: 'play none none reverse' } });
  } else {
    var rh = document.getElementById('reachHead'); if (rh) rh.style.opacity = 1;
    document.querySelectorAll('.reachdemo .m-anim-elem').forEach(function (el) { el.style.opacity = 1; });
  }

  /* ---------- 9. Playground reveal ---------- */
  if (hasGSAP && !reduced) {
    gsap.fromTo('#playgroundHead > *', { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: '.playground', start: 'top 72%', toggleActions: 'play none none reverse' } });
    gsap.fromTo('.scoutdemo', { y: 40, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: '.scoutdemo', start: 'top 78%', toggleActions: 'play none none reverse' } });
  } else {
    document.getElementById('playgroundHead').style.opacity = 1;
    var sd = document.querySelector('.scoutdemo'); if (sd) sd.style.opacity = 1;
  }

  /* ---------- 10. Vicinity Mode reveal ---------- */
  if (hasGSAP && !reduced) {
    var vicinityTl = gsap.timeline({
      scrollTrigger: { trigger: '#vicinitySection', start: 'top 60%', toggleActions: 'play none none reverse' }
    });
    vicinityTl
      .fromTo('.vicinity-reveal', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out' })
      .fromTo('.vmockup', { y: 80, opacity: 0, rotationX: 10 }, { y: 0, opacity: 1, rotationX: 0, duration: 1, ease: 'power3.out' }, '-=0.6')
      .fromTo('.vradar__ring', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, stagger: 0.2, ease: 'back.out(1.2)' }, '-=0.2')
      .fromTo('.v-blip', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(2)' }, '-=0.4')
      .fromTo('.vnotif', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'elastic.out(1, 0.6)' }, '-=0.2');
    gsap.to('.vnotif', { y: '-=8', duration: 2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  } else {
    document.querySelectorAll('.vicinity-reveal, .vmockup, .vradar__ring, .v-blip, .vnotif').forEach(function (el) { el.style.opacity = 1; });
  }

  /* ---------- 11. Closing manifesto reveal ---------- */
  if (hasGSAP && !reduced) {
    gsap.timeline({ scrollTrigger: { trigger: '.closing-section', start: 'top 75%', toggleActions: 'play none none reverse' } })
      .fromTo('.closing-reveal', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: 'power4.out' });
  } else {
    document.querySelectorAll('.closing-reveal').forEach(function (el) { el.style.opacity = 1; });
  }

  /* ---------- 12. THE SCOUT DEMO — autoplaying typewriter → zoom → card ----------
     No input, no API, ever — a looping illustrative demo of the in-app assistant. */
  var SCENARIOS = [
    {
      query: 'i feel like a bike trip to a waterfall',
      name: 'Dudhsagar Falls',
      meta: '🏍️ 8H RIDE · 500KM · GHAT ROADS',
      note: 'LEAVE BY 5:30AM · MONSOON ✦',
      x: 12, y: 32
    },
    {
      query: 'somewhere misty to trek this weekend',
      name: 'Chikmagalur',
      meta: '🥾 5H DRIVE · MULLAYANAGIRI TREK',
      note: 'LEAVE BY 5:00AM · MISTY RIDGES',
      x: 34, y: 52
    },
    {
      query: 'a quiet sunrise drive nearby',
      name: 'Nandi Hills',
      meta: '🚗 1.5H DRIVE · VIEWPOINT',
      note: 'LEAVE BY 4:15AM · SUNRISE 6:04',
      x: 68, y: 56
    }
  ];
  var OTHER_PINS = [
    { x: 30, y: 74 }, { x: 46, y: 16 }, { x: 60, y: 30 }, { x: 40, y: 88 }, { x: 78, y: 78 }
  ];

  var scoutZoom = document.getElementById('scoutZoom');
  if (scoutZoom) {
    var scoutTyped = document.getElementById('scoutTyped');
    var scoutCaret = document.getElementById('scoutCaret');
    var scoutCard = document.getElementById('scoutCard');
    var scoutCardName = document.getElementById('scoutCardName');
    var scoutCardMeta = document.getElementById('scoutCardMeta');
    var scoutCardNote = document.getElementById('scoutCardNote');
    var scoutBtn = document.getElementById('scoutBtn');

    var allPoints = SCENARIOS.map(function (s) { return { x: s.x, y: s.y }; }).concat(OTHER_PINS);
    var pinEls = allPoints.map(function (p) {
      var el = document.createElement('div');
      el.className = 'spin';
      el.style.setProperty('--x', p.x + '%');
      el.style.setProperty('--y', p.y + '%');
      el.innerHTML = '<i></i><b class="spin__ping"></b>';
      scoutZoom.appendChild(el);
      return el;
    });

    var timers = [];
    var clearTimers = function () { timers.forEach(clearTimeout); timers = []; };
    var after = function (ms, fn) { timers.push(setTimeout(fn, ms)); };

    function playScenario(i, animated) {
      var s = SCENARIOS[i];
      scoutTyped.textContent = '';
      scoutCard.classList.remove('is-show');
      scoutZoom.classList.remove('is-zoomed');
      pinEls.forEach(function (el) { el.classList.remove('spin--on', 'spin--dim'); });

      if (!animated) {
        scoutTyped.textContent = s.query;
        scoutZoom.style.transformOrigin = s.x + '% ' + s.y + '%';
        scoutZoom.classList.add('is-zoomed');
        pinEls[i].classList.add('spin--on');
        scoutCardName.textContent = s.name;
        scoutCardMeta.textContent = s.meta;
        scoutCardNote.textContent = s.note;
        scoutCard.classList.add('is-show');
        return;
      }

      var ci = 0;
      var typeNext = function () {
        if (ci > s.query.length) {
          after(650, function () {
            scoutZoom.style.transformOrigin = s.x + '% ' + s.y + '%';
            scoutZoom.classList.add('is-zoomed');
            pinEls.forEach(function (el, j) { el.classList.toggle('spin--dim', j !== i); });
            pinEls[i].classList.add('spin--on');

            after(750, function () {
              scoutCardName.textContent = s.name;
              scoutCardMeta.textContent = s.meta;
              scoutCardNote.textContent = s.note;
              scoutCard.classList.add('is-show');

              after(500, function () {
                scoutBtn.classList.add('is-pressed');
                after(220, function () { scoutBtn.classList.remove('is-pressed'); });
              });

              after(2800, function () {
                scoutCard.classList.remove('is-show');
                scoutZoom.classList.remove('is-zoomed');
                pinEls.forEach(function (el) { el.classList.remove('spin--on', 'spin--dim'); });
                after(700, function () { playScenario((i + 1) % SCENARIOS.length, true); });
              });
            });
          });
          return;
        }
        scoutTyped.textContent = s.query.slice(0, ci);
        ci++;
        after(38, typeNext);
      };
      typeNext();
    }

    if (reduced) {
      scoutCaret.style.display = 'none';
      playScenario(0, false);
    } else {
      var started = false;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !started) {
            started = true;
            playScenario(0, true);
            io.disconnect();
          }
        });
      }, { threshold: 0.35 });
      io.observe(scoutZoom.closest('.scoutdemo'));
    }
  }

  /* ---------- 13. WEATHER PREP — autoplaying sky loop ----------
     No API, ever — illustrative cycle through 3 saved places'
     conditions, matching the app's real Open-Meteo-backed feature. */
  var WEATHER = [
    { mode: 'rain', loc: 'DUDHSAGAR FALLS', icon: '🌧️', temp: 24, cond: 'HEAVY RAIN UNTIL 9AM', best: 'LEAVE AFTER 10AM — VISIBILITY IMPROVES', bars: [70, 55, 30, 15, 8, 5] },
    { mode: 'sun', loc: 'NANDI HILLS', icon: '☀️', temp: 18, cond: 'CLEAR SKIES · PERFECT FOR SUNRISE', best: 'LEAVE BY 4:15AM FOR THE 6:04 SUNRISE', bars: [10, 20, 55, 80, 90, 85] },
    { mode: 'mist', loc: 'CHIKMAGALUR', icon: '🌫️', temp: 21, cond: 'MISTY RIDGES · LIGHT DRIZZLE', best: 'FOG CLEARS BY 8AM — SUMMIT AFTER', bars: [20, 35, 50, 60, 45, 30] }
  ];

  var weatherScreen = document.getElementById('weatherScreen');
  if (weatherScreen) {
    var weatherFx = document.getElementById('weatherFx');
    var weatherLoc = document.getElementById('weatherLoc');
    var weatherIcon = document.getElementById('weatherIcon');
    var weatherTemp = document.getElementById('weatherTemp');
    var weatherCond = document.getElementById('weatherCond');
    var weatherBestText = document.getElementById('weatherBestText');
    var whrBars = Array.prototype.slice.call(document.querySelectorAll('#weatherHourly .whr i'));

    // rain streaks, generated once, visibility controlled by the .is-rain class
    for (var ri = 0; ri < 9; ri++) {
      var drop = document.createElement('span');
      drop.className = 'wfx__rain';
      drop.style.left = (6 + Math.random() * 88) + '%';
      drop.style.animationDelay = (-Math.random() * 1) + 's';
      drop.style.animationDuration = (0.8 + Math.random() * 0.5) + 's';
      weatherFx.appendChild(drop);
    }

    var tweenTemp = function (from, to) {
      if (hasGSAP && !reduced) {
        var proxy = { v: from };
        gsap.to(proxy, { v: to, duration: 1, ease: 'power2.out', onUpdate: function () { weatherTemp.textContent = Math.round(proxy.v); } });
      } else {
        weatherTemp.textContent = to;
      }
    };

    var weatherIndex = 0;
    var applyWeather = function (i, animateTemp) {
      var w = WEATHER[i];
      weatherScreen.classList.remove('is-rain', 'is-sun', 'is-mist');
      weatherScreen.classList.add('is-' + w.mode);
      weatherLoc.textContent = w.loc;
      weatherIcon.textContent = w.icon;
      weatherCond.textContent = w.cond;
      weatherBestText.textContent = w.best;
      whrBars.forEach(function (bar, idx) { bar.style.setProperty('--h', w.bars[idx] + '%'); });
      if (animateTemp) tweenTemp(parseInt(weatherTemp.textContent, 10) || w.temp, w.temp);
      else weatherTemp.textContent = w.temp;
    };

    if (reduced) {
      applyWeather(0, false);
    } else {
      var startedWeather = false;
      var wio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !startedWeather) {
            startedWeather = true;
            applyWeather(0, true);
            setInterval(function () {
              weatherIndex = (weatherIndex + 1) % WEATHER.length;
              applyWeather(weatherIndex, true);
            }, 5200);
            wio.disconnect();
          }
        });
      }, { threshold: 0.35 });
      wio.observe(weatherScreen.closest('.weatherdemo'));
    }
  }

  if (hasGSAP && !reduced) {
    gsap.fromTo('#weatherHead > *', { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: '.weather', start: 'top 72%', toggleActions: 'play none none reverse' } });
    gsap.fromTo('.weatherdemo', { y: 40, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: '.weatherdemo', start: 'top 78%', toggleActions: 'play none none reverse' } });
  } else {
    var wh = document.getElementById('weatherHead'); if (wh) wh.style.opacity = 1;
    var wd = document.querySelector('.weatherdemo'); if (wd) wd.style.opacity = 1;
  }

  /* ---------- 14. COLLECTIONS (Pro) — collection → taste → randomized suggestion ----------
     No input, no API — a scripted illustration of the taste-profile feature.
     Three steps, the last one "clicked" twice back to back to sell the
     randomize-on-tap behavior, then the whole loop restarts. */
  var COLLECTION_PICKS = [
    { name: 'Kudremukh Trek', match: 96, tags: 'MISTY · TREK · OFFBEAT' },
    { name: 'Agumbe Rainforest', match: 91, tags: 'MONSOON · WILDLIFE · QUIET' },
    { name: 'Sakleshpur Estate', match: 94, tags: 'COFFEE · MISTY · WEEKEND' },
    { name: 'Yana Caves', match: 89, tags: 'OFFBEAT · TREK · HERITAGE' }
  ];

  var collectionScreen = document.getElementById('collectionScreen');
  if (collectionScreen) {
    var colSteps = Array.prototype.slice.call(document.querySelectorAll('#collectionScreen .revstep'));
    var colCountEl = document.getElementById('colCount');
    var tasteBars = Array.prototype.slice.call(document.querySelectorAll('.tastebar'));
    var colShuffleBtn = document.getElementById('colShuffleBtn');
    var colShuffleIcon = document.getElementById('colShuffleIcon');
    var colSuggest = document.getElementById('colSuggest');
    var colName = document.getElementById('colName');
    var colMatch = document.getElementById('colMatch');
    var colTags = document.getElementById('colTags');
    var colFlowPulse = document.getElementById('colFlowPulse');
    var colShuffleFill = document.getElementById('colShuffleFill');
    var colTimers = [];
    var colClear = function () { colTimers.forEach(clearTimeout); colTimers = []; };
    var colAfter = function (ms, fn) { colTimers.push(setTimeout(fn, ms)); };
    var colPickIndex = 0;

    var popIn = function (container) {
      if (!hasGSAP) return;
      gsap.fromTo(container.querySelectorAll('.m-anim-elem'),
        { y: 16, opacity: 0, scale: 0.94 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.08, ease: 'back.out(1.2)' });
    };
    var setColStep = function (i) {
      colSteps.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
    };
    var tweenCount = function (el, from, to, suffix) {
      if (hasGSAP) {
        var proxy = { v: from };
        gsap.to(proxy, { v: to, duration: 0.9, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(proxy.v) + (suffix || ''); } });
      } else {
        el.textContent = to + (suffix || '');
      }
    };

    var runShuffle = function (onDone) {
      colShuffleBtn.classList.add('is-pressed');
      colShuffleIcon.classList.add('is-spinning');
      colSuggest.classList.add('is-shuffling');
      colAfter(200, function () { colShuffleBtn.classList.remove('is-pressed'); });

      // the button's own loading sweep — fills end to end, then empties back
      colShuffleFill.classList.remove('is-loading');
      void colShuffleFill.offsetWidth; // restart the transition even if it's mid-cycle
      colShuffleFill.classList.add('is-loading');

      // a pulse travels from the button (source) up to the card (target)
      colFlowPulse.classList.remove('is-flowing');
      colAfter(60, function () { colFlowPulse.classList.add('is-flowing'); });

      colAfter(850, function () {
        colShuffleIcon.classList.remove('is-spinning');
        colSuggest.classList.remove('is-shuffling');
        colShuffleFill.classList.remove('is-loading');
        colFlowPulse.classList.remove('is-flowing');

        colPickIndex = (colPickIndex + 1) % COLLECTION_PICKS.length;
        var final = COLLECTION_PICKS[colPickIndex];
        colName.textContent = final.name;
        colMatch.textContent = final.match + '% MATCH';
        colTags.textContent = final.tags;
        if (hasGSAP) gsap.fromTo(colSuggest, { scale: 0.97 }, { scale: 1, duration: 0.4, ease: 'back.out(2)' });

        if (onDone) onDone();
      });
    };

    var playCollectionSequence = function () {
      if (!colSteps.length) return;
      colClear();

      // step 0 — your collection
      setColStep(0);
      colCountEl.textContent = '0';
      popIn(colSteps[0]);
      tweenCount(colCountEl, 0, 24);

      colAfter(2600, function () {
        // step 1 — learning your taste
        setColStep(1);
        popIn(colSteps[1]);
        tasteBars.forEach(function (bar) {
          var bar_i = bar.querySelector('.tastebar__track i');
          var pct = bar.querySelector('.tastebar__pct');
          var target = parseInt(bar_i.dataset.w, 10);
          bar_i.style.width = '0%';
          pct.textContent = '0%';
          colAfter(150, function () {
            bar_i.style.width = target + '%';
            tweenCount(pct, 0, target, '%');
          });
        });

        colAfter(3000, function () {
          // step 2 — tap for a suggestion, twice (sells the "randomize on tap" behavior)
          setColStep(2);
          popIn(colSteps[2]);
          colAfter(500, function () {
            runShuffle(function () {
              colAfter(1700, function () {
                runShuffle(function () {
                  colAfter(2400, playCollectionSequence);
                });
              });
            });
          });
        });
      });
    };

    var startedCollection = false;
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !startedCollection) {
          startedCollection = true;
          if (reduced) {
            setColStep(2);
            colCountEl.textContent = '24';
            tasteBars.forEach(function (bar) {
              var bar_i = bar.querySelector('.tastebar__track i');
              bar_i.style.width = bar_i.dataset.w + '%';
              bar.querySelector('.tastebar__pct').textContent = bar_i.dataset.w + '%';
            });
            var first = COLLECTION_PICKS[0];
            colName.textContent = first.name; colMatch.textContent = first.match + '% MATCH'; colTags.textContent = first.tags;
          } else {
            playCollectionSequence();
          }
          cio.disconnect();
        }
      });
    }, { threshold: 0.35 });
    cio.observe(collectionScreen.closest('.collectiondemo'));
  }

  if (hasGSAP && !reduced) {
    gsap.fromTo('#collectionHead > *', { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: '.collection', start: 'top 72%', toggleActions: 'play none none reverse' } });
    gsap.fromTo('.collectiondemo', { y: 40, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: '.collectiondemo', start: 'top 78%', toggleActions: 'play none none reverse' } });
  } else {
    var ch = document.getElementById('collectionHead'); if (ch) ch.style.opacity = 1;
    var cd = document.querySelector('.collectiondemo'); if (cd) cd.style.opacity = 1;
  }

  /* ---------- 17. PRICING — plan toggle + the discount reveal ----------
     Numbers sourced from LIGHTHOUSE_PRICING_ECONOMICS.md. The strike-through
     draw-on + price pop-in fires once on scroll-into-view, and again (as
     honest feedback on a real click, not a fake-urgency loop) whenever the
     user actually flips the Monthly/Annual toggle. */
  /* Only one percentage is on screen at a time. Two true-but-different
     numbers were being shown together on the annual view and read as a
     contradiction: the card's "SAVE 50%" measures ₹1,999→₹999 off list,
     while the toggle's "SAVE 44%" measures annual against twelve monthly
     payments (₹149×12 = ₹1,788 vs ₹999). The toggle keeps its comparison
     because that's the choice the user is actually making there; the annual
     card drops its percentage rather than argue with it. */
  var PRICING_PLANS = {
    monthly: { strike: '₹199', amount: '₹149', period: '/ MONTH', discount: 'LAUNCH OFFER · SAVE 25%' },
    annual: { strike: '₹1,999', amount: '₹999', period: '/ YEAR', discount: 'LAUNCH OFFER' }
  };
  var pricingSection = document.getElementById('pricingSection');
  if (pricingSection) {
    var toggleMonthly = document.getElementById('toggleMonthly');
    var toggleAnnual = document.getElementById('toggleAnnual');
    var pricetoggleThumb = document.getElementById('pricetoggleThumb');
    var proStrike = document.getElementById('proStrike');
    var proAmount = document.getElementById('proAmount');
    var proPeriod = document.getElementById('proPeriod');
    var proDiscountTag = document.getElementById('proDiscountTag');

    var formatINR = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
    var parseINR = function (s) { return parseInt(String(s).replace(/[^\d]/g, ''), 10) || 0; };

    var moveThumb = function () {
      if (!pricetoggleThumb) return;
      var activeBtn = toggleAnnual.classList.contains('is-active') ? toggleAnnual : toggleMonthly;
      var trackRect = pricetoggleThumb.parentElement.getBoundingClientRect();
      var btnRect = activeBtn.getBoundingClientRect();
      pricetoggleThumb.style.width = btnRect.width + 'px';
      pricetoggleThumb.style.transform = 'translateX(' + (btnRect.left - trackRect.left) + 'px)';
    };

    var lastAmount = 0;
    var playPriceReveal = function (plan) {
      proStrike.classList.remove('is-struck', 'is-in');
      proAmount.classList.remove('is-shown');
      proDiscountTag.classList.remove('is-shown');
      proStrike.textContent = plan.strike;
      proPeriod.textContent = plan.period;
      proDiscountTag.textContent = plan.discount;

      var targetAmount = parseINR(plan.amount);
      var fromAmount = lastAmount;
      lastAmount = targetAmount;
      proAmount.textContent = formatINR(fromAmount);

      var t0 = setTimeout(function () { proStrike.classList.add('is-in'); }, 80);
      var t1 = setTimeout(function () { proStrike.classList.add('is-struck'); }, 320);
      var t2 = setTimeout(function () {
        proAmount.classList.add('is-shown');
        if (hasGSAP) {
          var proxy = { v: fromAmount };
          gsap.to(proxy, {
            v: targetAmount, duration: 0.85, ease: 'power2.out',
            onUpdate: function () { proAmount.textContent = formatINR(proxy.v); }
          });
        } else {
          proAmount.textContent = formatINR(targetAmount);
        }
      }, 420);
      var t3 = setTimeout(function () { proDiscountTag.classList.add('is-shown'); }, 680);

      if (reduced) {
        clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
        proStrike.classList.add('is-struck', 'is-in');
        proAmount.classList.add('is-shown');
        proAmount.textContent = formatINR(targetAmount);
        proDiscountTag.classList.add('is-shown');
      }
    };

    var setPlan = function (planKey) {
      toggleMonthly.classList.toggle('is-active', planKey === 'monthly');
      toggleAnnual.classList.toggle('is-active', planKey === 'annual');
      moveThumb();
      playPriceReveal(PRICING_PLANS[planKey]);
    };

    toggleMonthly.addEventListener('click', function () { setPlan('monthly'); });
    toggleAnnual.addEventListener('click', function () { setPlan('annual'); });
    window.addEventListener('resize', moveThumb);
    moveThumb();

    var startedPricing = false;
    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !startedPricing) {
          startedPricing = true;
          playPriceReveal(PRICING_PLANS.monthly);
          pio.disconnect();
        }
      });
    }, { threshold: 0.3 });
    pio.observe(pricingSection);
  }

  if (hasGSAP && !reduced) {
    gsap.fromTo('#pricingHead > *', { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: '.pricing', start: 'top 72%', toggleActions: 'play none none reverse' } });
    gsap.fromTo('.pricecard', { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, stagger: 0.15, ease: 'power3.out',
        scrollTrigger: { trigger: '.pricegrid', start: 'top 78%', toggleActions: 'play none none reverse' } });
  } else {
    var prh = document.getElementById('pricingHead'); if (prh) prh.style.opacity = 1;
    document.querySelectorAll('.pricecard').forEach(function (el) { el.style.opacity = 1; });
  }

  /* ---------- 18. AVAILABLE ON — platform availability reveal ---------- */
  if (hasGSAP && !reduced) {
    gsap.fromTo('#platformsHead > *', { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: '.platforms', start: 'top 75%', toggleActions: 'play none none reverse' } });
    gsap.fromTo('.platformcard', { y: 30, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.12, ease: 'back.out(1.3)',
        scrollTrigger: { trigger: '.platformrow', start: 'top 82%', toggleActions: 'play none none reverse' } });
  } else {
    var plh = document.getElementById('platformsHead'); if (plh) plh.style.opacity = 1;
    document.querySelectorAll('.platformcard').forEach(function (el) { el.style.opacity = 1; });
  }

  /* ---------- 19. Waitlist form ---------- */
  var form = document.querySelector('.waitlist');
  if (form) {
    var input = form.querySelector('.waitlist__input');
    var noteIdle = form.querySelector('[data-state-idle]');
    var noteOk = form.querySelector('[data-state-ok]');
    var noteErr = form.querySelector('[data-state-err]');
    var btnLabel = form.querySelector('.waitlist__btn-label');

    var setState = function (state) {
      noteIdle.hidden = state !== 'idle';
      noteOk.hidden = state !== 'ok';
      noteErr.hidden = state !== 'err';
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        input.focus();
        setState('err');
        noteErr.textContent = 'THAT EMAIL DOESN’T LOOK RIGHT';
        return;
      }
      btnLabel.textContent = 'Lighting up…';

      if (isLocal) {
        setTimeout(function () {
          setState('ok');
          noteOk.textContent = 'DEV PREVIEW — NOT SAVED. WORKS ON THE LIVE SITE.';
          btnLabel.textContent = 'On the list ✦';
        }, 600);
        return;
      }

      fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      }).then(function (res) {
        if (!res.ok) throw new Error('bad status ' + res.status);
        return res.json();
      }).then(function () {
        setState('ok');
        btnLabel.textContent = 'On the list ✦';
        input.value = '';
        input.blur();
      }).catch(function () {
        setState('err');
        noteErr.textContent = 'COULDN’T REACH THE LIGHTHOUSE — TRY AGAIN';
        btnLabel.textContent = 'Get early access';
      });
    });
  }
})();
