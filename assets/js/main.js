/* CREATE — My Five Gifts · main interactions (no dependencies) */
(function () {
  'use strict';

  var FILM_END = 24.5;
  // Five golden streams: launch time (film seconds), travel time, arrival time.
  var STREAM = { first: 19.8, gap: 0.45, travel: 1.7 };
  var ARRIVE = [0, 1, 2, 3, 4].map(function (i) { return STREAM.first + i * STREAM.gap + STREAM.travel; });

  var SCENES = [
    { n: 1, title: 'Walking', line: 'She starts her day with a smile and a cup of coffee.', start: 0, img: 'scene-1', pos: '50% 30%' },
    { n: 2, title: 'The Rock', line: 'She glances around the city — and never sees the small rock on the path.', start: 4.6, img: 'scene-3', pos: '50% 60%' },
    { n: 3, title: 'Losing Balance', line: 'Her foot catches the rock. She stumbles, her arm flies up and the cup tilts.', start: 7.6, img: 'scene-4', pos: '40% 40%' },
    { n: 4, title: 'Coffee Spill', line: 'Coffee pours over the rim of the cup and splashes across the sidewalk.', start: 8.8, img: 'scene-5', pos: '50% 50%' },
    { n: 5, title: 'Magical Transformation', line: 'The spilled coffee begins to glow — turning into champagne-gold light.', start: 16.6, img: 'scene-6', pos: '28% 50%' },
    { n: 6, title: 'Five Gifts', line: 'Five golden streams flow out. Each gift lights up as its stream arrives.', start: 19.8, img: 'scene-7', pos: '50% 50%' },
    { n: 7, title: 'Interactive Discovery', line: 'The five gifts are open — select one to explore it.', start: 23.4, img: 'scene-8', pos: '20% 50%' },
    { n: 8, title: 'The Ending', line: 'She smiles. An unexpected moment became the beginning of something meaningful.', start: null, img: 'avatar', pos: '50% 25%' }
  ];

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var root = document.documentElement;
  var video = $('#filmVideo');
  var seek = $('#seek');
  var playBtn = $('#playPause');
  var soundBtn = $('#sound');
  var bigPlay = $('#bigPlay');
  var tokens = $$('.token');
  var capNum = $('#capNum'), capTitle = $('#capTitle'), capLine = $('#capLine'), caption = $('.caption');
  var motionBtn = $('#motionToggle');

  var state = { ended: false, skipped: false, sceneIdx: -1, lit: [false, false, false, false, false], endTimer: null };

  /* ---------- Reduced motion ---------- */
  function storedMotion() { try { return localStorage.getItem('create-reduced'); } catch (e) { return null; } }
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduced = storedMotion() !== null ? storedMotion() === '1' : !!(mq && mq.matches);

  function applyMotion() {
    root.classList.toggle('reduced', reduced);
    motionBtn.setAttribute('aria-pressed', String(reduced));
    $('.motion-label', motionBtn).textContent = reduced ? 'Motion off' : 'Reduce motion';
    window.dispatchEvent(new CustomEvent('create:motion', { detail: { reduced: reduced } }));
  }
  motionBtn.addEventListener('click', function () {
    reduced = !reduced;
    try { localStorage.setItem('create-reduced', reduced ? '1' : '0'); } catch (e) {}
    applyMotion();
    if (reduced) { pause(); setAllLit(true, false); }
  });

  /* ---------- Film helpers ---------- */
  function filmTime() { return state.ended ? FILM_END : (video.currentTime || 0); }
  function isPlaying() { return !video.paused && !video.ended; }

  function setPlayUI() {
    var playing = isPlaying();
    playBtn.querySelector('use').setAttribute('href', playing ? '#i-pause' : '#i-play');
    playBtn.querySelector('span').textContent = playing ? 'Pause' : 'Play';
    playBtn.setAttribute('aria-label', playing ? 'Pause story' : 'Play story');
    bigPlay.hidden = playing || state.ended || video.currentTime > 0.05;
  }

  function play() {
    if (state.ended) { restart(); return; }
    var p = video.play();
    if (p && p.catch) p.catch(function () { setPlayUI(); bigPlay.hidden = false; });
  }
  function pause() { video.pause(); }

  function restart() {
    clearTimeout(state.endTimer);
    state.ended = false; state.skipped = false;
    video.currentTime = 0;
    if (!reduced) setAllLit(false, false);
    var p = video.play();
    if (p && p.catch) p.catch(function () { bigPlay.hidden = false; });
  }

  function finish(viaSkip) {
    state.ended = true; state.skipped = !!viaSkip;
    try { video.pause(); if (video.duration) video.currentTime = video.duration - 0.04; } catch (e) {}
    setAllLit(true, !viaSkip && !reduced);
    showScene(6);
    clearTimeout(state.endTimer);
    state.endTimer = setTimeout(function () { if (state.ended) showScene(7); }, viaSkip ? 2200 : 3800);
    setPlayUI();
  }

  /* ---------- Captions / scenes ---------- */
  function sceneAt(t) {
    var idx = 0;
    for (var i = 0; i < 7; i++) if (SCENES[i].start !== null && t >= SCENES[i].start) idx = i;
    return idx;
  }
  function showScene(idx) {
    if (idx === state.sceneIdx) return;
    state.sceneIdx = idx;
    var s = SCENES[idx];
    var apply = function () {
      capNum.textContent = 'Scene 0' + s.n;
      capTitle.textContent = s.title;
      capLine.textContent = s.line;
      caption.classList.remove('swap');
    };
    if (reduced) apply(); else { caption.classList.add('swap'); setTimeout(apply, 260); }
    $$('.chapter').forEach(function (c, i) { c.classList.toggle('active', i === idx); });
  }

  /* ---------- Gift tokens ---------- */
  function setLit(i, on, flash) {
    if (state.lit[i] === on) return;
    state.lit[i] = on;
    var tk = tokens[i];
    tk.classList.toggle('lit', on);
    if (on && flash) { tk.classList.remove('flash'); void tk.offsetWidth; tk.classList.add('flash'); }
    tk.setAttribute('aria-label', 'Gift 0' + (i + 1) + ' ' + tk.querySelector('.token-name').textContent + (on ? ' — revealed. Open details.' : ' — open details.'));
  }
  function setAllLit(on, flash) { for (var i = 0; i < 5; i++) setLit(i, on, flash); }

  /* ---------- Main loop ---------- */
  function tick() {
    var t = filmTime();
    if (!state.ended) {
      showScene(sceneAt(t));
      for (var i = 0; i < 5; i++) setLit(i, reduced ? true : t >= ARRIVE[i], true);
    }
    if (document.activeElement !== seek) {
      seek.value = t.toFixed(2);
    }
    seek.style.setProperty('--p', (t / FILM_END * 100).toFixed(2) + '%');
    requestAnimationFrame(tick);
  }

  /* ---------- Public API for the WebGL layer (fx.js) ---------- */
  window.CREATE = {
    time: filmTime,
    playing: isPlaying,
    isReduced: function () { return reduced; },
    ended: function () { return state.ended; },
    skipped: function () { return state.skipped; },
    STREAM: STREAM,
    ARRIVE: ARRIVE,
    FILM_END: FILM_END,
    // Where the coffee is in the frame (the rim of the fallen cup) in video-relative coordinates.
    CUP: { x: 0.30, y: 0.775 },
    video: video,
    tokens: tokens
  };

  /* ---------- Controls ---------- */
  playBtn.addEventListener('click', function () { isPlaying() ? pause() : play(); });
  bigPlay.addEventListener('click', play);
  $('#replay').addEventListener('click', restart);
  $('#heroReplay').addEventListener('click', function () { scrollToEl($('#top')); restart(); });
  $('#endReplay').addEventListener('click', function () { scrollToEl($('#top')); restart(); });
  $('#skip').addEventListener('click', function () { finish(true); scrollToEl($('#gifts')); });
  soundBtn.addEventListener('click', function () {
    video.muted = !video.muted;
    soundBtn.setAttribute('aria-pressed', String(!video.muted));
    soundBtn.setAttribute('aria-label', video.muted ? 'Turn sound on' : 'Turn sound off');
    soundBtn.querySelector('use').setAttribute('href', video.muted ? '#i-sound-off' : '#i-sound-on');
  });
  seek.addEventListener('input', function () {
    var v = parseFloat(seek.value);
    clearTimeout(state.endTimer);
    if (v >= FILM_END - 0.05) { finish(true); return; }
    state.ended = false; state.skipped = false;
    video.currentTime = v;
  });

  video.addEventListener('play', setPlayUI);
  video.addEventListener('pause', setPlayUI);
  video.addEventListener('ended', function () { finish(false); });
  video.addEventListener('error', function () {
    capTitle.textContent = 'The film could not load';
    capLine.textContent = 'Please refresh the page. The five gifts below are fully available.';
    setAllLit(true, false);
  }, true);

  // Keyboard: space toggles when the film area is focused
  $('#film').addEventListener('keydown', function (e) { if (e.key === ' ' && e.target === this) { e.preventDefault(); isPlaying() ? pause() : play(); } });

  /* ---------- Smooth scroll helper ---------- */
  function scrollToEl(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- Gift cards ---------- */
  function setCard(card, open) {
    var btn = card.querySelector('.card-toggle');
    card.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
  }
  $$('.card').forEach(function (card) {
    card.querySelector('.card-toggle').addEventListener('click', function () {
      setCard(card, !card.classList.contains('open'));
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') $$('.card.open').forEach(function (c) { setCard(c, false); });
  });
  function openGift(n) {
    var card = $('#gift-' + n);
    if (!card) return;
    setCard(card, true);
    scrollToEl(card);
    setTimeout(function () { card.querySelector('.card-toggle').focus({ preventScroll: true }); }, reduced ? 0 : 700);
  }
  tokens.forEach(function (tk) { tk.addEventListener('click', function () { openGift(tk.getAttribute('data-gift')); }); });

  /* ---------- Story chapters ---------- */
  var list = $('#chapters');
  SCENES.forEach(function (s, i) {
    var li = document.createElement('li');
    li.className = 'chapter reveal-on-scroll';
    li.innerHTML =
      '<button type="button"><img src="assets/img/' + s.img + '.webp" alt="" loading="lazy" width="400" height="500" style="object-position:' + s.pos + '">' +
      '<span class="ch-body"><span class="ch-num">Scene 0' + s.n + '</span><span class="ch-title">' + s.title + '</span>' +
      '<span class="ch-line">' + s.line + '</span><span class="ch-watch">' + (s.n === 8 ? 'See the ending →' : 'Watch this scene →') + '</span></span></button>';
    li.querySelector('button').addEventListener('click', function () {
      if (s.n === 8) { finish(true); showScene(7); scrollToEl($('#ending')); return; }
      clearTimeout(state.endTimer);
      state.ended = false; state.skipped = false;
      video.currentTime = s.start;
      if (!reduced) for (var k = 0; k < 5; k++) setLit(k, s.start >= ARRIVE[k], false);
      scrollToEl($('#top'));
      play();
    });
    list.appendChild(li);
  });

  /* ---------- Timeline ticks ---------- */
  var ticks = $('#ticks');
  SCENES.forEach(function (s) {
    if (s.start === null || s.start === 0) return;
    var i = document.createElement('i'); i.style.left = (s.start / FILM_END * 100) + '%'; ticks.appendChild(i);
  });

  /* ---------- Scroll reveal ---------- */
  $$('.section-head, .card, .sb-frame, .end-copy, .end-portrait').forEach(function (el) { el.classList.add('reveal-on-scroll'); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.reveal-on-scroll').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal-on-scroll').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Start ---------- */
  applyMotion();
  showScene(0);
  setAllLit(false, false);
  if (reduced) {
    setAllLit(true, false);
    bigPlay.hidden = false;
  } else {
    video.muted = true;
    var p = video.play();
    if (p && p.catch) p.catch(function () { bigPlay.hidden = false; setPlayUI(); });
  }
  setPlayUI();
  requestAnimationFrame(tick);
})();
