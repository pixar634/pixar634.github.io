// Analytics + heatmaps (Google Analytics 4, Microsoft Clarity — both free), gated
// behind an actual accept/decline choice rather than firing on page load. DPDP
// (India's privacy law) makes consent the basis for processing personal data,
// and both tools set identifying cookies (_ga, _clck/_clsk) the moment they load
// — so this asks first and remembers the answer, instead of loading immediately
// and hoping a banner nobody has to interact with covers it. See privacy.html §6
// for what's disclosed to match this.
//
// Loaded on every page (see the <script> tag next to pages.js/main.js), so the
// choice and the tools themselves are consistent site-wide, not just on one page.

(function () {
  'use strict';

  var CONSENT_KEY = 'lh_consent';
  var GA_ID = 'G-0XHHZNQTEN';         // analytics.google.com → Admin → Data Streams
  var CLARITY_ID = 'ya0uy6r7xo';      // clarity.microsoft.com → Settings → Setup

  var gaConfigured = GA_ID.indexOf('PASTE_YOUR') !== 0;
  var clarityConfigured = CLARITY_ID.indexOf('PASTE_YOUR') !== 0;

  var loadGA = function () {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  };

  var loadClarity = function () {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
  };

  // Each tool loads independently of the other's setup state — Clarity going
  // live shouldn't wait on a GA4 property existing, or vice versa.
  var loadAnalytics = function () {
    if (gaConfigured) loadGA();
    if (clarityConfigured) loadClarity();
  };

  var consent;
  try { consent = localStorage.getItem(CONSENT_KEY); } catch (err) { consent = null; }

  if (consent === 'granted') { loadAnalytics(); return; }
  if (consent === 'denied') return; // a decline is respected for good, not asked again
  if (!gaConfigured && !clarityConfigured) return; // nothing to ask consent for yet

  var show = function () {
    var bar = document.createElement('div');
    bar.className = 'cookiebar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Cookie notice');
    bar.innerHTML =
      '<p class="cookiebar__text">We use cookies for basic analytics — nothing sold, nothing used ' +
      'to target ads. <a href="/privacy.html">Privacy policy</a></p>' +
      '<div class="cookiebar__actions">' +
      '<button type="button" class="btn btn--ghost cookiebar__btn--decline">Decline</button>' +
      '<button type="button" class="btn btn--solid cookiebar__btn--accept">Accept</button>' +
      '</div>';
    document.body.appendChild(bar);

    var setChoice = function (value) {
      try { localStorage.setItem(CONSENT_KEY, value); } catch (err) { /* private mode — asked again next visit */ }
      bar.remove();
      if (value === 'granted') loadAnalytics();
    };
    bar.querySelector('.cookiebar__btn--accept').addEventListener('click', function () { setChoice('granted'); });
    bar.querySelector('.cookiebar__btn--decline').addEventListener('click', function () { setChoice('denied'); });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', show);
  } else {
    show();
  }
})();
