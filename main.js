/* LIGHTHOUSE landing — editorial type, CSS beam, Lenis. No canvas. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var liteFx = document.documentElement.classList.contains("is-lite-fx");
  if (!liteFx && (saveData || (navigator.deviceMemory || 8) <= 4 || (navigator.hardwareConcurrency || 8) <= 4)) {
    liteFx = true;
    document.documentElement.classList.add("is-lite-fx");
  }

  var scrollYNow = 0;
  var nav = document.getElementById('nav');
  var lenis = null;
  var lastY = 0;
  var vel = 0;
  var typeBlur = 0;
  var navHideTimer = 0;
  var NAV_HIDE_AFTER_MS = 1400;

  function navPinned() {
    return scrollYNow <= 180;
  }
  function navBusy() {
    return !!(nav && (nav.matches(':hover') || nav.contains(document.activeElement)));
  }
  function showNav() {
    if (!nav) return;
    nav.style.transform = 'translateY(0)';
  }
  function hideNav() {
    if (!nav) return;
    nav.style.transform = 'translateY(-140%)';
  }
  function scheduleNavHide() {
    window.clearTimeout(navHideTimer);
    navHideTimer = window.setTimeout(function () {
      if (navPinned() || navBusy()) return;
      hideNav();
    }, NAV_HIDE_AFTER_MS);
  }

  var SEAM_FLOATS = [
    { id: "mood", prop: "--seam-rise" },
    { id: "clock", prop: "--seam-rise" },
    { id: "vote", prop: "--vote-rise" }
  ];
  function floatSeamPhones() {
    var mid = innerHeight * 0.5;
    var span = innerHeight * 0.42;
    SEAM_FLOATS.forEach(function (item) {
      var section = document.getElementById(item.id);
      if (!section) return;
      if (reduced || liteFx) {
        section.style.setProperty(item.prop, "0px");
        return;
      }
      var seam = section.getBoundingClientRect().bottom;
      var t = clamp((mid - seam) / span, -1, 1);
      var eased = t * (1 - Math.abs(t) * 0.35);
      section.style.setProperty(item.prop, (eased * -72).toFixed(1) + "px");
    });
  }

  function onScroll(y, limit) {
    scrollYNow = y;
    if (nav) {
      nav.classList.toggle('nav--shrunk', y > 24);
      if (navPinned()) {
        window.clearTimeout(navHideTimer);
        showNav();
      } else if (nav._dir === 1) {
        window.clearTimeout(navHideTimer);
        hideNav();
      } else {
        showNav();
        scheduleNavHide();
      }
    }
    document.documentElement.style.setProperty('--beam-rot', (y * 0.045).toFixed(2) + 'deg');
    floatSeamPhones();
  }

  floatSeamPhones();
  window.addEventListener("resize", floatSeamPhones, { passive: true });

  function initScroll() {
    if (reduced || typeof window.Lenis === 'undefined') {
      var last = 0;
      window.addEventListener('scroll', function () {
        var y = window.scrollY;
        vel = y - last;
        if (nav) nav._dir = y > last ? 1 : -1;
        last = y;
        var limit = document.documentElement.scrollHeight - innerHeight;
        onScroll(y, limit);
      }, { passive: true });
      return;
    }

    lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.35
    });

    var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);

    lenis.on('scroll', function (e) {
      vel = e.velocity || 0;
      if (nav) nav._dir = e.direction;
      onScroll(e.scroll, e.limit);
    });
  }
  requestAnimationFrame(function () {
    requestAnimationFrame(initScroll);
  });

  /* ---------- Hero-map loader ----------
     Copy paints on its own. This cover sits only on #hero-map until tiles
     have painted, then it fades off — no sonar, no scan-open, no torch. */
  var heroLoaderDone = false;
  var heroFxReady = false;
  var heroMapPainted = false;
  var HERO_LOADER_DONE_EVENT = "lighthouse:hero-map-revealed";
  var HERO_MAP_PAINTED_EVENT = "lighthouse:hero-map-painted";
  var HERO_FX_READY_EVENT = "lighthouse:hero-fx-ready";
  function announceHeroMapPainted() {
    if (heroMapPainted) return;
    heroMapPainted = true;
    document.dispatchEvent(new CustomEvent(HERO_MAP_PAINTED_EVENT));
  }
  function initHeroLoader() {
    var torch = document.getElementById("hero-torch");
    if (torch) torch.remove();
    releaseHeroCopy();
    heroLoaderDone = true;
    document.dispatchEvent(new CustomEvent(HERO_LOADER_DONE_EVENT));
  }

  /* Copy is already on the first paint. This class remains for the leftover
     `.hero__lede` / go-glitch rules, not for hiding the quote or the form. */
  function releaseHeroCopy() {
    var hero = document.getElementById("hero");
    if (hero) hero.classList.add("is-ready");
  }
  document.addEventListener(HERO_LOADER_DONE_EVENT, releaseHeroCopy);
  initHeroLoader();

  /* A rotating line of travel quotes fills the old lede's slot. First paint
     already has a quote in the HTML; this shuffles the rest onto that same
     slot and cycles once the page is live. */
  var QUOTES = [
    { text: "I love road trips, I love driving, I love finding little towns. I just think it's the best way to travel.", author: "Scarlett Johansson" },
    { text: "I didn't say no because between safety and adventure I choose adventure.", author: "Craig Ferguson" },
    { text: "We shall not cease from exploration and the end of all our exploring will be to arrive where we started and know the place for the first time.", author: "T.S. Eliot" },
    { text: "Roads were made for journeys, not destinations.", author: "Confucius" },
    { text: "Growth is painful. Change is painful. But, nothing is as painful as staying stuck where you do not belong.", author: "N.R. Narayana Murthy · Co-founder, Infosys" },
    { text: "O nanna chetana, Agu nee aniketana.", translation: "O my spirit, transcend all boundaries and become a free traveler.", author: "Kuvempu · Kannada poet, Rashtrakavi" },
    { text: "Seize the day, my friend. Pehle is din ko poori tarah jiyo, phir chalis ke bare mein sochna.", translation: "First live this day to the fullest, then think about turning forty.", author: "Zindagi Na Milegi Dobara" },
    { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
    { text: "To travel is to live.", author: "Hans Christian Andersen" },
    { text: "I am not the same, having seen the moon shine on the other side of the world.", author: "Mary Anne Radmacher" },
    { text: "Adventure is worthwhile in itself.", author: "Amelia Earhart" },
    { text: "It is not down on any map; true places never are.", author: "Herman Melville, Moby-Dick" }
  ];

  (function initQuoteCycle() {
    var el = document.getElementById("quoteCycle");
    var textEl = document.getElementById("quoteText");
    var translationEl = document.getElementById("quoteTranslation");
    var authorEl = document.getElementById("quoteAuthor");
    if (!el || !textEl || !authorEl) return;

    // Shuffled once per load so the opening line isn't always Scarlett Johansson.
    var order = QUOTES.map(function (_, i) { return i; });
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
    }
    var pos = 0;
    var timer = 0;

    function paint(q) {
      textEl.textContent = "“" + q.text + "”";
      // A couple of these run long enough to add a wrapped line at any normal
      // width — shrink just those rather than reserve min-height for the
      // whole rotation off one outlier, which would leave a dead gap under
      // every short quote.
      textEl.classList.toggle("is-long", q.text.length > 65);
      if (translationEl) translationEl.textContent = q.translation || "";
      authorEl.textContent = "— " + q.author;
    }
    paint(QUOTES[order[0]]);

    function advance() {
      pos = (pos + 1) % order.length;
      textEl.classList.add("is-changing");
      window.setTimeout(function () {
        paint(QUOTES[order[pos]]);
        textEl.classList.remove("is-changing");
      }, 340);
    }

    function schedule() {
      window.clearTimeout(timer);
      if (reduced) return; // static quote, no motion, for reduced-motion visitors
      timer = window.setTimeout(function () {
        advance();
        schedule();
      }, 7000);
    }
    // Appear on load, then start the cycle. Do not wait for the map.
    if (!reduced) window.setTimeout(schedule, 1200);

    // Pause on hover/focus so a long quote doesn't change mid-read.
    el.addEventListener("mouseenter", function () { window.clearTimeout(timer); });
    el.addEventListener("mouseleave", schedule);
    el.addEventListener("focusin", function () { window.clearTimeout(timer); });
    el.addEventListener("focusout", schedule);
  })();

  document.querySelectorAll('[data-scrollto]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var href = a.getAttribute('href');
      var target = document.querySelector(href);
      if (!target) return;
      if (lenis) lenis.scrollTo(target, { offset: href === '#join' ? -80 : -40 });
      else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      if (href === '#join') {
        var input = document.getElementById('email');
        // offsetParent is null once the form is hidden (already joined) — focusing
        // an invisible field would steal focus from the share panel sitting there.
        if (input && input.offsetParent !== null) {
          setTimeout(function () { input.focus({ preventScroll: true }); }, 700);
        }
      }
    });
  });

  /* ---------- Velocity blur on display type ---------- */
  var blurTargets = document.querySelectorAll('.display');
  var blurArmed = false;
  function tickBlur() {
    if (reduced) return;
    var target = clamp(Math.abs(vel) * 0.045, 0, 10);
    typeBlur += (target - typeBlur) * 0.18;
    var px = typeBlur < 0.08 ? 0 : typeBlur;
    var val = px.toFixed(2) + 'px';
    for (var i = 0; i < blurTargets.length; i++) {
      if (px === 0) {
        blurTargets[i].classList.remove('is-blurred');
        blurTargets[i].style.removeProperty('--type-blur');
      } else {
        blurTargets[i].style.setProperty('--type-blur', val);
        blurTargets[i].classList.add('is-blurred');
      }
    }
    vel *= 0.92;
    requestAnimationFrame(tickBlur);
  }
  function armTypeBlur() {
    if (blurArmed || reduced) return;
    blurArmed = true;
    requestAnimationFrame(tickBlur);
  }
  window.addEventListener('wheel', armTypeBlur, { once: true, passive: true });
  window.addEventListener('touchmove', armTypeBlur, { once: true, passive: true });

  /* ---------- Sticky three-gesture scene ---------- */
  var answers = document.querySelector('.answers');
  var lines = document.querySelectorAll('.answers__line');
  var ticks = document.querySelectorAll('.answers__ticks i');
  var activeAnswer = 0;

  var vizSets = document.querySelectorAll('.answers__viz .vizset');
  var vizLayers = document.querySelectorAll('.answers__viz .viz');

  function setAnswer(i) {
    if (i === activeAnswer) return;
    var prev = activeAnswer;
    activeAnswer = i;
    lines.forEach(function (el, n) {
      el.classList.toggle('is-on', n === i);
      el.classList.toggle('is-leaving', n === prev && n !== i);
      el.setAttribute('aria-hidden', n === i ? 'false' : 'true');
    });
    ticks.forEach(function (el, n) { el.classList.toggle('is-on', n === i); });

    // Only the visible pair is allowed to decode. Three looping clips running at
    // once is real battery on a mid-range Android, which is the benchmark device
    // for this audience.
    vizSets.forEach(function (set, n) {
      var on = n === i;
      set.classList.toggle('is-on', on);
      set.querySelectorAll('video').forEach(function (v) {
        if (on) {
          if (v.preload === 'none') v.preload = 'auto';
          var play = v.play();
          if (play && play.catch) play.catch(function () { /* autoplay blocked */ });
        } else {
          v.pause();
        }
      });
    });
  }

  function updateAnswers() {
    if (!answers || reduced) return;
    var rect = answers.getBoundingClientRect();
    var span = rect.height - innerHeight;
    if (span <= 0) return;
    var p = clamp(-rect.top / span, 0, 0.999);
    setAnswer(Math.min(2, Math.floor(p * 3)));

    // Parallax: each layer drifts by its own depth across the pinned scroll, so
    // the pair separates as you move rather than travelling as one block.
    var local = (p * 3) % 1;                 // 0..1 within the current panel
    vizLayers.forEach(function (v) {
      var depth = parseFloat(v.dataset.depth || '0.2');
      var shift = (local - 0.5) * depth * 190;
      v.style.transform = 'translate3d(0,' + shift.toFixed(2) + 'px,0)';
    });
  }

  // setAnswer() only fires on a *change*, so panel 0's pair would never be told
  // to play. Start it the first time the section is actually on screen — not at
  // page load, so three clips don't decode behind the hero.
  if (vizSets.length && !reduced && 'IntersectionObserver' in window) {
    var vizIo = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        vizSets[activeAnswer].querySelectorAll('video').forEach(function (v) {
          v.preload = 'auto';
          var play = v.play();
          if (play && play.catch) play.catch(function () {});
        });
        obs.disconnect();
      });
    }, { rootMargin: '200px' });
    if (answers) vizIo.observe(answers);
  }

  /* ---------- Type river is CSS-infinite; no scroll hitch ---------- */

  /* ---------- Clip-up on pitch + close, slide-out on the type anchor ---------- */
  var clipTargets = document.querySelectorAll('.close, .pitch, .stage__promise');
  if (reduced || !('IntersectionObserver' in window)) {
    clipTargets.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var clipIo = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        if (e.target.classList.contains('stage__promise')) obs.unobserve(e.target);
      });
    }, { threshold: 0.28 });
    clipTargets.forEach(function (el) { clipIo.observe(el); });
  }

  /* ---------- Return Clock: type cycle + Search replica ---------- */
  /* 2200ms beat = 66 frames @ 30fps. Same numbers as Remotion `ReturnClock`. */
  var CLOCK_BEAT_MS = 2200;
  var CLOCK_FPS = 30;
  var CLOCK_BEAT = 66;
  var CLOCK_MARK = { tapTrigger: 8, pickerOpen: 12, tapChip: 30, pickerClose: 38, countIn: 50, tapLen: 16 };
  var CLOCK_PRESETS = [
    { id: "dark", trigger: "back by 6:45pm", unbounded: false },
    { id: "midnight", trigger: "back by midnight", unbounded: false },
    { id: "overnight", trigger: "overnight", unbounded: false },
    { id: "weekend", trigger: "whole weekend", unbounded: true }
  ];
  /* Catalog car.duration_min from Bangalore, capped at MAP_PLACE_LIMIT 40 —
     the same bound SearchPage's collection cards use. */
  var CLOCK_CARDS = [
    { title: "Breakfast Runs", blurb: "Out by six, eating by eight, home before it gets hot.", accent: "#E0A458", img: "/assets/places/turahalli.jpg", n: [15, 32, 40, 40] },
    { title: "Tarmac Therapy", blurb: "Roads worth driving for their own sake.", accent: "#E0A458", img: "/assets/places/manchanabele.jpg", n: [3, 3, 13, 16] },
    { title: "Corner Craving", blurb: "Ghat sections with enough bends to justify the fuel.", accent: "#E0A458", img: "/assets/places/devarayanadurga.jpg", n: [1, 2, 11, 11] },
    { title: "Wild Lakeside", blurb: "Backwaters and lake bunds worth three slow hours.", accent: "#4FB0C6", img: "/assets/places/gundamagere.jpg", n: [13, 18, 40, 40] },
    { title: "Secret Cascades", blurb: "Falls nobody has packaged yet. Most of them need rain.", accent: "#7FE3D6", img: "/assets/places/ganalu.jpg", n: [1, 2, 25, 29] },
    { title: "Summit Treks", blurb: "Betta climbs that pay out. Start before the rock bakes.", accent: "#8FA6C4", img: "/assets/places/skandagiri.jpg", n: [5, 9, 40, 40] }
  ];

  var clockItems = document.querySelectorAll(".clocklist li");
  var clockApp = document.getElementById("search-app");
  var clockBasis = document.getElementById("clock-basis");
  var clockTrigger = document.getElementById("clock-trigger");
  var clockPicker = document.getElementById("clock-picker");
  var clockCardsEl = document.getElementById("clock-cards");
  var clockTap = document.getElementById("clock-tap");
  var clockChips = clockPicker ? clockPicker.querySelectorAll(".search-app__chip") : [];
  var clockRaf = 0;
  var clockStart = 0;
  var clockCountIdx = -1;
  var clockBasisIdx = -1;
  var clockShimmering = false;
  var clockTapAt = -1;

  function clockCountLabel(n) {
    if (!n) return "Nothing in range yet";
    return n + (n === 1 ? " place" : " places");
  }

  function clockSentence(idx) {
    var p = CLOCK_PRESETS[idx];
    var trig = '<button type="button" class="search-app__trigger" id="clock-trigger" tabindex="-1">' + p.trigger + "</button>";
    if (p.unbounded) return "Counting everything in range — " + trig + ".";
    return "Counting what you can reach and still be " + trig + ".";
  }

  function paintClockCounts(idx, mode) {
    if (!clockCardsEl) return;
    if (mode !== "shimmer") clockCountIdx = idx;
    else clockCountIdx = -2;
    var nodes = clockCardsEl.querySelectorAll(".search-card");
    nodes.forEach(function (card, i) {
      var hold = card.querySelector(".search-card__n");
      if (!hold) return;
      var label = clockCountLabel(CLOCK_CARDS[i].n[idx]);
      if (mode === "shimmer") {
        hold.classList.remove("is-in");
        hold.innerHTML = '<i class="search-card__shimmer" aria-hidden="true"></i>';
        return;
      }
      hold.classList.remove("is-in");
      hold.innerHTML = "<span>" + label + "</span>";
      hold.style.color = CLOCK_CARDS[i].accent;
      if (mode === "instant") {
        hold.classList.add("is-in");
      } else {
        requestAnimationFrame(function () { hold.classList.add("is-in"); });
      }
    });
  }

  function setClockTap(el) {
    if (!clockTap || !clockApp || !el) {
      if (clockTap) clockTap.hidden = true;
      return;
    }
    var host = clockApp.getBoundingClientRect();
    var box = el.getBoundingClientRect();
    clockTap.style.left = (box.left - host.left + box.width / 2) + "px";
    clockTap.style.top = (box.top - host.top + box.height / 2) + "px";
    clockTap.hidden = false;
    clockTap.classList.remove("is-fire");
    void clockTap.offsetWidth;
    clockTap.classList.add("is-fire");
  }

  function paintClockFrame(frame) {
    var total = CLOCK_BEAT * CLOCK_PRESETS.length;
    var t = ((frame % total) + total) % total;
    var idx = Math.floor(t / CLOCK_BEAT);
    var local = t % CLOCK_BEAT;
    var prev = (idx + CLOCK_PRESETS.length - 1) % CLOCK_PRESETS.length;

    clockItems.forEach(function (el, n) { el.classList.toggle("is-on", n === idx); });

    if (!clockApp) return;

    var pickerOpen = local >= CLOCK_MARK.pickerOpen && local < CLOCK_MARK.pickerClose;
    clockApp.classList.toggle("is-picking", pickerOpen);
    if (clockPicker) clockPicker.classList.toggle("is-open", pickerOpen);

    clockChips.forEach(function (chip, n) {
      var selected = local < CLOCK_MARK.tapChip ? prev : idx;
      chip.classList.toggle("is-on", n === selected);
    });

    var shown = local < CLOCK_MARK.countIn ? prev : idx;
    if (local >= CLOCK_MARK.tapChip && local < CLOCK_MARK.countIn) {
      if (!clockShimmering) {
        clockShimmering = true;
        paintClockCounts(idx, "shimmer");
      }
    } else {
      clockShimmering = false;
      if (clockCountIdx !== shown) paintClockCounts(shown, local < 2 ? "instant" : "reveal");
    }

    var basisIdx = local < CLOCK_MARK.tapChip ? prev : idx;
    if (clockBasis && clockBasisIdx !== basisIdx) {
      clockBasisIdx = basisIdx;
      clockBasis.innerHTML = clockSentence(basisIdx);
      clockTrigger = document.getElementById("clock-trigger");
    }

    var tapKey = -1;
    var tapEl = null;
    if (local >= CLOCK_MARK.tapTrigger && local < CLOCK_MARK.tapTrigger + CLOCK_MARK.tapLen) {
      tapKey = 1;
      tapEl = clockTrigger;
    } else if (local >= CLOCK_MARK.tapChip && local < CLOCK_MARK.tapChip + CLOCK_MARK.tapLen) {
      tapKey = 2;
      tapEl = clockChips[idx];
    }
    if (tapEl && clockTapAt !== tapKey + idx * 10) {
      clockTapAt = tapKey + idx * 10;
      setClockTap(tapEl);
    } else if (!tapEl && clockTap) {
      clockTap.hidden = true;
      clockTapAt = -1;
    }
  }

  function renderClockCards() {
    if (!clockCardsEl) return;
    clockCardsEl.innerHTML = CLOCK_CARDS.map(function (c) {
      var thumb = c.img
        ? '<img alt="" src="' + c.img + '" width="112" height="84" />'
        : "";
      return '<article class="search-card">' +
        '<span class="search-card__thumb" style="background:' + c.accent + '1F">' + thumb + "</span>" +
        '<span class="search-card__body">' +
          '<span class="search-card__n"><span></span></span>' +
          '<span class="search-card__title">' + c.title + "</span>" +
          '<span class="search-card__blurb">' + c.blurb + "</span>" +
        "</span></article>";
    }).join("");
  }

  function tickClock(now) {
    if (!clockStart) clockStart = now;
    var frame = ((now - clockStart) / 1000) * CLOCK_FPS;
    paintClockFrame(frame);
    clockRaf = requestAnimationFrame(tickClock);
  }
  function startClockLoop() {
    if (reduced || clockRaf) return;
    clockStart = 0;
    clockRaf = requestAnimationFrame(tickClock);
  }
  function stopClockLoop() {
    if (clockRaf) cancelAnimationFrame(clockRaf);
    clockRaf = 0;
  }

  renderClockCards();
  paintClockCounts(3, "instant");
  clockChips.forEach(function (chip, n) { chip.classList.toggle("is-on", n === 3); });

  /* Observe the section, not the phone replica: the Ultra peeks from the
     section bottom (same placement as Moody) and is clipped, so #clock-demo
     can miss the observer while the cycling type is on screen. */
  var clockSection = document.getElementById("clock");
  if (reduced) {
    paintClockFrame(CLOCK_MARK.countIn + 4);
  } else if (clockSection && "IntersectionObserver" in window) {
    var clockIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) startClockLoop();
        else stopClockLoop();
      });
    }, { threshold: 0.12 });
    clockIo.observe(clockSection);
  } else if (clockItems.length) {
    startClockLoop();
  }

  var ticking = false;
  function onFrame() {
    updateAnswers();
    ticking = false;
  }
  function requestFrame() {
    if (ticking || reduced) return;
    ticking = true;
    requestAnimationFrame(onFrame);
  }
  window.addEventListener('scroll', requestFrame, { passive: true });
  if (lenis) lenis.on('scroll', requestFrame);
  if (reduced) {
    lines.forEach(function (el) { el.classList.add('is-on'); });
  } else {
    updateAnswers();
  }

  /* ---------- Cursor ---------- */
  var cursor = document.getElementById('cursor');
  var cx = innerWidth * 0.72;
  var cy = innerHeight * 0.38;
  var tx = cx;
  var ty = cy;

  if (cursor && finePointer && !reduced && !liteFx) {
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
      cursor.classList.add('is-on');
      document.body.classList.add('has-custom-cursor');
    });
    document.addEventListener('pointerleave', function () { cursor.classList.remove('is-on'); });
    document.querySelectorAll('a, button, input, [data-magnetic]').forEach(function (el) {
      el.addEventListener('pointerenter', function () { cursor.classList.add('is-hot'); });
      el.addEventListener('pointerleave', function () { cursor.classList.remove('is-hot'); });
    });
    (function loop() {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      cursor.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      requestAnimationFrame(loop);
    })();
  } else if (cursor) {
    cursor.remove();
  }

  /* ---------- Fireflies (app BeaconScene: drift + pointer parallax) ----------
     Held until the hero map is idle. Starting a 96-particle canvas while
     MapLibre is still compiling shaders is what jittered old laptops on
     first paint. Weak machines skip this layer entirely. */
  (function initMotes() {
    var canvas = document.getElementById("motes");
    var host = document.getElementById("hero-map");
    if (!canvas || !host || reduced || liteFx) {
      if (canvas) canvas.remove();
      return;
    }
    var started = false;
    function start() {
      if (started) return;
      started = true;
      boot();
    }
    document.addEventListener(HERO_FX_READY_EVENT, start);
    function boot() {
    var ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, finePointer ? 1.75 : 1.25);
    var w = 0;
    var h = 0;
    var nx = 0;
    var ny = 0;
    var lx = 0;
    var ly = 0;
    var running = true;
    var count = finePointer ? 96 : 42;
    var motes = [];
    var MINT = "93,202,165";

    function resize() {
      var r = host.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seedMotes() {
      motes = [];
      var i;
      for (i = 0; i < count; i++) {
        motes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          seed: Math.random(),
          size: 1.2 + Math.random() * 2.4,
          depth: 0.28 + Math.random() * 0.9
        });
      }
    }

    if (finePointer) {
      window.addEventListener("pointermove", function (e) {
        nx = (e.clientX / innerWidth) * 2 - 1;
        ny = -((e.clientY / innerHeight) * 2 - 1);
      }, { passive: true });
    }
    window.addEventListener("resize", resize);
    resize();
    seedMotes();

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        running = entries.some(function (e) { return e.isIntersecting; });
      }, { threshold: 0.08 });
      io.observe(host);
    }

    function tick(now) {
      requestAnimationFrame(tick);
      if (!running || document.hidden) return;
      var t = now * 0.001;
      lx += (nx - lx) * 0.045;
      ly += (ny - ly) * 0.045;
      ctx.clearRect(0, 0, w, h);

      var i;
      var m;
      var tt;
      var px;
      var py;
      var pulse;
      var rad;
      var g;
      for (i = 0; i < motes.length; i++) {
        m = motes[i];
        tt = t * (0.10 + m.seed * 0.12);
        m.x += Math.sin(tt + m.seed * 40) * 0.22;
        m.y += Math.sin(tt * 1.4 + m.seed * 17) * 0.16;
        m.x += Math.cos(tt * 0.8 + m.seed * 23) * 0.12;
        if (m.x < -24) m.x = w + 24;
        if (m.x > w + 24) m.x = -24;
        if (m.y < -24) m.y = h + 24;
        if (m.y > h + 24) m.y = -24;
        px = m.x + lx * 26 * m.depth;
        py = m.y + ly * 14 * m.depth;
        pulse = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * (0.5 + m.seed) + m.seed * 31));
        rad = m.size * (2.2 + pulse);
        g = ctx.createRadialGradient(px, py, 0, px, py, rad);
        g.addColorStop(0, "rgba(" + MINT + "," + (0.5 * pulse).toFixed(3) + ")");
        g.addColorStop(0.35, "rgba(" + MINT + "," + (0.16 * pulse).toFixed(3) + ")");
        g.addColorStop(1, "rgba(" + MINT + ",0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    requestAnimationFrame(tick);
    }
  })();

  /* ---------- Hero map tour (OpenFreeMap + MapLibre, same stack as the app) ---------- */
  var HERO_SPOTS = [
    { name: "Skandagiri", meta: "1h 2m · 60 km", lat: 13.417256, lon: 77.682669, img: "/assets/places/skandagiri.jpg", color: "#5DCAA5" },
    { name: "Makalidurga", meta: "56m · 57 km", lat: 13.432865, lon: 77.501498, img: "/assets/places/makalidurga.jpg", color: "#E0A458" },
    { name: "Savandurga", meta: "1h 4m · 56 km", lat: 12.915961, lon: 77.297772, img: "/assets/places/savandurga.jpg", color: "#5DCAA5" },
    { name: "Rayakottai Fort", meta: "1h 12m · 76 km", lat: 12.521642, lon: 78.037022, img: "/assets/places/rayakottai.jpg", color: "#E0A458" },
    { name: "Gundamagere Lake", meta: "1h · 60 km", lat: 13.437969, lon: 77.479104, img: "/assets/places/gundamagere.jpg", color: "#5DCAA5" },
    { name: "Devarayanadurga", meta: "1h 7m · 69 km", lat: 13.3719, lon: 77.2096, img: "/assets/places/devarayanadurga.jpg", color: "#E0A458" },
    { name: "Kinnakorai", meta: "4h 58m · 347 km", lat: 11.222806, lon: 76.664879, img: "/assets/places/kinnakorai.jpg", color: "#5DCAA5" },
    { name: "Kakkadampoyil Ghat", meta: "4h 27m · 318 km", lat: 11.335265, lon: 76.110903, img: "/assets/places/kakkadampoyil.jpg", color: "#E0A458" }
  ];
  (function rotateHeroSpots() {
    // Which place opens the tour is random per load, but the rotation is a shift
    // rather than a shuffle: the array is ordered so consecutive hops stay
    // short, and shuffling would put 400km between neighbours.
    var offset = Math.floor(Math.random() * HERO_SPOTS.length);
    if (!offset) return;
    HERO_SPOTS = HERO_SPOTS.slice(offset).concat(HERO_SPOTS.slice(0, offset));
  })();
  var HERO_YOU = { lat: 12.9716, lon: 77.5946 };
  var HERO_START_ZOOM = 11.05;
  var HERO_DWELL_MS = 1000;
  // swipe-nudge peaks at 30% of 600ms — camera leaves on that beat so the
  // hop reads as the word shoving the map.
  var HERO_SWIPE_LEAD_MS = 200;
  var HERO_STYLE = "https://tiles.openfreemap.org/styles/liberty";
  var HERO_RASTER = {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap"
      }
    },
    layers: [
      { id: "bg", type: "background", paint: { "background-color": "#0F0F12" } },
      { id: "osm", type: "raster", source: "osm" }
    ]
  };
  var HIDDEN_LAYERS = {
    building: 1, poi: 1, housenumber: 1, aerodrome_label: 1,
    water_name: 1, transportation_name: 1, place: 1, landuse: 1, boundary: 1
  };

  function heroPad() {
    var clock = document.getElementById("clock");
    var w = innerWidth;
    var h = (clock && clock.clientHeight) || innerHeight;
    if (w < 720) {
      return { top: 96, bottom: Math.round(h * 0.48), left: 24, right: 24 };
    }
    return { top: 80, bottom: Math.round(h * 0.28), left: Math.round(w * 0.34), right: Math.round(w * 0.2) };
  }

  function hopMs(from, to) {
    var d = Math.hypot(from.lat - to.lat, from.lon - to.lon);
    return Math.round(Math.min(2200, Math.max(720, 640 + d * 380)));
  }

  function hopZoom(from, to) {
    var d = Math.hypot(from.lat - to.lat, from.lon - to.lon);
    return d > 1.4 ? 9.6 : 11.05;
  }

  function paintHeroMap(map) {
    try { map.setPaintProperty("background", "background-color", "#0F0F12"); } catch (e) { /* style id drift */ }
    try { map.setPaintProperty("water", "fill-color", "#15151a"); } catch (e) { /* style id drift */ }
    var layers = (map.getStyle() && map.getStyle().layers) || [];
    layers.forEach(function (layer) {
      var src = layer["source-layer"];
      if (layer.type === "symbol") {
        try { map.setLayoutProperty(layer.id, "visibility", "none"); } catch (e) { /* ok */ }
        return;
      }
      if (src && HIDDEN_LAYERS[src]) {
        try { map.setLayoutProperty(layer.id, "visibility", "none"); } catch (e) { /* ok */ }
        return;
      }
      if (src === "transportation" && layer.type === "line") {
        try { map.setPaintProperty(layer.id, "line-color", "#3A4456"); } catch (e) { /* ok */ }
        try { map.setPaintProperty(layer.id, "line-opacity", 0.6); } catch (e) { /* ok */ }
      }
    });
  }

  function makeHeroPin(spot, i) {
    var el = document.createElement("div");
    var srcAttr = i === 0
      ? 'src="' + spot.img + '"'
      : 'data-src="' + spot.img + '"';
    el.className = "hero-pin" + (i === 0 ? " is-on" : "");
    el.innerHTML =
        '<div class="hero-pin__bubble" style="border-color:' + spot.color + '" data-og-color="' + spot.color + '">' +
        '<img class="hero-pin__dot" alt="" ' + srcAttr + ' width="36" height="36" decoding="async" />' +
        '<span class="hero-pin__meta"><b>' + spot.name + "</b><small>" + spot.meta + "</small></span>" +
      "</div>";
    return el;
  }

  var HERO_THEME_IDS = ["air", "night", "warm"];
  var HERO_MAP_THEMES = ["air", "night"];
  var themeIdx = 0;

  function applyHeroTheme(name) {
    var hero = document.getElementById("hero");
    var mapWrap = document.getElementById("hero-map");
    var filtersMap = document.getElementById("filters-map");
    var root = document.documentElement;
    var btn = document.getElementById("themeToggle");
    var i;
    var night = name === "night";
    for (i = 0; i < HERO_THEME_IDS.length; i++) {
      var on = HERO_THEME_IDS[i] === name;
      root.classList.toggle("is-theme-" + HERO_THEME_IDS[i], on);
      if (hero) hero.classList.toggle("is-theme-" + HERO_THEME_IDS[i], on);
      if (mapWrap) mapWrap.classList.toggle("is-theme-" + HERO_THEME_IDS[i], on);
      if (filtersMap) filtersMap.classList.toggle("is-theme-" + HERO_THEME_IDS[i], on);
    }
    var bubbles = document.querySelectorAll("#hero-map .hero-pin__bubble, #filters-map .hero-pin__bubble");
    for (i = 0; i < bubbles.length; i++) {
      var og = bubbles[i].getAttribute("data-og-color") || "#5DCAA5";
      if (name === "warm") bubbles[i].style.borderColor = i % 2 ? "#F4E8D6" : "#E0A458";
      else if (name === "air") bubbles[i].style.borderColor = "#BA5A36";
      else bubbles[i].style.borderColor = og;
    }
    if (btn) {
      btn.setAttribute("aria-pressed", night ? "true" : "false");
      btn.textContent = night ? "Switch to light mode" : "Switch to dark mode";
    }
  }

  function toggleHeroTheme() {
    themeIdx = (themeIdx + 1) % HERO_MAP_THEMES.length;
    applyHeroTheme(HERO_MAP_THEMES[themeIdx]);
  }

  (function bindThemeToggle() {
    var btn = document.getElementById("themeToggle");
    if (!btn) return;
    applyHeroTheme(HERO_MAP_THEMES[themeIdx]);
    btn.addEventListener("click", function () {
      toggleHeroTheme();
    });
  })();

  function pulseMintWords() {
    var display = document.getElementById("display");
    if (reduced || !display) return;
    var words = display.querySelectorAll(".display__pop, .display__push");
    var i;
    for (i = 0; i < words.length; i++) {
      words[i].classList.remove("is-swiping");
      void words[i].offsetWidth;
      words[i].classList.add("is-swiping");
    }
  }

  function paintHead(head) {
    var display = document.getElementById("display");
    var a = document.getElementById("displayA");
    var b = document.getElementById("displayB");
    var c = document.getElementById("displayC");
    if (!display || !a || !b || !c) return;
    display.classList.toggle("is-compact", !!head.compact);
    a.textContent = head.a;
    b.textContent = head.b;
    c.innerHTML = "<em>" + head.c + "</em>";
  }

  function hopHeadline() {
    var display = document.getElementById("display");
    if (!display || !HERO_HEADS.length) return;
    var next = (headIdx + 1) % HERO_HEADS.length;
    function show() {
      headIdx = next;
      paintHead(HERO_HEADS[headIdx]);
      if (reduced) return;
      display.classList.remove("is-leaving");
      display.classList.add("is-entering");
      window.setTimeout(function () {
        display.classList.remove("is-entering");
      }, 560);
    }
    if (headTimer) window.clearTimeout(headTimer);
    if (reduced) {
      show();
      return;
    }
    display.classList.remove("is-entering");
    display.classList.add("is-leaving");
    headTimer = window.setTimeout(show, 280);
  }

  function initHeroTour() {
    var wrap = document.getElementById("hero-map");
    var gl = document.getElementById("hero-gl");
    var clock = document.getElementById("clock");
    if (!wrap || !gl) {
      announceHeroMapPainted();
      return;
    }
    if (!window.maplibregl) {
      console.warn("Lighthouse: MapLibre did not load — hero map skipped");
      announceHeroMapPainted();
      return;
    }

    var origin = HERO_SPOTS[0];
    var map = new window.maplibregl.Map({
      container: gl,
      style: HERO_STYLE,
      center: [origin.lon, origin.lat],
      zoom: HERO_START_ZOOM,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      failIfMajorPerformanceCaveat: false
    });
    requestAnimationFrame(function () { map.resize(); });
    window.setTimeout(function () {
      if (ready) return;
      wrap.classList.add("is-raster");
      try { map.setStyle(HERO_RASTER); } catch (err) { /* keep waiting */ }
    }, 4000);

    var pinEls = [];
    var idx = 0;
    var timer = 0;
    var kickTimer = 0;
    var inView = true;
    var ready = false;
    var settled = false;
    var fxArmed = false;

    function setOn(i) {
      pinEls.forEach(function (el, n) {
        el.classList.toggle("is-on", n === i);
        if (n !== i) return;
        var img = el.querySelector(".hero-pin__dot");
        if (img && img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
        }
      });
    }

    function pulse() {
      if (reduced || liteFx) return;
      wrap.classList.add("is-pulse");
      window.setTimeout(function () { wrap.classList.remove("is-pulse"); }, 440);
    }

    function armHeroFx() {
      if (fxArmed || liteFx || reduced) return;
      function probe() {
        var frames = 0;
        var t0 = performance.now();
        function sample(now) {
          frames += 1;
          if (now - t0 < 700) {
            requestAnimationFrame(sample);
            return;
          }
          var fps = frames / ((now - t0) / 1000);
          if (fps < 42) {
            liteFx = true;
            document.documentElement.classList.add("is-lite-fx");
            return;
          }
          fxArmed = true;
          heroFxReady = true;
          document.dispatchEvent(new CustomEvent(HERO_FX_READY_EVENT));
        }
        requestAnimationFrame(sample);
      }
      var giveUp = window.setTimeout(function () {
        liteFx = true;
        document.documentElement.classList.add("is-lite-fx");
      }, 4000);
      var go = function () {
        window.clearTimeout(giveUp);
        probe();
      };
      if (map.loaded() && !map.isMoving()) go();
      else map.once("idle", go);
    }

    function flyTo(i, duration) {
      var spot = HERO_SPOTS[i];
      var prev = HERO_SPOTS[idx];
      function go() {
        kickTimer = 0;
        idx = i;
        setOn(i);
        pulse();
        map.flyTo({
          center: [spot.lon, spot.lat],
          zoom: hopZoom(prev, spot),
          duration: reduced ? 0 : duration,
          padding: heroPad(),
          essential: true
        });
      }
      if (reduced) {
        go();
        return;
      }
      if (kickTimer) window.clearTimeout(kickTimer);
      kickTimer = window.setTimeout(go, HERO_SWIPE_LEAD_MS);
    }

    function stopTour() {
      if (timer) { window.clearTimeout(timer); timer = 0; }
      if (kickTimer) { window.clearTimeout(kickTimer); kickTimer = 0; }
    }

    function schedule() {
      stopTour();
      if (!heroLoaderDone || !ready || !settled || reduced || !inView || document.hidden) return;
      var next = (idx + 1) % HERO_SPOTS.length;
      var ms = hopMs(HERO_SPOTS[idx], HERO_SPOTS[next]);
      var lead = reduced ? 0 : HERO_SWIPE_LEAD_MS;
      // Re-arm on landing, not on landing plus a dwell, so HERO_DWELL_MS is the
      // whole pause between hops rather than half of it.
      timer = window.setTimeout(function () {
        flyTo(next, ms);
        timer = window.setTimeout(schedule, ms + lead);
      }, HERO_DWELL_MS);
    }

    map.once("style.load", function onStyle() {
      paintHeroMap(map);
      wrap.classList.add("is-live");
      ready = true;
      map.resize();
      // Padding folds into the camera so the pin sits in the open space
      // beside the headline rather than centred under it.
      map.jumpTo({
        center: [origin.lon, origin.lat],
        zoom: HERO_START_ZOOM,
        padding: heroPad()
      });

      HERO_SPOTS.forEach(function (spot, i) {
        var el = makeHeroPin(spot, i);
        pinEls.push(el);
        new window.maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([spot.lon, spot.lat])
          .addTo(map);
      });
      applyHeroTheme(HERO_MAP_THEMES[themeIdx]);

      var you = document.createElement("div");
      you.className = "hero-you";
      you.innerHTML = '<span class="hero-you__halo"></span><span class="hero-you__core"></span>';
      new window.maplibregl.Marker({ element: you, anchor: "center" })
        .setLngLat([HERO_YOU.lon, HERO_YOU.lat])
        .addTo(map);

      function beginHeroTour() {
        if (settled) return;
        settled = true;
        schedule();
        armHeroFx();
      }

      var paintedOnce = false;
      function onPainted() {
        if (paintedOnce) return;
        paintedOnce = true;
        announceHeroMapPainted();
        if (heroLoaderDone) beginHeroTour();
        else document.addEventListener(HERO_LOADER_DONE_EVENT, beginHeroTour, { once: true });
      }
      map.once("idle", onPainted);
      if (map.loaded() && !map.isMoving()) onPainted();
    });

    if ("IntersectionObserver" in window && clock) {
      var io = new IntersectionObserver(function (entries) {
        inView = entries.some(function (e) { return e.isIntersecting; });
        if (inView) schedule();
        else stopTour();
      }, { threshold: 0.2 });
      io.observe(clock);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopTour();
      else schedule();
    });
    window.addEventListener("resize", function () {
      map.resize();
    });
  }

  function loadMapLibre(done) {
    if (window.maplibregl) {
      if (done) done();
      return;
    }
    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "/vendor/maplibre-gl/maplibre-gl.css";
    document.head.appendChild(css);
    var s = document.createElement("script");
    s.src = "/vendor/maplibre-gl/maplibre-gl.js";
    s.async = true;
    s.onload = function () { if (done) done(); };
    s.onerror = function () {
      console.warn("Lighthouse: MapLibre did not load — maps skipped");
      announceHeroMapPainted();
      if (done) done();
    };
    document.head.appendChild(s);
  }

  function whenIdle(fn) {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(function () { fn(); }, { timeout: 1400 });
      return;
    }
    if (document.readyState === "complete") {
      window.setTimeout(fn, 0);
      return;
    }
    window.addEventListener("load", function () { fn(); }, { once: true });
  }

  if (document.getElementById("hero-gl") || document.getElementById("filters-list")) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        loadMapLibre(function () {
          if (document.getElementById("hero-gl")) initHeroTour();
          bootFiltersMap();
        });
      });
    });
  }

  /* ---------- Filters section: real places behind the chip river ----------
     Only places with a prepared Commons thumb land on the Moody phone —
     no empty-dot bubbles, no peek card without a photo. Categories with
     none of those assets stay a bare map. Summit Treks opens the S2
     PlaceDetail sheet on Nijagal Betta. */
  var CATEGORY_SPOTS = {
    "Wild Lakeside": [
      { name: "Gundamagere Lake", meta: "1h · 60 km", lat: 13.437969, lon: 77.479104, img: "/assets/places/gundamagere.jpg" },
    ],
    "Summit Treks": [
      { name: "Skandagiri", meta: "1h 2m · 60 km", lat: 13.417256, lon: 77.682669, img: "/assets/places/skandagiri.jpg" },
      {
        name: "Nijagal Betta",
        meta: "47m · 53 km",
        lat: 13.247256,
        lon: 77.217321,
        img: "/assets/places/nijagal.jpg",
        city: "Halenijagal · Karnataka",
        coords: "13.2473, 77.2173",
        drive: "47m",
        km: "53",
        why: "Steep rocky hike off NH48 that most people miss on the Chitradurga run — fort walls, then a temple and a dargah sharing the summit.",
        notes: ["No marked trail — rock scrambling", "No shade on the climb", "Informal parking by the railway tracks"],
        sheet: true
      },
      { name: "Makalidurga", meta: "56m · 57 km", lat: 13.432865, lon: 77.501498, img: "/assets/places/makalidurga.jpg" },
      { name: "Savandurga", meta: "1h 4m · 56 km", lat: 12.915961, lon: 77.297772, img: "/assets/places/savandurga.jpg" },
    ],
    "Night Drives": [],
    "Breakfast Runs": [
      { name: "Turahalli Forest", meta: "22m · 18 km", lat: 12.88275, lon: 77.525668, img: "/assets/places/turahalli.jpg" },
    ],
    "Secret Cascades": [
      { name: "Ganalu Falls", meta: "1h 48m · 98 km", lat: 12.348032, lon: 77.197294, img: "/assets/places/ganalu.jpg" },
    ],
    "Coastal Drives": [
      { name: "Om Beach", meta: "9h · 480 km", lat: 14.5222, lon: 74.3175, img: "/assets/places/ombeach.jpg" },
      { name: "Kapu Lighthouse", meta: "8h · 400 km", lat: 13.2241, lon: 74.738, img: "/assets/places/kapu.jpg" },
    ],
    "Misty Hikes": [
      { name: "Mullayanagiri Peak & Seethalayyanagiri", meta: "3h 37m · 269 km", lat: 13.3909, lon: 75.7214, img: "/assets/places/mullayanagiri.jpg" },
    ],
    "Tarmac Therapy": [
      { name: "Manchanabele Reservoir Viewpoint", meta: "57m · 44 km", lat: 12.89887, lon: 77.326947, img: "/assets/places/manchanabele.jpg" },
    ],
    "Corner Carving": [
      { name: "Devarayanadurga (DD Hills)", meta: "1h 7m · 69 km", lat: 13.3719, lon: 77.2096, img: "/assets/places/devarayanadurga.jpg" },
      { name: "Muthathi River Bank", meta: "1h 41m · 92 km", lat: 12.305418, lon: 77.311772, img: "/assets/places/muthathi.jpg" },
      { name: "Alangayam Ghat", meta: "2h 33m · 173 km", lat: 12.622667, lon: 78.752504, img: "/assets/places/alangayam.jpg" },
      { name: "Jogimatti", meta: "2h 48m · 206 km", lat: 14.176981, lon: 76.388974, img: "/assets/places/jogimatti.jpg" },
    ],
    "Coffee Country": [],
    "Hidden Forest Camps": [],
  };

  function photoSpots(cat) {
    return (CATEGORY_SPOTS[cat] || []).filter(function (s) { return !!s.img; });
  }

  function initFiltersMap() {
    var wrap = document.getElementById("filters-map");
    var gl = document.getElementById("filters-gl");
    var list = document.getElementById("filters-list");
    if (!list) return;

    var chips = Array.prototype.filter.call(list.querySelectorAll(".filters__chip"), function (c) {
      return c.dataset.cat;
    });
    var cats = chips.map(function (c) { return c.dataset.cat; });
    if (!cats.length) return;

    // A second copy of the category chips sits after the originals so the rail
    // can keep travelling right-to-left when the cycle wraps, instead of
    // snapping back to the first chip.
    chips.forEach(function (c) {
      var clone = c.cloneNode(true);
      clone.classList.add("filters__chip--clone");
      clone.setAttribute("aria-hidden", "true");
      clone.tabIndex = -1;
      list.appendChild(clone);
    });
    var clones = Array.prototype.filter.call(list.querySelectorAll(".filters__chip--clone"), function (c) {
      return c.dataset.cat;
    });

    var hasMap = !!(wrap && gl && window.maplibregl);
    var map = null;
    if (hasMap) {
      map = new window.maplibregl.Map({
        container: gl,
        style: HERO_STYLE,
        center: [77.5946, 12.9716],
        zoom: 6.6,
        interactive: false,
        attributionControl: false,
        fadeDuration: 0,
        failIfMajorPerformanceCaveat: false
      });
      requestAnimationFrame(function () { map.resize(); });
    }

    var ready = !hasMap;
    if (hasMap) {
      window.setTimeout(function () {
        if (ready) return;
        wrap.classList.add("is-raster");
        try { map.setStyle(HERO_RASTER); } catch (err) { /* keep waiting */ }
      }, 4000);
    }

    var pinsByCat = {};
    var idx = -1;
    var spotIdx = 0;
    var timer = 0;
    var sheetTimer = 0;
    var swipeTimer = 0;
    var peekBusy = false;
    var userTookOver = false;
    var photoHops = 0;
    var inView = true;
    var railRaf = 0;
    var RAIL_MS = 960;
    var SWIPE_MS = 440;
    var peekEl = document.getElementById("filters-peek");
    var peekRail = document.getElementById("filters-peek-rail");
    var peekA = document.getElementById("filters-peek-a");
    var peekB = document.getElementById("filters-peek-b");

    function filtersPad() {
      /* Leave the bottom well for the peek card; the labelled pin sits
         in the open map above it. */
      var h = wrap.clientHeight || 400;
      var w = wrap.clientWidth || 280;
      return {
        top: Math.max(72, Math.round(h * 0.18)),
        bottom: Math.max(118, Math.round(h * 0.3)),
        left: Math.max(18, Math.round(w * 0.08)),
        right: Math.max(18, Math.round(w * 0.08))
      };
    }

    function pinColor() {
      return document.documentElement.classList.contains("is-theme-air") ? "#BA5A36" : "#5DCAA5";
    }

    function makeFiltersPin(spot, i) {
      if (!spot || !spot.img) return null;
      var el = document.createElement("div");
      el.className = "hero-pin filters-pin" + (i === 0 ? " is-on" : "");
      var color = pinColor();
      el.innerHTML =
        '<div class="hero-pin__bubble" style="border-color:' + color + '" data-og-color="#5DCAA5">' +
          '<img class="hero-pin__dot" alt="" src="' + spot.img + '" width="36" height="36" decoding="async" />' +
          '<span class="hero-pin__meta"><b>' + spot.name + "</b><small>" + spot.meta + "</small></span>" +
        "</div>";
      var pic = el.querySelector(".hero-pin__dot");
      if (pic) {
        pic.addEventListener("error", function () {
          el.classList.remove("is-cat-on");
          el.remove();
        });
      }
      return el;
    }

    function setPeekVisible(on) {
      var peek = document.getElementById("filters-peek");
      if (peek) peek.classList.toggle("is-empty", !on);
    }

    function fillPeekCard(el, cat, spot) {
      if (!el || !spot || !spot.img) return false;
      var thumb = el.querySelector(".lh__thumb");
      var name = el.querySelector("h3");
      var meta = el.querySelector("p");
      var tag = el.querySelector(".lh__tag");
      if (name) name.textContent = spot.name;
      if (meta) meta.textContent = spot.meta;
      if (tag) tag.textContent = cat;
      if (thumb) {
        thumb.classList.remove("lh__thumb--empty");
        thumb.style.backgroundImage = "url(" + spot.img + ")";
      }
      return true;
    }

    function paintFiltersPeek(cat, spot) {
      var card = document.getElementById("filters-peek-a");
      if (!spot || !spot.img || !fillPeekCard(card, cat, spot)) {
        setPeekVisible(false);
        return;
      }
      setPeekVisible(true);
    }

    function metaParts(spot) {
      var bits = String(spot.meta || "").split("·").map(function (s) { return s.trim(); });
      var kmBit = (bits[1] || "").replace(/[^\d.]/g, "");
      return {
        drive: spot.drive || bits[0] || "",
        km: spot.km || kmBit
      };
    }

    function paintFiltersSheet(cat, spot) {
      var root = document.getElementById("filters-sheet");
      var img = document.getElementById("filters-sheet-img");
      var chip = document.getElementById("filters-sheet-chip");
      var name = document.getElementById("filters-sheet-name");
      var city = document.getElementById("filters-sheet-city");
      var coords = document.getElementById("filters-sheet-coords");
      var drive = document.getElementById("filters-sheet-drive");
      var km = document.getElementById("filters-sheet-km");
      var why = document.getElementById("filters-sheet-why");
      var gtk = document.getElementById("filters-sheet-gtk");
      if (!name || !spot) return;
      var parts = metaParts(spot);
      if (img) img.src = spot.img;
      if (chip) {
        chip.textContent = (cat || "place").toLowerCase() +
          (parts.km ? " · " + parts.km + " km out" : "");
      }
      name.textContent = spot.name;
      if (city) {
        city.textContent = spot.city || "";
        city.hidden = !spot.city;
      }
      if (coords) {
        coords.textContent = spot.coords ||
          (spot.lat != null ? spot.lat.toFixed(4) + ", " + spot.lon.toFixed(4) : "");
      }
      if (drive) drive.textContent = parts.drive;
      if (km) km.textContent = parts.km;
      if (why) {
        why.textContent = spot.why || "";
        why.hidden = !spot.why;
      }
      if (gtk) {
        gtk.innerHTML = "";
        (spot.notes || []).forEach(function (note) {
          var li = document.createElement("li");
          li.textContent = note;
          gtk.appendChild(li);
        });
        gtk.hidden = !gtk.childElementCount;
      }
      if (root) root.classList.toggle("is-thin", !spot.why && !(spot.notes && spot.notes.length));
    }

    function setFiltersSheet(open) {
      if (!wrap) return;
      wrap.classList.toggle("is-sheet", !!open);
      if (open) wrap.classList.remove("is-nav");
    }

    var NAV_ORIGIN = { name: "Bengaluru", lat: 12.9716, lon: 77.5946 };
    var navMarkers = [];

    function routeCoords(from, to) {
      var mx = (from.lon + to.lon) / 2;
      var my = (from.lat + to.lat) / 2;
      var dx = to.lon - from.lon;
      var dy = to.lat - from.lat;
      return [
        [from.lon, from.lat],
        [mx - dy * 0.14, my + dx * 0.14],
        [to.lon, to.lat]
      ];
    }

    function navLineColor() {
      return document.documentElement.classList.contains("is-theme-air") ? "#BA5A36" : "#5DCAA5";
    }

    function ensureNavLayer() {
      if (!map) return;
      var empty = { type: "Feature", geometry: { type: "LineString", coordinates: [] } };
      if (!map.getSource("nav-route")) {
        map.addSource("nav-route", { type: "geojson", data: empty });
        map.addLayer({
          id: "nav-route-line",
          type: "line",
          source: "nav-route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": navLineColor(),
            "line-width": 3.6,
            "line-opacity": 0.92
          }
        });
      }
    }

    function makeNavDot(letter) {
      var el = document.createElement("div");
      el.className = "filters-nav-pin";
      el.textContent = letter;
      return el;
    }

    function clearNavRoute() {
      navMarkers.forEach(function (m) { try { m.remove(); } catch (e) { /* gone */ } });
      navMarkers = [];
      if (map && map.getSource("nav-route")) {
        map.getSource("nav-route").setData({
          type: "Feature",
          geometry: { type: "LineString", coordinates: [] }
        });
      }
    }

    function openNavFor(spot) {
      if (!spot || !spot.img || !wrap) return;
      setFiltersSheet(false);
      wrap.classList.add("is-nav");
      var parts = metaParts(spot);
      var toEl = document.getElementById("filters-nav-to");
      var driveEl = document.getElementById("filters-nav-drive");
      var kmEl = document.getElementById("filters-nav-km");
      if (toEl) toEl.textContent = spot.name;
      if (driveEl) driveEl.textContent = parts.drive;
      if (kmEl) kmEl.textContent = parts.km ? parts.km + " km" : "";
      if (!map) return;
      ensureNavLayer();
      clearNavRoute();
      var line = routeCoords(NAV_ORIGIN, spot);
      map.getSource("nav-route").setData({
        type: "Feature",
        geometry: { type: "LineString", coordinates: line }
      });
      try { map.setPaintProperty("nav-route-line", "line-color", navLineColor()); } catch (e) { /* ok */ }
      var a = new window.maplibregl.Marker({ element: makeNavDot("A"), anchor: "center" })
        .setLngLat([NAV_ORIGIN.lon, NAV_ORIGIN.lat])
        .addTo(map);
      var b = new window.maplibregl.Marker({ element: makeNavDot("B"), anchor: "center" })
        .setLngLat([spot.lon, spot.lat])
        .addTo(map);
      navMarkers = [a, b];
      var west = Math.min(NAV_ORIGIN.lon, spot.lon);
      var east = Math.max(NAV_ORIGIN.lon, spot.lon);
      var south = Math.min(NAV_ORIGIN.lat, spot.lat);
      var north = Math.max(NAV_ORIGIN.lat, spot.lat);
      map.fitBounds([[west, south], [east, north]], {
        padding: { top: 78, bottom: 92, left: 28, right: 28 },
        duration: reduced ? 0 : 900,
        essential: true,
        maxZoom: 9.2
      });
    }

    function closeNav(opts) {
      if (!wrap) return;
      wrap.classList.remove("is-nav");
      clearNavRoute();
      if (opts && opts.silent) return;
      var spots = photoSpots(cats[idx] || "");
      if (spots[spotIdx]) {
        paintFiltersPeek(cats[idx], spots[spotIdx]);
        markSpot(cats[idx], spotIdx);
        flyToSpot(spots, spotIdx, false);
      }
    }

    function railLeft(el) {
      var listRect = list.getBoundingClientRect();
      var elRect = el.getBoundingClientRect();
      var next = list.scrollLeft + (elRect.left + elRect.width / 2) - (listRect.left + listRect.width / 2);
      var max = Math.max(0, list.scrollWidth - list.clientWidth);
      return Math.max(0, Math.min(max, next));
    }

    function labelledZoom(spots, focus) {
      var origin = spots[focus != null ? focus : 0] || spots[0];
      if (!origin || spots.length < 2) return 8.4;
      var maxD = 0;
      var i;
      for (i = 0; i < spots.length; i += 1) {
        maxD = Math.max(maxD, Math.hypot(spots[i].lat - origin.lat, spots[i].lon - origin.lon));
      }
      if (maxD > 1.8) return 6.6;
      if (maxD > 0.9) return 7.4;
      return 8.2;
    }

    function markSpot(cat, i) {
      (pinsByCat[cat] || []).forEach(function (el, n) {
        el.classList.toggle("is-on", n === i);
      });
    }

    function flyToSpot(spots, i, snap) {
      if (!map || !spots[i]) return;
      map.easeTo({
        center: [spots[i].lon, spots[i].lat],
        zoom: labelledZoom(spots, i),
        padding: filtersPad(),
        duration: snap || reduced ? 0 : 900,
        essential: true
      });
    }

    function resetPeekRail() {
      if (!peekRail) return;
      peekRail.style.transition = "none";
      peekRail.style.transform = "translate3d(0,0,0)";
    }

    function neighborIdx(spots, from, dir) {
      if (!spots.length) return 0;
      return (from + (dir < 0 ? 1 : -1) + spots.length) % spots.length;
    }

    function openSheetFor(spot) {
      if (!spot || !spot.img) return;
      paintFiltersSheet(cats[idx], spot);
      setFiltersSheet(true);
    }

    function swipeTo(nextIdx, dir, done) {
      var cat = cats[idx];
      var spots = photoSpots(cat);
      var from = spots[spotIdx];
      var to = spots[nextIdx];
      if (!from || !to || !from.img || !to.img) {
        if (done) done();
        return;
      }
      dir = dir < 0 ? -1 : 1;
      if (reduced || !peekRail || !peekA || !peekB) {
        spotIdx = nextIdx;
        paintFiltersPeek(cat, to);
        markSpot(cat, nextIdx);
        flyToSpot(spots, nextIdx, true);
        if (done) done();
        return;
      }
      peekBusy = true;
      setPeekVisible(true);
      if (dir < 0) {
        fillPeekCard(peekA, cat, from);
        fillPeekCard(peekB, cat, to);
      } else {
        fillPeekCard(peekA, cat, to);
        fillPeekCard(peekB, cat, from);
      }
      peekRail.style.transition = "none";
      peekRail.style.transform = dir < 0 ? "translate3d(0,0,0)" : "translate3d(-50%,0,0)";
      void peekRail.offsetWidth;
      peekRail.style.transition = "transform " + SWIPE_MS + "ms var(--ease-standard)";
      peekRail.style.transform = dir < 0 ? "translate3d(-50%,0,0)" : "translate3d(0,0,0)";
      spotIdx = nextIdx;
      markSpot(cat, nextIdx);
      flyToSpot(spots, nextIdx, false);
      window.setTimeout(function () {
        resetPeekRail();
        fillPeekCard(peekA, cat, to);
        peekBusy = false;
        if (done) done();
      }, SWIPE_MS + 20);
    }

    function animateRail(to, done) {
      if (railRaf) cancelAnimationFrame(railRaf);
      var from = list.scrollLeft;
      var dist = to - from;
      if (Math.abs(dist) < 2 || reduced) {
        list.scrollLeft = to;
        if (done) done();
        return;
      }
      var start = performance.now();
      function tick(now) {
        var t = clamp((now - start) / RAIL_MS, 0, 1);
        var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        list.scrollLeft = from + dist * e;
        if (t < 1) {
          railRaf = requestAnimationFrame(tick);
          return;
        }
        railRaf = 0;
        if (done) done();
      }
      railRaf = requestAnimationFrame(tick);
    }

    function markCategory(cat) {
      list.querySelectorAll(".filters__chip[data-cat]").forEach(function (c) {
        c.classList.toggle("is-on", c.dataset.cat === cat);
      });
      var facet = document.getElementById("filters-facet");
      if (facet) facet.textContent = cat || "";
    }

    function showCategory(i, opts) {
      var snap = !!(opts && opts.snap);
      var wrapping = idx >= 0 && i < idx;
      var prev = idx;
      idx = i;
      var cat = cats[idx];
      var target = wrapping && clones[idx] ? clones[idx] : chips[idx];

      if (innerWidth < 720 && target) {
        if (snap || prev < 0) {
          markCategory(cat);
          list.scrollLeft = railLeft(chips[idx]);
        } else {
          animateRail(railLeft(target), function () {
            markCategory(cat);
            if (wrapping) list.scrollLeft = railLeft(chips[idx]);
          });
          // Light the arriving chip mid-travel so the glow rides in with it
          // rather than popping on after the rail has already stopped.
          window.setTimeout(function () { markCategory(cat); }, Math.round(RAIL_MS * 0.42));
        }
      } else {
        markCategory(cat);
      }
      cats.forEach(function (c) {
        (pinsByCat[c] || []).forEach(function (el) { el.classList.toggle("is-cat-on", c === cat); });
      });
      if (!map) return;
      var spots = photoSpots(cat);
      window.clearTimeout(sheetTimer);
      window.clearTimeout(swipeTimer);
      if (snap && prev === i && spots[spotIdx]) {
        if (wrap && wrap.classList.contains("is-nav")) return;
        markSpot(cat, spotIdx);
        flyToSpot(spots, spotIdx, true);
        return;
      }
      closeNav({ silent: true });
      spotIdx = 0;
      peekBusy = false;
      resetPeekRail();
      setFiltersSheet(false);
      if (!spots.length) {
        setPeekVisible(false);
        return;
      }
      paintFiltersPeek(cat, spots[0]);
      markSpot(cat, 0);
      flyToSpot(spots, 0, snap);
      photoHops += 1;
      if (userTookOver) return;
      // First bubble, then a swipe. On Summit Treks the second card is
      // Nijagal Betta and the details sheet opens after that swipe.
      if (spots.length >= 2 && !reduced) {
        swipeTimer = window.setTimeout(function () {
          var dir = Math.random() < 0.5 ? -1 : 1;
          var next = cat === "Summit Treks" ? 1 : neighborIdx(spots, 0, dir);
          swipeTo(next, dir, function () {
            if (spots[next] && spots[next].sheet) {
              sheetTimer = window.setTimeout(function () {
                openSheetFor(spots[next]);
                sheetTimer = window.setTimeout(function () {
                  openNavFor(spots[next]);
                }, 1700);
              }, 640);
            }
          });
        }, snap ? 900 : 1600);
      }
    }

    function nextPhotoCat(from) {
      var i = from;
      var n;
      for (n = 0; n < cats.length; n += 1) {
        i = (i + 1) % cats.length;
        if (photoSpots(cats[i]).length) return i;
      }
      return (from + 1) % cats.length;
    }

    function schedule() {
      window.clearTimeout(timer);
      if (reduced || !inView || userTookOver) return;
      var cat = cats[idx] || "";
      var spots = photoSpots(cat);
      var sheetOn = wrap && wrap.classList.contains("is-sheet");
      var navOn = wrap && wrap.classList.contains("is-nav");
      var dwell = navOn ? 5200 : sheetOn || (spots[1] && spots[1].sheet) ? 10000 : 4200;
      timer = window.setTimeout(function () {
        showCategory(nextPhotoCat(idx));
        schedule();
      }, dwell);
    }

    function bootChips() {
      var start = cats.indexOf("Summit Treks");
      showCategory(start >= 0 ? start : 0, { snap: true });
      schedule();
    }

    function bindPeekGestures() {
      if (!peekEl) return;
      var dragId = null;
      var startX = 0;
      var startY = 0;
      var lastDx = 0;

      function currentSpots() {
        return photoSpots(cats[idx] || "");
      }

      function layoutDrag(dx) {
        if (!peekRail || !peekA || !peekB) return;
        var spots = currentSpots();
        if (spots.length < 2) return;
        var w = peekEl.clientWidth || 200;
        var clamped = Math.max(-w, Math.min(w, dx));
        peekRail.style.transition = "none";
        if (clamped < 0) {
          fillPeekCard(peekA, cats[idx], spots[spotIdx]);
          fillPeekCard(peekB, cats[idx], spots[neighborIdx(spots, spotIdx, -1)]);
          peekRail.style.transform = "translate3d(" + clamped + "px,0,0)";
        } else {
          fillPeekCard(peekA, cats[idx], spots[neighborIdx(spots, spotIdx, 1)]);
          fillPeekCard(peekB, cats[idx], spots[spotIdx]);
          peekRail.style.transform = "translate3d(" + (-w + clamped) + "px,0,0)";
        }
      }

      function settle(e, cancelled) {
        if (dragId === null || e.pointerId !== dragId) return;
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        var w = peekEl.clientWidth || 200;
        var threshold = Math.min(56, Math.max(28, w * 0.18));
        dragId = null;
        peekEl.classList.remove("is-dragging");
        if (peekEl.hasPointerCapture && peekEl.hasPointerCapture(e.pointerId)) {
          peekEl.releasePointerCapture(e.pointerId);
        }
        var spots = currentSpots();
        if (!cancelled && spots.length >= 2 && Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * 1.05) {
          var dir = dx < 0 ? -1 : 1;
          swipeTo(neighborIdx(spots, spotIdx, dir), dir);
          return;
        }
        resetPeekRail();
        paintFiltersPeek(cats[idx], spots[spotIdx]);
      }

      peekEl.addEventListener("dragstart", function (e) { e.preventDefault(); });
      peekEl.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if (e.target.closest(".lh__go")) return;
        if (wrap && wrap.classList.contains("is-sheet")) return;
        var spots = currentSpots();
        if (spots.length < 2 || peekBusy) return;
        userTookOver = true;
        window.clearTimeout(timer);
        window.clearTimeout(swipeTimer);
        window.clearTimeout(sheetTimer);
        dragId = e.pointerId;
        startX = e.clientX;
        startY = e.clientY;
        lastDx = 0;
        peekEl.classList.add("is-dragging");
        if (peekEl.setPointerCapture) peekEl.setPointerCapture(e.pointerId);
      });
      peekEl.addEventListener("pointermove", function (e) {
        if (dragId === null || e.pointerId !== dragId) return;
        lastDx = e.clientX - startX;
        var dy = e.clientY - startY;
        if (Math.abs(lastDx) < 4 || Math.abs(lastDx) <= Math.abs(dy)) return;
        e.preventDefault();
        layoutDrag(lastDx);
      });
      peekEl.addEventListener("pointerup", function (e) { settle(e, false); });
      peekEl.addEventListener("pointercancel", function (e) { settle(e, true); });
      peekEl.addEventListener("click", function (e) {
        var go = e.target.closest(".lh__go");
        if (!go) return;
        e.preventDefault();
        var spots = currentSpots();
        var spot = spots[spotIdx];
        if (spot && spot.img) {
          userTookOver = true;
          window.clearTimeout(timer);
          window.clearTimeout(swipeTimer);
          openSheetFor(spot);
        }
      });
      function closeDetails() {
        closeNav();
        setFiltersSheet(false);
        if (!userTookOver) schedule();
      }
      var closeBtn = document.querySelector("#filters-sheet .filters__sheet-x");
      if (closeBtn) closeBtn.addEventListener("click", closeDetails);
      var sheetGo = document.getElementById("filters-sheet-go");
      if (sheetGo) {
        sheetGo.addEventListener("click", function () {
          var spots = currentSpots();
          var spot = spots[spotIdx];
          if (!spot || !spot.img) return;
          userTookOver = true;
          window.clearTimeout(timer);
          window.clearTimeout(sheetTimer);
          openNavFor(spot);
        });
      }
      var navBack = document.getElementById("filters-nav-back");
      var navDone = document.getElementById("filters-nav-done");
      if (navBack) navBack.addEventListener("click", closeDetails);
      if (navDone) navDone.addEventListener("click", closeDetails);
    }
    bindPeekGestures();

    var themeBtn = document.getElementById("themeToggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", function () {
        if (!map || !map.getLayer("nav-route-line")) return;
        try { map.setPaintProperty("nav-route-line", "line-color", navLineColor()); } catch (e) { /* ok */ }
      });
    }

    if (map) {
      map.once("style.load", function () {
        try { map.setPaintProperty("background", "background-color", "#0F0F12"); } catch (e) { /* style id drift */ }
        try { map.setPaintProperty("water", "fill-color", "#15151a"); } catch (e) { /* style id drift */ }
        var layers = (map.getStyle() && map.getStyle().layers) || [];
        layers.forEach(function (layer) {
          if (layer.type === "symbol") {
            try { map.setLayoutProperty(layer.id, "visibility", "none"); } catch (e) { /* ok */ }
          }
        });
        ready = true;
        wrap.classList.add("is-live");
        function sizeMap() {
          map.resize();
          if (idx >= 0) showCategory(idx, { snap: true });
        }
        cats.forEach(function (cat) {
          pinsByCat[cat] = photoSpots(cat).map(function (spot, i) {
            var el = makeFiltersPin(spot, i);
            if (!el) return null;
            new window.maplibregl.Marker({ element: el, anchor: "bottom" })
              .setLngLat([spot.lon, spot.lat])
              .addTo(map);
            return el;
          }).filter(Boolean);
        });

        ensureNavLayer();
        bootChips();
        sizeMap();
        requestAnimationFrame(sizeMap);
        window.setTimeout(sizeMap, 280);
      });
    } else {
      bootChips();
    }

    var moodSection = document.getElementById("mood");
    var observeEl = moodSection || wrap || list;
    if ("IntersectionObserver" in window && observeEl) {
      var io = new IntersectionObserver(function (entries) {
        inView = entries.some(function (e) { return e.isIntersecting; });
        if (inView) {
          if (map) map.resize();
          schedule();
        } else {
          window.clearTimeout(timer);
        }
      }, { threshold: 0.08 });
      io.observe(observeEl);
    }

    window.addEventListener("resize", function () {
      if (map) map.resize();
      if (idx >= 0) showCategory(idx, { snap: true });
    });
    if (map && typeof ResizeObserver !== "undefined") {
      new ResizeObserver(function () { map.resize(); }).observe(wrap);
    }
  }

  function bootFiltersMap() {
    if (!document.getElementById("filters-list")) return;
    var mood = document.getElementById("mood");
    if (!mood || !("IntersectionObserver" in window)) {
      initFiltersMap();
      return;
    }
    var filtersIo = new IntersectionObserver(function (entries) {
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      filtersIo.disconnect();
      initFiltersMap();
    }, { rootMargin: "480px 0px" });
    filtersIo.observe(mood);
  }

  (function armSectionPosters() {
    ["mood", "clock", "vote"].forEach(function (id) {
      var section = document.getElementById(id);
      if (!section) return;
      var vid = section.querySelector("video");
      var poster = vid && vid.getAttribute("data-poster");
      if (!poster) return;
      function paint() {
        var host = section.querySelector(".filters__bg, .pitch__bg, .stage__bg");
        if (!host || host.getAttribute("data-posted")) return;
        host.setAttribute("data-posted", "1");
        host.style.backgroundImage = 'url("' + poster + '")';
      }
      if (!("IntersectionObserver" in window)) {
        paint();
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        if (!entries.some(function (e) { return e.isIntersecting; })) return;
        io.disconnect();
        paint();
      }, { rootMargin: "200px 0px" });
      io.observe(section);
    });
  })();

  (function loopSectionFilms() {
    if (reduced || saveData) return;
    var desktop = innerWidth >= 721 && !liteFx;
    var films = [
      { id: "hero", sel: ".hero__bg-vid" },
      { id: "mood", sel: ".filters__bg-vid" },
      { id: "vote", sel: ".stage__bg-vid" }
    ];
    // Desktop: 4K. Phone: 1080p (the -uhd cuts). 540p is only a last-resort
    // fallback. Mobile still waits for canplaythrough so a 4–9MB file does
    // not start on a thin buffer the way 4K did.
    function pickFilmSrc(vid) {
      var sm = vid.getAttribute("data-src-sm") || vid.getAttribute("data-src") || "";
      var hd = vid.getAttribute("data-src-hd") || sm;
      var fhd = vid.getAttribute("data-src-fhd") || hd;
      var fourk = vid.getAttribute("data-src-4k") || vid.getAttribute("data-src-uhd");
      if (innerWidth >= 721 && !liteFx) return fourk || fhd;
      return fhd || hd || sm;
    }
    function watchFilm(film) {
      var section = document.getElementById(film.id);
      if (!section) return;
      var vid = section.querySelector(film.sel);
      if (!vid) return;
      var src = pickFilmSrc(vid);
      if (!src) return;
      var mobile = innerWidth < 721;
      var armed = false;
      var inView = false;
      var tries = 0;
      vid.muted = true;
      vid.defaultMuted = true;
      vid.playsInline = true;
      vid.setAttribute("playsinline", "");
      vid.setAttribute("webkit-playsinline", "");
      vid.loop = true;
      vid.preload = "none";

      function arm() {
        if (armed) return;
        armed = true;
        vid.preload = "auto";
        vid.src = src;
        try { vid.load(); } catch (err) { /* older WebViews */ }
      }
      function playNow() {
        if (!inView) return;
        var p = vid.play();
        if (p && p.catch) p.catch(function () { /* autoplay blocked — poster stays */ });
      }
      function playWhenReady() {
        if (!inView) return;
        arm();
        // Phones need a real buffer (HAVE_ENOUGH_DATA) or they start, starve,
        // fire waiting, and the loop looks like stop-play-stop.
        var enough = mobile ? 4 : 3;
        if (vid.readyState >= enough) {
          playNow();
          return;
        }
        vid.addEventListener(mobile ? "canplaythrough" : "canplay", playNow, { once: true });
      }
      vid.addEventListener("playing", function () {
        vid.classList.add("is-on");
      });
      vid.addEventListener("waiting", function () {
        if (!mobile) return;
        vid.removeEventListener("canplaythrough", playNow);
        vid.addEventListener("canplaythrough", playNow, { once: true });
      });
      vid.addEventListener("error", function () {
        if (tries >= 2) return;
        tries += 1;
        armed = false;
        window.setTimeout(function () {
          if (inView) playWhenReady();
        }, 600 * tries);
      });
      function enter() {
        inView = true;
        playWhenReady();
      }
      function leave() {
        inView = false;
        vid.pause();
      }
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          if (entries.some(function (e) { return e.isIntersecting; })) enter();
          else leave();
        }, { rootMargin: "480px 0px", threshold: 0.02 });
        io.observe(section);
      } else {
        enter();
      }
      // 4K Moody is ~11MB — do not race the hero map. The 480px
      // rootMargin starts it as slide 2 approaches.
      if (desktop && film.id === "mood" && src.indexOf("-4k.") === -1) arm();
    }
    function startFilms() {
      films.forEach(watchFilm);
    }
    // Don't steal bandwidth from the hero map on first paint. Mood sits
    // immediately under a 100vh hero, so even a small rootMargin would fire
    // at load and race OpenFreeMap tiles.
    if (heroLoaderDone) startFilms();
    else document.addEventListener(HERO_LOADER_DONE_EVENT, startFilms, { once: true });
  })();

  /* ---------- Click sonar ---------- */
  if (!reduced) {
    document.addEventListener('pointerdown', function (e) {
      if (document.documentElement.classList.contains("is-theme-air")) return;
      var ring = document.createElement('span');
      ring.className = 'sonar-ring';
      ring.style.left = e.clientX + 'px';
      ring.style.top = e.clientY + 'px';
      document.body.appendChild(ring);
      setTimeout(function () { ring.remove(); }, 750);
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduced) {
    document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
      var strength = 0.32;
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = 'translate(' + (dx * strength) + 'px,' + (dy * strength) + 'px)';
      });
      btn.addEventListener('pointerleave', function () {
        btn.style.transform = 'translate(0,0)';
      });
    });
  }

  /* ---------- Waitlist — signup, then the invite loop ----------
     The share panel is the point, not a courtesy. Stage 0 of the marketing plan
     rehearses the vote loop before the app exists, which is the only chance to
     read invite propensity *before* the launch budget is spent. So the highest-
     intent moment on the page — the second after someone joins — hands them a
     link and a group to send it to, rather than "we'll email you." */

  var REF_KEY = 'lh_ref';
  var ME_KEY = 'lh_wl';

  // Referral code off the URL (?r=CODE), remembered so it survives the visitor
  // reading the whole page, closing the tab, and coming back to sign up later.
  try {
    var urlRef = new URLSearchParams(location.search).get('r');
    if (urlRef && /^[A-Za-z0-9]{4,12}$/.test(urlRef)) {
      localStorage.setItem(REF_KEY, urlRef.toUpperCase());
    }
  } catch (err) { /* private mode — the loop still works, attribution just doesn't */ }

  var readStore = function (key) {
    try { return localStorage.getItem(key); } catch (err) { return null; }
  };

  var shareEl = document.getElementById('wshare');
  var shareKicker = document.getElementById('wshare-kicker');
  var shareLede = document.getElementById('wshare-lede');
  var shareLink = document.getElementById('wshare-link');
  var shareCount = document.getElementById('wshare-count');
  var shareCopy = document.getElementById('wshare-copy');
  var shareWa = document.getElementById('wshare-wa');
  var shareProgress = document.getElementById('wshare-progress');
  var shareInboxNote = document.getElementById('wshare-inbox-note');

  var inviteUrl = function (code) {
    return 'https://letsgolighthouse.co.in/?r=' + code;
  };

  var renderShare = function (data) {
    if (!shareEl || !data || !data.code) return;
    var url = inviteUrl(data.code);
    var goal = data.goal || 3;
    var got = Math.min(data.referrals || 0, goal);

    // A returning visitor re-submitting their own email isn't a fresh join —
    // say so, instead of replaying copy that implies they just signed up.
    if (shareKicker) {
      shareKicker.innerHTML = data.returning
        ? 'ALREADY IN <span class="wshare__spark">✦</span>'
        : "YOU'RE ON THE LIST <span class=\"wshare__spark\">✦</span>";
    }
    if (shareLede) {
      shareLede.innerHTML = data.returning
        ? "No need to sign up twice — we've got you. Here's your invite link, same as before."
        : "Bangalore opens in waves, not all at once. Invite 3 friends with "
          + "your link and <em>you</em> skip straight to the first wave — "
          + "they'll need their own 3 to do the same.";
    }

    // Verified only ever arrives from verified.html seeding localStorage after
    // a real email click — join_waitlist()'s own response never sets it, so a
    // brand-new signup correctly still shows the reminder below.
    if (shareInboxNote) shareInboxNote.hidden = !!data.verified;

    if (shareLink) shareLink.textContent = url.replace(/^https:\/\//, '');
    if (shareCount) {
      shareCount.textContent = got >= goal
        ? "YOU SKIPPED THE LINE"
        : got + ' OF ' + goal + ' JOINED';
    }
    if (shareProgress) {
      shareProgress.querySelectorAll('.wshare__dot').forEach(function (dot, i) {
        dot.classList.toggle('is-on', i < got);
      });
      shareProgress.classList.toggle('is-complete', got >= goal);
    }
    if (shareWa) {
      var msg = 'The weekend is already on the map — Bangalore getaways with drive '
        + 'times and a group vote so nobody has to say "up to you". '
        + 'Joining the early list: ' + url;
      shareWa.href = 'https://wa.me/?text=' + encodeURIComponent(msg);
    }

    // The nav and closing CTAs are a redundant ask once you've joined — point them
    // at the loop instead. The pricing CTAs are deliberately excluded: "Claim 30
    // days free" is a different offer, not a second copy of the join button, and
    // rewriting it to "Invite your group" silently destroyed the Pro card's ask.
    document
      .querySelectorAll('[data-scrollto][href="#join"]:not(.plan__cta)')
      .forEach(function (cta) {
        cta.textContent = got >= goal ? 'Invite more people' : 'Invite your group';
      });

    shareEl.hidden = false;
  };

  var bouncenote = document.getElementById('bouncenote');

  // A bounce is never knowable at signup — Resend only confirms it handed the
  // email off, not that the mailbox exists; the real answer lands async, via
  // resend-webhook, sometime after this visitor has already left. So this is
  // the moment that finds out: whatever the form remembered gets clean-slated
  // and the visitor is put back in front of the join form with a reason why.
  var handleBounce = function () {
    try { localStorage.removeItem(ME_KEY); } catch (err) { /* private mode */ }
    if (shareEl) shareEl.hidden = true;
    document.querySelectorAll('.waitlist').forEach(function (f) { f.hidden = false; });
    if (bouncenote) bouncenote.hidden = false;
  };

  // Someone who already joined shouldn't be asked to join again — show them their
  // link and their current count straight away.
  var mine = readStore(ME_KEY);
  if (mine) {
    try {
      var saved = JSON.parse(mine);
      if (saved && saved.code) {
        renderShare(saved);
        document.querySelectorAll('.waitlist').forEach(function (f) { f.hidden = true; });

        // Refresh against the server once the cached render is already on
        // screen — this is a background correction, not something the visit
        // waits on. If it fails (offline, RLS hiccup) the cached view just
        // stays as-is, which is the same experience as before this existed.
        fetch(
          'https://axsgjzhdlhlkpkydqxbp.supabase.co/rest/v1/rpc/check_waitlist_status',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Same publishable key main.js already ships lower down for
              // join_waitlist — duplicated rather than shared, since WAITLIST
              // isn't declared until further down this same script and this
              // runs before that assignment executes.
              apikey: 'sb_publishable_h2budOgii7_5LbHnFQhOmQ_E42LaD2G',
              Authorization: 'Bearer sb_publishable_h2budOgii7_5LbHnFQhOmQ_E42LaD2G'
            },
            body: JSON.stringify({ p_code: saved.code })
          }
        ).then(function (res) { return res.json(); }).then(function (status) {
          if (!status || status.ok === false) return;
          if (status.bounced) {
            handleBounce();
            return;
          }
          saved.referrals = status.referrals;
          saved.verified = status.verified;
          try { localStorage.setItem(ME_KEY, JSON.stringify(saved)); } catch (err) { /* private mode */ }
          renderShare(saved);
        }).catch(function () { /* stale cache is fine, next visit tries again */ });
      }
    } catch (err) { /* corrupt cache — just show the form */ }
  }

  // A referral code on the URL means someone specific sent this visitor here.
  // No identity shown — the referrer's email is private, and RLS blocks reading
  // it back out anyway — just a nudge that this wasn't a random link.
  var refnote = document.getElementById('refnote');
  if (refnote && !mine && readStore(REF_KEY)) {
    refnote.hidden = false;
  }

  if (shareCopy && shareLink) {
    shareCopy.addEventListener('click', function () {
      var text = 'https://' + shareLink.textContent.trim();
      var done = function () {
        shareCopy.textContent = 'Copied';
        setTimeout(function () { shareCopy.textContent = 'Copy'; }, 1800);
      };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(done).catch(done);
      } else {
        done();
      }
    });
  }

  /* ---------- Where a signup actually goes ----------
     `functions/api/waitlist.js` is a Cloudflare Pages Function and this site is
     served by GitHub Pages, which executes no server code — so /api/waitlist
     404s in production and every signup made on the live site was lost. Nothing
     on the page said so: the fetch failed, the error note read "couldn't reach
     the lighthouse", and it looked like a network blip rather than a form with
     no backend at all.

     Pick ONE below by uncommenting it, then redeploy. All three speak the same
     contract — POST a JSON body, get back { code, referrals, goal } — because
     that response is what renders the referral panel, so a fire-and-forget
     endpoint (a plain Google Form post, say) cannot be substituted here without
     the share loop losing the code it is built to show.

     Setup for the two static-host options lives next to this file:
       scripts/waitlist-sheet.gs     — Google Apps Script + a Sheet
       scripts/waitlist-supabase.sql — Supabase (real Postgres, RLS-locked) */

  var WAITLIST = {
    // (a) CLOUDFLARE PAGES — correct only if the site moves back to CF Pages.
    // url: '/api/waitlist',
    // headers: { 'Content-Type': 'application/json' },
    // body: function (email, role, ref) {
    //   return { email: email, role: role, ref: ref };
    // }

    // (b) GOOGLE APPS SCRIPT → SHEET. Paste the /exec URL from the deployment.
    //     text/plain is deliberate: it keeps the POST inside the CORS "simple
    //     request" rules so no preflight is sent. Apps Script cannot answer a
    //     preflight OPTIONS, so application/json fails before reaching the code.
    // url: 'https://script.google.com/macros/s/PASTE_DEPLOYMENT_ID/exec',
    // headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    // body: function (email, role, ref) {
    //   return { email: email, role: role, ref: ref, ua: navigator.userAgent };
    // }

    // (c) SUPABASE RPC. The publishable key below is meant to ship in client
    //     code — the table has RLS on with no policy, so it can only call
    //     join_waitlist() and can never read the list. Verified, not assumed:
    //     GET /rest/v1/waitlist with this key returns 401 permission denied.
    //     Never put the service_role (or legacy `service_key`) here; that one
    //     bypasses RLS entirely and would hand the whole list to anyone.
    url: 'https://axsgjzhdlhlkpkydqxbp.supabase.co/rest/v1/rpc/join_waitlist',
    headers: {
      'Content-Type': 'application/json',
      apikey: 'sb_publishable_h2budOgii7_5LbHnFQhOmQ_E42LaD2G',
      Authorization: 'Bearer sb_publishable_h2budOgii7_5LbHnFQhOmQ_E42LaD2G'
    },
    body: function (email, role, ref) {
      return { p_email: email, p_role: role, p_ref: ref, p_ua: navigator.userAgent };
    }
  };

  document.querySelectorAll('.waitlist').forEach(function (form) {
    var input = form.querySelector('.waitlist__input');
    var noteIdle = form.querySelector('[data-state-idle]');
    var noteErr = form.querySelector('[data-state-err]');
    var btnLabel = form.querySelector('.waitlist__btn-label');
    var role = null;

    // Role is optional on purpose: one organizer is worth 3-8 installs and is the
    // only credible Pro buyer, so knowing which is which turns the list into a
    // launch *sequence* — but making it required would cost signups to buy that.
    form.querySelectorAll('.rolepill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        var next = pill.dataset.role;
        role = role === next ? null : next;
        form.querySelectorAll('.rolepill').forEach(function (p) {
          var on = role !== null && p.dataset.role === role;
          p.classList.toggle('is-on', on);
          p.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      });
    });

    var setState = function (state) {
      if (noteIdle) noteIdle.hidden = state !== 'idle';
      if (noteErr) noteErr.hidden = state !== 'err';
    };

    var succeed = function (data) {
      form.hidden = true;
      try { localStorage.setItem(ME_KEY, JSON.stringify(data)); } catch (err) { /* ignore */ }
      renderShare(data);
      if (shareEl && typeof shareEl.scrollIntoView === 'function') {
        shareEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        input.focus();
        setState('err');
        if (noteErr) noteErr.textContent = 'THAT EMAIL DOESN’T LOOK RIGHT';
        return;
      }
      if (btnLabel) btnLabel.textContent = 'Lighting up…';

      if (isLocal) {
        // Dev preview: exercise the real share panel with an obviously fake code,
        // so the loop can be looked at locally without writing to KV.
        setTimeout(function () {
          succeed({ code: 'DEVCODE', referrals: 1, goal: 3, dev: true });
          if (shareLink) shareLink.textContent = 'DEV PREVIEW — NOT SAVED';
        }, 500);
        return;
      }

      fetch(WAITLIST.url, {
        method: 'POST',
        headers: WAITLIST.headers,
        body: JSON.stringify(WAITLIST.body(email, role, readStore(REF_KEY) || ''))
      }).then(function (res) {
        if (!res.ok) throw new Error('bad status ' + res.status);
        return res.json();
      }).then(function (data) {
        // Cloudflare signalled a rejection with the HTTP status. The two static
        // backends cannot always do that — an Apps Script web app answers 200
        // even when it refused — so the body is the authority. Without this a
        // rejected signup renders the share panel with an empty referral code.
        if (!data || data.ok === false || !data.code) {
          throw new Error(data && data.error ? data.error : 'no_code');
        }
        succeed(data);
      }).catch(function () {
        setState('err');
        if (noteErr) noteErr.textContent = 'COULDN’T REACH THE LIGHTHOUSE — TRY AGAIN';
        if (btnLabel) btnLabel.textContent = 'Get early access';
      });
    });
  });

  /* ---------- Next long weekend ----------
     "Calendar ownership" is a real moat line in the business plan — long weekend
     = Lighthouse — but nothing on this page ever said the product is for a thing
     that comes back. Every other promise here is one trip. This is the closer's
     own argument: there is a next one, it has a date, and it is close.

     Only FIXED-DATE national holidays are listed. Diwali, Dussehra and Holi move
     with the lunar calendar and would need a real table to state correctly, so
     they are left out rather than approximated — the counter may miss a long
     weekend, but it will never print a wrong date. */
  (function () {
    var host = document.getElementById('closeWeekend');
    if (!host) return;

    var FIXED = [
      { m: 1,  d: 1,  name: 'New Year' },
      { m: 1,  d: 26, name: 'Republic Day' },
      { m: 8,  d: 15, name: 'Independence Day' },
      { m: 10, d: 2,  name: 'Gandhi Jayanti' },
      { m: 12, d: 25, name: 'Christmas' }
    ];

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var best = null;
    for (var y = today.getFullYear(); y <= today.getFullYear() + 1 && !best; y++) {
      FIXED.map(function (h) {
        return { when: new Date(y, h.m - 1, h.d), name: h.name };
      }).filter(function (h) {
        // A long weekend needs the holiday to touch a weekend: Fri or Mon makes
        // three days, Tue or Thu makes four with one bridge day taken.
        var wd = h.when.getDay();
        return h.when >= today && (wd === 1 || wd === 2 || wd === 4 || wd === 5);
      }).sort(function (a, b) {
        return a.when - b.when;
      }).some(function (h) {
        best = h;
        return true;
      });
    }
    if (!best) return;

    var days = Math.round((best.when - today) / 86400000);
    var wd = best.when.getDay();
    var span = wd === 1 || wd === 5 ? 'three days' : 'four days';

    var nameEl = document.getElementById('closeWeekendName');
    var daysEl = document.getElementById('closeWeekendDays');
    if (nameEl) {
      nameEl.textContent = best.name + ' — ' + span + ', ' +
        best.when.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
    }
    if (daysEl) {
      daysEl.textContent = days === 0 ? 'today' : days === 1 ? 'tomorrow' : days + ' days away';
    }
    host.hidden = false;
  })();

  /* ---------- Explore peek + pin (one index) ---------- */
  var PLACES = [
    {
      name: "Skandagiri",
      meta: "1h 30m · 68 km",
      city: "Chikballapur",
      cat: "TREK",
      x: 36, y: 26,
      lat: 13.417256, lon: 77.682669,
      img: "/assets/places/skandagiri.jpg",
      notes: [
        "Camping on the summit is no longer allowed — there-and-back by breakfast",
        "Start the climb at 2 or 3 AM with a headlamp",
        "Loose granite switchbacks; the trail skirts sheer drops",
        "The descent in daylight shows how exposed the ridge actually is",
        "Kalavara Durga fort ruins sit on the ridge — crumbling walls, watch your footing",
        "The trail is unlit until sunrise; a headlamp is not optional"
      ]
    },
    {
      name: "Makalidurga",
      meta: "1h 31m · 68 km",
      city: "Gunjuru",
      cat: "TREK",
      x: 26, y: 22,
      lat: 13.432865, lon: 77.501498,
      img: "/assets/places/makalidurga.jpg",
      notes: [
        "Parking is a dirt clearing near the village temple, free, room for a dozen cars",
        "No shade on the climb — start before sunrise in the dry months",
        "No shops past the trailhead village; carry water and breakfast",
        "Granite is slick with dew in the first hour after sunrise, grippy once dry",
        "No railing anywhere near the summit edge — it rewards care more than speed",
        "Nothing sold past the village; carry water the whole way"
      ]
    },
    {
      name: "Savandurga",
      meta: "57m · 43 km",
      city: "Magadi",
      cat: "TREK",
      x: 22, y: 54,
      lat: 12.915961, lon: 77.297772,
      img: "/assets/places/savandurga.jpg",
      notes: [
        "Bare granite is slick with dew for the first hour or two after sunrise — go slow or wait it out",
        "No marked trail or railings; a local guide is worth it for a first climb",
        "Forest checkpost may ask for a small entry fee",
        "No shops on the hill — carry water and breakfast, eat it at the top",
        "Forest department permission is worth having for the fort-side approach",
        "The rock holds overnight dew well after sunrise — a slick slope with no railing"
      ]
    },
    {
      name: "Om Beach",
      meta: "9h · 480 km",
      city: "Gokarna",
      cat: "COAST",
      x: 82, y: 46,
      lat: 14.5222, lon: 74.3175,
      img: "/assets/places/ombeach.jpg",
      rain: true,
      notes: [
        "Paid parking at the cliff-tops near Om Beach and Kudle — packed by noon on long weekends",
        "This is an overnight coastal run, not a same-day",
        "Humidity on the coast hits after the cool forest air — hydrate the last 100 km",
        "Hike down to the crescent; the cliff cafes face the sunset"
      ]
    },
    {
      name: "Rayakottai Fort",
      meta: "2h · 90 km",
      city: "Rayakottai",
      cat: "FORT",
      x: 58, y: 62,
      lat: 12.521642, lon: 78.037022,
      img: "/assets/places/rayakottai.jpg",
      notes: [
        "Bikes and cars park near the base of the hill in town",
        "The path is exposed to the sun — start early",
        "No entry fee or formal permit",
        "Basic food and water in Rayakottai town, nothing on the hill"
      ]
    },
    {
      name: "Kapu Lighthouse",
      meta: "8h · 400 km",
      city: "Udupi",
      cat: "COAST",
      x: 74, y: 58,
      lat: 13.2241, lon: 74.7380,
      img: "/assets/places/kapu.jpg",
      notes: [
        "Park metres from the sand — then climb the spiral before golden hour",
        "Gale on the balcony; ocean on one side, palms inland",
        "NH66 from Mangalore is the last blast of coast highway",
        "Udupi station is a 20-minute ride if you take the overnight train"
      ]
    }
  ];

  /* Corner Craving — catalog `Corner Carving`. Seven nearest, all with
     local Commons thumbs (see assets/places/ATTRIBUTION.txt). */
  var CRAVE_PLACES = [
    {
      name: "Devarayanadurga",
      meta: "1h 40m · 75 km",
      city: "Tumkur",
      cat: "CORNER CRAVING",
      lat: 13.3719, lon: 77.2096,
      img: "/assets/places/devarayanadurga.jpg",
      notes: [
        "Highway is fast; the last ascent is narrow, steep, first-and-second gear",
        "Tight parking at Yoga Narasimha temple — jammed after 10 AM on Sundays",
        "Forest hairpins stay damp and slippery under the canopy in the morning",
        "Monkeys on the bends — visor down if you stop"
      ]
    },
    {
      name: "Jogimatti",
      meta: "2h 17m · 103 km",
      city: "Chitradurga",
      cat: "CORNER CRAVING",
      lat: 14.176981, lon: 76.388974,
      img: "/assets/places/jogimatti.jpg",
      notes: [
        "Register at the forest gate at the base",
        "Entry can close Feb–May for fire risk",
        "Leopard and bear country — don't linger after dark",
        "Nothing at the top; no cafes"
      ]
    },
    {
      name: "Muthathi River Bank",
      meta: "2h 30m · 105 km",
      city: "Malavalli",
      cat: "CORNER CRAVING",
      lat: 12.305418, lon: 77.311772,
      img: "/assets/places/muthathi.jpg",
      notes: [
        "Kanakapura Road, then left at Sathanur into the sanctuary",
        "Narrow twisting single-lane — keep it in a low gear",
        "Unpaved parking along the riverbanks",
        "A legendary ribbon of tarmac through the forest"
      ]
    },
    {
      name: "Alangayam Ghat",
      meta: "3h 48m · 171 km",
      city: "Alangayam",
      cat: "CORNER CRAVING",
      lat: 12.622667, lon: 78.752504,
      img: "/assets/places/alangayam.jpg",
      notes: [
        "Excellent tarmac; forest debris in the corners after rain",
        "Almost nothing to eat — carry water",
        "Signal holds for most of the climb",
        "Observatory access is restricted"
      ]
    },
    {
      name: "Kinnakorai",
      meta: "6h 20m · 285 km",
      city: "Manjoor",
      cat: "CORNER CRAVING",
      lat: 11.222806, lon: 76.664879,
      img: "/assets/places/kinnakorai.jpg",
      notes: [
        "Last village before the Kerala border — tarmac ends at the drop",
        "Hours from help if something breaks",
        "The village shop may or may not be open",
        "Misjudge daylight and it's a long, slow ride back"
      ]
    },
    {
      name: "Jatinga Rameshwara",
      meta: "6h 32m · 294 km",
      city: "Ramapura",
      cat: "CORNER CRAVING",
      lat: 14.850082, lon: 76.790518,
      img: "/assets/places/jatinga.jpg",
      notes: [
        "Narrow hill road, honk the hairpins",
        "Monkeys at the summit — food out of sight",
        "Bike parking at the temple",
        "Carry snacks; almost nothing sold up there"
      ]
    },
    {
      name: "Kakkadampoyil Ghat",
      meta: "7h 1m · 316 km",
      city: "Kakkadampoyil",
      cat: "CORNER CRAVING",
      lat: 11.335265, lon: 76.110903,
      img: "/assets/places/kakkadampoyil.jpg",
      rain: true,
      notes: [
        "Tight hairpins, steep sections — brakes and cooling first",
        "Afternoon fog can drop visibility to metres",
        "Phone signal is intermittent on the climb",
        "Shoulder pull-offs if you need to wait it out"
      ]
    }
  ];

  var peekIdx = 0;
  var peekUser = false;
  var peekTimer = 0;
  var gtkTimer = 0;
  var gtkPool = [];
  var gtkOffset = 0;
  var GTK_SHOW = 4;
  var wxCache = {};
  var wxHours = [];
  var wxGeom = null;
  var exploreMap = null;
  var explorePins = [];
  var track = document.getElementById("lh-track");
  var mapEl = document.getElementById("lh-map");
  var wxEl = document.getElementById("lh-wx");
  var CARD_W = 100 / CRAVE_PLACES.length;

  function explorePad() {
    return { top: 88, bottom: 168, left: 20, right: 20 };
  }

  function pinHtml(p, i) {
    var dot = p.img
      ? '<img class="lh__dot" alt="" src="' + p.img + '" />'
      : '<span class="lh__dot"></span>';
    return '<div class="lh__pin' + (i === 0 ? " is-on" : "") + '" data-pin="' + i + '">' +
      '<div class="lh__bubble">' + dot + "<span><b>" + p.name + "</b><small>" + p.meta + "</small></span></div></div>";
  }

  function renderExplore() {
    if (!track) return;
    track.style.width = (CRAVE_PLACES.length * 100) + "%";
    track.innerHTML = CRAVE_PLACES.map(function (p) {
      var thumb = p.img
        ? '<img class="lh__thumb" alt="" src="' + p.img + '" width="80" height="80" />'
        : '<span class="lh__thumb lh__thumb--empty" aria-hidden="true"></span>';
      return '<div class="lh__card" style="width:' + CARD_W + '%"><div class="lh__card-inner">' +
        thumb +
        '<div class="lh__copy"><h3>' + p.name + "</h3><p>" + p.meta + " · " + p.city + '</p><span class="lh__tag">' + p.cat + "</span></div>" +
        '<span class="lh__go">Let\'s go</span></div></div>';
    }).join("");
  }

  function flyExplore(i, duration) {
    if (!exploreMap) return;
    var p = CRAVE_PLACES[i];
    exploreMap.easeTo({
      center: [p.lon, p.lat],
      zoom: 11.05,
      duration: reduced ? 0 : duration,
      padding: explorePad(),
      essential: true
    });
  }

  function setPeek(i, fromUser) {
    peekIdx = (i + CRAVE_PLACES.length) % CRAVE_PLACES.length;
    if (fromUser) peekUser = true;
    var p = CRAVE_PLACES[peekIdx];
    if (track) track.style.transform = "translateX(" + (-peekIdx * CARD_W) + "%)";
    explorePins.forEach(function (el, n) {
      el.classList.toggle("is-on", n === peekIdx);
    });
    flyExplore(peekIdx, 440);
    if (mapEl && !reduced) {
      mapEl.classList.add("is-pulse");
      setTimeout(function () { mapEl.classList.remove("is-pulse"); }, 440);
    }
    if (wxEl) wxEl.classList.toggle("is-rain", !reduced && !!p.rain);
    if (document.getElementById("gtk-list")) startGtk(p.notes);
    if (document.getElementById("wx")) loadWeather(p);
  }

  function initExploreMap() {
    var gl = document.getElementById("lh-gl");
    if (!gl || !window.maplibregl) return;
    var first = CRAVE_PLACES[0];
    exploreMap = new window.maplibregl.Map({
      container: gl,
      style: HERO_STYLE,
      center: [first.lon, first.lat],
      zoom: 11.05,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      failIfMajorPerformanceCaveat: false
    });
    window.setTimeout(function () {
      if (gl.querySelector("canvas")) return;
      try { exploreMap.setStyle(HERO_RASTER); } catch (err) { /* keep waiting */ }
    }, 4000);
    exploreMap.once("style.load", function () {
      paintHeroMap(exploreMap);
      exploreMap.resize();
      exploreMap.jumpTo({
        center: [first.lon, first.lat],
        zoom: 11.05,
        padding: explorePad()
      });
      CRAVE_PLACES.forEach(function (p, i) {
        var wrap = document.createElement("div");
        wrap.innerHTML = pinHtml(p, i);
        var el = wrap.firstChild;
        explorePins.push(el);
        new window.maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([p.lon, p.lat])
          .addTo(exploreMap);
      });
    });
    window.addEventListener("resize", function () {
      if (exploreMap) exploreMap.resize();
    });
  }

  function shuffle(arr) {
    var a = arr.slice();
    var i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function gtkSlice(offset) {
    var n = Math.min(GTK_SHOW, gtkPool.length);
    var out = [];
    var i;
    for (i = 0; i < n; i++) out.push(gtkPool[(offset + i) % gtkPool.length]);
    return out;
  }

  function paintGtk(notes, fade) {
    var el = document.getElementById("gtk-list");
    if (!el) return;
    var html = notes.map(function (n) {
      return "<li><span class=\"gtk__mark\" aria-hidden=\"true\">▸</span><span>" + n + "</span></li>";
    }).join("");
    if (!fade || reduced) {
      el.innerHTML = html;
      return;
    }
    el.classList.add("is-swap");
    window.setTimeout(function () {
      el.innerHTML = html;
      el.classList.remove("is-swap");
    }, 180);
  }

  function stopGtk() {
    if (gtkTimer) { clearInterval(gtkTimer); gtkTimer = 0; }
  }

  function startGtk(notes) {
    stopGtk();
    gtkPool = shuffle(notes);
    gtkOffset = 0;
    paintGtk(gtkSlice(0), false);
    if (reduced || gtkPool.length <= GTK_SHOW) return;
    gtkTimer = setInterval(function () {
      gtkOffset = (gtkOffset + 1) % gtkPool.length;
      paintGtk(gtkSlice(gtkOffset), true);
    }, 3800);
  }

  function startPeekLoop() {
    if (reduced || peekUser) return;
    stopPeekLoop();
    peekTimer = setInterval(function () {
      if (peekUser) { stopPeekLoop(); return; }
      setPeek(peekIdx + 1);
    }, 2600);
  }
  function stopPeekLoop() {
    if (peekTimer) { clearInterval(peekTimer); peekTimer = 0; }
  }

  renderExplore();
  initExploreMap();
  setPeek(0);


  var prevBtn = document.getElementById("lh-prev");
  var nextBtn = document.getElementById("lh-next");
  if (prevBtn) prevBtn.addEventListener("click", function () { setPeek(peekIdx - 1, true); stopPeekLoop(); });
  if (nextBtn) nextBtn.addEventListener("click", function () { setPeek(peekIdx + 1, true); stopPeekLoop(); });

  var peekEl = document.getElementById("lh-peek");
  if (peekEl) {
    var dragPointer = null;
    var dragStartX = 0;
    var dragStartY = 0;

    function settlePeekDrag(e, cancelled) {
      if (dragPointer === null || e.pointerId !== dragPointer) return;
      var dx = e.clientX - dragStartX;
      var dy = e.clientY - dragStartY;
      var threshold = Math.min(48, Math.max(30, peekEl.clientWidth * 0.1));
      dragPointer = null;
      peekEl.classList.remove("is-dragging");
      if (peekEl.hasPointerCapture && peekEl.hasPointerCapture(e.pointerId)) {
        peekEl.releasePointerCapture(e.pointerId);
      }

      if (!cancelled && Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * 1.1) {
        setPeek(peekIdx + (dx < 0 ? 1 : -1), true);
        stopPeekLoop();
        return;
      }
      setPeek(peekIdx);
      if (!peekUser) startPeekLoop();
    }

    peekEl.addEventListener("dragstart", function (e) { e.preventDefault(); });
    peekEl.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragPointer = e.pointerId;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      peekEl.classList.add("is-dragging");
      stopPeekLoop();
      if (peekEl.setPointerCapture) peekEl.setPointerCapture(e.pointerId);
    });
    peekEl.addEventListener("pointermove", function (e) {
      if (dragPointer === null || e.pointerId !== dragPointer) return;
      var dx = e.clientX - dragStartX;
      var dy = e.clientY - dragStartY;
      if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 4) return;
      e.preventDefault();
      var resistance = Math.max(-peekEl.clientWidth * 0.42, Math.min(peekEl.clientWidth * 0.42, dx));
      if (track) {
        track.style.transform = "translateX(calc(" + (-peekIdx * CARD_W) + "% + " + resistance.toFixed(1) + "px))";
      }
    });
    peekEl.addEventListener("pointerup", function (e) { settlePeekDrag(e, false); });
    peekEl.addEventListener("pointercancel", function (e) { settlePeekDrag(e, true); });
  }

  var demo = document.getElementById("explore-demo");
  if (demo && "IntersectionObserver" in window) {
    var demoIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          if (exploreMap) exploreMap.resize();
          startPeekLoop();
        } else stopPeekLoop();
      });
    }, { threshold: 0.35 });
    demoIo.observe(demo);
  }

  /* ---------- Trip flow (GroupVote, 510f @ 30fps) ---------- */
  var FLOW_TOTAL = 510;
  var TITLE_TRIP = "Chikmagalur?";
  var CHAT_JOINS = ["Rohan", "Samira", "Kabir", "Diya", "Mira"];
  var MEMBERS = ["A", "R", "S", "K", "D", "M"];
  var VOTE = [
    { name: "Mullayanagiri", cat: "misty hike", vote: "yes", yes: 5, maybe: 1, no: 0, img: "/assets/places/mullayanagiri.jpg" },
    { name: "Makalidurga", cat: "trek", vote: "maybe", yes: 2, maybe: 3, no: 1, img: PLACES[1].img },
    { name: "Savandurga", cat: "trek", vote: "no", yes: 1, maybe: 1, no: 3, img: PLACES[2].img }
  ];
  var voteRaf = 0;
  var voteStart = 0;
  var voteApp = document.getElementById("vote-app");
  var voteList = document.getElementById("vote-list");
  var voteBanner = document.getElementById("vote-banner");
  var voteJoined = document.getElementById("vote-joined");
  var voteCheck =
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12l5 5L20 7"/></svg>';
  var voteTrophy =
    '<svg class="vote-card__trophy" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 01-10 0V4z"/><path d="M7 6H4a3 3 0 003 6M17 6h3a3 3 0 01-3 6"/></svg>';

  function easeStandard(t) {
    var c = clamp(t, 0, 1);
    return 1 - Math.pow(1 - c, 3);
  }

  function flowScene(frame) {
    if (frame < 36) return "saved";
    if (frame < 150) return "create";
    if (frame < 200) return "trip";
    if (frame < 258) return "invite";
    if (frame < 338) return "chat";
    return "trip";
  }

  function selectedCount(frame) {
    if (frame < 70) return 0;
    if (frame < 95) return 1;
    if (frame < 118) return 2;
    return 3;
  }

  function unfurlHtml() {
    return '<img alt="" src="' + VOTE[0].img + '" />' +
      '<div class="unfurl__scrim"><span>LIGHTHOUSE · 3 VOTING</span><b>' + TITLE_TRIP + "</b></div>";
  }

  function avatarsHtml(n) {
    return MEMBERS.slice(0, Math.max(1, n)).map(function (m, i) {
      return '<span class="vote-app__ava' + (i % 2 ? " is-mint" : "") + '">' + m + "</span>";
    }).join("");
  }

  function showTap(x, y, on) {
    var tap = document.getElementById("trip-tap");
    if (!tap) return;
    tap.hidden = !on;
    if (on) {
      tap.style.left = x;
      tap.style.top = y;
    }
  }

  // One cached {yes, maybe, no} per row, parallel to VOTE. tickVote calls this
  // on every requestAnimationFrame tick — uncapped by the 30fps the frame math
  // assumes — so writing `style.width` (layout) and rebuilding innerHTML
  // unconditionally meant three reflows plus a DOM rebuild, per row, up to 60+
  // times a second, for the whole ~2s voting phase. Fine on desktop's spare
  // headroom; a mid-range Android drops frames under that load, which reads as
  // flicker. Skipping the write when the rounded value hasn't moved cuts it to
  // only the frames where something actually changed on screen.
  var voteCardsCache = [];

  function paintVoteCards(localFrame, mode, winnerOn) {
    if (!voteList) return;
    VOTE.forEach(function (c, i) {
      var row = voteList.children[i];
      if (!row) return;
      var t = 0;
      var yes = 0, maybe = 0, no = 0;
      if (mode !== "preview") {
        t = easeStandard((localFrame - i * 8 - 12) / 58);
        yes = Math.round(c.yes * t);
        maybe = Math.round(c.maybe * t);
        no = Math.round(c.no * t);
      }
      var total = Math.max(1, yes + maybe + no);
      row.classList.toggle("is-win", winnerOn && i === 0);
      row.classList.toggle("is-staged", mode === "staged" && i === 0 && !winnerOn);
      var bar = row.querySelector(".vote-tally");
      if (bar) bar.hidden = mode === "preview";

      var cached = voteCardsCache[i];
      if (!cached || cached.yes !== yes || cached.maybe !== maybe || cached.no !== no) {
        voteCardsCache[i] = { yes: yes, maybe: maybe, no: no };
        var yesEl = row.querySelector(".vote-tally__bar .is-yes");
        if (yesEl) {
          yesEl.style.width = ((yes / total) * 100) + "%";
          row.querySelector(".vote-tally__bar .is-maybe").style.width = ((maybe / total) * 100) + "%";
          row.querySelector(".vote-tally__bar .is-no").style.width = ((no / total) * 100) + "%";
        }
        var nums = row.querySelector(".vote-tally__n");
        if (nums) {
          nums.innerHTML =
            '<span><span class="dot-yes">●</span> ' + yes + ' yes</span>' +
            '<span><span class="dot-maybe">●</span> ' + maybe + ' maybe</span>' +
            '<span><span class="dot-no">●</span> ' + no + ' no</span>';
        }
      }

      var pills = row.querySelector(".vote-pills");
      if (pills) pills.hidden = mode === "preview" || mode === "finalized";
      row.querySelectorAll(".vote-pill").forEach(function (pill) {
        var kind = pill.getAttribute("data-vote");
        pill.classList.toggle("is-on", mode === "voting" && localFrame > 18 && kind === c.vote);
      });
    });
  }

  function paintFlow(frame) {
    if (!voteApp) return;
    var scene = flowScene(frame);
    voteApp.querySelectorAll(".trip-scene").forEach(function (el) {
      el.classList.toggle("is-on", el.getAttribute("data-scene") === scene);
    });

    showTap("82%", "62%", scene === "saved" && frame >= 18 && frame < 32);
    var cta = document.getElementById("saved-cta");
    if (cta) cta.classList.toggle("is-hot", scene === "saved" && frame >= 18 && frame < 32);

    if (scene === "create") {
      var n = selectedCount(frame);
      var typedN = Math.round(clamp((frame - 44) / (88 - 44), 0, 1) * TITLE_TRIP.length);
      var title = TITLE_TRIP.slice(0, typedN);
      var titleEl = document.getElementById("create-title");
      if (titleEl) {
        titleEl.classList.toggle("is-on", title.length > 0);
        titleEl.innerHTML = title
          ? title + (frame < 88 ? '<span class="create-caret"></span>' : "")
          : '<span class="create-ph">e.g. Weekend near Coorg?</span>';
      }
      var countEl = document.getElementById("create-count");
      if (countEl) countEl.textContent = n + "/5";
      document.querySelectorAll("#create-pool .create-row").forEach(function (row, i) {
        row.classList.toggle("is-on", i < n);
      });
      var submit = document.getElementById("create-submit");
      if (submit) {
        submit.disabled = !(title.trim().length > 0 && n >= 2);
        submit.classList.toggle("is-hot", frame >= 136 && frame < 148);
      }
      showTap("50%", "92%", frame >= 136 && frame < 148);
    }

    if (scene === "invite") {
      var wa = document.getElementById("invite-wa");
      var local = frame - 200;
      if (wa) wa.classList.toggle("is-hot", local >= 36 && local < 50);
      showTap("50%", "92%", local >= 36 && local < 50);
    }

    if (scene === "chat") {
      var localC = frame - 258;
      var joined = Math.min(CHAT_JOINS.length, Math.max(0, Math.floor((localC - 18) / 12)));
      var joins = document.getElementById("chat-joins");
      if (joins) {
        joins.innerHTML = CHAT_JOINS.slice(0, joined).map(function (name) {
          return "<p>" + name + " opened the invite</p>";
        }).join("");
      }
      showTap("0", "0", false);
    }

    if (scene === "trip") {
      var share = document.getElementById("share-btn");
      var avas = document.getElementById("trip-avas");
      var fin = document.getElementById("finalize-bar");
      var finGo = document.getElementById("finalize-go");
      var members = 1;
      var mode = "preview";
      var winnerOn = false;
      var localT = 0;
      var shareHot = false;
      var staged = false;
      var confirming = false;

      if (frame < 200) {
        localT = frame - 150;
        shareHot = frame >= 178 && frame < 192;
        members = 1;
        mode = "preview";
        showTap("90%", "44px", shareHot);
      } else if (frame < 430) {
        localT = frame - 338;
        members = 6;
        mode = "voting";
        showTap("0", "0", false);
      } else {
        localT = 80;
        members = 6;
        winnerOn = frame - 430 > 36;
        mode = winnerOn ? "voting" : "voting";
        staged = !winnerOn;
        confirming = frame - 430 >= 22 && frame - 430 < 36;
        showTap("86%", "88%", confirming);
      }

      if (share) share.classList.toggle("is-hot", shareHot);
      if (avas) avas.innerHTML = avatarsHtml(members);
      if (voteJoined) voteJoined.textContent = members + " joined" + (winnerOn ? " · finalized" : "");
      if (voteBanner) voteBanner.hidden = !winnerOn;
      if (voteApp) voteApp.classList.toggle("is-won", winnerOn);
      if (fin) fin.hidden = !staged;
      if (finGo) finGo.classList.toggle("is-hot", confirming);
      paintVoteCards(localT, winnerOn ? "finalized" : (staged ? "staged" : mode), winnerOn);
    }
  }

  function renderVote() {
    var saved = document.getElementById("saved-list");
    if (saved) {
      saved.innerHTML = VOTE.map(function (c) {
        return '<div class="saved-row"><img alt="" src="' + c.img + '" width="44" height="44" /><span>' +
          c.name + '</span><i class="saved-mark">●</i></div>';
      }).join("");
    }
    var pool = document.getElementById("create-pool");
    if (pool) {
      pool.innerHTML = VOTE.map(function (c) {
        return '<div class="create-row"><img alt="" src="' + c.img + '" width="48" height="48" /><b>' +
          c.name + '</b><span class="create-tick">' + voteCheck + "</span></div>";
      }).join("");
    }
    var unfurl = document.getElementById("unfurl");
    var unfurlChat = document.getElementById("unfurl-chat");
    if (unfurl) unfurl.innerHTML = unfurlHtml();
    if (unfurlChat) unfurlChat.innerHTML = unfurlHtml();
    if (voteList) {
      voteList.innerHTML = VOTE.map(function (c) {
        return '<div class="vote-row">' +
          '<div class="vote-card">' +
            '<img class="vote-card__thumb" alt="" src="' + c.img + '" width="64" height="64" />' +
            '<div class="vote-card__body">' +
              '<div class="vote-card__name">' + voteTrophy + c.name + "</div>" +
              '<span class="vote-card__cat">' + (c.cat || "trek") + "</span>" +
              '<div class="vote-tally">' +
                '<div class="vote-tally__bar"><i class="is-yes"></i><i class="is-maybe"></i><i class="is-no"></i></div>' +
                '<div class="vote-tally__n"></div>' +
              "</div>" +
            "</div>" +
          "</div>" +
          '<div class="vote-pills">' +
            '<span class="vote-pill is-yes" data-vote="yes">' + voteCheck + "Yes</span>" +
            '<span class="vote-pill is-maybe" data-vote="maybe">' + voteCheck + "Maybe</span>" +
            '<span class="vote-pill is-no" data-vote="no">' + voteCheck + "No</span>" +
          "</div>" +
        "</div>";
      }).join("");
    }
    paintFlow(reduced ? FLOW_TOTAL - 1 : 0);
  }

  function tickVote(now) {
    if (!voteStart) voteStart = now;
    var frame = ((now - voteStart) / 1000) * 30;
    if (frame > FLOW_TOTAL) {
      voteStart = now;
      frame = 0;
    }
    paintFlow(frame);
    voteRaf = requestAnimationFrame(tickVote);
  }

  function startVoteLoop() {
    if (reduced || voteRaf) return;
    voteStart = 0;
    voteRaf = requestAnimationFrame(tickVote);
  }
  function stopVoteLoop() {
    if (voteRaf) cancelAnimationFrame(voteRaf);
    voteRaf = 0;
  }

  renderVote();
  var voteDemo = document.getElementById("vote-demo");
  if (voteDemo && "IntersectionObserver" in window) {
    var voteIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) startVoteLoop();
        else stopVoteLoop();
      });
    }, { threshold: 0.35 });
    voteIo.observe(voteDemo);
  }

  /* ---------- Live 24h weather (Open-Meteo, same as the app) ---------- */
  var RAIN = { 51: 1, 53: 1, 55: 1, 61: 1, 63: 1, 65: 1, 80: 1, 81: 1, 82: 1, 95: 1 };
  var FOG = { 45: 1, 48: 1 };

  function wxLabel(code, isDay) {
    if (RAIN[code]) return { t: "Raining", e: "🌧" };
    if (FOG[code]) return { t: "Misty", e: "🌫" };
    return { t: isDay ? "Clear" : "Clear night", e: isDay ? "☀️" : "🌙" };
  }

  function hourShort(d) {
    var h = d.getHours();
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + (h >= 12 ? "p" : "a");
  }
  function hourLong(d) {
    var h = d.getHours();
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + (h >= 12 ? "pm" : "am");
  }

  function bestLeave(hours) {
    var i, j;
    for (i = 0; i + 3 <= hours.length; i++) {
      var win = hours.slice(i, i + 3);
      if (!win.every(function (h) { return h.day; })) continue;
      if (win.some(function (h) { return h.rain >= 55; })) continue;
      var mean = win.reduce(function (s, h) { return s + h.temp; }, 0) / 3;
      if (mean < 6 || mean > 40) continue;
      var reason = "The steadiest stretch in the forecast.";
      var before = hours.slice(0, i);
      if (before.some(function (h) { return h.rain >= 55; }) && win.every(function (h) { return h.rain < 30; })) {
        reason = "Rain eases off by then.";
      } else if (before.length === 0) {
        reason = "Conditions are already good — no reason to wait.";
      }
      return { at: win[0].time, reason: reason };
    }
    return null;
  }

  function drawWx(hours, nowLabel) {
    var band = hours.slice(0, 24);
    wxHours = band;
    var nowEl = document.getElementById("wx-now");
    var chart = document.getElementById("wx-chart");
    var leaveEl = document.getElementById("wx-leave");
    if (!band.length) {
      if (nowEl) nowEl.textContent = "No forecast right now.";
      return;
    }
    if (nowEl) nowEl.innerHTML = Math.round(band[0].temp) + "°C<span>" + nowLabel + "</span>";
    var temps = band.map(function (h) { return h.temp; });
    var yMin = Math.floor(Math.min.apply(null, temps)) - 1;
    var yMax = Math.ceil(Math.max.apply(null, temps)) + 1;
    var span = Math.max(1, yMax - yMin);
    var W = 360, TH = 86, RH = 44;
    var x = function (i) { return band.length === 1 ? W / 2 : (i / (band.length - 1)) * W; };
    var y = function (t) { return TH - ((t - yMin) / span) * TH; };
    wxGeom = { x: x, y: y, W: W, TH: TH };
    var line = band.map(function (h, i) {
      return (i === 0 ? "M" : "L") + x(i).toFixed(1) + "," + y(h.temp).toFixed(1);
    }).join(" ");
    var area = line + " L" + W + "," + TH + " L0," + TH + " Z";
    var barW = Math.max(2, W / band.length - 2);
    var rainRects = band.map(function (h, i) {
      var bh = Math.max(h.rain > 0 ? 1.5 : 0, (h.rain / 100) * RH);
      return '<rect class="wx-rainbar" data-i="' + i + '" x="' + (x(i) - barW / 2).toFixed(1) + '" y="' + (RH - bh).toFixed(1) +
        '" width="' + barW.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="1.5" fill="#5DCAA5" opacity="0.55"/>';
    }).join("");
    var ticks = band.filter(function (_, i) { return i % 6 === 0; }).map(function (h) {
      return "<span>" + hourShort(h.time) + "</span>";
    }).join("");
    var hair = '<line class="wx-hair" x1="0" y1="0" x2="0" y2="100%" stroke="rgba(255,255,255,0.35)" stroke-width="1" vector-effect="non-scaling-stroke" visibility="hidden"/>';
    if (chart) {
      chart.innerHTML =
        '<p class="utility" style="margin:0 0 6px">TEMPERATURE</p>' +
        '<div class="wx__temp">' +
        '<svg class="wx__plot" id="wx-temp" viewBox="0 0 ' + W + " " + TH + '" preserveAspectRatio="none" style="height:' + TH + 'px" role="img" aria-label="Temperature next 24 hours">' +
        '<defs><linearGradient id="lh-tf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5DCAA5" stop-opacity="0.38"/><stop offset="100%" stop-color="#5DCAA5" stop-opacity="0.02"/></linearGradient></defs>' +
        '<path d="' + area + '" fill="url(#lh-tf)"/><path d="' + line + '" fill="none" stroke="#5DCAA5" stroke-width="2" stroke-linecap="round"/>' +
        hair.replace('y2="100%"', 'y2="' + TH + '"') + "</svg>" +
        '<span class="wx__dot" id="wx-dot" hidden></span>' +
        "</div>" +
        '<p class="utility" style="margin:10px 0 6px">CHANCE OF RAIN</p>' +
        '<div class="wx__rain">' +
        '<svg class="wx__plot" id="wx-rain" viewBox="0 0 ' + W + " " + RH + '" preserveAspectRatio="none" style="height:' + RH + 'px" role="img" aria-label="Chance of rain next 24 hours">' +
        rainRects + hair.replace('y2="100%"', 'y2="' + RH + '"') + "</svg></div>" +
        '<div class="wx__axis">' + ticks + "</div>";

      function clearWxHover() {
        chart.querySelectorAll(".wx-hair").forEach(function (ln) { ln.setAttribute("visibility", "hidden"); });
        var dot = document.getElementById("wx-dot");
        if (dot) dot.hidden = true;
        chart.querySelectorAll(".wx-rainbar").forEach(function (bar) { bar.setAttribute("opacity", "0.55"); });
        var read = document.getElementById("wx-read");
        if (read) read.textContent = "Hover or tap any hour";
      }

      function hoverWx(clientX) {
        var tempEl = document.getElementById("wx-temp");
        if (!tempEl || !wxGeom || !band.length) return;
        var r = tempEl.getBoundingClientRect();
        var ratio = (clientX - r.left) / r.width;
        var hi = Math.max(0, Math.min(band.length - 1, Math.round(ratio * (band.length - 1))));
        var h = band[hi];
        var px = wxGeom.x(hi);
        chart.querySelectorAll(".wx-hair").forEach(function (ln) {
          ln.setAttribute("x1", px.toFixed(1));
          ln.setAttribute("x2", px.toFixed(1));
          ln.setAttribute("visibility", "visible");
        });
        var dot = document.getElementById("wx-dot");
        if (dot) {
          dot.hidden = false;
          dot.style.left = ((px / wxGeom.W) * 100) + "%";
          dot.style.top = ((wxGeom.y(h.temp) / wxGeom.TH) * 100) + "%";
        }
        chart.querySelectorAll(".wx-rainbar").forEach(function (bar) {
          bar.setAttribute("opacity", bar.getAttribute("data-i") === String(hi) ? "1" : "0.28");
        });
        var read = document.getElementById("wx-read");
        if (read) read.textContent = hourLong(h.time) + " · " + Math.round(h.temp) + "° · " + h.rain + "% rain";
      }

      chart.addEventListener("pointermove", function (e) { hoverWx(e.clientX); });
      chart.addEventListener("pointerleave", clearWxHover);
    }
    var rec = bestLeave(band);
    if (leaveEl) {
      leaveEl.textContent = rec
        ? "Leave around " + hourLong(rec.at) + " — " + rec.reason
        : "No clear daylight window in the next day. Check again closer to go-time.";
    }
  }

  function loadWeather(place) {
    var placeEl = document.getElementById("wx-place");
    if (placeEl) placeEl.textContent = "Timing · " + place.name;
    if (wxCache[place.name]) {
      drawWx(wxCache[place.name].hours, wxCache[place.name].label);
      return;
    }
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + place.lat + "&longitude=" + place.lon +
      "&current=temperature_2m,weather_code,is_day" +
      "&hourly=temperature_2m,precipitation_probability,weather_code,is_day" +
      "&timezone=auto&forecast_days=2";
    fetch(url).then(function (res) { return res.json(); }).then(function (data) {
      var cutoff = Date.now() - 60 * 60 * 1000;
      var hours = (data.hourly && data.hourly.time || []).map(function (iso, i) {
        return {
          time: new Date(iso),
          temp: data.hourly.temperature_2m[i],
          rain: data.hourly.precipitation_probability[i] || 0,
          code: data.hourly.weather_code[i] || 0,
          day: data.hourly.is_day[i] === 1
        };
      }).filter(function (h) { return h.temp != null && h.time.getTime() >= cutoff; });
      var cur = data.current || {};
      var lab = wxLabel(cur.weather_code || 0, cur.is_day === 1);
      wxCache[place.name] = { hours: hours, label: lab.e + "  " + lab.t };
      drawWx(hours, wxCache[place.name].label);
    }).catch(function () {
      var nowEl = document.getElementById("wx-now");
      if (nowEl) nowEl.textContent = "Forecast unreachable — try again.";
    });
  }
})();

