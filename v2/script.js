/* =========================================================
   ANDES — script.js
   1) Base (siempre): nav, menú, reveals, el reel del hero con la
      cordillera sobre el reel, los demos de cada tramo, el lightbox,
      el riel, las preguntas, la CTA fija, el formulario.
   2) Capa cinemática (si GSAP y Lenis llegan): scroll suave, título
      enmascarado, la escena del prólogo que se ata al scrollear,
      el riel, parallax, contadores, botones magnéticos.
   Si una librería no carga, la base sigue funcionando sola.
   ========================================================= */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var finePointer = true;
  try { finePointer = window.matchMedia('(pointer: fine)').matches; } catch (e) {}
  // En el celular las demos son las versiones verticales: en 16:9 a 350 px la
  // interfaz no se lee. Se decide al cargar; girar el teléfono no cambia la fuente.
  var VERT = false;
  try { VERT = window.matchMedia('(max-width: 720px)').matches; } catch (e) {}
  var saveData = false;
  try { saveData = Boolean(navigator.connection && navigator.connection.saveData); } catch (e) {}

  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  var hasLenis = typeof window.Lenis !== 'undefined';
  var hasIO = 'IntersectionObserver' in window;

  var CHAPTERS = [
    { id: 'social-listener', name: 'Social Listener', verb: 'Escuchar', interes: 'Escuchar (Social Listener)', line: 'Qué se dice de tus marcas y de la competencia en redes, y qué comentarios piden respuesta.' },
    { id: 'readapt', name: 'Re·Adapt', verb: 'Crear', interes: 'Crear (Re·Adapt)', line: 'Generá piezas con IA, retocalas por partes y llevalas a todos los formatos.' },
    { id: 'imprint', name: 'Imprint', verb: 'Multiplicar', interes: 'Multiplicar (Imprint)', line: 'Armá creativos en todas las medidas con la identidad de la marca, y repetilos por cientos.' },
    { id: 'creative-check', name: 'Creative Check', verb: 'Revisar', interes: 'Revisar (Creative Check)', line: 'Revisá una pieza antes de publicarla y escribile los copies.' },
    { id: 'implementador', name: 'Implementador', verb: 'Publicar', interes: 'Publicar (Implementador)', line: 'Subí anuncios a Meta en lote a partir de plantillas, sin armarlos uno por uno.' },
    { id: 'lanchat', name: 'Lanchat', verb: 'Entender', interes: 'Entender (Lanchat)', line: 'El chat de ABN con los datos de cada cliente.' }
  ];
  var TOTAL = CHAPTERS.length;
  var KNOT_X = [8.333, 25, 41.667, 58.333, 75, 91.667];
  function pad(n) { return String(n).padStart(2, '0'); }

  var lenis = null;
  var lightboxOpen = false;

  /* ---------- Nav: hairline, progreso y registro ---------- */
  var nav = document.querySelector('.nav');
  var progress = document.getElementById('navProgress');
  var scrollTicking = false;
  var scrollWatchers = [];
  function onScrollFrame() {
    scrollTicking = false;
    var y = window.scrollY;
    if (nav) nav.classList.toggle('is-scrolled', y > 8);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    }
    scrollWatchers.forEach(function (fn) { fn(y); });
  }
  function onScroll() { if (!scrollTicking) { scrollTicking = true; window.requestAnimationFrame(onScrollFrame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- Menú móvil ---------- */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('mobileMenu');
  if (toggle && menu && nav) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      nav.classList.toggle('is-open', open);
      menu.hidden = !open;
      if (open) nav.classList.add('is-scrolled');
    };
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lightboxOpen) setOpen(false); });
  }

  /* ---------- Reveals ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (reveals.length) {
    if (reduce || !hasIO) {
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      if (!html.classList.contains('animate-ready')) html.classList.add('animate-ready');
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add('is-visible'); obs.unobserve(entry.target); }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
      reveals.forEach(function (el) { io.observe(el); });
      window.setTimeout(function () { reveals.forEach(function (el) { el.classList.add('is-visible'); }); }, 4000);
    }
  }

  /* =========================================================
     REEL + la cordillera: cada cumbre es un producto y el tramo violeta avanza con el video
     ========================================================= */
  var reel = (function () {
    var root = document.getElementById('reel');
    if (!root) return null;
    var videos = Array.prototype.slice.call(root.querySelectorAll('.reel__video'));
    var toggleBtn = document.getElementById('reelToggle');
    var big = document.getElementById('reelBig');
    var count = document.getElementById('reelCount');
    var line = document.getElementById('reelLine');
    var go = document.getElementById('reelGo');
    var tag = document.getElementById('reelTag');
    var rope = document.getElementById('reelRope');
    var knots = rope ? Array.prototype.slice.call(rope.querySelectorAll('.knot')) : [];
    // El nombre se oculta en el celular; el botón conserva su nombre accesible.
    knots.forEach(function (k, i) { k.setAttribute('aria-label', 'Ver ' + CHAPTERS[i].name); });

    var current = 0;
    var playing = !reduce && !saveData;
    var held = false;            // el lightbox lo detiene sin cambiar lo que la persona eligió
    var chosen = false;          // tocar un producto corta el avance: ese se repite
    var onScreen = true;
    var tabVisible = !document.hidden;
    var raf = 0;

    function load(i) {
      var v = videos[i];
      if (!v || v.getAttribute('src')) return;
      var dir = VERT ? 'media/cortes-v/' : 'media/cortes/';
      v.setAttribute('poster', dir + CHAPTERS[i].id + '.jpg');
      v.setAttribute('src', dir + CHAPTERS[i].id + '.mp4');
      v.load();
    }
    function active() { return playing && !held && onScreen && tabVisible; }
    function ropeTo(ratio) {
      if (!rope) return;
      var from = KNOT_X[current];
      var to = current < TOTAL - 1 ? KNOT_X[current + 1] : from;
      rope.style.setProperty('--rope-x', (from + (to - from) * ratio).toFixed(3) + '%');
    }
    function paint() {
      var v = videos[current];
      if (v && v.duration) {
        var ratio = v.currentTime / v.duration;
        ropeTo(ratio);
        if (ratio > 0.5) load((current + 1) % TOTAL);
      }
      if (active()) raf = window.requestAnimationFrame(paint);
    }
    var fallidos = 0;
    function saltar() {
      fallidos += 1;
      if (fallidos >= TOTAL) { setPlaying(false); return; }
      goTo((current + 1) % TOTAL);
    }
    function sync() {
      load(current);
      var actual = videos[current];
      if (actual && actual.error) { window.setTimeout(function () { if (videos[current] === actual && actual.error) saltar(); }, 600); }
      videos.forEach(function (v, i) {
        v.classList.toggle('is-current', i === current);
        v.loop = chosen;
        if (i === current && active()) {
          var p = v.play();
          if (p && p.catch) p.catch(function (err) { if (err && err.name === 'NotAllowedError') setPlaying(false); });
        } else {
          v.pause();
        }
      });
      knots.forEach(function (k, i) {
        k.classList.toggle('is-on', i === current); k.classList.toggle('is-past', i < current);
        if (i === current) k.setAttribute('aria-current', 'true'); else k.removeAttribute('aria-current');
      });
      if (!videos[current] || !videos[current].duration) ropeTo(0);
      if (count) count.textContent = pad(current + 1) + ' / ' + pad(TOTAL);
      if (line) line.textContent = CHAPTERS[current].line;
      if (go) go.setAttribute('href', '#tramo-' + (current + 1));
      if (tag) tag.innerHTML = '<b>' + pad(current + 1) + '</b> ' + CHAPTERS[current].name;
      window.cancelAnimationFrame(raf);
      paint();
    }
    function setPlaying(v) {
      playing = v;
      if (toggleBtn) { toggleBtn.setAttribute('aria-pressed', String(v)); toggleBtn.setAttribute('aria-label', v ? 'Pausar' : 'Reproducir'); }
      if (big) big.hidden = v;
      sync();
    }
    function goTo(i) {
      var v = videos[i];
      if (v) { try { v.currentTime = 0; } catch (e) {} }
      current = i;
      sync();
    }
    function choose(i) {
      chosen = true;
      playing = true;
      if (toggleBtn) { toggleBtn.setAttribute('aria-pressed', 'true'); toggleBtn.setAttribute('aria-label', 'Pausar'); }
      if (big) big.hidden = true;
      goTo(i);
    }

    videos.forEach(function (v, i) {
      v.addEventListener('ended', function () { if (i === current && !chosen) goTo((current + 1) % TOTAL); });
      // Si el archivo no llega, el reel sigue con el próximo en vez de quedarse en negro.
      v.addEventListener('error', function () { if (i === current) window.setTimeout(function () { if (i === current) saltar(); }, 600); });
      v.addEventListener('playing', function () { fallidos = 0; });
    });
    knots.forEach(function (k) { k.addEventListener('click', function () { choose(Number(k.getAttribute('data-i'))); }); });
    if (toggleBtn) toggleBtn.addEventListener('click', function () { setPlaying(!playing); });
    if (big) big.addEventListener('click', function () { setPlaying(true); });

    if (hasIO) {
      new IntersectionObserver(function (entries) { onScreen = Boolean(entries[0] && entries[0].isIntersecting); sync(); }, { threshold: 0.25 }).observe(root);
    }
    document.addEventListener('visibilitychange', function () { tabVisible = !document.hidden; sync(); });

    setPlaying(playing);
    return {
      hold: function () { held = true; sync(); },
      release: function () { held = false; sync(); },
      current: function () { return current; }
    };
  })();

  /* =========================================================
     DEMOS DE CADA TRAMO
     ========================================================= */
  var demos = (function () {
    var figs = Array.prototype.slice.call(document.querySelectorAll('.demo'));
    var items = [];
    figs.forEach(function (fig) {
      var video = fig.querySelector('.demo__video');
      var toggleBtn = fig.querySelector('.demo__toggle');
      if (!video) return;
      var wanted = !reduce && !saveData;
      var visible = false;
      var loaded = false;
      var suspended = false;

      function load() {
        if (loaded) return;
        loaded = true;
        var v = VERT && video.getAttribute('data-src-v');
        var poster = video.getAttribute(v ? 'data-poster-v' : 'data-poster');
        if (poster) video.setAttribute('poster', poster);
        video.setAttribute('src', video.getAttribute(v ? 'data-src-v' : 'data-src'));
        video.load();
      }
      if (VERT && video.getAttribute('data-va')) fig.style.setProperty('--va', video.getAttribute('data-va'));
      // Cuánto falta de la demo
      var bar = fig.querySelector('.demo__progress span');
      if (bar) video.addEventListener('timeupdate', function () {
        if (video.duration) bar.style.transform = 'scaleX(' + (video.currentTime / video.duration).toFixed(4) + ')';
      });
      function reflect() {
        var on = wanted && visible && !suspended;
        if (toggleBtn) { toggleBtn.setAttribute('aria-pressed', String(wanted)); toggleBtn.setAttribute('aria-label', wanted ? 'Pausar' : 'Reproducir'); }
        fig.classList.toggle('is-paused', !wanted);
        if (on) {
          load();
          var p = video.play();
          if (p && p.catch) p.catch(function (err) { if (err && err.name === 'NotAllowedError') { wanted = false; reflect(); } });
        } else {
          video.pause();
        }
      }
      if (toggleBtn) toggleBtn.addEventListener('click', function (e) { e.stopPropagation(); wanted = !wanted; reflect(); });

      if (hasIO) {
        new IntersectionObserver(function (entries) { entries.forEach(function (entry) { if (entry.isIntersecting) load(); }); }, { rootMargin: '600px 0px' }).observe(fig);
        new IntersectionObserver(function (entries) { visible = Boolean(entries[0] && entries[0].isIntersecting); reflect(); }, { threshold: 0.35 }).observe(fig);
      } else { visible = true; reflect(); }
      document.addEventListener('visibilitychange', function () { if (document.hidden) video.pause(); else reflect(); });

      items.push({ suspend: function () { suspended = true; reflect(); }, resume: function () { suspended = false; reflect(); } });
    });
    return {
      suspendAll: function () { items.forEach(function (d) { d.suspend(); }); },
      resumeAll: function () { items.forEach(function (d) { d.resume(); }); }
    };
  })();

  /* =========================================================
     LIGHTBOX — la demo completa, con anterior y siguiente
     ========================================================= */
  var lightbox = (function () {
    var box = document.getElementById('lightbox');
    if (!box) return null;
    var panel = box.querySelector('.lightbox__panel');
    var video = document.getElementById('lbVideo');
    var kicker = document.getElementById('lbKicker');
    var title = document.getElementById('lbTitle');
    var count = document.getElementById('lbCount');
    var prev = document.getElementById('lbPrev');
    var next = document.getElementById('lbNext');
    var cta = document.getElementById('lbCta');
    var closeBtn = document.getElementById('lbClose');
    var current = 0;
    var opener = null;

    function show(i) {
      current = (i + TOTAL) % TOTAL;
      var c = CHAPTERS[current];
      if (kicker) kicker.textContent = 'Tramo ' + pad(current + 1) + ' · ' + c.verb;
      if (title) title.textContent = c.name;
      if (count) count.textContent = pad(current + 1) + ' / ' + pad(TOTAL);
      if (cta) cta.setAttribute('data-interes', c.interes);
      if (video) {
        var dir = VERT ? 'media/v/' : 'media/';
        video.setAttribute('poster', dir + c.id + '.jpg');
        video.setAttribute('src', dir + c.id + '.mp4');
        video.load();
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
      }
    }
    function open(i, from) {
      opener = from || document.activeElement;
      lightboxOpen = true;
      box.hidden = false;
      document.body.classList.add('is-locked');
      if (lenis) lenis.stop();
      if (reel) reel.hold();
      demos.suspendAll();
      var bar = document.getElementById('stickyCta');
      if (bar) bar.classList.remove('is-shown');
      show(i);
      window.setTimeout(function () { if (closeBtn) closeBtn.focus(); }, 30);
    }
    function close() {
      if (!lightboxOpen) return;
      lightboxOpen = false;
      if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
      box.hidden = true;
      document.body.classList.remove('is-locked');
      if (lenis) lenis.start();
      if (reel) reel.release();
      demos.resumeAll();
      onScroll();
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    }

    box.querySelectorAll('[data-close]').forEach(function (el) { el.addEventListener('click', function () { close(); }); });
    if (prev) prev.addEventListener('click', function () { show(current - 1); });
    if (next) next.addEventListener('click', function () { show(current + 1); });
    document.addEventListener('keydown', function (e) {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowRight') show(current + 1);
      else if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'Tab' && panel) {
        var f = Array.prototype.slice.call(panel.querySelectorAll('button, [href], video, [tabindex]:not([tabindex="-1"])')).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    document.querySelectorAll('.demo__open, .demo__full').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var i = Number(b.getAttribute('data-demo') || (b.closest('.demo') && b.closest('.demo').getAttribute('data-demo')) || 0);
        open(i, b);
      });
    });
    document.querySelectorAll('.demo').forEach(function (fig) {
      fig.addEventListener('click', function (e) {
        if (e.target.closest('button')) return;
        open(Number(fig.getAttribute('data-demo') || 0), fig.querySelector('.demo__full') || fig);
      });
    });
    var reelFull = document.getElementById('reelFull');
    if (reelFull) reelFull.addEventListener('click', function () { open(reel ? reel.current() : 0, reelFull); });

    return { open: open, close: close };
  })();

  /* =========================================================
     PIEZAS — el cilindro. Geometría medida de Polaris en 1440 px:
     perspectiva 900, radio 1008, tarjetas de 310 × 480 cada 22,5°.
     La cámara está adentro: el anillo gira y las de los costados,
     más cerca, se ven más altas. Se frena con el mouse y se arrastra.
     ========================================================= */
  (function arc() {
    var root = document.getElementById('arc');
    var ring = document.getElementById('arcRing');
    if (!root || !ring) return;
    var cards = Array.prototype.slice.call(ring.querySelectorAll('.arc__card'));
    var n = cards.length;
    if (!n) return;
    var STEP = 360 / n;
    root.classList.add('is-3d');

    var rot = 0;                         // grados
    var speed = reduce ? 0 : 4.2;        // grados por segundo, como Polaris
    var hovering = false, dragging = false, visible = true;
    var startX = 0, startRot = 0, lastX = 0, lastMoveT = 0, velocity = 0, lastT = 0;
    var pxPerDeg = 10;

    function measure() {
      var w = root.clientWidth;
      // En el celular la escala no baja de 0,62 y la cámara se aleja un poco,
      // si no la tarjeta del centro queda de 70 px.
      var k = Math.max(w / 1440, 0.62);
      var R = 1008 * k;
      var P = (w < 720 ? 1.15 * R : 900 * k);
      var cw = 310 * k, ch = 480 * k;
      root.style.setProperty('--arc-p', P.toFixed(0) + 'px');
      root.style.setProperty('--card-w', cw.toFixed(0) + 'px');
      root.style.setProperty('--card-h', ch.toFixed(0) + 'px');
      root.style.setProperty('--arc-h', Math.round(ch * 0.92) + 'px');
      cards.forEach(function (c, i) {
        c.style.transform = 'rotateY(' + (i * STEP) + 'deg) translateZ(' + (-R).toFixed(1) + 'px)';
      });
      // Un grado de giro, en píxeles de pantalla sobre la tarjeta del frente
      pxPerDeg = (R * Math.PI / 180) * (P / (P + R));
    }
    function paint() {
      ring.style.transform = 'translateZ(0) rotateY(' + rot.toFixed(3) + 'deg)';
      for (var i = 0; i < n; i++) {
        var a = ((i * STEP + rot) % 360 + 540) % 360 - 180;   // ángulo respecto de la cámara
        var abs = Math.abs(a);
        // Más allá de 80° la tarjeta queda detrás de la cámara o enorme.
        var o = abs > 80 ? 0 : abs > 66 ? (80 - abs) / 14 : 1;
        var c = cards[i];
        if (c._o !== o) { c.style.opacity = String(o); c.style.visibility = o === 0 ? 'hidden' : 'visible'; c._o = o; }
      }
    }
    function frame(t) {
      var dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
      lastT = t;
      if (!dragging) {
        if (Math.abs(velocity) > 0.5) { rot += velocity * dt; velocity *= Math.pow(0.05, dt); }
        else if (!hovering) rot -= speed * dt;
      }
      paint();
      if (visible) window.requestAnimationFrame(frame); else lastT = 0;
    }

    root.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hovering = true; });
    root.addEventListener('pointerleave', function () { hovering = false; });
    root.addEventListener('pointerdown', function (e) {
      dragging = true; velocity = 0; startX = lastX = e.clientX; startRot = rot; lastMoveT = performance.now();
      root.classList.add('is-dragging');
      try { root.setPointerCapture(e.pointerId); } catch (err) {}
    });
    root.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var now = performance.now();
      rot = startRot + (e.clientX - startX) / pxPerDeg;
      var dtm = Math.max(1, now - lastMoveT);
      velocity = ((e.clientX - lastX) / pxPerDeg) / (dtm / 1000);
      lastX = e.clientX; lastMoveT = now;
    });
    function release() { if (!dragging) return; dragging = false; root.classList.remove('is-dragging'); }
    root.addEventListener('pointerup', release);
    root.addEventListener('pointercancel', release);
    root.setAttribute('tabindex', '0');
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { velocity = 0; rot -= STEP; paint(); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { velocity = 0; rot += STEP; paint(); e.preventDefault(); }
    });

    measure(); paint();
    window.addEventListener('resize', function () { measure(); paint(); });
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        var was = visible;
        visible = Boolean(entries[0] && entries[0].isIntersecting);
        if (visible && !was) window.requestAnimationFrame(frame);
      }, { rootMargin: '100px 0px' }).observe(root);
    }
    window.requestAnimationFrame(frame);
  })();

  /* ---------- Cursor "Ver completa" sobre los demos ---------- */
  (function cursor() {
    var el = document.getElementById('cursor');
    if (!el || !finePointer || reduce) return;
    var on = false;
    document.addEventListener('pointermove', function (e) {
      var demo = e.target.closest && e.target.closest('.demo');
      var overBtn = e.target.closest && e.target.closest('.demo__btn');
      var want = Boolean(demo) && !overBtn && !lightboxOpen;
      if (want) { el.style.left = e.clientX + 'px'; el.style.top = e.clientY + 'px'; }
      if (want !== on) { on = want; el.classList.toggle('is-on', on); }
    }, { passive: true });
    document.addEventListener('pointerleave', function () { on = false; el.classList.remove('is-on'); });
  })();

  /* =========================================================
     RIEL — qué tramo está a la vista
     ========================================================= */
  (function rail() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.rail__list a'));
    var chapters = Array.prototype.slice.call(document.querySelectorAll('.chapter'));
    if (!links.length || !chapters.length) return;
    var active = -1;
    scrollWatchers.push(function () {
      var line = window.innerHeight * 0.5;
      var next = 0;
      chapters.forEach(function (c, i) { if (c.getBoundingClientRect().top <= line) next = i; });
      if (next === active) return;
      active = next;
      links.forEach(function (a, i) { a.classList.toggle('is-active', i === active); a.classList.toggle('is-past', i < active); });
      if (!hasST) {
        var rope = document.querySelector('.rail__rope');
        if (rope) rope.style.setProperty('--draw', String(active / Math.max(1, chapters.length - 1)));
      }
    });
  })();


  /* ---------- Menú: qué sección está a la vista ---------- */
  (function spy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav__links a[href^="#"]'));
    var targets = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
    if (!links.length) return;
    var current = -1;
    scrollWatchers.push(function () {
      var line = window.innerHeight * 0.35, next = -1;
      targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top <= line && t.getBoundingClientRect().bottom > line) next = i; });
      if (next === current) return;
      current = next;
      links.forEach(function (a, i) {
        a.classList.toggle('is-active', i === current);
        if (i === current) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    });
  })();

  /* ---------- Preguntas ---------- */
  (function faq() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.faq__item'));
    items.forEach(function (item) {
      var q = item.querySelector('.faq__q');
      if (!q) return;
      q.addEventListener('click', function () {
        var open = q.getAttribute('aria-expanded') === 'true';
        items.forEach(function (o) { o.classList.remove('is-open'); var b = o.querySelector('.faq__q'); if (b) b.setAttribute('aria-expanded', 'false'); });
        if (!open) { item.classList.add('is-open'); q.setAttribute('aria-expanded', 'true'); }
      });
    });
  })();

  /* ---------- CTA fija en el celular ---------- */
  (function sticky() {
    var bar = document.getElementById('stickyCta');
    var hero = document.querySelector('.hero');
    var contact = document.getElementById('contacto');
    if (!bar || !hero) return;
    bar.hidden = false;
    scrollWatchers.push(function (y) {
      var narrow = window.innerWidth <= 900;
      var pastHero = y > hero.offsetTop + hero.offsetHeight - 80;
      var atContact = contact ? contact.getBoundingClientRect().top < window.innerHeight * 0.7 : false;
      bar.classList.toggle('is-shown', narrow && pastHero && !atContact && !lightboxOpen);
    });
  })();

  /* =========================================================
     FORMULARIO — arma el correo, sin backend
     ========================================================= */
  (function form() {
    var form = document.getElementById('demoForm');
    if (!form) return;
    var note = document.getElementById('formNote');
    var interes = document.getElementById('interes');

    document.querySelectorAll('[data-interes]').forEach(function (a) {
      a.addEventListener('click', function () {
        var value = a.getAttribute('data-interes');
        if (!interes || !value) return;
        Array.prototype.slice.call(interes.options).forEach(function (o) { if (o.text === value) interes.value = o.text; });
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nombre = form.nombre.value.trim();
      var empresa = form.empresa.value.trim();
      var email = form.email.value.trim();
      var mensaje = form.mensaje.value.trim();
      var que = interes ? interes.value : '';
      if (!nombre || !empresa || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (note) { note.textContent = 'Falta tu nombre, la empresa o un correo válido.'; note.className = 'form__note is-error'; }
        var first = [form.nombre, form.empresa, form.email].find(function (f) { return !f.value.trim(); }) || form.email;
        first.focus();
        return;
      }
      var subject = 'Demo de Andes · ' + empresa;
      var body = 'Hola, soy ' + nombre + ' de ' + empresa + '.\n\n' +
        'Quiero una demo de Andes. Lo que querría resolver primero: ' + que + '.\n' +
        (mensaje ? '\nContexto:\n' + mensaje + '\n' : '') +
        '\nMe escribís a ' + email + '.\n';
      window.location.href = 'mailto:juanpablo@hikethecloud.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      if (note) { note.textContent = 'Se abrió tu correo con el mensaje listo para mandar.'; note.className = 'form__note is-ok'; }
      var done = document.getElementById('formDone');
      var wa = document.getElementById('waMsg');
      var copy = document.getElementById('copyMsg');
      if (wa) wa.setAttribute('href', 'https://wa.me/5491167825404?text=' + encodeURIComponent(body));
      if (copy) copy.onclick = function () {
        var ok = function () { copy.textContent = 'Mensaje copiado'; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(body).then(ok, function () {});
        else { var t = document.createElement('textarea'); t.value = body; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); ok(); } catch (err) {} t.remove(); }
      };
      if (done) done.hidden = false;
    });
  })();

  /* =========================================================
     SCROLL SUAVE (Lenis) + anclas
     ========================================================= */
  if (hasLenis && !reduce) {
    try {
      lenis = new window.Lenis({ duration: 1.05, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true, touchMultiplier: 1.5 });
      if (hasGSAP) {
        if (hasST) lenis.on('scroll', window.ScrollTrigger.update);
        window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        window.gsap.ticker.lagSmoothing(0);
      } else {
        var loop = function (t) { lenis.raf(t); window.requestAnimationFrame(loop); };
        window.requestAnimationFrame(loop);
      }
    } catch (e) { lenis = null; }
  }

  var headerOffset = 72;
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var go = function () {
        if (lenis) lenis.scrollTo(target, { offset: -headerOffset, duration: 1.1 });
        else {
          var y = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
          window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
        }
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        if (history.replaceState) history.replaceState(null, '', id);
      };
      // Desde el lightbox, primero se cierra y recién después se va.
      if (lightboxOpen) window.setTimeout(go, 60); else go();
    });
  });

  /* =========================================================
     CAPA CINEMÁTICA
     ========================================================= */
  var scene = document.getElementById('scene');

  if (hasGSAP && !reduce) (function cinematic() {
    var gsap = window.gsap;
    var ST = null;
    if (hasST) { try { gsap.registerPlugin(window.ScrollTrigger); ST = window.ScrollTrigger; } catch (e) {} }

    (function heroTitle() {
      var title = document.getElementById('hero-title');
      if (!title) return;
      try {
        var text = title.textContent.trim();
        title.setAttribute('aria-label', text);
        title.innerHTML = text.split('').map(function (c) { return '<span class="char" aria-hidden="true">' + c + '</span>'; }).join('');
        var chars = title.querySelectorAll('.char');
        html.classList.add('gsap-ready');
        gsap.fromTo(chars, { opacity: 0, yPercent: 40, filter: 'blur(12px)' }, { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 1.4, ease: 'power3.out', stagger: 0.06, delay: 0.25 });
      } catch (e) { html.classList.add('gsap-ready'); title.style.opacity = '1'; }
    })();

    if (!ST) { if (scene) sceneFallback(); return; }

    /* La escena del prólogo: en escritorio se clava y se ata al scrollear;
       en el celular se ata mientras pasa. */
    (function sceneScrub() {
      var wrap = document.getElementById('sceneWrap');
      if (!scene || !wrap) return;
      var mm = gsap.matchMedia();
      mm.add('(min-width: 1024px) and (min-height: 700px)', function () {
        ST.create({ trigger: wrap, start: 'center center', end: '+=90%', pin: true, anticipatePin: 1 });
        gsap.fromTo(scene, { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: { trigger: wrap, start: 'center center', end: '+=90%', scrub: 0.6 } });
      });
      mm.add('(max-width: 1023px), (max-height: 699px)', function () {
        gsap.fromTo(scene, { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: { trigger: scene, start: 'top 85%', end: 'center 35%', scrub: 0.6 } });
      });
    })();

    (function rope() {
      var rope = document.querySelector('.rail__rope');
      var chapters = document.querySelector('.chapters');
      if (!rope || !chapters) return;
      gsap.fromTo(rope, { '--draw': 0 }, { '--draw': 1, ease: 'none', scrollTrigger: { trigger: chapters, start: 'top 55%', end: 'bottom 60%', scrub: 0.4 } });
    })();

    (function parallax() {
      var center = document.querySelector('.hero__center');
      if (center) gsap.to(center, { yPercent: 18, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });
      var big = document.querySelector('.footer__big');
      if (big) gsap.fromTo(big, { yPercent: 30 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: 0.6 } });
    })();

    (function facts() {
      gsap.utils.toArray('.fact__num').forEach(function (el) {
        var text = el.textContent.trim();
        var m = text.match(/^(\D*)(\d+)(.*)$/);
        if (!m) return;
        var target = Number(m[2]);
        var obj = { n: 0 };
        gsap.to(obj, {
          n: target, duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onUpdate: function () { el.textContent = m[1] + Math.round(obj.n) + m[3]; },
          onComplete: function () { el.textContent = text; }
        });
      });
    })();

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
    window.addEventListener('load', function () { ST.refresh(); });
  })();
  else if (scene) sceneFallback();

  // Sin GSAP, la escena se ata sola al entrar a la vista (la transición es CSS).
  function sceneFallback() {
    if (reduce || !hasIO) { scene.classList.add('is-roped'); return; }
    new IntersectionObserver(function (entries, obs) {
      if (entries[0] && entries[0].isIntersecting) { scene.classList.add('is-roped'); obs.disconnect(); }
    }, { threshold: 0.45 }).observe(scene);
  }

  /* ---------- Botones magnéticos ---------- */
  if (!reduce && finePointer) {
    document.querySelectorAll('.btn--magnetic').forEach(function (btn) {
      var strength = 0.3;
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var mx = (e.clientX - (r.left + r.width / 2)) * strength;
        var my = (e.clientY - (r.top + r.height / 2)) * strength;
        if (hasGSAP) window.gsap.to(btn, { x: mx, y: my, duration: 0.4, ease: 'power3.out' });
        else btn.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      });
      btn.addEventListener('pointerleave', function () {
        if (hasGSAP) window.gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
        else btn.style.transform = '';
      });
    });
  }

  onScrollFrame();
})();
