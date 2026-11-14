// GateHub — "How it works" illustrated guide and the review form.
(() => {
  "use strict";
  const GH = window.GH, FX = window.FX;
  if (!GH) return;
  const { esc, $, $$ } = GH;
  const C = window.GATEHUB_CONFIG || {};

  // ── tiny flat illustrations (colours follow the light/dark theme) ──
  const svg = (body) => `<svg class="il" viewBox="0 0 240 150" aria-hidden="true">${body}</svg>`;
  const card = (x, y, w, h, r = 8) => `<rect class="il-card" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
  const bar = (x, y, w, cls = "il-soft") => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="7" rx="3.5"/>`;
  const tick = (x, y, cls = "il-acc") => `<rect class="${cls}" x="${x}" y="${y}" width="16" height="16" rx="4"/><path class="il-tick" d="M${x + 4} ${y + 8.5} l3 3 l5.5 -6.5"/>`;
  const box = (x, y) => `<rect class="il-box" x="${x}" y="${y}" width="16" height="16" rx="4"/>`;

  const ILL = {
    pick: svg(`${card(20, 14, 200, 122)}
      ${tick(36, 30)}${bar(62, 34, 110, "il-ink")}${bar(186, 34, 20)}
      ${tick(36, 58)}${bar(62, 62, 90, "il-ink")}${bar(186, 62, 20)}
      ${box(36, 86)}${bar(62, 90, 120, "il-soft")}
      <rect class="il-acc" x="150" y="108" width="56" height="18" rx="5"/><text class="il-btn" x="178" y="121">START</text>`),
    answer: svg(`${card(20, 10, 200, 130)}${bar(36, 24, 150, "il-ink")}${bar(36, 36, 110, "il-ink")}
      <rect class="il-opt" x="36" y="52" width="168" height="18" rx="5"/><circle class="il-soft" cx="47" cy="61" r="5"/>
      <rect class="il-ok-bg" x="36" y="74" width="168" height="18" rx="5"/><circle class="il-ok" cx="47" cy="83" r="6"/><path class="il-tick" d="M44 83 l2.2 2.4 l4.2 -5"/>
      <rect class="il-bad-bg" x="36" y="96" width="168" height="18" rx="5"/><circle class="il-bad" cx="47" cy="105" r="6"/>
      <rect class="il-opt" x="36" y="118" width="168" height="16" rx="5"/>`),
    solution: svg(`${card(20, 14, 200, 122)}<rect class="il-gold" x="20" y="14" width="5" height="122" rx="2"/>
      <text class="il-label" x="38" y="38">ANSWER</text><rect class="il-acc" x="92" y="26" width="34" height="18" rx="4"/><text class="il-btn" x="109" y="39">(B)</text>
      ${bar(38, 56, 160, "il-ink")}${bar(38, 70, 140, "il-soft")}${bar(38, 84, 168, "il-soft")}${bar(38, 98, 120, "il-soft")}${bar(38, 112, 150, "il-soft")}`),
    claude: svg(`${card(14, 30, 92, 90)}${bar(26, 46, 64, "il-ink")}${bar(26, 58, 50, "il-ink")}<rect class="il-opt" x="26" y="74" width="68" height="12" rx="3"/><rect class="il-opt" x="26" y="92" width="68" height="12" rx="3"/>
      <path class="il-arrow" d="M112 75 h26 m-8 -7 l8 7 l-8 7"/>
      <rect class="il-claude-bg" x="146" y="26" width="82" height="62" rx="12"/><text class="il-claude" x="187" y="64">✦</text>
      <rect class="il-key" x="150" y="100" width="74" height="26" rx="6"/><text class="il-keytxt" x="187" y="118">Ctrl + V</text>`),
    remember: svg(`${card(46, 16, 150, 118)}<rect class="il-gold" x="46" y="16" width="5" height="118" rx="2"/>
      ${bar(64, 36, 100, "il-ink")}${bar(64, 52, 116, "il-soft")}${bar(64, 66, 90, "il-soft")}${bar(64, 80, 108, "il-soft")}
      <g transform="translate(150 86) rotate(35)"><rect class="il-acc" x="0" y="0" width="12" height="52" rx="3"/><path class="il-gold" d="M0 52 l6 12 l6 -12 z"/></g>`),
    end: svg(`<rect class="il-door" x="36" y="16" width="56" height="118" rx="4"/><rect class="il-door" x="94" y="16" width="56" height="118" rx="4"/>
      <rect class="il-doorline" x="44" y="26" width="40" height="44" rx="2"/><rect class="il-doorline" x="44" y="78" width="40" height="46" rx="2"/>
      <rect class="il-doorline" x="102" y="26" width="40" height="44" rx="2"/><rect class="il-doorline" x="102" y="78" width="40" height="46" rx="2"/>
      ${card(162, 40, 66, 94, 6)}<rect class="il-acc" x="172" y="98" width="10" height="26" rx="2"/><rect class="il-gold" x="188" y="80" width="10" height="44" rx="2"/><rect class="il-ok" x="204" y="62" width="10" height="62" rx="2"/>`),
    test: svg(`<circle class="il-card" cx="66" cy="75" r="50"/><circle class="il-ring" cx="66" cy="75" r="40"/><path class="il-hand" d="M66 75 V48 M66 75 l18 10"/>
      ${[0, 1, 2, 3, 4].map((r) => [0, 1, 2, 3].map((c) => `<rect class="${["il-ok", "il-ok", "il-bad-solid", "il-soft", "il-violet"][(r * 4 + c) % 5]}" x="${136 + c * 22}" y="${20 + r * 22}" width="16" height="16" rx="4"/>`).join("")).join("")}`),
    lectures: svg(`${card(14, 34, 92, 82)}<circle class="il-acc" cx="40" cy="62" r="14"/><text class="il-seal" x="40" y="66">MIT</text>${bar(30, 88, 64, "il-soft")}${bar(30, 100, 50, "il-soft")}
      <text class="il-num" x="60" y="26">1</text>
      <path class="il-arrow" d="M112 75 h20 m-8 -7 l8 7 l-8 7"/>
      <rect class="il-card dashed" x="138" y="34" width="92" height="82" rx="8"/><circle class="il-gold" cx="164" cy="62" r="14"/><text class="il-seal" x="164" y="66">IIT</text>${bar(154, 88, 64, "il-soft")}
      <text class="il-num" x="184" y="26">2</text>`),
    install: svg(`<rect class="il-card" x="30" y="18" width="62" height="116" rx="12"/><rect class="il-acc" x="48" y="56" width="26" height="26" rx="7"/><rect class="il-soft" x="52" y="24" width="18" height="4" rx="2"/>
      <rect class="il-card" x="112" y="34" width="112" height="76" rx="6"/><rect class="il-soft" x="100" y="112" width="136" height="8" rx="4"/>
      <rect class="il-acc" x="156" y="58" width="26" height="26" rx="7"/><circle class="il-ok" cx="214" cy="38" r="12"/><path class="il-tick" d="M208 38 h12 M214 32 v12"/>`),
    private: svg(`<path class="il-card" d="M120 14 l70 24 v38 c0 34 -30 54 -70 66 c-40 -12 -70 -32 -70 -66 v-38 z"/>
      <rect class="il-acc" x="98" y="70" width="44" height="36" rx="6"/><path class="il-lock" d="M106 70 v-12 a14 14 0 0 1 28 0 v12"/><circle class="il-paper" cx="120" cy="88" r="5"/>`)
  };

  const STEPS = [
    ["pick", "Pick a topic", "Open <b>PYQ Practice</b>, choose a subject, tick one topic or several, and press <b>Start</b>."],
    ["answer", "Answer, then check", "Tap an option (or type the number for numerical questions) and press <b>Check answer</b>. Green is correct; the right answer always lights up."],
    ["solution", "See the full solution", "Press <b>Show answer</b> any time for the answer and a step-by-step explanation."],
    ["claude", "Stuck? Ask Claude", "Press <b>✦ Ask Claude</b>. A screenshot of the question is copied and Claude opens with the question already typed. Press <b>Ctrl + V</b> (on a phone: long-press → Paste) to attach it."],
    ["remember", "Keep the idea", "Press <b>✎</b> to write down the trick or concept you want to remember. All your notes live in <b>Notebook</b>."],
    ["end", "End the session", "Press <b>End session</b>. The doors close and open on your results: accuracy, total time, time per question and what to revise."],
    ["test", "Take a timed test", "In <b>Timed Tests</b>, choose chapters and 1, 2 or 3 hours. Questions mix like real GATE (30% easy, 50% moderate, 20% hard) with negative marking and a clock on every question."],
    ["lectures", "Watch the right lectures", "Every subject shows <b>① a top-university course</b> with exact lecture numbers, then <b>② NPTEL lectures</b> only for the GATE topics it misses."],
    ["install", "Install it like an app", "<b>Phone:</b> browser menu → <b>Add to Home screen</b>. <b>Laptop:</b> Chrome or Edge → <b>Install GateHub</b> in the address bar."],
    ["private", "Your progress stays with you", "Everything is saved on your own device. No account, no tracking. Use <b>Records → Export</b> to back up or move to another device."]
  ];

  function guide() {
    GH.paint(`
      <header class="page-head calm-head" style="text-align:center"><p class="eyebrow">How it works</p><h1 class="title">GateHub in ten small steps</h1>
        <p class="lede" style="margin:0 auto">Everything you need to know, one picture at a time.</p></header>
      <div class="guide">
        ${STEPS.map(([k, t, d], i) => `<article class="g-step panel">
          <div class="g-pic">${ILL[k]}</div>
          <div class="g-text"><span class="g-n">${i + 1}</span><h3>${t}</h3><p>${d}</p></div>
        </article>`).join("")}
      </div>
      <section class="g-end panel">
        <h2 class="serif">Enjoying GateHub?</h2>
        <p class="small">Tell us what you love, what's broken, or what we should build next.</p>
        <div class="row" style="justify-content:center;margin-top:12px"><a class="btn primary" href="#/review">Leave a review</a><a class="btn" href="#/about">About Tech Gates</a></div>
      </section>`);
  }

  // ═══ Review form (#/review) → Web3Forms → founders' inbox ═══
  const TYPES = [["love", "Love it"], ["idea", "Suggestion"], ["bug", "Bug report"], ["question", "Question"]];
  function review() {
    const key = (C.reviews && C.reviews.web3formsKey) || "";
    const st = { rating: 0, type: "" };
    GH.paint(`
      <header class="page-head calm-head"><p class="eyebrow">Your review</p><h1 class="title">Tell us what you think</h1>
        <p class="lede">Every review goes straight to the Tech Gates team. We read all of them.</p></header>
      <form class="panel review" id="rv" novalidate>
        <div class="rv-field"><span class="lbl">How would you rate GateHub?</span>
          <div class="stars" id="rv-stars" role="radiogroup" aria-label="Rating">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="star-btn" data-n="${n}" role="radio" aria-checked="false" aria-label="${n} star${n > 1 ? "s" : ""}">★</button>`).join("")}</div>
          <div class="field-err" id="err-rating"></div></div>
        <div class="rv-field"><span class="lbl">What kind of review is this?</span>
          <div class="chips" id="rv-type">${TYPES.map(([v, l]) => `<button type="button" class="chip" data-v="${v}">${l}</button>`).join("")}</div>
          <div class="field-err" id="err-type"></div></div>
        <label class="rv-field"><span class="lbl">Your review</span>
          <textarea id="rv-msg" rows="6" placeholder="What did you like? What should we improve or add?"></textarea>
          <div class="field-err" id="err-msg"></div></label>
        <div class="grid g2">
          <label class="rv-field"><span class="lbl">Name <span class="small">(optional)</span></span><input id="rv-name" autocomplete="name" placeholder="Your name"></label>
          <label class="rv-field"><span class="lbl">Email <span class="small">(optional, if you'd like a reply)</span></span><input id="rv-email" type="email" autocomplete="email" placeholder="you@example.com"><div class="field-err" id="err-email"></div></label>
        </div>
        <input type="checkbox" name="botcheck" id="rv-bot" class="hidden" tabindex="-1" autocomplete="off">
        <div class="row" style="margin-top:6px"><button class="btn primary" id="rv-send" type="submit">Send review</button><span class="small" id="rv-status"></span></div>
      </form>`);

    const setErr = (id, msg) => { $("#" + id).textContent = msg || ""; };
    const onClick = (e) => {
      const s = e.target.closest(".star-btn");
      if (s) { st.rating = +s.dataset.n; $$(".star-btn", GH.view).forEach((b) => { const on = +b.dataset.n <= st.rating; b.classList.toggle("on", on); b.setAttribute("aria-checked", String(+b.dataset.n === st.rating)); }); setErr("err-rating"); return; }
      const c = e.target.closest(".chip");
      if (c) { st.type = c.dataset.v; $$(".chip", GH.view).forEach((b) => b.classList.toggle("on", b === c)); setErr("err-type"); }
    };
    const onInput = (e) => { if (e.target.id === "rv-msg") setErr("err-msg"); if (e.target.id === "rv-email") setErr("err-email"); };
    const onSubmit = async (e) => {
      e.preventDefault();
      const msg = $("#rv-msg").value.trim(), email = $("#rv-email").value.trim(), name = $("#rv-name").value.trim();
      let ok = true;
      if (!st.rating) { setErr("err-rating", "Choose a star rating."); ok = false; }
      if (!st.type) { setErr("err-type", "Choose what kind of review this is."); ok = false; }
      if (msg.length < 5) { setErr("err-msg", "Write a few words about your experience."); ok = false; }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr("err-email", "That email doesn't look right."); ok = false; }
      if (!ok) return;
      const status = $("#rv-status"), btn = $("#rv-send");
      if (!key) { status.textContent = "Reviews open very soon. We're finishing the setup. Please try again later."; return; }
      btn.disabled = true; status.textContent = "Sending…";
      const typeLabel = (TYPES.find(([v]) => v === st.type) || [, st.type])[1];
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: key, subject: `GateHub review · ${"★".repeat(st.rating)}${"☆".repeat(5 - st.rating)} · ${typeLabel}`,
            from_name: "GateHub reviews", name: name || "Anonymous", email: email || undefined, replyto: email || undefined,
            rating: `${st.rating} / 5`, type: typeLabel, message: msg, botcheck: $("#rv-bot").checked
          })
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || !out.success) throw new Error(out.message || "send failed");
        $("#rv").outerHTML = `<div class="panel empty-state"><div class="thanks-mark">✓</div><h3 class="serif">Thank you!</h3><p class="small">Your review reached the Tech Gates team.</p><a class="btn" href="#/">Back to GateHub</a></div>`;
      } catch (err) {
        btn.disabled = false;
        status.textContent = navigator.onLine ? "Couldn't send right now. Please try again in a moment." : "You're offline. Connect to the internet and try again.";
      }
    };
    GH.view.addEventListener("click", onClick); GH.view.addEventListener("input", onInput); GH.view.addEventListener("submit", onSubmit);
    return () => { GH.view.removeEventListener("click", onClick); GH.view.removeEventListener("input", onInput); GH.view.removeEventListener("submit", onSubmit); };
  }

  GH.addRoute(/^\/guide$/, guide, "guide");
  GH.addRoute(/^\/review$/, review, "");
})();
