// GateHub effects — deliberately quiet: gate intro, gentle fade-in, progress rings, toasts.
(() => {
  "use strict";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FX = (window.FX = {});

  // ── Gate-opening intro (once per session) ──────────────
  FX.intro = function (play) {
    const el = document.getElementById("intro");
    let seen = false;
    try { seen = sessionStorage.getItem("gh.intro") === "1"; } catch {}
    if (!play || seen || reduce) { el.classList.add("gone"); return; }
    document.body.classList.add("intro-playing");
    const title = el.querySelector(".intro-title");
    "GATE HUB".split("").forEach((ch, i) => {
      const s = document.createElement("span");
      s.textContent = ch === " " ? " " : ch;
      s.style.animationDelay = 0.45 + i * 0.07 + "s";
      title.append(s);
    });
    let done = false;
    const open = () => {
      if (done) return; done = true;
      try { sessionStorage.setItem("gh.intro", "1"); } catch {}
      el.classList.add("open");
      document.body.classList.remove("intro-playing");
      setTimeout(() => el.classList.add("gone"), 1600);
    };
    el.addEventListener("click", open);
    setTimeout(open, 2800);
  };

  // ── Doors close, show a title, then open (end of a practice session) ──
  // Resolves while the doors are shut, so the caller can swap the page behind them.
  FX.doors = function (title, sub) {
    return new Promise((resolve) => {
      if (reduce) { resolve(); return; }
      const el = document.createElement("div");
      el.className = "intro doors-x open";
      el.setAttribute("aria-hidden", "true");
      el.innerHTML = `
        <div class="door door-l"><div class="door-panel"></div><div class="door-panel"></div></div>
        <div class="door door-r"><div class="door-panel"></div><div class="door-panel"></div></div>
        <div class="intro-center">
          <img class="intro-emblem" src="assets/emblem.svg" alt="">
          <div class="doors-title"></div>
          <div class="intro-rule" style="opacity:1;animation:none"><span></span><i>❦</i><span></span></div>
          <div class="intro-motto" style="opacity:1;animation:none"></div>
        </div>`;
      el.querySelector(".doors-title").textContent = title;
      el.querySelector(".intro-motto").textContent = sub || "";
      document.body.append(el);
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove("open")));   // swing shut
      setTimeout(resolve, 1500);                                                              // page changes behind closed doors
      setTimeout(() => el.classList.add("open"), 2500);                                       // swing open
      setTimeout(() => el.remove(), 4100);
    });
  };

  // No ambient effects any more — kept as no-ops so callers stay simple.
  FX.dust = FX.parallax = FX.interactions = FX.burst = function () {};

  FX.reveal = function () {};

  FX.countUp = function (el, to, { dec = 0, suffix = "" } = {}) {
    el.textContent = Number(to).toFixed(dec) + suffix;
  };

  // ── Progress ring ──────────────────────────────────────
  FX.ring = function (pct, { size = 120, stroke = 7, label = "", sub = "" } = {}) {
    const r = (100 - stroke) / 2, C = 2 * Math.PI * r;
    return `<div class="ring" style="--sz:${size}px" data-pct="${pct}">
      <svg viewBox="0 0 100 100">
      <circle class="track" cx="50" cy="50" r="${r}" fill="none" stroke-width="${stroke}"/>
      <circle class="bar" cx="50" cy="50" r="${r}" fill="none" stroke-width="${stroke}" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg>
      <div class="lbl"><div><b>${label}</b><small>${sub}</small></div></div></div>`;
  };
  FX.animateRings = function (root) {
    root.querySelectorAll(".ring[data-pct]").forEach((rg) => {
      const bar = rg.querySelector(".bar"); if (!bar) return;
      const C = parseFloat(bar.getAttribute("stroke-dasharray"));
      const pct = Math.max(0, Math.min(100, parseFloat(rg.dataset.pct) || 0));
      requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.strokeDashoffset = C * (1 - pct / 100); }));
    });
    root.querySelectorAll(".bar-line > span[data-w]").forEach((s) => {
      requestAnimationFrame(() => requestAnimationFrame(() => { s.style.width = s.dataset.w + "%"; }));
    });
  };

  // ── Toasts ─────────────────────────────────────────────
  FX.toast = function (html, ms = 4200) {
    const t = document.createElement("div");
    t.className = "toast"; t.innerHTML = html;
    document.getElementById("toasts").append(t);
    setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 350); }, ms);
    return t;
  };

  // ── Light / dark ───────────────────────────────────────
  FX.theme = function () {
    const paintBtn = () => {
      const dark = document.documentElement.dataset.theme === "dark";
      document.getElementById("theme-label").textContent = dark ? "Light mode" : "Dark mode";
      document.getElementById("theme-ic").textContent = dark ? "☀" : "☾";
      const m = document.getElementById("m-theme"); if (m) m.textContent = dark ? "☀" : "☾";
    };
    const toggle = () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("gh.theme", next); } catch {}
      paintBtn();
    };
    ["theme-btn", "m-theme"].forEach((id) => { const b = document.getElementById(id); if (b) b.addEventListener("click", toggle); });
    paintBtn();
  };
})();
