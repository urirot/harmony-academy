// Ear-training question generators. Pure data in, data out: a question is the
// list of notes to play plus the right answer, so the node tests can check the
// cadence phrases with the same voice-leading checker the lessons use.

import { INTERVALS, parsePitch } from './theory.js';

const pick = (arr, rand) => arr[Math.floor(rand() * arr.length)];

/**
 * Choose an item, favouring the ones answered worst so far. An unseen item
 * counts as 50%; a perfect record still keeps weight 1 so it comes back.
 */
export function weightedPick(ids, itemStats = {}, rand = Math.random) {
  const weights = ids.map((id) => {
    const [att, cor] = itemStats[id] || [0, 0];
    const acc = att ? cor / att : 0.5;
    return 1 + 3 * (1 - acc);
  });
  let r = rand() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < ids.length; i += 1) {
    r -= weights[i];
    if (r <= 0) return ids[i];
  }
  return ids[ids.length - 1];
}

const ivName = (st) => INTERVALS.find((i) => i.st === st);

// Ascending reference tunes. Heard after answering, as a memory hook, not as the method.
export const INTERVAL_SONGS = {
  1: 'Jaws theme', 2: 'Happy Birthday (“py → Birth”)', 3: 'Greensleeves (“A-las”)', 4: 'When the Saints (“Oh when”)',
  5: 'Here Comes the Bride', 6: 'Maria (West Side Story)', 7: 'Twinkle Twinkle (“Twin-kle → twin-kle”)', 8: 'The Entertainer (E → C)',
  9: 'My Bonnie (“My Bon-”)', 10: 'Somewhere (“There’s a place”)', 11: 'A half step short of the octave', 12: 'Somewhere Over the Rainbow (“Some-where”)',
};

// Cadence phrases in C. Every phrase opens I – ii6 and reaches V; there are
// several V voicings, so the soprano on V does not give the answer away. Some
// use V7 or pause on a cadential 6/4 first, as the later lessons do.
const OPEN = [['E5', 'C5', 'G4', 'C3'], ['D5', 'A4', 'F4', 'F3']];
const V_LOW = ['B4', 'G4', 'D4', 'G3'];
const V_HIGH = ['D5', 'B4', 'D4', 'G3'];
const V7_LOW = ['B4', 'G4', 'F4', 'G3']; // the 7th is held over from ii6
const V7_TOP = ['F5', 'B4', 'D4', 'G3']; // the 7th on top, falling to mi
const CAD64 = ['C5', 'G4', 'E4', 'G3'];
const I_FULL = ['C5', 'G4', 'E4', 'C3'];
export const CADENCE_PHRASES = {
  PAC: [
    { rns: ['I', 'ii6', 'V', 'I'], voices: [...OPEN, V_LOW, I_FULL] },
    { rns: ['I', 'ii6', 'V', 'I'], voices: [...OPEN, V_HIGH, I_FULL] },
    { rns: ['I', 'ii6', 'V7', 'I'], voices: [...OPEN, V7_LOW, I_FULL] },
    { rns: ['I', 'ii6', 'I6/4', 'V', 'I'], voices: [...OPEN, CAD64, V_LOW, I_FULL] },
  ],
  IAC: [
    { rns: ['I', 'ii6', 'V', 'I'], voices: [...OPEN, V_HIGH, ['E5', 'C5', 'C4', 'C3']] },
    { rns: ['I', 'ii6', 'V7', 'I'], voices: [...OPEN, V7_TOP, ['E5', 'C5', 'C4', 'C3']] },
  ],
  HC: [
    { rns: ['I', 'ii6', 'V'], voices: [...OPEN, V_LOW] },
    { rns: ['I', 'ii6', 'V'], voices: [...OPEN, V_HIGH] },
    { rns: ['I', 'ii6', 'I6/4', 'V'], voices: [...OPEN, CAD64, V_LOW] },
  ],
  DC: [
    { rns: ['I', 'ii6', 'V', 'vi'], voices: [...OPEN, V_LOW, ['C5', 'E4', 'C4', 'A3']] },
  ],
};

// I – IV – V – I to set the key before a scale-degree question.
const KEY_SETTER = [['C5', 'G4', 'E4', 'C3'], ['C5', 'A4', 'F4', 'F3'], ['B4', 'G4', 'D4', 'G3'], ['C5', 'G4', 'E4', 'C3']];
export const KEY_SETTER_RNS = ['I', 'IV', 'V', 'I'];
export { KEY_SETTER };

const DEGREE_ST = [0, 2, 4, 5, 7, 9, 11];
const DEGREE_SOLFEGE = ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti'];
const KEY_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

const midis = (voices, shift) => voices.map((n) => parsePitch(n).midi + shift).sort((a, b) => a - b);

// Each exercise also carries its Learn more text: what a question sounds like
// (hears), the method (how), one line per answer (tips) and why it matters.
export const EXERCISES = {
  intervals: {
    title: 'Intervals',
    hint: 'Sing the bottom note, then the top. Name the interval from the sound of the pair, not the second note alone.',
    levels: {
      anchor: { label: 'Anchors: M3 P5 P8', items: [4, 7, 12] },
      berklee: { label: 'Major scale: M2–M7', items: [2, 4, 5, 7, 9, 11, 12] },
      all: { label: 'All 12', items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    },
    directions: { up: 'Up', down: 'Down', harmonic: 'Together', mixed: 'Mixed' },
    label: (id) => ivName(Number(id)).name,
    hears: ({ direction }) => `${{
      up: 'Two notes, one after the other, rising.',
      down: 'Two notes, one after the other, falling.',
      harmonic: 'Two notes played at the same time.',
      mixed: 'Two notes: rising, falling or together, at random.',
    }[direction]} The low note moves every question.`,
    how: ({ direction }) => [
      {
        up: 'Sing it back: the low note, then the high one.',
        down: 'Sing it back, high then low. Then sing it rising: the name is the same either way.',
        harmonic: 'Hum the lower note, then the upper one, to pull the pair apart.',
        mixed: 'Sing it back as you heard it. If the notes came together, hum the lower one first.',
      }[direction],
      direction === 'harmonic' || direction === 'mixed'
        ? 'Played together, 5ths and octaves sound hollow, 3rds and 6ths sweet, and 2nds and 7ths rub.'
        : 'Judge the size first: a step, a skip, a 4th or 5th, or a wide leap. Then choose between the closest answers.',
      'Stuck? Sing up the scale from the low note (do, re, mi…) and count notes until you reach the top one.',
    ],
    tips: {
      1: 'The smallest step, a tight rub. Jaws.',
      2: 'One whole step, do to re. Happy Birthday.',
      3: 'Dark: the bottom of a minor chord. Greensleeves.',
      4: 'Bright: the bottom of a major chord, do to mi. When the Saints.',
      5: 'Open but restless, do to fa. Here Comes the Bride.',
      6: 'Exactly half an octave and very unstable. Maria.',
      7: 'Hollow and stable, do to sol. Twinkle Twinkle.',
      8: 'Wide and bittersweet, mi up to do. The Entertainer.',
      9: 'Wide and warm, do to la. My Bonnie.',
      10: 'The frame of a dominant 7th, sol up to fa. Somewhere (West Side Story).',
      11: 'A half step short of the octave, sharp and aching. Do to ti.',
      12: 'The same note higher; the two blend into one. Over the Rainbow.',
    },
    why: 'Chords are stacks of 3rds, melodies move by steps and leaps, and the voice-leading rules are rules about the intervals between voices.',
  },
  degrees: {
    title: 'Scale degrees',
    hint: 'After the chords, hum do (♪ do plays it again). Sing from do to the note: do, re, mi… After you answer, the note walks home.',
    levels: {
      'do-sol': { label: 'do – sol (^1–^5)', items: [1, 2, 3, 4, 5] },
      all: { label: 'All seven', items: [1, 2, 3, 4, 5, 6, 7] },
    },
    label: (id) => `^${id} ${DEGREE_SOLFEGE[id - 1]}`,
    hears: () => 'Four chords (I – IV – V – I) set up a major key, then one note plays. The key changes every question, so you hear the note against home, not as a pitch.',
    how: ({ items }) => [
      'When the chords stop, hum the lowest note of the last chord. That is do, home. ♪ do plays it again.',
      `Sing from do to the note by step: do, re, mi… The syllable you land on is the answer. Measured up from do: ${items.filter((d) => d !== '1')
        .map((d, i) => `${DEGREE_SOLFEGE[d - 1]} ${i ? '' : 'is '}a ${['', '2nd', '3rd', '4th', '5th', '6th', '7th'][d - 1]}`).join(', ')}.`,
      'After you answer, the note walks home to do. Listen to that pull: it is how you learn each degree without counting.',
    ],
    tips: {
      1: 'Home. Nothing needs to happen next.',
      2: 'One step above home; wants to fall to do.',
      3: 'Bright and settled, the 3rd of the home chord.',
      4: 'Leans down to mi, like a held breath.',
      5: 'Strong and stable, the top of the home chord.',
      6: 'Warm and wistful; leans down to sol.',
      7: 'A half step under do, pulling hard upward.',
    },
    why: 'Harmony works with what a note does in its key, not its letter name: which chords fit it, and where it wants to go.',
  },
  triads: {
    title: 'Triad quality',
    hint: 'Major sounds bright, minor dark, diminished tight and unstable, augmented stretched and unresolved.',
    levels: {
      mm: { label: 'Major / minor', items: ['major', 'minor'] },
      mmd: { label: '+ diminished', items: ['major', 'minor', 'diminished'] },
      all: { label: '+ augmented', items: ['major', 'minor', 'diminished', 'augmented'] },
    },
    label: (id) => id[0].toUpperCase() + id.slice(1),
    hears: () => 'One triad in root position, played together and then one note at a time from the bottom. The root changes every question.',
    how: () => [
      'Take a first impression of the block chord: bright, dark, tight or stretched.',
      'Check with the broken chord. A major 3rd at the bottom means major (or augmented); a minor 3rd means minor (or diminished).',
      'Then the outer notes: a perfect 5th means major or minor. Narrower is diminished, wider is augmented.',
    ],
    tips: {
      major: 'Bright and stable. I, IV and V in a major key.',
      minor: 'Darker but stable. ii, iii and vi in a major key.',
      diminished: 'Two minor 3rds: small and tense. vii° in a major key.',
      augmented: 'Two major 3rds: stretched and unresolved. Rare.',
    },
    why: 'Quality narrows the chord down at once: in a major key, a diminished triad can only be vii°.',
  },
  inversions: {
    title: 'Inversions',
    hint: 'Listen only to the lowest note. Sing it, then find whether it is the root, 3rd, 5th or 7th of the chord.',
    levels: {
      triads: { label: 'Triads', items: ['5/3', '6', '6/4'] },
      sevenths: { label: 'V7 inversions', items: ['7', '6/5', '4/3', '4/2'] },
    },
    label: (id) => ({ '5/3': 'Root position', 6: '1st inv. (6)', '6/4': '2nd inv. (6/4)', 7: 'Root (7)', '6/5': '6/5', '4/3': '4/3', '4/2': '4/2' }[id]),
    hears: ({ items }) => (items.includes('7')
      ? 'A dominant 7th chord with the root, 3rd, 5th or 7th in the bass, then the bass note alone.'
      : 'A major or minor triad with the root, 3rd or 5th in the bass, then the bass note alone.'),
    how: ({ items }) => (items.includes('7') ? [
      'Ignore the top of the chord. Sing the lowest note; it plays again on its own.',
      'Hear the bass as a degree of the key the chord resolves to: sol is root position (7), ti is 6/5, re is 4/3 and fa is 4/2.',
      'In 4/2 the bass and the note above it are only a step apart (fa and sol), so the bottom of the chord sounds thick.',
    ] : [
      'Ignore the top of the chord. Sing the lowest note; it plays again on its own.',
      'Hum up through the chord from the bass. A 3rd then a 3rd is root position, a 3rd then a 4th is 6, a 4th then a 3rd is 6/4.',
      'Root position sounds grounded, 6 lighter, and 6/4 unsettled because of the 4th above the bass.',
    ]),
    tips: {
      '5/3': 'Root in the bass. Solid and complete.',
      6: '3rd in the bass. Lighter; good for stepwise bass lines.',
      '6/4': '5th in the bass. Unsettled; the 4th above the bass wants to move.',
      7: 'Sol in the bass. The strongest pull to I.',
      '6/5': 'Ti in the bass; it rises to do.',
      '4/3': 'Re in the bass; it steps to do or mi.',
      '4/2': 'Fa in the bass; it falls to mi, so I6 follows.',
    },
    why: 'Figured bass numbers are the intervals above the bass, so hearing the bass is hearing the figure.',
  },
  sevenths: {
    title: 'Seventh chords',
    hint: 'Dominant 7th has a bluesy pull; major 7th is soft and bright; minor 7th is mellow; half-diminished darker; fully diminished symmetrical and tense.',
    levels: {
      basic: { label: 'Dom / Maj / min 7', items: ['Mm7', 'MM7', 'mm7'] },
      all: { label: 'All five', items: ['Mm7', 'MM7', 'mm7', 'ø7', '°7'] },
    },
    label: (id) => ({ Mm7: 'Dominant 7 (Mm7)', MM7: 'Major 7 (MM7)', mm7: 'Minor 7 (mm7)', 'ø7': 'Half-dim. (ø7)', '°7': 'Fully dim. (°7)' }[id]),
    hears: () => 'One seventh chord in root position, played together and then one note at a time. The root changes every question.',
    how: () => [
      'Hear the bottom three notes as a triad: major, minor or diminished?',
      'Then the top note: a whole step under the octave (minor 7th, soft) or a half step under it (major 7th, a sharp rub)?',
      'Put the two together, using the answers below.',
    ],
    tips: {
      Mm7: 'Major triad + minor 7th. Bluesy and pulling: V7.',
      MM7: 'Major triad + major 7th. Soft and dreamy: Imaj7, IVmaj7.',
      mm7: 'Minor triad + minor 7th. Mellow: ii7, vi7.',
      'ø7': 'Diminished triad + minor 7th. Dark: viiø7 in major.',
      '°7': 'Diminished triad + diminished 7th. Very tense: vii°7 in minor.',
    },
    why: 'Each chord in a key has a fixed seventh-chord quality, so the quality tells you the function: in a major key, only V7 sounds dominant.',
  },
  cadences: {
    title: 'Cadences',
    hint: 'Does it end on the tonic? Then is the soprano on do (PAC) or mi (IAC)? Ending on V is a half cadence; landing on the “wrong” chord is deceptive.',
    levels: {
      basic: { label: 'PAC / IAC / HC', items: ['PAC', 'IAC', 'HC'] },
      full: { label: '+ deceptive', items: ['PAC', 'IAC', 'HC', 'DC'] },
    },
    label: (id) => ({ PAC: 'PAC', IAC: 'IAC', HC: 'Half', DC: 'Deceptive' }[id]),
    hears: ({ items }) => `A short four-part phrase in a random major key: I – ii6 – V, then it stops on V or moves on to ${items.includes('DC') ? 'I or vi' : 'I'}. Sometimes V has a 7th, or a cadential 6/4 comes before it.`,
    how: ({ items }) => [
      'Does it sound finished? Stopping on V sounds open, like a comma: half cadence.',
      ...(items.includes('DC') ? ['Did V move to a darker chord than home? That is vi: deceptive.'] : []),
      'Landed home? Sing the last top note, then sing do. The same note means PAC; ending on mi means IAC.',
    ],
    tips: {
      PAC: 'V → I, soprano ends on do. A full stop.',
      IAC: 'V → I, soprano ends on mi. Closed, but softer.',
      HC: 'Stops on V. A comma; the music has to go on.',
      DC: 'V → vi instead of I. A surprise, darker turn.',
    },
    why: 'Cadences are music’s punctuation: they show where phrases end and which ending to write when you harmonize.',
  },
};

const SEVENTH_SHAPES = { Mm7: [0, 4, 7, 10], MM7: [0, 4, 7, 11], mm7: [0, 3, 7, 10], 'ø7': [0, 3, 6, 10], '°7': [0, 3, 6, 9] };
const TRIAD_SHAPES = { major: [0, 4, 7], minor: [0, 3, 7], diminished: [0, 3, 6], augmented: [0, 4, 8] };
const INVERSION_SHAPES = {
  '5/3': [0, 4, 7, 12], 6: [4, 7, 12, 16], '6/4': [7, 12, 16, 19],
  7: [0, 4, 7, 10], '6/5': [4, 7, 10, 12], '4/3': [7, 10, 12, 16], '4/2': [10, 12, 16, 19],
};

/** Every item an exercise can ask about, across all its levels. */
export const allItems = (exercise) => [...new Set(Object.values(EXERCISES[exercise].levels).flatMap((lv) => lv.items.map(String)))];

/**
 * Build a question. Returns { exercise, answer, choices, events, reveal } where
 * events are [{ at (s), notes: [midi…] ascending, dur (s) }].
 */
export function makeQuestion(exercise, level, { direction = 'up', items = null, stats = {}, rand = Math.random } = {}) {
  const ex = EXERCISES[exercise];
  const lv = ex.levels[level] || Object.values(ex.levels)[0];
  // A lesson drill may name its own items, e.g. only M3, P5 and P8.
  const ids = (items || lv.items).map(String);
  const answer = weightedPick(ids, stats.items, rand);
  const choices = ids.map((id) => ({ id, label: ex.label(id) }));
  const events = [];
  let reveal = '';
  let after = null; // notes to play once answered
  let reference = null; // { label, events } the player can ask for while answering

  if (exercise === 'intervals') {
    const st = Number(answer);
    const low = 52 + Math.floor(rand() * 13); // E3 … E4
    const dir = direction === 'mixed' ? pick(['up', 'down', 'harmonic'], rand) : direction;
    if (dir === 'up') events.push({ at: 0, notes: [low], dur: 0.9 }, { at: 0.8, notes: [low + st], dur: 1.2 });
    if (dir === 'down') events.push({ at: 0, notes: [low + st], dur: 0.9 }, { at: 0.8, notes: [low], dur: 1.2 });
    if (dir === 'harmonic') events.push({ at: 0, notes: [low, low + st], dur: 1.8 });
    // The tunes all start with the interval rising.
    reveal = `${ivName(st).name}, ${st} semitone${st === 1 ? '' : 's'} (${dir === 'harmonic' ? 'together' : dir}). ${dir === 'up' ? 'Tune' : 'Rising, it starts'}: ${INTERVAL_SONGS[st]}.`;
  }

  if (exercise === 'degrees') {
    const shift = Math.floor(rand() * 12) - 5; // all 12 major keys, G up to F♯
    KEY_SETTER.forEach((v, i) => events.push({ at: i * 0.75, notes: midis(v, shift), dur: 0.8 }));
    const deg = Number(answer);
    const tonic = 60 + shift;
    events.push({ at: 3 * 0.75 + 1.6, notes: [tonic + DEGREE_ST[deg - 1]], dur: 1.6 });
    // After answering, the note walks home: do to fa fall to do, sol to ti rise to the do above.
    const path = deg <= 4 ? DEGREE_ST.slice(0, deg).reverse() : [...DEGREE_ST.slice(deg - 1), 12];
    const names = path.map((st) => DEGREE_SOLFEGE[DEGREE_ST.indexOf(st % 12)]);
    after = path.map((st, i) => ({ at: 0.2 + i * 0.45, notes: [tonic + st], dur: i === path.length - 1 ? 1.2 : 0.45 }));
    reference = { label: '♪ do', events: [{ at: 0, notes: [tonic], dur: 1.4 }] };
    reveal = `^${deg} (${DEGREE_SOLFEGE[deg - 1]}) in ${KEY_NAMES[(shift + 12) % 12]} major.${deg > 1 ? ` Walking home: ${names.join(' – ')}.` : ''}`;
  }

  if (exercise === 'triads' || exercise === 'sevenths') {
    const shape = (exercise === 'triads' ? TRIAD_SHAPES : SEVENTH_SHAPES)[answer];
    const root = 50 + Math.floor(rand() * 12); // D3 … C#4
    const notes = shape.map((s) => root + s);
    events.push({ at: 0, notes, dur: 1.6 });
    notes.forEach((n, i) => events.push({ at: 1.9 + i * 0.4, notes: [n], dur: 0.6 }));
    reveal = `${ex.label(answer)}, built ${shape.join('-')} semitones above the root.`;
  }

  if (exercise === 'inversions') {
    const shape = INVERSION_SHAPES[answer];
    const isSeventh = ['7', '6/5', '4/3', '4/2'].includes(answer);
    const triadMinor = !isSeventh && rand() < 0.5;
    const adj = triadMinor ? shape.map((s) => (s % 12 === 4 ? s - 1 : s)) : shape;
    const root = 43 + Math.floor(rand() * 8); // G2 … D3, the theoretical root
    const notes = adj.map((s) => root + s);
    events.push({ at: 0, notes, dur: 1.6 });
    events.push({ at: 1.9, notes: [notes[0]], dur: 1.2 });
    reveal = `${ex.label(answer)}${isSeventh ? ' of a dominant 7th' : triadMinor ? ' (minor triad)' : ' (major triad)'}. The second note was the bass.`;
  }

  if (exercise === 'cadences') {
    const phrase = pick(CADENCE_PHRASES[answer], rand);
    const shift = Math.floor(rand() * 9) - 4;
    phrase.voices.forEach((v, i) => events.push({ at: i * 0.9, notes: midis(v, shift), dur: i === phrase.voices.length - 1 ? 1.8 : 0.95 }));
    const rns = phrase.rns.map((rn) => (rn === 'I6/4' ? 'cadential 6/4' : rn));
    reveal = `${ex.label(answer)}: ${rns.join(' – ')} in ${KEY_NAMES[(shift + 12) % 12]} major.`;
  }

  return { exercise, level, answer, choices, events, reveal, after, reference };
}
