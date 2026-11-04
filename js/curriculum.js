// Phase 1 syllabus: classical tonal harmony and four-part voice leading,
// three sessions a week for six weeks.
//
// Each lesson has an explanation in short sections, "hear it" examples, a
// pre-set ear-training plan (drills with a question count and a target score),
// and a checklist of outside work.
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

// "Hear it" examples. A string is a progression id from this file; the
// helpers make short note or chord sequences.
const melody = (label, names, step = 0.45) => ({ label, seq: names.map((n) => [n]), step });
const chords = (label, groups, step = 1.1) => ({ label, seq: groups, step });
const together = (label, low, high) => ({ label, seq: [[low], [high], [low, high]], step: 0.7 });

// A drill: which ear exercise, which items, how many questions, what score.
const drill = (exercise, why, opts = {}) => ({ exercise, why, count: 20, target: 80, ...opts });

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
    explain: [
      {
        h: 'The major scale',
        p: [
          'Every major scale has the same pattern of whole (W) and half (H) steps: W–W–H–W–W–W–H. In C major that is C–D–E–F–G–A–B–C, all white keys. The two half steps sit between ^3–^4 (mi–fa) and ^7–^1 (ti–do), and that last half step is why ti pulls so hard toward do.',
          'Numbering the notes ^1 to ^7 (or singing them do re mi fa sol la ti) lets you talk about every key at once: ^5 is G in C major and D in G major, but it always does the same job.',
        ],
        hear: [melody('C major scale, up and down', ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'], 0.35)],
      },
      {
        h: 'Naming an interval',
        p: [
          'An interval has a size and a quality. For the size, count letter names including both ends: C up to E is C–D–E, a 3rd. For the quality, imagine the major scale on the lower note. If the upper note is in it, the interval is major (2nds, 3rds, 6ths, 7ths) or perfect (unisons, 4ths, 5ths, octaves).',
          'A half step smaller than major is minor (C–E♭ is a minor 3rd). A half step larger than major or perfect is augmented; a half step smaller than minor or perfect is diminished.',
        ],
      },
      {
        h: 'Three anchors for the ear',
        p: [
          'Learn three intervals until they are automatic: the octave (the same note, higher), the perfect 5th (open and hollow) and the major 3rd (the bright interval at the bottom of a major chord). Every other interval is easier to judge against these.',
          'Sing each one before you answer. Matching it with your voice trains the ear faster than listening alone.',
        ],
        hear: [together('Major 3rd: C–E', 'C4', 'E4'), together('Perfect 5th: C–G', 'C4', 'G4'), together('Octave: C–C', 'C4', 'C5')],
      },
    ],
    practice: [
      drill('intervals', 'The three anchors, rising. Sing the bottom note, then the top, then answer.', { level: 'anchor', direction: 'up' }),
      drill('degrees', 'After the cadence sets the key, name the note as do, re, mi, fa or sol.', { level: 'do-sol' }),
    ],
    tasks: [
      { id: 'watch', kind: 'watch', minutes: 30, title: 'Edinburgh: scales, keys and intervals', detail: 'M1 “More on Scales”; M2 “Keys and Key Signatures” and “Intervals”.', links: [edinburgh(1, 'More on Scales'), edinburgh(2, 'Keys and Key Signatures, Intervals')] },
      { id: 'read', kind: 'read', minutes: 25, title: 'OMT: Major Scales and Intervals', detail: 'Skim scales; read Intervals closely, especially the “major scale” method for quality.', links: [omt('Major Scales, Scale Degrees, and Key Signatures', 125), omt('Intervals', 163)] },
      { id: 'sheet', kind: 'write', minutes: 20, title: 'Intervals worksheet #1', detail: 'Write and identify intervals. Check yourself by playing each one.', links: [worksheet('Intervals 1', '2021/10/WK-Intervals-1.pdf')] },
      { id: 'berklee', kind: 'watch', minutes: 15, title: 'Berklee: major 2nds, 3rds and the tonal center', detail: 'Module 1 “Major 2nd and 3rd Intervals” and “Tonal Center”.', links: [berklee(1, 'Major 2nd and 3rd Intervals; Tonal Center')] },
    ],
  },
  {
    id: 'w1l2', week: 1, n: 2,
    title: 'Triad Inversions & Voice Leading (I → V → I)',
    goal: 'Build triads in every inversion and connect I and V with the smallest possible moves.',
    explain: [
      {
        h: 'Triads and their inversions',
        p: [
          'A triad stacks two 3rds: root, 3rd and 5th (C–E–G). Which of them is in the bass decides the position. Root in the bass is root position. The 3rd in the bass is first inversion, and the 5th in the bass is second inversion.',
          'The figures under a chord count intervals up from the bass, never from the root. Root position is 5/3 (a 5th and a 3rd above the bass), first inversion 6/3, usually written just 6, and second inversion 6/4.',
        ],
        hear: [chords('C major: root position, then 6, then 6/4', [['C3', 'E4', 'G4', 'C5'], ['E3', 'G4', 'C5', 'E5'], ['G3', 'C4', 'E4', 'G4']], 1.2)],
      },
      {
        h: 'The shortest path',
        p: [
          'When the chord changes, each voice should move as little as it can. Keep a note the two chords share in the same voice (a common tone) and move the other voices by step. Leave the leaps to the bass, which carries the harmony.',
        ],
      },
      {
        h: 'I → V → I in C',
        p: [
          'C major (C–E–G) and G major (G–B–D) share one note, G. Hold it in the soprano. The alto steps E→D, the tenor steps C→B, and both step back. The bass leaps C→G→C.',
          'B is the leading tone. It rises to C, and when it is in the soprano it must. Compare the last example, where every voice drops a 4th at once: the soprano and bass move in parallel octaves and the alto and bass in parallel 5ths, and the voices stop sounding independent.',
        ],
        hear: ['w1l2-ivi', 'w1l2-ivi-ti', 'w1l2-err'],
      },
    ],
    practice: [
      drill('triads', 'Bright or dark: major or minor, root position.', { level: 'mm' }),
      drill('inversions', 'Listen to the lowest note only. Is it the root, the 3rd or the 5th?', { level: 'triads' }),
    ],
    tasks: [
      { id: 'watch', kind: 'watch', minutes: 20, title: 'Edinburgh: building triads and inversions', detail: 'M4 “Listening to Triads” and “Building Triads”; M5 “Chord Inversions”.', links: [edinburgh(4, 'Listening to Triads, Building Triads'), edinburgh(5, 'Chord Inversions')] },
      { id: 'read', kind: 'read', minutes: 25, title: 'OMT: Triads; Inversion and Figured Bass', detail: 'Triads (qualities, spelling); then the triad half of Inversion and Figured Bass.', links: [omt('Triads', 177), omt('Inversion and Figured Bass', 195, 'figured-bass')] },
      { id: 'sheet', kind: 'write', minutes: 15, title: 'Triadic inversions worksheet', detail: 'Identify and write triads in inversion with figures.', links: [worksheet('Inversion and Figured Bass 1', '2021/10/WK-Inversion-and-Figured-Bass-1.pdf')] },
      { id: 'play', kind: 'play', minutes: 10, title: 'Keyboard: I → V → I, holding the G', detail: 'Bass in the left hand, three voices in the right. Play it in C, then G and F, without looking. Use “Hear it” above to check C.' },
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
        id: 'w1l2-err', title: 'The mistake: everything moves together', key: C, faulty: ['parallel'],
        note: 'Every voice drops a 4th at once: parallel octaves in the outer voices, parallel 5ths between alto and bass.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
          { rn: 'V', fn: 'D', voices: ['G4', 'D4', 'B3', 'G2'] },
        ],
      },
    ],
    explorer: ['I', 'I6', 'I6/4', 'V', 'V6', 'V6/4'],
  },
  {
    id: 'w1l3', week: 1, n: 3,
    title: 'Cadences & Contrary Motion',
    goal: 'Tell PAC, IAC and HC apart by ear, and see why outer voices prefer contrary motion.',
    explain: [
      {
        h: 'Cadences end phrases',
        p: [
          'A cadence is the punctuation at the end of a phrase. An authentic cadence goes from V to I. It is perfect (PAC) when both chords are in root position and the soprano ends on do. Change either condition, for example mi on top, and it becomes imperfect (IAC): still conclusive, but softer.',
          'A half cadence (HC) stops on V. It sounds open, like a comma, and the next phrase usually answers it.',
        ],
        hear: ['w1l3-pac', 'w1l3-iac', 'w1l3-hc'],
      },
      {
        h: 'Four kinds of motion',
        p: [
          'Any two voices move in one of four ways. Contrary: opposite directions. Similar: the same direction, ending on a different interval. Parallel: the same direction, keeping the same interval. Oblique: one voice holds while the other moves.',
          'Contrary motion keeps voices most independent, so the soprano and bass, the two lines the ear follows most, prefer it. In the PAC above the soprano goes C–B–C while the bass goes C–G–C: contrary both times.',
        ],
      },
      {
        h: 'Direct 5ths and octaves',
        p: [
          'Reaching a perfect 5th or octave between soprano and bass in similar motion is acceptable only if the soprano moves by step. If the soprano leaps too, the arrival sounds like a parallel. In the example, the soprano leaps E→G while the bass leaps C→G.',
        ],
        hear: ['w1l3-err'],
      },
    ],
    practice: [
      drill('cadences', 'Does it end on the tonic? If so, is the soprano on do (PAC) or mi (IAC)? If not, it is a half cadence.', { level: 'basic' }),
      drill('degrees', 'The soprano’s last note decides PAC vs IAC. Practise hearing do, mi and sol against the key.', { items: [1, 3, 5] }),
    ],
    tasks: [
      { id: 'watch', kind: 'watch', minutes: 10, title: 'Edinburgh: cadences', detail: 'M5 “Cadences”; the M4 reading “Perfect and Imperfect Cadences”.', links: [edinburgh(5, 'Cadences'), edinburgh(4, 'Perfect and Imperfect Cadences (reading)')] },
      { id: 'read', kind: 'read', minutes: 25, title: 'OMT: Introduction to Harmony, Cadences, and Phrase Endings', detail: 'Read through “Writing Half Cadences”. Then the “Types of motion” section of Introduction to Species Counterpoint.', links: [omt('Introduction to Harmony, Cadences, and Phrase Endings', 401, 'intro-to-harmony'), omt('Introduction to Species Counterpoint (Types of motion)', 229, 'species-counterpoint')] },
      { id: 'sheet', kind: 'write', minutes: 20, title: 'Cadences worksheet', detail: 'Write authentic and half cadences with I and V only, in major and minor. Play each one at the keyboard.', links: [worksheet('Introduction to Harmony, Cadences, and Phrase Endings', '2021/07/WK-Introduction-to-Harmon-Cadences-and-Phrase-Endings.pdf')] },
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
        id: 'w1l3-err', title: 'The mistake: direct octaves', key: C, faulty: ['direct'],
        note: 'Soprano and bass both rise and land on an octave, and the soprano gets there by leap.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['E4', 'C4', 'G3', 'C3'] },
          { rn: 'V', fn: 'D', voices: ['G4', 'D4', 'B3', 'G3'] },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- week 2
  {
    id: 'w2l1', week: 2, n: 1,
    title: 'SATB Chord Construction',
    goal: 'Voice any diatonic triad in four parts with correct range, spacing and doubling.',
    explain: [
      {
        h: 'Four voices, four ranges',
        p: [
          'Classical harmony is written for soprano, alto, tenor and bass. Keep each in its range: soprano C4–G5, alto G3–D5, tenor C3–G4, bass F2–D4.',
          'Keep the upper three voices close: no more than an octave between soprano and alto, or between alto and tenor. The bass may sit up to a 12th below the tenor. Voices never cross: the alto stays below the soprano, and so on down.',
        ],
      },
      {
        h: 'Which note to double',
        p: [
          'A triad has three notes and there are four voices, so one note is doubled. In root position, double the bass, which is the root. Never double the leading tone: it has only one place to go, and two voices going there make parallel octaves. Never double a chordal 7th either, for the same reason.',
        ],
        hear: ['w2l1-iivi'],
      },
      {
        h: 'The triads of a key',
        p: [
          'Each scale degree carries a triad with a fixed quality. In major, I, IV and V are major; ii, iii and vi are minor; vii° is diminished. Capital numerals mean major, lower-case minor, and ° diminished. Open Explore to hear all seven and see how each is voiced.',
        ],
      },
    ],
    practice: [
      drill('triads', 'Add the diminished triad: tight and unstable, like vii°.', { level: 'mmd' }),
      drill('intervals', 'Berklee’s next step: major 2nd, 3rd, 6th and 7th, perfect 4th, 5th and octave, rising.', { level: 'berklee', direction: 'up' }),
    ],
    tasks: [
      { id: 'watch', kind: 'watch', minutes: 12, title: 'Edinburgh: triads in a key', detail: 'M4 “Elaborating Key: Triads and Scales”; M5 “Chord Names”.', links: [edinburgh(4, 'Elaborating Key: Triads and Scales'), edinburgh(5, 'Chord Names')] },
      { id: 'read', kind: 'read', minutes: 20, title: 'OMT: Roman Numerals and SATB Chord Construction', detail: 'Focus on “Writing Chords in SATB Style”: the six rules.', links: [omt('Roman Numerals and SATB Chord Construction', 208)] },
      { id: 'play', kind: 'play', minutes: 15, title: 'Voice all seven triads of C major', detail: 'Hear each in Explore, then write each on paper in two different spacings and play them.', action: { explorer: true } },
    ],
    progressions: [
      {
        id: 'w2l1-errs', title: 'Four faulty chords', key: C, standalone: true, faulty: ['spacing', 'doubling', 'crossing', 'range'],
        note: 'Too wide between alto and tenor; doubled leading tone; alto below tenor; alto and tenor out of range.',
        steps: [
          { rn: 'I', voices: ['E5', 'C5', 'G3', 'C3'] },
          { rn: 'V', voices: ['B4', 'G4', 'B3', 'G2'] },
          { rn: 'IV', voices: ['A4', 'C4', 'F4', 'F3'] },
          { rn: 'I', voices: ['G5', 'E5', 'C5', 'C4'] },
        ],
      },
      {
        id: 'w2l1-iivi', title: 'I – IV – V – I, cleanly voiced', key: C,
        note: 'Every chord doubles its bass. C holds into IV, then everything steps.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
          { rn: 'IV', fn: 'PD', voices: ['C5', 'A4', 'F4', 'F3'] },
          { rn: 'V', fn: 'D', voices: ['B4', 'G4', 'D4', 'G3'] },
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
        ],
      },
    ],
    explorer: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  },
  {
    id: 'w2l2', week: 2, n: 2,
    title: 'Motion Types & Parallel Perfects',
    goal: 'Hear and avoid parallel 5ths and octaves; use contrary motion to get out of them.',
    explain: [
      {
        h: 'Why parallels are avoided',
        p: [
          'Perfect 5ths and octaves blend so completely that two voices moving in parallel 5ths or octaves sound like one voice doubled, and four-part writing loses a part. Moving from one 5th or octave to another in contrary motion counts as the same fault.',
          'In the mistake, all four voices rise a step from I to ii: the soprano and tenor make parallel 5ths, and so do the soprano and bass, while the tenor and bass make parallel octaves. In the fix the bass still rises C→D, but the upper voices fall against it.',
        ],
        hear: ['w2l2-err', 'w2l2-fix'],
      },
      {
        h: 'Perfect and imperfect consonances',
        p: [
          '3rds and 6ths are imperfect consonances: warm, and fine to move in parallel. Unisons, 5ths and octaves are perfect consonances: hollow and stable. Approach them by contrary or oblique motion.',
        ],
        hear: [chords('Played together: P5, P8, then M3, M6', [['C4', 'G4'], ['C4', 'C5'], ['C4', 'E4'], ['C4', 'A4']], 1.0)],
      },
      {
        h: 'First species',
        p: [
          'Species counterpoint drills this in two voices: one note against one, consonances only, starting on a perfect interval and ending on a unison or octave, moving mostly by step, with one high point in each line.',
        ],
      },
    ],
    practice: [
      drill('intervals', 'Perfect or imperfect? Played together: 3rds, 6ths, 5ths and octaves.', { items: [3, 4, 7, 8, 9, 12], direction: 'harmonic' }),
      drill('intervals', 'All of the major-scale intervals, mixed directions.', { level: 'berklee', direction: 'mixed' }),
    ],
    tasks: [
      { id: 'read', kind: 'read', minutes: 25, title: 'OMT: Introduction to Species Counterpoint; First-Species Counterpoint', detail: 'Rules for melodic and harmonic writing; then first species.', links: [omt('Introduction to Species Counterpoint', 227, 'species-counterpoint'), omt('First-Species Counterpoint', 235, 'first-species-counterpoint')] },
      { id: 'sheet', kind: 'write', minutes: 25, title: 'Cantus firmus and first species', detail: 'Critique and write a cantus firmus, then a first-species line against it. Play both lines on the keyboard.', links: [worksheet('Cantus Firmus A', '2019/05/WK-Cantus-Firmus-A.pdf'), worksheet('First Species Counterpoint A', '2020/01/WK-First-species-Counterpoint-A.pdf')] },
      { id: 'berklee', kind: 'watch', minutes: 10, title: 'Berklee: major 6ths and 7ths', detail: 'Module 3 “Major 6th and Major 7th Intervals”.', links: [berklee(3, 'Major 6th and Major 7th Intervals')] },
    ],
    progressions: [
      {
        id: 'w2l2-err', title: 'The mistake: I – ii in parallel', key: C, faulty: ['parallel'],
        note: 'All four voices rise a step together.',
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
  },
  {
    id: 'w2l3', week: 2, n: 3,
    title: 'Minor Keys & the Raised Leading Tone',
    goal: 'Write i–iv–V–i in minor with the raised ^7, and avoid the augmented 2nd.',
    explain: [
      {
        h: 'Three forms of minor',
        p: [
          'Natural minor follows the key signature: A minor is A–B–C–D–E–F–G. Its ^7 (G) sits a whole step below the tonic, too far away to lead into it.',
          'Harmonic minor raises ^7 to G♯ for the V and vii° chords. That is why V is a major chord in minor keys, just as in major. Melodic minor also raises ^6 on the way up, to smooth out the melody.',
        ],
        hear: [
          melody('A natural minor', ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'], 0.35),
          melody('A harmonic minor (G♯)', ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G#4', 'A4'], 0.35),
        ],
      },
      {
        h: 'i – V – i',
        p: ['The raised leading tone G♯ appears in V and resolves up to A. Without it, the cadence loses its pull.'],
        hear: ['w2l3-ivi'],
      },
      {
        h: 'The augmented 2nd',
        p: [
          'Raising ^7 opens a gap of three half steps between ^6 (F) and ^7 (G♯): an augmented 2nd, awkward to sing. When iv moves to V, let F step down to E and bring in G♯ from A in another voice.',
          'The mistake has two problems: the alto leaps F→G♯, and the tenor and bass rise in parallel 5ths.',
        ],
        hear: ['w2l3-err', 'w2l3-iv'],
      },
    ],
    practice: [
      drill('triads', 'Minor keys use all three qualities: i and iv minor, V major, ii° and vii° diminished.', { level: 'mmd' }),
      drill('intervals', 'Half step, whole step or minor 3rd? The augmented 2nd F–G♯ sounds like a minor 3rd.', { items: [1, 2, 3], direction: 'up' }),
    ],
    tasks: [
      { id: 'watch', kind: 'watch', minutes: 10, title: 'Edinburgh: Minor Keys', detail: 'M2 “Minor Keys” and the reading “Minor Keys and Minor Scales”.', links: [edinburgh(2, 'Minor Keys')] },
      { id: 'read', kind: 'read', minutes: 20, title: 'OMT: Minor Scales, Scale Degrees, and Key Signatures', detail: 'Natural, harmonic and melodic minor; why harmony uses harmonic minor.', links: [omt('Minor Scales, Scale Degrees, and Key Signatures', 136)] },
      { id: 'sheet', kind: 'write', minutes: 15, title: 'Minor scales worksheet', detail: 'Write the three forms of minor.', links: [worksheet('Minor Scales 1', '2021/10/WK-Minor-Scales-1.pdf')] },
      { id: 'play', kind: 'play', minutes: 10, title: 'Keyboard: i – iv – V – i in A minor and D minor', detail: 'Copy the fix above, then transpose it to D minor (C♯ is the leading tone).' },
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
        id: 'w2l3-iv', title: 'The fix: i – iv – V – i in A minor', key: Am,
        note: 'F (^6) falls to E; the G♯ appears in the soprano, approached from A.',
        steps: [
          { rn: 'i', fn: 'T', voices: ['A4', 'E4', 'C4', 'A2'] },
          { rn: 'iv', fn: 'PD', voices: ['A4', 'F4', 'D4', 'D3'] },
          { rn: 'V', fn: 'D', voices: ['G#4', 'E4', 'B3', 'E3'] },
          { rn: 'i', fn: 'T', voices: ['A4', 'E4', 'C4', 'A2'] },
        ],
      },
      {
        id: 'w2l3-err', title: 'The mistake: iv – V with an augmented 2nd', key: Am, faulty: ['melodic', 'parallel'],
        note: 'The alto leaps F→G♯, and the tenor and bass move in parallel 5ths.',
        steps: [
          { rn: 'iv', fn: 'PD', voices: ['D5', 'F4', 'A3', 'D3'] },
          { rn: 'V', fn: 'D', voices: ['B4', 'G#4', 'B3', 'E3'] },
        ],
      },
    ],
    explorer: ['i', 'ii°', 'III', 'iv', 'V', 'VI', 'vii°'],
    explorerKey: Am,
  },

  // ---------------------------------------------------------------- week 3
  {
    id: 'w3l1', week: 3, n: 1,
    title: 'Seventh Chords',
    goal: 'Spell and hear the five common seventh-chord qualities.',
    explain: [
      {
        h: 'Adding a 7th',
        p: [
          'Stack one more 3rd on a triad and you get a seventh chord. Five qualities matter in tonal music. Major 7th (MM7): I7 and IV7 in major. Dominant 7th (Mm7): only on V, in major and minor alike. Minor 7th (mm7): ii7, iii7 and vi7 in major. Half-diminished (ø7): vii in major, ii in minor. Fully diminished (°7): vii in minor.',
        ],
        hear: [chords('On C: major 7, dominant 7, minor 7, half-diminished, fully diminished', [
          ['C4', 'E4', 'G4', 'B4'], ['C4', 'E4', 'G4', 'Bb4'], ['C4', 'Eb4', 'G4', 'Bb4'], ['C4', 'Eb4', 'Gb4', 'Bb4'], ['C4', 'Eb4', 'Gb4', 'Bbb4'],
        ], 1.3)],
      },
      {
        h: 'Why V7 matters',
        p: [
          'V7 contains a tritone between ^7 and ^4, B and F in C major. The tritone resolves inward: B up to C, F down to E. That double pull toward the tonic chord is the strongest motion in the key.',
        ],
        hear: [chords('Tritone B–F resolving to C–E', [['B3', 'F4'], ['C4', 'E4']], 1.2)],
      },
      {
        h: 'In four voices',
        p: ['A seventh chord already has four different notes, so a complete one doubles nothing: one note per voice.'],
      },
    ],
    practice: [
      drill('sevenths', 'Start with the three common ones: dominant, major and minor 7th.', { level: 'basic' }),
      drill('sevenths', 'Add half-diminished and fully diminished.', { level: 'all' }),
    ],
    tasks: [
      { id: 'watch', kind: 'watch', minutes: 20, title: 'Edinburgh and Berklee: seventh chords', detail: 'Edinburgh M4 “Seventh Chords”; Berklee M4 “7th Chords” and “7th Chords Practice”.', links: [edinburgh(4, 'Seventh Chords'), berklee(4, '7th Chords; 7th Chords Practice')] },
      { id: 'read', kind: 'read', minutes: 20, title: 'OMT: Seventh Chords', detail: 'Qualities, nomenclature, and the listening section.', links: [omt('Seventh Chords', 186)] },
      { id: 'sheet', kind: 'write', minutes: 15, title: 'Seventh chords worksheet #1', links: [worksheet('Seventh Chords 1', '2021/10/WK-Seventh-Chords-1.pdf')] },
    ],
    explorer: ['I7', 'ii7', 'iii7', 'IV7', 'V7', 'vi7', 'viiø7'],
  },
  {
    id: 'w3l2', week: 3, n: 2,
    title: 'Resolving V7 → I',
    goal: 'Resolve the dominant seventh: 7th down by step, leading tone up.',
    explain: [
      {
        h: 'The default resolution',
        p: [
          'In C major: the chordal 7th, F, steps down to E. The leading tone, B, steps up to C. ^2, D, moves to C, and the bass leaps G→C. Approach the 7th by step or hold it over from the chord before.',
        ],
        hear: ['w3l2-complete'],
      },
      {
        h: 'Complete or incomplete',
        p: [
          'With both chords in root position, the arithmetic forces a choice. A complete V7 resolves to an incomplete I: three Cs and an E, with no G. Or leave the 5th (D) out of V7 and double its root, G, and the I comes out complete.',
        ],
        hear: ['w3l2-incomplete'],
      },
      {
        h: 'The 7th must fall',
        p: ['In the mistake every voice moves by step and there are no parallels, but the 7th, F, goes up to G. It sounds unfinished.'],
        hear: ['w3l2-err'],
      },
    ],
    practice: [
      drill('intervals', 'The tritone at the heart of V7, against its neighbours, the perfect 4th and 5th. Played together.', { items: [5, 6, 7], direction: 'harmonic' }),
      drill('cadences', 'Authentic or half: listen for whether the 7th resolves.', { level: 'basic' }),
    ],
    tasks: [
      { id: 'read', kind: 'read', minutes: 25, title: 'OMT: Strengthening Endings with V7', detail: 'The default resolution, then the alternatives.', links: [omt('Strengthening Endings with V7', 410, 'strengthening-endings-with-v7')] },
      { id: 'sheet', kind: 'write', minutes: 25, title: 'V7 worksheet', detail: 'Write and resolve V7 chords. Play every answer and listen for the 7th falling.', links: [worksheet('Strengthening Endings with V7', '2021/07/WK-Strengthening-Endings-with-V7.pdf')] },
      { id: 'play', kind: 'play', minutes: 10, title: 'Keyboard: both V7 resolutions', detail: 'Play the complete and the incomplete version in C, then in G and F.' },
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
        id: 'w3l2-err', title: 'The mistake: the 7th rises', key: C, faulty: ['tendency'],
        note: 'F goes up to G instead of down to E.',
        steps: [
          { rn: 'V7', fn: 'D', voices: ['F4', 'D4', 'B3', 'G2'] },
          { rn: 'I', fn: 'T', voices: ['G4', 'E4', 'C4', 'C3'] },
        ],
      },
    ],
  },
  {
    id: 'w3l3', week: 3, n: 3,
    title: 'Figured Bass & Inverted V7',
    goal: 'Read figures for every triad and seventh-chord inversion and realize them at the keyboard.',
    explain: [
      {
        h: 'Seventh-chord inversions',
        p: [
          'A seventh chord has four positions. Root in the bass: 7. The 3rd in the bass: 6/5. The 5th in the bass: 4/3. The 7th in the bass: 4/2, sometimes just 2. As with triads, the figures are intervals above the bass.',
        ],
        hear: [chords('G7 in C: V7, V6/5, V4/3, V4/2', [['G2', 'B3', 'D4', 'F4'], ['B2', 'D4', 'F4', 'G4'], ['D3', 'G3', 'B3', 'F4'], ['F3', 'G3', 'B3', 'D4']], 1.3)],
      },
      {
        h: 'Reading figured bass',
        p: [
          'A figured bass gives you the bass line and some numbers, and you supply the upper voices. No figure means a root-position triad; 6 means first inversion; 6/4 second inversion. An accidental on its own applies to the 3rd above the bass, which is how a ♯ under V raises the leading tone in minor.',
        ],
      },
      {
        h: 'Same tendencies when inverted',
        p: ['Inverting V7 changes the bass, not the rules: the leading tone still rises and the 7th still falls. In V6/5 the leading tone is in the bass and steps up to the tonic.'],
        hear: ['w3l3-v65'],
      },
    ],
    practice: [
      drill('inversions', 'Triads first: root, 6 or 6/4, by the bass note.', { level: 'triads' }),
      drill('inversions', 'Dominant 7th in all four positions.', { level: 'sevenths' }),
    ],
    tasks: [
      { id: 'watch', kind: 'watch', minutes: 10, title: 'Edinburgh: Chord Inversions, Chord Names', detail: 'M5. Rewatch Chord Inversions now that you know seventh chords.', links: [edinburgh(5, 'Chord Inversions, Chord Names')] },
      { id: 'read', kind: 'read', minutes: 20, title: 'OMT: Inversion and Figured Bass (seventh chords)', detail: 'Seventh Chord Inversion and Figures; Other Figured Bass Symbols.', links: [omt('Inversion and Figured Bass', 201, 'figured-bass')] },
      { id: 'sheet', kind: 'write', minutes: 15, title: 'Seventh chord inversions worksheet', links: [worksheet('Inversion and Figured Bass 2', '2021/10/WK-Inversion-and-Figured-Bass-2.pdf')] },
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
  },

  // ---------------------------------------------------------------- week 4
  {
    id: 'w4l1', week: 4, n: 1,
    title: 'Strong Predominants: IV and ii6',
    goal: 'Approach V from IV or ii6 without parallels.',
    explain: [
      {
        h: 'Tonic, predominant, dominant',
        p: [
          'Chords group by what they do. Tonic (I) is home. Dominant (V, vii°) is tension that wants home. Predominant chords lead from tonic to dominant, and IV and ii are the strong ones: both contain ^4, which leads naturally to ^5 under V.',
        ],
      },
      {
        h: 'ii6',
        p: [
          'ii in first inversion has the same bass note as IV (F in C) but a lighter, more urgent colour. Double its bass, F. The example also shows the leading tone in an inner voice dropping to G, which is allowed there and gives a complete final chord.',
        ],
        hear: ['w4l1-ii6'],
      },
      {
        h: 'The IV–V trap',
        p: [
          'IV and V are a step apart. Move the upper voices up with the bass and you get parallel 5ths and octaves, as in the mistake. Move them down, against the bass, as in the version from week 2.',
        ],
        hear: ['w4l1-err', 'w2l1-iivi'],
      },
    ],
    practice: [
      drill('degrees', 'All seven degrees. ^4 (fa) and ^6 (la) are the predominant notes; learn to spot them.', { level: 'all' }),
      drill('cadences', 'Authentic or half, now with predominants before V.', { level: 'basic' }),
    ],
    tasks: [
      { id: 'watch', kind: 'watch', minutes: 15, title: 'Edinburgh and Berklee: primary chords and I–IV–V', detail: 'Edinburgh M1 “Primary Chords”, M5 “Common Chord Progressions”; Berklee M2 “I IV V Chord Progression”.', links: [edinburgh(5, 'Common Chord Progressions'), berklee(2, 'I IV V Chord Progression')] },
      { id: 'read', kind: 'read', minutes: 20, title: 'OMT: Strengthening Endings with Strong Predominants', links: [omt('Strengthening Endings with Strong Predominants', 415, 'strong-predominants')] },
      { id: 'sheet', kind: 'write', minutes: 25, title: 'Strong predominants worksheet', detail: 'Part writing from Roman numerals and figures. Play every answer.', links: [worksheet('Strengthening Endings with Strong Predominants', '2021/07/WK-Strengthening-Endings-with-Strong-Predominants.pdf')] },
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
        id: 'w4l1-err', title: 'The mistake: IV – V in parallel', key: C, faulty: ['parallel'],
        note: 'All four voices rise by step: parallel 5ths and octaves.',
        steps: [
          { rn: 'IV', fn: 'PD', voices: ['C5', 'A4', 'F4', 'F3'] },
          { rn: 'V', fn: 'D', voices: ['D5', 'B4', 'G4', 'G3'] },
        ],
      },
    ],
    explorer: ['IV', 'ii', 'ii6', 'V', 'I'],
  },
  {
    id: 'w4l2', week: 4, n: 2,
    title: 'The Phrase Model: T – PD – D – T',
    goal: 'Label harmonic function in a phrase and hear where the cadence lands.',
    explain: [
      {
        h: 'T – PD – D – T',
        p: [
          'Most classical phrases move through the functions in order: start on tonic, move to a predominant, arrive on the dominant, and usually return to tonic at the cadence. Going backward, from V to IV, is rare in this style.',
        ],
        hear: ['w4l2-circle'],
      },
      {
        h: 'Weak predominants',
        p: [
          'vi and iii move away from tonic and toward the strong predominants. In I–vi–ii–V–I the bass falls by 3rds and 5ths, and each chord shares notes with the next, so the upper voices barely move.',
        ],
      },
      {
        h: 'How to analyze a phrase',
        p: [
          'Find the cadence first: it tells you where the phrase ends and what key it is in. Then label each chord’s function, and only then the Roman numerals. A phrase that stops on V is a question waiting for an answer.',
        ],
        hear: ['w4l2-hc'],
      },
    ],
    practice: [
      drill('cadences', 'All four endings, now including deceptive: V going somewhere other than I.', { level: 'full' }),
      drill('degrees', 'All seven degrees after the cadence.', { level: 'all' }),
    ],
    tasks: [
      { id: 'read', kind: 'read', minutes: 20, title: 'OMT: Performing Harmonic Analysis Using the Phrase Model', links: [omt('Performing Harmonic Analysis Using the Phrase Model', 436, 'performing-harmonic-analysis-using-the-phrase-model')] },
      { id: 'analyze', kind: 'write', minutes: 30, title: 'Analyze the Bach Prelude in C (BWV 846)', detail: 'Edinburgh M6 reading. Roman numerals for mm. 1–11, then mark T/PD/D. Play each bar as a block chord.', links: [edinburgh(6, 'Harmonic Analysis: Bach Prelude in C Major')] },
    ],
    progressions: [
      {
        id: 'w4l2-circle', title: 'I – vi – ii – V – I', key: C,
        note: 'Bass falls in 3rds and 5ths. Common tones carry the upper voices from chord to chord.',
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
  },
  {
    id: 'w4l3', week: 4, n: 3,
    title: 'The Cadential 6/4',
    goal: 'Write and hear the cadential 6/4 as a decoration of V.',
    explain: [
      {
        h: 'A tonic chord that is really V',
        p: [
          'Just before many cadences you hear a I6/4 over ^5 in the bass. It sounds like I, but it works as a decoration of V: the 6th and 4th above the bass (E and C over G) fall to the 5th and 3rd (D and B), while the bass stays on G. That is why it is labelled V6/4–5/3.',
        ],
        hear: ['w4l3-cad64'],
      },
      {
        h: 'How to write it',
        p: [
          'Approach it from a predominant, IV or ii6. Double the bass. Put the 6/4 on the stronger beat and its resolution after it. Resolve the upper voices down by step: 6 to 5 and 4 to 3.',
        ],
      },
    ],
    practice: [
      drill('inversions', 'Is the bass the root, 3rd or 5th? The cadential 6/4 has the 5th in the bass.', { level: 'triads' }),
      drill('cadences', 'All four endings.', { level: 'full' }),
    ],
    tasks: [
      { id: 'read', kind: 'read', minutes: 20, title: 'OMT: Strengthening Endings with Cadential 6/4', links: [omt('Strengthening Endings with Cadential 6/4', 426, 'cadential-64')] },
      { id: 'sheet', kind: 'write', minutes: 25, title: 'Cadential 6/4 worksheet', detail: 'Includes unfigured bass exercises.', links: [worksheet('Strengthening Endings with Cadential 6/4', '2021/07/WK-Strengthening-Endings-with-Cadential-64.pdf')] },
      { id: 'play', kind: 'play', minutes: 10, title: 'Keyboard: I – IV – V6/4–5/3 – I', detail: 'In C, G and D. The upper voices step down 6–5 and 4–3 over a held bass.' },
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
  },

  // ---------------------------------------------------------------- week 5
  {
    id: 'w5l1', week: 5, n: 1,
    title: 'Embellishing Tones',
    goal: 'Name passing tones, neighbors, suspensions and appoggiaturas, and write a 4–3 suspension.',
    explain: [
      {
        h: 'Notes outside the chord',
        p: [
          'Melodies decorate the harmony with notes that are not in the chord. Name them by how they are approached and how they are left.',
        ],
      },
      {
        h: 'Step in, step out',
        p: [
          'A passing tone steps in and keeps going in the same direction, filling the gap of a 3rd: C–D–E over a C chord. A neighbor steps away and comes back: E–F–E.',
        ],
        hear: [
          chords('Passing tone: C–D–E over C', [['C3', 'G3', 'C5'], ['C3', 'G3', 'D5'], ['C3', 'G3', 'E5']], 0.6),
          chords('Neighbor: E–F–E over C', [['C3', 'G3', 'E5'], ['C3', 'G3', 'F5'], ['C3', 'G3', 'E5']], 0.6),
        ],
      },
      {
        h: 'Leaps',
        p: [
          'An appoggiatura arrives by leap and resolves by step, usually down and on a strong beat. An escape tone does the reverse: it steps away and then leaps.',
        ],
      },
      {
        h: 'Suspensions',
        p: [
          'A suspension has three stages. Preparation: the note is a chord tone. Suspension: it is held while the harmony changes under it, and becomes a dissonance. Resolution: it steps down into the new chord. The 4–3 suspension over V is the most common.',
        ],
        hear: ['w5l1-sus'],
      },
    ],
    practice: [
      drill('intervals', 'Half step or whole step, up and down. Passing tones and neighbors move by these.', { items: [1, 2], direction: 'mixed' }),
      drill('degrees', 'All seven degrees.', { level: 'all' }),
    ],
    tasks: [
      { id: 'read', kind: 'read', minutes: 25, title: 'OMT: Embellishing Tones', links: [omt('Embellishing Tones', 420)] },
      { id: 'sheet', kind: 'write', minutes: 25, title: 'Embellishing tones worksheet', detail: 'Write embellishing tones in two voices; label them in an excerpt.', links: [worksheet('Embellishing Tones', '2021/07/WK-Embellishing-Tones.pdf')] },
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
  },
  {
    id: 'w5l2', week: 5, n: 2,
    title: 'Prolonging Tonic: V6, V4/3, V4/2',
    goal: 'Extend the opening tonic with inverted dominants that move by step in the bass.',
    explain: [
      {
        h: 'Staying on tonic, with motion',
        p: [
          'At the start of a phrase, composers stretch out the tonic with quick dominant chords in inversion. Because the bass only moves by step, these sound like decorations of I rather than real arrivals on V.',
        ],
      },
      {
        h: 'Three bass patterns',
        p: [
          'do–ti–do: I–V6–I. do–re–mi: I–V4/3–I6. sol–fa–mi: V–V4/2–I6. In each one, the leading tone goes up and the 7th, when there is one, goes down.',
        ],
        hear: ['w5l2-v6', 'w5l2-v43', 'w5l2-v42'],
      },
      {
        h: 'V4/2 needs I6',
        p: ['In V4/2 the 7th is in the bass, so the bass has to fall a step to the 3rd of the tonic chord. It goes to I6, never to root-position I.'],
      },
    ],
    practice: [
      drill('inversions', 'Dominant 7th in all four positions. Listen to the bass.', { level: 'sevenths' }),
      drill('degrees', 'All seven degrees. The bass lines here are do–ti–do, do–re–mi and sol–fa–mi.', { level: 'all' }),
    ],
    tasks: [
      { id: 'read', kind: 'read', minutes: 25, title: 'OMT: Prolonging Tonic at Phrase Beginnings with V6 and Inverted V7s', links: [omt('Prolonging Tonic at Phrase Beginnings with V6 and Inverted V7s', 431, 'inverted-v7s')] },
      { id: 'sheet', kind: 'write', minutes: 25, title: 'Tonic prolongation worksheet', links: [worksheet('Prolonging Tonic at Phrase Beginnings Using V6 and Inverted V7', '2021/07/WK-Prolonging-Tonic-at-Phrase-Beginnings-Using-V6-and-Inverted-V7.pdf')] },
      { id: 'play', kind: 'play', minutes: 10, title: 'Keyboard: the three bass patterns', detail: 'do–ti–do, do–re–mi, sol–fa–mi. Say the bass solfège aloud as you play.' },
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
  },
  {
    id: 'w5l3', week: 5, n: 3,
    title: 'The Leading-Tone Chord & 6/4 Types',
    goal: 'Use vii°6 and passing and pedal 6/4 chords to connect tonic chords.',
    explain: [
      {
        h: 'vii°6, a dominant without its root',
        p: [
          'The diminished triad on ^7 (B–D–F) is V7 without its G, and it works as a dominant. Use it in first inversion between I and I6, with the bass climbing do–re–mi, and double its bass, D.',
        ],
        hear: ['w5l3-vii6'],
      },
      {
        h: 'Four jobs for a 6/4 chord',
        p: [
          'Second-inversion triads appear in only four roles. Cadential: decorating V before a cadence. Passing: between two positions of one chord, with the bass moving by step. Pedal, or neighbor: over a held bass while the upper voices step away and back. Arpeggiated: the bass outlining a single chord.',
        ],
        hear: ['w5l3-p64', 'w5l3-n64'],
      },
    ],
    practice: [
      drill('triads', 'Major, minor or diminished. vii° is the diminished one.', { level: 'mmd' }),
      drill('inversions', 'Root, 6 or 6/4.', { level: 'triads' }),
    ],
    tasks: [
      { id: 'read', kind: 'read', minutes: 25, title: 'OMT: the leading-tone chord; 6/4 chords as prolongation', links: [omt('Prolongation at Phrase Beginnings using the Leading-Tone Chord', 439), omt('6/4 Chords as Forms of Prolongation', 443)] },
      { id: 'sheet', kind: 'write', minutes: 20, title: 'Leading-tone chord worksheet', links: [worksheet('Prolongation Using the Leading-Tone Chord', '2021/07/WK-Prolongation-at-Phrase-Endings-Using-the-Leading-Tone-Chord.pdf')] },
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
        note: 'Same bass line as vii°6; V6/4 passes, doubling its bass.',
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
  },

  // ---------------------------------------------------------------- week 6
  {
    id: 'w6l1', week: 6, n: 1,
    title: 'Deceptive Motion & La in the Bass',
    goal: 'Write V–vi with the doubled third, and hear it as a cadence that dodges.',
    explain: [
      {
        h: 'The deceptive cadence',
        p: [
          'V goes to vi instead of I. The bass rises sol–la, the leading tone still rises to do, and the ear expects home but lands somewhere softer. In V–vi, double the 3rd of vi, which is ^1: it lets the leading tone resolve and keeps the other voices clear of parallels.',
        ],
      },
      {
        h: 'Trying again',
        p: [
          'After a deceptive move, the phrase usually goes back through a predominant and tries again, this time ending with a PAC. The example does exactly that after vi.',
        ],
        hear: ['w6l1-dc'],
      },
      {
        h: 'La in the bass',
        p: ['^6 in the bass, under vi or IV6, shows up at the start, in the middle and at the end of phrases. At the end, it is usually this deceptive move.'],
      },
    ],
    practice: [
      drill('cadences', 'All four endings. Deceptive: V that lands on a minor chord.', { level: 'full' }),
      drill('triads', 'I or vi? Major or minor.', { level: 'mm' }),
    ],
    tasks: [
      { id: 'read', kind: 'read', minutes: 20, title: 'OMT: La (Scale Degree 6) in the Bass', links: [omt('La (Scale Degree 6) in the Bass at Beginnings, Middles, and Endings', 451)] },
      { id: 'sheet', kind: 'write', minutes: 25, title: 'La in the bass worksheet', links: [worksheet('La in the bass', '2021/07/WK-La-in-the-bass.pdf')] },
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
  },
  {
    id: 'w6l2', week: 6, n: 2,
    title: 'Harmonizing a Melody',
    goal: 'Harmonize a soprano line in four parts using everything from weeks 1–5.',
    explain: [
      {
        h: 'Start from the end',
        p: [
          'Decide the cadence first. Then, for each melody note, list the chords that contain it and pick the ones that keep the phrase model in order: tonic, predominant, dominant, tonic.',
        ],
      },
      {
        h: 'Bass second',
        p: [
          'Write the bass against the melody before anything else. Aim for contrary motion, avoid parallel 5ths and octaves between the two, and give the bass its own shape. Inversions help here: V6 and I6 let the bass move by step.',
        ],
      },
      {
        h: 'Inner voices last',
        p: [
          'Fill in alto and tenor by the shortest path, then check spacing, doubling and the leading tone. Try the exercise below on paper first, then hear one possible answer.',
        ],
        hear: ['w6l2-model'],
      },
    ],
    practice: [
      drill('degrees', 'All seven degrees: the melody notes you are harmonizing.', { level: 'all' }),
      drill('intervals', 'Every interval, every direction.', { level: 'all', direction: 'mixed' }),
    ],
    tasks: [
      { id: 'watch', kind: 'watch', minutes: 15, title: 'Edinburgh: Harmonising a Melody', detail: 'M4, the longest video in the course (12:53).', links: [edinburgh(4, 'Harmonising a Melody')] },
      { id: 'write', kind: 'write', minutes: 35, title: 'Harmonize do–re–mi–fa–mi–re–do', detail: 'Soprano C5 D5 E5 F5 E5 D5 C5 in C major, one chord per note, ending with a PAC. Write it on paper and play it, then compare with “one possible answer” above. Then try A minor (A–B–C–D–C–B–A).' },
    ],
    progressions: [
      {
        id: 'w6l2-model', title: 'One possible answer: do–re–mi–fa–mi–re–do', key: C,
        note: 'I – V6 – I – IV – V6/4 – V – I. The bass moves by step at the start and the 6/4 leads into the cadence.',
        steps: [
          { rn: 'I', fn: 'T', voices: ['C5', 'G4', 'E4', 'C3'] },
          { rn: 'V6', fn: 'D', voices: ['D5', 'G4', 'D4', 'B2'] },
          { rn: 'I', fn: 'T', voices: ['E5', 'G4', 'C4', 'C3'] },
          { rn: 'IV', fn: 'PD', voices: ['F5', 'A4', 'C4', 'F3'] },
          { rn: 'I6/4', fn: 'D', label: 'V6/4', voices: ['E5', 'G4', 'C4', 'G3'] },
          { rn: 'V', fn: 'D', label: 'V5/3', voices: ['D5', 'G4', 'B3', 'G3'] },
          { rn: 'I', fn: 'T', voices: ['C5', 'E4', 'C4', 'C3'] },
        ],
      },
    ],
  },
  {
    id: 'w6l3', week: 6, n: 3,
    title: 'Phase 1 Checkpoint',
    goal: 'Show you can write, play and hear everything in Phase 1 without help.',
    explain: [
      {
        h: 'Write',
        p: ['I – ii6 – V7 – I and I – IV – V6/4–5/3 – I, in C, G, F, D and B♭ major. Check each against the rules from weeks 1–5: ranges, spacing, doubling, no parallels, leading tone up, 7th down.'],
      },
      {
        h: 'Play',
        p: ['Every example in this course, from memory, in C and in one other key. Use the Hear buttons in each lesson to check yourself.'],
      },
      {
        h: 'Hear',
        p: ['80% or better on cadences, inversions and seventh-chord qualities, the three drills below.'],
      },
    ],
    practice: [
      drill('cadences', 'All four endings.', { level: 'full' }),
      drill('inversions', 'Dominant 7th inversions.', { level: 'sevenths' }),
      drill('sevenths', 'All five seventh-chord qualities.', { level: 'all' }),
    ],
    tasks: [
      { id: 'write', kind: 'write', minutes: 30, title: 'Two progressions in five keys', detail: 'On paper, then at the keyboard.' },
      { id: 'play', kind: 'play', minutes: 15, title: 'Keyboard: replay the course from memory', detail: 'Every example, then check each one with its Hear button.' },
      { id: 'exam', kind: 'watch', minutes: 30, title: 'Optional: Edinburgh final exam', detail: 'M6 Final Exam parts 1 and 2. Then preview M5 “Modulation”, the start of Phase 2.', links: [edinburgh(6, 'Final Exam'), edinburgh(5, 'Modulation')] },
    ],
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
