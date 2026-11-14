(() => {
  "use strict";
  const C = window.GATEHUB_CONFIG || {};
  const K = window.GH_CONTENT || {};
  const FX = window.FX;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const LET = "ABCDEFGH";
  const view = $("#view");
  const mainEl = $(".main");

  // ═══ Store ══════════════════════════════════════════════
  const KEY = "gatehub.v2";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const S = Object.assign({ att: {}, bm: {}, rev: {}, notes: {}, tests: [], studied: {}, log: {}, solved: {}, subjTime: {}, mocks: [], last: null }, load());
  let saveT = 0;
  const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }, 150); };

  // ═══ Data ═══════════════════════════════════════════════
  let BANK = null;
  const QBY = {}, TOPIC = {}, SUBJ = {}, CHAP = {};
  const tKey = (s, c, t) => `${s}~${c}~${t}`;

  async function loadBank() {
    const r = await fetch("data/bank.json");
    BANK = await r.json();
    for (const q of BANK.questions) QBY[q.id] = q;
    for (const s of BANK.subjects) {
      SUBJ[s.id] = s; s.ids = [];
      for (const c of s.chapters) {
        CHAP[s.id + "~" + c.id] = c; c.sid = s.id; c.ids = [];
        for (const t of c.topics) {
          t.sid = s.id; t.cid = c.id; t.key = tKey(s.id, c.id, t.id); t.chapter = c; t.subject = s;
          TOPIC[t.key] = t; c.ids.push(...t.q); s.ids.push(...t.q);
        }
      }
    }
  }

  // ═══ Stats ══════════════════════════════════════════════
  function stats(ids) {
    let c = 0, w = 0, seen = 0;
    for (const id of ids) {
      const a = S.att[id]; if (!a) continue;
      if (a.r === "c") c++; else if (a.r === "w") w++; else seen++;
    }
    const done = c + w;
    return { total: ids.length, c, w, seen, done, pct: ids.length ? (done / ids.length) * 100 : 0, acc: done ? (c / done) * 100 : null };
  }
  function streak() {
    let n = 0; const d = new Date();
    const active = (k) => (S.log[k] || 0) >= 1800 || (S.solved[k] || 0) >= 5;
    if (!active(dayKey(d))) d.setDate(d.getDate() - 1);
    while (active(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function record(id, r) {
    const prev = S.att[id];
    if (r === "s" && prev) return;
    if ((r === "c" || r === "w") && (!prev || prev.r === "s")) { const k = dayKey(); S.solved[k] = (S.solved[k] || 0) + 1; }
    S.att[id] = { r, t: Date.now(), n: ((prev && prev.n) || 0) + (r === "s" ? 0 : 1) };
    save();
  }
  // GATE is always held in February. Users only pick the year.
  // Known official start dates; otherwise the first Saturday of February.
  const GATE_KNOWN = { 2027: "2027-02-06T09:30:00" };   // IIT Madras: 6, 7, 13, 14, 20, 21 Feb 2027
  const firstSatOfFeb = (y) => { const d = new Date(y, 1, 1, 9, 30); d.setDate(1 + ((6 - d.getDay() + 7) % 7)); return d; };
  const gateDateFor = (y) => (GATE_KNOWN[y] ? new Date(GATE_KNOWN[y]) : firstSatOfFeb(y));
  const defaultYear = () => { const n = new Date(); return n.getMonth() >= 2 ? n.getFullYear() + 1 : n.getFullYear(); };
  const gateYear = () => S.gateYear || C.gateYear || defaultYear();
  let examDate = gateDateFor(gateYear());
  function setGateYear(y) { S.gateYear = y; examDate = gateDateFor(y); save(); setSideDays(); }
  function yearPicker(first) {
    const now = new Date(), start = now > gateDateFor(now.getFullYear()) ? now.getFullYear() + 1 : now.getFullYear();
    const years = [0, 1, 2, 3].map((i) => start + i);
    const wrap = document.createElement("div");
    wrap.className = "modal-wrap";
    wrap.innerHTML = `<div class="modal year-modal" role="dialog" aria-modal="true" aria-labelledby="yr-t">
      <p class="eyebrow">${first ? "Welcome to GateHub" : "Your exam"}</p>
      <h2 class="modal-title" id="yr-t">Which GATE are you writing?</h2>
      <p class="small" style="margin:0 0 16px">GATE is held every February. Pick your year and we'll count down to it.</p>
      <div class="year-grid">${years.map((y) => `<button class="year-btn ${S.gateYear === y ? "on" : ""}" data-y="${y}"><b>${y}</b><span>February ${y}</span></button>`).join("")}</div>
      <form class="year-other" id="yr-form" novalidate>
        <label for="yr-in" class="small">Another year</label>
        <input id="yr-in" type="number" inputmode="numeric" min="${start}" max="2100" step="1" placeholder="e.g. ${start + 5}" value="${S.gateYear && !years.includes(S.gateYear) ? S.gateYear : ""}">
        <button class="btn sm" type="submit">Set</button>
      </form>
      <div class="field-err" id="yr-err"></div>
      ${first ? `<button class="btn ghost sm" id="yr-skip" style="margin-top:6px">Decide later</button>` : ""}
    </div>`;
    document.body.append(wrap);
    const close = () => wrap.remove();
    const choose = (y) => { setGateYear(y); close(); route(); FX.toast(`<b>Counting down to GATE ${y}.</b> Change it any time from the home page.`); };
    wrap.addEventListener("click", (e) => {
      const b = e.target.closest("[data-y]");
      if (b) choose(+b.dataset.y);
      else if (e.target === wrap || e.target.id === "yr-skip") { if (first) { S.gateYear = S.gateYear || defaultYear(); save(); } close(); }
    });
    wrap.querySelector("#yr-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = wrap.querySelector("#yr-in").value.trim(), y = +v;
      const err = wrap.querySelector("#yr-err");
      if (!/^\d{4}$/.test(v)) { err.textContent = "Type a four-digit year, like 2031."; return; }
      if (y < start) { err.textContent = `GATE ${y} has already happened. Pick ${start} or later.`; return; }
      if (y > 2100) { err.textContent = "That's a little far ahead. Pick a year before 2100."; return; }
      choose(y);
    });
    wrap.querySelector("#yr-in").addEventListener("input", () => { wrap.querySelector("#yr-err").textContent = ""; });
  }

  // ═══ Rich text (HTML / Markdown + KaTeX) ════════════════
  function mdToHtml(src) {
    const store = [];
    const prot = String(src).replace(/\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$/g, (m) => { store.push(m); return `\u0000M${store.length - 1}\u0000`; });
    const h = window.marked ? marked.parse(prot, { breaks: true }) : esc(prot).replace(/\n/g, "<br>");
    return h.replace(/\u0000M(\d+)\u0000/g, (_, i) => esc(store[+i]));
  }
  function rich(src, fmt) {
    let h = fmt === "md" ? mdToHtml(src) : String(src ?? "");
    h = h.replace(/(src=["'])img\//g, "$1data/img/");
    return window.DOMPurify ? DOMPurify.sanitize(h) : h;
  }
  function typeset(el, withDollar) {
    if (!window.renderMathInElement || !el) return;
    const delimiters = [
      { left: "$$", right: "$$", display: true },
      { left: "\\[", right: "\\]", display: true },
      { left: "\\(", right: "\\)", display: false }
    ];
    if (withDollar) delimiters.push({ left: "$", right: "$", display: false });
    try { renderMathInElement(el, { delimiters, throwOnError: false, ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"] }); } catch {}
  }
  const plain = (src, fmt) => {
    const d = document.createElement("div");
    d.innerHTML = rich(src, fmt).replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<img[^>]*>/gi, " [figure — see screenshot] ");
    return d.textContent.replace(/\n{3,}/g, "\n\n").trim();
  };
  const strip = (h) => String(h).replace(/<[^>]+>/g, " ").replace(/\\[()[\]]/g, "").replace(/\s+/g, " ").trim();

  // ═══ Router ═════════════════════════════════════════════
  const routes = [
    [/^\/?$/, atrium, "atrium"],
    [/^\/curriculum$/, curriculum, "curriculum"],
    [/^\/s\/([\w-]+)$/, subject, "curriculum"],
    [/^\/browse$/, practice, "practice"],
    [/^\/papers$/, papers, "practice"],
    [/^\/lectures$/, lectures, "lectures"],
    [/^\/study$/, study, "study"],
    [/^\/library$/, library, "library"],
    [/^\/records$/, records, "records"],
    [/^\/about$/, about, ""]
  ];
  const extraRoutes = [];
  let cleanup = null;
  function route() {
    const raw = location.hash.replace(/^#/, "") || "/";
    const [path, qs] = raw.split("?");
    const params = new URLSearchParams(qs || "");
    for (const [re, fn, nav] of [...extraRoutes, ...routes]) {
      const m = path.match(re);
      if (m) {
        if (cleanup) { cleanup(); cleanup = null; }
        setNav(nav);
        const out = fn(m.slice(1).map(decodeURIComponent), params);
        if (typeof out === "function") cleanup = out;
        return;
      }
    }
    location.hash = "#/";
  }
  function paint(html, opts = {}) {
    view.innerHTML = html;
    view.classList.remove("enter"); void view.offsetWidth; view.classList.add("enter");
    [...view.children].forEach((ch, i) => ch.style.setProperty("--i", i));
    if (!opts.keepScroll) mainEl.scrollTop = 0;
    FX.reveal(view); FX.animateRings(view);
    $$("[data-count]", view).forEach((el) => FX.countUp(el, parseFloat(el.dataset.count), { dec: +(el.dataset.dec || 0), suffix: el.dataset.suffix || "" }));
  }
  function setNav(name) {
    const links = $$("#nav a");
    links.forEach((a) => a.classList.toggle("active", a.dataset.nav === name));
    const act = links.find((a) => a.dataset.nav === name), ind = $("#nav-indicator");
    if (act) { ind.style.opacity = 1; ind.style.transform = `translateY(${act.offsetTop}px)`; ind.style.height = act.offsetHeight + "px"; }
    else ind.style.opacity = 0;
  }

  // ═══ Shared bits ════════════════════════════════════════
  const ringPct = (p, size, label, sub) => FX.ring(p, { size, label, sub });
  const bar = (p) => `<div class="bar-line"><span data-w="${Math.max(0, Math.min(100, p)).toFixed(1)}"></span></div>`;
  const accPill = (acc) => acc == null ? `<span class="pill">—</span>` : `<span class="pill ${acc >= 70 ? "ok" : acc < 45 ? "bad" : "gold"}">${Math.round(acc)}%</span>`;
  const subjName = (sid) => (SUBJ[sid] ? SUBJ[sid].name : sid);
  const firstOpenIdx = (ids) => { const i = ids.findIndex((id) => !S.att[id] || S.att[id].r === "s"); return i < 0 ? 0 : i; };
  const runHref = (kind, arg, idx = 0) => `#/run/${kind}/${encodeURIComponent(arg)}/${idx}`;
  const topicHref = (t) => runHref("t", t.key, firstOpenIdx(t.q));
  function greeting() {
    const h = new Date().getHours();
    return h < 5 ? "Burning the midnight oil" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  }
  function countdownParts() {
    const diff = Math.max(0, examDate - new Date());
    return { d: Math.floor(diff / 864e5), h: Math.floor(diff / 36e5) % 24, m: Math.floor(diff / 6e4) % 60, s: Math.floor(diff / 1e3) % 60 };
  }
  function setSideDays() {
    $("#side-days").textContent = countdownParts().d;
    const l = $("#side-days-label"); if (l) l.textContent = `days to GATE ${gateYear()}`;
  }

  // ═══ HOME ═══════════════════════════════════════════════
  function atrium() {
    const all = stats(BANK.questions.map((q) => q.id));
    const today = dayKey();
    const hrs = (S.log[today] || 0) / 3600;
    const [qt, qa] = K.quotes[Math.floor(Date.now() / 864e5) % K.quotes.length];
    const name = C.name ? esc(C.name) : "Scholar";
    const cd = countdownParts();
    const examYear = examDate.getFullYear();

    const weak = Object.values(TOPIC).map((t) => ({ t, st: stats(t.q) })).filter((x) => x.st.done >= 3)
      .sort((a, b) => a.st.acc - b.st.acc).slice(0, 4);
    const pool = BANK.questions.filter((q) => q.y >= 2010 && !["se", "web"].includes(q.s) && (!S.att[q.id] || S.att[q.id].r === "s") && q.t !== "DESC");
    const seed = [...today].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const qod = pool.length ? pool[seed % pool.length] : null;
    const qodTopic = qod && TOPIC[tKey(qod.s, qod.c, qod.tp)];
    const last = S.last && S.last.href ? S.last : null;
    const nextTopic = (() => { for (const s of BANK.subjects) { if (["se", "web"].includes(s.id)) continue; const t = firstUnfinishedTopic(s); if (stats(t.q).done < t.q.length) return t; } return null; })();

    const subjRows = BANK.subjects.filter((s) => !["se", "web"].includes(s.id)).map((s) => {
      const st = stats(s.ids);
      return `<a class="subj-mini" href="#/s/${s.id}"><span class="nm">${esc(s.name)}</span><span class="pc">${st.done} / ${st.total}</span>${bar(st.pct)}</a>`;
    }).join("");

    paint(`
      <section class="banner">
        <h1 class="hidden">${name}, the gate awaits</h1>
        <div class="banner-in">
          <p class="eyebrow">${greeting()}, ${name}</p>
          <div class="cd-inline" aria-label="Countdown to GATE ${examYear}">
            <div><b id="cd-d">${cd.d}</b><small>days</small></div>
            <div><b id="cd-h">${pad(cd.h)}</b><small>hours</small></div>
            <div><b id="cd-m">${pad(cd.m)}</b><small>minutes</small></div>
            <div><b id="cd-s">${pad(cd.s)}</b><small>seconds</small></div>
          </div>
          <div class="cd-until">until GATE ${examYear} · February ${examYear}${GATE_KNOWN[examYear] ? "" : " (tentative)"} · <button class="link-btn cd-change" id="cd-change">change year</button></div>
        </div>
      </section>
      <blockquote class="home-quote">“${esc(qt)}”<cite>${esc(qa)}</cite></blockquote>
      <p class="home-help"><a href="#/guide">New here? See how GateHub works</a><span>·</span><a href="#/review">Leave a review</a></p>

      <section class="stats">
        <div><div class="v">${all.done}<small> / ${all.total}</small></div><div class="k">PYQs solved</div></div>
        <div><div class="v">${all.acc == null ? "—" : Math.round(all.acc) + "%"}</div><div class="k">Accuracy</div></div>
        <div><div class="v">${hrs.toFixed(1)}<small> h</small></div><div class="k">Studied today · ${S.solved[today] || 0} PYQs</div></div>
        <div><div class="v">${streak()}<small> days</small></div><div class="k">Streak</div></div>
      </section>

      ${last ? `<section class="continue"><div class="ct"><span class="small">Continue where you left off</span><b>${esc(last.label)}</b></div><a class="btn primary" href="${last.href}">Resume</a></section>`
        : nextTopic ? `<section class="continue"><div class="ct"><span class="small">Suggested start · ${esc(nextTopic.subject.name)}</span><b>${esc(nextTopic.name)}</b></div><a class="btn primary" href="${topicHref(nextTopic)}">Start practising</a></section>` : ""}

      <section class="grid g2">
        <div class="panel">
          <h2 class="sec">Subjects</h2>
          ${subjRows}
        </div>
        <div style="display:flex;flex-direction:column;gap:20px">
          <div class="panel">
            <h2 class="sec">Question of the day</h2>
            ${qod ? `<div class="small" style="margin-bottom:6px">${esc(qod.p)} · ${esc(subjName(qod.s))}${qodTopic ? " › " + esc(qodTopic.name) : ""}</div>
              <div class="serif" style="font-size:1.02rem;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:14px">${esc(strip(qod.q)).slice(0, 380)}</div>
              <a class="btn" href="#/run/f/qod/0" data-qod="${qod.id}">Solve it</a>` : `<p class="small">Every question is solved. Remarkable.</p>`}
          </div>
          <div class="panel">
            <h2 class="sec">Weakest topics</h2>
            ${weak.length ? `<ul class="weak-list">${weak.map((x) => `<li><a href="${topicHref(x.t)}">${esc(x.t.name)}<br><span class="small">${esc(x.t.subject.short)}</span></a>${accPill(x.st.acc)}</li>`).join("")}</ul>`
              : `<p class="small" style="margin:0">Solve a few PYQs and the topics that need more work will show up here.</p>`}
          </div>
        </div>
      </section>
      <section class="panel install-card" id="install-card">
        <div class="ic-head"><div><h2 class="sec flat" style="margin:0">Install GateHub</h2>
          <p class="small" style="margin:4px 0 0">Get GateHub on your phone or laptop like an app: its own icon, its own window, works offline.</p></div>
          <button class="btn primary hidden" id="install-btn">Install now</button></div>
        <div class="ic-grid">
          <div class="ic"><b>Android</b><span>In <b>Chrome</b>, tap <b>⋮</b> → <b>Add to Home screen</b> → <b>Install</b>.</span></div>
          <div class="ic"><b>iPhone / iPad</b><span>In <b>Safari</b>, tap <b>Share</b> (□↑) → <b>Add to Home Screen</b> → <b>Add</b>.</span></div>
          <div class="ic"><b>Laptop</b><span>In <b>Chrome</b> or <b>Edge</b>, click the <b>install icon</b> at the right of the address bar → <b>Install</b>.</span></div>
        </div>
      </section>`);

    const ib = $("#install-btn", view);
    if (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone) $("#install-card", view).classList.add("hidden");
    else if (installPrompt && ib) { ib.classList.remove("hidden"); ib.addEventListener("click", async () => { installPrompt.prompt(); const r = await installPrompt.userChoice.catch(() => ({})); if (r.outcome === "accepted") $("#install-card", view).classList.add("hidden"); installPrompt = null; }); }

    const qodBtn = $("[data-qod]", view);
    if (qodBtn) qodBtn.addEventListener("click", () => { try { sessionStorage.setItem("gh.list.qod", JSON.stringify({ ids: [qodBtn.dataset.qod], label: "Question of the day", back: "#/" })); } catch {} });

    const chg = $("#cd-change", view); if (chg) chg.addEventListener("click", () => yearPicker(false));
    const tick = setInterval(() => {
      const p = countdownParts();
      for (const [k, v] of [["d", p.d], ["h", pad(p.h)], ["m", pad(p.m)], ["s", pad(p.s)]]) {
        const el = $("#cd-" + k, view);
        if (el && el.textContent !== String(v)) el.textContent = v;
      }
    }, 1000);
    return () => clearInterval(tick);
  }

  // ═══ CURRICULUM ═════════════════════════════════════════
  function curriculum() {
    const cards = BANK.subjects.map((s) => {
      const st = stats(s.ids);
      const topics = s.chapters.reduce((a, c) => a + c.topics.length, 0);
      const studied = s.chapters.reduce((a, c) => a + c.topics.filter((t) => S.studied[t.key]).length, 0);
      const old = ["se", "web"].includes(s.id);
      return `<a class="panel subject-card" href="#/s/${s.id}">
        <div class="sc-top"><span class="sc-num">${K.numerals[s.id] || ""}${old ? " · OLD SYLLABUS" : ""}</span><span class="sc-glyph">${K.glyphs[s.id] || "§"}</span></div>
        <div class="sc-name">${esc(s.name.replace(" (old syllabus)", ""))}</div>
        <div class="sc-meta">${s.chapters.length} chapters · ${topics} topics · ${s.count} PYQs</div>
        <div class="sc-foot">
          <div class="row small"><span>${st.done} solved</span><span class="spacer"></span><span>${studied}/${topics} topics studied</span></div>
          ${bar(st.pct)}
        </div></a>`;
    }).join("");
    paint(`
      <header class="page-head"><p class="eyebrow">The Curriculum</p><h1 class="title">Fifteen disciplines. One gate.</h1>
      <p class="lede">Every subject is divided into chapters and topics. Each topic holds its previous-year questions, and each subject links to the best courses from MIT, Stanford and Harvard.</p></header>
      <div class="rule"><span></span>❦<span></span></div>
      <div class="subjects">${cards}</div>`);
  }

  // ═══ SUBJECT ════════════════════════════════════════════
  function subject([sid]) {
    const s = SUBJ[sid]; if (!s) { location.hash = "#/curriculum"; return; }
    const st = stats(s.ids);
    const lect = (K.lectures[sid] || []);
    const books = (K.books[sid] || []);
    const chapters = s.chapters.map((c, ci) => {
      const cs = stats(c.ids);
      const rows = c.topics.map((t) => {
        const ts = stats(t.q);
        return `<div class="topic-row ${S.studied[t.key] ? "done" : ""}">
          <input type="checkbox" class="check" data-study="${t.key}" ${S.studied[t.key] ? "checked" : ""} title="Mark topic as studied">
          <div class="tn">${esc(t.name)}<small>${t.q.length} PYQs · ${ts.done} solved${ts.seen ? ` · ${ts.seen} viewed` : ""}</small></div>
          <div class="bar-wrap">${bar(ts.pct)}</div>
          <div class="acc">${accPill(ts.acc)}</div>
          <a class="btn sm" href="${topicHref(t)}">Practice ▸</a>
        </div>`;
      }).join("");
      return `<section class="panel chapter ${ci === 0 ? "open" : ""}">
        <div class="ch-head" data-toggle><span class="chev">❯</span><h3>${esc(c.name)}</h3>
          <span class="small">${c.topics.length} topics · ${cs.done}/${cs.total} solved</span>${accPill(cs.acc)}</div>
        <div class="ch-body"><div>${rows}</div></div>
      </section>`;
    }).join("");

    paint(`
      <div class="crumbs"><a href="#/curriculum">Curriculum</a> › ${esc(s.name)}</div>
      <header class="page-head" style="display:flex;gap:28px;align-items:center;flex-wrap:wrap">
        <div style="flex:1;min-width:280px">
          <p class="eyebrow">${K.numerals[sid] || ""} · ${s.chapters.length} chapters · ${s.count} PYQs</p>
          <h1 class="title">${esc(s.name)}</h1>
          <p class="lede">Study each topic, then attack its previous-year questions. Tick a topic once you've covered the theory.</p>
          <div class="row" style="margin-top:14px">
            <a class="btn gold" href="${runHref("t", firstUnfinishedTopic(s).key, firstOpenIdx(firstUnfinishedTopic(s).q))}">Practice next topic</a>
            <a class="btn" href="#/practice?s=${sid}">Practise by topic</a>
          </div>
        </div>
        ${ringPct(st.pct, 150, st.pct.toFixed(0) + "%", `${st.done}/${st.total} SOLVED`)}
      </header>
      <div class="rule"><span></span>❦<span></span></div>
      <h2 class="sec">Chapters &amp; Topics</h2>
      ${chapters}
      ${lect.length ? `<h2 class="sec" style="margin-top:30px">Lectures to watch</h2>${watchList(sid)}` : ""}
      ${books.length ? `<h2 class="sec" style="margin-top:30px">Canonical Texts</h2><div class="panel"><ul class="books">${books.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div>` : ""}
    `);

    view.addEventListener("click", onSubjectClick);
    view.addEventListener("change", onStudy);
    return () => { view.removeEventListener("click", onSubjectClick); view.removeEventListener("change", onStudy); };
  }
  function firstUnfinishedTopic(s) {
    for (const c of s.chapters) for (const t of c.topics) if (stats(t.q).done < t.q.length) return t;
    return s.chapters[0].topics[0];
  }
  function onSubjectClick(e) {
    const h = e.target.closest("[data-toggle]");
    if (h) h.parentElement.classList.toggle("open");
  }
  function onStudy(e) {
    const cb = e.target.closest("[data-study]"); if (!cb) return;
    if (cb.checked) S.studied[cb.dataset.study] = 1; else delete S.studied[cb.dataset.study];
    cb.closest(".topic-row").classList.toggle("done", cb.checked);
    save();
    if (cb.checked) { const r = cb.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + r.height / 2, 14); }
  }
  function watchList(sid) {
    const list = (K.lectures[sid] || []).filter((l) => l.watch && l.watch.length);
    if (!list.length) return "";
    const seal = (l) => ({ MIT: "MIT", Stanford: "S", Harvard: "H", Berkeley: "B", CMU: "CMU", IISc: "IISc" }[l.inst] || (l.inst.startsWith("IIT") ? "IIT" : l.inst.slice(0, 2).toUpperCase()));
    const label = (l, w) => (l.unit === "#" ? "#" + w : l.unit === "Section" ? "Sections " + w : `${l.unit}${/[–,+ ]|to/.test(w) ? (l.unit === "Lec" ? "" : "s") : ""} ${w}`);
    const block = (l) => `<div class="fc">
        <div class="fc-top"><span class="fc-seal">${esc(seal(l))}</span><div>
          <a class="fc-title" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.inst)} ${esc(l.code)} · ${esc(l.title)} <span aria-hidden="true">↗</span></a>
          <div class="small">${l.prof ? esc(l.prof) + " · " : ""}${l.vids ? l.vids + " videos" : "video lectures"}${l.official ? "" : " · re-upload"}</div></div></div>
        <ul class="fc-watch">${l.watch.map((w) => `<li><b>${esc(label(l, w[0]))}</b><span>${esc(w[1])}</span></li>`).join("")}</ul>
      </div>`;
    const primary = list.filter((l) => l.role !== "gap"), gaps = list.filter((l) => l.role === "gap");
    return `<div class="flow">
      <div class="flow-step"><div class="fs-head"><span class="fs-n">1</span><span class="fs-label">Start here</span></div>${primary.map(block).join("")}</div>
      ${gaps.length ? `<div class="flow-step gap"><div class="fs-head"><span class="fs-n">2</span><span class="fs-label">Then fill the gaps with NPTEL <span class="small">· only the GATE topics step 1 doesn't cover</span></span></div>${gaps.map(block).join("")}</div>`
        : `<div class="flow-done">✓ Step 1 covers the complete GATE syllabus for this subject.</div>`}
      ${K.gateNotes && K.gateNotes[sid] ? `<p class="small flow-note">${esc(K.gateNotes[sid])}</p>` : ""}
    </div>`;
  }
  function lectCard(l) {
    const seal = { MIT: "MIT", Stanford: "S", Harvard: "H", Berkeley: "B", CMU: "CMU", Wisconsin: "W", UMass: "U", "ETH Zürich": "ETH", "Hebrew U.": "HU", "3Blue1Brown": "3B", "IIT Madras": "IIT", "IIT Kharagpur": "IIT", IISc: "IISc" }[l.inst] || l.inst.slice(0, 2).toUpperCase();
    return `<a class="panel lect-card" href="${esc(l.url)}" target="_blank" rel="noopener">
      <div class="lect-inst"><span class="seal">${esc(seal)}</span>${esc(l.inst)} · ${esc(l.code)}<span class="role ${l.role === "core" ? "core" : ""}">${l.role === "core" ? "Core" : "Extra depth"}</span></div>
      <div class="lect-title">${esc(l.title)}</div>
      ${l.prof ? `<div class="lect-prof">${esc(l.prof)}</div>` : ""}
      <div class="lect-note">${esc(l.note || "")}</div>
      <div class="lect-vid"><span class="play">▶</span>${l.vids ? l.vids + " video lectures" : "Video lectures"} · ${esc(l.chan || "")}<span class="pill ${l.official ? "ok" : ""}" style="margin-left:auto">${l.official ? "Official" : "Re-upload"}</span></div></a>`;
  }

  // ═══ PRACTICE (browser) ═════════════════════════════════
  function practice(_, params) {
    const sel = { s: params.get("s") || "", c: params.get("c") || "", t: params.get("t") || "" };
    const f = Object.assign({ q: "", type: "all", status: "all", from: 1987, to: 2026, oldSyl: false }, (() => { try { return JSON.parse(sessionStorage.getItem("gh.filters")) || {}; } catch { return {}; } })());

    let scopeLabel = "All subjects", scopeIds = BANK.questions.map((q) => q.id);
    if (sel.s && SUBJ[sel.s]) {
      const s = SUBJ[sel.s]; scopeLabel = s.name; scopeIds = s.ids;
      const c = sel.c && CHAP[sel.s + "~" + sel.c];
      if (c) { scopeLabel += " › " + c.name; scopeIds = c.ids;
        const t = sel.t && TOPIC[tKey(sel.s, sel.c, sel.t)];
        if (t) { scopeLabel += " › " + t.name; scopeIds = t.q; } }
    }

    paint(`
      <div class="crumbs"><a href="#/practice">PYQ Practice</a> › Search all questions</div>
      <header class="page-head"><h1 class="title">Search all questions</h1>
      <p class="lede">Filter every previous-year question by type, status and year${sel.s ? ` in <b>${esc(scopeLabel)}</b> · <a href="#/browse">show all subjects</a>` : ""}.</p></header>
      <div class="rule"><span></span>❦<span></span></div>
      <div class="browse">
          <div class="filters">
            <input type="search" id="f-q" placeholder="Search question text…" value="${esc(f.q)}">
            <div class="seg" id="f-type">${["all", "MCQ", "MSQ", "NAT", "other"].map((v) => `<button data-v="${v}" class="${f.type === v ? "on" : ""}">${v === "all" ? "All types" : v}</button>`).join("")}</div>
          </div>
          <div class="filters">
            <div class="seg" id="f-status">${[["all", "All"], ["new", "Unsolved"], ["w", "Wrong"], ["c", "Correct"], ["bm", "★"]].map(([v, l]) => `<button data-v="${v}" class="${f.status === v ? "on" : ""}">${l}</button>`).join("")}</div>
            <span class="small">Years</span>
            <select id="f-from">${years().map((y) => `<option ${y === f.from ? "selected" : ""}>${y}</option>`).join("")}</select>
            <span class="small">to</span>
            <select id="f-to">${years().map((y) => `<option ${y === f.to ? "selected" : ""}>${y}</option>`).join("")}</select>
            <span class="spacer"></span>
            <button class="btn gold sm" id="f-start">Practise these ▸</button>
          </div>
          <div class="small" id="f-count" style="margin-bottom:10px"></div>
          <div class="qlist" id="qlist"></div>
      </div>`);

    let shown = 80, filtered = [];
    const apply = () => {
      try { sessionStorage.setItem("gh.filters", JSON.stringify(f)); } catch {}
      const needle = f.q.trim().toLowerCase();
      filtered = scopeIds.map((id) => QBY[id]).filter((q) => {
        if (q.y < f.from || q.y > f.to) return false;
        if (f.type !== "all") { if (f.type === "other" ? ["MCQ", "MSQ", "NAT"].includes(q.t) : q.t !== f.type) return false; }
        const a = S.att[q.id];
        if (f.status === "new" && a && a.r !== "s") return false;
        if (f.status === "w" && (!a || a.r !== "w")) return false;
        if (f.status === "c" && (!a || a.r !== "c")) return false;
        if (f.status === "bm" && !S.bm[q.id]) return false;
        if (needle) { q._txt = q._txt || strip(q.q).toLowerCase(); if (!q._txt.includes(needle)) return false; }
        return true;
      });
      $("#f-count").textContent = `${filtered.length} question${filtered.length === 1 ? "" : "s"}`;
      const listEl = $("#qlist");
      if (!filtered.length) { listEl.innerHTML = `<div class="empty">No questions match these filters.</div>`; return; }
      listEl.innerHTML = filtered.slice(0, shown).map((q, i) => {
        const a = S.att[q.id], t = TOPIC[tKey(q.s, q.c, q.tp)];
        return `<a class="qitem" href="#/run/f/list/${i}" data-i="${i}"><span class="dot ${a ? a.r : ""}"></span>
          <div><div class="qt">${esc(strip(q.q)).slice(0, 260) || "(figure-based question)"}</div>
          <div class="qm">${esc(q.p)}${q.n ? " · Q" + esc(q.n) : ""} · ${esc(SUBJ[q.s].short)}${t ? " › " + esc(t.name) : ""}</div></div>
          <div class="qr">${S.bm[q.id] ? '<span class="pill gold">★</span>' : ""}<span class="pill">${q.t}</span><span class="pill">${q.m} m</span></div></a>`;
      }).join("") + (filtered.length > shown ? `<button class="btn" id="more" style="align-self:center;margin-top:8px">Show more (${filtered.length - shown} left)</button>` : "");
    };
    const storeList = () => { try { sessionStorage.setItem("gh.list.list", JSON.stringify({ ids: filtered.map((q) => q.id), label: scopeLabel, back: location.hash })); } catch {} };

    const onClick = (e) => {
      const seg = e.target.closest(".seg button");
      if (seg) { const g = seg.parentElement.id === "f-type" ? "type" : "status"; f[g] = seg.dataset.v; $$("button", seg.parentElement).forEach((b) => b.classList.toggle("on", b === seg)); shown = 80; apply(); return; }
      if (e.target.closest("#more")) { shown += 120; apply(); return; }
      if (e.target.closest(".qitem")) { storeList(); return; }
      if (e.target.closest("#f-start")) { if (!filtered.length) return; storeList(); const i = filtered.findIndex((q) => !S.att[q.id] || S.att[q.id].r === "s"); location.hash = `#/run/f/list/${Math.max(0, i)}`; }
    };
    let qT = 0;
    const onInput = (e) => {
      if (e.target.id === "f-q") { clearTimeout(qT); qT = setTimeout(() => { f.q = e.target.value; shown = 80; apply(); }, 200); }
      if (e.target.id === "f-from") { f.from = +e.target.value; apply(); }
      if (e.target.id === "f-to") { f.to = +e.target.value; apply(); }
    };
    view.addEventListener("click", onClick); view.addEventListener("input", onInput);
    apply();
    return () => { view.removeEventListener("click", onClick); view.removeEventListener("input", onInput); };
  }
  const years = () => { const out = []; for (let y = 1987; y <= 2026; y++) out.push(y); return out; };

  // ═══ PAPERS ═════════════════════════════════════════════
  function papers() {
    const byYear = {};
    for (const p of BANK.papers) (byYear[p.year] = byYear[p.year] || []).push(p);
    const ids = (pid) => BANK.questions.filter((q) => q.p === pid).map((q) => q.id);
    const yrs = Object.keys(byYear).sort((a, b) => b - a);
    paint(`
      <div class="crumbs"><a href="#/practice">PYQ Practice</a> › Papers</div>
      <header class="page-head"><p class="eyebrow">The Archive</p><h1 class="title">Full Papers by Year</h1>
      <p class="lede">Solve an entire GATE paper in order, exactly as it was set.</p></header>
      <div class="rule"><span></span>❦<span></span></div>
      <div class="grid g3">${yrs.map((y) => `<div class="panel"><h2 class="sec">${y}</h2>${byYear[y].map((p) => {
        const st = stats(ids(p.id));
        return `<a class="subj-mini" href="${runHref("p", p.id, 0)}"><span class="nm">${esc(p.id.replace("GATE ", ""))}</span><span class="pc">${st.done}/${p.count}</span>${bar(st.pct)}</a>`;
      }).join("")}</div>`).join("")}</div>`);
  }

  // ═══ RUNNER ═════════════════════════════════════════════
  function resolveList(kind, arg) {
    if (kind === "t") { const t = TOPIC[arg]; if (!t) return null; return { ids: t.q, label: t.name, sub: `${t.subject.name} › ${t.chapter.name}`, back: `#/s/${t.sid}`, backLabel: t.subject.name }; }
    if (kind === "p") { const ids = BANK.questions.filter((q) => q.p === arg).sort((a, b) => (parseFloat(a.n) || 0) - (parseFloat(b.n) || 0)).map((q) => q.id); return { ids, label: arg, sub: "Full paper", back: "#/papers", backLabel: "Papers" }; }
    if (kind === "b") return { ids: Object.keys(S.bm).filter((id) => QBY[id]), label: "Bookmarked", sub: "Your starred questions", back: "#/practice", backLabel: "PYQ Practice" };
    if (kind === "r") return { ids: [...new Set([...Object.keys(S.notes), ...Object.keys(S.rev)])].filter((id) => QBY[id]), label: "Remembered", sub: "Questions with your notes", back: "#/notebook", backLabel: "Notebook" };
    if (kind === "w") return { ids: Object.entries(S.att).filter(([id, a]) => a.r === "w" && QBY[id]).map(([id]) => id), label: "Got wrong", sub: "Questions to retry", back: "#/practice", backLabel: "PYQ Practice" };
    if (kind === "f") { try { const raw = sessionStorage.getItem("gh.list." + arg); const l = raw ? JSON.parse(raw) : (S.lists && S.lists[arg]); if (l) return { ids: l.ids.filter((id) => QBY[id]), label: l.label, sub: l.sub || "Selected questions", back: l.back || "#/practice", backLabel: "Back" }; } catch {} return null; }
    return null;
  }

  function answerText(q) {
    const a = q.a || {};
    if (a.mta) return "Marks to all";
    if (a.opts) {
      const parts = a.opts.map((i) => q.t === "TF" ? (q.o && q.o[i] ? strip(q.o[i]) : LET[i]) : `(${LET[i]})`);
      return parts.join(q.t === "MSQ" ? ", " : " or ");
    }
    if (a.lo != null) {
      const r = (lo, hi) => (lo === hi ? `${lo}` : `${lo} to ${hi}`);
      return [r(a.lo, a.hi), ...((a.alt || []).map(([lo, hi]) => r(lo, hi)))].join("  or  ");
    }
    if (a.text) return a.text;
    return "—";
  }
  function grade(q, sel, nat) {
    const a = q.a || {};
    if (a.mta) return true;
    if (a.opts) {
      if (q.t === "MSQ") return sel.size === a.opts.length && a.opts.every((i) => sel.has(i));
      return sel.size === 1 && a.opts.includes([...sel][0]);
    }
    if (a.lo != null) {
      const v = parseFloat(nat); if (isNaN(v)) return null;
      const ranges = [[a.lo, a.hi], ...(a.alt || [])];
      return ranges.some(([lo, hi]) => v >= Math.min(lo, hi) - 1e-9 && v <= Math.max(lo, hi) + 1e-9);
    }
    return null;
  }

  // ═══ Ask Claude: screenshot → clipboard, open a new chat ═
  let fontCSS = null;
  async function shot(node) {
    if (!window.htmlToImage) throw new Error("html-to-image unavailable");
    if (fontCSS === null) { try { fontCSS = await htmlToImage.getFontEmbedCSS(node); } catch { fontCSS = ""; } }
    return htmlToImage.toBlob(node, {
      pixelRatio: 2, backgroundColor: "#22100a", fontEmbedCSS: fontCSS || undefined, cacheBust: false,
      filter: (n) => !(n.classList && n.classList.contains("no-shot"))
    });
  }
  function claudePrompt(q, t, withKey, extra) {
    const opts = Array.isArray(q.o) && q.o.length ? "\n\nOptions:\n" + q.o.map((o, i) => `(${LET[i]}) ${plain(o, q.of || q.qf)}`).join("\n") : "";
    const where = `${subjName(q.s)} › ${CHAP[q.s + "~" + q.c] ? CHAP[q.s + "~" + q.c].name : q.c}${t ? " › " + t.name : ""}`;
    const key = (withKey ? `\n\nAnswer key: ${answerText(q)}` : "") + (extra ? `\n${extra}` : "");
    const ask = withKey
      ? "Please explain the underlying concept, solve it step by step, show why each wrong option fails, and give me a quick trick for similar GATE questions."
      : "Don't give the final answer straight away — first give me a hint about the concept, then the full step-by-step solution, and a quick trick for similar GATE questions.";
    let body = plain(q.q, q.qf);
    if (body.length > 3500) body = body.slice(0, 3500) + " …";
    return `I'm preparing for GATE CSE and I don't understand this previous-year question. I've pasted a screenshot of it too.\n\nSource: ${q.p}${q.n ? ", Q" + q.n : ""} (${q.m} mark${q.m === 1 ? "" : "s"}, ${q.t})\nTopic: ${where}\n\nQuestion:\n${body}${opts}${key}\n\n${ask}`;
  }
  function askClaude(q, t, withKey, cardEl, extra) {
    const url = "https://claude.ai/new?q=" + encodeURIComponent(claudePrompt(q, t, withKey, extra));
    const card = cardEl || $("#q-card");
    let copied = false;
    const go = () => {
      const w = window.open(url, "_blank", "noopener");
      if (copied) FX.toast("<b>Screenshot copied.</b> Press <b>Ctrl + V</b> in the Claude chat to attach it — the question text is already typed in.", 7000);
      else FX.toast("Opened Claude with the full question text.", 5000);
      if (w === null) FX.toast(`Pop-up blocked — <a href="${url}" target="_blank" rel="noopener">open Claude</a>`, 9000);
    };
    if (!card || !navigator.clipboard || !window.ClipboardItem) { go(); return; }
    FX.toast("Capturing the question…", 1500);
    try {
      const item = new ClipboardItem({ "image/png": shot(card) });
      navigator.clipboard.write([item]).then(() => { copied = true; go(); }, () => go());
    } catch { go(); }
  }

  // ═══ LECTURE HALL ═══════════════════════════════════════
  function lectures() {
    paint(`
      <header class="page-head"><p class="eyebrow">The Lecture Hall</p><h1 class="title">Learn from the Best</h1>
      <p class="lede">For each subject: start with the MIT, Stanford or Harvard course, then use NPTEL only for the GATE topics it doesn't cover. Exact lecture numbers are given for both.</p></header>
      <div class="rule"><span></span>❦<span></span></div>
      ${BANK.subjects.filter((s) => (K.lectures[s.id] || []).length).map((s) => `
        <section style="margin-bottom:30px">
          <h2 class="sec"><a href="#/s/${s.id}" style="text-decoration:none;color:inherit">${K.numerals[s.id]} · ${esc(s.name)}</a></h2>
          ${watchList(s.id)}
          ${(K.books[s.id] || []).length ? `<div class="small" style="margin-top:10px">Canonical texts: ${K.books[s.id].map(esc).join(" · ")}</div>` : ""}
        </section>`).join("")}`);
  }

  // ═══ STUDY HALL (timer persists across pages) ═══════════
  const T = { mode: "focus", remaining: (C.focusMinutes || 50) * 60, running: false, last: 0, subject: "algo", id: 0 };
  function chime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * 0.16;
        o.frequency.value = f; o.type = "sine";
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
        o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.9);
      });
    } catch {}
  }
  function timerTick() {
    const now = Date.now(), dt = (now - T.last) / 1000; T.last = now;
    T.remaining -= dt;
    if (T.mode === "focus") {
      const k = dayKey(); S.log[k] = (S.log[k] || 0) + dt;
      S.subjTime[T.subject] = (S.subjTime[T.subject] || 0) + dt; save();
    }
    if (T.remaining <= 0) {
      chime();
      FX.toast(T.mode === "focus" ? "<b>Focus session complete.</b> Take a recess." : "<b>Recess over.</b> Back to the desk.", 6000);
      T.mode = T.mode === "focus" ? "break" : "focus";
      T.remaining = (T.mode === "focus" ? (C.focusMinutes || 50) : (C.breakMinutes || 10)) * 60;
    }
    paintTimer();
  }
  function paintTimer() {
    const s = Math.max(0, Math.ceil(T.remaining)), txt = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
    document.title = T.running ? `${txt} · GateHub` : "GateHub";
    const wrap = $("#timer-wrap"); if (!wrap) return;
    wrap.classList.toggle("running", T.running); wrap.classList.toggle("break", T.mode === "break");
    $("#t-txt").textContent = txt;
    $("#t-mode").textContent = T.mode === "focus" ? "FOCUS" : "RECESS";
    $("#t-go").textContent = T.running ? "Pause" : "Begin";
    const total = (T.mode === "focus" ? (C.focusMinutes || 50) : (C.breakMinutes || 10)) * 60;
    const bar = $("#timer-wrap .bar"); const Cc = parseFloat(bar.getAttribute("stroke-dasharray"));
    bar.style.transition = "stroke-dashoffset 1s linear";
    bar.style.strokeDashoffset = Cc * (1 - T.remaining / total);
    const k = dayKey(), hrs = (S.log[k] || 0) / 3600;
    $("#t-today").textContent = hrs.toFixed(1);
    $("#t-goal").textContent = Math.min(100, Math.round((hrs / (C.dailyGoalHours || 6)) * 100)) + "%";
  }
  function study() {
    const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
    const maxH = Math.max(1, ...days.map((d) => (S.log[dayKey(d)] || 0) / 3600));
    const total = Object.values(S.log).reduce((a, b) => a + b, 0) / 3600;
    const bySubj = BANK.subjects.filter((s) => S.subjTime[s.id]).map((s) => ({ s, h: S.subjTime[s.id] / 3600 })).sort((a, b) => b.h - a.h);
    paint(`
      <header class="page-head"><p class="eyebrow">The Study Hall</p><h1 class="title">Deep Work</h1>
      <p class="lede">${C.focusMinutes || 50}-minute focus sessions with ${C.breakMinutes || 10}-minute recesses. The timer keeps running while you move around the app.</p></header>
      <div class="rule"><span></span>❦<span></span></div>
      <div class="grid g2">
        <div class="panel" id="timer-wrap">
          <div class="ring big-ring"><svg viewBox="0 0 100 100"><defs><linearGradient id="ringGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e0ad"/><stop offset="1" stop-color="#b9773a"/></linearGradient></defs>
            <circle class="track" cx="50" cy="50" r="46" fill="none" stroke-width="4"/>
            <circle class="bar" cx="50" cy="50" r="46" fill="none" stroke-width="4" stroke-dasharray="${2 * Math.PI * 46}" stroke-dashoffset="0"/></svg>
            <div class="lbl"><div><b id="t-txt" class="mono">50:00</b><small id="t-mode">FOCUS</small></div></div></div>
          <div class="row"><button class="btn gold" id="t-go">Begin</button><button class="btn" id="t-reset">Reset</button><button class="btn" id="t-skip">Skip</button></div>
          <label class="row small">Studying <select id="t-subj">${BANK.subjects.filter((s) => !["se", "web"].includes(s.id)).map((s) => `<option value="${s.id}" ${s.id === T.subject ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></label>
          <div class="grid g3" style="width:100%;text-align:center">
            <div class="stat"><span class="v" id="t-today">0.0</span><span class="k">hours today</span></div>
            <div class="stat"><span class="v" id="t-goal">0%</span><span class="k">of ${C.dailyGoalHours || 6} h goal</span></div>
            <div class="stat"><span class="v">${streak()}</span><span class="k">day streak</span></div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:20px">
          <div class="panel"><h2 class="sec">This Week</h2>
            <div class="week">${days.map((d) => { const h = (S.log[dayKey(d)] || 0) / 3600; return `<div class="col"><span class="h">${h.toFixed(1)}</span><div class="colbar" data-h="${(h / maxH) * 100}"></div><small>${d.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase()}</small></div>`; }).join("")}</div>
            <div class="small" style="margin-top:10px">Total logged: ${total.toFixed(1)} hours</div></div>
          <div class="panel"><h2 class="sec">Time by Subject</h2>
            ${bySubj.length ? bySubj.map((x) => `<div class="subj-mini"><span class="nm">${esc(x.s.name)}</span><span class="pc">${x.h.toFixed(1)} h</span>${bar((x.h / bySubj[0].h) * 100)}</div>`).join("") : `<p class="small">Start a focus session to begin logging.</p>`}</div>
        </div>
      </div>`);
    requestAnimationFrame(() => requestAnimationFrame(() => $$(".colbar", view).forEach((b) => (b.style.height = b.dataset.h + "%"))));
    paintTimer();
    const onClick = (e) => {
      const id = e.target.closest("button") && e.target.closest("button").id;
      if (id === "t-go") {
        if (T.running) { clearInterval(T.id); T.running = false; }
        else { T.last = Date.now(); T.id = setInterval(timerTick, 1000); T.running = true; }
        paintTimer();
      } else if (id === "t-reset") { clearInterval(T.id); T.running = false; T.mode = "focus"; T.remaining = (C.focusMinutes || 50) * 60; paintTimer(); }
      else if (id === "t-skip") { T.mode = T.mode === "focus" ? "break" : "focus"; T.remaining = (T.mode === "focus" ? (C.focusMinutes || 50) : (C.breakMinutes || 10)) * 60; paintTimer(); }
    };
    const onChange = (e) => { if (e.target.id === "t-subj") T.subject = e.target.value; };
    view.addEventListener("click", onClick); view.addEventListener("change", onChange);
    return () => { view.removeEventListener("click", onClick); view.removeEventListener("change", onChange); };
  }

  // ═══ LIBRARY ════════════════════════════════════════════
  function library() {
    const pw = (C.links || []).find((l) => l.key === "pw"), cl = (C.links || []).find((l) => l.key === "claude");
    const others = (C.links || []).filter((l) => !["pw", "claude"].includes(l.key));
    paint(`
      <header class="page-head"><p class="eyebrow">The Library</p><h1 class="title">Your Accounts &amp; Tools</h1>
      <p class="lede">Links open in your normal Chrome window, so you stay signed in to GATE Wallah and Claude. Sign in once and Chrome remembers you.</p></header>
      <div class="rule"><span></span>❦<span></span></div>
      <div class="grid g2" style="margin-bottom:20px">
        ${pw ? `<div class="panel"><div class="acct"><span class="seal">PW</span><div style="flex:1"><h3>GATE Wallah</h3><div class="small">Your batches, lectures and DPPs</div></div><a class="btn gold" href="${esc(pw.url)}" target="_blank" rel="noopener">Open ↗</a></div></div>` : ""}
        ${cl ? `<div class="panel"><div class="acct"><span class="seal" style="background:var(--claude)">✦</span><div style="flex:1"><h3>Claude</h3><div class="small">Your tutor for doubts and derivations</div></div><a class="btn gold" href="${esc(cl.url)}" target="_blank" rel="noopener">Open ↗</a></div></div>` : ""}
      </div>
      <div class="panel ask" style="margin-bottom:20px">
        <h2 class="sec">Ask Claude a Doubt</h2>
        <textarea id="ask-txt" placeholder="e.g. Why is every LL(1) grammar also LALR(1)? Give a counter-example for the converse."></textarea>
        <div class="row" style="margin-top:10px"><span class="small">Opens a new chat in Claude with your question already typed. On any PYQ, use ✦ Ask Claude to send the question with a screenshot.</span><span class="spacer"></span><button class="btn claude" id="ask-go">✦ Ask Claude</button></div>
      </div>
      <div class="panel"><h2 class="sec">More Resources</h2>
        <div class="launch">${others.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener"><b>${esc(l.title)}</b><span>${esc(l.sub || "")}</span></a>`).join("")}</div></div>`);
    const go = () => {
      const v = $("#ask-txt").value.trim();
      window.open("https://claude.ai/new" + (v ? "?q=" + encodeURIComponent("I'm preparing for GATE CSE. " + v) : ""), "_blank", "noopener");
      $("#ask-txt").value = "";
    };
    const onClick = (e) => { if (e.target.closest("#ask-go")) go(); };
    const onKey = (e) => { if (e.target.id === "ask-txt" && e.key === "Enter" && (e.ctrlKey || e.metaKey)) go(); };
    view.addEventListener("click", onClick); view.addEventListener("keydown", onKey);
    return () => { view.removeEventListener("click", onClick); view.removeEventListener("keydown", onKey); };
  }

  // ═══ RECORDS ════════════════════════════════════════════
  function records() {
    const subjRows = BANK.subjects.map((s) => { const st = stats(s.ids); return `<div class="subj-mini"><span class="nm">${esc(s.name)}</span><span class="pc">${st.done}/${st.total} · ${st.acc == null ? "—" : Math.round(st.acc) + "%"}</span>${bar(st.pct)}</div>`; }).join("");
    paint(`
      <header class="page-head"><p class="eyebrow">The Records</p><h1 class="title">Examinations &amp; Progress</h1>
      <p class="lede">Log your mock test scores and back up your progress. Everything is stored on this laptop.</p></header>
      <div class="rule"><span></span>❦<span></span></div>
      <div class="grid g2">
        <div class="panel">
          <h2 class="sec">Mock Tests</h2>
          <form id="mock-form" class="row"><input id="m-name" placeholder="Test name (e.g. PW Full Mock 3)" required style="flex:1"><input id="m-score" type="number" step="0.01" min="-33" max="100" placeholder="Marks /100" required style="width:130px"><button class="btn gold sm">Record</button></form>
          <svg class="chart" id="m-chart" viewBox="0 0 300 100" preserveAspectRatio="none"></svg>
          <ul class="mock-list" id="m-list"></ul>
        </div>
        <div class="panel"><h2 class="sec">By Subject</h2>${subjRows}</div>
        <div class="panel span-all">
          <h2 class="sec">Backup</h2>
          <div class="row"><button class="btn" id="exp">Export progress</button><label class="btn" style="cursor:pointer">Import progress<input type="file" id="imp" accept="application/json" hidden></label><span class="spacer"></span><button class="btn ghost sm" id="replay">Replay gate intro</button></div>
        </div>
      </div>`);
    const paintMocks = () => {
      const list = $("#m-list"), svg = $("#m-chart");
      list.innerHTML = S.mocks.length ? S.mocks.slice().reverse().map((m, ri) => { const i = S.mocks.length - 1 - ri; return `<li><span>${esc(m.name)} <span class="small">· ${esc(m.date)}</span></span><span><span class="mono" style="color:var(--accent)">${m.score.toFixed(2)}</span> <button data-del="${i}" title="Remove">✕</button></span></li>`; }).join("") : `<li class="small">No mock tests recorded yet.</li>`;
      if (!S.mocks.length) { svg.innerHTML = ""; return; }
      const pts = S.mocks.map((m) => m.score), W = 300, H = 100, p = 8;
      const min = Math.min(0, ...pts), max = Math.max(100, ...pts);
      const x = (i) => pts.length === 1 ? W / 2 : p + (i * (W - 2 * p)) / (pts.length - 1);
      const y = (v) => H - p - ((v - min) / (max - min)) * (H - 2 * p);
      const line = pts.map((v, i) => `${x(i)},${y(v)}`).join(" ");
      svg.innerHTML = `<defs><linearGradient id="mfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".18"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
        ${[25, 50, 75].map((g) => `<line x1="0" x2="${W}" y1="${y(g)}" y2="${y(g)}" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="2 4" vector-effect="non-scaling-stroke"/>`).join("")}
        ${pts.length > 1 ? `<polygon points="${x(0)},${H} ${line} ${x(pts.length - 1)},${H}" fill="url(#mfill)"/>` : ""}
        <polyline points="${line}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/>
        ${pts.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="2.6" fill="currentColor"/>`).join("")}`;
    };
    paintMocks();
    const onSubmit = (e) => {
      if (e.target.id !== "mock-form") return; e.preventDefault();
      const name = $("#m-name").value.trim(), score = parseFloat($("#m-score").value);
      if (!name || isNaN(score)) return;
      S.mocks.push({ name, score, date: new Date().toLocaleDateString(undefined, { day: "numeric", month: "short" }) }); save(); paintMocks(); e.target.reset();
    };
    const onClick = (e) => {
      const d = e.target.closest("[data-del]"); if (d) { S.mocks.splice(+d.dataset.del, 1); save(); paintMocks(); return; }
      if (e.target.closest("#exp")) {
        const blob = new Blob([JSON.stringify(S, null, 1)], { type: "application/json" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `gatehub-progress-${dayKey()}.json`; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }
      if (e.target.closest("#replay")) { try { sessionStorage.removeItem("gh.intro"); } catch {} location.reload(); }
    };
    const onChange = async (e) => {
      if (e.target.id !== "imp" || !e.target.files[0]) return;
      try { const data = JSON.parse(await e.target.files[0].text()); Object.assign(S, data); save(); FX.toast("<b>Progress imported.</b>"); route(); }
      catch { FX.toast("That file isn't a GateHub backup."); }
    };
    view.addEventListener("submit", onSubmit); view.addEventListener("click", onClick); view.addEventListener("change", onChange);
    return () => { view.removeEventListener("submit", onSubmit); view.removeEventListener("click", onClick); view.removeEventListener("change", onChange); };
  }

  // ═══ ABOUT / TECH GATES ═════════════════════════════════
  const FOUNDERS = [
    { name: "Pranav V Rao", role: "Co-founder & CEO", photo: "assets/team/pranav.jpg", gh: "pranavvrao1-ai",
      lines: ["AI & ML student", "Cyclist", "Interested in military and defence technology"] },
    { name: "Abhay Samuel H", role: "Co-founder & CTO", photo: "assets/team/abhay.jpg", gh: "Samuel777822",
      lines: ["Computer Science student at BMS College of Engineering, Bengaluru", "Trains in mixed martial arts (MMA)"] }
  ];
  function about() {
    paint(`
      <header class="about-hero">
        <img class="about-lockup only-light" src="assets/techgates-lockup-ink.svg" alt="Tech Gates">
        <img class="about-lockup only-dark" src="assets/techgates-lockup-gold.svg" alt="Tech Gates">
        <p class="eyebrow" style="margin-top:18px">About us</p>
        <h1 class="title">Built by students, for every GATE aspirant.</h1>
      </header>
      <div class="rule"><span></span>❦<span></span></div>

      <section class="about-why">
        <h2 class="sec">Why we built GateHub</h2>
        <p>Preparing for GATE is scattered. Previous-year questions sit in one PDF, their solutions on a forum, the best lectures across a dozen playlists, and your progress lives only in your head. We wanted one calm place that brings all of it together.</p>
        <p>So we built GateHub: every GATE CSE previous-year question sorted by subject, chapter and topic with a worked answer; the best university lectures mapped to the GATE syllabus lecture by lecture; timed tests that feel like the real exam; and honest analysis of where your time and marks go.</p>
        <p>It's free, it works on your phone and your laptop, and your progress stays on your own device.</p>
      </section>

      <div class="row" style="margin-top:10px"><a class="btn primary" href="#/review">Leave a review</a><a class="btn" href="#/guide">How GateHub works</a></div>
      <h2 class="sec" style="margin-top:34px">The founders</h2>
      <div class="founders">
        ${FOUNDERS.map((f) => `<article class="founder panel">
          <img class="founder-photo" src="${f.photo}" alt="${esc(f.name)}" loading="lazy">
          <div class="founder-body">
            <div class="founder-role">${esc(f.role)}</div>
            <h3 class="founder-name">${esc(f.name)}</h3>
            <ul class="founder-lines">${f.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
            <a class="btn sm" href="https://github.com/${f.gh}" target="_blank" rel="noopener">GitHub · ${esc(f.gh)}</a>
          </div>
        </article>`).join("")}
      </div>

      <div class="grid g2" style="margin-top:34px">
        <div class="panel"><h2 class="sec">Inside GateHub</h2>
          <ul class="books"><li>${BANK.questions.length.toLocaleString()} GATE CSE previous-year questions (1987–2026), each with its answer and a worked explanation</li>
          <li>${BANK.subjects.length} subjects, ${Object.keys(CHAP).length} chapters, ${Object.keys(TOPIC).length} topics</li>
          <li>A lecture plan for every subject: MIT, Stanford and Harvard first, NPTEL for the remaining GATE topics</li>
          <li>Timed GATE-style tests, practice sessions with analysis, and a notebook for the ideas you want to keep</li></ul></div>
        <div class="panel"><h2 class="sec">Credits</h2>
          <p class="small" style="font-size:.95rem">Questions, answers and explanations come from the open <a href="https://github.com/cherie-dips/GATE-CS" target="_blank" rel="noopener">GATE CSE Question Bank</a> by cherie-dips on GitHub, which draws on ExamSIDE and the GATE Overflow book. GATE question papers are published by the IITs and IISc. Lecture videos belong to their universities and creators. Maths rendering by KaTeX.</p></div>
      </div>`);
  }

  // ═══ Internal API for feature modules (tests, notebook) ═══
  window.GH = {
    S, save, QBY, TOPIC, SUBJ, CHAP, tKey, esc, pad, dayKey, $, $$, LET,
    get BANK() { return BANK; }, view,
    stats, record, rich, typeset, plain, strip, answerText, grade, askClaude,
    paint, bar, accPill, ringPct, subjName, runHref, get examDate() { return examDate; }, yearPicker,
    resolveList, firstOpenIdx, topicHref, firstUnfinishedTopic, fmtTopic: (q) => TOPIC[tKey(q.s, q.c, q.tp)],
    addRoute: (re, fn, nav) => extraRoutes.push([re, fn, nav]),
    rerender: () => route()
  };

  // ═══ Install prompt + phone menu ═════════════════════════
  let installPrompt = null;
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installPrompt = e; const b = $("#install-btn"); if (b) { b.classList.remove("hidden"); } });
  addEventListener("appinstalled", () => { installPrompt = null; const c = $("#install-card"); if (c) c.classList.add("hidden"); });
  function setupMenu() {
    const btn = $("#m-menu"), back = $("#m-backdrop");
    if (!btn) return;
    const set = (open) => { document.body.classList.toggle("menu-open", open); btn.setAttribute("aria-expanded", String(open)); btn.setAttribute("aria-label", open ? "Close menu" : "Open menu"); };
    btn.addEventListener("click", () => set(!document.body.classList.contains("menu-open")));
    back.addEventListener("click", () => set(false));
    $("#side").addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
    addEventListener("hashchange", () => set(false));
    addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
  }

  // ═══ Boot ═══════════════════════════════════════════════
  async function boot() {
    FX.intro(C.playIntro !== false);
    FX.theme();
    setupMenu();
    setSideDays(); setInterval(setSideDays, 60000);
    view.innerHTML = `<div class="loading"><img src="assets/emblem.svg" alt=""><div class="eyebrow">Opening the archive…</div></div>`;
    try { await loadBank(); }
    catch (e) { view.innerHTML = `<div class="panel empty">Couldn't load the question bank (${esc(e.message)}). Start GateHub with the launcher so it runs on localhost.</div>`; return; }
    addEventListener("hashchange", route);
    addEventListener("resize", () => setNav(($("#nav a.active") || {}).dataset ? $("#nav a.active").dataset.nav : ""));
    route();
    const sc = $(".side-count"); if (sc) { sc.style.cursor = "pointer"; sc.title = "Change your GATE year"; sc.addEventListener("click", () => yearPicker(false)); }
    if (!S.gateYear) setTimeout(() => yearPicker(true), document.body.classList.contains("intro-playing") ? 3300 : 400);
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  boot();
})();
