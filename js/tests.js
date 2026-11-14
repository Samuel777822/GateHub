// GateHub — timed tests (GATE-style), results & analysis, test history,
// "Remember" notes and the Notebook.
(() => {
  "use strict";
  const GH = window.GH, FX = window.FX;
  if (!GH) return;
  const { S, save, QBY, TOPIC, SUBJ, CHAP, tKey, esc, pad, $, $$, LET } = GH;

  // Typical GATE CSE mix (paper analyses: ~30% easy, ~50% moderate, ~20% hard;
  // technical section ≈ 25 one-mark + 30 two-mark questions).
  const MIX = { e: 0.30, m: 0.50, h: 0.20 };
  const ONE_MARK_SHARE = 0.46;
  const PRESETS = [
    { id: "p22", n: 22, min: 60, label: "1 hour", sub: "22 questions · sectional" },
    { id: "p32", n: 32, min: 120, label: "2 hours", sub: "32 questions · half paper" },
    { id: "p65", n: 65, min: 180, label: "3 hours", sub: "65 questions · full GATE" }
  ];
  const DIFF = { e: "Easy", m: "Moderate", h: "Hard" };
  const mk = (q) => ((q.m || 1) >= 2 ? 2 : 1);
  const negOf = (q) => (q.t === "MCQ" ? (q.neg != null ? q.neg : +(mk(q) / 3).toFixed(2)) : 0);
  const eligible = (q) => ["MCQ", "MSQ", "NAT"].includes(q.t) && !["se", "web"].includes(q.s) && !q.oos && q.a && !q.a.mta
    && ((q.a.opts && Array.isArray(q.o) && q.o.length) || q.a.lo != null);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmtTime = (s) => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return h ? `${h}:${pad(m)}:${pad(x)}` : `${pad(m)}:${pad(x)}`; };
  const fmtMin = (s) => (s >= 60 ? `${Math.round(s / 60)} min` : `${Math.round(s)} s`);
  const topicOf = (q) => TOPIC[tKey(q.s, q.c, q.tp)];
  const chapName = (q) => (CHAP[q.s + "~" + q.c] ? CHAP[q.s + "~" + q.c].name : q.c);
  const findTest = (id) => S.tests.find((t) => t.id === id);

  // ═══ Remember modal (used by practice, tests and review) ═══
  GH.remember = function (q, btn) {
    const ex = S.notes[q.id];
    const t = topicOf(q);
    const wrap = document.createElement("div");
    wrap.className = "modal-wrap";
    wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="rem-title">
      <p class="eyebrow">Notebook</p>
      <h2 id="rem-title" class="modal-title">What do you want to remember?</h2>
      <div class="small" style="margin-bottom:12px">${esc(GH.subjName(q.s))} › ${esc(chapName(q))}${t ? " › " + esc(t.name) : ""} · ${esc(q.p)}${q.n ? " Q" + esc(q.n) : ""}</div>
      <textarea id="rem-text" rows="5" placeholder="The idea, trick or mistake to remember. For example: a DFA for 'k-th symbol from the end is 1' needs 2^k states.">${esc(ex ? ex.text : "")}</textarea>
      <div class="field-err" id="rem-err"></div>
      <div class="row" style="margin-top:14px">
        ${ex ? `<button class="btn ghost sm" id="rem-del">Delete note</button>` : ""}
        <span class="spacer"></span>
        <button class="btn" id="rem-cancel">Cancel</button>
        <button class="btn primary" id="rem-save">Save to Notebook</button>
      </div></div>`;
    document.body.append(wrap);
    const ta = $("#rem-text", wrap);
    ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
    const close = () => { wrap.remove(); document.removeEventListener("keydown", onKey, true); };
    const doSave = () => {
      const text = ta.value.trim();
      if (!text) { $("#rem-err", wrap).textContent = "Write what you want to remember first."; ta.focus(); return; }
      S.notes[q.id] = { text, t: ex ? ex.t : Date.now(), u: Date.now() };
      delete S.rev[q.id];
      save(); close();
      if (btn) btn.classList.add("on");
      FX.toast(`<b>Saved to your Notebook.</b> <a href="#/notebook">Open Notebook</a>`);
    };
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
      else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doSave(); }
      else e.stopPropagation();
    };
    document.addEventListener("keydown", onKey, true);
    ta.addEventListener("input", () => { $("#rem-err", wrap).textContent = ""; });
    wrap.addEventListener("click", (e) => {
      if (e.target === wrap || e.target.id === "rem-cancel") close();
      else if (e.target.id === "rem-save") doSave();
      else if (e.target.id === "rem-del") { delete S.notes[q.id]; save(); close(); if (btn) btn.classList.remove("on"); FX.toast("Note deleted."); }
    });
  };

  function confirmBox(title, body, okLabel, onOk) {
    const wrap = document.createElement("div");
    wrap.className = "modal-wrap";
    wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h2 class="modal-title">${title}</h2><div style="margin-bottom:16px">${body}</div>
      <div class="row"><span class="spacer"></span><button class="btn" data-x>Back</button><button class="btn primary" data-ok>${okLabel}</button></div></div>`;
    document.body.append(wrap);
    const close = () => wrap.remove();
    wrap.addEventListener("click", (e) => { if (e.target === wrap || e.target.closest("[data-x]")) close(); else if (e.target.closest("[data-ok]")) { close(); onOk(); } });
    $("[data-ok]", wrap).focus();
  }

  // ═══ Composition ════════════════════════════════════════
  function compose(primary, fallback, n) {
    const picked = [], used = new Set();
    const take = (arr, k) => { const out = []; for (const q of arr) { if (out.length >= k) break; if (!used.has(q.id)) { used.add(q.id); out.push(q); } } return out; };
    const draw = (pool, cnt, mark) => {
      const got = [];
      const tgt = { e: Math.round(cnt * MIX.e), h: Math.round(cnt * MIX.h) }; tgt.m = cnt - tgt.e - tgt.h;
      for (const d of ["e", "m", "h"]) got.push(...take(shuffle(pool.filter((q) => mk(q) === mark && q.d === d)), tgt[d]));
      if (got.length < cnt) got.push(...take(shuffle(pool.filter((q) => mk(q) === mark)), cnt - got.length));
      return got;
    };
    const one = Math.round(n * ONE_MARK_SHARE), two = n - one;
    for (const pool of [primary, fallback]) {
      const need1 = one - picked.filter((q) => mk(q) === 1).length, need2 = two - picked.filter((q) => mk(q) === 2).length;
      if (need1 > 0) picked.push(...draw(pool, need1, 1));
      if (need2 > 0) picked.push(...draw(pool, need2, 2));
    }
    if (picked.length < n) picked.push(...take(shuffle([...primary, ...fallback]), n - picked.length));
    // GATE order: 1-mark questions first, then 2-mark; shuffled inside each block
    return [...shuffle(picked.filter((q) => mk(q) === 1)), ...shuffle(picked.filter((q) => mk(q) === 2))];
  }

  // ═══ Builder + history (#/tests) ════════════════════════
  function testsHome(_, params) {
    const subs = GH.BANK.subjects.filter((s) => !["se", "web"].includes(s.id));
    const st = Object.assign({ s: params.get("s") || "algo", ch: null, all: [], preset: "p22", fresh: true, unsolved: false },
      (() => { try { return JSON.parse(sessionStorage.getItem("gh.builder")) || {}; } catch { return {}; } })());
    if (params.get("s")) { st.s = params.get("s"); st.ch = null; }
    if (!PRESETS.some((p) => p.id === st.preset)) st.preset = "p22";   // older saved choices (e.g. 20/40)
    const eligCount = (ids) => ids.reduce((a, id) => a + (eligible(QBY[id]) ? 1 : 0), 0);

    const live = S.tests.filter((t) => t.status === "live");
    const done = S.tests.filter((t) => t.status === "done").slice().reverse();
    const avg = done.length ? done.reduce((a, t) => a + (t.result.score / t.result.max) * 100, 0) / done.length : null;

    GH.paint(`
      <header class="page-head"><p class="eyebrow">The Examination Hall</p><h1 class="title">Timed Tests</h1>
      <p class="lede">Build a test from previous-year questions in the chapters you choose. Each test follows GATE's mix: about 30% easy, 50% moderate and 20% hard questions, with 1-mark questions first and negative marking on MCQs.</p></header>
      <div class="rule"><span></span>❦<span></span></div>
      <div class="tests-layout">
        <section class="panel builder">
          <h2 class="sec">Build a test</h2>
          <div class="step"><span class="step-n">1</span><div class="step-b">
            <label class="lbl" for="b-subj">Subject</label>
            <select id="b-subj">
              <option value="__all" ${st.s === "__all" ? "selected" : ""}>All subjects (full syllabus)</option>
              ${subs.map((s) => `<option value="${s.id}" ${st.s === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}
            </select></div></div>
          <div class="step"><span class="step-n">2</span><div class="step-b">
            <div class="row" style="justify-content:space-between"><span class="lbl" id="b-ch-lbl"></span>
              <span class="row" style="gap:6px"><button class="btn ghost sm" id="b-allon">Select all</button><button class="btn ghost sm" id="b-alloff">Clear</button></span></div>
            <div class="chk-list" id="b-ch"></div></div></div>
          <div class="step"><span class="step-n">3</span><div class="step-b">
            <span class="lbl">Format</span>
            <div class="presets">${PRESETS.map((p) => `<button class="preset ${st.preset === p.id ? "on" : ""}" data-p="${p.id}"><b>${p.label}</b><span>${p.sub}</span></button>`).join("")}</div>
            <label class="row small" style="margin-top:12px;gap:8px"><input type="checkbox" class="check" id="b-fresh" ${st.fresh ? "checked" : ""}> Prefer questions I haven't had in a test before</label>
            <label class="row small" style="margin-top:6px;gap:8px"><input type="checkbox" class="check" id="b-unsolved" ${st.unsolved ? "checked" : ""}> Prefer questions I haven't solved in practice</label>
          </div></div>
          <div class="builder-foot"><span class="small" id="b-pool"></span><span class="spacer"></span><button class="btn primary" id="b-start">Start test</button></div>
        </section>
        <aside style="display:flex;flex-direction:column;gap:20px">
          ${live.length ? `<div class="panel"><h2 class="sec">In progress</h2>${live.map((t) => `<div class="hist-row"><div><b>${esc(t.title)}</b><div class="small">${fmtTime(t.remaining)} left · ${Object.keys(t.ans).filter((id) => answered(t.ans[id])).length}/${t.qids.length} answered</div></div><a class="btn primary sm" href="#/test/${t.id}">Resume</a></div>`).join("")}</div>` : ""}
          <div class="panel"><h2 class="sec">Your tests</h2>
            ${done.length ? `<div class="small" style="margin:-4px 0 10px">${done.length} test${done.length > 1 ? "s" : ""} taken · average ${avg.toFixed(0)}%</div>
              ${done.slice(0, 30).map((t) => `<a class="hist-row link" href="#/test/${t.id}/result"><div><b>${esc(t.title)}</b><div class="small">${new Date(t.submitted).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} · ${t.result.correct}/${t.qids.length} correct</div></div><span class="score-pill">${fmtScore(t.result.score)}<small> / ${t.result.max}</small></span></a>`).join("")}`
              : `<p class="small" style="margin:0">Your finished tests will be listed here so you can come back to the results and solutions any time.</p>`}
          </div>
        </aside>
      </div>`);

    const paintChapters = () => {
      const box = $("#b-ch");
      if (st.s === "__all") {
        $("#b-ch-lbl").textContent = "Subjects";
        if (!st.all || !st.all.length) st.all = subs.map((s) => s.id);
        box.innerHTML = subs.map((s) => `<label class="chk"><input type="checkbox" class="check" data-s="${s.id}" ${st.all.includes(s.id) ? "checked" : ""}><span>${esc(s.name)}</span><span class="cnt">${eligCount(s.ids)}</span></label>`).join("");
      } else {
        const s = SUBJ[st.s];
        $("#b-ch-lbl").textContent = "Chapters";
        if (!st.ch || st.ch.sid !== st.s) st.ch = { sid: st.s, ids: s.chapters.map((c) => c.id) };
        box.innerHTML = s.chapters.map((c) => `<label class="chk"><input type="checkbox" class="check" data-c="${c.id}" ${st.ch.ids.includes(c.id) ? "checked" : ""}><span>${esc(c.name)}</span><span class="cnt">${eligCount(c.ids)}</span></label>`).join("");
      }
      paintPool();
    };
    const scopeIds = () => {
      if (st.s === "__all") return st.all.flatMap((sid) => SUBJ[sid].ids);
      return SUBJ[st.s].chapters.filter((c) => st.ch.ids.includes(c.id)).flatMap((c) => c.ids);
    };
    const paintPool = () => {
      const n = scopeIds().filter((id) => eligible(QBY[id])).length;
      const p = PRESETS.find((x) => x.id === st.preset);
      $("#b-pool").innerHTML = n ? `${n} PYQs available${n < p.n ? ` · <span style="color:var(--bad)">only ${n} questions, the test will be shorter</span>` : ""}` : `<span style="color:var(--bad)">Choose at least one chapter</span>`;
      $("#b-start").disabled = !n;
      try { sessionStorage.setItem("gh.builder", JSON.stringify(st)); } catch {}
    };
    paintChapters();

    const onChange = (e) => {
      if (e.target.id === "b-subj") { st.s = e.target.value; st.ch = null; paintChapters(); }
      else if (e.target.dataset.c) { const ids = new Set(st.ch.ids); e.target.checked ? ids.add(e.target.dataset.c) : ids.delete(e.target.dataset.c); st.ch.ids = [...ids]; paintPool(); }
      else if (e.target.dataset.s) { const ids = new Set(st.all); e.target.checked ? ids.add(e.target.dataset.s) : ids.delete(e.target.dataset.s); st.all = [...ids]; paintPool(); }
      else if (e.target.id === "b-fresh") { st.fresh = e.target.checked; paintPool(); }
      else if (e.target.id === "b-unsolved") { st.unsolved = e.target.checked; paintPool(); }
    };
    const onClick = (e) => {
      const pr = e.target.closest(".preset");
      if (pr) { st.preset = pr.dataset.p; $$(".preset", GH.view).forEach((b) => b.classList.toggle("on", b === pr)); paintPool(); return; }
      if (e.target.closest("#b-allon")) { if (st.s === "__all") st.all = subs.map((s) => s.id); else st.ch.ids = SUBJ[st.s].chapters.map((c) => c.id); paintChapters(); return; }
      if (e.target.closest("#b-alloff")) { if (st.s === "__all") st.all = []; else st.ch.ids = []; paintChapters(); return; }
      if (e.target.closest("#b-start")) startTest();
    };
    function startTest() {
      const p = PRESETS.find((x) => x.id === st.preset);
      const pool = scopeIds().map((id) => QBY[id]).filter(eligible);
      if (!pool.length) return;
      const seenInTests = new Set(S.tests.flatMap((t) => t.qids));
      const solved = (q) => S.att[q.id] && (S.att[q.id].r === "c" || S.att[q.id].r === "w");
      const prefer = (q) => (!st.fresh || !seenInTests.has(q.id)) && (!st.unsolved || !solved(q));
      const primary = pool.filter(prefer), fallback = pool.filter((q) => !prefer(q));
      const n = Math.min(p.n, pool.length);
      const qs = compose(primary, fallback, n);
      const scopeName = st.s === "__all"
        ? (st.all.length === subs.length ? "Full syllabus" : st.all.map((sid) => SUBJ[sid].short).join(", "))
        : SUBJ[st.s].name + (st.ch.ids.length === SUBJ[st.s].chapters.length ? "" : ` · ${st.ch.ids.length} chapter${st.ch.ids.length > 1 ? "s" : ""}`);
      const test = {
        id: "t" + Date.now().toString(36), title: `${scopeName} — ${p.label}`, preset: p.id,
        qids: qs.map((q) => q.id), dur: Math.round(p.min * 60 * (n / p.n)), remaining: Math.round(p.min * 60 * (n / p.n)),
        ans: {}, mark: {}, visited: {}, tspent: {}, cur: 0, status: "live", created: Date.now()
      };
      S.tests.push(test); save();
      location.hash = `#/test/${test.id}`;
    }
    GH.view.addEventListener("change", onChange); GH.view.addEventListener("click", onClick);
    return () => { GH.view.removeEventListener("change", onChange); GH.view.removeEventListener("click", onClick); };
  }
  const answered = (a) => !!a && ((a.sel && a.sel.length) || (a.nat != null && String(a.nat).trim() !== ""));
  const fmtScore = (x) => (Math.round(x * 100) / 100).toString();

  // ═══ Live test (#/test/:id) ═════════════════════════════
  function liveTest([id]) {
    const T = findTest(id);
    if (!T) { location.hash = "#/tests"; return; }
    if (T.status === "done") { location.hash = `#/test/${id}/result`; return; }
    let timerId = 0, last = Date.now(), saveTick = 0;

    GH.paint(`
      <div class="test-bar">
        <div><div class="eyebrow" style="margin:0">Timed test</div><b class="serif" style="font-size:1.15rem">${esc(T.title)}</b></div>
        <span class="spacer"></span>
        <div class="timer-box" id="t-timer" title="Time left. The clock pauses while you are away from this screen."><span class="small">Time left</span><b class="mono" id="t-left">${fmtTime(T.remaining)}</b></div>
        <button class="btn primary" id="t-submit">Submit test</button>
      </div>
      <div class="runner">
        <article class="panel q-card" id="q-card"></article>
        <aside class="panel palette">
          <h2 class="sec">Questions</h2>
          <div class="pg test-pg" id="t-pg"></div>
          <div class="t-legend" id="t-legend"></div>
          <div class="shortcuts"><span class="kbd">A</span>–<span class="kbd">D</span> select · <span class="kbd">←</span> <span class="kbd">→</span> move<br><span class="kbd">R</span> remember this concept</div>
        </aside>
      </div>`, { keepScroll: false });

    const statusOf = (qid) => {
      const a = T.ans[qid], m = T.mark[qid];
      if (!T.visited[qid]) return "nv";
      if (answered(a) && m) return "am";
      if (m) return "mr";
      if (answered(a)) return "an";
      return "na";
    };
    function paintPalette() {
      $("#t-pg").innerHTML = T.qids.map((qid, i) => `<a href="#" data-go="${i}" class="${statusOf(qid)} ${i === T.cur ? "cur" : ""}">${i + 1}</a>`).join("");
      const c = { an: 0, na: 0, nv: 0, mr: 0, am: 0 };
      T.qids.forEach((qid) => c[statusOf(qid)]++);
      $("#t-legend").innerHTML = `<span><i class="sw an"></i>${c.an} answered</span><span><i class="sw na"></i>${c.na} not answered</span><span><i class="sw nv"></i>${c.nv} not visited</span><span><i class="sw mr"></i>${c.mr} marked</span><span><i class="sw am"></i>${c.am} answered &amp; marked</span>`;
    }
    function paintQ() {
      const qid = T.qids[T.cur], q = QBY[qid];
      T.visited[qid] = 1;
      const a = T.ans[qid] || { sel: [], nat: "" };
      const fmt = q.of || q.qf;
      const hasOpts = Array.isArray(q.o) && q.o.length && q.a.opts;
      const neg = negOf(q);
      $("#q-card").innerHTML = `
        <div class="q-head">
          <span class="src">Question ${T.cur + 1} of ${T.qids.length}</span>
          <span class="pill gold">${mk(q)} mark${mk(q) > 1 ? "s" : ""}</span><span class="pill">${q.t}</span>
          <span class="pill">${neg ? "−" + neg + " if wrong" : "No negative marking"}</span>
          <span class="spacer"></span>
          <span class="q-clock no-shot" id="t-qclock" title="Time spent on this question (adds up if you come back to it)">On this question <b>${fmtTime(T.tspent[qid] || 0)}</b></span>
          <button class="icon-btn no-shot ${S.notes[qid] ? "on" : ""}" id="rem" title="Remember this concept (R)">✎</button>
        </div>
        <div class="q-topic">${esc(GH.subjName(q.s))} › ${esc(chapName(q))}</div>
        <div class="q-body" id="q-body">${GH.rich(q.q, q.qf)}</div>
        ${hasOpts ? `<div class="opts" id="opts">${q.o.map((o, i) => `<button class="opt ${a.sel && a.sel.includes(i) ? "sel" : ""}" data-i="${i}"><span class="ol">${LET[i]}</span><span class="ob">${GH.rich(o, fmt)}</span></button>`).join("")}</div>
          ${q.t === "MSQ" ? `<div class="small">Multiple Select: choose all correct options. No negative marking.</div>` : ""}`
          : `<div class="nat"><input type="text" inputmode="decimal" id="nat-in" placeholder="Type your numerical answer" autocomplete="off" value="${esc(a.nat || "")}"><span class="small">Numerical Answer Type</span></div>`}
        <div class="q-actions">
          <button class="btn" id="t-mark">${T.mark[qid] ? "Unmark review" : "Mark for review"} &amp; next</button>
          <button class="btn ghost" id="t-clear">Clear response</button>
          <span class="spacer"></span>
          <button class="btn ghost sm" id="t-prev" ${T.cur === 0 ? "disabled" : ""}>◀ Previous</button>
          <button class="btn primary" id="t-next">${T.cur < T.qids.length - 1 ? "Save &amp; next ▶" : "Save"}</button>
        </div>`;
      GH.typeset($("#q-body"), q.qf === "md");
      if (hasOpts) GH.typeset($("#opts"), fmt === "md");
      paintPalette(); save();
      GH.view.closest(".main").scrollTop = 0;
    }
    function storeNat() {
      const inp = $("#nat-in"); if (!inp) return;
      const qid = T.qids[T.cur];
      T.ans[qid] = Object.assign(T.ans[qid] || { sel: [] }, { nat: inp.value.trim() });
    }
    function go(i) { storeNat(); T.cur = Math.max(0, Math.min(T.qids.length - 1, i)); paintQ(); }
    function tick() {
      const now = Date.now(), dt = (now - last) / 1000; last = now;
      T.remaining -= dt;
      const qid = T.qids[T.cur]; T.tspent[qid] = (T.tspent[qid] || 0) + dt;
      const qc = $("#t-qclock");
      if (qc) { qc.querySelector("b").textContent = fmtTime(T.tspent[qid]); qc.classList.toggle("slow", T.tspent[qid] > (mk(QBY[qid]) === 1 ? 150 : 300)); }
      const el = $("#t-left");
      if (el) el.textContent = fmtTime(T.remaining);
      const box = $("#t-timer"); if (box) box.classList.toggle("low", T.remaining <= 300);
      if (++saveTick % 5 === 0) save();
      if (T.remaining <= 0) { clearInterval(timerId); storeNat(); submit(true); }
    }
    function submit(auto) {
      clearInterval(timerId);
      storeNat();
      const res = { score: 0, max: 0, correct: 0, wrong: 0, skipped: 0, neg: 0, per: {} };
      for (const qid of T.qids) {
        const q = QBY[qid], a = T.ans[qid], m = mk(q);
        res.max += m;
        if (!answered(a)) { res.skipped++; res.per[qid] = { r: "u", s: 0 }; continue; }
        const ok = GH.grade(q, new Set(a.sel || []), a.nat);
        if (ok) { res.correct++; res.score += m; res.per[qid] = { r: "c", s: m }; GH.record(qid, "c"); }
        else { const n = negOf(q); res.wrong++; res.score -= n; res.neg += n; res.per[qid] = { r: "w", s: -n }; GH.record(qid, "w"); }
      }
      res.score = Math.round(res.score * 100) / 100; res.neg = Math.round(res.neg * 100) / 100;
      T.status = "done"; T.submitted = Date.now(); T.auto = !!auto; T.used = Math.min(T.dur, T.dur - Math.max(0, T.remaining)); T.result = res;
      save();
      if (auto) FX.toast("<b>Time's up.</b> Your test was submitted automatically.", 6000);
      location.hash = `#/test/${T.id}/result`;
    }

    const onClick = (e) => {
      const opt = e.target.closest(".opt");
      if (opt) {
        const qid = T.qids[T.cur], q = QBY[qid], i = +opt.dataset.i;
        const a = T.ans[qid] || (T.ans[qid] = { sel: [], nat: "" });
        const sel = new Set(a.sel || []);
        if (q.t === "MSQ") { sel.has(i) ? sel.delete(i) : sel.add(i); } else { const had = sel.has(i); sel.clear(); if (!had) sel.add(i); }
        a.sel = [...sel];
        $$(".opt", GH.view).forEach((b) => b.classList.toggle("sel", sel.has(+b.dataset.i)));
        paintPalette(); save(); return;
      }
      const g = e.target.closest("[data-go]");
      if (g) { e.preventDefault(); go(+g.dataset.go); return; }
      const b = e.target.closest("button"); if (!b) return;
      const qid = T.qids[T.cur];
      if (b.id === "t-next") { storeNat(); if (T.cur < T.qids.length - 1) go(T.cur + 1); else { paintPalette(); save(); FX.toast("Saved. Submit the test when you're done."); } }
      else if (b.id === "t-prev") go(T.cur - 1);
      else if (b.id === "t-mark") { storeNat(); if (T.mark[qid]) delete T.mark[qid]; else T.mark[qid] = 1; if (T.cur < T.qids.length - 1) go(T.cur + 1); else paintQ(); }
      else if (b.id === "t-clear") { T.ans[qid] = { sel: [], nat: "" }; paintQ(); }
      else if (b.id === "rem") GH.remember(QBY[qid], b);
      else if (b.id === "t-submit") {
        storeNat();
        const c = { an: 0, na: 0, mr: 0 };
        T.qids.forEach((x) => { if (answered(T.ans[x])) c.an++; else c.na++; if (T.mark[x]) c.mr++; });
        confirmBox("Submit this test?", `<p style="margin:0 0 8px">You have answered <b>${c.an}</b> of ${T.qids.length} questions${c.na ? `; <b>${c.na}</b> are unanswered` : ""}${c.mr ? ` and <b>${c.mr}</b> ${c.mr === 1 ? "is" : "are"} marked for review` : ""}.</p><p class="small" style="margin:0">Time left: ${fmtTime(T.remaining)}. You can't change answers after submitting.</p>`, "Submit test", () => submit(false));
      }
    };
    const onInput = (e) => { if (e.target.id === "nat-in") { storeNat(); paintPalette(); } };
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector(".modal-wrap")) return;
      if (e.target.matches && e.target.matches("input, textarea, select")) { if (e.key === "Enter" && e.target.id === "nat-in") { e.preventDefault(); $("#t-next").click(); } return; }
      const k = e.key.toLowerCase();
      if ("abcd".includes(k) && k.length === 1) { const b = $(`.opt[data-i="${"abcd".indexOf(k)}"]`, GH.view); if (b) b.click(); }
      else if (k === "arrowright") go(T.cur + 1);
      else if (k === "arrowleft") go(T.cur - 1);
      else if (k === "r") { const b = $("#rem"); if (b) b.click(); }
    };
    GH.view.addEventListener("click", onClick); GH.view.addEventListener("input", onInput); document.addEventListener("keydown", onKey);
    paintQ();
    last = Date.now(); timerId = setInterval(tick, 1000);
    return () => { clearInterval(timerId); if (T.status === "live") { storeNat(); save(); } GH.view.removeEventListener("click", onClick); GH.view.removeEventListener("input", onInput); document.removeEventListener("keydown", onKey); };
  }

  // ═══ Results & analysis (#/test/:id/result) ═════════════
  function result([id]) {
    const T = findTest(id);
    if (!T) { location.hash = "#/tests"; return; }
    if (T.status !== "done") { location.hash = `#/test/${id}`; return; }
    const R = T.result, qs = T.qids.map((qid) => QBY[qid]);
    const pct = R.max ? Math.max(0, (R.score / R.max) * 100) : 0;
    const attempted = R.correct + R.wrong;
    const acc = attempted ? (R.correct / attempted) * 100 : 0;

    const group = (keyFn, nameFn) => {
      const m = new Map();
      for (const q of qs) {
        const k = keyFn(q); if (!m.has(k)) m.set(k, { name: nameFn(q), n: 0, c: 0, w: 0, u: 0, s: 0, max: 0, time: 0 });
        const g = m.get(k), p = R.per[q.id];
        g.n++; g[p.r]++; g.s += p.s; g.max += mk(q); g.time += T.tspent[q.id] || 0;
      }
      return [...m.values()];
    };
    const byChapter = group((q) => q.s + "~" + q.c, (q) => (new Set(qs.map((x) => x.s)).size > 1 ? SUBJ[q.s].short + " › " : "") + chapName(q)).sort((a, b) => b.n - a.n);
    const byDiff = ["e", "m", "h"].map((d) => group((q) => q.d, (q) => DIFF[q.d]).find((g) => g.name === DIFF[d])).filter(Boolean);
    const byMarks = group((q) => mk(q), (q) => `${mk(q)}-mark`).sort((a, b) => a.name.localeCompare(b.name));
    const accOf = (g) => (g.c + g.w ? Math.round((g.c / (g.c + g.w)) * 100) : null);
    const avgTime = T.used / T.qids.length;
    const gatePace = (180 * 60) / 65;
    const slow = T.qids.map((qid, i) => ({ i, qid, t: T.tspent[qid] || 0 })).sort((a, b) => b.t - a.t).slice(0, 3);
    const weakest = byChapter.filter((g) => g.c + g.w >= 2).sort((a, b) => accOf(a) - accOf(b))[0];
    const weakQ = weakest && qs.find((q) => ((new Set(qs.map((x) => x.s)).size > 1 ? SUBJ[q.s].short + " › " : "") + chapName(q)) === weakest.name);

    const insights = [];
    if (R.skipped > T.qids.length * 0.25) insights.push(`You left ${R.skipped} questions unanswered. In GATE, NAT and MSQ questions carry no negative marks, so it's worth attempting all of them.`);
    if (R.neg >= 2) insights.push(`Negative marking cost you ${fmtScore(R.neg)} marks. Only answer an MCQ when you can rule out at least two options.`);
    if (avgTime > gatePace * 1.15) insights.push(`You averaged ${fmtMin(avgTime)} per question; the real GATE pace is about ${fmtMin(gatePace)}. Practise the 1-mark questions faster.`);
    if (weakest && accOf(weakest) != null && accOf(weakest) < 50) insights.push(`Weakest area in this test: ${esc(weakest.name)} (${accOf(weakest)}% accuracy).`);
    const hd = byDiff.find((g) => g.name === "Hard"), ez = byDiff.find((g) => g.name === "Easy");
    if (ez && accOf(ez) != null && accOf(ez) < 70) insights.push(`Easy questions were ${accOf(ez)}% accurate. These are the marks toppers don't lose, so slow down on them.`);
    if (hd && accOf(hd) != null && accOf(hd) >= 60) insights.push(`Strong work on the hard questions (${accOf(hd)}% accuracy).`);
    if (!insights.length) insights.push("Solid, balanced attempt. Review the wrong answers below and save the key ideas to your Notebook.");

    const row = (g) => `<tr><td>${esc(g.name)}</td><td>${g.n}</td><td class="ok-t">${g.c}</td><td class="bad-t">${g.w}</td><td>${g.u}</td><td>${fmtScore(g.s)} / ${g.max}</td><td>${accOf(g) == null ? "—" : accOf(g) + "%"}</td></tr>`;
    const yourAns = (q) => {
      const a = T.ans[q.id]; if (!answered(a)) return "—";
      if (a.sel && a.sel.length) return a.sel.map((i) => `(${LET[i]})`).join(", ");
      return esc(a.nat);
    };

    GH.paint(`
      <div class="crumbs"><a href="#/tests">Timed Tests</a> › Result</div>
      <header class="page-head"><p class="eyebrow">${T.auto ? "Submitted when time ran out" : "Submitted"} · ${new Date(T.submitted).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        <h1 class="title">${esc(T.title)}</h1></header>
      <div class="rule"><span></span>❦<span></span></div>

      <section class="result-top">
        <div class="panel score-card">
          ${GH.ringPct(pct, 150, fmtScore(R.score), `OF ${R.max} MARKS`)}
          <div class="score-side">
            <div class="big-score">${pct.toFixed(1)}%</div>
            <div class="small">${R.correct} correct · ${R.wrong} wrong · ${R.skipped} not answered</div>
            <div class="row" style="margin-top:14px"><a class="btn primary" href="#/test/${T.id}/review/0">Review solutions</a><button class="btn" id="r-retake">New test, same chapters</button></div>
          </div>
        </div>
        <div class="stats result-stats">
          <div><div class="v">${acc.toFixed(0)}%</div><div class="k">Accuracy (of attempted)</div></div>
          <div><div class="v">${attempted}<small> / ${T.qids.length}</small></div><div class="k">Attempted</div></div>
          <div><div class="v">−${fmtScore(R.neg)}</div><div class="k">Lost to negative marking</div></div>
          <div><div class="v">${fmtTime(T.used)}</div><div class="k">Time used of ${fmtTime(T.dur)}</div></div>
        </div>
      </section>

      <section class="panel section">
        <h2 class="sec">Analysis</h2>
        <ul class="insights">${insights.map((x) => `<li>${x}</li>`).join("")}</ul>
        <div class="grid g2" style="margin-top:18px">
          <div><h3 class="sub-h">By difficulty</h3>${byDiff.map((g) => `<div class="subj-mini"><span class="nm">${g.name} <span class="small">· ${g.n} questions</span></span><span class="pc">${g.c}/${g.n} correct</span>${GH.bar(g.n ? (g.c / g.n) * 100 : 0)}</div>`).join("")}</div>
          <div><h3 class="sub-h">By marks</h3>${byMarks.map((g) => `<div class="subj-mini"><span class="nm">${g.name} questions <span class="small">· ${g.n}</span></span><span class="pc">${fmtScore(g.s)} / ${g.max} marks</span>${GH.bar(g.max ? Math.max(0, g.s / g.max) * 100 : 0)}</div>`).join("")}
            <h3 class="sub-h" style="margin-top:16px">Time</h3>
            <div class="small" style="font-size:.9rem">Average ${fmtMin(avgTime)} per question (GATE pace ≈ ${fmtMin(gatePace)}). Slowest: ${slow.map((x) => `<a href="#/test/${T.id}/review/${x.i}">Q${x.i + 1}</a> (${fmtMin(x.t)})`).join(", ")}.</div>
            ${weakQ ? `<a class="btn sm" style="margin-top:12px" href="#/practice?s=${weakQ.s}&c=${weakQ.c}">Practise ${esc(chapName(weakQ))}</a>` : ""}
          </div>
        </div>
        <h3 class="sub-h" style="margin-top:20px">By chapter</h3>
        <div class="table-wrap"><table class="tbl"><thead><tr><th>Chapter</th><th>Qs</th><th>Correct</th><th>Wrong</th><th>Skipped</th><th>Marks</th><th>Accuracy</th></tr></thead><tbody>${byChapter.map(row).join("")}</tbody></table></div>
      </section>

      <section class="panel section">
        <h2 class="sec">Question by question</h2>
        <div class="table-wrap"><table class="tbl qtbl"><thead><tr><th>#</th><th>Topic</th><th>Level</th><th>Your answer</th><th>Correct</th><th>Marks</th><th>Time</th><th></th></tr></thead><tbody>
        ${qs.map((q, i) => { const p = R.per[q.id], t = topicOf(q); return `<tr class="r-${p.r}"><td>${i + 1}</td><td>${esc(t ? t.name : chapName(q))}<div class="small">${esc(q.p)}</div></td><td>${DIFF[q.d] || ""}</td><td>${yourAns(q)}</td><td>${esc(GH.answerText(q))}</td><td class="${p.r === "c" ? "ok-t" : p.r === "w" ? "bad-t" : ""}">${p.s > 0 ? "+" : ""}${fmtScore(p.s)}</td><td>${fmtMin(T.tspent[q.id] || 0)}</td><td><a class="btn ghost sm" href="#/test/${T.id}/review/${i}">Solution</a></td></tr>`; }).join("")}
        </tbody></table></div>
      </section>`);

    const onClick = (e) => {
      if (e.target.closest("#r-retake")) {
        const sids = [...new Set(qs.map((q) => q.s))];
        const st = sids.length > 1 ? { s: "__all", all: sids } : { s: sids[0], ch: { sid: sids[0], ids: [...new Set(qs.map((q) => q.c))] } };
        try { sessionStorage.setItem("gh.builder", JSON.stringify(Object.assign({ preset: T.preset, fresh: true, unsolved: false }, st))); } catch {}
        location.hash = "#/tests";
      }
    };
    GH.view.addEventListener("click", onClick);
    return () => GH.view.removeEventListener("click", onClick);
  }

  // ═══ Review with solutions (#/test/:id/review/:i) ═══════
  function review([id, iStr]) {
    const T = findTest(id);
    if (!T || T.status !== "done") { location.hash = "#/tests"; return; }
    const i = Math.max(0, Math.min(T.qids.length - 1, +iStr));
    const q = QBY[T.qids[i]], a = T.ans[q.id] || { sel: [], nat: "" }, p = T.result.per[q.id];
    const fmt = q.of || q.qf, t = topicOf(q);
    const right = new Set(q.a.opts || []);
    const hasOpts = Array.isArray(q.o) && q.o.length && q.a.opts;
    const sel = new Set(a.sel || []);
    const href = (k) => `#/test/${id}/review/${k}`;
    const myAns = answered(a) ? (sel.size ? [...sel].map((k) => `(${LET[k]})`).join(", ") : a.nat) : null;

    GH.paint(`
      <div class="crumbs"><a href="#/tests">Timed Tests</a> › <a href="#/test/${id}/result">${esc(T.title)}</a> › Question ${i + 1}</div>
      <div class="runner">
        <article class="panel q-card" id="q-card">
          <div class="q-head">
            <span class="src">${esc(q.p)}${q.n ? " · Q" + esc(q.n) : ""}</span>
            <span class="pill gold">${mk(q)} mark${mk(q) > 1 ? "s" : ""}</span><span class="pill">${q.t}</span><span class="pill">${DIFF[q.d]}</span>
            <span class="pill ${p.r === "c" ? "ok" : p.r === "w" ? "bad" : ""}">${p.r === "c" ? "Correct" : p.r === "w" ? "Wrong" : "Not answered"} · ${p.s > 0 ? "+" : ""}${fmtScore(p.s)}</span>
            <span class="spacer"></span>
            <button class="icon-btn no-shot ${S.notes[q.id] ? "on" : ""}" id="rem" title="Remember this concept (R)">✎</button>
          </div>
          <div class="q-topic">${esc(GH.subjName(q.s))} › ${esc(chapName(q))}${t ? " › " + esc(t.name) : ""}</div>
          <div class="q-body" id="q-body">${GH.rich(q.q, q.qf)}</div>
          ${hasOpts ? `<div class="opts" id="opts">${q.o.map((o, k) => `<button class="opt ${right.has(k) ? "right" : ""} ${sel.has(k) && !right.has(k) ? "wrong" : ""} ${sel.has(k) ? "sel-mark" : ""}" disabled><span class="ol">${LET[k]}</span><span class="ob">${GH.rich(o, fmt)}</span></button>`).join("")}</div>`
            : `<div class="nat ${p.r === "c" ? "right" : p.r === "w" ? "wrong" : ""}"><input type="text" disabled value="${esc(a.nat || "")}" placeholder="Not answered"><span class="small">Your answer</span></div>`}
          <div class="small no-shot" style="margin-top:6px">${myAns ? `Your answer: <b>${esc(myAns)}</b>` : "You didn't answer this question."} · Time spent: ${fmtMin(T.tspent[q.id] || 0)}</div>
          <div class="q-actions no-shot">
            <button class="btn claude" id="ask" title="Copy a screenshot and open a new Claude chat">✦ Ask Claude to explain</button>
            <span class="spacer"></span>
            <a class="btn ghost sm" href="${i > 0 ? href(i - 1) : "#"}" ${i > 0 ? "" : 'style="opacity:.4;pointer-events:none"'}>◀ Prev</a>
            <a class="btn sm" href="${i < T.qids.length - 1 ? href(i + 1) : `#/test/${id}/result`}">${i < T.qids.length - 1 ? "Next ▶" : "Back to result"}</a>
          </div>
          <div class="q-ex open no-shot"><div><div class="ex-inner">
            <div class="ex-ans">ANSWER <b>${esc(GH.answerText(q))}</b>${q.official ? `<span class="small">official key: ${esc(q.official)}</span>` : ""}</div>
            <div class="ex-body" id="ex-body">${GH.rich(q.e || "No explanation available.", "md")}</div>
            ${q.note ? `<div class="ex-note"><b>Reviewer's note:</b> ${GH.rich(q.note, "md")}</div>` : ""}
          </div></div></div>
        </article>
        <aside class="panel palette">
          <h2 class="sec">Review</h2>
          <div class="pg">${T.qids.map((qid, k) => { const r = T.result.per[qid].r; return `<a href="${href(k)}" class="${k === i ? "cur" : r === "u" ? "" : r}">${k + 1}</a>`; }).join("")}</div>
          <div class="legend"><span><i class="dot c" style="display:inline-block;width:9px;height:9px;border-radius:50%"></i>correct</span><span><i class="dot w" style="display:inline-block;width:9px;height:9px;border-radius:50%"></i>wrong</span><span>blank: not answered</span></div>
          <a class="btn sm" style="margin-top:14px;width:100%" href="#/test/${id}/result">Back to result</a>
        </aside>
      </div>`);
    GH.typeset($("#q-body"), q.qf === "md");
    if (hasOpts) GH.typeset($("#opts"), fmt === "md");
    GH.typeset($("#ex-body"), true);
    const cur = $(".pg a.cur", GH.view); if (cur) cur.scrollIntoView({ block: "nearest" });

    const extra = myAns ? `My answer in the test was ${myAns}, which was ${p.r === "c" ? "correct" : "wrong"}.` : "I didn't attempt it in the test.";
    const onClick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.id === "ask") GH.askClaude(q, t, true, $("#q-card"), extra);
      else if (b.id === "rem") GH.remember(q, b);
    };
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector(".modal-wrap")) return;
      if (e.target.matches && e.target.matches("input, textarea, select")) return;
      if (e.key === "ArrowRight" && i < T.qids.length - 1) location.hash = href(i + 1);
      else if (e.key === "ArrowLeft" && i > 0) location.hash = href(i - 1);
      else if (e.key.toLowerCase() === "r") $("#rem").click();
      else if (e.key.toLowerCase() === "c") $("#ask").click();
    };
    GH.view.addEventListener("click", onClick); document.addEventListener("keydown", onKey);
    return () => { GH.view.removeEventListener("click", onClick); document.removeEventListener("keydown", onKey); };
  }

  // ═══ Notebook (#/notebook) ══════════════════════════════
  function notebook() {
    const f = { q: "", s: "" };
    GH.paint(`
      <header class="page-head"><p class="eyebrow">Your Notebook</p><h1 class="title">Concepts to Remember</h1>
      <p class="lede">Every idea, trick or mistake you saved with ✎ Remember, from PYQ practice and timed tests, grouped by subject.</p></header>
      <div class="rule"><span></span>❦<span></span></div>
      <div class="filters">
        <input type="search" id="n-q" placeholder="Search your notes">
        <select id="n-s"><option value="">All subjects</option>${GH.BANK.subjects.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select>
        <span class="spacer"></span><a class="btn sm" href="${GH.runHref("r", "all")}">Practise remembered questions</a>
      </div>
      <div id="n-list"></div>`);
    const paintList = () => {
      const needle = f.q.trim().toLowerCase();
      const items = Object.entries(S.notes).map(([qid, n]) => ({ q: QBY[qid], n })).filter((x) => x.q)
        .filter((x) => !f.s || x.q.s === f.s)
        .filter((x) => !needle || (x.n.text + " " + GH.strip(x.q.q) + " " + (topicOf(x.q) || {}).name).toLowerCase().includes(needle))
        .sort((a, b) => (b.n.u || b.n.t) - (a.n.u || a.n.t));
      const box = $("#n-list");
      if (!Object.keys(S.notes).length) { box.innerHTML = `<div class="panel empty-state"><h3 class="serif">Your Notebook is empty</h3><p class="small">On any question, press <b>✎</b> (or the R key) and write down the idea you want to keep. It will show up here.</p><a class="btn primary" href="#/practice">Go to PYQ practice</a></div>`; return; }
      if (!items.length) { box.innerHTML = `<div class="empty">No notes match your search.</div>`; return; }
      const bySubj = new Map();
      for (const x of items) { if (!bySubj.has(x.q.s)) bySubj.set(x.q.s, []); bySubj.get(x.q.s).push(x); }
      box.innerHTML = [...bySubj.entries()].map(([sid, arr]) => `
        <section class="section"><h2 class="sec">${esc(SUBJ[sid].name)} <span class="small">· ${arr.length}</span></h2>
          <div class="notes">${arr.map(({ q, n }) => { const t = topicOf(q); return `<article class="note panel">
            <div class="small">${esc(chapName(q))}${t ? " › " + esc(t.name) : ""}</div>
            <p class="note-text">${esc(n.text).replace(/\n/g, "<br>")}</p>
            <div class="note-foot"><span class="small">${esc(q.p)}${q.n ? " · Q" + esc(q.n) : ""} · ${new Date(n.u || n.t).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span><span class="spacer"></span>
              <button class="btn ghost sm" data-open="${q.id}">Open question</button><button class="btn ghost sm" data-edit="${q.id}">Edit</button><button class="btn ghost sm" data-del="${q.id}">Delete</button></div>
          </article>`; }).join("")}</div></section>`).join("");
    };
    paintList();
    const onInput = (e) => { if (e.target.id === "n-q") { f.q = e.target.value; paintList(); } if (e.target.id === "n-s") { f.s = e.target.value; paintList(); } };
    const onClick = (e) => {
      const o = e.target.closest("[data-open]"), ed = e.target.closest("[data-edit]"), d = e.target.closest("[data-del]");
      if (o) { try { sessionStorage.setItem("gh.list.note", JSON.stringify({ ids: [o.dataset.open], label: "From your Notebook", back: "#/notebook" })); } catch {} location.hash = "#/run/f/note/0"; }
      else if (ed) { GH.remember(QBY[ed.dataset.edit]); const obs = new MutationObserver(() => { if (!document.querySelector(".modal-wrap")) { obs.disconnect(); paintList(); } }); obs.observe(document.body, { childList: true }); }
      else if (d) confirmBox("Delete this note?", `<p class="small" style="margin:0">This removes the note from your Notebook. The question itself stays in the bank.</p>`, "Delete", () => { delete S.notes[d.dataset.del]; save(); paintList(); });
    };
    GH.view.addEventListener("input", onInput); GH.view.addEventListener("click", onClick);
    return () => { GH.view.removeEventListener("input", onInput); GH.view.removeEventListener("click", onClick); };
  }

  GH.addRoute(/^\/tests$/, testsHome, "tests");
  GH.addRoute(/^\/test\/(t[\w]+)$/, liveTest, "tests");
  GH.addRoute(/^\/test\/(t[\w]+)\/result$/, result, "tests");
  GH.addRoute(/^\/test\/(t[\w]+)\/review\/(\d+)$/, review, "tests");
  GH.addRoute(/^\/notebook$/, notebook, "notebook");
})();
