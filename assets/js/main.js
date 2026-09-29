/* Barding Industries — shared site behavior */
(function () {
  "use strict";

  /* Flag JS as available — CSS only hides .reveal elements under html.js,
     so no-JS / JS-failure visitors always see full content. */
  document.documentElement.classList.add("js");

  /* ---------------- footer copyright year ---------------- */
  var copyrightYear = document.getElementById("copyright-year");
  if (copyrightYear) copyrightYear.textContent = new Date().getFullYear();

  /* ---------------- nav: compact on scroll ---------------- */
  var navbar = document.getElementById("navbar");
  function onScroll() {
    if (!navbar) return;
    if (window.scrollY > 40) navbar.classList.add("is-compact");
    else navbar.classList.remove("is-compact");
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------------- shared "covered by an overlay" regions ----------------
     #main-content and footer can be covered by two independent overlays —
     the full-screen mobile nav panel and the briefing modal — either of
     which can be open at once (the mobile nav's own briefing button opens
     the modal without closing the nav behind it). Route both overlays'
     inert-toggling for these two shared regions through one recompute so
     closing one overlay never lifts inert while the other is still open. */
  var sharedCoveredRegions = [document.getElementById("main-content"), document.querySelector("footer")].filter(Boolean);
  function isOverlayOpen() {
    var navOpen = typeof links !== "undefined" && links && links.classList.contains("is-open");
    var modalOpen = typeof scrim !== "undefined" && scrim && scrim.classList.contains("is-open");
    return navOpen || modalOpen;
  }
  function refreshSharedInert() {
    var covered = isOverlayOpen();
    sharedCoveredRegions.forEach(function (el) {
      if (covered) el.setAttribute("inert", "");
      else el.removeAttribute("inert");
    });
    /* also the shared body-scroll lock: only lift it once NEITHER overlay
       is open, so closing one while the other is still open (e.g. opening
       the briefing modal from inside the open mobile nav, then closing
       just the modal) doesn't unlock background scroll early. */
    document.body.style.overflow = covered ? "hidden" : "";
    /* the cookie bar and back-to-top button are siblings of #navbar, not
       descendants of #main-content/footer, so the inert cascade above
       never reaches them — but the mobile nav panel visually paints over
       both (z-index 200 vs. their 190/150). Without this they'd stay in
       the tab order/AT tree, reachable by tabbing past the open nav's own
       links, while invisible underneath it. Each keeps its own separate
       condition (ack state; scroll position) — this just adds "is an
       overlay currently open" as an extra reason to be inert, re-checked
       the instant either overlay's open state changes rather than only on
       their own triggering events (accept click; scroll). */
    if (typeof syncCookieBarInert === "function") syncCookieBarInert();
    if (typeof syncBackToTop === "function") syncBackToTop();
  }

  /* ---------------- nav: mobile toggle ---------------- */
  var toggle = document.getElementById("nav-toggle");
  var links = document.getElementById("nav-links");
  if (toggle && links) {
    /* .nav-links only becomes an off-canvas panel under the same breakpoint
       CSS uses (max-width:960px) — on desktop it's normal in-flow nav and
       must never be inert. Track that breakpoint so the closed off-canvas
       panel (and, while open, the page content it covers) are excluded from
       tab order/AT only when it's actually acting as a hidden/covering panel. */
    var mqMobile = window.matchMedia("(max-width: 960px)");
    function syncNavInert() {
      if (mqMobile.matches && !links.classList.contains("is-open")) {
        links.setAttribute("inert", "");
      } else {
        links.removeAttribute("inert");
      }
    }
    syncNavInert();
    function onBreakpointChange() {
      /* "is-open" only means anything under the mobile off-canvas layout —
         if the viewport crosses to desktop width while it's still set
         (a tablet rotation, or resizing a window past 960px without
         closing the panel first), syncNavInert() alone would clear this
         panel's own `inert` flag but leave #main-content/footer inert and
         body-scroll locked forever, since those are only released by
         closeNav()'s call to refreshSharedInert(). Do a full closeNav()
         in that case so nothing is left stranded. */
      if (!mqMobile.matches && links.classList.contains("is-open")) {
        closeNav();
      } else {
        syncNavInert();
      }
    }
    if (mqMobile.addEventListener) mqMobile.addEventListener("change", onBreakpointChange);
    else mqMobile.addListener(onBreakpointChange); /* older Safari */

    function openNav() {
      toggle.setAttribute("aria-expanded", "true");
      links.classList.add("is-open");
      links.removeAttribute("inert");
      refreshSharedInert();
    }
    function closeNav() {
      toggle.setAttribute("aria-expanded", "false");
      links.classList.remove("is-open");
      refreshSharedInert();
      syncNavInert();
    }
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      if (open) closeNav();
      else openNav();
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeNav);
    });
    document.addEventListener("keydown", function (e) {
      /* the briefing modal can be opened from inside the open mobile nav
         (its own "Request a Briefing" button); when both are open the
         modal is the topmost layer (it's also inert-locked out via
         #navbar), so it owns Escape first — closeNav() only fires once
         the modal isn't up, so a second Escape then closes the nav. */
      var modalOpen = typeof scrim !== "undefined" && scrim && scrim.classList.contains("is-open");
      if (e.key === "Escape" && links.classList.contains("is-open") && !modalOpen) {
        closeNav();
        toggle.focus();
      }
    });
  }

  /* ---------------- active nav link ---------------- */
  (function activeLink() {
    var path = location.pathname.replace(/\/index\.html$/, "/").replace(/\/$/, "") || "/";
    var page = path.split("/").pop() || "index.html";
    if (page === "") page = "index.html";
    document.querySelectorAll(".nav-links a[data-nav]").forEach(function (a) {
      if (a.getAttribute("data-nav") === page) {
        a.classList.add("is-active");
        a.setAttribute("aria-current", "page");
      }
    });
  })();

  /* ---------------- scroll reveal ---------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
    /* safety net: force-reveal anything the observer missed (e.g. elements
       that never intersect because they're short and off-viewport at load) */
    setTimeout(function () {
      revealEls.forEach(function (el) {
        el.classList.add("is-visible");
      });
    }, 3000);
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------------- briefing modal ---------------- */
  var scrim = document.getElementById("briefing-modal");
  if (scrim) {
    var openers = document.querySelectorAll("[data-modal-open]");
    var closers = scrim.querySelectorAll("[data-modal-close]");
    /* navbar is modal-only (the mobile nav panel doesn't cover itself);
       #main-content/footer are shared with the mobile nav overlay — see
       refreshSharedInert() above, which both overlays route through. */
    var modalOnlyRegions = [document.getElementById("navbar")].filter(Boolean);
    var lastFocused = null;

    /* ---- custom select (Inquiry Type) ----
       Replaces the native <select> entirely (see the CSS comment above
       .select-custom for why) with a hidden input carrying the form value
       and a hand-built listbox for the open/hover states. */
    var inquirySelect = (function () {
      var root = scrim.querySelector("[data-select]");
      if (!root) return null;
      var trigger = root.querySelector(".select-trigger");
      var labelEl = root.querySelector("[data-select-label]");
      var listbox = root.querySelector(".select-listbox");
      var options = Array.prototype.slice.call(listbox.querySelectorAll('[role="option"]'));
      var hiddenInput = root.querySelector("[data-select-value]");
      var errorEl = root.parentElement.querySelector("[data-select-error]");
      var defaultLabel = labelEl.textContent;
      var activeIndex = -1;

      /* "Other" reveals a free-text field with no `name` of its own — the
         submit handler below folds its value into Inquiry_Type so what
         Formspark receives is the specified text, never the literal word
         "Other". Toggling `hidden` on its wrapper also takes the input out
         of constraint validation when it's not shown, so `required` only
         ever applies while it's actually visible. */
      var otherField = scrim.querySelector("#inquiry-other-field");
      var otherInput = otherField ? otherField.querySelector("input") : null;
      function syncOtherField(value) {
        if (!otherField) return;
        var isOther = value === "Other";
        otherField.hidden = !isOther;
        if (otherInput) {
          otherInput.required = isOther;
          if (!isOther) otherInput.value = "";
        }
      }

      function setActive(idx) {
        if (activeIndex >= 0 && options[activeIndex]) options[activeIndex].classList.remove("is-active");
        activeIndex = idx;
        var opt = options[activeIndex];
        if (opt) {
          opt.classList.add("is-active");
          opt.scrollIntoView({ block: "nearest" });
          listbox.setAttribute("aria-activedescendant", opt.id);
        }
      }
      function isOpen() { return !listbox.hidden; }
      function open() {
        listbox.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        root.classList.add("is-open");
        var selectedIdx = options.findIndex(function (o) { return o.getAttribute("aria-selected") === "true"; });
        setActive(selectedIdx >= 0 ? selectedIdx : 0);
        listbox.focus();
      }
      function close() {
        listbox.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
        root.classList.remove("is-open");
      }
      function toggle() { if (isOpen()) close(); else open(); }
      function selectOption(opt, opts) {
        options.forEach(function (o) { o.setAttribute("aria-selected", o === opt ? "true" : "false"); });
        hiddenInput.value = opt.getAttribute("data-value");
        labelEl.textContent = opt.textContent;
        root.classList.remove("has-error");
        if (errorEl) errorEl.hidden = true;
        trigger.removeAttribute("aria-invalid");
        syncOtherField(hiddenInput.value);
        close();
        if (!opts || !opts.silent) trigger.focus();
      }
      function setValue(value) {
        var opt = options.filter(function (o) { return o.getAttribute("data-value") === value; })[0];
        if (opt) selectOption(opt, { silent: true });
      }
      function reset() {
        options.forEach(function (o) { o.removeAttribute("aria-selected"); });
        hiddenInput.value = "";
        labelEl.textContent = defaultLabel;
        root.classList.remove("has-error");
        if (errorEl) errorEl.hidden = true;
        trigger.removeAttribute("aria-invalid");
        syncOtherField("");
        close();
      }
      function showError() {
        root.classList.add("has-error");
        if (errorEl) errorEl.hidden = false;
        trigger.setAttribute("aria-invalid", "true");
        trigger.focus();
      }

      trigger.addEventListener("click", toggle);
      trigger.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!isOpen()) open();
        } else if (e.key === "Escape" && isOpen()) {
          e.stopPropagation();
          close();
        }
      });
      options.forEach(function (opt, i) {
        opt.addEventListener("click", function () { selectOption(opt); });
        opt.addEventListener("mouseenter", function () { setActive(i); });
      });
      listbox.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") { e.preventDefault(); setActive(Math.min(activeIndex + 1, options.length - 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActive(Math.max(activeIndex - 1, 0)); }
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (options[activeIndex]) selectOption(options[activeIndex]); }
        else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); trigger.focus(); }
        else if (e.key === "Tab") { e.preventDefault(); close(); trigger.focus(); }
      });
      document.addEventListener("click", function (e) {
        if (isOpen() && !root.contains(e.target)) close();
      });

      return { setValue: setValue, reset: reset, close: close, showError: showError, hiddenInput: hiddenInput, otherInput: otherInput };
    })();

    function openModal(inquiryType) {
      lastFocused = document.activeElement;
      /* clear any success/error message left over from a previous visit to
         the modal — otherwise a fresh, not-yet-submitted form can appear to
         already show "Thanks, we'll follow up shortly." from last time. */
      if (status) { status.textContent = ""; status.className = "form-status"; }
      scrim.removeAttribute("inert");
      scrim.classList.add("is-open");
      modalOnlyRegions.forEach(function (el) { el.setAttribute("inert", ""); });
      refreshSharedInert();
      if (inquiryType && inquirySelect) inquirySelect.setValue(inquiryType);
      /* focus immediately (not after the entrance transition) so a fast Tab
         press right after opening can never land on hidden background content */
      var firstField = scrim.querySelector("input:not([type=hidden]), textarea");
      if (firstField) firstField.focus();
    }
    function closeModal() {
      scrim.classList.remove("is-open");
      scrim.setAttribute("inert", "");
      modalOnlyRegions.forEach(function (el) { el.removeAttribute("inert"); });
      refreshSharedInert();
      if (inquirySelect) inquirySelect.close();
      if (lastFocused) lastFocused.focus();
    }
    openers.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        openModal(btn.getAttribute("data-modal-open") || "");
      });
    });
    closers.forEach(function (el) {
      el.addEventListener("click", closeModal);
    });
    scrim.addEventListener("click", function (e) {
      if (e.target === scrim) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (!scrim.classList.contains("is-open")) return;
      if (e.key === "Escape") { closeModal(); return; }
      if (e.key === "Tab") {
        var focusable = scrim.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    /* form submit */
    var form = scrim.querySelector("#briefing-form");
    var status = scrim.querySelector(".form-status");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        /* Inquiry Type is now a hidden input (see the custom select above),
           so the browser's native `required` validation can't see or focus
           it — check and surface it ourselves before submitting. */
        if (inquirySelect && !inquirySelect.hiddenInput.value) {
          inquirySelect.showError();
          inquirySelect.close();
          return;
        }
        var submitBtn = form.querySelector("button[type=submit]");
        var submitLabel = submitBtn.querySelector("[data-submit-label]");
        submitBtn.disabled = true;
        if (submitLabel) submitLabel.textContent = "Sending…";
        /* Formspark's `_email` key customizes the notification it sends us —
           here just the subject line, so a request is identifiable in an
           inbox list without opening it. See:
           https://documentation.formspark.io/customization/notification-email.html */
        var payload = Object.fromEntries(new FormData(form));
        /* "Other" has no `name` of its own on the specify field (see the
           select code above) — fold its text into Inquiry_Type here so
           Formspark only ever sees what was actually specified, never the
           literal word "Other". */
        if (payload.Inquiry_Type === "Other" && inquirySelect && inquirySelect.otherInput) {
          var specified = inquirySelect.otherInput.value.trim();
          if (specified) payload.Inquiry_Type = specified;
        }
        /* Which page's "Request a Briefing" button was actually clicked —
           a free signal of what the visitor is interested in, since the
           same modal/form is shared across every page. */
        var PAGE_NAMES = {
          "": "Home",
          "index.html": "Home",
          "technology.html": "Technology",
          "space.html": "Space",
          "company.html": "Company",
          "privacy.html": "Privacy Policy",
        };
        var currentPage = window.location.pathname.split("/").pop();
        payload.Source_Page = PAGE_NAMES[currentPage] || document.title;
        payload._email = {
          subject: "New briefing request — " + payload.Name + " (" + payload.Organization + ")",
        };
        fetch(form.action, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        })
          .then(function (res) {
            if (res.ok) {
              status.textContent = "Thanks, we'll follow up shortly.";
              status.className = "form-status is-visible is-success";
              form.reset();
              if (inquirySelect) inquirySelect.reset();
            } else {
              throw new Error("bad response");
            }
          })
          .catch(function () {
            status.textContent = "Something went wrong. Email us directly at inquiries@bardingindustries.com.";
            status.className = "form-status is-visible is-error";
          })
          .finally(function () {
            submitBtn.disabled = false;
            if (submitLabel) submitLabel.textContent = "Submit request";
          });
      });
    }
  }

  /* ---------------- back to top ---------------- */
  var backToTop = document.getElementById("back-to-top");
  if (backToTop) {
    var themedSections = document.querySelectorAll("section.on-paper, section.on-ink, section.on-ink-surface");
    /* assigned as a var (not `function syncBackToTop(){}`) so the identifier
       hoists to the whole IIFE — under "use strict" a block-scoped function
       declaration here would be invisible to refreshSharedInert() above. */
    var syncBackToTop = function () {
      var visible = window.scrollY > 400;
      backToTop.classList.toggle("is-visible", visible);
      /* ships with `inert` in the HTML by default (page loads at the top,
         so it starts hidden) — keep it out of the tab order/AT whenever
         it's invisible or covered by an open overlay (mobile nav/modal),
         not just visually hidden via opacity. */
      if (visible && !isOverlayOpen()) backToTop.removeAttribute("inert");
      else backToTop.setAttribute("inert", "");

      /* match whatever section currently sits behind the button, so it
         doesn't sit as a dark box on light (.on-paper) sections. */
      var probeY = window.innerHeight - 54;
      var onPaper = false;
      for (var i = 0; i < themedSections.length; i++) {
        var r = themedSections[i].getBoundingClientRect();
        if (r.top <= probeY && r.bottom >= probeY) {
          onPaper = themedSections[i].classList.contains("on-paper");
          break;
        }
      }
      backToTop.classList.toggle("on-paper-bg", onPaper);
    };
    syncBackToTop();
    window.addEventListener("scroll", syncBackToTop, { passive: true });
    window.addEventListener("resize", syncBackToTop);
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------------- cookie notice ---------------- */
  var cookieBar = document.getElementById("cookie-bar");
  if (cookieBar) {
    var COOKIE_ACK_KEY = "barding_cookie_ack";
    var cookieAccept = document.getElementById("cookie-accept");

    function setCookieBarHeightVar() {
      document.documentElement.style.setProperty("--cookie-bar-h", cookieBar.offsetHeight + "px");
    }

    var cookieAcked = false;
    try {
      cookieAcked = localStorage.getItem(COOKIE_ACK_KEY) === "1";
    } catch (e) {
      /* localStorage unavailable (privacy mode, disabled storage) — treat
         as not-yet-acknowledged rather than throwing. */
    }

    /* assigned as a var (not `function syncCookieBarInert(){}`) so the
       identifier hoists to the whole IIFE — under "use strict" a
       block-scoped function declaration here would be invisible to
       refreshSharedInert() above. Keeps the bar out of the tab order/AT
       whenever it's already acknowledged (nothing to show) OR it's
       covered by an open overlay (mobile nav/modal), even though those
       overlays leave `.is-visible`/`has-cookie-bar` untouched. */
    var syncCookieBarInert = function () {
      if (!cookieAcked && !isOverlayOpen()) cookieBar.removeAttribute("inert");
      else cookieBar.setAttribute("inert", "");
    };

    if (!cookieAcked) {
      setCookieBarHeightVar();
      cookieBar.classList.add("is-visible");
      document.body.classList.add("has-cookie-bar");
      window.addEventListener("resize", setCookieBarHeightVar);
    }
    syncCookieBarInert();

    if (cookieAccept) {
      cookieAccept.addEventListener("click", function () {
        cookieBar.classList.remove("is-visible");
        document.body.classList.remove("has-cookie-bar");
        window.removeEventListener("resize", setCookieBarHeightVar);
        cookieAcked = true;
        syncCookieBarInert();
        try {
          localStorage.setItem(COOKIE_ACK_KEY, "1");
        } catch (e) {
          /* best-effort — if storage fails the notice just reappears next visit */
        }
      });
    }
  }

  /* ---------------- hero diamond-grid cursor glow ---------------- */
  /* Replaces the old hex-lattice canvas (a per-frame requestAnimationFrame
     draw loop redrawing a full hex grid + radial glow every tick) with the
     pattern from the pre-redesign site: a static tiled diamond SVG
     background (.grid-diamond, in the CSS) plus two color layers whose
     radial-gradient mask is centered on the cursor via --cx/--cy custom
     properties. No animation loop, no canvas, no per-frame cost — the mask
     position only updates on actual pointer movement. */
  var diamondHero = document.querySelector("[data-diamond-cursor]");
  if (diamondHero) {
    diamondHero.addEventListener("pointermove", function (e) {
      var rect = diamondHero.getBoundingClientRect();
      diamondHero.style.setProperty("--cx", e.clientX - rect.left + "px");
      diamondHero.style.setProperty("--cy", e.clientY - rect.top + "px");
    });
    diamondHero.addEventListener("pointerleave", function () {
      diamondHero.style.setProperty("--cx", "-999px");
      diamondHero.style.setProperty("--cy", "-999px");
    });
  }
})();
