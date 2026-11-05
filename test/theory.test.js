import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parsePitch, interval, makeKey, parseRoman, romanLabel, voiceChord, checkChord,
  checkMotion, analyzeProgression, motionType, degreePc, pcName,
} from '../js/theory.js';
import { LESSONS } from '../js/curriculum.js';

const P = parsePitch;
const C = makeKey('C');
const a = makeKey('A', 'minor');

test('pitch parsing', () => {
  assert.equal(P('C4').midi, 60);
  assert.equal(P('A4').midi, 69);
  assert.equal(P('G#4').midi, 68);
  assert.equal(P('Bb3').midi, 58);
  assert.equal(P('B#3').midi, 60);
});

test('intervals keep their spelling', () => {
  assert.equal(interval(P('F4'), P('G#4')).name, 'A2');
  assert.equal(interval(P('F4'), P('Ab4')).name, 'm3');
  assert.equal(interval(P('B3'), P('F4')).name, 'd5');
  assert.equal(interval(P('F3'), P('B3')).name, 'A4');
  assert.equal(interval(P('C3'), P('E4')).name, 'M10');
  assert.equal(interval(P('C3'), P('E4')).simpleName, 'M3');
  assert.equal(interval(P('G4'), P('C4')).name, 'P5');
  assert.equal(interval(P('G3'), P('C4')).name, 'P4');
  assert.equal(interval(P('C4'), P('C4')).name, 'P1');
  assert.equal(interval(P('C4'), P('C5')).name, 'P8');
});

test('key signatures', () => {
  assert.deepEqual(makeKey('D').sig, [1, 0, 0, 1, 0, 0, 0]);
  assert.deepEqual(makeKey('Bb').sig, [0, 0, -1, 0, 0, 0, -1]);
  assert.deepEqual(makeKey('E', 'minor').sig, [0, 0, 0, 1, 0, 0, 0]);
  const lt = degreePc(a, 7, { raised: true });
  assert.equal(pcName(lt.letter, lt.acc), 'G♯');
});

test('roman numerals take quality from the key', () => {
  assert.equal(romanLabel(C, 2).text, 'ii');
  assert.equal(romanLabel(C, 7).text, 'vii°');
  assert.equal(romanLabel(C, 5, { seventh: true }).text, 'V7');
  assert.equal(romanLabel(C, 7, { seventh: true }).text, 'viiø7');
  assert.equal(romanLabel(a, 5).text, 'V');
  assert.equal(romanLabel(a, 2).text, 'ii°');
  assert.equal(romanLabel(a, 3).text, 'III');
  assert.equal(romanLabel(a, 7, { seventh: true }).text, 'vii°7');
  assert.equal(romanLabel(C, 1, { seventh: true }).text, 'IM7');
  assert.equal(romanLabel(C, 1, { inversion: 2 }).text, 'I6/4');
  const v65 = parseRoman('V6/5', a);
  assert.equal(v65.inversion, 1);
  assert.deepEqual(v65.members.map((m) => pcName(m.letter, m.acc)), ['E', 'G♯', 'B', 'D']);
});

const MINOR_FORM = { I: 'i', I6: 'i6', 'I6/4': 'i6/4', ii6: 'ii°6', IV: 'iv', vi: 'VI' };

test('explorer voicings are clean SATB chords', () => {
  for (const key of [C, a, makeKey('Eb'), makeKey('F#', 'minor')]) {
    for (const rn of ['I', 'I6', 'I6/4', 'ii6', 'IV', 'V', 'V6', 'V7', 'V6/5', 'V4/3', 'V4/2', 'vi', 'vii°6']) {
      const numeral = key.mode === 'minor' ? (MINOR_FORM[rn] || rn) : rn;
      const { voices, chord } = voiceChord(key, numeral);
      const issues = checkChord(voices, key, chord).filter((x) => x.kind !== 'range');
      assert.deepEqual(issues, [], `${key.name} ${numeral}: ${issues.map((x) => x.msg).join('; ')}`);
    }
  }
});

test('the original lesson voicing I–V–I is clean', () => {
  const r = analyzeProgression([
    { rn: 'I', voices: ['G4', 'E4', 'C4', 'C3'] },
    { rn: 'V', voices: ['G4', 'D4', 'B3', 'G2'] },
    { rn: 'I', voices: ['G4', 'E4', 'C4', 'C3'] },
  ], C);
  assert.deepEqual(r.chords.flatMap((c) => c.issues), []);
  assert.deepEqual(r.transitions.flatMap((t) => t.issues), []);
  assert.deepEqual(r.transitions[0].motions.map((m) => m.label), ['=', '↓M2', '↓m2', '↓P4']);
});

test('voice-leading errors are caught', () => {
  const par5 = checkMotion([P('G4'), P('E4'), P('C4'), P('C3')], [P('A4'), P('F4'), P('D4'), P('D3')], C);
  assert.ok(par5.some((x) => /Parallel 5ths: Soprano–Tenor/.test(x.msg)), JSON.stringify(par5));
  assert.ok(par5.some((x) => /Parallel octaves: Tenor–Bass/.test(x.msg)), JSON.stringify(par5));
  const a2 = checkMotion([P('A4'), P('F4'), P('D4'), P('D3')], [P('B4'), P('G#4'), P('E4'), P('E3')], a);
  assert.ok(a2.some((x) => /A2/.test(x.msg)), JSON.stringify(a2));
  const dblLt = checkChord([P('B4'), P('D4'), P('G3'), P('B2')], C, parseRoman('V6', C));
  assert.ok(dblLt.some((x) => x.kind === 'doubling'));
  assert.equal(motionType(P('E4'), P('F4'), P('C3'), P('A2')), 'contrary');
  assert.equal(motionType(P('E4'), P('F4'), P('C3'), P('D3')), 'parallel');
  assert.equal(motionType(P('E4'), P('G4'), P('C3'), P('D3')), 'similar');
  assert.equal(motionType(P('G4'), P('G4'), P('C3'), P('G2')), 'oblique');
});

// Every progression in the course must be voiced the way the course claims:
// clean ones have no issues, and "find the error" ones have the errors they name.
test('curriculum progressions match their claims', () => {
  for (const lesson of LESSONS) {
    for (const prog of lesson.progressions || []) {
      const key = makeKey(prog.key.tonic, prog.key.mode);
      const r = analyzeProgression(prog.steps, key, { standalone: prog.standalone });
      const found = [...r.chords.flatMap((c) => c.issues), ...r.transitions.flatMap((t) => t.issues)];
      const where = `${lesson.id} / ${prog.title}`;
      if (prog.faulty) {
        for (const kind of prog.faulty) assert.ok(found.some((x) => x.kind === kind), `${where}: expected a ${kind} error, found ${JSON.stringify(found.map((x) => x.msg))}`);
      } else {
        assert.deepEqual(found.map((x) => x.msg), [], `${where} should be clean`);
      }
    }
  }
});

test('ear-training cadence phrases and key-setter are cleanly voiced', async () => {
  const { CADENCE_PHRASES, KEY_SETTER, KEY_SETTER_RNS } = await import('../js/ear.js');
  const phrases = [...Object.values(CADENCE_PHRASES).flat(), { rns: KEY_SETTER_RNS, voices: KEY_SETTER }];
  for (const ph of phrases) {
    const r = analyzeProgression(ph.voices.map((voices, i) => ({ rn: ph.rns[i], voices })), C);
    const found = [...r.chords.flatMap((c) => c.issues), ...r.transitions.flatMap((t) => t.issues)].map((x) => x.msg);
    assert.deepEqual(found, [], ph.rns.join('-'));
  }
});

test('ear questions: every level yields valid answers and playable notes', async () => {
  const { EXERCISES, makeQuestion } = await import('../js/ear.js');
  let seed = 1;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (const [ex, def] of Object.entries(EXERCISES)) {
    for (const level of Object.keys(def.levels)) {
      for (const direction of ['up', 'down', 'harmonic', 'mixed']) {
        for (let k = 0; k < 40; k += 1) {
          const q = makeQuestion(ex, level, { direction, rand });
          assert.ok(q.choices.some((c) => c.id === q.answer), `${ex}/${level}: answer not among choices`);
          assert.ok(q.choices.every((c) => c.label), `${ex}/${level}: missing label`);
          const notes = q.events.flatMap((e) => e.notes);
          assert.ok(notes.length > 0 && notes.every((m) => Number.isInteger(m) && m >= 36 && m <= 84), `${ex}/${level}: notes ${notes}`);
          assert.ok(q.reveal.length > 0);
          const extra = [...(q.after || []), ...(q.reference?.events || [])].flatMap((e) => e.notes);
          assert.ok(extra.every((m) => Number.isInteger(m) && m >= 36 && m <= 84), `${ex}/${level}: extra notes ${extra}`);
        }
      }
    }
  }
});

test('weighted picking favours weak items', async () => {
  const { weightedPick } = await import('../js/ear.js');
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const counts = { a: 0, b: 0 };
  for (let i = 0; i < 4000; i += 1) counts[weightedPick(['a', 'b'], { a: [10, 10], b: [10, 0] }, rand)] += 1;
  assert.ok(counts.b > counts.a * 3, JSON.stringify(counts));
});

test('every lesson explains itself and has a valid ear-training plan', async () => {
  const { EXERCISES, allItems, makeQuestion } = await import('../js/ear.js');
  const { progressionById } = await import('../js/curriculum.js');
  for (const lesson of LESSONS) {
    assert.ok(lesson.explain?.length >= 1, `${lesson.id}: no explanation`);
    for (const sec of lesson.explain) {
      assert.ok(sec.h && sec.p?.length, `${lesson.id}: section without heading or text`);
      for (const h of sec.hear || []) {
        if (typeof h === 'string') assert.ok(progressionById(h), `${lesson.id}: unknown example ${h}`);
        else h.seq.flat().forEach((n) => assert.doesNotThrow(() => parsePitch(n), `${lesson.id}: bad note ${n}`));
      }
    }
    assert.ok(lesson.practice?.length >= 1, `${lesson.id}: no ear-training plan`);
    for (const d of lesson.practice) {
      const ex = EXERCISES[d.exercise];
      assert.ok(ex, `${lesson.id}: unknown exercise ${d.exercise}`);
      if (d.level) assert.ok(ex.levels[d.level], `${lesson.id}: unknown level ${d.level}`);
      if (d.items) d.items.forEach((id) => assert.ok(allItems(d.exercise).includes(String(id)), `${lesson.id}: unknown item ${id}`));
      if (d.direction) assert.ok(ex.directions?.[d.direction], `${lesson.id}: unknown direction ${d.direction}`);
      assert.ok(d.why && d.more && d.count > 0 && d.target > 0 && d.target <= 100, `${lesson.id}: drill needs why and more`);
      const q = makeQuestion(d.exercise, d.level, { items: d.items?.map(String), direction: d.direction });
      if (d.items) assert.ok(d.items.map(String).includes(q.answer), `${lesson.id}: drill asked outside its items`);
    }
  }
});

test('Learn more: every exercise explains itself and every answer has a tip', async () => {
  const { EXERCISES, allItems } = await import('../js/ear.js');
  for (const [id, ex] of Object.entries(EXERCISES)) {
    for (const lv of Object.values(ex.levels)) {
      for (const direction of Object.keys(ex.directions || { up: 1 })) {
        const opts = { items: lv.items.map(String), direction };
        assert.ok(ex.hears(opts).length > 0, `${id}: hears`);
        const steps = ex.how(opts);
        assert.ok(steps.length >= 2 && steps.length <= 4 && steps.every(Boolean), `${id}: how`);
      }
    }
    for (const item of allItems(id)) assert.ok(ex.tips[item], `${id}: no tip for ${item}`);
    assert.ok(ex.why, `${id}: why`);
  }
});

test('scale degrees walk home to do after the answer', async () => {
  const { makeQuestion } = await import('../js/ear.js');
  for (const deg of [1, 2, 3, 4, 5, 6, 7]) {
    const q = makeQuestion('degrees', 'all', { items: [String(deg)] });
    const tonic = q.reference.events[0].notes[0];
    const path = q.after.map((e) => e.notes[0]);
    const target = q.events.at(-1).notes[0];
    assert.equal(path[0], target, `^${deg} starts on the note`);
    assert.equal((path.at(-1) - tonic) % 12, 0, `^${deg} ends on do`);
    assert.ok(path.slice(1).every((m, i) => Math.abs(m - path[i]) <= 2), `^${deg} moves by step`);
  }
});
