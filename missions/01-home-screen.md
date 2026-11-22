# Mission Card 01 — Home Screen + Player Name

## Goal
Build the app's home screen: a friendly title screen ("ICT Quest") where the student can type an optional name, and a list of the five learning missions (Computer Basics, Keyboard & Mouse, Word Processor, Spreadsheet, Presentation). Missions show as locked / unlocked / completed with stars. Completing missions comes later — in this mission the list is displayed with sensible default states.

## Limits
- Plain HTML + CSS + JavaScript only. No frameworks, no build tools, no server.
- No game logic yet — Mission 01 is only the home screen and saving the player name.
- Player name (if entered) must be saved to `localStorage` and restored on reload (see docs/savefile.md).
- Must look right on a phone-size screen first, then desktop (docs/style.md).
- Empty, loading, and broken-save cases handled: no name → "Hello, future ICT star!"; broken save → start fresh, no error text.

## My self-test (acceptance)
I can do this myself: open the app in the browser, type my name in the name box, close the browser completely, reopen the app — my name is still there, and the five missions are listed on the home screen.
