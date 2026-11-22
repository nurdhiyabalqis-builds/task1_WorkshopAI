# Stack — proposed (simplified, runs fully in the browser)

## The simplification
Your brief mentions students, teachers, and "who can access what". A full version of that needs accounts (logins), a server, and a database. For an MVP that a beginner can understand and run, we propose **skipping all of that**:

| Full version needs | Simplified version instead |
|---|---|
| Login accounts | No login — anyone who opens the app just plays |
| Server + database | Progress saved in the browser's `localStorage` (stays on that device) |
| Teacher dashboard | Teacher just opens/shares the app link in class |
| Payments / live data | Not needed at all |

**Trade-off to accept:** progress is saved per device/browser only. If a student switches computer or clears browser data, progress resets. That's fine for a school-lab MVP and can be upgraded later.

## Proposed stack
- **HTML + CSS + JavaScript (vanilla)** — no framework, no build tools. Each feature is a plain file you can open and read.
- **Runs from:** a single folder; open `index.html` in any browser, or serve it with any static file host later (e.g. GitHub Pages — free).
- **Storage:** browser `localStorage` for scores and completed missions (see docs/savefile.md).
- **No dependencies, no installs, no secrets, no cost.**

## Why this fits the brief
- Rural/school context: works offline once loaded, runs on cheap devices and phone browsers.
- Beginner learning goal: you can see and understand every moving part — there is no hidden server.
- The "how interface, server, storage work together" learning goal is answered in ARCHITECTURE.md later, explaining that v1 has no server and what a server would add.

## Awaiting your yes
Per the working agreement, this simplification (no logins, no database, browser-only storage) needs your approval before we build. See docs/brief.md and docs/savefile.md for what that means in practice.
