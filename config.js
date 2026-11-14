// ─────────────────────────────────────────────────────────────
//  GateHub configuration — edit freely, then refresh the app.
// ─────────────────────────────────────────────────────────────
window.GATEHUB_CONFIG = {
  name: "",                             // your name for the greeting (blank = "Scholar")
  gateYear: null,                       // default GATE year (null = ask each user; GATE is always in February)
  dailyGoalHours: 6,
  focusMinutes: 50,
  breakMinutes: 10,
  playIntro: true,                      // gate-opening animation when the app starts

  // Reviews are emailed to the Tech Gates team through Web3Forms (web3forms.com).
  // Paste the access key here. It is safe to be public: it can only send to the team's inbox.
  reviews: { web3formsKey: "748568b6-fcaa-4496-b9c5-f105dc34843d" },

  // Quick-launch links. They open in your normal Chrome window, so your logins stay.
  links: [
    { title: "GATE Wallah", sub: "Your batches & lectures", url: "https://www.pw.live/study", key: "pw" },
    { title: "Claude",      sub: "Doubts & derivations",   url: "https://claude.ai/new", key: "claude" },
    { title: "GATE Overflow", sub: "Discussions & answers", url: "https://gateoverflow.in/", key: "go" },
    { title: "NPTEL",       sub: "IIT lecture series",     url: "https://nptel.ac.in/", key: "nptel" },
    { title: "MIT OpenCourseWare", sub: "Every MIT course", url: "https://ocw.mit.edu/", key: "mit" },
    { title: "YouTube",     sub: "Revision playlists",     url: "https://www.youtube.com/", key: "yt" }
  ]
};
