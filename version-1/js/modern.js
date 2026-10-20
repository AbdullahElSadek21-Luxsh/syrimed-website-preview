/* ==========================================================================
   SyriMed — motion & interaction layer (vanilla JS, no dependencies)
   ========================================================================== */
(function () {
  "use strict";

  var doc = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  doc.classList.add("sm-js");
  window.__smReady = true;

  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* ------------------------------------------------------------------
     Legacy lazy images: the theme points src at a placeholder and swaps
     on scroll. Load them natively instead so nothing shows as broken.
     ------------------------------------------------------------------ */
  $all("img.btLazyLoadImage[data-image_src]").forEach(function (img) {
    img.setAttribute("loading", "lazy");
    img.src = img.getAttribute("data-image_src");
    img.classList.add("btLazyLoaded");
  });

  /* ------------------------------------------------------------------
     Skip link for keyboard / screen-reader users
     ------------------------------------------------------------------ */
  var contentWrap = document.querySelector(".bt-content-wrap");
  if (contentWrap) {
    if (!contentWrap.id) contentWrap.id = "sm-content";
    contentWrap.setAttribute("tabindex", "-1");
    var skip = document.createElement("a");
    skip.className = "sm-skip";
    skip.href = "#" + contentWrap.id;
    skip.textContent = "Skip to content";
    body.insertBefore(skip, body.firstChild);
  }

  /* Products A–Z: DataTables builds its search box on jQuery ready, so finish it after load */
  // the table may be initialised after window load, so retry briefly until its search box exists
  var tableTries = 0;
  (function finishTables() {
    var inputs = $all(".dataTables_filter input");
    inputs.forEach(function (input) {
      if (!input.placeholder) input.placeholder = "Search products or therapy areas";
      input.setAttribute("aria-label", "Search products or therapy areas");
    });
    if (inputs.length) {
      // DataTables measures column widths before the web font arrives; re-measure once it has
      var jq = window.jQuery;
      if (jq && jq.fn && jq.fn.dataTable && jq.fn.dataTable.tables) {
        var adjust = function () { jq.fn.dataTable.tables({ visible: true, api: true }).columns.adjust(); };
        adjust();
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(adjust);
      }
    } else if (document.querySelector("table") && tableTries++ < 25) {
      setTimeout(finishTables, 200);
    }
  })();

  /* ------------------------------------------------------------------
     Scroll progress + header state
     ------------------------------------------------------------------ */
  var progress = document.createElement("div");
  progress.className = "sm-progress";
  progress.setAttribute("aria-hidden", "true");
  body.appendChild(progress);

  var lastY = window.pageYOffset;
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progress.style.transform = "scaleX(" + clamp(y / max, 0, 1) + ")";

    body.classList.toggle("sm-scrolled", y > 12);
    var menuOpen = body.classList.contains("btMenuVerticalOn");
    if (!menuOpen && y > 420 && y > lastY + 4) body.classList.add("sm-header-hidden");
    else if (y < lastY - 4 || y <= 420) body.classList.remove("sm-header-hidden");
    lastY = y;

    parallax();
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  /* ------------------------------------------------------------------
     Word-by-word heading reveal
     ------------------------------------------------------------------ */
  function splitWords(el) {
    if (el.__smSplit) return;
    el.__smSplit = true;
    var i = 0;
    var frag = document.createDocumentFragment();

    function addWord(text, cls) {
      var w = document.createElement("span");
      w.className = "sm-word";
      var s = document.createElement("span");
      if (cls) s.className = cls;
      s.textContent = text;
      s.style.setProperty("--sm-i", i++);
      w.appendChild(s);
      frag.appendChild(w);
    }
    function walk(node, cls) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(" "));
            else addWord(part, cls);
          });
        } else if (n.nodeType === 1) {
          if (n.tagName === "BR") frag.appendChild(document.createElement("br"));
          else walk(n, ((cls ? cls + " " : "") + (n.className || "")).trim());
        }
      });
    }
    walk(el, "");
    el.innerHTML = "";
    el.appendChild(frag);
  }

  /* ------------------------------------------------------------------
     Inner-page hero upgrade: Ken Burns media layer, glow orbs,
     breadcrumb, animated title.
     ------------------------------------------------------------------ */
  var pageHero = null;

  // breadcrumb + animated title for any page banner
  function decorateHeroTitle(hero) {
    var title = hero.querySelector(".bt_bb_headline h1, .bt_bb_headline h2, .bt_bb_headline h3, .bt_bb_headline h4");
    if (!title) return;
    var label = (title.textContent || "").replace(/\s+/g, " ").trim();
    var header = title.closest("header") || title;
    if (label && label.length < 60) {
      var crumb = document.createElement("nav");
      crumb.className = "sm-crumb";
      crumb.setAttribute("aria-label", "Breadcrumb");
      crumb.innerHTML = '<a href="index.html">Home</a><span class="sep">/</span><span></span>';
      crumb.lastChild.textContent = label;
      header.parentNode.insertBefore(crumb, header);
    }
    var inner = title.querySelector(".bt_bb_headline_content > span") || title.querySelector(".bt_bb_headline_content") || title;
    if (!reduceMotion) {
      splitWords(inner);
      inner.setAttribute("data-reveal", "words");
    }
  }

  (function upgradeHero() {
    if (body.classList.contains("sm-home")) return;

    // plain coloured title bar (Pharmacovigilance) -> gradient banner
    var bar = document.querySelector(".bt-content .bt_bb_wrapper > section.bg-pharmacovigilance:first-child");
    if (bar) {
      bar.classList.add("sm-title-hero");
      var glow = document.createElement("div");
      glow.className = "sm-hero-orbs";
      glow.setAttribute("aria-hidden", "true");
      glow.innerHTML = "<span></span><span></span>";
      bar.insertBefore(glow, bar.firstChild);
      decorateHeroTitle(bar);
      return;
    }

    var first = document.querySelector(".bt-content .bt_bb_wrapper > .bt_bb_section:first-child") ||
      // policy / product pages put the banner straight inside the content wrapper
      document.querySelector(".bt-content-wrap > section.bt_bb_background_image:first-child, .bt-content-wrap > .bt-blog-header-content:first-child > section.bt_bb_background_image:first-child");
    if (!first) return;
    var bg = first.style.backgroundImage || "";
    if (!bg || bg === "none") {
      var computed = window.getComputedStyle(first).backgroundImage;
      if (computed && computed !== "none" && computed.indexOf("url(") === 0) bg = computed;
    }
    if (!bg || bg === "none") return;

    pageHero = first;
    first.classList.add("sm-page-hero");
    var media = document.createElement("div");
    media.className = "sm-hero-media";
    media.style.backgroundImage = bg;
    first.insertBefore(media, first.firstChild);
    first.style.backgroundImage = "none";

    var orbs = document.createElement("div");
    orbs.className = "sm-hero-orbs";
    orbs.setAttribute("aria-hidden", "true");
    orbs.innerHTML = "<span></span><span></span>";
    first.insertBefore(orbs, media.nextSibling);

    decorateHeroTitle(first);
    $all("p", first).forEach(function (p, i) {
      p.setAttribute("data-reveal", "");
      p.style.setProperty("--sm-delay", (250 + i * 90) + "ms");
    });
  })();

  /* ------------------------------------------------------------------
     Auto-reveal for legacy page sections (columns, cards, headings)
     ------------------------------------------------------------------ */
  (function tagLegacy() {
    if (body.classList.contains("sm-home")) return;
    var skip = ".carousel, .slick-slider, .modal, .owl-carousel, .swiper, .bt-site-footer, .sm-page-hero, table";
    var groups = [];
    $all(".bt-content .bt_bb_wrapper > .bt_bb_section").forEach(function (section) {
      if (section === pageHero) return;
      var cols = $all(".bt_bb_row > .bt_bb_column", section);
      var cards = $all(".row > [class*='col-']", section).filter(function (c) {
        return c.querySelector(".bt_bb_card_image, .card, img");
      });
      groups.push(cols, cards);
    });
    groups.forEach(function (list) {
      list.filter(function (el) { return !el.closest(skip); }).forEach(function (el, i) {
        if (el.querySelector(".sm-auto-reveal") || el.closest(".sm-auto-reveal")) return;
        el.classList.add("sm-auto-reveal");
        el.style.setProperty("--sm-delay", Math.min(i, 5) * 90 + "ms");
      });
    });
  })();

  /* ------------------------------------------------------------------
     Intersection observer: reveals + counters
     ------------------------------------------------------------------ */
  $all("[data-reveal='words']").forEach(function (el) { if (!reduceMotion) splitWords(el); });

  $all("[data-stagger]").forEach(function (group) {
    var step = parseInt(group.getAttribute("data-stagger"), 10) || 90;
    $all("[data-reveal]", group).forEach(function (el, i) {
      if (!el.style.getPropertyValue("--sm-delay")) el.style.setProperty("--sm-delay", i * step + "ms");
    });
  });

  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target)) return;
    var suffix = el.getAttribute("data-suffix") || "";
    var out = el.querySelector("span") || el;
    if (reduceMotion) { out.textContent = target + suffix; return; }
    var dur = 1800, start = null, done = false;
    function frame(t) {
      if (done) return;
      if (!start) start = t;
      var p = clamp((t - start) / dur, 0, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      out.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else done = true;
    }
    out.textContent = "0" + suffix;
    requestAnimationFrame(frame);
    // never leave a counter stuck part-way (e.g. rAF throttled in a background tab)
    setTimeout(function () { done = true; out.textContent = target + suffix; }, dur + 150);
  }

  var revealTargets = $all("[data-reveal], .sm-auto-reveal, [data-count], .bt_bb_animation_fade_in");

  if (!("IntersectionObserver" in window) || reduceMotion) {
    revealTargets.forEach(function (el) {
      el.classList.add("is-in");
      if (el.classList.contains("animate")) el.classList.add("animated");
      if (el.hasAttribute("data-count")) countUp(el);
    });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("is-in");
        if (el.classList.contains("animate")) el.classList.add("animated");
        if (el.hasAttribute("data-count")) countUp(el);
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    revealTargets.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------
     Parallax (scroll) — [data-sm-parallax] and inner-page hero media
     ------------------------------------------------------------------ */
  var parallaxEls = reduceMotion ? [] : $all("[data-sm-parallax]");
  var heroMedia = pageHero && !reduceMotion ? pageHero.querySelector(".sm-hero-media") : null;

  function parallax() {
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var speed = parseFloat(el.getAttribute("data-sm-parallax")) || 0.1;
      var center = r.top + r.height / 2 - vh / 2;
      el.style.translate = "0 " + (center * -speed).toFixed(1) + "px";
    });
    if (heroMedia) {
      var y = window.pageYOffset;
      if (y < vh * 1.2) heroMedia.style.setProperty("--sm-py", (y * 0.25).toFixed(1) + "px");
    }
  }

  /* ------------------------------------------------------------------
     Pointer effects (desktop only): hero spotlight + tilt, tile spotlight,
     magnetic buttons
     ------------------------------------------------------------------ */
  if (finePointer && !reduceMotion) {
    var hero = document.querySelector(".sm-hero");
    var tilt = document.querySelector("[data-tilt]");
    if (hero) {
      hero.addEventListener("mousemove", function (e) {
        var r = hero.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        hero.style.setProperty("--sm-mx", (x * 100).toFixed(1) + "%");
        hero.style.setProperty("--sm-my", (y * 100).toFixed(1) + "%");
        if (tilt) {
          tilt.style.transform = "perspective(1200px) rotateY(" + ((x - 0.5) * 7).toFixed(2) + "deg) rotateX(" + ((0.5 - y) * 6).toFixed(2) + "deg)";
        }
      });
      hero.addEventListener("mouseleave", function () {
        if (tilt) tilt.style.transform = "";
      });
      if (tilt) tilt.style.transition = "transform .8s cubic-bezier(.22,1,.36,1)";
    }

    $all(".sm-tile, .sm-offer__card, .bt_bb_card_image").forEach(function (tile) {
      tile.addEventListener("mousemove", function (e) {
        var r = tile.getBoundingClientRect();
        tile.style.setProperty("--sm-x", (e.clientX - r.left) + "px");
        tile.style.setProperty("--sm-y", (e.clientY - r.top) + "px");
      });
    });

    $all(".sm-btn, .sm-magnetic").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = "translate(" + (dx * 0.18).toFixed(1) + "px," + (dy * 0.28).toFixed(1) + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });
  }

  /* ------------------------------------------------------------------
     Soft page transitions for internal links
     ------------------------------------------------------------------ */
  if (!reduceMotion) {
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || a.target === "_blank" || a.hasAttribute("download") || a.hasAttribute("data-toggle")) return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || /^(mailto|tel|javascript):/i.test(href)) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/\.html?$|\/$/.test(url.pathname)) return;
      if (url.pathname === location.pathname && url.hash) return;
      e.preventDefault();
      body.classList.add("sm-leaving");
      setTimeout(function () { location.href = a.href; }, 220);
    });
    window.addEventListener("pageshow", function () { body.classList.remove("sm-leaving"); });
  }

  onScroll();
})();
