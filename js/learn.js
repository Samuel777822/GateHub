// GateHub — "Learn with Claude": a guided learning session for any GATE topic.
// Each step opens Claude (claude.ai / the Claude app) with a prompt written for
// that topic. Claude and the Claude logo are trademarks of Anthropic.
(() => {
  "use strict";
  const GH = window.GH, FX = window.FX;
  if (!GH) return;
  const { S, save, QBY, TOPIC, SUBJ, CHAP, tKey, esc, pad, $, $$ } = GH;
  const LOGO = `<img class="claude-logo" src="assets/brand/claude-icon.png" alt="">`;
  GH.claudeLogo = LOGO;
  const APPS = [
    ["Android", "Google Play", "https://play.google.com/store/apps/details?id=com.anthropic.claude"],
    ["iPhone / iPad", "App Store", "https://apps.apple.com/app/claude-by-anthropic/id6473753684"],
    ["Windows / Mac", "Desktop app", "https://claude.ai/download"],
    ["Any browser", "claude.ai", "https://claude.ai/new"]
  ];
  S.learnLog = S.learnLog || [];
  const human = (s) => { s = Math.round(s); if (s < 60) return `${s} s`; const m = Math.floor(s / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`; };
  const fmt = (s) => { s = Math.max(0, Math.round(s)); return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; };
  const year = () => (GH.examDate ? GH.examDate.getFullYear() : "");

  const STEPS = [
    { id: "teach", n: "Understand it", d: "Claude explains the topic from scratch, with intuition and small examples.",
      p: (c) => `${c}\n\nTeach me this topic from scratch, as a patient tutor. Start with the intuition, then the precise definitions, then 2–3 small worked examples at GATE level. Keep each part short, and check my understanding with a quick question at the end.` },
    { id: "tricks", n: "See the GATE tricks", d: "Formulas, shortcuts and the traps GATE likes to set on this topic.",
      p: (c) => `${c}\n\nGive me the GATE-specific essentials for this topic: the key formulas and facts, the fastest shortcuts for solving questions, and the common traps or misconceptions examiners exploit. Use a compact list.` },
    { id: "quiz", n: "Quiz me", d: "Claude asks you questions one at a time and corrects your answers.",
      p: (c) => `${c}\n\nQuiz me on this topic. Ask one GATE-style question at a time (mix MCQ and numerical), wait for my answer, then tell me if I'm right and explain briefly before the next question. Start easy and get harder. Ask 6 questions in total, then summarise what I should revise.` },
    { id: "pyq", n: "Solve real PYQs together", d: "Three real GATE questions from this topic. Claude guides you, step by step.",
      p: (c, t) => {
        const qs = pickPyqs(t, 3);
        const body = qs.map((q, i) => `PYQ ${i + 1} — ${q.p}${q.n ? ", Q" + q.n : ""}:\n${GH.plain(q.q, q.qf)}${Array.isArray(q.o) && q.o.length ? "\n" + q.o.map((o, k) => `(${"ABCD"[k]}) ${GH.plain(o, q.of || q.qf)}`).join("\n") : ""}`).join("\n\n");
        return `${c}\n\nHere are real GATE previous-year questions on this topic. Guide me through them one by one: don't reveal the answer straight away; give me a hint first, let me try, then show the full solution and the concept it tests.\n\n${body}`;
      } },
    { id: "notes", n: "Make my revision notes", d: "A one-page revision sheet you can save and read before the exam.",
      p: (c) => `${c}\n\nMake me a one-page revision sheet for this topic: definitions, key results and formulas, a tiny example for each, and the 5 things I must not forget in the exam. Format it so I can copy it into my notes.` }
  ];

  function pickPyqs(t, n) {
    const pool = t.q.map((id) => QBY[id]).filter((q) => q && q.t !== "DESC" && q.y >= 2000);
    const unsolved = pool.filter((q) => !S.att[q.id] || S.att[q.id].r === "s");
    const src = unsolved.length >= n ? unsolved : pool;
    return src.slice().sort(() => Math.random() - 0.5).slice(0, n);
  }
  const context = (t) => `I'm preparing for GATE CSE ${year()}. Topic: ${t.subject.name} › ${t.chapter.name} › ${t.name}.`;
  const openClaude = (prompt) => {
    let p = prompt; if (p.length > 7000) p = p.slice(0, 7000) + " …";
    const w = window.open("https://claude.ai/new?q=" + encodeURIComponent(p), "_blank", "noopener");
    if (w === null) FX.toast(`Pop-up blocked. <a href="https://claude.ai/new?q=${encodeURIComponent(p)}" target="_blank" rel="noopener">Open Claude</a>`, 9000);
  };

  function learn(_, params) {
    const subs = GH.BANK.subjects.filter((s) => !["se", "web"].includes(s.id));
    const last = S.learnLast || {};
    let sid = params.get("s") || last.s || "toc";
    let cid = params.get("c") || (sid === last.s ? last.c : "") || "";
    let tid = params.get("t") || (sid === last.s && cid === last.c ? last.t : "") || "";
    const active = S.learnActive && TOPIC[S.learnActive.key] ? S.learnActive : null;
    const recent = S.learnLog.slice(0, 5);

    GH.paint(`
      <header class="page-head calm-head learn-head">
        <p class="eyebrow">Learn with Claude</p>
        <h1 class="title">${LOGO.replace('class="claude-logo"', 'class="claude-logo big"')} Learn any GATE topic with Claude</h1>
        <p class="lede">Pick a topic and follow five short steps. Each one opens Claude with a prompt made for that topic, so you can learn, practise and revise in a real conversation.</p>
      </header>

      <section class="panel install-claude ${S.hasClaude ? "done" : ""}" id="ic-claude">
        <div class="row" style="align-items:flex-start;gap:14px">
          <span class="step-badge">1</span>
          <div style="flex:1;min-width:0">
            <h2 class="sec flat" style="margin:0">First, install Claude</h2>
            <p class="small" style="margin:4px 0 12px">Claude is the AI tutor GateHub uses. It's free to start: sign in with Google or your email.</p>
            <div class="claude-apps">${APPS.map(([d, s, u]) => `<a class="claude-app" href="${u}" target="_blank" rel="noopener">${LOGO}<span><b>${d}</b><small>${s}</small></span></a>`).join("")}</div>
            <label class="row small" style="margin-top:12px;gap:8px"><input type="checkbox" class="check" id="has-claude" ${S.hasClaude ? "checked" : ""}> I have Claude installed and signed in</label>
          </div>
        </div>
      </section>

      <section class="panel learn-pick">
        <div class="row" style="align-items:flex-start;gap:14px">
          <span class="step-badge">2</span>
          <div style="flex:1;min-width:0">
            <h2 class="sec flat" style="margin:0 0 12px">Pick a topic</h2>
            <div class="pick-row">
              <select id="l-s" aria-label="Subject">${subs.map((s) => `<option value="${s.id}" ${s.id === sid ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select>
              <select id="l-c" aria-label="Chapter"></select>
              <select id="l-t" aria-label="Topic"></select>
            </div>
          </div>
        </div>
      </section>

      <section class="panel learn-session" id="l-session"></section>

      <section class="panel" style="margin-top:20px">
        <h2 class="sec">${LOGO} Ask Claude anything</h2>
        <textarea id="l-free" rows="3" placeholder="e.g. Why does every regular language have a minimal DFA, and how do I find it quickly?" style="width:100%"></textarea>
        <div class="row" style="margin-top:10px"><span class="spacer"></span><button class="btn claude-btn" id="l-ask">${LOGO} Ask Claude</button></div>
      </section>

      ${recent.length ? `<section class="section" style="margin-top:28px"><h2 class="sec">Recent learning sessions</h2>
        ${recent.map((x) => `<div class="hist-row"><div><b>${esc(x.label)}</b><div class="small">${new Date(x.end).toLocaleDateString(undefined, { day: "numeric", month: "short" })} · ${x.steps.length} of 5 steps · ${human(x.elapsed)}</div></div>${x.steps.length === 5 ? '<span class="pill ok">Complete</span>' : ""}</div>`).join("")}</section>` : ""}`);

    const fillChapters = () => {
      const s = SUBJ[sid];
      if (!s.chapters.some((c) => c.id === cid)) cid = s.chapters[0].id;
      $("#l-c").innerHTML = s.chapters.map((c) => `<option value="${c.id}" ${c.id === cid ? "selected" : ""}>${esc(c.name)}</option>`).join("");
      const c = CHAP[sid + "~" + cid];
      if (!c.topics.some((t) => t.id === tid)) tid = c.topics[0].id;
      $("#l-t").innerHTML = c.topics.map((t) => `<option value="${t.id}" ${t.id === tid ? "selected" : ""}>${esc(t.name)} (${t.q.length} PYQs)</option>`).join("");
      S.learnLast = { s: sid, c: cid, t: tid }; save();
      paintSession();
    };

    let timer = 0, lastTick = Date.now();
    function paintSession() {
      const t = TOPIC[tKey(sid, cid, tid)];
      const sess = S.learnActive && S.learnActive.key === t.key ? S.learnActive : null;
      const done = new Set(sess ? sess.steps : []);
      $("#l-session").innerHTML = `
        <div class="row" style="align-items:flex-start;gap:14px">
          <span class="step-badge">3</span>
          <div style="flex:1;min-width:0">
            <div class="row" style="justify-content:space-between;gap:10px">
              <div><h2 class="sec flat" style="margin:0">Your learning session</h2><div class="small">${esc(t.subject.name)} › ${esc(t.chapter.name)} › <b>${esc(t.name)}</b></div></div>
              ${sess ? `<span class="sess-clock"><span class="small">Session</span> <b class="mono" id="l-clock">${fmt(sess.elapsed)}</b></span>` : ""}
            </div>
            <ol class="learn-steps">
              ${STEPS.map((st, i) => `<li class="ls ${done.has(st.id) ? "done" : ""}">
                <span class="ls-n">${done.has(st.id) ? "✓" : i + 1}</span>
                <div class="ls-text"><b>${st.n}</b><span>${st.d}</span></div>
                <button class="btn claude-btn sm" data-step="${st.id}">${LOGO} ${done.has(st.id) ? "Open again" : "Open in Claude"}</button>
              </li>`).join("")}
            </ol>
            <div class="row learn-foot">
              <a class="btn sm" href="${GH.topicHref(t)}">Practise this topic's ${t.q.length} PYQs in GateHub</a>
              <span class="spacer"></span>
              ${sess ? `<button class="btn primary" id="l-finish">Finish session</button>` : `<span class="small">The session starts when you open your first step.</span>`}
            </div>
          </div>
        </div>`;
      clearInterval(timer);
      if (sess) { lastTick = Date.now(); timer = setInterval(() => { const now = Date.now(); if (!document.hidden) sess.elapsed += (now - lastTick) / 1000; lastTick = now; const el = $("#l-clock"); if (el) el.textContent = fmt(sess.elapsed); }, 1000); }
    }
    function runStep(id) {
      const t = TOPIC[tKey(sid, cid, tid)];
      if (!S.learnActive || S.learnActive.key !== t.key) {
        if (S.learnActive && S.learnActive.steps.length) finish(false);
        S.learnActive = { key: t.key, label: t.name, start: Date.now(), elapsed: 0, steps: [] };
      }
      const st = STEPS.find((x) => x.id === id);
      if (!S.learnActive.steps.includes(id)) S.learnActive.steps.push(id);
      save();
      openClaude(st.p(context(t), t));
      paintSession();
    }
    function finish(animate = true) {
      const a = S.learnActive; if (!a) return;
      a.end = Date.now();
      S.learnLog.unshift({ key: a.key, label: a.label, end: a.end, elapsed: a.elapsed, steps: a.steps.slice() });
      if (S.learnLog.length > 100) S.learnLog.length = 100;
      if (a.steps.length >= 3) S.studied[a.key] = 1;            // counts as studied in the Curriculum
      S.learnActive = null; save();
      if (animate) FX.doors("Topic learned", `${a.label} · ${a.steps.length} of 5 steps · ${human(a.elapsed)}`).then(() => GH.rerender());
    }

    const onChange = (e) => {
      if (e.target.id === "l-s") { sid = e.target.value; cid = ""; tid = ""; fillChapters(); }
      else if (e.target.id === "l-c") { cid = e.target.value; tid = ""; fillChapters(); }
      else if (e.target.id === "l-t") { tid = e.target.value; S.learnLast = { s: sid, c: cid, t: tid }; save(); paintSession(); }
      else if (e.target.id === "has-claude") { S.hasClaude = e.target.checked; save(); $("#ic-claude").classList.toggle("done", e.target.checked); }
    };
    const onClick = (e) => {
      const b = e.target.closest("[data-step]"); if (b) { runStep(b.dataset.step); return; }
      if (e.target.closest("#l-finish")) { finish(true); return; }
      if (e.target.closest("#l-ask")) {
        const v = $("#l-free").value.trim();
        if (!v) { FX.toast("Type your question first."); return; }
        const t = TOPIC[tKey(sid, cid, tid)];
        openClaude(`${context(t)}\n\n${v}`); $("#l-free").value = "";
      }
    };
    if (active && !params.get("s")) { const [as, ac, at] = active.key.split("~"); sid = as; cid = ac; tid = at; $("#l-s").value = sid; }
    fillChapters();
    GH.view.addEventListener("change", onChange); GH.view.addEventListener("click", onClick);
    return () => { clearInterval(timer); save(); GH.view.removeEventListener("change", onChange); GH.view.removeEventListener("click", onClick); };
  }

  GH.addRoute(/^\/learn$/, learn, "learn");
})();
