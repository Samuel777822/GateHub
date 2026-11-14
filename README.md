<p align="center">
  <img src="assets/icons/icon-192.png" width="96" alt="GateHub logo">
</p>

<h1 align="center">GateHub</h1>
<p align="center"><b>A calm, complete place to prepare for GATE CS (Computer Science & IT).</b><br>Built by engineering students, for every GATE CS aspirant. A project by <b>Tech Gates</b>.</p>

<p align="center">
  <b><a href="https://samuel777822.github.io/GateHub/">Open GateHub →</a></b><br>
  Works in any browser on phone or laptop, and can be installed as an app.
</p>

---

## What's inside

- **Every GATE CSE PYQ, 1987–2026.** 3,692 questions sorted into 15 subjects, 67 chapters and 219 topics. Each one has its answer and a worked explanation.
- **Calm practice sessions.** Pick one topic or several, answer at your own pace, then end the session. You get your accuracy, total time, time per question and a short analysis.
- **Timed GATE-style tests.** 1 hour / 22 questions, 2 hours / 32 questions or 3 hours / 65 questions. Questions follow GATE's usual mix of about 30% easy, 50% moderate and 20% hard, with negative marking on MCQs, a question palette and a per-question clock. Results include analysis by chapter, difficulty and time.
- **Learn with Claude.** Pick any topic and follow five guided steps (understand it, GATE tricks, quiz, real PYQs, revision notes), each opening Claude with a prompt made for that topic. Install Claude first: [Android](https://play.google.com/store/apps/details?id=com.anthropic.claude) · [iPhone](https://apps.apple.com/app/claude-by-anthropic/id6473753684) · [Windows/Mac](https://claude.ai/download) · [web](https://claude.ai).
- **Ask Claude on any question.** One click copies a screenshot of the question and opens a new Claude chat with the question already typed in.
- **A lecture plan for every subject.** Start with the MIT, Stanford or Harvard course, then use NPTEL only for the GATE topics it doesn't cover. Exact lecture numbers are given for both.
- **Notebook.** Press ✎ on any question to write down the idea you want to remember. All your notes live in one searchable place.
- **How it works.** A ten-step illustrated guide inside the app.
- **Reviews.** Rate GateHub and tell us what to improve; every review goes straight to the Tech Gates team.
- **GateHub Display.** Our own typeface: classical carved Roman capitals, drawn in code (`tools/make_font.py`). It's used across the app, and the GATE HUB carved into the home-page wallpaper is lettered in it too.
- **Your GATE year.** On first visit GateHub asks which year you're writing GATE CS (it's always in February) and counts down to it.
- **Fast to open.** GateHub first loads a small index (about 160 KB) and opens straight away. Full questions and explanations arrive one subject at a time, only when you need them, and quietly in the background after that. Question pictures load only when you open the question, and everything works offline after the first visit.
- **Light and dark themes**, a study timer, mock-test records and progress backup.

Progress is stored only in your own browser. There's no account and no tracking.

## Install GateHub on your device

GateHub is a website that installs like an app: it gets its own icon, opens in its own window and keeps working offline. Open **<https://samuel777822.github.io/GateHub/>** first, then follow the steps for your device.

| Device | Browser | Steps |
|---|---|---|
| **Android phone or tablet** | Chrome | Tap **⋮** (top right) → **Add to Home screen** → **Install**. GateHub appears with your other apps. |
| **iPhone or iPad** | Safari | Tap the **Share** button (square with an arrow) → **Add to Home Screen** → **Add**. |
| **Windows laptop** | Chrome or Edge | Click the **install icon** at the right end of the address bar (a monitor with a down arrow), or **⋮ → Cast, save, and share → Install page as app**. To keep it handy, right-click its taskbar icon → **Pin to taskbar**. |
| **Mac** | Chrome or Edge | Click the **install icon** in the address bar → **Install**. It appears in Launchpad and can stay in the Dock. |
| **Mac** | Safari 17+ | **File → Add to Dock**. |

To uninstall, remove it the way you'd remove any app. Your progress is stored in your browser, so to move it to a new device use **Records → Export progress**, then **Import progress** on the other device.

New to GateHub? Open **How it works** in the app for a ten-step picture guide.

## Run it on your computer

You need Python 3. Then:

```bash
python server.py
```

Open <http://localhost:5173>. On Windows, double-click `GateHub.vbs` to start the server and open GateHub in Chrome as its own window.

To install it as an app, open GateHub in Chrome and choose **⋮ → Cast, save, and share → Install page as app**. On a phone, use **Add to Home screen**.

## Project layout

| Path | What it is |
|---|---|
| `index.html`, `css/`, `js/` | The app (plain HTML, CSS and JavaScript, no build step) |
| `js/content.js` | Lecture plans, textbooks and quotes |
| `data/index.json`, `data/q/` | The question bank, generated: a small index (topics, years, answer keys, difficulty) loaded at start, and one file per subject with the full questions and explanations, loaded when needed |
| `data/questions.json`, `data/img/` | The source question bank and its figures |
| `tools/build_bank.py` | Builds the question bank files: maps every question to a topic and estimates its difficulty |
| `tools/make_icons.py`, `tools/make_techgates.py` | Generate the GateHub icons and the Tech Gates logo and lettering |
| `tools/make_font.py`, `assets/fonts/` | Build the GateHub Display typeface (preview it in `tools/font-specimen.html`) |
| `tools/make_banner.py` | Re-letters the wallpaper's GATE HUB in GateHub Display and exports the WebP/JPEG banner images |
| `tools/optimize_images.py` | Shrinks the question figures in `data/img` |
| `sw.js`, `manifest.webmanifest` | Offline support and app install |

## The team: Tech Gates

| | |
|---|---|
| **Pranav V Rao**, Co-founder & CEO | AI & ML engineering student · cyclist · interested in military and defence technology · [@pranavvrao1-ai](https://github.com/pranavvrao1-ai) |
| **Abhay Samuel H**, Co-founder & CTO | Computer Science engineering student at BMS College of Engineering, Bengaluru · trains in MMA · complementarian Christian and a keen student of theology · [@Samuel777822](https://github.com/Samuel777822) |

## Credits

- **Questions, answers and explanations:** the open [GATE CSE Question Bank](https://github.com/cherie-dips/GATE-CS) by **cherie-dips**, which draws on [ExamSIDE](https://questions.examside.com) and the [GATE Overflow](https://gateoverflow.in) GATE CSE book. GateHub adds the topic map and difficulty estimates. All credit for the questions and solutions goes to them.
- **GATE question papers** are published by the IITs and IISc.
- **Lecture videos** belong to their universities and creators: MIT OpenCourseWare, Stanford, Harvard, CMU, Berkeley and NPTEL (the IITs and IISc). GateHub only links to them.
- **Libraries:** [KaTeX](https://katex.org), [marked](https://marked.js.org), [DOMPurify](https://github.com/cure53/DOMPurify) and [html-to-image](https://github.com/bubkoo/html-to-image).
- **Fonts:** GateHub Display (our own); Source Serif 4, Source Sans 3 and JetBrains Mono from Google Fonts.
- **Reviews** are delivered by [Web3Forms](https://web3forms.com).
- **Claude** and the Claude logo are trademarks of [Anthropic](https://www.anthropic.com). GateHub links to Claude; it isn't made by Anthropic.
