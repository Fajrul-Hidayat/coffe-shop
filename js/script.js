/**
 * Kedai Kopi Landing Page — script.js
 * ============================================================
 * Interactions:
 *  1. Sticky / shrinking navbar on scroll
 *  2. Mobile hamburger menu toggle
 *  3. Smooth scroll for anchor links
 *  4. IntersectionObserver: fade-in reveals with stagger
 *  5. Testimonial slider (drag + button + autoplay)
 *  6. Animated number counters (triggered on viewport enter)
 *  7. Contact form validation with feedback
 *  8. ScrollSpy active nav highlighting
 * ============================================================
 */

'use strict';

/* ============================================================
   1. STICKY / SHRINKING NAVBAR
   ============================================================ */
(function initStickyNav() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const SCROLL_THRESHOLD = 50;

  function onScroll() {
    if (window.scrollY > SCROLL_THRESHOLD) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


/* ============================================================
   2. MOBILE HAMBURGER MENU
   ============================================================ */
(function initMobileMenu() {
  const btn   = document.getElementById('hamburger-btn');
  const links = document.getElementById('nav-links');
  if (!btn || !links) return;

  function openMenu() {
    links.classList.add('nav--open');
    btn.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    links.classList.remove('nav--open');
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  links.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });
})();


/* ============================================================
   3. SMOOTH SCROLL FOR ANCHOR LINKS
   ============================================================ */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();

      const navHeight = document.getElementById('site-header')?.offsetHeight ?? 68;
      const top = targetEl.getBoundingClientRect().top + window.scrollY - navHeight - 16;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


/* ============================================================
   4. INTERSECTION OBSERVER — SCROLL REVEAL WITH STAGGER
   ============================================================ */
(function initReveal() {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  const parentCounters = new WeakMap();

  revealEls.forEach(el => {
    const parent = el.parentElement;
    if (!parentCounters.has(parent)) {
      parentCounters.set(parent, 0);
    }
    const idx = parentCounters.get(parent);
    el.style.transitionDelay = `${Math.min(idx * 80, 400)}ms`;
    parentCounters.set(parent, idx + 1);
  });

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  revealEls.forEach(el => observer.observe(el));
})();


/* ============================================================
   5. TESTIMONIAL SLIDER
   ============================================================ */
(function initTestimonialSlider() {
  const track   = document.getElementById('testimonials-track');
  const prevBtn = document.getElementById('slider-prev');
  const nextBtn = document.getElementById('slider-next');
  const dotsEl  = document.getElementById('slider-dots');
  if (!track) return;

  const cards       = Array.from(track.querySelectorAll('.testimonial-card'));
  const totalCards  = cards.length;
  let currentIndex  = 0;
  let autoplayTimer = null;

  function getVisibleCount() {
    if (window.innerWidth >= 768) return 2;
    return 1;
  }

  function maxIndex() {
    return Math.max(0, totalCards - getVisibleCount());
  }

  function buildDots() {
    if (!dotsEl) return;
    dotsEl.innerHTML = '';
    const count = maxIndex() + 1;
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('button');
      dot.className = `slider-dot${i === currentIndex ? ' is-active' : ''}`;
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
      dot.setAttribute('aria-selected', i === currentIndex ? 'true' : 'false');
      dot.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(dot);
    }
  }

  function updateDots() {
    if (!dotsEl) return;
    dotsEl.querySelectorAll('.slider-dot').forEach((dot, i) => {
      dot.classList.toggle('is-active', i === currentIndex);
      dot.setAttribute('aria-selected', i === currentIndex ? 'true' : 'false');
    });
  }

  function goTo(index) {
    currentIndex = Math.max(0, Math.min(index, maxIndex()));

    const visibleCount = getVisibleCount();
    const gap = 24;
    const offset = currentIndex * (track.offsetWidth / visibleCount + gap);
    track.style.transform = `translateX(-${offset}px)`;

    updateDots();

    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= maxIndex();
  }

  function next() { goTo(currentIndex + 1); }
  function prev() { goTo(currentIndex - 1); }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(() => {
      goTo(currentIndex >= maxIndex() ? 0 : currentIndex + 1);
    }, 5000);
  }

  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
  }

  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);

  document.addEventListener('keydown', e => {
    const sliderSection = document.getElementById('testimonials');
    if (!sliderSection) return;
    const rect = sliderSection.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;

    if (e.key === 'ArrowLeft')  { prev(); stopAutoplay(); }
    if (e.key === 'ArrowRight') { next(); stopAutoplay(); }
  });

  track.addEventListener('mouseenter', stopAutoplay);
  track.addEventListener('mouseleave', startAutoplay);
  track.addEventListener('focusin',    stopAutoplay);
  track.addEventListener('focusout',   startAutoplay);

  // Touch / swipe support
  let touchStartX = 0;
  let touchEndX   = 0;

  track.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].clientX;
    stopAutoplay();
  }, { passive: true });

  track.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    const SWIPE_THRESHOLD = 50;

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      diff > 0 ? next() : prev();
    }
    startAutoplay();
  }, { passive: true });

  // Re-init on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      buildDots();
      goTo(Math.min(currentIndex, maxIndex()));
    }, 200);
  });

  // Initial setup
  buildDots();
  goTo(0);
  startAutoplay();
})();


/* ============================================================
   6. ANIMATED NUMBER COUNTERS
   ============================================================ */
(function initCounters() {
  const counterEls = document.querySelectorAll('.stat-item__number[data-target]');
  if (!counterEls.length) return;

  function animateCounter(el) {
    const target   = parseInt(el.getAttribute('data-target'), 10);
    const duration = 1500;
    const start    = performance.now();

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function update(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value    = Math.round(easeOutCubic(progress) * target);
      
      el.textContent = value.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target.toLocaleString();
      }
    }

    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counterEls.forEach(el => observer.observe(el));
})();


/* ============================================================
   7. CONTACT FORM VALIDATION
   ============================================================ */
(function initCtaForm() {
  const form      = document.getElementById('cta-form');
  const input     = document.getElementById('cta-email');
  const msgEl     = document.getElementById('cta-form-msg');
  const submitBtn = document.getElementById('cta-submit-btn');
  if (!form || !input || !msgEl) return;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setError(message) {
    input.classList.add('is-error');
    input.setAttribute('aria-invalid', 'true');
    msgEl.className = 'cta-form__msg is-error';
    msgEl.textContent = message;
  }

  function setSuccess(message) {
    input.classList.remove('is-error');
    input.removeAttribute('aria-invalid');
    msgEl.className = 'cta-form__msg is-success';
    msgEl.textContent = message;
  }

  function clearState() {
    input.classList.remove('is-error');
    input.removeAttribute('aria-invalid');
    msgEl.textContent = '';
    msgEl.className = 'cta-form__msg';
  }

  input.addEventListener('input', clearState);

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = input.value.trim();

    if (!email) {
      setError('Please enter your email address.');
      input.focus();
      return;
    }

    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      input.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    await new Promise(resolve => setTimeout(resolve, 1200));

    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Send Message <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';

    setSuccess(`☕ Thanks! We'll get back to you at ${email} soon.`);
    input.value = '';
  });
})();


/* ============================================================
   8. ACTIVE NAV LINK HIGHLIGHTING (ScrollSpy)
   ============================================================ */
(function initScrollSpy() {
  const navLinks = document.querySelectorAll('.nav__link');
  if (!navLinks.length) return;

  const sectionIds = Array.from(navLinks)
    .map(link => link.getAttribute('href')?.replace('#', ''))
    .filter(Boolean);

  const sections = sectionIds
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if (!sections.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle(
            'nav__link--active',
            link.getAttribute('href') === `#${id}`
          );
        });
      });
    },
    {
      rootMargin: '-30% 0px -60% 0px',
      threshold: 0,
    }
  );

  sections.forEach(section => observer.observe(section));
})();
