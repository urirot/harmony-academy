# Harmony & Ear Academy

A personal study app for Phase 1 of classical harmony: 18 lessons over six weeks,
three sessions a week, with a voice-leading checker, ear training and a keyboard.

## Using it

Double-click `dist/harmony-academy.html`. It is one self-contained file: no
server, no install, no network needed except for the course links. Copy it to
any Mac or PC.

Use Chrome or Edge. Both save progress and support a USB MIDI keyboard
("Connect MIDI" in the keyboard bar). Safari plays sound but has no Web MIDI.

Progress (checklists, journal, ear-training scores, practice time) is stored in
the browser that opened the file. To move it to another machine or browser, use
**Back up** there and **Restore** here.

## What is in it

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
- **Chord explorer**, **drone with scale degrees**, **journal**, **practice timer**.

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

The curriculum is data in `js/curriculum.js`. The tests run every progression
in it through the checker, so a mistyped voicing fails `npm test`.
