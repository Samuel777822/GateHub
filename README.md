<p align="center">
  <img src="assets/icons/icon-192.png" width="96" alt="GateHub logo">
</p>

<h1 align="center">GateHub</h1>
<p align="center"><b>A calm, complete place to prepare for GATE CSE.</b><br>A project by <b>Tech Gates</b>.</p>

<p align="center">
  <b><a href="https://samuel777822.github.io/gatehub/">Open GateHub →</a></b><br>
  Works in any browser on phone or laptop, and can be installed as an app.
</p>

---

## What's inside

- **Every GATE CSE PYQ, 1987–2026.** 3,692 questions sorted into 15 subjects, 67 chapters and 219 topics. Each one has its answer and a worked explanation.
- **Calm practice sessions.** Pick one topic or several, answer at your own pace, then end the session. You get your accuracy, total time, time per question and a short analysis.
- **Timed GATE-style tests.** 1 hour / 22 questions, 2 hours / 32 questions or 3 hours / 65 questions. Questions follow GATE's usual mix of about 30% easy, 50% moderate and 20% hard, with negative marking on MCQs, a question palette and a per-question clock. Results include analysis by chapter, difficulty and time.
- **Ask Claude on any question.** One click copies a screenshot of the question and opens a new Claude chat with the question already typed in.
- **A lecture plan for every subject.** Start with the MIT, Stanford or Harvard course, then use NPTEL only for the GATE topics it doesn't cover. Exact lecture numbers are given for both.
- **Notebook.** Press ✎ on any question to write down the idea you want to remember. All your notes live in one searchable place.
- **Light and dark themes**, a study timer, mock-test records and progress backup.

Progress is stored only in your own browser. There's no account and no tracking.

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
| `data/bank.json` | The question bank with topics and estimated difficulty (generated) |
| `data/questions.json`, `data/img/` | The source question bank and its figures |
| `tools/build_bank.py` | Builds `bank.json`: maps every question to a topic and estimates its difficulty |
| `tools/make_icons.py`, `tools/make_techgates.py` | Generate the GateHub icons and the Tech Gates logo and lettering |
| `sw.js`, `manifest.webmanifest` | Offline support and app install |

## The team: Tech Gates

| | |
|---|---|
| **Pranav V Rao**, Co-founder & CEO | AI & ML student · cyclist · interested in military and defence technology · [@pranavvrao1-ai](https://github.com/pranavvrao1-ai) |
| **Abhay Samuel H**, Co-founder & CTO | Computer Science student at BMS College of Engineering, Bengaluru · trains in MMA · [@Samuel777822](https://github.com/Samuel777822) |

## Credits

- **Questions, answers and explanations:** the open [GATE CSE Question Bank](https://github.com/cherie-dips/GATE-CS) by **cherie-dips**, which draws on [ExamSIDE](https://questions.examside.com) and the [GATE Overflow](https://gateoverflow.in) GATE CSE book. GateHub adds the topic map and difficulty estimates. All credit for the questions and solutions goes to them.
- **GATE question papers** are published by the IITs and IISc.
- **Lecture videos** belong to their universities and creators: MIT OpenCourseWare, Stanford, Harvard, CMU, Berkeley and NPTEL (the IITs and IISc). GateHub only links to them.
- **Libraries:** [KaTeX](https://katex.org), [marked](https://marked.js.org), [DOMPurify](https://github.com/cure53/DOMPurify) and [html-to-image](https://github.com/bubkoo/html-to-image).
- **Fonts:** Cinzel, Source Serif 4, Source Sans 3 and JetBrains Mono, from Google Fonts.
