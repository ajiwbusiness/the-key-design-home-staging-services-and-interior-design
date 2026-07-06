/* ==========================================================================
   Interior Designer Template (US) — app.js
   Vanilla JS only, no libraries. Loaded with `defer`.
   Every behaviour degrades gracefully and respects prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

  var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DESKTOP = window.matchMedia("(min-width: 48em)");

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function rafThrottle(fn) {
    var ticking = false;
    return function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { fn(); ticking = false; });
    };
  }

  /* ---------------------------------------------------------------- reveal */
  function initReveal() {
    var items = $all("[data-reveal], .reveal-clip");
    if (!items.length) return;
    if (REDUCE || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-revealed"); el.style.willChange = "auto"; });
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("is-revealed");
        obs.unobserve(el);
        el.addEventListener("transitionend", function () { el.style.willChange = "auto"; }, { once: true });
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* -------------------------------------------------------- hero entrance */
  function initHeroEntrance() {
    var hero = $(".hero");
    if (!hero) return;
    if (REDUCE) { hero.classList.add("hero-in"); return; }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { hero.classList.add("hero-in"); });
    });
  }

  /* ------------------------------------------------------ header on scroll */
  function initHeaderOnScroll() {
    var header = $(".site-header");
    if (!header) return;
    var onScroll = rafThrottle(function () {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ----------------------------------------------------- active nav spy */
  function initActiveSection() {
    var links = $all(".nav-desktop .nav-link");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (l) {
      var id = (l.getAttribute("href") || "").replace("#", "");
      if (id) map[id] = l;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        links.forEach(function (l) { l.removeAttribute("aria-current"); });
        if (map[id]) map[id].setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) io.observe(sec);
    });
  }

  /* --------------------------------------------------------- mobile nav */
  function initMobileNav() {
    var toggle = $(".nav-toggle");
    var drawer = $("#mobile-drawer");
    var scrim = $(".nav-scrim");
    if (!toggle || !drawer || !scrim) return;
    var closeBtn = $(".drawer-close", drawer);
    var lastFocus = null;

    function focusables() { return $all('a[href], button:not([disabled])', drawer); }
    function open() {
      lastFocus = document.activeElement;
      drawer.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
      drawer.removeAttribute("inert");
      scrim.hidden = false;
      requestAnimationFrame(function () { scrim.classList.add("is-open"); });
      toggle.classList.add("is-active");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      document.body.classList.add("no-scroll");
      var f = focusables();
      if (f[0]) f[0].focus();
      document.addEventListener("keydown", onKey);
    }
    function close() {
      drawer.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      drawer.setAttribute("inert", "");
      scrim.classList.remove("is-open");
      var hideScrim = function () { scrim.hidden = true; scrim.removeEventListener("transitionend", hideScrim); };
      if (REDUCE) { scrim.hidden = true; } else { scrim.addEventListener("transitionend", hideScrim); }
      toggle.classList.remove("is-active");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", onKey);
      if (lastFocus) lastFocus.focus();
    }
    function onKey(e) {
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab") return;
      var f = focusables();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    toggle.addEventListener("click", function () {
      drawer.classList.contains("is-open") ? close() : open();
    });
    if (closeBtn) closeBtn.addEventListener("click", close);
    scrim.addEventListener("click", close);
    $all(".nav-link", drawer).forEach(function (l) { l.addEventListener("click", close); });
    $all("a[href]", drawer).forEach(function (l) { l.addEventListener("click", close); });
    DESKTOP.addEventListener("change", function (e) { if (e.matches && drawer.classList.contains("is-open")) close(); });
  }

  /* ------------------------------------------------------- smooth scroll */
  function initSmoothScroll() {
    var header = $(".site-header");
    document.addEventListener("click", function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var offset = (header ? header.offsetHeight : 0) + 16;
      var top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: top, behavior: REDUCE ? "auto" : "smooth" });
      if (history.pushState) history.pushState(null, "", id);
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  }

  /* ---------------------------------------------------- book FAB (desktop) */
  function initFab() {
    var fab = $(".fab-book");
    if (!fab) return;
    var contact = $("#contact");
    var onScroll = rafThrottle(function () {
      var show = window.scrollY > window.innerHeight * 0.6;
      if (contact) {
        var r = contact.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) show = false;  // hide when the form is on screen
      }
      fab.classList.toggle("is-visible", show);
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------- mobile bottom CTA */
  function initMobileCta() {
    var bar = $(".mobile-cta-bar");
    var hero = $(".hero");
    if (!bar) return;
    var threshold = hero ? hero.offsetHeight * 0.6 : window.innerHeight * 0.5;
    var onScroll = rafThrottle(function () {
      bar.classList.toggle("is-visible", window.scrollY > threshold);
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () { threshold = hero ? hero.offsetHeight * 0.6 : window.innerHeight * 0.5; });
    onScroll();

    var contact = $("#contact");
    if (contact && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        bar.classList.toggle("is-hidden", entries[0].isIntersecting);
      }, { rootMargin: "0px 0px -120px 0px" });
      io.observe(contact);
    }
  }

  /* -------------------------------------------------------- gallery + lb */
  function initGallery() {
    var grid = $(".gallery-grid");
    if (!grid) return;
    var items = $all(".gallery-item", grid);
    var filterBtns = $all(".filter-btn");
    var visible = items.slice();

    function applyFilter(cat) {
      visible = [];
      items.forEach(function (it) {
        var match = cat === "all" || it.getAttribute("data-category") === cat;
        it.classList.toggle("is-hidden", !match);
        if (match) {
          visible.push(it);
          if (!REDUCE) { it.classList.remove("is-entering"); void it.offsetWidth; it.classList.add("is-entering"); }
        }
      });
    }
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) { b.classList.remove("is-active"); b.setAttribute("aria-pressed", "false"); });
        btn.classList.add("is-active");
        btn.setAttribute("aria-pressed", "true");
        applyFilter(btn.getAttribute("data-filter") || "all");
      });
    });

    var lb = $("#lightbox");
    if (!lb) return;
    var lbImg = $(".lightbox__img", lb);
    var lbStrong = $(".lightbox__caption strong", lb);
    var lbSpan = $(".lightbox__caption span", lb);
    var btnClose = $(".lightbox__close", lb);
    var btnPrev = $(".lightbox__prev", lb);
    var btnNext = $(".lightbox__next", lb);
    var current = 0, lastFocus = null;

    function preload(src) { if (src) { var i = new Image(); i.src = src; } }
    function render() {
      var it = visible[current];
      if (!it) return;
      var img = $("img", it);
      lbImg.src = it.getAttribute("data-full") || (img && img.src);
      lbImg.alt = (img ? img.alt : it.getAttribute("data-title")) || "";
      lbStrong.textContent = it.getAttribute("data-title") || "";
      lbSpan.textContent = it.getAttribute("data-cat-label") || "";
      var nxt = visible[(current + 1) % visible.length], prv = visible[(current - 1 + visible.length) % visible.length];
      preload(nxt && nxt.getAttribute("data-full"));
      preload(prv && prv.getAttribute("data-full"));
    }
    function openAt(idx) {
      current = idx; lastFocus = document.activeElement; render();
      lb.hidden = false;
      requestAnimationFrame(function () { lb.classList.add("is-open"); });
      document.body.classList.add("no-scroll");
      btnClose.focus();
      document.addEventListener("keydown", onKey);
    }
    function closeLb() {
      lb.classList.remove("is-open");
      var hide = function () { lb.hidden = true; lb.removeEventListener("transitionend", hide); };
      if (REDUCE) lb.hidden = true; else lb.addEventListener("transitionend", hide);
      document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", onKey);
      if (lastFocus) lastFocus.focus();
    }
    function step(dir) { current = (current + dir + visible.length) % visible.length; render(); }
    function onKey(e) {
      if (e.key === "Escape") return closeLb();
      if (e.key === "ArrowRight") return step(1);
      if (e.key === "ArrowLeft") return step(-1);
      if (e.key === "Tab") {
        var f = [btnClose, btnPrev, btnNext].filter(function (b) { return b && b.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    items.forEach(function (it) {
      function trigger() { openAt(visible.indexOf(it)); }
      it.addEventListener("click", trigger);
      it.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); trigger(); } });
    });
    btnClose.addEventListener("click", closeLb);
    btnPrev.addEventListener("click", function () { step(-1); });
    btnNext.addEventListener("click", function () { step(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    var sx = 0;
    lb.addEventListener("touchstart", function (e) { sx = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); }, { passive: true });
  }

  /* ----------------------------------------------------- before / after */
  function initBeforeAfter() {
    var frame = $(".ba-frame");
    if (!frame) return;
    var range = $(".ba-range", frame);
    var beforeWrap = $(".ba-before-wrap", frame);
    var beforeImg = $(".ba-before-wrap img", frame);
    var handle = $(".ba-handle", frame);
    var divider = $(".ba-divider", frame);
    if (!range || !beforeWrap) return;
    function update() {
      var v = range.value;
      beforeWrap.style.width = v + "%";
      if (beforeImg) beforeImg.style.width = frame.clientWidth + "px";
      if (handle) handle.style.left = v + "%";
      if (divider) divider.style.left = v + "%";
      range.setAttribute("aria-valuetext", v + "% revealed");
    }
    range.addEventListener("input", update);
    window.addEventListener("resize", rafThrottle(update));
    $all("img", frame).forEach(function (img) { if (!img.complete) img.addEventListener("load", update, { once: true }); });
    update();
  }

  /* ----------------------------------------------- testimonials dots */
  function initTestimonialDots() {
    var track = $(".testimonials-grid");
    var dots = $all(".t-dot");
    if (!track || !dots.length) return;
    var cards = $all(".testimonial", track);
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        if (cards[i]) cards[i].scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", inline: "center", block: "nearest" });
      });
    });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var idx = cards.indexOf(entry.target);
          dots.forEach(function (d, i) { d.classList.toggle("is-active", i === idx); });
        });
      }, { root: track, threshold: 0.6 });
      cards.forEach(function (c) { io.observe(c); });
    }
  }

  /* -------------------------------------------------------- stat count-up */
  function initStatCountup() {
    var nums = $all(".stat-num[data-count]");
    if (!nums.length) return;
    function run(el) {
      var target = parseInt((el.getAttribute("data-count") || "").replace(/[^0-9]/g, ""), 10);
      if (isNaN(target)) return;
      if (REDUCE) { el.textContent = String(target); return; }
      var start = null, dur = 1400;
      function tick(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    if (!("IntersectionObserver" in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target); obs.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* -------------------------------------------------- multi-step lead form */
  function initLeadForm() {
    var form = $("#lead-form");
    if (!form) return;
    var steps = $all(".lead-step", form);
    var dots = $all(".lead-progress li", form);
    var status = $(".form-status", form);
    var current = 0;

    function fieldErr(name) { return form.querySelector('[data-error-for="' + name + '"]'); }
    function setErr(input, node, msg) {
      if (msg) { if (input) input.setAttribute("aria-invalid", "true"); if (node) { node.textContent = msg; node.hidden = false; } }
      else { if (input) input.removeAttribute("aria-invalid"); if (node) node.hidden = true; }
      return !msg;
    }
    function show(i, focus) {
      current = Math.max(0, Math.min(steps.length - 1, i));
      steps.forEach(function (s, idx) { s.classList.toggle("is-active", idx === current); });
      dots.forEach(function (d, idx) { d.classList.toggle("is-active", idx <= current); });
      if (focus === false) return;
      var legend = steps[current].querySelector("legend");
      if (legend) { legend.setAttribute("tabindex", "-1"); legend.focus({ preventScroll: true }); }
    }
    function validateStep(idx) {
      if (idx === 0) {
        var picked = form.querySelector('input[name="project"]:checked');
        return setErr(null, fieldErr("project"), picked ? "" : "Please pick a project type.");
      }
      if (idx === 2) {
        var ok = true;
        var name = $("#f-name", form), email = $("#f-email", form), phone = $("#f-phone", form);
        ok = setErr(name, fieldErr("name"), name.value.trim() ? "" : "Please enter your name.") && ok;
        var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
        ok = setErr(email, fieldErr("email"), emailOk ? "" : "Please enter a valid email.") && ok;
        var digits = phone.value.replace(/[^0-9]/g, "");
        ok = setErr(phone, fieldErr("phone"), digits.length >= 10 ? "" : "Please enter a valid phone number.") && ok;
        return ok;
      }
      return true;
    }

    form.addEventListener("click", function (e) {
      var next = e.target.closest(".lead-next");
      var back = e.target.closest(".lead-back");
      if (next) { if (validateStep(current)) show(current + 1); else focusFirstError(); }
      else if (back) { show(current - 1); }
    });
    function focusFirstError() {
      var invalid = steps[current].querySelector('[aria-invalid="true"]');
      if (invalid) invalid.focus();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateStep(0)) { show(0); focusFirstError(); return; }
      if (!validateStep(2)) { show(2); focusFirstError(); return; }
      var email = (form.getAttribute("action") || "").replace(/^mailto:/, "");
      var d = new FormData(form);
      function g(k) { return (d.get(k) || "").toString().trim() || "-"; }
      var lines = [
        "Project type: " + g("project"),
        "Timeline: " + g("timeline"),
        "Investment: " + g("investment"),
        "",
        "Name: " + g("name"),
        "Email: " + g("email"),
        "Phone: " + g("phone"),
        "",
        "Details: " + g("message")
      ].join("\n");
      if (status) status.textContent = "Opening your email to send…";
      var href = "mailto:" + email + "?subject=" + encodeURIComponent("New consultation request — " + g("name"))
        + "&body=" + encodeURIComponent(lines);
      window.location.href = href;
    });

    $all('input[name="project"]', form).forEach(function (r) {
      r.addEventListener("change", function () { setErr(null, fieldErr("project"), ""); });
    });

    show(0, false);
  }

  /* ----------------------------------------------------------- boot */
  function boot() {
    initReveal();
    initHeroEntrance();
    initHeaderOnScroll();
    initActiveSection();
    initMobileNav();
    initSmoothScroll();
    initFab();
    initMobileCta();
    initGallery();
    initBeforeAfter();
    initTestimonialDots();
    initStatCountup();
    initLeadForm();
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
