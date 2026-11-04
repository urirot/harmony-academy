# Harmony & Ear Academy

A personal study app for Phase 1 of classical harmony: 18 lessons over six weeks,
three sessions a week: explanations you can hear, ear training set for each lesson, and a keyboard.

## Using it

Open **https://urirot.github.io/harmony-academy/** (GitHub Pages, rebuilt on
every push to `main`), and **Sign in with Google** at the top right. Each
person who signs in gets their own record: ticked tasks, drill scores, notes,
practice time and the start date (the day of the first sign-in) sync a few
seconds after each change, and the newest copy loads when the app opens or you
come back to it. Nobody can read anyone else's record. Which tab is open and
whether the keyboard shows stay per device.

Without signing in, progress stays in that browser only. The offline file,
`dist/harmony-academy.html`, opens by double-click and never signs in.

Use Chrome or Edge for a USB MIDI keyboard ("MIDI" in the keyboard bar);
Safari plays sound but has no Web MIDI.

## What is in it

The screen is split in half. On the left, the course: one week at a time
(dropdown, or ‹ › to step through lessons), the start date and whether you are
on pace, ahead or behind, and the open lesson:

- **Explanation** in short sections, with **Hear it** buttons that play each
  example (mistakes in red next to their fixes).
- **Ear training**: one to three drills chosen for the lesson, each 20
  questions with an 80% target. Passing counts toward finishing the lesson.
- **Session**: the outside work, each linked to the matching Open Music Theory
  chapter (with the page in the PDF), worksheet, and Edinburgh or Berklee
  Coursera videos.
- **Notes** behind the ✎ icon.

On the right: **Ear training** (lesson drills, or free practice in six drills:
intervals, scale degrees, triads, inversions, seventh chords, cadences; missed
items come up more often) and **Explore** (chords in any key, a drone with
scale degrees). The ⋯ menu has the account, practice totals, a **Timeline** of
what you did each day, and the sources.

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

The curriculum is data in `js/curriculum.js`. The tests run every example
progression through a voice-leading checker (so a mistyped voicing fails
`npm test`), and check that every lesson has an explanation and a valid
ear-training plan.
