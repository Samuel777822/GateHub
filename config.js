// ─────────────────────────────────────────────────────────────
//  GateHub configuration — edit freely, then refresh the app.
// ─────────────────────────────────────────────────────────────
window.GATEHUB_CONFIG = {
  name: "",                             // your name for the greeting (blank = "Scholar")
  examDate: "2028-02-05T09:30:00",      // GATE 2028 — not announced yet (checked Nov 2026); first Saturday of Feb is the planning estimate
  dailyGoalHours: 6,
  focusMinutes: 50,
  breakMinutes: 10,
  playIntro: true,                      // gate-opening animation when the app starts

  // Quick-launch links. They open in your normal Chrome window, so your logins stay.
  links: [
    { title: "GATE Wallah", sub: "Your batches & lectures", url: "https://www.pw.live/gate", key: "pw" },
    { title: "Claude",      sub: "Doubts & derivations",   url: "https://claude.ai/new", key: "claude" },
    { title: "GATE Overflow", sub: "Discussions & answers", url: "https://gateoverflow.in/", key: "go" },
    { title: "NPTEL",       sub: "IIT lecture series",     url: "https://nptel.ac.in/", key: "nptel" },
    { title: "MIT OpenCourseWare", sub: "Every MIT course", url: "https://ocw.mit.edu/", key: "mit" },
    { title: "YouTube",     sub: "Revision playlists",     url: "https://www.youtube.com/", key: "yt" }
  ]
};
