(function () {
  'use strict';

  var C = window.APP_CONFIG;
  var $ = function (id) { return document.getElementById(id); };
  var qs = new URLSearchParams(location.search);
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var A = (function () {
    var cfg = C.analytics || {};
    var log = [];
    var overlayEl = null;
    var showOverlay = cfg.debugOverlay === true ||
      (cfg.debugOverlay === 'auto' && (qs.get('debug') === '1'));

    if (cfg.ga4Id) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', cfg.ga4Id, { send_page_view: false });

      var load = function () {
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.ga4Id);
        document.head.appendChild(s);
      };
      if (window.requestIdleCallback) addEventListener('load', function () { requestIdleCallback(load); });
      else addEventListener('load', function () { setTimeout(load, 800); });
    }

    function persist() {
      if (!cfg.storageKey) return;
      try { localStorage.setItem(cfg.storageKey, JSON.stringify(log.slice(-50))); } catch (e) {}
    }

    function paint() {
      if (!showOverlay) return;
      if (!overlayEl) {
        overlayEl = document.createElement('aside');
        overlayEl.className = 'dbg';
        document.body.appendChild(overlayEl);
      }
      var rows = log.slice(-8).map(function (e) {
        var p = Object.keys(e.p).map(function (k) { return k + '=' + e.p[k]; }).join(' ');
        return '<div>' + e.t + ' &rarr; <b style="display:inline;color:#B7F5C8">' + e.n + '</b> ' + p + '</div>';
      }).join('');
      overlayEl.innerHTML = '<b>ANALYTICS DEBUG (' + log.length + ')</b>' + rows;
    }

    function track(name, params) {
      var p = params || {};
      log.push({ t: new Date().toTimeString().slice(0, 8), n: name, p: p });
      if (window.gtag) window.gtag('event', name, p);
      if (window.console) console.info('[track]', name, p);
      persist();
      paint();
    }

    return { track: track };
  })();

  var ctaUrl = (function () {
    var url;
    try { url = new URL(C.ctaUrl, location.href); } catch (e) { return C.ctaUrl; }
    (C.passthroughParams || []).forEach(function (k) {
      var v = qs.get(k);
      if (v) url.searchParams.set(k, v);
    });
    return url.toString();
  })();

  var ctas = [$('cta'), $('cta2')].filter(Boolean);
  ctas.forEach(function (el) {
    el.href = ctaUrl;
    el.addEventListener('click', function () {
      A.track('cta_click', { placement: el.id === 'cta' ? 'hero' : 'footer', step: step, state: state });
    });
  });

  var field = $('field'), track = $('track'), runner = $('runner');
  var pitch = $('pitch'), flash = $('flash'), dust = $('dust'), burst = $('burst');
  var playBtn = $('play'), cashBtn = $('cash'), cashMult = $('cashMult');
  var tagEl = $('tag'), hintEl = $('hint'), multEl = $('mult');
  var bases = C.game.bases;
  var lanes = [];

  var state = 'idle';
  var step = 0;
  var busy = false;
  var anchor = 0;
  var timers = [];

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function buildTrack() {
    var html = '<div class="wall"></div>';
    for (var i = bases.length; i >= 1; i--) {
      html += '<div class="lane" data-lane="' + i + '">' +
        '<span class="chip"><b>×' + bases[i - 1].mult + '</b><i data-base="' + i + '"></i></span>' +
        '<span class="diamond"></span>' +
        '<span class="ball' + (i % 2 ? ' ball--rev' : '') + '" style="--dur:' +
          (2.2 + i * 0.26).toFixed(2) + 's;--delay:-' + (i * 0.73).toFixed(2) + 's">' +
          '<svg viewBox="0 0 16 16"><use href="#spr-ball"/></svg></span>' +
        '</div>';
    }
    html += '<div class="lane lane--home" data-lane="0"><span class="plate"></span></div>';
    track.innerHTML = html;
    lanes = [];
    for (var j = 0; j <= bases.length; j++) lanes[j] = track.querySelector('[data-lane="' + j + '"]');
  }

  var locale = (function () {
    var q = (qs.get('lang') || '').toLowerCase();
    if (C.locales[q]) return q;
    try { var s = localStorage.getItem('cr_lang'); if (C.locales[s]) return s; } catch (e) {}
    return C.defaultLocale;
  })();

  function t(key) { return C.locales[locale][key] || ''; }

  function applyLocale(loc) {
    var d = C.locales[loc];
    if (!d) return;
    locale = loc;
    document.documentElement.lang = d.lang;
    document.documentElement.dir = d.dir;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = d[el.getAttribute('data-i18n')];
      if (v != null) el.textContent = v;
    });

    track.querySelectorAll('[data-base]').forEach(function (el) {
      el.textContent = t('base.' + el.getAttribute('data-base'));
    });
    var other = C.locales[loc === 'ar' ? 'fr' : 'ar'];
    $('lang').setAttribute('aria-label', other.label);
    try { localStorage.setItem('cr_lang', loc); } catch (e) {}
    render();
  }

  $('lang').addEventListener('click', function () {
    var next = locale === 'ar' ? 'fr' : 'ar';
    applyLocale(next);
    A.track('lang_switch', { to: next, dir: C.locales[next].dir });
  });

  function centerInTrack(i) {
    var tr = track.getBoundingClientRect();
    var lr = lanes[i].getBoundingClientRect();
    return tr.bottom - (lr.top + lr.height / 2);
  }

  function centerOnScreen(i) {
    var fr = field.getBoundingClientRect();
    var lr = lanes[i].getBoundingClientRect();
    return fr.bottom - (lr.top + lr.height / 2);
  }

  function layout(animate) {
    var fieldH = field.clientHeight;
    var trackH = track.getBoundingClientRect().height;
    var center = centerInTrack(step);
    var maxScroll = Math.max(0, trackH - fieldH);

    var scroll = Math.min(Math.max(0, center - fieldH * 0.42), maxScroll);
    anchor = center - scroll;

    if (!animate) {
      runner.classList.add('no-anim');
      track.style.transition = 'none';
    }
    field.style.setProperty('--laneW', field.clientWidth + 'px');
    track.style.setProperty('--scroll', scroll.toFixed(1) + 'px');
    runner.style.setProperty('--y', Math.max(0, anchor - 28).toFixed(1) + 'px');
    if (!animate) {
      void runner.offsetWidth;
      runner.classList.remove('no-anim');
      track.style.transition = '';
    }
  }

  function replay(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function burstAt(kind, n) {
    if (reduced) return;
    burst.className = 'burst is-' + kind;
    burst.textContent = '';
    for (var i = 0; i < n; i++) {
      var s = document.createElement('i');
      var a = (Math.PI * 2 * i) / n + Math.random() * 0.6;
      var d = 16 + Math.random() * 24;
      s.style.setProperty('--dx', (Math.cos(a) * d).toFixed(1) + 'px');
      s.style.setProperty('--dy', (Math.sin(a) * d - 12).toFixed(1) + 'px');
      s.style.setProperty('--rot', (Math.random() * 360 | 0) + 'deg');
      s.style.setProperty('--delay', (i * 16) + 'ms');
      burst.appendChild(s);
    }
    later(function () { burst.className = 'burst'; burst.textContent = ''; }, 900);
  }

  function puff() {
    if (reduced) return;
    replay(dust, 'on');
    later(function () { dust.classList.remove('on'); }, 460);
  }

  function throwPitch(targetLane) {
    var w = field.clientWidth;
    var side = Math.random() < 0.5 ? -1 : 1;
    pitch.style.setProperty('--sx', (side * w * 0.46).toFixed(0) + 'px');
    pitch.style.setProperty('--sy', centerOnScreen(targetLane).toFixed(0) + 'px');
    pitch.style.setProperty('--ey', anchor.toFixed(0) + 'px');
    pitch.style.setProperty('--hx', (-side * w * 0.6).toFixed(0) + 'px');
    pitch.style.setProperty('--hy', (anchor + field.clientHeight * 0.55).toFixed(0) + 'px');
    pitch.style.setProperty('--kx', (side * -22).toFixed(0) + 'px');
    pitch.style.setProperty('--pitchDur', PITCH + 'ms');
    pitch.className = 'pitch';
    void pitch.offsetWidth;
    pitch.className = 'pitch is-live';
  }

  function render() {
    var tagKey = { idle: 'status.idle', run: 'status.idle', win: 'status.win', cash: 'status.cash', out: 'status.out' }[state];
    tagEl.textContent = t(tagKey);
    tagEl.className = 'tag' + (state === 'win' ? ' is-win' : state === 'cash' ? ' is-cash' : state === 'out' ? ' is-out' : '');

    var hintKey = state === 'win' ? 'hint.win' : state === 'cash' ? 'hint.cash'
      : state === 'out' ? 'hint.out' : state === 'run' ? 'hint.run' : 'hint.idle';
    hintEl.textContent = t(hintKey);

    playBtn.textContent = t(state === 'idle' ? 'btn.start' : state === 'run' ? 'btn.run' : 'btn.retry');

    var showMult = step > 0 && state !== 'out' && state !== 'idle';
    multEl.textContent = showMult ? '×' + bases[step - 1].mult : '';

    var canCash = state === 'run' && step > 0;
    cashBtn.hidden = !canCash;
    if (canCash) cashMult.textContent = '×' + bases[step - 1].mult;

    runner.classList.toggle('is-idle', state === 'idle' && !reduced);
  }

  function markLanes() {
    lanes.forEach(function (l, i) {
      if (!l) return;
      l.classList.toggle('is-done', i > 0 && i <= step);
      l.classList.toggle('is-next', state === 'run' && i === step + 1);
    });
  }

  function reset() {
    clearTimers();
    state = 'idle'; step = 0;
    runner.className = 'runner';
    pitch.className = 'pitch';
    flash.className = 'flash';
    burst.className = 'burst'; burst.textContent = '';
    lanes.forEach(function (l) { if (l) l.classList.remove('is-claimed'); });
    ctas.forEach(function (el) { el.classList.remove('is-pulse'); });
    layout(false);
    markLanes(); render();
  }

  function start() {
    reset();
    state = 'run';
    markLanes(); render();
    A.track('game_start', { locale: locale, track_length: bases.length });
  }

  function finish(result) {
    state = result === 'home_run' ? 'win' : result === 'cashout' ? 'cash' : 'out';
    var mult = step > 0 ? bases[step - 1].mult : '0.00';
    flash.className = 'flash on-' + (result === 'out' ? 'out' : result === 'cashout' ? 'cash' : 'win');
    later(function () { flash.className = 'flash'; }, 700);
    if (result === 'home_run') { runner.classList.add('is-win'); burstAt('win', 12); }
    else if (result === 'cashout') { runner.classList.add('is-cash'); burstAt('cash', 9); }
    else { runner.classList.add('is-out'); burstAt('out', 7); }
    markLanes(); render();
    ctas.forEach(function (el) { el.classList.add('is-pulse'); });
    A.track('game_end', { result: result, bases_reached: step, mult: mult });
  }

  var PITCH = reduced ? 60 : 200;
  var SETTLE = reduced ? 90 : 330;

  function swing() {
    if (busy || state !== 'run') return;
    busy = true;

    var idx = step;
    var caught = Math.random() < bases[idx].risk;
    var targetLane = idx + 1;

    throwPitch(targetLane);
    replay(runner, 'is-swing');

    later(function () {
      if (caught) {
        pitch.className = 'pitch is-stuck';
        finish('out');
        busy = false;
        return;
      }

      pitch.className = 'pitch is-hit';
      step = targetLane;
      replay(runner, 'is-hop');
      layout(true);
      markLanes();
      replay(lanes[step], 'is-claimed');
      later(puff, SETTLE - 90);
      A.track('game_step', { base: step, mult: bases[idx].mult });

      later(function () {
        if (step >= bases.length) finish('home_run');
        else { render(); replay(multEl, 'is-bump'); }
        busy = false;
      }, SETTLE);
    }, PITCH);
  }

  function cashOut() {
    if (busy || state !== 'run' || step === 0) return;
    busy = true;
    finish('cashout');
    busy = false;
  }

  playBtn.addEventListener('click', function () {
    if (state === 'run') swing();
    else start();
  });
  cashBtn.addEventListener('click', cashOut);

  field.addEventListener('click', function () { if (state === 'run') swing(); });

  var rt;
  addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { layout(false); }, 120); });
  document.addEventListener('visibilitychange', function () {
    field.classList.toggle('is-paused', document.hidden);
  });

  buildTrack();
  applyLocale(locale);
  reset();

  A.track('page_view', {
    locale: locale,
    dir: C.locales[locale].dir,
    viewport: innerWidth + 'x' + innerHeight,
    utm_source: qs.get('utm_source') || '(none)',
    utm_campaign: qs.get('utm_campaign') || '(none)'
  });
})();
