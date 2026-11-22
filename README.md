# 🎮 ICT Quest — Learn Computers by Playing

A game-based web app that teaches rural teenagers basic computer skills:
**Computer Basics, Keyboard & Mouse, Word, Spreadsheet, and Presentation**.

This folder contains **two versions** of the same idea. They don't conflict —
they use different files and different ports. Try both and keep whichever fits
your school (or keep both: the browser version for phone practice, the server
version for the computer lab).

| | 🌐 Browser version (no install) | 🖥️ Server version (accounts) |
|---|---|---|
| **How to run** | Double-click `index.html` | `node server.js` → `http://localhost:3000` |
| **Accounts** | None — just play | Student + Teacher accounts with passwords |
| **Progress saved** | In the browser, per device (`localStorage`) | On the server in `data/*.json` — survives device changes |
| **Teacher features** | None (teacher shares the link) | Teacher sees the whole class's scores on one screen |
| **Best for** | Phones / tablets / quick practice | The school computer lab, tracking real classes |
| **Tests** | Verified manually in a real browser (see below) | `node test.js` — **18 passed, 0 failed** |

---

## Version 1 — Browser version (no install, works on phones)

Files: `index.html`, `css/style.css`, `js/*.js` (top level of this folder).

### Quick start
- **Easiest:** double-click `index.html`.
- **Better:** serve the folder, then open `http://localhost:8123`:
  ```
  node -e "const http=require('http'),fs=require('fs'),path=require('path');http.createServer((q,s)=>{let p=q.url==='/'?'/index.html':q.url;fs.readFile(path.join(process.cwd(),p),(e,d)=>{if(e){s.writeHead(404);s.end();return}s.writeHead(200,{'Content-Type':{'.html':'text/html','.css':'text/css','.js':'text/javascript'}[path.extname(p)]||'text/plain'});s.end(d)})}).listen(8123)"
  ```

### How it works
1. Open the app, type an optional name.
2. Five missions unlock in order: Computer Basics quiz → Keyboard & Mouse →
   Word Processor → Spreadsheet → Presentation.
3. Each game awards points (20 first-try, 10 after a hint) and 1–3 stars.
4. Progress saves automatically in the browser (`localStorage`, key
   `ictquest_save_v1` — format in `docs/savefile.md`).
5. "Reset my progress" at the bottom clears everything after a confirmation.

### Directory map (browser version)

| File | What it is |
|---|---|
| `index.html` | All screens (home, quiz, keyboard, word, spreadsheet, presentation). |
| `css/style.css` | The look: dark plum + hot pink theme (inspired by wayground.com), mobile-first tiles. |
| `js/app.js` | Save file (localStorage) + home screen + mission unlocking. |
| `js/quiz.js` | Mission 1 — Computer Basics quiz. |
| `js/keyboard.js` | Mission 2 — keyboard keys (with on-screen keypad for phones) + mouse clicking. |
| `js/word.js` | Mission 3 — fix a document: bold, center, spell check, save. |
| `js/spreadsheet.js` | Mission 4 — find cells in a grid (A1-style references). |
| `js/presentation.js` | Mission 5 — order the story slides. |
| `docs/` | Planning docs: idea, brief, stack, style, save format, roadmap. |
| `missions/` | Mission Cards (goal, limits, self-test for each build step). |

### What was verified (browser version, manually in a real browser)
- Name typed → browser tab fully closed → reopened → name restored. ✅
- Quiz played to 100/100 ★★★; points and stars persisted after reload. ✅
- Broken/missing saves start fresh with a friendly screen (never an error dump). ✅
- Keyboard & Mouse game played to ★★★ using the on-screen keypad (phone-friendly). ✅
- Word Processor tasks played, including the wrong-answer hint path. ✅
- Spreadsheet 100/100 ★★★ (after fixing a real `var`-loop bug) and Presentation 100/100 ★★★. ✅
- **Full acceptance run:** fresh save → name → Mission 1 complete → tab closed →
  reopened → everything restored, on phone-size (375px) and desktop (1024px) viewports. ✅

### Known limitations (browser version)
- Progress is per device/browser — clearing browser data wipes it.
- No teacher dashboard; the teacher just shares the link.
- Fixed starter set of questions/games — add more by editing the data arrays
  at the top of each `js/*.js` file.

---

## Version 2 — Server version (accounts + class progress)

Files: `server.js`, `test.js`, `public/`, `data/` (auto-created), `ARCHITECTURE.md`.

### Quick start (3 steps)
1. Install Node.js (if not installed): https://nodejs.org (LTS version).
2. In this folder run: `node server.js`
3. Open `http://localhost:3000` (works on phones on the same Wi-Fi too, via the
   computer's IP address).

First register a **Teacher** account, then let students register as **Students**.

### What it adds over the browser version
- **Student accounts** — each student logs in and sees only their own progress
  (permission-tested: one student can never read another's scores).
- **Teacher account** — a class view of every student's best scores.
- **Server-side storage** — progress survives even if the student switches computers.
- Passwords are salted-and-hashed with Node's built-in crypto; quiz answers are
  never sent to the browser before submission.

### Tests
```
node test.js
```
Current result: **18 passed, 0 failed** — registration, login/logout, permission
checks (student B cannot see student A), teacher role enforcement, and password
hashing. Uses a temporary test data folder; your real `data/` is never touched.

### Environment variables (server version, all optional)

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `3000` | Which port the server listens on. |
| `DATA_DIR` | `./data` | Where the JSON data files are stored. |

No secrets, API keys, or external services are needed.

### Known limitations (server version)
- Quiz answers are fixed (option A is always correct) — simple to edit in
  `server.js` under `QUIZZES`, but a determined student could notice the pattern.
- Plain JSON files — fine for one school, not for thousands of users.
- Deleting `data/sessions.json` logs everyone out; no password reset (teacher helps).

---

## Save your code to GitHub (so you can return to it)

In this folder, run:

```
git init
git add .
git commit -m "ICT Quest: browser version + server version"
```

Then create a new empty repository on github.com (e.g. `ict-quest`), and:

```
git remote add origin https://github.com/YOUR-USERNAME/ict-quest.git
git push -u origin main
```

Before pushing, add a `.gitignore` file containing `data/` and `data-test/`
so real student accounts are never uploaded.

## Which version should my school use?

- **One shared computer lab, want to track a whole class?** Server version.
- **Students use their own/ borrowed phones, keep it dead simple?** Browser version.
- Not sure? Start with the browser version (zero setup), and move to the server
  version when you want accounts and class tracking.
