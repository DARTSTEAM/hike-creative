/* =========================================================
   HIKE CREATIVE — script.js
   Progressive enhancement, fully first-party (no third-party
   libraries). The site is completely usable with no JS at all.
   ========================================================= */
(function () {
  'use strict';

  var html = document.documentElement;
  var prefersReduced = false;
  try { prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

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
    if (prefersReduced || !('IntersectionObserver' in window)) {
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
  if (nums.length && !prefersReduced && 'IntersectionObserver' in window) {
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

  /* ---------- Anchor navigation (native smooth-scroll, first-party) ---------- */
  var headerOffset = 56;
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var y = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
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
})();
