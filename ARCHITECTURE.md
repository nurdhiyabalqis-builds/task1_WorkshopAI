# Architecture — how ICT Quest works

This explains one complete request, from a finger tapping a button on the
screen all the way to storage and back, using the real files in this project.

## The three layers

```
┌────────────────────────┐      ┌────────────────┐      ┌──────────────┐
│  Interface (browser)   │ ───► │  Server        │ ───► │  Storage     │
│  public/app.js         │ ◄─── │  server.js     │ ◄─── │  data/*.json │
│  public/index.html     │      │  (Node.js)     │      │  (JSON files)│
│  public/style.css      │      │  port 3000     │      │              │
└────────────────────────┘      └────────────────┘      └──────────────┘
```

1. **Interface** — `public/index.html` defines the five screens (home/login,
   level select, quiz, result, progress). `public/app.js` is the game brain:
   it decides which screen is visible, calls the server with `fetch()`, and
   draws the questions. `public/style.css` makes it look right on a phone or a
   laptop. None of these files know anything about how data is stored.
2. **Server** — `server.js` is the only gatekeeper. It serves the interface
   files from `public/` and handles every URL starting with `/api/`. All rules
   (passwords, who may see whose scores) live here, never in the browser.
3. **Storage** — three JSON files in `data/`:
   - `data/users.json` — accounts: username, **hashed** password, role.
   - `data/progress.json` — per-student best scores and play history.
   - `data/sessions.json` — login tokens so a browser stays logged in.

## One full request, step by step: a student finishes the Word level

**Step 1 — Screen.** The student answers 5 questions in the quiz screen.
`public/app.js` collected each pick into the `answers` array. When they tap
"Finish", `app.js` runs:

```
POST /api/quizzes/word/submit   with body {"answers":[0,0,0,0,0]}
```

**Step 2 — Server receives it.** In `server.js`, `http.createServer(...)`
splits the URL. Because the path starts with `/api/`, it goes to
`handleAPI()`. The submit route matches the pattern
`/api/quizzes/:id/submit`, so:

- `getUserFromRequest()` reads the `session=...` cookie and looks the token up
  in `data/sessions.json`. No valid session → the server replies `401` and the
  student sees "Please log in to play."
- The quiz content is looked up in the `QUIZZES` object at the top of
  `server.js`. The browser sent 5 answers and the quiz has 5 questions —
  otherwise a `400` is returned.
- Grading: each answer is compared with the stored `answer` index. Note the
  questions sent to the browser never included the answers, so nobody can
  cheat by reading the network tab.

**Step 3 — Storage.** `readJSON(PROGRESS_FILE)` loads `data/progress.json`,
the score is merged (only stored if it's the student's best), and
`writeJSON()` writes the file atomically (write to `.tmp`, then rename) so a
power cut can't corrupt it.

**Step 4 — Back to the screen.** The server replies with JSON:
`{score, correct, total, best, review}`. `app.js`'s `submitQuiz()` receives it,
hides the quiz screen, and `renderResult()` draws the big percentage, the
stars, and a "Review what you missed" list.

## The other main journeys

- **Register / Login** (`POST /api/register`, `POST /api/login`): passwords are
  never stored — `hashPassword()` in `server.js` uses Node's built-in
  `crypto.scryptSync` with a random salt. Login checks the hash with
  `timingSafeEqual` and issues a random session token, set as an `HttpOnly`
  cookie (JavaScript on the page can't steal it).
- **Class view** (`GET /api/progress`): the same URL behaves differently by
  role. For a student it returns only their scores; for a teacher it returns
  every student's best scores from `data/progress.json`, matched to usernames
  in `data/users.json` — passwords are never included in any response.

## Why these choices (the brief's decisions)

- **Smallest stack:** plain HTML/CSS/JS + one Node file + JSON files. Nothing
  to install besides Node, works offline, runs on old laptops and phones.
- **What is stored:** usernames, salted password hashes, roles, quiz scores.
  Nothing personal (no full names, emails, or photos).
- **Who can access:** students only their own data; teachers class-wide scores.
  Enforced on the server (see the permission test in `test.js`).
- **Integrations:** none — everything is real and local. Nothing is faked.
- **Acceptance test:** `node test.js` — 18 checks covering the whole journey,
  including "one student cannot read another student's data".

---

# Appendix — Architecture of the browser version (top-level files)

The server version above has a three-layer architecture (screen → server →
storage). The browser version in the top-level files (`index.html`, `css/`,
`js/`) deliberately removes the middle layer:

```
┌─────────────────────────────────────┐     ┌──────────────────────────┐
│  Interface + logic (all in browser) │ ──► │  Storage                 │
│  index.html  (all five screens)     │     │  browser localStorage    │
│  js/app.js   (home + save + unlock) │ ◄── │  key: ictquest_save_v1   │
│  js/quiz.js, keyboard.js, word.js,  │     │  (stays on the device)   │
│  js/spreadsheet.js, presentation.js │     │                          │
│  css/style.css (theme)              │     │                          │
└─────────────────────────────────────┘     └──────────────────────────┘
```

**One full journey, step by step: a student finishes the Computer Basics quiz**

1. **Screen.** `index.html` defines the quiz section (`#quiz-view`). The student
   taps an answer button; `js/quiz.js` marks it green or amber and, when correct,
   calls `next()` after a short delay.
2. **Logic (no server).** After the 5th question, `quiz.js` runs `finish()`:
   it computes points and stars, then reads and updates the shared save object
   that `js/app.js` loaded from localStorage (`ictquest_save_v1`), sets
   `missions["computer-basics"].completed = true`, and calls `persistSave()`,
   which writes the JSON back to localStorage. Unlocking is a pure read:
   `app.js`'s `isMissionUnlocked()` checks whether the previous mission is done.
3. **Storage.** `localStorage` lives inside the browser on that device. No
   network request happens at any point — which is why the app works offline,
   and also why progress does not follow a student to another device.

**Why two architectures?** The browser version trades shared data for zero
setup (perfect for phones and borrowed devices). The server version trades
setup effort for accounts and class-wide tracking. Same learning goal, same
game ideas, different placement of the "storage" layer.
