# Harmony & Ear Academy

A personal study app for Phase 1 of classical harmony: 18 lessons over six weeks,
three sessions a week, with a voice-leading checker, ear training and a keyboard.

## Using it

Open **https://urirot.github.io/harmony-academy/** (GitHub Pages, rebuilt on
every push to `main`).

Or offline: double-click `dist/harmony-academy.html`. It is one self-contained
file, so no server, no install, and no network except for the course links.
Copy it to any Mac or PC.

Use Chrome or Edge. Both save progress and support a USB MIDI keyboard
("Connect MIDI" in the keyboard bar). Safari plays sound but has no Web MIDI.

**Sign in with Google** (top right, on the web link) and your progress
follows you: checklists, notes, ear-training scores, practice time and start
date sync to your own record a few seconds after each change, and the newest
copy loads when you open the app or return to it. Each person who signs in
has their own record; nobody can read anyone else's. Which tab is open and
whether the keyboard shows stay per device.

Without signing in, progress stays in that browser only (and the offline file
never signs in). Clearing site data or a private window loses it.

**Save progress** (in the ⋯ menu, top right) downloads
`harmony-academy-progress-<date>.json`: a readable summary at the top, then
everything needed to restore. **Load progress** reads that file back, in any
browser or on any machine.

## What is in it

The left panel is the course: one week at a time (switch weeks in its
dropdown), with that week's lessons as rows and the selected lesson's ideas,
tasks and notes opened in place. Under the week it shows your start date, how
many calendar weeks have passed, and whether you are on pace, ahead or behind
(the start date is editable). ⇤ folds the panel into a rail. One tool sits on
the right (Lab, Workbench, Ear, Explore); on a phone everything becomes tabs.
The keyboard folds away with its bar at the bottom.

- **Course map**: 18 lessons. Each has a checklist that links the matching Open
  Music Theory chapter (with the page in the PDF), its worksheet, and the
  Edinburgh and Berklee Coursera videos where they fit.
- **Voice-leading lab**: every worked progression is analyzed for range,
  spacing, crossing, doubling, parallel and direct 5ths/8ves, overlap, augmented
  leaps and unresolved tendency tones. "Find the error" examples hide their
  errors until you reveal them. Drill mode has you play each chord yourself.
- **Workbench**: type your own SATB answers (one chord per line, e.g.
  `ii6: D5 A4 F4 F3`) and get the same analysis and playback.
- **Ear lab**: intervals (with random roots, up/down/together), scale degrees
  after a cadence, triad quality, inversions, seventh chords and cadence types.
  Items you miss come up more often.
- **Explore**: chord explorer and a drone with scale degrees. Plus per-lesson notes and a practice timer.

## Changing it

The source is plain ES modules: `index.html`, `styles.css`, `js/*.js`. Edit,
then rebuild the single file:

```
npm run build   # writes dist/harmony-academy.html
npm test        # theory engine, curriculum voicings, ear-training generators
```

To work on the source directly, serve the folder (`python3 -m http.server`)
and open http://localhost:8000. Modules do not load from `file://`, which is why
the build exists.

Sign-in and sync use Firebase (project `harmony-academy-urirot`, personal
Google account): Google Auth, and Firestore with one document per person at
`users/{uid}`. `firestore.rules` restricts each document to its owner; deploy
rule changes with `npx firebase-tools deploy --only firestore:rules`.

The curriculum is data in `js/curriculum.js`. The tests run every progression
in it through the checker, so a mistyped voicing fails `npm test`.
