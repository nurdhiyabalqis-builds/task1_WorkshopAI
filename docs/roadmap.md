# Roadmap — ICT Quest

## Mission 01 — Home screen + player name ✅ first to build
A welcoming home screen listing the five missions with lock/progress states, and an optional player name box.
**Test:** open the app, enter a name, refresh the page — the name is still shown.

## Mission 02 — Mission 1 mini-game: Computer Basics (quiz)
Multiple-choice quiz (5 questions) about parts of a computer. Points for correct answers, hints for wrong ones, results screen with stars.
**Test:** play the quiz once, earn points, refresh — points and stars are still saved.

## Mission 03 — Save/load polish + "continue where you left off"
Robust localStorage handling: broken/missing saves handled gracefully, resume screen, reset-progress button.
**Test:** complete 2 questions, close the tab fully, reopen — the app offers to continue at question 3.

## Mission 04 — Mission 2 mini-game: Keyboard & Mouse skills
Timed key-finding game ("press the F key") and a mouse-target-clicking game.
**Test:** finish one round, see score increase on the results screen.

## Mission 05 — Mission 3 mini-game: Word processor basics
Drag-and-drop / button game: bold this word, center this title, save the document.
**Test:** complete the level and get 2+ stars shown on the mission card.

## Mission 06 — Mission 4: Spreadsheet basics & Mission 5: Presentation basics
Cell-reference matching game (which cell is B2?) and slide-ordering game.
**Test:** both new missions appear on the home screen and can be completed.

## Mission 07 — Mobile polish + final acceptance run
Responsive check on phone-size screens, all five missions playable end-to-end.
**Test (acceptance):** new student completes first mission, closes browser, reopens — progress is still there. Works on phone and desktop.

## Later (out of MVP scope)
- Teacher dashboard / class codes.
- Offline install (PWA).
- Upgrading browser storage to a real server + accounts if the school needs shared progress.
