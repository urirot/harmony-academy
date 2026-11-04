// Phase 1 syllabus: classical tonal harmony and four-part voice leading,
// three sessions a week for six weeks.
//
// Sources, and how far each link was verified (2026-11-04):
// - Open Music Theory v2 (OMT) is the backbone. It is free, and its PDF is in
//   ~/Downloads, so every reading cites the PDF page as well. Chapter links use
//   slugs confirmed in search results; the rest open the book's own search.
//   Worksheet links are the ones printed in the PDF's Digital Workbook.
// - Edinburgh "Fundamentals of Music Theory" and Berklee "Developing Your
//   Musicianship" on Coursera. Video titles come from each course's public
//   syllabus. Links open the module page; lecture deep links need a login.
//   Coursera now gives a free preview of module 1 only.
//
// Every progression below is checked by test/theory.test.js: clean ones must
// produce no voice-leading issues, and "find the error" ones must contain the
// errors listed in `faulty`.

const OMT_BASE = 'https://viva.pressbooks.pub/openmusictheory';
const WK = 'https://viva.pressbooks.pub/app/uploads/sites/12';

const omt = (title, page, slug) => ({
  label: `OMT: ${title}`,
  url: slug ? `${OMT_BASE}/chapter/${slug}/` : `${OMT_BASE}/?s=${encodeURIComponent(title)}`,
  note: `PDF p. ${page}`,
});
const worksheet = (title, path) => ({ label: `Worksheet: ${title}`, url: `${WK}/${path}`, note: 'PDF' });
const edinburgh = (module, videos) => ({
  label: `Edinburgh M${module}: ${videos}`,
  url: `https://www.coursera.org/learn/edinburgh-music-theory/home/module/${module}`,
  note: 'Coursera',
});
const berklee = (module, videos) => ({
  label: `Berklee M${module}: ${videos}`,
  url: `https://www.coursera.org/learn/develop-your-musicianship/home/module/${module}`,
  note: 'Coursera',
});

export const SOURCES = [
  { name: 'Open Music Theory, v2', url: `${OMT_BASE}/`, note: 'Free. The PDF in your Downloads matches the page numbers cited here.' },
  { name: 'Edinburgh: Fundamentals of Music Theory', url: 'https://www.coursera.org/learn/edinburgh-music-theory', note: 'Coursera. Free preview covers module 1 only; modules 4–6 are the harmony part.' },
  { name: 'Berklee: Developing Your Musicianship', url: 'https://www.coursera.org/learn/develop-your-musicianship', note: 'Coursera. Interval ear training in the order M2/M3 → P4/P5 → M6/M7.' },
];

// SATB voicings are written soprano, alto, tenor, bass.
const C = { tonic: 'C', mode: 'major' };
const Am = { tonic: 'A', mode: 'minor' };

export const LESSONS = [
  // ---------------------------------------------------------------- week 1
  {
    id: 'w1l1', week: 1, n: 1,
    title: 'Scales, Keys & Intervals',
    goal: 'Spell major scales and name any interval by size and quality.',
    ideas: [
      'A major scale is W–W–H–W–W–W–H. Scale degrees ^1–^7 name each note by its job in the key.',
      'Interval size counts letter names (C–E is a 3rd); quality comes from the half steps (C–E is major, C–E♭ minor).',
      'Unisons, 4ths, 5ths and octaves are perfect; 2nds, 3rds, 6ths and 7ths are major or minor.',
    ],
    tasks: [
      { id: 'watch', kind: 'watch', minutes: 30, title: 'Edinburgh: scales, keys and intervals', detail: 'M1 “More on Scales”; M2 “Keys and Key Signatures” and “Intervals”.', links: [edinburgh(1, 'More on Scales'), edinburgh(2, 'Keys and Key Signatures, Intervals')] },
      { id: 'read', kind: 'read', minutes: 25, title: 'OMT: Major Scales and Intervals', detail: 'Skim scales; read Intervals closely, especially the “major scale” method for quality.', links: [omt('Major Scales, Scale Degrees, and Key Signatures', 125), omt('Intervals', 163)] },
      { id: 'sheet', kind: 'write', minutes: 20, title: 'Intervals worksheet #1', detail: 'Write and identify intervals. Check yourself by playing each one.', links: [worksheet('Intervals 1', '2021/10/WK-Intervals-1.pdf')] },
      { id: 'ear', kind: 'ear', minutes: 10, title: 'Anchor intervals: M3, P5, P8', detail: 'Ten minutes in the ear lab on the anchor set. Sing each interval before answering.', action: { ear: 'intervals', level: 'anchor' }, links: [berklee(1, 'Major 2nd and 3rd Intervals; Tonal Center')] },
    ],
    ear: { exercise: 'intervals', level: 'anchor' },
  },
  {
    id: 'w1l2', week: 1, n: 2,
    title: 'Triad Inversions & Voice Leading (I → V → I)',
    goal: 'Build triads in every inversion and connect I and V with the smallest possible moves.',
    ideas: [
      'Root position is 5/3, first inversion 6/3 (written 6), second inversion 6/4: the figures are intervals above the bass, not the root.',
      'Shortest path: keep common tones in the same voice and move the other voices by step.',
      'I and V share one note (G in C major). Hold it; the other upper voices step: C→B and E→D.',
      'The leading tone (^7, B in C) wants to rise to ^1. In the soprano it must.',
    ],
    tasks: [
      { id: 'watch', kind: 'watch', minutes: 20, title: 'Edinburgh: building triads and inversions', detail: 'M4 “Listening to Triads” and “Building Triads”; M5 “Chord Inversions”.', links: [edinburgh(4, 'Listening to Triads, Building Triads'), edinburgh(5, 'Chord Inversions')] },
      { id: 'read', kind: 'read', minutes: 25, title: 'OMT: Triads; Inversion and Figured Bass', detail: 'Triads (qualities, spelling); then the triad half of Inversion and Figured Bass.', links: [omt('Triads', 177), omt('Inversion and Figured Bass', 195, 'figured-bass')] },
      { id: 'sheet', kind: 'write', minutes: 15, title: 'Triadic inversions worksheet', detail: 'Identify and write triads in inversion with figures.', links: [worksheet('Inversion and Figured Bass 1', '2021/10/WK-Inversion-and-Figured-Bass-1.pdf')] },
      { id: 'play', kind: 'play', minutes: 10, title: 'Keyboard drill: I → V → I, hold the G', detail: 'Bass in the left hand, three voices in the right. Play it in C, G and F without looking. Use the drill mode in the lab to check C.', action: { progression: 'w1l2-ivi' } },
      { id: 'ear', kind: 'ear', minutes: 10, title: 'Ear: major vs. minor triads, then inversions', detail: 'Berklee M2 builds the same triads and adds P4 and P5.', action: { ear: 'triads', level: 'mm' }, links: [berklee(2, 'P4 and P5; Building Major and Minor Triads')] },
    ],
    progressions: [
      {
        id: 'w1l2-ivi', title: 'I – V – I (soprano holds G)', key: C,
        note: 'The model voicing. Soprano holds the common tone; alto and tenor step down and back; the bass carries the harmony.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['G4', 'E4', 'C4', 'C3'] },
          { rn: 'V', fn: 'D', voices: ['G4', 'D4', 'B3', 'G2'] },
          { rn: 'I', fn: 'T', voices: ['G4', 'E4', 'C4', 'C3'] },
        ],
      },
      {
        id: 'w1l2-ivi-ti', title: 'I – V – I (ti–do in the soprano)', key: C,
        note: 'Same chords, different spacing: now the leading tone is on top and rises to C. Alto holds the common tone.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
          { rn: 'V', fn: 'D', voices: ['B4', 'G4', 'D4', 'G2'] },
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
        ],
      },
      {
        id: 'w1l2-err', title: 'Find the errors: everything moves together', key: C, faulty: ['parallel'],
        note: 'Every voice drops a 4th at once. Listen for the hollow sound, then find which pairs move in parallel octaves and fifths.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
          { rn: 'V', fn: 'D', voices: ['G4', 'D4', 'B3', 'G2'] },
        ],
      },
    ],
    explorer: ['I', 'I6', 'I6/4', 'V', 'V6', 'V6/4'],
    ear: { exercise: 'triads', level: 'mm' },
  },
  {
    id: 'w1l3', week: 1, n: 3,
    title: 'Cadences & Contrary Motion',
    goal: 'Tell PAC, IAC and HC apart by ear, and see why outer voices prefer contrary motion.',
    ideas: [
      'PAC: V–I, both in root position, ^1 in the soprano over the final I. Change either condition and it is an IAC.',
      'HC: the phrase stops on V. It sounds open, like a comma.',
      'Four kinds of motion between two voices: contrary, similar, parallel, oblique (OMT definitions).',
      'Similar motion into a perfect 5th or octave in the outer voices is fine only if the soprano moves by step.',
    ],
    tasks: [
      { id: 'watch', kind: 'watch', minutes: 10, title: 'Edinburgh: cadences', detail: 'M5 “Cadences”; the M4 reading “Perfect and Imperfect Cadences”.', links: [edinburgh(5, 'Cadences'), edinburgh(4, 'Perfect and Imperfect Cadences (reading)')] },
      { id: 'read', kind: 'read', minutes: 25, title: 'OMT: Introduction to Harmony, Cadences, and Phrase Endings', detail: 'Read through “Writing Half Cadences”. Then the “Types of motion” section of Introduction to Species Counterpoint.', links: [omt('Introduction to Harmony, Cadences, and Phrase Endings', 401, 'intro-to-harmony'), omt('Introduction to Species Counterpoint (Types of motion)', 229, 'species-counterpoint')] },
      { id: 'sheet', kind: 'write', minutes: 20, title: 'Cadences worksheet', detail: 'Write authentic and half cadences with I and V only, in major and minor. Type your answers into the workbench to check them.', links: [worksheet('Introduction to Harmony, Cadences, and Phrase Endings', '2021/07/WK-Introduction-to-Harmon-Cadences-and-Phrase-Endings.pdf')] },
      { id: 'ear', kind: 'ear', minutes: 10, title: 'Ear: PAC, IAC or HC?', detail: 'Listen to the soprano on the last chord: do, or mi? Then is the bass ending on do or sol?', action: { ear: 'cadences', level: 'basic' } },
    ],
    progressions: [
      {
        id: 'w1l3-pac', title: 'PAC: I – V – I', key: C,
        note: 'Root-position V to root-position I with do on top. The strongest ending.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
          { rn: 'V', fn: 'D', voices: ['B4', 'G4', 'D4', 'G3'] },
          { rn: 'I', fn: 'T', label: 'I (PAC)', voices: ['C5', 'G4', 'E4', 'C3'] },
        ],
      },
      {
        id: 'w1l3-iac', title: 'IAC: mi in the soprano', key: C,
        note: 'Same root-position V–I, but the soprano ends on E (mi). Conclusive, but less final.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
          { rn: 'V', fn: 'D', voices: ['D5', 'G4', 'B3', 'G3'] },
          { rn: 'I', fn: 'T', label: 'I (IAC)', voices: ['E5', 'G4', 'C4', 'C3'] },
        ],
      },
      {
        id: 'w1l3-hc', title: 'HC: ending on V', key: C,
        note: 'Outer voices in contrary motion: soprano falls mi–re while the bass rises do–sol.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['E5', 'G4', 'C4', 'C3'] },
          { rn: 'V', fn: 'D', label: 'V (HC)', voices: ['D5', 'G4', 'B3', 'G3'] },
        ],
      },
      {
        id: 'w1l3-err', title: 'Find the error: outer voices', key: C, faulty: ['direct'],
        note: 'Soprano and bass both rise and land on an octave, and the soprano gets there by leap.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['E4', 'C4', 'G3', 'C3'] },
          { rn: 'V', fn: 'D', voices: ['G4', 'D4', 'B3', 'G3'] },
        ],
      },
    ],
    ear: { exercise: 'cadences', level: 'basic' },
  },

  // ---------------------------------------------------------------- week 2
  {
    id: 'w2l1', week: 2, n: 1,
    title: 'SATB Chord Construction',
    goal: 'Voice any diatonic triad in four parts with correct range, spacing and doubling.',
    ideas: [
      'Ranges: soprano C4–G5, alto G3–D5, tenor C3–G4, bass F2–D4.',
      'Spacing: no more than an octave between soprano–alto or alto–tenor; up to a 12th between tenor and bass.',
      'No voice crossing: S above A above T above B.',
      'Double the bass note of a triad by default. Never double the leading tone or a chordal 7th.',
    ],
    tasks: [
      { id: 'watch', kind: 'watch', minutes: 12, title: 'Edinburgh: triads in a key', detail: 'M4 “Elaborating Key: Triads and Scales”; M5 “Chord Names”.', links: [edinburgh(4, 'Elaborating Key: Triads and Scales'), edinburgh(5, 'Chord Names')] },
      { id: 'read', kind: 'read', minutes: 20, title: 'OMT: Roman Numerals and SATB Chord Construction', detail: 'Focus on “Writing Chords in SATB Style”: the six rules.', links: [omt('Roman Numerals and SATB Chord Construction', 208)] },
      { id: 'play', kind: 'play', minutes: 15, title: 'Voice all seven triads of C major', detail: 'Use the chord explorer to hear each one; then write each in the workbench in a different spacing and fix whatever it flags.', action: { explorer: true } },
      { id: 'spot', kind: 'play', minutes: 10, title: 'Spot the four construction errors', detail: 'Four chords, one error each. Name it before you reveal.', action: { progression: 'w2l1-errs' } },
    ],
    progressions: [
      {
        id: 'w2l1-errs', title: 'Find the errors: one per chord', key: C, standalone: true, faulty: ['spacing', 'doubling', 'crossing', 'range'],
        note: 'These are four separate chords, not a progression. Each breaks one SATB rule.',
        steps: [
          { rn: 'I', voices: ['E5', 'C5', 'G3', 'C3'] },
          { rn: 'V', voices: ['B4', 'G4', 'B3', 'G2'] },
          { rn: 'IV', voices: ['A4', 'C4', 'F4', 'F3'] },
          { rn: 'I', voices: ['G5', 'E5', 'C5', 'C4'] },
        ],
      },
      {
        id: 'w2l1-iivi', title: 'I – IV – V – I, cleanly voiced', key: C,
        note: 'Every chord doubles its bass. Watch the upper voices: C holds, then everything steps.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
          { rn: 'IV', fn: 'PD', voices: ['C5', 'A4', 'F4', 'F3'] },
          { rn: 'V', fn: 'D', voices: ['B4', 'G4', 'D4', 'G3'] },
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
        ],
      },
    ],
    explorer: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    ear: { exercise: 'triads', level: 'mmd' },
  },
  {
    id: 'w2l2', week: 2, n: 2,
    title: 'Motion Types & Parallel Perfects',
    goal: 'Hear and avoid parallel 5ths and octaves; use contrary motion to get out of them.',
    ideas: [
      'Parallel perfect 5ths and octaves make two voices sound like one. Contrary 5ths/octaves count too.',
      'Parallel 3rds and 6ths are good: they keep voices independent while moving together.',
      'When the bass moves by step (I–ii, IV–V), move the upper voices the other way.',
      'First species: one note against one, consonances only, start and end on perfect intervals.',
    ],
    tasks: [
      { id: 'read', kind: 'read', minutes: 25, title: 'OMT: Introduction to Species Counterpoint; First-Species Counterpoint', detail: 'Rules for melodic and harmonic writing; then first species.', links: [omt('Introduction to Species Counterpoint', 227, 'species-counterpoint'), omt('First-Species Counterpoint', 235, 'first-species-counterpoint')] },
      { id: 'sheet', kind: 'write', minutes: 25, title: 'Cantus firmus and first species', detail: 'Critique and write a cantus firmus, then a first-species line against it. Play both lines on the keyboard.', links: [worksheet('Cantus Firmus A', '2019/05/WK-Cantus-Firmus-A.pdf'), worksheet('First Species Counterpoint A', '2020/01/WK-First-species-Counterpoint-A.pdf')] },
      { id: 'spot', kind: 'play', minutes: 5, title: 'Find the parallels, then hear the fix', detail: 'Compare the faulty I–ii with the version in contrary motion.', action: { progression: 'w2l2-err' } },
      { id: 'ear', kind: 'ear', minutes: 10, title: 'Ear: harmonic intervals', detail: 'Switch direction to “together”: perfect intervals sound hollow, 3rds and 6ths sweet.', action: { ear: 'intervals', level: 'berklee', direction: 'harmonic' }, links: [berklee(3, 'Major 6th and Major 7th Intervals')] },
    ],
    progressions: [
      {
        id: 'w2l2-err', title: 'Find the errors: I – ii in parallel', key: C, faulty: ['parallel'],
        note: 'All four voices rise a step. Which pairs make parallel perfects?',
        steps: [
          { rn: 'I', fn: 'T', voices: ['G4', 'E4', 'C4', 'C3'] },
          { rn: 'ii', fn: 'PD', voices: ['A4', 'F4', 'D4', 'D3'] },
        ],
      },
      {
        id: 'w2l2-fix', title: 'The fix: I – ii – V – I in contrary motion', key: C,
        note: 'Bass rises C–D while the upper voices fall. Then ii–V–I by common tone and step.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['G4', 'E4', 'C4', 'C3'] },
          { rn: 'ii', fn: 'PD', voices: ['F4', 'D4', 'A3', 'D3'] },
          { rn: 'V', fn: 'D', voices: ['G4', 'D4', 'B3', 'G3'] },
          { rn: 'I', fn: 'T', voices: ['G4', 'E4', 'C4', 'C3'] },
        ],
      },
    ],
    ear: { exercise: 'intervals', level: 'berklee', direction: 'harmonic' },
  },
  {
    id: 'w2l3', week: 2, n: 3,
    title: 'Minor Keys & the Raised Leading Tone',
    goal: 'Write i–iv–V–i in minor with the raised ^7, and avoid the augmented 2nd.',
    ideas: [
      'Minor-key V and vii° use harmonic minor: raise ^7 (G♯ in A minor) so it leads to ^1.',
      'That raised ^7 sits an augmented 2nd above ^6 (F–G♯). Never move a voice F→G♯ directly.',
      'In iv–V, move ^6 down to ^5 (F→E) and let another voice take the G♯.',
    ],
    tasks: [
      { id: 'watch', kind: 'watch', minutes: 10, title: 'Edinburgh: Minor Keys', detail: 'M2 “Minor Keys” and the reading “Minor Keys and Minor Scales”.', links: [edinburgh(2, 'Minor Keys')] },
      { id: 'read', kind: 'read', minutes: 20, title: 'OMT: Minor Scales, Scale Degrees, and Key Signatures', detail: 'Natural, harmonic and melodic minor; why harmony uses harmonic minor.', links: [omt('Minor Scales, Scale Degrees, and Key Signatures', 136)] },
      { id: 'sheet', kind: 'write', minutes: 15, title: 'Minor scales worksheet', detail: 'Write the three forms of minor.', links: [worksheet('Minor Scales 1', '2021/10/WK-Minor-Scales-1.pdf')] },
      { id: 'spot', kind: 'play', minutes: 10, title: 'Find the two errors in iv – V', detail: 'One melodic, one harmonic.', action: { progression: 'w2l3-err' } },
      { id: 'ear', kind: 'ear', minutes: 10, title: 'Ear: major, minor or diminished?', detail: 'vii° and ii° in minor are diminished: tense and narrow.', action: { ear: 'triads', level: 'mmd' } },
    ],
    progressions: [
      {
        id: 'w2l3-ivi', title: 'i – V – i in A minor', key: Am,
        note: 'G♯ is the raised leading tone. It falls from A, then resolves back up.',
        steps: [
          { rn: 'i', fn: 'T', voices: ['A4', 'E4', 'C4', 'A2'] },
          { rn: 'V', fn: 'D', voices: ['G#4', 'E4', 'B3', 'E3'] },
          { rn: 'i', fn: 'T', voices: ['A4', 'E4', 'C4', 'A2'] },
        ],
      },
      {
        id: 'w2l3-iv', title: 'i – iv – V – i in A minor', key: Am,
        note: 'F (^6) falls to E; the G♯ appears in the soprano, approached from A.',
        steps: [
          { rn: 'i', fn: 'T', voices: ['A4', 'E4', 'C4', 'A2'] },
          { rn: 'iv', fn: 'PD', voices: ['A4', 'F4', 'D4', 'D3'] },
          { rn: 'V', fn: 'D', voices: ['G#4', 'E4', 'B3', 'E3'] },
          { rn: 'i', fn: 'T', voices: ['A4', 'E4', 'C4', 'A2'] },
        ],
      },
      {
        id: 'w2l3-err', title: 'Find the errors: iv – V in A minor', key: Am, faulty: ['melodic', 'parallel'],
        note: 'Two problems: one voice makes the forbidden leap, and two voices move in parallel perfects.',
        steps: [
          { rn: 'iv', fn: 'PD', voices: ['D5', 'F4', 'A3', 'D3'] },
          { rn: 'V', fn: 'D', voices: ['B4', 'G#4', 'B3', 'E3'] },
        ],
      },
    ],
    explorer: ['i', 'ii°', 'III', 'iv', 'V', 'VI', 'vii°'],
    explorerKey: Am,
    ear: { exercise: 'triads', level: 'mmd' },
  },

  // ---------------------------------------------------------------- week 3
  {
    id: 'w3l1', week: 3, n: 1,
    title: 'Seventh Chords',
    goal: 'Spell and hear the five common seventh-chord qualities.',
    ideas: [
      'Add a 7th above the root of a triad: MM7 (I7, IV7), Mm7 (V7 only, in both major and minor), mm7 (ii7, iii7, vi7), ø7 (vii in major), °7 (vii in minor).',
      'The dominant seventh (Mm7) contains a tritone between ^7 and ^4: that is the tension that drives V7 to I.',
      'Seventh chords have four notes, so in four voices nothing is doubled.',
    ],
    tasks: [
      { id: 'watch', kind: 'watch', minutes: 20, title: 'Edinburgh and Berklee: seventh chords', detail: 'Edinburgh M4 “Seventh Chords”; Berklee M4 “7th Chords” and “7th Chords Practice”.', links: [edinburgh(4, 'Seventh Chords'), berklee(4, '7th Chords; 7th Chords Practice')] },
      { id: 'read', kind: 'read', minutes: 20, title: 'OMT: Seventh Chords', detail: 'Qualities, nomenclature, and the listening section.', links: [omt('Seventh Chords', 186)] },
      { id: 'sheet', kind: 'write', minutes: 15, title: 'Seventh chords worksheet #1', links: [worksheet('Seventh Chords 1', '2021/10/WK-Seventh-Chords-1.pdf')] },
      { id: 'ear', kind: 'ear', minutes: 10, title: 'Ear: seventh-chord quality', detail: 'Start with dominant vs. major 7th; add the others when you pass 80%.', action: { ear: 'sevenths', level: 'basic' } },
    ],
    explorer: ['I7', 'ii7', 'iii7', 'IV7', 'V7', 'vi7', 'viiø7'],
    ear: { exercise: 'sevenths', level: 'basic' },
  },
  {
    id: 'w3l2', week: 3, n: 2,
    title: 'Resolving V7 → I',
    goal: 'Resolve the dominant seventh: 7th down by step, leading tone up.',
    ideas: [
      'The chordal 7th (F in C major) resolves down by step to E.',
      'The leading tone (B) resolves up to C, at least when it is in the soprano.',
      'A complete V7 in root position resolves to an incomplete I (three roots and a third). An incomplete V7 (no 5th, doubled root) resolves to a complete I.',
      'Approach the 7th by step or as a common tone.',
    ],
    tasks: [
      { id: 'read', kind: 'read', minutes: 25, title: 'OMT: Strengthening Endings with V7', detail: 'The default resolution, then the alternatives.', links: [omt('Strengthening Endings with V7', 410, 'strengthening-endings-with-v7')] },
      { id: 'sheet', kind: 'write', minutes: 25, title: 'V7 worksheet', detail: 'Write and resolve V7 chords. Check each answer in the workbench.', links: [worksheet('Strengthening Endings with V7', '2021/07/WK-Strengthening-Endings-with-V7.pdf')] },
      { id: 'play', kind: 'play', minutes: 10, title: 'Keyboard drill: both V7 resolutions', detail: 'Play the complete and the incomplete version in C, then in G and F.', action: { progression: 'w3l2-complete' } },
    ],
    progressions: [
      {
        id: 'w3l2-complete', title: 'Complete V7 → incomplete I', key: C,
        note: 'F steps down to E, B rises to C, D steps to C: the final I has three Cs and an E.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['E4', 'C4', 'G3', 'C3'] },
          { rn: 'V7', fn: 'D', voices: ['F4', 'D4', 'B3', 'G2'] },
          { rn: 'I', fn: 'T', voices: ['E4', 'C4', 'C4', 'C3'] },
        ],
      },
      {
        id: 'w3l2-incomplete', title: 'Incomplete V7 → complete I', key: C,
        note: 'No D in the V7; the doubled G holds into the I, which comes out complete.',
        steps: [
          { rn: 'V7', fn: 'D', voices: ['B4', 'F4', 'G3', 'G2'] },
          { rn: 'I', fn: 'T', voices: ['C5', 'E4', 'G3', 'C3'] },
        ],
      },
      {
        id: 'w3l2-err', title: 'Find the error: V7 → I', key: C, faulty: ['tendency'],
        note: 'Everything moves by step and there are no parallels. One note still goes the wrong way.',
        steps: [
          { rn: 'V7', fn: 'D', voices: ['F4', 'D4', 'B3', 'G2'] },
          { rn: 'I', fn: 'T', voices: ['G4', 'E4', 'C4', 'C3'] },
        ],
      },
    ],
    ear: { exercise: 'cadences', level: 'basic' },
  },
  {
    id: 'w3l3', week: 3, n: 3,
    title: 'Figured Bass & Inverted V7',
    goal: 'Read figures for every triad and seventh-chord inversion and realize them at the keyboard.',
    ideas: [
      'Seventh-chord inversions: 7 (root), 6/5 (3rd in bass), 4/3 (5th in bass), 4/2 (7th in bass).',
      'Figures are intervals above the bass; accidentals in figures apply to that interval above the bass.',
      'Inverted dominants keep the same tendencies: the 7th still falls, the leading tone still rises.',
    ],
    tasks: [
      { id: 'watch', kind: 'watch', minutes: 10, title: 'Edinburgh: Chord Inversions, Chord Names', detail: 'M5. Rewatch Chord Inversions now that you know seventh chords.', links: [edinburgh(5, 'Chord Inversions, Chord Names')] },
      { id: 'read', kind: 'read', minutes: 20, title: 'OMT: Inversion and Figured Bass (seventh chords)', detail: 'Seventh Chord Inversion and Figures; Other Figured Bass Symbols.', links: [omt('Inversion and Figured Bass', 201, 'figured-bass')] },
      { id: 'sheet', kind: 'write', minutes: 15, title: 'Seventh chord inversions worksheet', links: [worksheet('Inversion and Figured Bass 2', '2021/10/WK-Inversion-and-Figured-Bass-2.pdf')] },
      { id: 'ear', kind: 'ear', minutes: 10, title: 'Ear: which inversion?', detail: 'Listen to the bass only: is it the root, the 3rd, or the 5th?', action: { ear: 'inversions', level: 'triads' } },
    ],
    progressions: [
      {
        id: 'w3l3-v65', title: 'I – V6/5 – I', key: C,
        note: 'The leading tone is in the bass (B2→C3). The 7th, F, steps down in the tenor.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
          { rn: 'V6/5', fn: 'D', voices: ['D5', 'G4', 'F4', 'B2'] },
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
        ],
      },
    ],
    explorer: ['V7', 'V6/5', 'V4/3', 'V4/2', 'I', 'I6', 'I6/4'],
    ear: { exercise: 'inversions', level: 'triads' },
  },

  // ---------------------------------------------------------------- week 4
  {
    id: 'w4l1', week: 4, n: 1,
    title: 'Strong Predominants: IV and ii6',
    goal: 'Approach V from IV or ii6 without parallels.',
    ideas: [
      'Predominants (PD) lead away from tonic and toward dominant. IV and ii(6) are the strong ones.',
      'ii6 has ^4 in the bass, like IV. Double the bass (F) in ii6.',
      'IV–V is the classic parallel trap: the bass steps up, so move the upper voices down.',
    ],
    tasks: [
      { id: 'watch', kind: 'watch', minutes: 15, title: 'Edinburgh and Berklee: primary chords and I–IV–V', detail: 'Edinburgh M1 “Primary Chords”, M5 “Common Chord Progressions”; Berklee M2 “I IV V Chord Progression”.', links: [edinburgh(5, 'Common Chord Progressions'), berklee(2, 'I IV V Chord Progression')] },
      { id: 'read', kind: 'read', minutes: 20, title: 'OMT: Strengthening Endings with Strong Predominants', links: [omt('Strengthening Endings with Strong Predominants', 415, 'strong-predominants')] },
      { id: 'sheet', kind: 'write', minutes: 25, title: 'Strong predominants worksheet', detail: 'Part writing from Roman numerals and figures. Check every answer in the workbench.', links: [worksheet('Strengthening Endings with Strong Predominants', '2021/07/WK-Strengthening-Endings-with-Strong-Predominants.pdf')] },
      { id: 'spot', kind: 'play', minutes: 5, title: 'Find the errors in IV – V', action: { progression: 'w4l1-err' } },
    ],
    progressions: [
      {
        id: 'w4l1-ii6', title: 'I – ii6 – V – I', key: C,
        note: 'ii6 doubles its bass F. The leading tone is in the alto, so it may drop to G for a complete final chord.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['E5', 'C5', 'G4', 'C3'] },
          { rn: 'ii6', fn: 'PD', voices: ['D5', 'A4', 'F4', 'F3'] },
          { rn: 'V', fn: 'D', voices: ['D5', 'B4', 'D4', 'G3'] },
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
        ],
      },
      {
        id: 'w4l1-err', title: 'Find the errors: IV – V', key: C, faulty: ['parallel'],
        note: 'All four voices rise by step. Two pairs are in trouble.',
        steps: [
          { rn: 'IV', fn: 'PD', voices: ['C5', 'A4', 'F4', 'F3'] },
          { rn: 'V', fn: 'D', voices: ['D5', 'B4', 'G4', 'G3'] },
        ],
      },
    ],
    explorer: ['IV', 'ii', 'ii6', 'V', 'I'],
    ear: { exercise: 'degrees', level: 'do-sol' },
  },
  {
    id: 'w4l2', week: 4, n: 2,
    title: 'The Phrase Model: T – PD – D – T',
    goal: 'Label harmonic function in a phrase and hear where the cadence lands.',
    ideas: [
      'Functions flow left to right: tonic → predominant → dominant → tonic. Going backward (V–IV) is rare in classical style.',
      'vi and iii are weak predominants: they move away from tonic toward a strong predominant.',
      'Analysis order: find the cadences first, then label functions, then Roman numerals.',
    ],
    tasks: [
      { id: 'read', kind: 'read', minutes: 20, title: 'OMT: Performing Harmonic Analysis Using the Phrase Model', links: [omt('Performing Harmonic Analysis Using the Phrase Model', 436, 'performing-harmonic-analysis-using-the-phrase-model')] },
      { id: 'analyze', kind: 'write', minutes: 30, title: 'Analyze the Bach Prelude in C (BWV 846)', detail: 'Edinburgh M6 reading. Roman numerals for mm. 1–11, then mark T/PD/D. Play each bar as a block chord.', links: [edinburgh(6, 'Harmonic Analysis: Bach Prelude in C Major')] },
      { id: 'ear', kind: 'ear', minutes: 10, title: 'Ear: cadence type', action: { ear: 'cadences', level: 'full' } },
    ],
    progressions: [
      {
        id: 'w4l2-circle', title: 'I – vi – ii – V – I', key: C,
        note: 'Bass falls in thirds and fifths. Common tones carry the upper voices from chord to chord.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
          { rn: 'vi', fn: 'PD', voices: ['C5', 'A4', 'E4', 'A2'] },
          { rn: 'ii', fn: 'PD', voices: ['D5', 'A4', 'F4', 'D3'] },
          { rn: 'V', fn: 'D', voices: ['D5', 'B4', 'G4', 'G3'] },
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
        ],
      },
      {
        id: 'w4l2-hc', title: 'I – IV – V (half cadence)', key: C,
        note: 'T – PD – D and stop: the phrase asks a question.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
          { rn: 'IV', fn: 'PD', voices: ['C5', 'A4', 'F4', 'F3'] },
          { rn: 'V', fn: 'D', label: 'V (HC)', voices: ['B4', 'G4', 'D4', 'G3'] },
        ],
      },
    ],
    ear: { exercise: 'cadences', level: 'full' },
  },
  {
    id: 'w4l3', week: 4, n: 3,
    title: 'The Cadential 6/4',
    goal: 'Write and hear the cadential 6/4 as a decoration of V.',
    ideas: [
      'Cadential 6/4 looks like I6/4 but functions as V: the 6th and 4th above the bass are embellishing tones that fall to the 5th and 3rd.',
      'Label it V6/4–5/3 (or V8–7 6–5 4–3 when it goes to V7). It falls on a stronger beat than its resolution.',
      'Double the bass (^5) and approach it from a predominant.',
    ],
    tasks: [
      { id: 'read', kind: 'read', minutes: 20, title: 'OMT: Strengthening Endings with Cadential 6/4', links: [omt('Strengthening Endings with Cadential 6/4', 426, 'cadential-64')] },
      { id: 'sheet', kind: 'write', minutes: 25, title: 'Cadential 6/4 worksheet', detail: 'Includes unfigured bass exercises.', links: [worksheet('Strengthening Endings with Cadential 6/4', '2021/07/WK-Strengthening-Endings-with-Cadential-64.pdf')] },
      { id: 'play', kind: 'play', minutes: 10, title: 'Keyboard drill: I – IV – V6/4–5/3 – I', detail: 'In C, G and D. The upper voices step down 6–5 and 4–3 over a held G.', action: { progression: 'w4l3-cad64' } },
    ],
    progressions: [
      {
        id: 'w4l3-cad64', title: 'I – IV – V6/4–5/3 – I', key: C,
        note: 'Over the held G in the bass, C falls to B (4–3) and E falls to D (6–5).',
        steps: [
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
          { rn: 'IV', fn: 'PD', voices: ['C5', 'A4', 'F4', 'F3'] },
          { rn: 'I6/4', fn: 'D', label: 'V6/4', voices: ['C5', 'G4', 'E4', 'G3'] },
          { rn: 'V', fn: 'D', label: 'V5/3', voices: ['B4', 'G4', 'D4', 'G3'] },
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
        ],
      },
    ],
    ear: { exercise: 'cadences', level: 'full' },
  },

  // ---------------------------------------------------------------- week 5
  {
    id: 'w5l1', week: 5, n: 1,
    title: 'Embellishing Tones',
    goal: 'Name passing tones, neighbors, suspensions and appoggiaturas, and write a 4–3 suspension.',
    ideas: [
      'Stepwise: passing tone (step–step, same direction), neighbor (step away and back).',
      'With a leap: appoggiatura (leap in, step out), escape tone (step in, leap out).',
      'Static: suspension (prepared, held over the chord change, resolves down by step), anticipation, pedal.',
    ],
    tasks: [
      { id: 'read', kind: 'read', minutes: 25, title: 'OMT: Embellishing Tones', links: [omt('Embellishing Tones', 420)] },
      { id: 'sheet', kind: 'write', minutes: 25, title: 'Embellishing tones worksheet', detail: 'Write embellishing tones in two voices; label them in an excerpt.', links: [worksheet('Embellishing Tones', '2021/07/WK-Embellishing-Tones.pdf')] },
      { id: 'play', kind: 'play', minutes: 10, title: 'Hear the 4–3 suspension', detail: 'C is prepared in IV, held into V, then falls to B.', action: { progression: 'w5l1-sus' } },
    ],
    progressions: [
      {
        id: 'w5l1-sus', title: 'A 4–3 suspension at the cadence', key: C,
        note: 'Preparation (C in IV), suspension (C held over G), resolution (C→B).',
        steps: [
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
          { rn: 'IV', fn: 'PD', voices: ['C5', 'A4', 'F4', 'F3'] },
          { fn: 'D', label: 'V4–', voices: ['C5', 'G4', 'D4', 'G3'] },
          { rn: 'V', fn: 'D', label: '–3', voices: ['B4', 'G4', 'D4', 'G3'] },
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
        ],
      },
    ],
    ear: { exercise: 'degrees', level: 'all' },
  },
  {
    id: 'w5l2', week: 5, n: 2,
    title: 'Prolonging Tonic: V6, V4/3, V4/2',
    goal: 'Extend the opening tonic with inverted dominants that move by step in the bass.',
    ideas: [
      'Inverted dominants give the bass a melody: I–V6–I (do–ti–do), I–V4/3–I6 (do–re–mi), V–V4/2–I6 (sol–fa–mi).',
      'These are prolongations, not cadences: the phrase is still at its beginning.',
      'In V4/2 the 7th is in the bass, so the bass must fall by step to the 3rd of I6.',
    ],
    tasks: [
      { id: 'read', kind: 'read', minutes: 25, title: 'OMT: Prolonging Tonic at Phrase Beginnings with V6 and Inverted V7s', links: [omt('Prolonging Tonic at Phrase Beginnings with V6 and Inverted V7s', 431, 'inverted-v7s')] },
      { id: 'sheet', kind: 'write', minutes: 25, title: 'Tonic prolongation worksheet', links: [worksheet('Prolonging Tonic at Phrase Beginnings Using V6 and Inverted V7', '2021/07/WK-Prolonging-Tonic-at-Phrase-Beginnings-Using-V6-and-Inverted-V7.pdf')] },
      { id: 'play', kind: 'play', minutes: 10, title: 'Keyboard drill: the three bass patterns', detail: 'do–ti–do, do–re–mi, sol–fa–mi. Say the bass solfège aloud as you play.', action: { progression: 'w5l2-v6' } },
    ],
    progressions: [
      {
        id: 'w5l2-v6', title: 'I – V6 – I (do–ti–do)', key: C,
        note: 'The leading tone is in the bass and is not doubled. Soprano do–re–do against bass do–ti–do: contrary motion both ways.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
          { rn: 'V6', fn: 'D', voices: ['D5', 'G4', 'D4', 'B2'] },
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
        ],
      },
      {
        id: 'w5l2-v43', title: 'I – V4/3 – I6 (do–re–mi)', key: C,
        note: 'A passing V4/3. Soprano and bass move in contrary motion, then rise together in parallel 6ths.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
          { rn: 'V4/3', fn: 'D', voices: ['B4', 'G4', 'F4', 'D3'] },
          { rn: 'I6', fn: 'T', voices: ['C5', 'G4', 'E4', 'E3'] },
        ],
      },
      {
        id: 'w5l2-v42', title: 'V – V4/2 – I6 (sol–fa–mi)', key: C,
        note: 'The bass passes down through the 7th, F, which resolves to E.',
        steps: [
          { rn: 'V', fn: 'D', voices: ['D5', 'B4', 'G4', 'G3'] },
          { rn: 'V4/2', fn: 'D', voices: ['D5', 'B4', 'G4', 'F3'] },
          { rn: 'I6', fn: 'T', voices: ['E5', 'C5', 'G4', 'E3'] },
        ],
      },
    ],
    explorer: ['V6', 'V6/5', 'V4/3', 'V4/2', 'I6'],
    ear: { exercise: 'inversions', level: 'sevenths' },
  },
  {
    id: 'w5l3', week: 5, n: 3,
    title: 'The Leading-Tone Chord & 6/4 Types',
    goal: 'Use vii°6 and passing/pedal 6/4 chords to connect tonic chords.',
    ideas: [
      'vii°6 substitutes for V4/3 between I and I6. Double the bass (^2), the chord’s 3rd.',
      'Passing 6/4: bass moves by step through it (I – V6/4 – I6).',
      'Pedal (neighbor) 6/4: the bass holds while upper voices step up and back (I – IV6/4 – I).',
      'Cadential, passing, pedal and arpeggiated: 6/4 chords appear only in these four roles.',
    ],
    tasks: [
      { id: 'read', kind: 'read', minutes: 25, title: 'OMT: the leading-tone chord; 6/4 chords as prolongation', links: [omt('Prolongation at Phrase Beginnings using the Leading-Tone Chord', 439), omt('6/4 Chords as Forms of Prolongation', 443)] },
      { id: 'sheet', kind: 'write', minutes: 20, title: 'Leading-tone chord worksheet', links: [worksheet('Prolongation Using the Leading-Tone Chord', '2021/07/WK-Prolongation-at-Phrase-Endings-Using-the-Leading-Tone-Chord.pdf')] },
      { id: 'ear', kind: 'ear', minutes: 10, title: 'Ear: inversions with sevenths', action: { ear: 'inversions', level: 'sevenths' } },
    ],
    progressions: [
      {
        id: 'w5l3-vii6', title: 'I – vii°6 – I6', key: C,
        note: 'vii°6 doubles its bass D. The bass climbs do–re–mi under it.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
          { rn: 'vii°6', fn: 'D', voices: ['B4', 'F4', 'D4', 'D3'] },
          { rn: 'I6', fn: 'T', voices: ['C5', 'G4', 'C4', 'E3'] },
        ],
      },
      {
        id: 'w5l3-p64', title: 'Passing 6/4: I – V6/4 – I6', key: C,
        note: 'Same bass line as the last example; V6/4 passes, doubling its bass.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
          { rn: 'V6/4', fn: 'D', label: 'V6/4 (passing)', voices: ['B4', 'G4', 'D4', 'D3'] },
          { rn: 'I6', fn: 'T', voices: ['C5', 'G4', 'C4', 'E3'] },
        ],
      },
      {
        id: 'w5l3-n64', title: 'Pedal 6/4: I – IV6/4 – I', key: C,
        note: 'Bass and tenor hold C; soprano and alto step up and back in parallel 3rds.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['G4', 'E4', 'C4', 'C3'] },
          { rn: 'IV6/4', fn: 'T', label: 'IV6/4 (pedal)', voices: ['A4', 'F4', 'C4', 'C3'] },
          { rn: 'I', fn: 'T', voices: ['G4', 'E4', 'C4', 'C3'] },
        ],
      },
    ],
    explorer: ['vii°', 'vii°6', 'I6/4', 'IV6/4', 'V6/4'],
    ear: { exercise: 'inversions', level: 'sevenths' },
  },

  // ---------------------------------------------------------------- week 6
  {
    id: 'w6l1', week: 6, n: 1,
    title: 'Deceptive Motion & La in the Bass',
    goal: 'Write V–vi with the doubled third, and hear it as a cadence that dodges.',
    ideas: [
      'Deceptive motion: V goes to vi instead of I. The bass rises sol–la; the leading tone still rises to do.',
      'In V–vi, double the third of vi (^1) so the leading tone can resolve and the other voices avoid parallels.',
      'After a deceptive move, the phrase usually tries again and ends with a PAC.',
    ],
    tasks: [
      { id: 'read', kind: 'read', minutes: 20, title: 'OMT: La (Scale Degree 6) in the Bass', links: [omt('La (Scale Degree 6) in the Bass at Beginnings, Middles, and Endings', 451)] },
      { id: 'sheet', kind: 'write', minutes: 25, title: 'La in the bass worksheet', links: [worksheet('La in the bass', '2021/07/WK-La-in-the-bass.pdf')] },
      { id: 'ear', kind: 'ear', minutes: 10, title: 'Ear: cadences with deceptive', action: { ear: 'cadences', level: 'full' } },
    ],
    progressions: [
      {
        id: 'w6l1-dc', title: 'I – IV – V – vi … ii6 – V – I', key: C,
        note: 'The phrase dodges at vi (doubled C), then tries again through ii6 and lands on I.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
          { rn: 'IV', fn: 'PD', voices: ['C5', 'A4', 'F4', 'F3'] },
          { rn: 'V', fn: 'D', voices: ['B4', 'G4', 'D4', 'G3'] },
          { rn: 'vi', fn: 'T', label: 'vi (deceptive)', voices: ['C5', 'E4', 'C4', 'A3'] },
          { rn: 'ii6', fn: 'PD', voices: ['D5', 'F4', 'A3', 'F3'] },
          { rn: 'V', fn: 'D', voices: ['D5', 'D4', 'B3', 'G3'] },
          { rn: 'I', fn: 'T', voices: ['C5', 'E4', 'C4', 'C3'] },
        ],
      },
    ],
    ear: { exercise: 'cadences', level: 'full' },
  },
  {
    id: 'w6l2', week: 6, n: 2,
    title: 'Harmonizing a Melody',
    goal: 'Harmonize a soprano line in four parts using everything from weeks 1–5.',
    ideas: [
      'Start from the cadence and work backward: which chords contain each melody note, and which fit the phrase model?',
      'Write the bass next, against the soprano: aim for contrary motion and avoid parallel perfects between them.',
      'Fill in alto and tenor last, by shortest path.',
    ],
    tasks: [
      { id: 'watch', kind: 'watch', minutes: 15, title: 'Edinburgh: Harmonising a Melody', detail: 'M4, the longest video in the course (12:53).', links: [edinburgh(4, 'Harmonising a Melody')] },
      { id: 'write', kind: 'write', minutes: 35, title: 'Harmonize do–re–mi–fa–mi–re–do', detail: 'Soprano C5 D5 E5 F5 E5 D5 C5 in C major, one chord per note, ending with a PAC. Type it into the workbench and fix everything it flags. Then try it in A minor (A–B–C–D–C–B–A).', action: { workbench: true } },
      { id: 'ear', kind: 'ear', minutes: 10, title: 'Ear: scale degrees ^1–^7', action: { ear: 'degrees', level: 'all' } },
    ],
    ear: { exercise: 'degrees', level: 'all' },
  },
  {
    id: 'w6l3', week: 6, n: 3,
    title: 'Phase 1 Checkpoint',
    goal: 'Show you can write, play and hear everything in Phase 1 without help.',
    ideas: [
      'Write: I – ii6 – V7 – I and I – IV – V6/4–5/3 – I in C, G, F, D and B♭, checked in the workbench.',
      'Play: every progression in this course, from memory, in C and one other key.',
      'Hear: 80% or better on cadences, inversions and seventh-chord quality.',
    ],
    tasks: [
      { id: 'write', kind: 'write', minutes: 30, title: 'Two progressions in five keys', detail: 'Use the workbench’s key menu for each key; no flags allowed.', action: { workbench: true } },
      { id: 'play', kind: 'play', minutes: 15, title: 'Keyboard: replay the course from memory', detail: 'Drill mode on any progression; aim for every chord right the first time.' },
      { id: 'ear', kind: 'ear', minutes: 15, title: 'Ear: mixed review', detail: 'Cadences, inversions and seventh chords at their hardest level.', action: { ear: 'cadences', level: 'full' } },
      { id: 'exam', kind: 'watch', minutes: 30, title: 'Optional: Edinburgh final exam', detail: 'M6 Final Exam parts 1 and 2. Then preview M5 “Modulation”, the start of Phase 2.', links: [edinburgh(6, 'Final Exam'), edinburgh(5, 'Modulation')] },
    ],
    ear: { exercise: 'cadences', level: 'full' },
  },
];

export const WEEKS = [
  { n: 1, title: 'Triads, inversions and cadences' },
  { n: 2, title: 'Four-part writing' },
  { n: 3, title: 'The dominant seventh' },
  { n: 4, title: 'Predominants and the phrase' },
  { n: 5, title: 'Embellishment and prolongation' },
  { n: 6, title: 'Integration' },
];

export const lessonById = (id) => LESSONS.find((l) => l.id === id);
export const progressionById = (id) => LESSONS.flatMap((l) => l.progressions || []).find((p) => p.id === id);
