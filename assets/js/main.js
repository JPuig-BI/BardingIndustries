/* ============================================================
   BARDING INDUSTRIES — main.js
   ============================================================ */

/* ── Navbar: add .scrolled class on scroll ── */
(function () {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  function updateNav() {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();
})();


/* ── Mobile nav toggle ── */
(function () {
  const toggle = document.getElementById('nav-toggle');
  const links  = document.getElementById('nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', function () {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });

  // Close menu when a link is clicked
  links.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();


/* ── Scroll-reveal: fade in sections as they enter viewport ── */
(function () {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach(function (el) {
    observer.observe(el);
  });
})();


/* ── Smooth scroll for anchor links ── */
(function () {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '72'
      );
      const top = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });
})();


/* ── News: Load More ── */
(function () {
  const btn    = document.getElementById('btn-load-more');
  const hidden = document.querySelectorAll('.news-hidden');
  if (!btn || !hidden.length) return;

  btn.addEventListener('click', function () {
    hidden.forEach(function (card) {
      card.classList.remove('news-hidden');
      // Trigger reveal animation
      card.classList.add('reveal');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          card.classList.add('visible');
        });
      });
    });
    btn.style.display = 'none';
  });
})();


/* ── Formspree AJAX submission ── */
(function () {
  const form    = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  if (!form || !success) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const data   = new FormData(form);
    const action = form.getAttribute('action');

    // Don't submit if form ID is still placeholder
    if (action.includes('YOUR_FORM_ID')) {
      success.textContent = 'Form not yet configured. Please email us directly.';
      success.style.display = 'block';
      return;
    }

    try {
      const res = await fetch(action, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        form.style.display = 'none';
        success.style.display = 'block';
      } else {
        const json = await res.json();
        const msg  = json.errors
          ? json.errors.map(function (err) { return err.message; }).join(', ')
          : 'Submission failed. Please try again.';
        alert(msg);
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
  });
})();


/* ── Platform sticky-scroll driver ── */
(function () {
  const outer   = document.getElementById('platform-scroll');
  const steps   = document.querySelectorAll('.platform-step');
  const visuals = document.querySelectorAll('.platform-visual');
  if (!outer || !steps.length) return;

  const TOTAL = steps.length; // 4

  function setActive(idx) {
    steps.forEach(function (el, i)   { el.classList.toggle('active', i === idx); });
    visuals.forEach(function (el, i) { el.classList.toggle('active', i === idx); });
  }

  function updatePlatform() {
    if (window.innerWidth <= 768) return;

    const outerRect   = outer.getBoundingClientRect();
    const outerTop    = outerRect.top + window.scrollY;
    const outerHeight = outer.offsetHeight;
    const scrollRange = outerHeight - window.innerHeight;

    if (scrollRange <= 0) return;

    const scrolled = window.scrollY - outerTop;
    const progress = scrolled / scrollRange;
    const clamped  = Math.max(0, Math.min(0.9999, progress));
    const active   = Math.floor(clamped * TOTAL);

    setActive(active);
  }

  // Initialise first visual
  setActive(0);

  window.addEventListener('scroll', updatePlatform, { passive: true });
  window.addEventListener('resize', updatePlatform, { passive: true });
  updatePlatform();
})();


/* ── Active nav link highlighting on scroll ── */
(function () {
  const sections = ['rees', 'platform', 'team', 'news'];
  const navLinks = document.querySelectorAll('.nav-links a');
  const navH     = 80;

  function getActiveSection() {
    for (let i = sections.length - 1; i >= 0; i--) {
      const el = document.getElementById(sections[i]);
      if (!el) continue;
      if (window.scrollY >= el.offsetTop - navH - 20) {
        return sections[i];
      }
    }
    return null;
  }

  function updateActiveLink() {
    const active = getActiveSection();
    navLinks.forEach(function (link) {
      const href = link.getAttribute('href').replace('#', '');
      if (href === active) {
        link.style.color = 'var(--clr-white)';
      } else if (!link.classList.contains('btn-nav')) {
        link.style.color = '';
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
})();


/* ── Back to top ── */
(function () {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', function () {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();


/* ── Hero grid cursor highlight ── */
(function () {
  const hero   = document.getElementById('hero');
  const cursor = document.getElementById('hero-grid-cursor');
  if (!hero || !cursor) return;

  hero.addEventListener('mousemove', function (e) {
    const rect = hero.getBoundingClientRect();
    cursor.style.setProperty('--cx', (e.clientX - rect.left) + 'px');
    cursor.style.setProperty('--cy', (e.clientY - rect.top)  + 'px');
  });

  hero.addEventListener('mouseleave', function () {
    cursor.style.setProperty('--cx', '-999px');
    cursor.style.setProperty('--cy', '-999px');
  });
})();


/* ── Cookie consent ── */
(function () {
  const bar    = document.getElementById('cookie-bar');
  const accept = document.getElementById('cookie-accept');
  const deny   = document.getElementById('cookie-deny');
  if (!bar || !accept || !deny) return;

  if (!localStorage.getItem('cookie-consent')) {
    setTimeout(function () { bar.classList.add('visible'); }, 900);
  }

  function dismiss() {
    bar.classList.remove('visible');
    setTimeout(function () { bar.style.display = 'none'; }, 420);
  }

  accept.addEventListener('click', function () {
    localStorage.setItem('cookie-consent', 'accepted');
    dismiss();
  });

  deny.addEventListener('click', function () {
    localStorage.setItem('cookie-consent', 'declined');
    dismiss();
  });
})();
