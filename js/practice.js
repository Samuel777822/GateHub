// GateHub — calm PYQ practice: topic chooser, focused question screen,
// practice sessions (time + results) and an end-of-session analysis.
(() => {
  "use strict";
  const GH = window.GH, FX = window.FX;
  if (!GH) return;
  const { S, save, QBY, TOPIC, SUBJ, CHAP, tKey, esc, pad, $, $$, LET } = GH;
  const DIFF = { e: "Easy", m: "Moderate", h: "Hard" };
  const mk = (q) => ((q.m || 1) >= 2 ? 2 : 1);
  const chapName = (q) => (CHAP[q.s + "~" + q.c] ? CHAP[q.s + "~" + q.c].name : q.c);
  const topicOf = (q) => TOPIC[tKey(q.s, q.c, q.tp)];
  const fmt = (s) => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return h ? `${h}:${pad(m)}:${pad(x)}` : `${pad(m)}:${pad(x)}`; };
  const human = (s) => { s = Math.round(s); if (s < 60) return `${s} s`; const m = Math.floor(s / 60), x = s % 60; if (m < 60) return x ? `${m} min ${x} s` : `${m} min`; return `${Math.floor(m / 60)} h ${m % 60} min`; };
  S.sessions = S.sessions || [];
  S.active = S.active || null;

  // ═══ Sessions ═══════════════════════════════════════════
  const sameList = (a, kind, arg) => a && a.kind === kind && a.arg === arg;
  function finishSession(sess) {
    sess.end = Date.now();
    const items = Object.entries(sess.items);
    const c = items.filter(([, x]) => x.r === "c").length, w = items.filter(([, x]) => x.r === "w").length;
    const seen = items.filter(([, x]) => x.r === "s").length;
    sess.sum = { c, w, seen, touched: items.length, time: sess.elapsed };
    S.sessions.unshift(sess);
    if (S.sessions.length > 200) S.sessions.length = 200;
    S.active = null; save();
    return sess;
  }
  function ensureSession(kind, arg, label, sub) {
    if (sameList(S.active, kind, arg)) return S.active;
    if (S.active && Object.keys(S.active.items).length) finishSession(S.active);
    S.active = { id: "s" + Date.now().toString(36), kind, arg, label, sub, start: Date.now(), elapsed: 0, items: {} };
    save();
    return S.active;
  }
  function endSession() {
    const sess = S.active;
    if (!sess) return;
    if (!Object.keys(sess.items).length) { S.active = null; save(); FX.toast("Session closed. You hadn't opened any questions yet."); location.hash = "#/practice"; return; }
    finishSession(sess);
    FX.doors("Session complete", `${sess.sum.c + sess.sum.w} answered · ${human(sess.elapsed)}`).then(() => { location.hash = `#/session/${sess.id}`; });
  }

  // ═══ Practice home (#/practice) ═════════════════════════
  function home(_, params) {
    const sid = params.get("s");
    const s = sid && SUBJ[sid];
    const nWrong = Object.values(S.att).filter((a) => a.r === "w").length;
    const act = S.active;
    const resume = act ? `<section class="continue"><div class="ct"><span class="small">Unfinished session · ${Object.keys(act.items).length} question${Object.keys(act.items).length === 1 ? "" : "s"} · ${human(act.elapsed)}</span><b>${esc(act.label)}</b></div>
        <button class="btn ghost sm" id="p-end">End session</button><a class="btn primary" href="${esc(act.href || "#/practice")}">Resume</a></section>` : "";

    let body;
    if (!s) {
      const subs = GH.BANK.subjects.filter((x) => !["se", "web"].includes(x.id));
      body = `
        <h2 class="sec flat calm-h">Choose a subject</h2>
        <div class="calm-grid">${subs.map((x) => { const st = GH.stats(x.ids); return `<a class="calm-card" href="#/practice?s=${x.id}"><span class="cc-name">${esc(x.name)}</span><span class="cc-meta">${x.count} questions · ${st.done} solved</span>${GH.bar(st.pct)}</a>`; }).join("")}</div>`;
    } else {
      body = `
        <div class="crumbs"><a href="#/practice">All subjects</a> › ${esc(s.name)}</div>
        <h2 class="sec flat calm-h">Choose a topic</h2>
        <p class="small" style="margin:-6px 0 16px">Tick several topics to practise them together in one session, or press Start on a single topic.</p>
        ${s.chapters.map((c) => `<section class="calm-chapter">
          <h3><span>${esc(c.name)}</span><button class="link-btn" data-pickall="${c.id}">Select all</button></h3>
          ${c.topics.map((t) => { const st = GH.stats(t.q); return `<div class="calm-topic picky">
            <input type="checkbox" class="check" data-pick="${t.key}" data-ch="${c.id}" aria-label="Select ${esc(t.name)}">
            <div class="ct-name">${esc(t.name)}<span>${t.q.length} questions${st.done ? ` · ${st.done} solved` : ""}${st.acc != null ? ` · ${Math.round(st.acc)}% correct` : ""}</span></div>
            <div class="ct-bar">${GH.bar(st.pct)}</div>
            <a class="btn sm ${st.done ? "" : "primary"}" href="${GH.topicHref(t)}">${st.done && st.done < t.q.length ? "Continue" : st.done >= t.q.length ? "Revise" : "Start"}</a></div>`; }).join("")}
        </section>`).join("")}`;
    }
    const recent = S.sessions.slice(0, 5);
    GH.paint(`
      <header class="page-head calm-head"><p class="eyebrow">PYQ Practice</p><h1 class="title">One topic at a time.</h1>
      <p class="lede">Pick a topic and work through its previous-year questions. When you're done, end the session to see your time and accuracy.</p></header>
      ${resume}
      ${body}
      <div class="calm-links">
        <a href="#/papers">Full papers by year</a>
        <a href="${GH.runHref("b", "all")}">Bookmarked · ${Object.keys(S.bm).length}</a>
        <a href="${GH.runHref("r", "all")}">Remembered · ${Object.keys(S.notes).length}</a>
        <a href="${GH.runHref("w", "all")}">Got wrong · ${nWrong}</a>
        <a href="#/browse${sid ? "?s=" + sid : ""}">Search all questions</a>
      </div>
      ${recent.length ? `<section class="section" style="margin-top:34px"><h2 class="sec">Recent sessions</h2>
        ${recent.map((x) => { const att = x.sum.c + x.sum.w; return `<a class="hist-row link" href="#/session/${x.id}"><div><b>${esc(x.label)}</b><div class="small">${new Date(x.end).toLocaleDateString(undefined, { day: "numeric", month: "short" })} · ${att} answered · ${human(x.elapsed)}</div></div><span class="score-pill">${att ? Math.round((x.sum.c / att) * 100) + "%" : "—"}</span></a>`; }).join("")}</section>` : ""}`);
    // multi-topic selection
    const picked = new Set();
    const pickBar = document.createElement("div");
    pickBar.className = "pick-bar hidden";
    pickBar.innerHTML = `<span id="pick-info"></span><span class="spacer"></span><button class="btn ghost sm" id="pick-clear">Clear</button><button class="btn primary" id="pick-start">Start session</button>`;
    if (s) GH.view.append(pickBar);
    const refreshBar = () => {
      const topics = [...picked].map((k) => TOPIC[k]).filter(Boolean);
      const n = topics.reduce((a, t) => a + t.q.length, 0);
      pickBar.classList.toggle("hidden", !topics.length);
      $("#pick-info", pickBar).innerHTML = `<b>${topics.length} topic${topics.length === 1 ? "" : "s"}</b> · ${n} questions`;
    };
    const startPicked = () => {
      const order = s.chapters.flatMap((c) => c.topics).filter((t) => picked.has(t.key));
      if (!order.length) return;
      const ids = order.flatMap((t) => t.q);
      const arg = "m" + Date.now().toString(36);
      const label = order.length === 1 ? order[0].name : `${order.length} topics · ${s.short || s.name}`;
      const list = { ids, label, sub: order.map((t) => t.name).join(", "), back: `#/practice?s=${s.id}` };
      S.lists = S.lists || {};
      S.lists[arg] = list;
      const keys = Object.keys(S.lists);
      if (keys.length > 30) S.lists = Object.fromEntries(keys.slice(-30).map((k) => [k, S.lists[k]]));
      save();
      try { sessionStorage.setItem("gh.list." + arg, JSON.stringify(list)); } catch {}
      location.hash = GH.runHref("f", arg, GH.firstOpenIdx(ids));
    };
    const setRow = (b, on) => { b.checked = on; if (on) picked.add(b.dataset.pick); else picked.delete(b.dataset.pick); b.closest(".calm-topic").classList.toggle("picked", on); };
    const onChange = (e) => {
      const cb = e.target.closest("[data-pick]"); if (!cb) return;
      setRow(cb, cb.checked); refreshBar();
    };
    const onClick = (e) => {
      if (e.target.closest("#p-end")) { endSession(); return; }
      const all = e.target.closest("[data-pickall]");
      if (all) {
        const boxes = $$(`[data-ch="${all.dataset.pickall}"]`, GH.view);
        const on = !boxes.every((b) => b.checked);
        boxes.forEach((b) => setRow(b, on));
        all.textContent = on ? "Clear" : "Select all";
        refreshBar(); return;
      }
      if (e.target.closest("#pick-clear")) { $$("[data-pick]", GH.view).forEach((b) => setRow(b, false)); $$("[data-pickall]", GH.view).forEach((b) => (b.textContent = "Select all")); refreshBar(); return; }
      if (e.target.closest("#pick-start")) startPicked();
    };
    GH.view.addEventListener("click", onClick);
    GH.view.addEventListener("change", onChange);
    return () => { GH.view.removeEventListener("click", onClick); GH.view.removeEventListener("change", onChange); pickBar.parentNode && pickBar.parentNode.removeChild(pickBar); };
  }

  // ═══ Focused question screen (#/run/kind/arg/idx) ═══════
  function run([kind, arg, idxStr]) {
    const L = GH.resolveList(kind, arg);
    if (!L || !L.ids.length) {
      GH.paint(`<div class="prac"><div class="crumbs"><a href="#/practice">PYQ Practice</a></div><div class="panel empty-state"><h3 class="serif">Nothing here yet</h3><p class="small">${kind === "b" ? "Star questions with ★ to collect them here." : kind === "r" ? "Press ✎ on any question to save a note; it will gather here." : kind === "w" ? "Questions you get wrong will gather here for another try." : "This list is empty."}</p><a class="btn primary" href="#/practice">Back to practice</a></div></div>`);
      return;
    }
    const idx = Math.min(Math.max(0, +idxStr), L.ids.length - 1);
    const q = QBY[L.ids[idx]], t = topicOf(q);
    const href = (i) => GH.runHref(kind, arg, i);
    const sess = ensureSession(kind, arg, L.label, L.sub);
    sess.href = href(idx);
    S.last = { href: href(idx), label: L.label }; save();
    const item = () => (sess.items[q.id] = sess.items[q.id] || { r: null, t: 0 });

    const hasOpts = Array.isArray(q.o) && q.o.length && q.a && (q.a.opts || q.a.mta);
    const isNat = q.a && q.a.lo != null;
    const selfGraded = !hasOpts && !isNat;
    const f = q.of || q.qf;
    const prior = S.att[q.id];
    const extras = [q.official ? "official key" : "", q.note ? "disputed answer" : "", q.oos ? "outside current syllabus" : ""].filter(Boolean);

    GH.paint(`
      <div class="prac">
        <div class="prac-top">
          <a class="back" href="${esc(L.back)}" title="${esc(L.sub || "")}">← ${esc(L.label)}</a>
          <span class="spacer"></span>
          <span class="sess-clock" title="Time in this session"><span class="small">Session</span> <b class="mono" id="s-clock">${fmt(sess.elapsed)}</b></span>
          <button class="btn sm" id="s-end">End session</button>
        </div>
        <div class="prac-progress">
          <div class="bar-line"><span style="width:${((idx + 1) / L.ids.length) * 100}%"></span></div>
          <div class="row small"><span>Question ${idx + 1} of ${L.ids.length}</span><span class="spacer"></span><button class="link-btn" id="grid-toggle">All questions ▾</button></div>
          <div class="qgrid hidden" id="qgrid">${L.ids.map((id, i) => { const a = S.att[id]; return `<a href="${href(i)}" class="${i === idx ? "cur" : a ? a.r : ""}">${i + 1}</a>`; }).join("")}</div>
        </div>

        <article class="panel q-card calm" id="q-card">
          <div class="q-meta">
            <span>${esc(q.p)}${q.n ? " · Q" + esc(q.n) : ""}</span><span>·</span><span>${q.m} mark${q.m === 1 ? "" : "s"}</span><span>·</span><span>${q.t}</span>
            ${extras.length ? `<span>·</span><span class="${q.note ? "warn" : ""}">${extras.join(", ")}</span>` : ""}
            <span class="spacer"></span>
            <span class="qtimer no-shot" id="qtimer" title="Time on this question">${fmt(item().t)}</span>
            <button class="icon-btn no-shot ${S.bm[q.id] ? "on" : ""}" id="bm" title="Bookmark (B)">★</button>
            <button class="icon-btn no-shot ${S.notes[q.id] ? "on" : ""}" id="rem" title="Remember this concept (R)">✎</button>
          </div>
          <div class="q-topic">${esc(GH.subjName(q.s))} › ${esc(chapName(q))}${t ? " › " + esc(t.name) : ""}</div>
          <div class="q-body" id="q-body">${GH.rich(q.q, q.qf)}</div>
          ${hasOpts ? `<div class="opts" id="opts">${q.o.map((o, i) => `<button class="opt" data-i="${i}"><span class="ol">${LET[i]}</span><span class="ob">${GH.rich(o, f)}</span></button>`).join("")}</div>${q.t === "MSQ" ? `<div class="small">Choose all correct options.</div>` : ""}` : ""}
          ${isNat ? `<div class="nat no-shot" id="nat"><input type="text" inputmode="decimal" id="nat-in" placeholder="Your answer" autocomplete="off"><span class="small">Numerical answer</span></div>` : ""}
          ${selfGraded ? `<div class="small" style="margin-top:14px">Work it out, then show the answer and mark yourself.</div>` : ""}
          <div class="q-actions no-shot">
            ${selfGraded ? "" : `<button class="btn primary" id="check">Check answer</button>`}
            <button class="btn" id="reveal">Show answer</button>
            <button class="btn ghost claude-ghost" id="ask" title="Copy a screenshot and open Claude (C)">✦ Ask Claude</button>
            <span id="verdict"></span>
          </div>
          <div class="q-ex no-shot" id="q-ex"><div><div class="ex-inner">
            <div class="ex-ans">ANSWER <b>${esc(GH.answerText(q))}</b>${q.official ? `<span class="small">official key: ${esc(q.official)}</span>` : ""}</div>
            <div class="ex-body" id="ex-body"></div>
            ${q.note ? `<div class="ex-note"><b>Reviewer's note:</b> <span id="ex-note"></span></div>` : ""}
            ${q.scan ? `<button class="btn sm scan-toggle" id="scan">View the original question scan</button><img class="scan-img hidden" id="scan-img" alt="Original scan" loading="lazy">` : ""}
            ${selfGraded ? `<div class="row" style="margin-top:16px"><span class="small">How did you do?</span><button class="btn sm" id="self-c">✓ I got it</button><button class="btn sm" id="self-w">✗ I missed it</button></div>` : ""}
          </div></div></div>
        </article>

        <div class="prac-nav">
          <a class="btn ghost sm" href="${idx > 0 ? href(idx - 1) : "#"}" ${idx > 0 ? "" : 'style="visibility:hidden"'}>← Previous</a>
          <span class="keys-hint">A–D choose · Enter check · ← → move · S answer · B bookmark · R remember · C Claude</span>
          ${idx < L.ids.length - 1 ? `<a class="btn sm" href="${href(idx + 1)}">Next →</a>` : `<button class="btn primary sm" id="s-end2">Finish session</button>`}
        </div>
      </div>`);

    GH.typeset($("#q-body"), q.qf === "md");
    if (hasOpts) GH.typeset($("#opts"), f === "md");

    const sel = new Set();
    let checked = false, revealed = false, exFilled = false, last = Date.now();
    const tick = setInterval(() => {
      const now = Date.now(), dt = (now - last) / 1000; last = now;
      if (document.hidden) return;
      sess.elapsed += dt; item().t += dt;
      const c = $("#s-clock"); if (c) c.textContent = fmt(sess.elapsed);
      const qt = $("#qtimer"); if (qt) qt.textContent = fmt(item().t);
    }, 1000);
    const saveT = setInterval(save, 5000);

    function fillEx() {
      if (exFilled) return; exFilled = true;
      const body = $("#ex-body");
      body.innerHTML = GH.rich(q.e || "No explanation available.", "md");
      GH.typeset(body, true);
      const n = $("#ex-note"); if (n) { n.innerHTML = GH.rich(q.note, "md"); GH.typeset(n, true); }
    }
    function markOptions() {
      if (!hasOpts) return;
      const right = new Set(q.a.opts || []);
      $$(".opt", GH.view).forEach((b) => {
        const i = +b.dataset.i;
        if (right.has(i) || q.a.mta) b.classList.add("right");
        if (checked && sel.has(i) && !right.has(i) && !q.a.mta) b.classList.add("wrong");
        b.disabled = true;
      });
    }
    function setResult(r) {
      GH.record(q.id, r);
      const it = item(); if (r !== "s" || !it.r) it.r = r;
      save();
      const g = $(`.qgrid a.cur`, GH.view); if (g) { g.classList.remove("c", "w", "s"); g.classList.add(r); }
    }
    function reveal() {
      if (revealed) return; revealed = true;
      fillEx(); $("#q-ex").classList.add("open"); markOptions();
      if (isNat) $("#nat-in").disabled = true;
      if (!checked && !selfGraded) setResult("s");
      const b = $("#reveal"); b.textContent = "Answer shown"; b.disabled = true;
      setTimeout(() => $("#q-ex").scrollIntoView({ behavior: "smooth", block: "nearest" }), 250);
    }
    function verdict(ok, extra = "") {
      $("#verdict").innerHTML = `<span class="verdict ${ok ? "ok" : "bad"}">${ok ? '<span class="tick">✓</span>Correct' : "✗ Not quite"}${extra}</span>`;
    }
    function check() {
      if (checked || selfGraded) return;
      const natVal = isNat ? $("#nat-in").value.trim() : "";
      if (hasOpts && !sel.size) { FX.toast("Choose an option first."); return; }
      if (isNat && natVal === "") { FX.toast("Type your answer first."); return; }
      const ok = GH.grade(q, sel, natVal);
      if (ok === null) { FX.toast("That doesn't look like a number."); return; }
      checked = true;
      setResult(ok ? "c" : "w");
      markOptions();
      if (isNat) { $("#nat").classList.add(ok ? "right" : "wrong"); $("#nat-in").disabled = true; }
      verdict(ok, ok ? "" : ` · answer ${esc(GH.answerText(q))}`);
      const b = $("#check"); b.textContent = "Checked"; b.disabled = true;
    }
    function selfGrade(ok) {
      setResult(ok ? "c" : "w"); verdict(ok);
      $("#self-c").disabled = $("#self-w").disabled = true;
    }
    function toggleBm(btn) { if (S.bm[q.id]) delete S.bm[q.id]; else S.bm[q.id] = 1; btn.classList.toggle("on", !!S.bm[q.id]); save(); }

    const onClick = (e) => {
      const opt = e.target.closest(".opt");
      if (opt && !opt.disabled) {
        const i = +opt.dataset.i;
        if (q.t === "MSQ") { sel.has(i) ? sel.delete(i) : sel.add(i); } else { sel.clear(); sel.add(i); }
        $$(".opt", GH.view).forEach((b) => b.classList.toggle("sel", sel.has(+b.dataset.i)));
        return;
      }
      const b = e.target.closest("button"); if (!b) return;
      if (b.id === "check") check();
      else if (b.id === "reveal") reveal();
      else if (b.id === "ask") GH.askClaude(q, t, revealed || checked);
      else if (b.id === "bm") toggleBm(b);
      else if (b.id === "rem") GH.remember(q, b);
      else if (b.id === "self-c") selfGrade(true);
      else if (b.id === "self-w") selfGrade(false);
      else if (b.id === "scan") { const im = $("#scan-img"); im.src = "data/" + q.scan; im.classList.toggle("hidden"); }
      else if (b.id === "grid-toggle") { const g = $("#qgrid"); g.classList.toggle("hidden"); b.textContent = g.classList.contains("hidden") ? "All questions ▾" : "Hide questions ▴"; }
      else if (b.id === "s-end" || b.id === "s-end2") endSession();
    };
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector(".modal-wrap")) return;
      const typing = e.target.matches && e.target.matches("input, textarea, select");
      if (typing) { if (e.key === "Enter" && e.target.id === "nat-in") { e.preventDefault(); check(); } return; }
      const k = e.key.toLowerCase();
      if (hasOpts && k.length === 1 && "abcd".includes(k)) { const b = $(`.opt[data-i="${"abcd".indexOf(k)}"]`, GH.view); if (b) b.click(); }
      else if (hasOpts && k.length === 1 && "1234".includes(k)) { const b = $(`.opt[data-i="${+k - 1}"]`, GH.view); if (b) b.click(); }
      else if (k === "enter") { if (!checked && !selfGraded) check(); else if (idx < L.ids.length - 1) location.hash = href(idx + 1); }
      else if (k === "arrowright" && idx < L.ids.length - 1) location.hash = href(idx + 1);
      else if (k === "arrowleft" && idx > 0) location.hash = href(idx - 1);
      else if (k === "s") reveal();
      else if (k === "b") $("#bm").click();
      else if (k === "r") $("#rem").click();
      else if (k === "c") $("#ask").click();
    };
    GH.view.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    if (prior && (prior.r === "c" || prior.r === "w")) $("#verdict").innerHTML = `<span class="small">Earlier: ${prior.r === "c" ? "solved correctly" : "answered wrong"} on ${new Date(prior.t).toLocaleDateString()}</span>`;
    return () => { clearInterval(tick); clearInterval(saveT); save(); GH.view.removeEventListener("click", onClick); document.removeEventListener("keydown", onKey); };
  }

  // ═══ Session analysis (#/session/:id) ═══════════════════
  function summary([id]) {
    const x = S.sessions.find((s) => s.id === id);
    if (!x) { location.hash = "#/practice"; return; }
    const rows = Object.entries(x.items).map(([qid, it]) => ({ q: QBY[qid], ...it })).filter((r) => r.q);
    const answered = rows.filter((r) => r.r === "c" || r.r === "w");
    const c = rows.filter((r) => r.r === "c").length, w = rows.filter((r) => r.r === "w").length, seen = rows.filter((r) => r.r === "s").length, skipped = rows.filter((r) => !r.r).length;
    const acc = answered.length ? (c / answered.length) * 100 : null;
    const avg = answered.length ? answered.reduce((a, r) => a + r.t, 0) / answered.length : 0;
    const pace1 = 90, pace2 = 210; // rough GATE pace: ~1.5 min per 1-mark, ~3.5 min per 2-mark question
    const avg1 = answered.filter((r) => mk(r.q) === 1), avg2 = answered.filter((r) => mk(r.q) === 2);
    const mean = (arr) => (arr.length ? arr.reduce((a, r) => a + r.t, 0) / arr.length : null);
    const byDiff = ["e", "m", "h"].map((d) => { const a = answered.filter((r) => r.q.d === d); return { name: DIFF[d], n: a.length, c: a.filter((r) => r.r === "c").length }; }).filter((g) => g.n);
    const byTopic = new Map();
    for (const r of rows) { const t = topicOf(r.q); const k = t ? t.name : chapName(r.q); if (!byTopic.has(k)) byTopic.set(k, { n: 0, c: 0, w: 0, t: 0 }); const g = byTopic.get(k); g.n++; if (r.r === "c") g.c++; if (r.r === "w") g.w++; g.t += r.t; }
    const slow = answered.slice().sort((a, b) => b.t - a.t).slice(0, 3);
    const wrongIds = rows.filter((r) => r.r === "w").map((r) => r.q.id);

    const insights = [];
    if (acc != null) insights.push(acc >= 80 ? `Excellent accuracy: ${Math.round(acc)}%. Try a timed test on this topic next.` : acc >= 55 ? `${Math.round(acc)}% accuracy. Go through the ${w} wrong answer${w === 1 ? "" : "s"} below and save the key idea with ✎ Remember.` : `${Math.round(acc)}% accuracy. Revisit the theory for this topic (the Lectures page has the best videos), then retry the wrong ones.`);
    const m1 = mean(avg1), m2 = mean(avg2);
    if (m1 != null) insights.push(`1-mark questions took you ${human(m1)} on average${m1 > pace1 * 1.2 ? `, slower than the ~${human(pace1)} GATE pace` : ", which is within GATE pace"}.`);
    if (m2 != null) insights.push(`2-mark questions took you ${human(m2)} on average${m2 > pace2 * 1.2 ? `, slower than the ~${human(pace2)} GATE pace` : ", which is within GATE pace"}.`);
    if (seen) insights.push(`You looked at the answer without attempting ${seen} question${seen === 1 ? "" : "s"}. Try those again tomorrow without peeking.`);

    GH.paint(`
      <div class="prac">
        <div class="crumbs"><a href="#/practice">PYQ Practice</a> › Session</div>
        <header class="page-head calm-head"><p class="eyebrow">Session complete · ${new Date(x.end).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
          <h1 class="title">${esc(x.label)}</h1>${x.sub ? `<p class="lede">${esc(x.sub)}</p>` : ""}</header>
        <section class="stats">
          <div><div class="v">${answered.length}<small> answered</small></div><div class="k">${rows.length} question${rows.length === 1 ? "" : "s"} opened</div></div>
          <div><div class="v">${acc == null ? "—" : Math.round(acc) + "%"}</div><div class="k">${c} correct · ${w} wrong</div></div>
          <div><div class="v">${human(x.elapsed)}</div><div class="k">Total time</div></div>
          <div><div class="v">${answered.length ? human(avg) : "—"}</div><div class="k">Average per question</div></div>
        </section>
        <section class="panel section">
          <h2 class="sec">Analysis</h2>
          <ul class="insights">${insights.map((s) => `<li>${s}</li>`).join("") || "<li>Answer a few questions next time to get an analysis.</li>"}</ul>
          ${byDiff.length ? `<div class="grid g2" style="margin-top:16px">
            <div><h3 class="sub-h">By difficulty</h3>${byDiff.map((g) => `<div class="subj-mini"><span class="nm">${g.name}</span><span class="pc">${g.c} / ${g.n} correct</span>${GH.bar((g.c / g.n) * 100)}</div>`).join("")}</div>
            <div><h3 class="sub-h">Slowest questions</h3>${slow.map((r) => `<div class="subj-mini"><span class="nm">${esc(r.q.p)}${r.q.n ? " · Q" + esc(r.q.n) : ""}</span><span class="pc">${human(r.t)}</span></div>`).join("")}</div>
          </div>` : ""}
          ${byTopic.size > 1 ? `<h3 class="sub-h" style="margin-top:18px">By topic</h3><div class="table-wrap"><table class="tbl"><thead><tr><th>Topic</th><th>Opened</th><th>Correct</th><th>Wrong</th><th>Time</th></tr></thead><tbody>${[...byTopic.entries()].map(([k, g]) => `<tr><td>${esc(k)}</td><td>${g.n}</td><td class="ok-t">${g.c}</td><td class="bad-t">${g.w}</td><td>${human(g.t)}</td></tr>`).join("")}</tbody></table></div>` : ""}
        </section>
        <section class="panel section">
          <h2 class="sec">Questions</h2>
          <div class="table-wrap"><table class="tbl qtbl"><thead><tr><th>#</th><th>Question</th><th>Result</th><th>Time</th><th></th></tr></thead><tbody>
            ${rows.map((r, i) => `<tr class="r-${r.r === "c" ? "c" : r.r === "w" ? "w" : "u"}"><td>${i + 1}</td><td><div class="clip">${esc(GH.strip(r.q.q)).slice(0, 140) || "(figure-based question)"}</div><div class="small">${esc(r.q.p)} · ${DIFF[r.q.d] || ""}</div></td>
              <td>${r.r === "c" ? '<span class="ok-t">Correct</span>' : r.r === "w" ? '<span class="bad-t">Wrong</span>' : r.r === "s" ? "Viewed answer" : "Skipped"}</td><td>${human(r.t)}</td>
              <td><button class="btn ghost sm" data-open="${r.q.id}">Open</button></td></tr>`).join("")}
          </tbody></table></div>
          <div class="row" style="margin-top:16px">
            ${wrongIds.length ? `<button class="btn primary" id="retry">Retry the ${wrongIds.length} wrong one${wrongIds.length === 1 ? "" : "s"}</button>` : ""}
            <a class="btn" href="#/practice">Back to practice</a>
            ${skipped ? `<span class="small">${skipped} opened but not answered.</span>` : ""}
          </div>
        </section>
      </div>`);
    const onClick = (e) => {
      const o = e.target.closest("[data-open]");
      if (o) { try { sessionStorage.setItem("gh.list.one", JSON.stringify({ ids: [o.dataset.open], label: "Review question", back: `#/session/${id}` })); } catch {} location.hash = GH.runHref("f", "one", 0); return; }
      if (e.target.closest("#retry")) { try { sessionStorage.setItem("gh.list.retry", JSON.stringify({ ids: wrongIds, label: `Retry · ${x.label}`, back: `#/session/${id}` })); } catch {} location.hash = GH.runHref("f", "retry", 0); }
    };
    GH.view.addEventListener("click", onClick);
    return () => GH.view.removeEventListener("click", onClick);
  }

  GH.addRoute(/^\/practice$/, home, "practice");
  GH.addRoute(/^\/run\/(t|p|f|b|r|w)\/([^/]+)\/(\d+)$/, run, "practice");
  GH.addRoute(/^\/session\/(s[\w]+)$/, summary, "practice");
})();
