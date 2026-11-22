# Save File Design — ICT Quest

## Where data lives
No server, no database. All progress is saved in the **browser's `localStorage`** on the student's own device.

## What is stored
A single JSON object under the key `ictquest_save_v1`:

```json
{
  "playerName": "Aisyah",
  "totalPoints": 120,
  "missions": {
    "computer-basics": { "completed": true, "stars": 3 },
    "keyboard-skills": { "completed": false, "stars": 0, "currentLevel": 2 }
  },
  "lastPlayed": "2026-11-22T10:30:00Z"
}
```

## Fields
- `playerName` — optional name shown on the welcome screen (no account, no password).
- `totalPoints` — sum of points earned across all missions.
- `missions` — one entry per mission: completed or not, stars earned (0–3), and the level the student is on.
- `lastPlayed` — timestamp, used to show "Continue where you left off".

## Rules
- Saved automatically after every level, not only on exit.
- If the save file is missing or broken, the app starts fresh and shows the friendly "start here" screen — it must never show an error dump.
- No personal data: no email, no phone, no photos. Anyone with the device can see progress — acceptable for a school MVP.
- Deleting browser data removes progress (this is the known trade-off of the no-server version).

## Versioning
The key includes `v1`. If the save format changes later, the app reads `v1`, migrates it, and writes `v2`.
