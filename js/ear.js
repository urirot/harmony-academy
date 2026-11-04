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

// Cadence phrases in C. Every phrase opens I – ii6 – V; there are two V
// voicings, so the soprano on V does not give the answer away.
const OPEN = [['E5', 'C5', 'G4', 'C3'], ['D5', 'A4', 'F4', 'F3']];
const V_LOW = ['B4', 'G4', 'D4', 'G3'];
const V_HIGH = ['D5', 'B4', 'D4', 'G3'];
export const CADENCE_PHRASES = {
  PAC: [
    { rns: ['I', 'ii6', 'V', 'I'], voices: [...OPEN, V_LOW, ['C5', 'G4', 'E4', 'C3']] },
    { rns: ['I', 'ii6', 'V', 'I'], voices: [...OPEN, V_HIGH, ['C5', 'G4', 'E4', 'C3']] },
  ],
  IAC: [
    { rns: ['I', 'ii6', 'V', 'I'], voices: [...OPEN, V_HIGH, ['E5', 'C5', 'C4', 'C3']] },
  ],
  HC: [
    { rns: ['I', 'ii6', 'V'], voices: [...OPEN, V_LOW] },
    { rns: ['I', 'ii6', 'V'], voices: [...OPEN, V_HIGH] },
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
  },
  degrees: {
    title: 'Scale degrees',
    hint: 'After the cadence, hum do. Then sing up or down from do to the note and count.',
    levels: {
      'do-sol': { label: 'do – sol (^1–^5)', items: [1, 2, 3, 4, 5] },
      all: { label: 'All seven', items: [1, 2, 3, 4, 5, 6, 7] },
    },
    label: (id) => `^${id} ${DEGREE_SOLFEGE[id - 1]}`,
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
  },
  inversions: {
    title: 'Inversions',
    hint: 'Listen only to the lowest note. Sing it, then find whether it is the root, 3rd, 5th or 7th of the chord.',
    levels: {
      triads: { label: 'Triads', items: ['5/3', '6', '6/4'] },
      sevenths: { label: 'V7 inversions', items: ['7', '6/5', '4/3', '4/2'] },
    },
    label: (id) => ({ '5/3': 'Root position', 6: '1st inv. (6)', '6/4': '2nd inv. (6/4)', 7: 'Root (7)', '6/5': '6/5', '4/3': '4/3', '4/2': '4/2' }[id]),
  },
  sevenths: {
    title: 'Seventh chords',
    hint: 'Dominant 7th has a bluesy pull; major 7th is soft and bright; minor 7th is mellow; half-diminished darker; fully diminished symmetrical and tense.',
    levels: {
      basic: { label: 'Dom / Maj / min 7', items: ['Mm7', 'MM7', 'mm7'] },
      all: { label: 'All five', items: ['Mm7', 'MM7', 'mm7', 'ø7', '°7'] },
    },
    label: (id) => ({ Mm7: 'Dominant 7 (Mm7)', MM7: 'Major 7 (MM7)', mm7: 'Minor 7 (mm7)', 'ø7': 'Half-dim. (ø7)', '°7': 'Fully dim. (°7)' }[id]),
  },
  cadences: {
    title: 'Cadences',
    hint: 'Does it end on the tonic? Then is the soprano on do (PAC) or mi (IAC)? Ending on V is a half cadence; landing on the “wrong” chord is deceptive.',
    levels: {
      basic: { label: 'PAC / IAC / HC', items: ['PAC', 'IAC', 'HC'] },
      full: { label: '+ deceptive', items: ['PAC', 'IAC', 'HC', 'DC'] },
    },
    label: (id) => ({ PAC: 'PAC', IAC: 'IAC', HC: 'Half', DC: 'Deceptive' }[id]),
  },
};

const SEVENTH_SHAPES = { Mm7: [0, 4, 7, 10], MM7: [0, 4, 7, 11], mm7: [0, 3, 7, 10], 'ø7': [0, 3, 6, 10], '°7': [0, 3, 6, 9] };
const TRIAD_SHAPES = { major: [0, 4, 7], minor: [0, 3, 7], diminished: [0, 3, 6], augmented: [0, 4, 8] };
const INVERSION_SHAPES = {
  '5/3': [0, 4, 7, 12], 6: [4, 7, 12, 16], '6/4': [7, 12, 16, 19],
  7: [0, 4, 7, 10], '6/5': [4, 7, 10, 12], '4/3': [7, 10, 12, 16], '4/2': [10, 12, 16, 19],
};

/**
 * Build a question. Returns { exercise, answer, choices, events, reveal } where
 * events are [{ at (s), notes: [midi…] ascending, dur (s) }].
 */
export function makeQuestion(exercise, level, { direction = 'up', stats = {}, rand = Math.random } = {}) {
  const ex = EXERCISES[exercise];
  const lv = ex.levels[level] || Object.values(ex.levels)[0];
  const ids = lv.items.map(String);
  const answer = weightedPick(ids, stats.items, rand);
  const choices = ids.map((id) => ({ id, label: ex.label(id) }));
  const events = [];
  let reveal = '';

  if (exercise === 'intervals') {
    const st = Number(answer);
    const low = 52 + Math.floor(rand() * 13); // E3 … E4
    const dir = direction === 'mixed' ? pick(['up', 'down', 'harmonic'], rand) : direction;
    if (dir === 'up') events.push({ at: 0, notes: [low], dur: 0.9 }, { at: 0.8, notes: [low + st], dur: 1.2 });
    if (dir === 'down') events.push({ at: 0, notes: [low + st], dur: 0.9 }, { at: 0.8, notes: [low], dur: 1.2 });
    if (dir === 'harmonic') events.push({ at: 0, notes: [low, low + st], dur: 1.8 });
    reveal = `${ivName(st).name}, ${st} semitone${st === 1 ? '' : 's'} (${dir === 'harmonic' ? 'together' : dir}). Tune: ${INTERVAL_SONGS[st]}.`;
  }

  if (exercise === 'degrees') {
    const shift = Math.floor(rand() * 12) - 5; // keys G♭ … F
    KEY_SETTER.forEach((v, i) => events.push({ at: i * 0.75, notes: midis(v, shift), dur: 0.8 }));
    const deg = Number(answer);
    events.push({ at: 3 * 0.75 + 1.6, notes: [60 + shift + DEGREE_ST[deg - 1]], dur: 1.6 });
    reveal = `^${deg} (${DEGREE_SOLFEGE[deg - 1]}) in ${KEY_NAMES[(shift + 12) % 12]} major.`;
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
    reveal = `${ex.label(answer)}: ${phrase.rns.join(' – ')} in ${KEY_NAMES[(shift + 12) % 12]} major.`;
  }

  return { exercise, level, answer, choices, events, reveal };
}
