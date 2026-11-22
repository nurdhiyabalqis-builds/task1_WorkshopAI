# Project Brief — "ICT Quest"

## Problem
Many teenagers in rural areas have not been taught basic computer skills — how to use word processors, spreadsheets (Excel), presentation tools (PowerPoint), and general computer basics.

## Product idea
A simple, game-based web app that teaches basic computer/ICT skills. Students learn by playing: short lessons turned into mini-games with points, levels, and instant feedback — so learning feels fun, not like homework.

## First-release outcome
A student can open the app at school (or at home) and, after a teacher introduces a topic, practice and improve on their own. ICT subject performance improves through self-driven practice.

## Users
- **Student** — plays the games, earns points, progresses through levels. (Primary user.)
- **Teacher** — introduces topics in class; the app is the practice tool. (In the simplified version, the teacher does not need an account — they just share the app link.)
- **Developers** — build and maintain the app.

## Scope (v1)
Only the basics of computer use, e.g.:
1. Parts of a computer and what they do.
2. Mouse and keyboard skills.
3. Word processor basics (formatting text, saving a document).
4. Spreadsheet basics (cells, rows, simple formulas).
5. Presentation basics (slides, adding text and images).

## Out of scope (v1)
- Real Microsoft Word/Excel/PowerPoint integration.
- Teacher dashboards or class management.
- Online accounts, payments, live data feeds.

## Main user journey
1. Student opens the app in a browser (phone or computer).
2. Student picks or continues a learning mission (e.g. "Spreadsheet Basics").
3. Student plays a mini-game (quiz, drag-and-drop, match-the-cell, etc.).
4. App gives instant feedback: correct → points and encouragement; wrong → hint and retry.
5. Progress (score, completed levels) is saved so the student can continue next time.
6. **Failure cases:** no progress yet → app shows a friendly "start here" screen instead of blank data; a broken level can't trap the student — they can always go back to the mission list.

## Acceptance test (main outcome)
A new student opens the app, completes the first mission's mini-game, sees their score, closes the browser, reopens the app, and their progress is still there.
