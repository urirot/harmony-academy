// Spelled-pitch theory: every note keeps its letter name, so an augmented
// second (F–G#) is not mistaken for a minor third (F–Ab). Pure functions only;
// the browser and the node tests import the same file.

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
const ACC_VALUE = { bb: -2, b: -1, '': 0, '#': 1, x: 2, '##': 2 };
const ACC_TEXT = { '-2': 'bb', '-1': 'b', 0: '', 1: '#', 2: 'x' };
const ACC_PRETTY = { '-2': '𝄫', '-1': '♭', 0: '', 1: '♯', 2: '𝄪' };

export function parsePitch(name) {
  const m = /^([A-G])(bb|b|##|#|x)?(-?\d)$/.exec(name);
  if (!m) throw new Error(`unparseable pitch "${name}"`);
  return makePitch(LETTERS.indexOf(m[1]), ACC_VALUE[m[2] || ''], Number(m[3]));
}

export function makePitch(letter, acc, oct) {
  return {
    letter, acc, oct,
    step: oct * 7 + letter,
    midi: 12 * (oct + 1) + LETTER_PC[letter] + acc,
    name: LETTERS[letter] + ACC_TEXT[acc] + oct,
  };
}

export const pcName = (letter, acc) => LETTERS[letter] + ACC_PRETTY[acc];
export const prettyPitch = (p) => pcName(p.letter, p.acc) + p.oct;
export const prettyName = (s) => s.replace(/bb/g, '𝄫').replace(/(?<=[A-G])b/g, '♭').replace(/#/g, '♯');

export const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ---------------------------------------------------------------- intervals

const PERFECT_SIZE = { 0: 0, 3: 5, 4: 7 };
const MAJOR_SIZE = { 1: 2, 2: 4, 5: 9, 6: 11 };

/** Interval between two spelled pitches, regardless of order. */
export function interval(a, b) {
  const [lo, hi] = (b.step > a.step || (b.step === a.step && b.midi >= a.midi)) ? [a, b] : [b, a];
  const gen = hi.step - lo.step;
  const semis = hi.midi - lo.midi;
  const octs = Math.floor(gen / 7);
  const sg = gen % 7;
  const ss = semis - 12 * octs;
  let quality;
  if (sg in PERFECT_SIZE) {
    const d = ss - PERFECT_SIZE[sg];
    quality = d === 0 ? 'P' : d > 0 ? 'A'.repeat(d) : 'd'.repeat(-d);
  } else {
    const d = ss - MAJOR_SIZE[sg];
    quality = d === 0 ? 'M' : d === -1 ? 'm' : d > 0 ? 'A'.repeat(d) : 'd'.repeat(-d - 1);
  }
  return { gen, semis, quality, simpleGen: sg, name: quality + (gen + 1), simpleName: quality + (sg + 1) };
}

export const isPerfectFifth = (iv) => iv.simpleGen === 4 && iv.quality === 'P';
export const isPerfectOctave = (iv) => iv.simpleGen === 0 && iv.quality === 'P';

// The 13 ascending intervals the ear trainer draws from, by semitone count.
export const INTERVALS = [
  { st: 0, short: 'P1', name: 'Unison' },
  { st: 1, short: 'm2', name: 'Minor 2nd' },
  { st: 2, short: 'M2', name: 'Major 2nd' },
  { st: 3, short: 'm3', name: 'Minor 3rd' },
  { st: 4, short: 'M3', name: 'Major 3rd' },
  { st: 5, short: 'P4', name: 'Perfect 4th' },
  { st: 6, short: 'TT', name: 'Tritone' },
  { st: 7, short: 'P5', name: 'Perfect 5th' },
  { st: 8, short: 'm6', name: 'Minor 6th' },
  { st: 9, short: 'M6', name: 'Major 6th' },
  { st: 10, short: 'm7', name: 'Minor 7th' },
  { st: 11, short: 'M7', name: 'Major 7th' },
  { st: 12, short: 'P8', name: 'Octave' },
];

// ---------------------------------------------------------------- keys

// Position on the circle of fifths: + sharps, − flats.
const MAJOR_FIFTHS = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7 };
const MINOR_FIFTHS = { A: 0, E: 1, B: 2, 'F#': 3, 'C#': 4, 'G#': 5, 'D#': 6, 'A#': 7, D: -1, G: -2, C: -3, F: -4, Bb: -5, Eb: -6, Ab: -7 };
const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6]; // F C G D A E B
const FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3];  // B E A D G C F

export function makeKey(tonic, mode = 'major') {
  const fifths = (mode === 'major' ? MAJOR_FIFTHS : MINOR_FIFTHS)[tonic];
  if (fifths === undefined) throw new Error(`unknown key ${tonic} ${mode}`);
  const sig = [0, 0, 0, 0, 0, 0, 0];
  if (fifths > 0) SHARP_ORDER.slice(0, fifths).forEach((l) => { sig[l] = 1; });
  if (fifths < 0) FLAT_ORDER.slice(0, -fifths).forEach((l) => { sig[l] = -1; });
  const tonicLetter = LETTERS.indexOf(tonic[0]);
  const name = `${prettyName(tonic)} ${mode}`;
  return { tonic, mode, sig, tonicLetter, name };
}

/** Spelled pitch class of scale degree 1–7. Minor keys raise ^7 when asked (harmonic minor). */
export function degreePc(key, degree, { raised = false } = {}) {
  const letter = (key.tonicLetter + degree - 1) % 7;
  let acc = key.sig[letter];
  if (raised && key.mode === 'minor' && degree === 7) acc += 1;
  return { letter, acc };
}

/** Lowest pitch with this spelling whose MIDI number is >= floorMidi. */
export function pitchAtOrAbove(pc, floorMidi) {
  let oct = Math.floor(floorMidi / 12) - 2;
  for (;;) {
    const p = makePitch(pc.letter, pc.acc, oct);
    if (p.midi >= floorMidi) return p;
    oct += 1;
  }
}

const samePc = (a, b) => a.letter === b.letter && a.acc === b.acc;

// ---------------------------------------------------------------- roman numerals

const NUMERALS = ['VII', 'VI', 'IV', 'V', 'III', 'II', 'I'];
const NUMERAL_DEGREE = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7 };
const FIGURE_INVERSION = { '': 0, 6: 1, '6/4': 2, 7: 0, '6/5': 1, '4/3': 2, '4/2': 3, 2: 3 };

/**
 * Parse a roman numeral in a key into a chord: spelled members (root, 3rd, 5th, 7th?)
 * and the inversion. Quality comes from the key, not the case of the numeral,
 * except that minor keys raise ^7 in V and vii° (harmonic minor).
 */
export function parseRoman(rn, key) {
  const m = /^(vii|vi|iv|v|iii|ii|i|VII|VI|IV|V|III|II|I)(o|°|ø|\+)?(7|6\/5|4\/3|4\/2|2|6\/4|6)?$/.exec(rn);
  if (!m) throw new Error(`unparseable roman numeral "${rn}"`);
  const numeral = m[1].toUpperCase();
  const degree = NUMERAL_DEGREE[numeral];
  const figure = m[3] || '';
  const seventh = ['7', '6/5', '4/3', '4/2', '2'].includes(figure);
  const dominantFunction = degree === 5 || degree === 7;
  const count = seventh ? 4 : 3;
  const members = [];
  for (let i = 0; i < count; i += 1) {
    const d = ((degree - 1 + 2 * i) % 7) + 1;
    members.push(degreePc(key, d, { raised: dominantFunction }));
  }
  return { rn, degree, figure, seventh, inversion: FIGURE_INVERSION[figure], members };
}

/** Chord-member role ('root','3rd','5th','7th') of a pitch in a chord, or null. */
export function roleOf(pitch, chord) {
  const i = chord.members.findIndex((pc) => samePc(pc, pitch));
  return i < 0 ? null : ['root', '3rd', '5th', '7th'][i];
}

/** Roman numeral text with the right case and quality symbol for the chord it spells. */
export function romanLabel(key, degree, { seventh = false, inversion = 0 } = {}) {
  const chord = parseRoman(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][degree - 1] + (seventh ? '7' : ''), key);
  const [r, t, f, s] = chord.members.map((pc, i) => makePitch(pc.letter, pc.acc, 4 + (i && pc.letter <= chord.members[0].letter ? 1 : 0)));
  const third = interval(r, t).name;
  const fifth = interval(r, f).name;
  let numeral = NUMERALS.find((n) => NUMERAL_DEGREE[n] === degree);
  let symbol = '';
  if (third === 'm3') numeral = numeral.toLowerCase();
  if (fifth === 'd5') symbol = '°';
  if (fifth === 'A5') symbol = '+';
  let figure = ['', '6', '6/4'][inversion];
  if (seventh) {
    const sev = interval(r, s).name;
    if (fifth === 'd5' && sev === 'm7') symbol = 'ø';
    if (third === 'M3' && sev === 'M7') symbol = 'M';
    figure = ['7', '6/5', '4/3', '4/2'][inversion];
  }
  return { numeral, symbol, figure, text: numeral + symbol + figure, members: chord.members };
}

export const QUALITY_NAMES = { major: 'Major', minor: 'Minor', diminished: 'Diminished', augmented: 'Augmented' };

export function triadQuality(root, third, fifth) {
  const t = interval(root, third).simpleName;
  const f = interval(root, fifth).simpleName;
  if (t === 'M3' && f === 'P5') return 'major';
  if (t === 'm3' && f === 'P5') return 'minor';
  if (t === 'm3' && f === 'd5') return 'diminished';
  if (t === 'M3' && f === 'A5') return 'augmented';
  return null;
}

// ---------------------------------------------------------------- voicing

const isLeadingTone = (pc, key) => samePc(pc, degreePc(key, 7, { raised: true }));

/**
 * A four-voice keyboard/SATB voicing for the chord explorer: bass in octave 2–3,
 * upper voices in close position around middle C. Triads double the bass
 * unless the bass is the leading tone, which is never doubled.
 */
export function voiceChord(key, rn) {
  const chord = parseRoman(rn, key);
  const bassPc = chord.members[chord.inversion];
  let upperPcs;
  if (chord.seventh) {
    upperPcs = chord.members.filter((_, i) => i !== chord.inversion);
  } else {
    let doubled = bassPc;
    if (isLeadingTone(bassPc, key)) doubled = chord.members[chord.degree === 7 ? 1 : 0];
    upperPcs = [...chord.members.filter((_, i) => i !== chord.inversion), doubled];
  }
  // Close position: try each upper note as the lowest and stack the rest above it.
  // Prefer a voicing with legal tenor–bass spacing, then a soprano near B♭4.
  let best = null;
  for (const bassFloor of [43, 55]) {
    const bass = pitchAtOrAbove(bassPc, bassFloor);
    for (let start = 0; start < upperPcs.length; start += 1) {
      const order = [...upperPcs.slice(start), ...upperPcs.slice(0, start)];
      const stack = [];
      let floor = Math.max(bass.midi + 1, 55); // tenor no lower than G3
      for (const pc of order) {
        const p = pitchAtOrAbove(pc, floor);
        stack.push(p);
        floor = p.midi + 1;
      }
      const score = (stack[0].midi - bass.midi > 19 ? 100 : 0) + Math.abs(stack[stack.length - 1].midi - 70);
      if (!best || score < best.score) best = { stack, bass, score };
    }
  }
  const [t, a, s] = best.stack;
  return { chord, voices: [s, a, t, best.bass] };
}

// ---------------------------------------------------------------- voice-leading checks

export const VOICES = ['Soprano', 'Alto', 'Tenor', 'Bass'];
export const RANGES = [['C4', 'G5'], ['G3', 'D5'], ['C3', 'G4'], ['F2', 'D4']].map(([lo, hi]) => [parsePitch(lo).midi, parsePitch(hi).midi]);

/** Melodic motion of one voice: '=', or an arrow plus the interval name. */
export function melodicMotion(a, b) {
  if (a.midi === b.midi && samePc(a, b)) return { dir: 0, iv: interval(a, b), label: '=' };
  const iv = interval(a, b);
  const dir = b.midi > a.midi || (b.midi === a.midi && b.step > a.step) ? 1 : -1;
  return { dir, iv, label: `${dir > 0 ? '↑' : '↓'}${iv.name}`, leap: iv.gen >= 2 };
}

/** Contrary / similar / parallel / oblique / static motion between two voices (OMT definitions). */
export function motionType(upperA, upperB, lowerA, lowerB) {
  const du = Math.sign(upperB.midi - upperA.midi);
  const dl = Math.sign(lowerB.midi - lowerA.midi);
  if (du === 0 && dl === 0) return 'static';
  if (du === 0 || dl === 0) return 'oblique';
  if (du !== dl) return 'contrary';
  const before = interval(lowerA, upperA);
  const after = interval(lowerB, upperB);
  // Same generic interval counts as parallel: a major 3rd moving to a minor 3rd is still parallel 3rds.
  return before.simpleGen === after.simpleGen ? 'parallel' : 'similar';
}

/** Problems inside one SATB chord: range, crossing, spacing, doubled leading tone, doubled 7th. */
export function checkChord(voices, key, chord) {
  const issues = [];
  voices.forEach((p, i) => {
    const [lo, hi] = RANGES[i];
    if (p.midi < lo || p.midi > hi) issues.push({ kind: 'range', msg: `${VOICES[i]} ${prettyPitch(p)} is outside its range` });
  });
  for (let i = 0; i < 3; i += 1) {
    if (voices[i].midi < voices[i + 1].midi) issues.push({ kind: 'crossing', msg: `${VOICES[i]} is below the ${VOICES[i + 1].toLowerCase()} (voice crossing)` });
  }
  if (voices[0].midi - voices[1].midi > 12) issues.push({ kind: 'spacing', msg: 'More than an octave between soprano and alto' });
  if (voices[1].midi - voices[2].midi > 12) issues.push({ kind: 'spacing', msg: 'More than an octave between alto and tenor' });
  if (voices[2].midi - voices[3].midi > 19) issues.push({ kind: 'spacing', msg: 'More than a twelfth between tenor and bass' });
  if (key) {
    const lt = degreePc(key, 7, { raised: true });
    const ltVoices = voices.filter((p) => samePc(p, lt));
    if (ltVoices.length > 1) issues.push({ kind: 'doubling', msg: `Leading tone ${pcName(lt.letter, lt.acc)} is doubled` });
  }
  if (chord && chord.seventh) {
    const sev = chord.members[3];
    if (voices.filter((p) => samePc(p, sev)).length > 1) issues.push({ kind: 'doubling', msg: 'Chordal seventh is doubled' });
  }
  if (chord) {
    const missing = chord.members.filter((pc, i) => i !== 2 && !voices.some((p) => samePc(p, pc)));
    if (missing.length) issues.push({ kind: 'construction', msg: `Missing chord member ${missing.map((pc) => pcName(pc.letter, pc.acc)).join(', ')}` });
    const foreign = voices.filter((p) => !chord.members.some((pc) => samePc(pc, p)));
    if (foreign.length) issues.push({ kind: 'construction', msg: `${foreign.map(prettyPitch).join(', ')} not in ${chord.rn}` });
  }
  return issues;
}

/** Problems moving from one SATB chord to the next. */
export function checkMotion(prev, next, key, prevChord, nextChord) {
  const issues = [];
  for (let i = 0; i < 4; i += 1) {
    for (let j = i + 1; j < 4; j += 1) {
      const before = interval(prev[j], prev[i]);
      const after = interval(next[j], next[i]);
      const type = motionType(prev[i], next[i], prev[j], next[j]);
      const pair = `${VOICES[i]}–${VOICES[j]}`;
      const moved = prev[i].midi !== next[i].midi;
      if (type === 'parallel' && isPerfectFifth(before) && isPerfectFifth(after)) issues.push({ kind: 'parallel', msg: `Parallel 5ths: ${pair}` });
      if (type === 'parallel' && isPerfectOctave(before) && isPerfectOctave(after) && moved) issues.push({ kind: 'parallel', msg: `Parallel ${after.gen === 0 ? 'unisons' : 'octaves'}: ${pair}` });
      if (type === 'contrary' && isPerfectFifth(before) && isPerfectFifth(after)) issues.push({ kind: 'parallel', msg: `Contrary 5ths: ${pair} (counts as parallels)` });
      if (type === 'contrary' && isPerfectOctave(before) && isPerfectOctave(after)) issues.push({ kind: 'parallel', msg: `Contrary octaves: ${pair} (counts as parallels)` });
      if (i === 0 && j === 3 && type === 'similar' && (isPerfectFifth(after) || isPerfectOctave(after))) {
        const sopLeap = melodicMotion(prev[0], next[0]).leap;
        if (sopLeap) issues.push({ kind: 'direct', msg: `Direct (hidden) ${isPerfectFifth(after) ? '5th' : 'octave'} in the outer voices: soprano leaps in similar motion` });
      }
    }
  }
  for (let i = 0; i < 3; i += 1) {
    if (next[i + 1].midi > prev[i].midi) issues.push({ kind: 'overlap', msg: `${VOICES[i + 1]} moves above where the ${VOICES[i].toLowerCase()} just was (overlap)` });
    if (next[i].midi < prev[i + 1].midi) issues.push({ kind: 'overlap', msg: `${VOICES[i]} moves below where the ${VOICES[i + 1].toLowerCase()} just was (overlap)` });
  }
  for (let i = 0; i < 4; i += 1) {
    const mm = melodicMotion(prev[i], next[i]);
    if (mm.dir === 0) continue;
    if (/^A/.test(mm.iv.simpleName) || /^d/.test(mm.iv.simpleName)) {
      const allowed = mm.iv.simpleName === 'd5' && mm.dir < 0 && i === 3; // a falling diminished 5th in the bass is common
      if (!allowed) issues.push({ kind: 'melodic', msg: `${VOICES[i]} moves by ${mm.iv.name} (${mm.iv.quality.startsWith('A') ? 'augmented' : 'diminished'} melodic interval)` });
    }
    if (i < 3 && mm.iv.gen > 7) issues.push({ kind: 'melodic', msg: `${VOICES[i]} leaps more than an octave` });
  }
  if (key && prevChord && nextChord) {
    const lt = degreePc(key, 7, { raised: true });
    const tonic = degreePc(key, 1);
    const dominant = prevChord.degree === 5 || prevChord.degree === 7;
    const toTonic = nextChord.degree === 1;
    if (dominant && toTonic && samePc(prev[0], lt) && !samePc(next[0], tonic)) {
      issues.push({ kind: 'tendency', msg: 'Leading tone in the soprano does not resolve up to tonic' });
    }
    if (prevChord.seventh && !nextChord.seventh) {
      const sev = prevChord.members[3];
      prev.forEach((p, i) => {
        if (!samePc(p, sev)) return;
        const mm = melodicMotion(p, next[i]);
        if (!(mm.dir < 0 && mm.iv.gen === 1)) issues.push({ kind: 'tendency', msg: `Chordal 7th in the ${VOICES[i].toLowerCase()} does not resolve down by step` });
      });
    }
  }
  return issues;
}

/** Full analysis of a progression given as [{rn, voices:['G4','E4','C4','C3']}]. */
export function analyzeProgression(steps, key, { standalone = false } = {}) {
  const parsed = steps.map((s) => {
    const voices = s.voices.map(parsePitch);
    const chord = s.rn ? parseRoman(s.rn, key) : null;
    return { ...s, voices, chord, issues: checkChord(voices, key, chord) };
  });
  const transitions = [];
  for (let k = 1; k < (standalone ? 0 : parsed.length); k += 1) {
    const a = parsed[k - 1];
    const b = parsed[k];
    transitions.push({
      motions: a.voices.map((p, i) => melodicMotion(p, b.voices[i])),
      outer: motionType(a.voices[0], b.voices[0], a.voices[3], b.voices[3]),
      issues: checkMotion(a.voices, b.voices, key, a.chord, b.chord),
    });
  }
  return { chords: parsed, transitions };
}

/** Semitone offset that moves a progression written in C into a random key, staying in range. */
export function randomTransposition(rand = Math.random) {
  return Math.floor(rand() * 7) - 3; // −3 … +3 semitones
}
