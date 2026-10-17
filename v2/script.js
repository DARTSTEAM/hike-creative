/* =========================================================
   CORDADA — script.js
   1) Base (siempre): nav, menú, reveals, el reel del hero con la
      cuerda bajo el nombre, los demos de cada tramo, el lightbox,
      el riel, las preguntas, la CTA fija, el formulario.
   2) Capa cinemática (si GSAP y Lenis llegan): scroll suave, título
      enmascarado, la escena del prólogo que se ata al scrollear,
      la cuerda del riel, parallax, contadores, botones magnéticos.
   Si una librería no carga, la base sigue funcionando sola.
   ========================================================= */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var finePointer = true;
  try { finePointer = window.matchMedia('(pointer: fine)').matches; } catch (e) {}
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
  var KNOT_X = [1.2, 20, 40, 60, 80, 98.8];
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

  var toned = Array.prototype.slice.call(document.querySelectorAll('[data-tone]'));
  if (toned.length && hasIO) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) html.setAttribute('data-nav', entry.target.getAttribute('data-tone'));
      });
    }, { rootMargin: '-64px 0px -' + Math.max(0, window.innerHeight - 66) + 'px 0px', threshold: 0 });
    toned.forEach(function (el) { navIO.observe(el); });
  }

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
     REEL DEL HERO + la cuerda bajo el nombre
     ========================================================= */
  var reel = (function () {
    var root = document.getElementById('reel');
    if (!root) return null;
    var videos = Array.prototype.slice.call(root.querySelectorAll('.reel__video'));
    var buttons = Array.prototype.slice.call(root.querySelectorAll('.reel__chapters button'));
    var fills = buttons.map(function (b) { return b.querySelector('.reel__fill'); });
    var toggleBtn = document.getElementById('reelToggle');
    var big = document.getElementById('reelBig');
    var count = document.getElementById('reelCount');
    var line = document.getElementById('reelLine');
    var go = document.getElementById('reelGo');
    var tag = document.getElementById('reelTag');
    var frame = document.getElementById('reelFrame');
    var rope = document.getElementById('heroRope');
    var knots = rope ? Array.prototype.slice.call(rope.querySelectorAll('.knot')) : [];

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
      v.setAttribute('poster', 'media/cortes/' + CHAPTERS[i].id + '.jpg');
      v.setAttribute('src', 'media/cortes/' + CHAPTERS[i].id + '.mp4');
      v.load();
    }
    function active() { return playing && !held && onScreen && tabVisible; }
    function paint() {
      var v = videos[current];
      var f = fills[current];
      if (v && f && v.duration) f.style.transform = 'scaleX(' + (v.currentTime / v.duration) + ')';
      if (active()) raf = window.requestAnimationFrame(paint);
    }
    function sync() {
      load(current); load((current + 1) % TOTAL);
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
      fills.forEach(function (f, i) { if (i !== current) f.style.transform = 'scaleX(' + (i < current ? 1 : 0) + ')'; });
      buttons.forEach(function (b, i) { if (i === current) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      knots.forEach(function (k, i) { k.classList.toggle('is-on', i === current); k.classList.toggle('is-past', i < current); });
      if (rope) rope.style.setProperty('--rope-x', KNOT_X[current] + '%');
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
    });
    buttons.forEach(function (b) { b.addEventListener('click', function () { choose(Number(b.getAttribute('data-i'))); }); });
    knots.forEach(function (k) { k.addEventListener('click', function () { choose(Number(k.getAttribute('data-i'))); }); });
    if (toggleBtn) toggleBtn.addEventListener('click', function () { setPlaying(!playing); });
    if (big) big.addEventListener('click', function () { setPlaying(true); });

    if (hasIO) {
      new IntersectionObserver(function (entries) { onScreen = Boolean(entries[0] && entries[0].isIntersecting); sync(); }, { threshold: 0.25 }).observe(root);
    }
    document.addEventListener('visibilitychange', function () { tabVisible = !document.hidden; sync(); });

    // El marco sigue al mouse, apenas: un objeto, no una imagen.
    if (frame && finePointer && !reduce) {
      root.addEventListener('pointermove', function (e) {
        var r = frame.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        frame.style.setProperty('--ry', (dx * 5).toFixed(2) + 'deg');
        frame.style.setProperty('--rx', (-dy * 4).toFixed(2) + 'deg');
      });
      root.addEventListener('pointerleave', function () { frame.style.setProperty('--ry', '0deg'); frame.style.setProperty('--rx', '0deg'); });
    }

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
        video.setAttribute('src', video.getAttribute('data-src'));
        video.load();
      }
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
        video.setAttribute('poster', 'media/' + c.id + '.jpg');
        video.setAttribute('src', 'media/' + c.id + '.mp4');
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
      var subject = 'Demo de Cordada · ' + empresa;
      var body = 'Hola, soy ' + nombre + ' de ' + empresa + '.\n\n' +
        'Quiero una demo de Cordada. Lo que querría resolver primero: ' + que + '.\n' +
        (mensaje ? '\nContexto:\n' + mensaje + '\n' : '') +
        '\nMe escribís a ' + email + '.\n';
      window.location.href = 'mailto:juanpablo@hikethecloud.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      if (note) { note.textContent = 'Se abrió tu correo con el mensaje listo. Si no se abrió, escribinos a juanpablo@hikethecloud.com.'; note.className = 'form__note is-ok'; }
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
        var words = title.textContent.trim().split(/\s+/);
        title.innerHTML = words.map(function (w) { return '<span class="word"><span class="word__in">' + w + '</span></span>'; }).join(' ');
        var inners = title.querySelectorAll('.word__in');
        gsap.set(inners, { yPercent: 112 });
        html.classList.add('gsap-ready');
        gsap.to(inners, { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.08, delay: 0.12 });
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
      gsap.utils.toArray('.chapter__media').forEach(function (m) {
        gsap.fromTo(m, { yPercent: 5 }, { yPercent: -5, ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
      });
      var aura = document.querySelector('.hero__aura');
      if (aura) gsap.to(aura, { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });
      var reelEl = document.getElementById('reel');
      if (reelEl) gsap.to(reelEl, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });
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
