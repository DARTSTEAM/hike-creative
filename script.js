/* =========================================================
   HIKE CREATIVE — script.js
   Two layers:
   1) FIRST-PARTY BASELINE (always on) — nav, mobile menu,
      reveal + count-up via IntersectionObserver, anchor scroll,
      form. The site is fully usable with zero libraries.
   2) CINEMATIC LAYER (progressive) — Lenis smooth-scroll + GSAP
      ScrollTrigger for the kinetic hero, a pinned metrics beat,
      a scrubbed manifesto, a drawing process rail, parallax and
      magnetic buttons. Every piece is wrapped so a missing CDN or
      a thrown error never hides content — it just falls back to
      the baseline. All elaborate motion is off under reduced-motion.
   ========================================================= */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var finePointer = true;
  try { finePointer = window.matchMedia('(pointer: fine)').matches; } catch (e) {}

  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasST   = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  var hasLenis = typeof window.Lenis !== 'undefined';

  /* =========================================================
     BASELINE
     ========================================================= */

  /* ---------- Nav: translucent hairline on scroll ---------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () {
      if (window.scrollY > 8) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('mobileMenu');
  if (toggle && menu && nav) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      nav.classList.toggle('is-open', open);
      menu.hidden = !open;
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  /* ---------- Reveal on scroll (IntersectionObserver) ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (reveals.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      if (!html.classList.contains('animate-ready')) html.classList.add('animate-ready');
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach(function (el) { io.observe(el); });
      // Safety net for any element that never intersects.
      window.setTimeout(function () {
        reveals.forEach(function (el) { el.classList.add('is-visible'); });
      }, 4000);
    }
  }

  /* ---------- Metrics count-up (keynote style) ---------- */
  var nums = Array.prototype.slice.call(document.querySelectorAll('.metric__num'));
  if (nums.length && !reduce && 'IntersectionObserver' in window) {
    var animateNum = function (el) {
      var target = Math.abs(parseFloat(el.getAttribute('data-target')) || 0);
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      var final = prefix + target + suffix;
      var dur = 1100, start = null;
      var step = function (now) {
        if (start === null) start = now;
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + Math.round(target * eased) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
        else el.textContent = final;
      };
      window.requestAnimationFrame(step);
    };
    var ioNum = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateNum(entry.target); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { ioNum.observe(el); });
  }
  /* (If reduced motion or no IO, the HTML already shows the final values.) */

  /* =========================================================
     SMOOTH SCROLL (Lenis) — drives anchor navigation below
     ========================================================= */
  var lenis = null;
  if (hasLenis && !reduce) {
    try {
      lenis = new window.Lenis({
        duration: 1.08,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5
      });
      if (hasGSAP) {
        if (hasST) lenis.on('scroll', window.ScrollTrigger.update);
        window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        window.gsap.ticker.lagSmoothing(0);
      } else {
        var rafLoop = function (t) { lenis.raf(t); requestAnimationFrame(rafLoop); };
        requestAnimationFrame(rafLoop);
      }
    } catch (e) { lenis = null; }
  }

  /* ---------- Anchor navigation (Lenis if present, else native) ---------- */
  var headerOffset = 56;
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: -headerOffset, duration: 1.1 });
      } else {
        var y = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      }
      // Move focus for keyboard/screen-reader users without stealing the scroll.
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  /* ---------- Contact form (demo only) ---------- */
  var form = document.querySelector('.form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = form.querySelector('.form__note');
      if (note) note.textContent = 'Gracias. Nos ponemos en contacto pronto. (Demo — no se envían datos.)';
    });
  }

  /* =========================================================
     CINEMATIC LAYER (GSAP) — additive, never hides content
     ========================================================= */
  if (hasGSAP && !reduce) initCinematic();

  function initCinematic() {
    var gsap = window.gsap;
    if (hasST) { try { gsap.registerPlugin(window.ScrollTrigger); } catch (e) {} }
    var ST = window.ScrollTrigger;

    /* ---- 1 · Kinetic hero title: words ride up out of a mask ---- */
    (function heroTitle() {
      var title = document.getElementById('hero-title');
      if (!title) return;
      try {
        var text = title.textContent.trim();
        var words = text.split(/\s+/);
        title.innerHTML = words.map(function (w) {
          return '<span class="word"><span class="word__in">' + w + '</span></span>';
        }).join(' ');
        var inners = title.querySelectorAll('.word__in');
        gsap.set(inners, { yPercent: 118 });
        html.classList.add('gsap-ready');          // reveals the (now masked) title
        gsap.to(inners, {
          yPercent: 0, duration: 1.05, ease: 'power4.out',
          stagger: 0.09, delay: 0.15
        });
      } catch (e) {
        // Failsafe: show the title plainly.
        html.classList.add('gsap-ready');
        try { gsap.set(title.querySelectorAll('.word__in'), { yPercent: 0 }); } catch (e2) {}
        title.style.opacity = '1';
      }
    })();

    /* ---- 2 · Hero living demo: cascade intro + regeneration loop ---- */
    (function heroDemo() {
      var assets = document.querySelector('.assets');
      if (!assets) return;
      var scan = assets.querySelector('.assets__scan');
      var tiles = Array.prototype.slice.call(assets.querySelectorAll('.asset'));
      if (!tiles.length) return;

      // Cascade "generation" intro — from() so tiles always end visible.
      gsap.from(tiles, {
        opacity: 0, y: 18, scale: 0.94,
        duration: 0.72, ease: 'power3.out', stagger: 0.09, delay: 0.35
      });

      // On-brand headlines the 1:1 tile cycles through, as if re-generating.
      var headEl = assets.querySelector('.asset--a .ad__head');
      var heads = ['Tu primavera, en flor.', 'Brotá otra vez.', 'La estación de brillar.', 'Primavera, en tu tono.'];
      var headIdx = 0;
      function swapHeadline() {
        if (!headEl) return;
        headIdx = (headIdx + 1) % heads.length;
        headEl.classList.add('is-swapping');
        window.setTimeout(function () {
          headEl.textContent = heads[headIdx];
          headEl.classList.remove('is-swapping');
        }, 300);
      }

      function pulseTiles() {
        tiles.forEach(function (t, i) {
          gsap.delayedCall(0.15 + i * 0.22, function () {
            t.classList.add('is-generating');
            gsap.delayedCall(0.5, function () { t.classList.remove('is-generating'); });
          });
        });
      }

      if (scan) {
        var loop = gsap.timeline({ repeat: -1, repeatDelay: 2.8, paused: true });
        loop.set(scan, { top: '-42%', opacity: 0 })
            .to(scan, { opacity: 0.85, duration: 0.35 })
            .to(scan, { top: '112%', duration: 1.75, ease: 'sine.inOut', onStart: pulseTiles }, '<')
            .to(scan, { opacity: 0, duration: 0.35 }, '-=0.35')
            .add(swapHeadline, '-=0.7');

        gsap.delayedCall(2.4, function () { loop.play(); });

        // Pause when the tab is hidden or the hero scrolls away (perf + polish).
        document.addEventListener('visibilitychange', function () {
          if (document.hidden) loop.pause(); else loop.play();
        });
        if (hasST && ST) {
          ST.create({
            trigger: '.hero', start: 'top top', end: 'bottom top',
            onLeave: function () { loop.pause(); },
            onEnterBack: function () { loop.play(); }
          });
        }
      }
    })();

    /* ---- 3 · Manifesto "el calor": the words HEAT UP as the section is
       read — a cold→warm color sweep (a distinct motion grammar from the
       rise+fade elsewhere) — while the thermal gauge fills frío→cálido. ---- */
    if (hasST) (function manifesto() {
      var words  = document.querySelectorAll('.manifesto .mword');
      var thermo = document.querySelector('.manifesto .thermo');
      try {
        if (words.length) {
          // Start cold + dim; scrub to a warm off-white. The stagger makes
          // the warmth travel across the line like heat spreading.
          gsap.set(words, { color: '#6f6a86', opacity: 0.26 });
          gsap.to(words, {
            color: '#efe6dd', opacity: 1, ease: 'none', stagger: 0.5,
            scrollTrigger: {
              trigger: '.manifesto', start: 'top 82%', end: 'top 26%', scrub: 0.5
            }
          });
        }
        if (thermo) {
          gsap.fromTo(thermo, { '--rise': 0 }, {
            '--rise': 1, ease: 'none',
            scrollTrigger: {
              trigger: '.manifesto', start: 'top 82%', end: 'top 30%', scrub: 0.5
            }
          });
        }
      } catch (e) {
        if (words.length) gsap.set(words, { color: '#efe6dd', opacity: 1 });
      }
    })();

    /* ---- 4 · Process rail draws down as you descend the steps ---- */
    if (hasST) (function processRail() {
      var rail = document.querySelector('.steps__rail');
      if (!rail) return;
      gsap.to(rail, {
        '--draw': 1, ease: 'none',
        scrollTrigger: {
          trigger: '.steps', start: 'top 72%', end: 'bottom 60%', scrub: 0.5
        }
      });
    })();

    /* ---- 5 · Parallax: feature mocks + hero glow drift subtly ---- */
    if (hasST) (function parallax() {
      gsap.utils.toArray('.feature .mock').forEach(function (m) {
        gsap.fromTo(m, { yPercent: 6 }, {
          yPercent: -6, ease: 'none',
          scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
        });
      });
      var glow = document.querySelector('.appstage__glow');
      if (glow) gsap.to(glow, {
        yPercent: 16, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
      });
      var aura = document.querySelector('.hero__aura');
      if (aura) gsap.to(aura, {
        yPercent: 20, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
      });
    })();

    /* ---- 6 · Pinned metrics beat (desktop only) ---- */
    if (hasST) (function pinnedMetrics() {
      var mm = gsap.matchMedia();
      mm.add('(min-width: 861px)', function () {
        var tl = gsap.timeline({
          scrollTrigger: {
            trigger: '.metrics', start: 'top top', end: '+=80%',
            scrub: 0.5, pin: true, anticipatePin: 1
          }
        });
        tl.fromTo('.metrics__grid', { scale: 0.95, yPercent: 4 }, { scale: 1, yPercent: 0, ease: 'none' })
          .fromTo('.metrics__aura', { scale: 0.9, opacity: 0.5 }, { scale: 1.3, opacity: 1, ease: 'none' }, 0);
      });
    })();

    /* ---- Keep triggers honest across font-load / resize / full load ---- */
    if (hasST && ST) {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { ST.refresh(); });
      }
      window.addEventListener('load', function () { ST.refresh(); });
    }
  }

  /* =========================================================
     MAGNETIC BUTTONS (micro-interaction) — fine pointer only
     ========================================================= */
  if (!reduce && finePointer) {
    var mags = document.querySelectorAll('.btn--magnetic');
    mags.forEach(function (btn) {
      var strength = 0.32;
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
