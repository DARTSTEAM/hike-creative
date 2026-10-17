/* =========================================================
   CORDADA — script.js
   1) Base (siempre): nav que cambia de registro, menú, reveals,
      el reel del hero, los demos de cada tramo, el riel, el formulario.
   2) Capa cinemática (si GSAP y Lenis llegan): scroll suave, título
      enmascarado, la cuerda que se tensa, parallax, botones magnéticos.
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

  /* ---------- Nav: hairline al scrollear ---------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Nav: registro según la sección que pasa por debajo ---------- */
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
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
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
     REEL DEL HERO — los seis recortes, uno detrás del otro
     ========================================================= */
  var REEL = [
    { id: 'social-listener', line: 'Qué se dice de tus marcas y de la competencia en redes, y qué comentarios piden respuesta.' },
    { id: 'readapt', line: 'Generá piezas con IA, retocalas por partes y llevalas a todos los formatos.' },
    { id: 'imprint', line: 'Armá creativos en todas las medidas con la identidad de la marca, y repetilos por cientos.' },
    { id: 'creative-check', line: 'Revisá una pieza antes de publicarla y escribile los copies.' },
    { id: 'implementador', line: 'Subí anuncios a Meta en lote a partir de plantillas, sin armarlos uno por uno.' },
    { id: 'lanchat', line: 'El chat de ABN con los datos de cada cliente.' }
  ];

  (function reel() {
    var root = document.getElementById('reel');
    if (!root) return;
    var videos = Array.prototype.slice.call(root.querySelectorAll('.reel__video'));
    var buttons = Array.prototype.slice.call(root.querySelectorAll('.reel__chapters button'));
    var fills = buttons.map(function (b) { return b.querySelector('.reel__fill'); });
    var toggleBtn = document.getElementById('reelToggle');
    var big = document.getElementById('reelBig');
    var count = document.getElementById('reelCount');
    var line = document.getElementById('reelLine');
    var go = document.getElementById('reelGo');
    var total = REEL.length;

    var current = 0;
    var playing = !reduce && !saveData;
    var chosen = false;        // tocar un producto corta el avance: ese se repite
    var onScreen = true;
    var tabVisible = !document.hidden;
    var raf = 0;

    function pad(n) { return String(n).padStart(2, '0'); }

    function load(i) {
      var v = videos[i];
      if (!v || v.getAttribute('src')) return;
      v.setAttribute('poster', 'media/cortes/' + REEL[i].id + '.jpg');
      v.setAttribute('src', 'media/cortes/' + REEL[i].id + '.mp4');
      v.load();
    }

    function paint() {
      var v = videos[current];
      var f = fills[current];
      if (v && f && v.duration) f.style.transform = 'scaleX(' + (v.currentTime / v.duration) + ')';
      if (playing && onScreen && tabVisible) raf = window.requestAnimationFrame(paint);
    }

    function sync() {
      load(current); load((current + 1) % total);
      videos.forEach(function (v, i) {
        v.classList.toggle('is-current', i === current);
        v.loop = chosen;
        if (i === current && playing && onScreen && tabVisible) {
          var p = v.play();
          if (p && p.catch) p.catch(function (err) {
            // Solo NotAllowedError es que el navegador no deja arrancar sola.
            if (err && err.name === 'NotAllowedError') setPlaying(false);
          });
        } else {
          v.pause();
        }
      });
      fills.forEach(function (f, i) { if (i !== current) f.style.transform = 'scaleX(' + (i < current ? 1 : 0) + ')'; });
      buttons.forEach(function (b, i) {
        if (i === current) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
      if (count) count.textContent = pad(current + 1) + ' / ' + pad(total);
      if (line) line.textContent = REEL[current].line;
      if (go) go.setAttribute('href', '#tramo-' + (current + 1));
      window.cancelAnimationFrame(raf);
      paint();
    }

    function setPlaying(v) {
      playing = v;
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-pressed', String(v));
        toggleBtn.setAttribute('aria-label', v ? 'Pausar' : 'Reproducir');
      }
      if (big) big.hidden = v;
      sync();
    }

    function goTo(i) {
      var v = videos[i];
      if (v) { try { v.currentTime = 0; } catch (e) {} }
      current = i;
      sync();
    }

    videos.forEach(function (v, i) {
      v.addEventListener('ended', function () { if (i === current && !chosen) goTo((current + 1) % total); });
    });
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        chosen = true;
        playing = true;
        if (toggleBtn) { toggleBtn.setAttribute('aria-pressed', 'true'); toggleBtn.setAttribute('aria-label', 'Pausar'); }
        if (big) big.hidden = true;
        goTo(Number(b.getAttribute('data-i')));
      });
    });
    if (toggleBtn) toggleBtn.addEventListener('click', function () { setPlaying(!playing); });
    if (big) big.addEventListener('click', function () { setPlaying(true); });

    if (hasIO) {
      new IntersectionObserver(function (entries) {
        onScreen = Boolean(entries[0] && entries[0].isIntersecting);
        sync();
      }, { threshold: 0.25 }).observe(root);
    }
    document.addEventListener('visibilitychange', function () { tabVisible = !document.hidden; sync(); });

    setPlaying(playing);
  })();

  /* =========================================================
     DEMOS DE CADA TRAMO — cargan cerca, suenan a la vista
     ========================================================= */
  (function demos() {
    var figs = Array.prototype.slice.call(document.querySelectorAll('.demo'));
    if (!figs.length) return;

    figs.forEach(function (fig) {
      var video = fig.querySelector('.demo__video');
      var toggleBtn = fig.querySelector('.demo__toggle');
      var fullBtn = fig.querySelector('.demo__full');
      var chapter = fig.closest('.chapter');
      var openBtn = chapter ? chapter.querySelector('.demo__open') : null;
      if (!video) return;

      var wanted = !reduce && !saveData;   // lo que la persona quiere: que suene o no
      var visible = false;
      var loaded = false;

      function load() {
        if (loaded) return;
        loaded = true;
        video.setAttribute('src', video.getAttribute('data-src'));
        video.load();
      }
      function reflect() {
        var on = wanted && visible;
        if (toggleBtn) {
          toggleBtn.setAttribute('aria-pressed', String(wanted));
          toggleBtn.setAttribute('aria-label', wanted ? 'Pausar' : 'Reproducir');
        }
        fig.classList.toggle('is-paused', !wanted);
        if (on) {
          load();
          var p = video.play();
          if (p && p.catch) p.catch(function (err) { if (err && err.name === 'NotAllowedError') { wanted = false; reflect(); } });
        } else {
          video.pause();
        }
      }
      function fullscreen() {
        load();
        var el = video;
        try {
          if (el.requestFullscreen) el.requestFullscreen();
          else if (el.webkitEnterFullscreen) el.webkitEnterFullscreen();   // iPhone
          else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
          video.muted = false;
          video.controls = true;
          video.currentTime = 0;
          var p = video.play();
          if (p && p.catch) p.catch(function () {});
        } catch (e) {}
      }
      function onFullscreenChange() {
        var fsEl = document.fullscreenElement || document.webkitFullscreenElement;
        if (fsEl !== video) { video.muted = true; video.controls = false; }
      }

      if (toggleBtn) toggleBtn.addEventListener('click', function () { wanted = !wanted; reflect(); });
      if (fullBtn) fullBtn.addEventListener('click', fullscreen);
      if (openBtn) openBtn.addEventListener('click', fullscreen);
      document.addEventListener('fullscreenchange', onFullscreenChange);
      document.addEventListener('webkitfullscreenchange', onFullscreenChange);
      video.addEventListener('webkitendfullscreen', function () { video.muted = true; video.controls = false; });

      if (hasIO) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) { if (entry.isIntersecting) load(); });
        }, { rootMargin: '600px 0px' }).observe(fig);
        new IntersectionObserver(function (entries) {
          visible = Boolean(entries[0] && entries[0].isIntersecting);
          reflect();
        }, { threshold: 0.35 }).observe(fig);
      } else {
        visible = true; reflect();
      }
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) video.pause(); else reflect();
      });
    });
  })();

  /* =========================================================
     RIEL — qué tramo está a la vista
     ========================================================= */
  (function rail() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.rail__list a'));
    var chapters = Array.prototype.slice.call(document.querySelectorAll('.chapter'));
    if (!links.length || !chapters.length) return;
    var active = -1;
    var ticking = false;
    function compute() {
      ticking = false;
      var line = window.innerHeight * 0.5;
      var next = 0;
      chapters.forEach(function (c, i) { if (c.getBoundingClientRect().top <= line) next = i; });
      if (next === active) return;
      active = next;
      links.forEach(function (a, i) {
        a.classList.toggle('is-active', i === active);
        a.classList.toggle('is-past', i < active);
      });
      if (!hasST) {
        var rope = document.querySelector('.rail__rope');
        if (rope) rope.style.setProperty('--draw', String(active / Math.max(1, chapters.length - 1)));
      }
    }
    function onScroll() { if (!ticking) { ticking = true; window.requestAnimationFrame(compute); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    compute();
  })();

  /* =========================================================
     FORMULARIO — arma el correo, sin backend
     ========================================================= */
  (function form() {
    var form = document.getElementById('demoForm');
    if (!form) return;
    var note = document.getElementById('formNote');
    var interes = document.getElementById('interes');

    // "Pedir una demo" desde un tramo deja elegido ese producto.
    document.querySelectorAll('[data-interes]').forEach(function (a) {
      a.addEventListener('click', function () {
        var value = a.getAttribute('data-interes');
        if (!interes) return;
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
  var lenis = null;
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
      if (lenis) lenis.scrollTo(target, { offset: -headerOffset, duration: 1.1 });
      else {
        var y = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      }
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });

  /* =========================================================
     CAPA CINEMÁTICA
     ========================================================= */
  if (hasGSAP && !reduce) (function cinematic() {
    var gsap = window.gsap;
    var ST = null;
    if (hasST) { try { gsap.registerPlugin(window.ScrollTrigger); ST = window.ScrollTrigger; } catch (e) {} }

    /* Título del hero: la palabra sube desde una máscara */
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
      } catch (e) {
        html.classList.add('gsap-ready');
        title.style.opacity = '1';
      }
    })();

    if (!ST) return;

    /* La cuerda del riel se tensa a lo largo de los tramos */
    (function rope() {
      var rope = document.querySelector('.rail__rope');
      var chapters = document.querySelector('.chapters');
      if (!rope || !chapters) return;
      gsap.fromTo(rope, { '--draw': 0 }, {
        '--draw': 1, ease: 'none',
        scrollTrigger: { trigger: chapters, start: 'top 55%', end: 'bottom 60%', scrub: 0.4 }
      });
    })();

    /* Parallax suave: los demos y el aura del hero */
    (function parallax() {
      gsap.utils.toArray('.chapter__media').forEach(function (m) {
        gsap.fromTo(m, { yPercent: 5 }, { yPercent: -5, ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
      });
      var aura = document.querySelector('.hero__aura');
      if (aura) gsap.to(aura, { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });
      var reelEl = document.getElementById('reel');
      if (reelEl) gsap.to(reelEl, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });
    })();

    /* El número de cada hecho crece una vez al entrar */
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
})();
