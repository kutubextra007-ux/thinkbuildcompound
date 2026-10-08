/*
 * think.build.compound. — site script (vanilla JS, no dependencies)
 *
 * 1. Mobile navigation toggle.
 * 2. Long-form article extras on <body class="longform">: reading progress
 *    bar, table of contents highlighting, copy-link button.
 * 3. Renders story cards from assets/data/stories.json into any element
 *    with [data-stories]. Options (data attributes on that element):
 *      data-limit="4"       show at most N stories (newest first)
 *      data-archive         group by year and enable filters + search
 *      data-upcoming        append a "more stories on the way" card when the
 *                           grid has room (home page)
 *    Stories dated in the future stay hidden until that date (scheduling).
 *
 * Adding a story never requires editing this file. See README.md.
 */
(function () {
  "use strict";

  // ---- 1. Mobile nav -------------------------------------------------------
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // ---- 2. Long-form articles (<body class="longform">) ----------------------
  // Reading progress bar, table of contents and the copy-link button.
  if (document.body.classList.contains("longform")) {
    var bar = document.querySelector(".reading-progress span");
    var article = document.querySelector("article");
    if (bar && article) {
      var ticking = false;
      var update = function () {
        var top = article.getBoundingClientRect().top + window.scrollY;
        var span = article.offsetHeight - window.innerHeight;
        var p = span > 0 ? (window.scrollY - top) / span : 1;
        bar.style.transform = "scaleX(" + Math.min(1, Math.max(0, p)) + ")";
        ticking = false;
      };
      window.addEventListener("scroll", function () {
        if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
      }, { passive: true });
      window.addEventListener("resize", update);
      update();
    }

    var toc = document.querySelector(".toc details");
    if (toc) {
      var wide = window.matchMedia("(min-width: 1360px)");
      var syncToc = function () { if (wide.matches) toc.open = true; };
      syncToc();
      if (wide.addEventListener) wide.addEventListener("change", syncToc);
      toc.addEventListener("click", function (e) {
        if (e.target.closest("a") && !wide.matches) toc.open = false;
      });
      // Highlight the section being read: the last heading above 30% of the viewport.
      var links = Array.prototype.slice.call(toc.querySelectorAll("a[href^='#']"));
      var heads = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
      var current = -1, pending = false;
      var highlight = function () {
        pending = false;
        var idx = -1, line = window.innerHeight * 0.3;
        heads.forEach(function (h, i) { if (h && h.getBoundingClientRect().top <= line) idx = i; });
        if (idx === current) return;
        if (current >= 0) links[current].removeAttribute("aria-current");
        if (idx >= 0) links[idx].setAttribute("aria-current", "true");
        current = idx;
      };
      window.addEventListener("scroll", function () {
        if (!pending) { pending = true; window.requestAnimationFrame(highlight); }
      }, { passive: true });
      highlight();
    }

    document.querySelectorAll("[data-copy-link]").forEach(function (btn) {
      var label = btn.querySelector("[data-copy-label]") || btn;
      btn.addEventListener("click", function () {
        var url = btn.getAttribute("data-copy-link");
        var done = function () {
          label.textContent = "Link copied";
          setTimeout(function () { label.textContent = "Copy link"; }, 2000);
        };
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(url).then(done, function () { window.prompt("Copy this link:", url); });
        } else {
          window.prompt("Copy this link:", url);
        }
      });
    });
  }

  // ---- 3. Stories ------------------------------------------------------------
  var targets = document.querySelectorAll("[data-stories]");
  if (!targets.length) return;

  // Resolve paths relative to the site root, so pages in /stories/ work too
  // and the site works both on a custom domain and on a GitHub project URL.
  var script = document.currentScript || document.querySelector('script[src*="main.js"]');
  var root = script.getAttribute("src").replace(/assets\/js\/main\.js.*$/, "");

  var CATEGORY_LABEL = { think: "Think", build: "Build", compound: "Compound" };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function formatDate(iso) {
    var d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function cardHTML(s) {
    var tags = [CATEGORY_LABEL[s.category] || s.category].concat(s.tags || []);
    var tagHTML = tags.map(function (t, i) {
      return '<span class="' + (i === 0 ? "cat" : "") + '">' + esc(t) + "</span>";
    }).join('<span class="sep" aria-hidden="true">·</span>');
    return (
      '<article class="card" data-category="' + esc(s.category) + '">' +
        '<div class="card-media"><img src="' + esc(root + s.image) + '" alt="' + esc(s.imageAlt || "") + '" loading="lazy" width="1200" height="675"></div>' +
        '<div class="card-body">' +
          '<p class="card-tags">' + tagHTML + "</p>" +
          '<h3><a href="' + esc(root + s.url) + '">' + esc(s.title) + "</a></h3>" +
          '<p class="card-excerpt">' + esc(s.excerpt) + "</p>" +
          '<p class="card-meta"><time datetime="' + esc(s.date) + '">' + formatDate(s.date) + "</time>" +
            (s.readMinutes ? '<span class="sep" aria-hidden="true">·</span>' + esc(s.readMinutes) + " min read" : "") +
          "</p>" +
        "</div>" +
      "</article>"
    );
  }

  // A story with a future date stays hidden until that date arrives at
  // midnight US Central time (UTC-5; an hour off in winter, which is fine).
  function isPublished(s, now) {
    return new Date(s.date + "T00:00:00-05:00").getTime() <= now;
  }

  function upcoming(span) {
    return '<div class="card card--upcoming" style="--span:' + span + '"><div><p>More stories are on the way.</p>' +
      "<small>New entries appear here as they’re written.</small></div></div>";
  }

  function renderSimple(el, stories) {
    var limit = parseInt(el.getAttribute("data-limit"), 10) || stories.length;
    var list = stories.slice(0, limit);
    var html = '<div class="card-grid">' + list.map(cardHTML).join("");
    if (el.hasAttribute("data-upcoming") && list.length < limit) html += upcoming(limit - list.length);
    el.innerHTML = html + "</div>";
  }

  function renderArchive(el, stories) {
    var params = new URLSearchParams(window.location.search);
    var state = {
      category: CATEGORY_LABEL[params.get("category")] ? params.get("category") : "all",
      q: params.get("q") || ""
    };
    var buttons = document.querySelectorAll(".filter");
    var input = document.getElementById("story-search");
    if (input) input.value = state.q;
    if (window.location.hash === "#search" && input) input.focus();

    function draw() {
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-filter") === state.category ? "true" : "false");
      });
      var q = state.q.trim().toLowerCase();
      var list = stories.filter(function (s) {
        if (state.category !== "all" && s.category !== state.category) return false;
        if (!q) return true;
        return [s.title, s.excerpt, (s.tags || []).join(" "), s.category].join(" ").toLowerCase().indexOf(q) !== -1;
      });
      if (!list.length) {
        el.innerHTML = '<p class="archive-empty">No stories match yet. Try another filter or search term.</p>';
        return;
      }
      var years = {};
      list.forEach(function (s) { (years[s.date.slice(0, 4)] = years[s.date.slice(0, 4)] || []).push(s); });
      el.innerHTML = Object.keys(years).sort().reverse().map(function (y) {
        return '<h2 class="archive-year">' + y + '</h2><div class="card-grid">' + years[y].map(cardHTML).join("") + "</div>";
      }).join("");
      var status = document.getElementById("archive-status");
      if (status) status.textContent = list.length + (list.length === 1 ? " story" : " stories") + " shown";
    }

    function sync() {
      var p = new URLSearchParams();
      if (state.category !== "all") p.set("category", state.category);
      if (state.q) p.set("q", state.q);
      var qs = p.toString();
      history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () { state.category = b.getAttribute("data-filter"); sync(); draw(); });
    });
    if (input) input.addEventListener("input", function () { state.q = input.value; sync(); draw(); });
    draw();
  }

  fetch(root + "assets/data/stories.json")
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      var now = Date.now();
      var stories = (data.stories || [])
        .filter(function (s) { return !s.draft && isPublished(s, now); })
        .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      targets.forEach(function (el) {
        if (el.hasAttribute("data-archive")) renderArchive(el, stories);
        else renderSimple(el, stories);
      });
    })
    .catch(function () {
      targets.forEach(function (el) {
        el.innerHTML = '<p class="archive-empty">Stories couldn’t load right now. <a href="' + root + 'stories.html">Try the Stories page</a>.</p>';
      });
    });
})();
