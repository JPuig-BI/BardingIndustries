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
      const navEl   = document.getElementById('navbar');
      const rawTop  = target.getBoundingClientRect().top + window.scrollY;
      const compact = navEl ? parseInt(navEl.dataset.compactH || '68', 10) : 68;
      const full    = navEl ? navEl.offsetHeight : 90;
      // If destination will be past the scroll threshold, navbar will be compact on arrival
      const navH    = (rawTop - compact) > 40 ? compact : full;
      const top     = rawTop - navH;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });
})();


/* ── REEs: count-up animation on scroll ── */
(function () {
  var stats = document.querySelector('.rees-stats');
  if (!stats) return;

  var triggered = false;

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateNum(el) {
    var to       = parseInt(el.getAttribute('data-to'), 10);
    if (!to) return;
    var prefix   = el.getAttribute('data-prefix') || '';
    var suffix   = el.getAttribute('data-suffix') || '';
    var child    = el.querySelector('.rees-stat-of');

    function setFinal() {
      if (child) {
        el.childNodes[0].textContent = to + ' ';
      } else {
        el.textContent = prefix + to + suffix;
      }
    }

    if (reducedMotion) { setFinal(); return; }

    var duration  = 1400;
    var startTime = null;

    function tick(ts) {
      if (!startTime) startTime = ts;
      var elapsed  = ts - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var current  = Math.round(easeOutCubic(progress) * to);

      if (child) {
        el.childNodes[0].textContent = current + ' ';
      } else {
        el.textContent = prefix + current + suffix;
      }

      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  var observer = new IntersectionObserver(function (entries) {
    if (triggered) return;
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        triggered = true;
        stats.querySelectorAll('.rees-stat-num[data-to]').forEach(animateNum);
        observer.disconnect();
      }
    });
  }, { threshold: 0.2 });

  observer.observe(stats);
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


/* ── Contact form: validation + AJAX + sent confirmation ── */
(function () {
  const form      = document.getElementById('contact-form');
  const submitBtn = form ? form.querySelector('.btn-form-submit') : null;
  if (!form || !submitBtn) return;

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function getWrap(field) {
    return field.closest('.form-field-wrap') || field.parentNode;
  }

  function setError(field, msg) {
    field.classList.add('field-error');
    const wrap = getWrap(field);
    let err = wrap.querySelector('.field-error-msg');
    if (!err) {
      err = document.createElement('span');
      err.className = 'field-error-msg';
      wrap.appendChild(err);
    }
    err.textContent = msg;
  }

  function clearErrors() {
    form.querySelectorAll('.field-error').forEach(function (el) {
      el.classList.remove('field-error');
    });
    form.querySelectorAll('.field-error-msg').forEach(function (el) {
      el.remove();
    });
  }

  function validate() {
    clearErrors();
    var ok = true;

    var name         = form.querySelector('[name="name"]');
    var email        = form.querySelector('[name="email"]');
    var organization = form.querySelector('[name="organization"]');
    var message      = form.querySelector('[name="message"]');

    if (!name.value.trim()) {
      setError(name, 'Name is required.');
      ok = false;
    }
    if (!email.value.trim()) {
      setError(email, 'Email is required.');
      ok = false;
    } else if (!emailRe.test(email.value.trim())) {
      setError(email, 'Please enter a valid email address.');
      ok = false;
    }
    if (!organization.value.trim()) {
      setError(organization, 'Organization is required.');
      ok = false;
    }
    var role = form.querySelector('[name="role"]');
    if (role && !role.value) {
      var roleTrigger = form.querySelector('.custom-select-trigger');
      if (roleTrigger) setError(roleTrigger, 'Please select your role.');
      ok = false;
    }
    if (!message.value.trim()) {
      setError(message, 'Message is required.');
      ok = false;
    }

    return ok;
  }

  // Clear individual field error on input
  form.querySelectorAll('.form-field').forEach(function (field) {
    field.addEventListener('input', function () {
      this.classList.remove('field-error');
      var err = getWrap(this).querySelector('.field-error-msg');
      if (err) err.remove();
    });
  });

  function showSent(text) {
    submitBtn.textContent = text;
    submitBtn.classList.add('btn-sent');
    submitBtn.disabled = true;
  }

  function restoreBtn() {
    submitBtn.textContent = 'Send Message';
    submitBtn.classList.remove('btn-sent');
    submitBtn.disabled = false;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!validate()) return;

    const action = form.getAttribute('action');

    if (action.includes('YOUR_FORM_ID')) {
      showSent('Form not configured yet.');
      setTimeout(restoreBtn, 4000);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      const res = await fetch(action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        form.reset();
        showSent("Message sent – we'll be in touch.");
        setTimeout(restoreBtn, 5000);
      } else {
        showSent('Something went wrong. Please try again.');
        setTimeout(restoreBtn, 4000);
      }
    } catch (_) {
      showSent('Network error. Please try again.');
      setTimeout(restoreBtn, 4000);
    }
  });
})();


/* ── Platform sticky-scroll driver ── */
(function () {
  const outer   = document.getElementById('platform-scroll');
  const steps   = document.querySelectorAll('.platform-step');
  const visuals = document.querySelectorAll('.platform-visual');
  const dots    = document.querySelectorAll('.platform-dot');
  if (!outer || !steps.length) return;

  const TOTAL = steps.length; // 4

  function setActive(idx) {
    steps.forEach(function (el, i)   { el.classList.toggle('active', i === idx); });
    visuals.forEach(function (el, i) { el.classList.toggle('active', i === idx); });
    dots.forEach(function (el, i)    { el.classList.toggle('active', i === idx); });
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
      if (link.classList.contains('btn-nav')) return;
      const href = link.getAttribute('href').replace('#', '');
      const isActive = href === active;
      link.classList.toggle('active-link', isActive);
      if (isActive) link.setAttribute('aria-current', 'true');
      else          link.removeAttribute('aria-current');
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


/* ── Hero grid cursor highlight (red core + purple halo) ── */
(function () {
  const hero = document.getElementById('hero');
  if (!hero) return;

  hero.addEventListener('mousemove', function (e) {
    const rect = hero.getBoundingClientRect();
    hero.style.setProperty('--cx', (e.clientX - rect.left) + 'px');
    hero.style.setProperty('--cy', (e.clientY - rect.top)  + 'px');
  });

  hero.addEventListener('mouseleave', function () {
    hero.style.setProperty('--cx', '-999px');
    hero.style.setProperty('--cy', '-999px');
  });
})();





/* ── Platform visual 1: extraction ── */
(function () {
  var svg = document.querySelector('.pv--extraction .pv-ext-svg');
  if (!svg) return;

  var NS   = 'http://www.w3.org/2000/svg';
  var spcX = 13 * 1.5  - 0.5;
  var spcY = 13 * Math.sqrt(3) - 0.5;
  var cols = 21;
  var cxS  = (420 - (cols - 1) * spcX) / 2;
  var yBase = 270;

  var srf = [
    {x:0,   y:174}, {x:22,  y:168}, {x:44,  y:175},
    {x:66,  y:170}, {x:88,  y:165}, {x:110, y:173},
    {x:132, y:169}, {x:154, y:176}, {x:176, y:163},
    {x:198, y:172}, {x:220, y:168}, {x:242, y:176},
    {x:264, y:162}, {x:286, y:170}, {x:308, y:167},
    {x:330, y:175}, {x:352, y:171}, {x:374, y:176},
    {x:420, y:173}
  ];
  function surfY(x) {
    for (var i = 0; i < srf.length - 1; i++) {
      var a = srf[i], b = srf[i + 1];
      if (x >= a.x && x <= b.x)
        return a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x);
    }
    return srf[srf.length - 1].y;
  }

  var ree = {
    '2,2':'nd','8,1':'nd','5,3':'tb','13,2':'tb',
    '11,2':'dy','3,1':'sc','17,3':'sc','19,2':'y','15,1':'y'
  };
  var shades = ['r0','r1','r2','r3','r4'];

  function hexD(cx, cy, rad) {
    var pts = [];
    for (var i = 0; i < 6; i++) {
      var a = (Math.PI / 3) * i;
      pts.push((cx + rad * Math.cos(a)).toFixed(1) + ',' + (cy + rad * Math.sin(a)).toFixed(1));
    }
    return 'M ' + pts.join(' L ') + ' Z';
  }
  function mkPath(cls, d) {
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('class', cls); p.setAttribute('d', d); return p;
  }

  /* Rock hex grid */
  var hexG = document.createElementNS(NS, 'g');
  hexG.setAttribute('class', 'pv-hex-grid');
  for (var col = 0; col < cols; col++) {
    var cx = cxS + col * spcX;
    var sy = surfY(cx);
    for (var row = 0; row < 7; row++) {
      var cy = yBase - row * spcY - (col % 2 === 1 ? spcY / 2 : 0);
      if (cy < sy) continue;
      var key = col + ',' + row;
      var cls = ree[key]
        ? 'pv-hex-cell pv-hx--' + ree[key]
        : 'pv-hex-cell pv-hx--' + shades[(col * 7 + row * 13) % 5];
      hexG.appendChild(mkPath(cls, hexD(cx, cy, 13)));
    }
  }
  svg.appendChild(hexG);

  /* Grey particulate — 26 items, 5 staggered zones spanning y = 28–136 */
  var grey = [
    {x:45,y:33,r:6},{x:130,y:28,r:5},{x:215,y:36,r:7},{x:308,y:30,r:5},{x:392,y:38,r:6},
    {x:15,y:58,r:6},{x:82,y:50,r:8},{x:175,y:54,r:6},{x:262,y:52,r:8},{x:350,y:56,r:6},{x:408,y:60,r:5},
    {x:35,y:78,r:6},{x:125,y:85,r:6},{x:210,y:76,r:6},{x:285,y:82,r:6},{x:360,y:79,r:6},
    {x:20,y:105,r:5},{x:108,y:112,r:7},{x:188,y:100,r:6},{x:280,y:108,r:8},{x:368,y:102,r:6},
    {x:65,y:130,r:6},{x:152,y:125,r:7},{x:240,y:135,r:6},{x:322,y:130,r:5},{x:408,y:133,r:6}
  ];
  /* opacity scales with radius: larger = nearer = more opaque */
  function depthOpacity(rad, base, step) {
    return (base + (rad - 5) * step).toFixed(2);
  }

  var gG = document.createElementNS(NS, 'g');
  grey.forEach(function (a) {
    var p = mkPath('pv-amb-hex', hexD(a.x, a.y, a.r));
    p.setAttribute('opacity', depthOpacity(a.r, 0.38, 0.09));
    gG.appendChild(p);
  });
  svg.appendChild(gG);

  /* Extra REE hexes — 15 items, same positions as V3 */
  var extras = [
    {cls:'nd',x:110,y:32, r:5},{cls:'sc',x:285,y:36, r:7},
    {cls:'tb',x:170,y:38, r:6},{cls:'y', x:372,y:35, r:6},
    {cls:'y', x:52, y:52, r:7},{cls:'nd',x:100,y:62, r:8},
    {cls:'dy',x:340,y:45, r:8},{cls:'nd',x:242,y:62, r:7},
    {cls:'tb',x:345,y:70, r:5},{cls:'sc',x:140,y:95, r:5},
    {cls:'dy',x:170,y:100,r:6},{cls:'nd',x:400,y:108,r:5},
    {cls:'nd',x:82, y:125,r:5},{cls:'dy',x:205,y:135,r:6},
    {cls:'sc',x:335,y:120,r:5}
  ];
  var exG = document.createElementNS(NS, 'g');
  extras.forEach(function (d) {
    var p = mkPath('pv-float-hex pv-fhx--' + d.cls, hexD(d.x, d.y, d.r));
    p.setAttribute('opacity', depthOpacity(d.r, 0.42, 0.08));
    exG.appendChild(p);
  });
  svg.appendChild(exG);

  /* Primary 5 REE hexes — slightly varied radii for depth */
  var floats = [
    {cls:'nd', cx:60,  cy:88,  r:14},
    {cls:'tb', cx:148, cy:68,  r:12},
    {cls:'dy', cx:228, cy:92,  r:15},
    {cls:'sc', cx:315, cy:72,  r:13},
    {cls:'y',  cx:385, cy:85,  r:11}
  ];
  var fG = document.createElementNS(NS, 'g');
  fG.setAttribute('class', 'pv-float-group');
  floats.forEach(function (d) {
    fG.appendChild(mkPath('pv-float-hex pv-fh--' + d.cls, hexD(d.cx, d.cy, d.r)));
  });
  svg.appendChild(fG);
})();

/* ── Platform visual 2: separation ── */
(function () {
  var svg = document.querySelector('.pv--separation .pv-sep-svg');
  if (!svg) return;

  var NS = 'http://www.w3.org/2000/svg';
  var clrMap = {nd:'#5280b4',tb:'#825a9e',dy:'#348c5a',sc:'#be6e2a',y:'#b81620'};

  /*
   * Primary 5 — scrambled (mixed in solution).
   * sc moved from (60,68)→(30,70) and dy from (148,85)→(155,72)
   * to avoid overlap with extras at those positions.
   * Same slight radius variation as Extraction for visual consistency.
   */
  var elems = [
    {id:'nd',color:'#5280b4',fcx:305,fcy:78, r:14,tcx:42, num:'60',sym:'Nd'},
    {id:'tb',color:'#825a9e',fcx:385,fcy:60, r:12,tcx:126,num:'65',sym:'Tb'},
    {id:'dy',color:'#348c5a',fcx:155,fcy:72, r:15,tcx:210,num:'66',sym:'Dy'},
    {id:'sc',color:'#be6e2a',fcx:30, fcy:70, r:13,tcx:294,num:'21',sym:'Sc'},
    {id:'y', color:'#b81620',fcx:222,fcy:72, r:11,tcx:378,num:'39',sym:'Y' }
  ];

  /* Same 15 extras as Extraction. tcx absent = no ghost arrow (Listerine escape). */
  var extras = [
    {cls:'nd',x:110,y:32, r:5},              /* escaped */
    {cls:'sc',x:285,y:36, r:7,tcx:294},
    {cls:'tb',x:170,y:38, r:6,tcx:126},
    {cls:'y', x:372,y:35, r:6,tcx:378},
    {cls:'y', x:52, y:52, r:7},              /* escaped */
    {cls:'nd',x:100,y:62, r:8,tcx:42 },
    {cls:'dy',x:340,y:45, r:8,tcx:210},
    {cls:'nd',x:242,y:62, r:7,tcx:42 },
    {cls:'tb',x:345,y:70, r:5,tcx:126},
    {cls:'sc',x:140,y:95, r:5,tcx:294},
    {cls:'dy',x:170,y:100,r:6,tcx:210},
    {cls:'nd',x:400,y:108,r:5,tcx:42 },
    {cls:'nd',x:82, y:125,r:5,tcx:42 },
    {cls:'dy',x:205,y:135,r:6,tcx:210},
    {cls:'sc',x:335,y:120,r:5,tcx:294}
  ];

  var tileTop = 190, tileH = 52, tileW = 46;

  function hexD(cx, cy, rad) {
    var pts = [];
    for (var i = 0; i < 6; i++) {
      var a = (Math.PI / 3) * i;
      pts.push((cx + rad * Math.cos(a)).toFixed(1) + ',' + (cy + rad * Math.sin(a)).toFixed(1));
    }
    return 'M ' + pts.join(' L ') + ' Z';
  }
  function el(tag) { return document.createElementNS(NS, tag); }
  function mkPath(cls, d) {
    var p = el('path'); p.setAttribute('class', cls); p.setAttribute('d', d); return p;
  }
  function curvePath(x1, y1, x2, y2) {
    var cp = Math.min(50, (y2 - y1) * 0.42);
    return 'M '+x1+','+y1+' C '+x1+','+(y1+cp)+' '+x2+','+(y2-cp)+' '+x2+','+y2;
  }

  /* Arrowheads */
  var defs = el('defs');
  elems.forEach(function (e) {
    var m = el('marker');
    m.setAttribute('id',          'arw-'+e.id);
    m.setAttribute('viewBox',     '0 0 8 8');
    m.setAttribute('refX',        '7');
    m.setAttribute('refY',        '4');
    m.setAttribute('markerWidth', '5');
    m.setAttribute('markerHeight','5');
    m.setAttribute('orient',      'auto-start-reverse');
    var tri = el('path');
    tri.setAttribute('d','M 0 0 L 8 4 L 0 8 Z');
    tri.setAttribute('fill', e.color);
    m.appendChild(tri); defs.appendChild(m);
  });
  svg.appendChild(defs);

  /* Ghost arrows first (under everything) */
  extras.forEach(function (d) {
    if (d.tcx === undefined) return;
    var arc = el('path');
    arc.setAttribute('d',             curvePath(d.x, d.y + d.r + 1, d.tcx, tileTop - 2));
    arc.setAttribute('fill',          'none');
    arc.setAttribute('stroke',        clrMap[d.cls]);
    arc.setAttribute('stroke-opacity','0.12');
    arc.setAttribute('stroke-width',  '1');
    svg.appendChild(arc);
  });

  /* Extra REE hexes */
  var exG = el('g');
  extras.forEach(function (d) {
    var p = mkPath('pv-float-hex pv-fhx--'+d.cls, hexD(d.x, d.y, d.r));
    p.setAttribute('opacity', (0.42 + (d.r - 5) * 0.08).toFixed(2));
    exG.appendChild(p);
  });
  svg.appendChild(exG);

  /* Primary 5: hex + arrow + tile */
  elems.forEach(function (e) {
    var hex = el('path');
    hex.setAttribute('class','pv-float-hex pv-fh--'+e.id);
    hex.setAttribute('d', hexD(e.fcx, e.fcy, e.r));
    svg.appendChild(hex);

    var arc = el('path');
    arc.setAttribute('d',             curvePath(e.fcx, e.fcy + e.r + 1, e.tcx, tileTop - 2));
    arc.setAttribute('fill',          'none');
    arc.setAttribute('stroke',        e.color);
    arc.setAttribute('stroke-opacity','0.65');
    arc.setAttribute('stroke-width',  '1.5');
    arc.setAttribute('marker-end',    'url(#arw-'+e.id+')');
    svg.appendChild(arc);

    var tx = e.tcx - tileW / 2;
    var rect = el('rect');
    rect.setAttribute('x',             tx);
    rect.setAttribute('y',             tileTop);
    rect.setAttribute('width',         tileW);
    rect.setAttribute('height',        tileH);
    rect.setAttribute('rx',            '3');
    rect.setAttribute('fill',          'rgba(52,46,48,0.85)');
    rect.setAttribute('stroke',        e.color);
    rect.setAttribute('stroke-opacity','0.6');
    rect.setAttribute('stroke-width',  '1');
    svg.appendChild(rect);

    var tNum = el('text');
    tNum.setAttribute('x',    e.tcx);
    tNum.setAttribute('y',    tileTop + 16);
    tNum.setAttribute('class','pv-st-num');
    tNum.textContent = e.num;
    svg.appendChild(tNum);

    var tSym = el('text');
    tSym.setAttribute('x',    e.tcx);
    tSym.setAttribute('y',    tileTop + 38);
    tSym.setAttribute('class','pv-st-sym pv-st--'+e.id);
    tSym.textContent = e.sym;
    svg.appendChild(tSym);
  });
})();




/* ── Custom select dropdown ── */
(function () {
  document.querySelectorAll('.custom-select').forEach(function (select) {
    var trigger  = select.querySelector('.custom-select-trigger');
    var dropdown = select.querySelector('.custom-select-dropdown');
    var valueEl  = select.querySelector('.custom-select-value');
    var hidden   = select.querySelector('input[type="hidden"]');
    var options  = select.querySelectorAll('.custom-select-option');
    if (!trigger || !dropdown) return;

    function open() {
      select.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    }

    function close() {
      select.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      select.classList.contains('open') ? close() : open();
    });

    options.forEach(function (opt) {
      opt.addEventListener('click', function () {
        var val  = opt.getAttribute('data-value');
        var text = opt.textContent.trim();
        if (valueEl) valueEl.textContent = text;
        if (hidden)  hidden.value = val;
        options.forEach(function (o) { o.removeAttribute('aria-selected'); });
        opt.setAttribute('aria-selected', 'true');
        close();
      });
    });

    document.addEventListener('click', function () { close(); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  });
})();
