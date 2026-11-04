import { LESSONS, WEEKS, SOURCES, lessonById, progressionById } from './curriculum.js';
import {
  parsePitch, parseRoman, romanLabel, makeKey, voiceChord, analyzeProgression, interval,
  degreePc, pitchAtOrAbove, prettyPitch, prettyName, pcName, triadQuality, VOICES,
} from './theory.js';
import * as audio from './audio.js';
import { EXERCISES, makeQuestion } from './ear.js';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const scrollTo = (el) => el.scrollIntoView({ behavior: 'smooth', block: 'start' });

// ================================================================ state

const STORE = 'harmony-academy:v1';

function freshState() {
  return {
    version: 1,
    current: 'w1l2',
    // Lesson 1 was finished, and the interval record carried over, in the original app.
    lessons: { w1l1: { tasks: Object.fromEntries(lessonById('w1l1').tasks.map((t) => [t.id, true])), journal: '' } },
    ear: { intervals: { attempts: 28, correct: 5, items: {}, recent: [] } },
    earSettings: {},
    practice: {},
    workbench: { key: 'C-major', text: '' },
    dockOpen: true,
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE));
    if (saved && saved.version === 1) return { ...freshState(), ...saved };
  } catch { /* storage blocked or corrupt: start fresh */ }
  return freshState();
}

let state = loadState();
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* private mode */ }
}
const lessonRec = (id) => (state.lessons[id] ||= { tasks: {}, journal: '' });
const lessonDone = (l) => l.tasks.filter((t) => lessonRec(l.id).tasks[t.id]).length;
const current = () => lessonById(state.current) || LESSONS[0];

// ================================================================ keys

const KEY_CHOICES = [
  ['C', 'major'], ['G', 'major'], ['D', 'major'], ['A', 'major'], ['F', 'major'], ['Bb', 'major'], ['Eb', 'major'],
  ['A', 'minor'], ['E', 'minor'], ['D', 'minor'], ['G', 'minor'], ['C', 'minor'],
];
const keyValue = (k) => `${k.tonic}-${k.mode}`;
const keyFromValue = (v) => { const [t, m] = v.split('-'); return makeKey(t, m); };
function fillKeySelect(sel, value) {
  sel.innerHTML = KEY_CHOICES.map(([t, m]) => `<option value="${t}-${m}">${prettyName(t)} ${m}</option>`).join('');
  sel.value = value;
}

// ================================================================ roman numeral display

/** "V6/5 (passing)" → numeral, symbol, stacked figure, trailing text. */
function rnHtml(text) {
  if (!text) return '';
  const m = /^(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)([°oø+M]?)([0-9/–]*)(.*)$/.exec(text);
  if (!m) return `<span class="rn">${esc(text)}</span>`;
  const [, num, sym, fig, rest] = m;
  let figHtml = '';
  if (fig.includes('/')) figHtml = `<span class="fig">${fig.split('/').map((f) => `<span>${esc(f)}</span>`).join('')}</span>`;
  else if (fig) figHtml = `<sup>${esc(fig)}</sup>`;
  return `<span class="rn">${esc(num)}${sym === 'o' ? '°' : esc(sym)}${figHtml}</span>${rest ? `<span class="small muted">${esc(rest)}</span>` : ''}`;
}

// ================================================================ keyboard (piano dock)

const LOW = 36; // C2
const HIGH = 84; // C6
const isBlack = (m) => [1, 3, 6, 8, 10].includes(m % 12);
const keyEls = new Map();
const lit = new Map(); // midi -> count of sounding notes

function buildPiano() {
  const piano = $('#piano');
  const whites = [];
  for (let m = LOW; m <= HIGH; m += 1) if (!isBlack(m)) whites.push(m);
  const w = 100 / whites.length;
  for (let m = LOW; m <= HIGH; m += 1) {
    const el = document.createElement('div');
    el.dataset.midi = m;
    if (isBlack(m)) {
      const prevWhite = whites.indexOf(m - 1);
      el.className = 'key black';
      el.style.left = `${(prevWhite + 1) * w - w * 0.3}%`;
      el.style.width = `${w * 0.6}%`;
    } else {
      const i = whites.indexOf(m);
      el.className = `key white${m === 60 ? ' middle-c' : ''}`;
      el.style.left = `${i * w}%`;
      el.style.width = `${w}%`;
      if (m % 12 === 0) el.textContent = `C${m / 12 - 1}`;
    }
    piano.appendChild(el);
    keyEls.set(m, el);
  }
  piano.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.key');
    if (!el) return;
    e.preventDefault();
    userNote(Number(el.dataset.midi));
  });
  // Show C3–C5 in the middle on narrow screens.
  const wrap = $('.piano-wrap');
  requestAnimationFrame(() => { wrap.scrollLeft = (wrap.scrollWidth - wrap.clientWidth) / 2; });
}

audio.onNote((midi, on, kind) => {
  const el = keyEls.get(midi);
  if (!el) return;
  const cls = `lit-${kind || 'upper'}`;
  if (on) {
    lit.set(midi, (lit.get(midi) || 0) + 1);
    el.classList.add(cls);
  } else {
    const n = (lit.get(midi) || 1) - 1;
    lit.set(midi, n);
    if (n <= 0) el.classList.remove('lit-bass', 'lit-upper', 'lit-user');
  }
});

/** A note the user played (click, computer key or MIDI). */
function userNote(midi, vel = 0.22) {
  audio.note(midi, { dur: 1.1, vel, kind: 'user' });
  $('#dockStatus').textContent = `${prettyPitch(midiPitch(midi))} · MIDI ${midi}`;
  if (drill) drillToggle(midi);
}

const SHARP_SPELL = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const midiPitch = (m) => parsePitch(`${SHARP_SPELL[m % 12]}${Math.floor(m / 12) - 1}`);

// Computer keyboard: A row is the white keys from C, W row the black keys.
const KEYMAP = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, ';': 16 };
let kbOctave = 4;
const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;

document.addEventListener('keydown', (e) => {
  if (typing(e) || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
  const k = e.key.toLowerCase();
  if (k === ' ') { e.preventDefault(); earNew(); return; }
  if (k === 'r') { earReplay(); return; }
  if (/^[1-9]$/.test(k)) { const b = $('#earAnswers').children[Number(k) - 1]; if (b) b.click(); return; }
  if (k === 'z') { kbOctave = Math.max(2, kbOctave - 1); $('#dockStatus').textContent = `Computer keys start at C${kbOctave}`; return; }
  if (k === 'x') { kbOctave = Math.min(5, kbOctave + 1); $('#dockStatus').textContent = `Computer keys start at C${kbOctave}`; return; }
  if (k in KEYMAP) userNote(12 * (kbOctave + 1) + KEYMAP[k]);
});

// Web MIDI, where the browser has it (Chrome, Edge; not Safari).
const held = new Set();
function setupMidi() {
  if (!navigator.requestMIDIAccess) return;
  const btn = $('#midiBtn');
  btn.hidden = false;
  btn.addEventListener('click', async () => {
    try {
      const access = await navigator.requestMIDIAccess();
      const bind = () => {
        let n = 0;
        access.inputs.forEach((input) => { n += 1; input.onmidimessage = onMidi; });
        btn.textContent = n ? `MIDI: ${n} input${n > 1 ? 's' : ''}` : 'No MIDI input';
        btn.classList.toggle('on', n > 0);
      };
      bind();
      access.onstatechange = bind;
    } catch {
      btn.textContent = 'MIDI blocked';
    }
  });
}
function onMidi({ data: [status, midi, vel] }) {
  const cmd = status & 0xf0;
  if (cmd === 0x90 && vel > 0) {
    held.add(midi);
    audio.note(midi, { dur: 1.2, vel: 0.08 + (vel / 127) * 0.25, kind: 'user' });
    if (drill) drillFromMidi();
  } else if (cmd === 0x80 || (cmd === 0x90 && vel === 0)) {
    held.delete(midi);
  }
}

// ================================================================ playback helpers

let playTimers = [];
function stopAll() {
  audio.stopAll();
  playTimers.forEach(clearTimeout);
  playTimers = [];
  document.querySelectorAll('.playing').forEach((el) => el.classList.remove('playing'));
}

function playEvents(events) {
  stopAll();
  events.forEach((ev) => ev.notes.forEach((m, i) => audio.note(m, {
    at: ev.at, dur: ev.dur, kind: ev.notes.length > 1 && i === 0 ? 'bass' : 'upper',
  })));
}

// ================================================================ course map + lesson

function renderCourse() {
  const nav = $('#course');
  const status = (l) => {
    const done = lessonDone(l);
    if (done === l.tasks.length) return '<span class="status done" title="Complete">✓</span>';
    if (done > 0) return `<span class="status partial" title="${done}/${l.tasks.length} done">◐</span>`;
    return '<span class="status">○</span>';
  };
  nav.innerHTML = `
    <select class="course-select" id="courseSelect" aria-label="Lesson">
      ${LESSONS.map((l) => `<option value="${l.id}">W${l.week} L${l.n} · ${esc(l.title)}${lessonDone(l) === l.tasks.length ? ' ✓' : ''}</option>`).join('')}
    </select>
    ${WEEKS.map((w) => `
      <div class="week">
        <h3>Week ${w.n} · ${esc(w.title)}</h3>
        ${LESSONS.filter((l) => l.week === w.n).map((l) => `
          <button class="lesson-link${l.id === state.current ? ' active' : ''}" data-lesson="${l.id}">
            ${status(l)}<span>${l.n}. ${esc(l.title)}</span>
          </button>`).join('')}
      </div>`).join('')}`;
  $('#courseSelect').value = state.current;
}

$('#course').addEventListener('click', (e) => {
  const b = e.target.closest('[data-lesson]');
  if (b) openLesson(b.dataset.lesson);
});
$('#course').addEventListener('change', (e) => { if (e.target.id === 'courseSelect') openLesson(e.target.value); });

function openLesson(id, { scroll = true } = {}) {
  state.current = id;
  save();
  drillExit();
  const l = current();
  vlSelected = (l.progressions || [])[0]?.id || null;
  if (l.ear) {
    earExercise = l.ear.exercise;
    earSettings(earExercise).level = l.ear.level;
    if (l.ear.direction) earSettings(earExercise).direction = l.ear.direction;
  }
  exKey = l.explorerKey ? keyValue(l.explorerKey) : 'C-major';
  renderAll();
  if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderLessonHead() {
  const l = current();
  $('#lessonHead').innerHTML = `
    <div class="eyebrow">Week ${l.week} · Lesson ${l.n} of 3</div>
    <h2>${esc(l.title)}</h2>
    <p class="goal">${esc(l.goal)}</p>
    <ul class="ideas">${l.ideas.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
}

const KIND_LABEL = { watch: 'Watch', read: 'Read', write: 'Write', play: 'Keyboard', ear: 'Ear', spot: 'Analyze' };

function renderTasks() {
  const l = current();
  const rec = lessonRec(l.id);
  $('#tasks').innerHTML = l.tasks.map((t) => {
    const done = !!rec.tasks[t.id];
    const links = (t.links || []).map((k) => `<a href="${esc(k.url)}" target="_blank" rel="noopener">${esc(k.label)}</a>${k.note ? ` <span class="note">${esc(k.note)}</span>` : ''}`).join('');
    const action = t.action ? `<button class="btn btn-sm" data-action='${esc(JSON.stringify(t.action))}'>Open in the app →</button>` : '';
    return `
      <li class="task${done ? ' done' : ''}">
        <input type="checkbox" data-task="${t.id}" ${done ? 'checked' : ''} aria-label="Done: ${esc(t.title)}">
        <div class="task-body">
          <div class="task-title"><span class="task-meta">${KIND_LABEL[t.kind] || t.kind} · ${t.minutes}′</span>${esc(t.title)}</div>
          ${t.detail ? `<div class="task-detail">${esc(t.detail)}</div>` : ''}
          ${links ? `<div class="task-links">${links}</div>` : ''}
          ${action}
        </div>
      </li>`;
  }).join('');
  const done = lessonDone(l);
  const minutes = l.tasks.reduce((a, t) => a + t.minutes, 0);
  $('#checklistPct').textContent = `${done}/${l.tasks.length} · ~${minutes} min`;
  const i = LESSONS.indexOf(l);
  const prev = LESSONS[i - 1];
  const next = LESSONS[i + 1];
  $('#lessonNav').innerHTML = `
    ${prev ? `<button class="btn btn-sm" data-lesson="${prev.id}">← ${esc(prev.title)}</button>` : '<span></span>'}
    ${next ? `<button class="btn btn-sm${done === l.tasks.length ? ' btn-primary' : ''}" data-lesson="${next.id}">${esc(next.title)} →</button>` : ''}`;
}

$('#tasks').addEventListener('change', (e) => {
  const id = e.target.dataset.task;
  if (!id) return;
  lessonRec(state.current).tasks[id] = e.target.checked;
  save();
  renderTasks();
  renderCourse();
});
$('#tasks').addEventListener('click', (e) => {
  const b = e.target.closest('[data-action]');
  if (!b) return;
  const a = JSON.parse(b.dataset.action);
  if (a.ear) {
    earExercise = a.ear;
    if (a.level) earSettings(a.ear).level = a.level;
    if (a.direction) earSettings(a.ear).direction = a.direction;
    save();
    renderEar();
    scrollTo($('#earCard'));
  } else if (a.progression) {
    vlSelected = a.progression;
    renderVl();
    scrollTo($('#vlCard'));
  } else if (a.explorer) {
    scrollTo($('#explorerCard'));
  } else if (a.workbench) {
    scrollTo($('#workbenchCard'));
  }
});
$('#lessonNav').addEventListener('click', (e) => {
  const b = e.target.closest('[data-lesson]');
  if (b) openLesson(b.dataset.lesson);
});

// ================================================================ progression view (lab + workbench)

let tempo = 1.1; // seconds per chord
let outerOnly = false;

/**
 * Render a progression with its analysis into `root`. opts.reveal shows issues
 * of a "find the error" progression; opts.drill hides the chords still to play.
 */
function renderProgression(root, prog, { reveal = !prog.faulty, drillState = null } = {}) {
  const key = prog.keyObj || makeKey(prog.key.tonic, prog.key.mode);
  const r = analyzeProgression(prog.steps, key, { standalone: prog.standalone });
  const steps = r.chords;
  const cols = [];
  steps.forEach((c, k) => {
    if (k > 0 && !prog.standalone) cols.push({ type: 'motion', k });
    cols.push({ type: 'chord', k });
  });
  const hidden = (k) => drillState && k > drillState.idx;
  const head = cols.map((c) => (c.type === 'chord'
    ? `<th class="chord-head" data-col="${c.k}" title="Play this chord">${rnHtml(steps[c.k].label || steps[c.k].rn || '—')}${steps[c.k].fn ? `<span class="fn">${steps[c.k].fn}</span>` : ''}</th>`
    : '<th></th>')).join('');
  const rows = VOICES.map((v, i) => `<tr><th class="voice">${v}</th>${cols.map((c) => {
    if (c.type === 'chord') {
      const cls = hidden(c.k) ? 'note hidden-note' : drillState && c.k <= drillState.idx && c.k > 0 ? 'note drill-ok' : 'note';
      return `<td class="${cls}" data-col="${c.k}">${hidden(c.k) ? '?' : prettyPitch(steps[c.k].voices[i])}</td>`;
    }
    const mo = r.transitions[c.k - 1].motions[i];
    if (hidden(c.k)) return '<td class="motion"></td>';
    return `<td class="motion${mo.dir === 0 ? ' held' : mo.leap ? ' leap' : ''}">${esc(mo.label)}</td>`;
  }).join('')}</tr>`).join('');
  const outer = prog.standalone ? '' : `<tr class="outer"><th class="voice small">S–B</th>${cols.map((c) => (c.type === 'motion' && !hidden(c.k) ? `<td>${r.transitions[c.k - 1].outer}</td>` : '<td></td>')).join('')}</tr>`;

  const issues = [
    ...steps.flatMap((c, k) => c.issues.map((x) => ({ where: `Chord ${k + 1}`, ...x }))),
    ...r.transitions.flatMap((t, k) => t.issues.map((x) => ({ where: `${k + 1} → ${k + 2}`, ...x }))),
  ];
  let issuesHtml;
  if (drillState) issuesHtml = '';
  else if (!reveal) issuesHtml = `<button class="btn btn-sm btn-amber" data-reveal>Reveal the errors (${issues.length})</button>`;
  else if (issues.length) issuesHtml = `<ul class="issues">${issues.map((x) => `<li><span class="where">${x.where}</span>${esc(x.msg)}</li>`).join('')}</ul>`;
  else issuesHtml = '<ul class="issues"><li class="ok">No problems found: ranges, spacing, crossing, doubling, parallel and direct 5ths/8ves, overlaps, melodic intervals and tendency tones all check out.</li></ul>';

  root.innerHTML = `
    <div class="vl-scroll"><table class="vl"><thead><tr><th></th>${head}</tr></thead><tbody>${rows}${outer}</tbody></table></div>
    <div class="vl-controls">
      <button class="btn btn-sm btn-primary" data-play>▶ Play</button>
      <label><input type="checkbox" data-outer ${outerOnly ? 'checked' : ''}> Outer voices only</label>
      <label>Speed <input type="range" min="0.5" max="2" step="0.1" value="${2.5 - tempo}" data-tempo></label>
      ${root.id === 'vlView' && !drillState ? '<button class="btn btn-sm" data-drill title="Play each chord yourself, checked note by note">Drill at the keyboard</button>' : ''}
      ${root.id === 'vlView' ? '<button class="btn btn-sm" data-edit title="Copy into the workbench to change it">Edit in workbench</button>' : ''}
    </div>
    ${issuesHtml}`;

  const midisOf = (k) => steps[k].voices.map((p) => p.midi);
  root.onclick = (e) => {
    if (e.target.closest('[data-play]')) {
      stopAll();
      steps.forEach((_, k) => {
        if (hidden(k)) return;
        const m = midisOf(k);
        const notes = (outerOnly ? [m[0], m[3]] : m).sort((a, b) => a - b);
        notes.forEach((n, i) => audio.note(n, { at: k * tempo, dur: tempo * 0.95, kind: i === 0 ? 'bass' : 'upper' }));
        playTimers.push(setTimeout(() => markCol(root, k), k * tempo * 1000 + 30));
      });
      playTimers.push(setTimeout(() => markCol(root, -1), steps.length * tempo * 1000 + 100));
    }
    const head2 = e.target.closest('.chord-head');
    if (head2 && !hidden(Number(head2.dataset.col))) {
      stopAll();
      const k = Number(head2.dataset.col);
      audio.chord(midisOf(k).sort((a, b) => a - b), { dur: 1.4 });
      markCol(root, k);
      playTimers.push(setTimeout(() => markCol(root, -1), 1400));
    }
    if (e.target.closest('[data-reveal]')) renderProgression(root, prog, { reveal: true });
    if (e.target.closest('[data-drill]')) drillStart(prog);
    if (e.target.closest('[data-edit]')) {
      $('#wbKey').value = keyValue(key);
      $('#wbText').value = progressionToText(prog);
      state.workbench = { key: $('#wbKey').value, text: $('#wbText').value };
      save();
      wbCheck();
      scrollTo($('#workbenchCard'));
    }
  };
  root.oninput = (e) => {
    if (e.target.matches('[data-tempo]')) tempo = 2.5 - Number(e.target.value);
    if (e.target.matches('[data-outer]')) outerOnly = e.target.checked;
  };
}

function markCol(root, k) {
  root.querySelectorAll('.playing').forEach((el) => el.classList.remove('playing'));
  if (k >= 0) root.querySelectorAll(`[data-col="${k}"]`).forEach((el) => el.classList.add('playing'));
}

const progressionToText = (prog) => prog.steps.map((s) => `${(s.rn || '').padEnd(6)}${s.rn ? '' : '      '}`.replace(/^(\S+)/, '$1:') + s.voices.join(' ')).join('\n');

// ================================================================ voice-leading lab

let vlSelected = null;

function renderVl() {
  const l = current();
  const progs = l.progressions || [];
  const card = $('#vlCard');
  if (!progs.length) {
    $('#vlPills').innerHTML = '';
    $('#vlKey').textContent = '';
    $('#vlNote').textContent = 'No worked progressions in this lesson. Use the workbench to check your own, or open another lesson’s examples:';
    $('#vlView').innerHTML = `<div class="pills">${LESSONS.filter((x) => x.progressions).map((x) => `<button class="pill" data-lesson="${x.id}">W${x.week} L${x.n}</button>`).join('')}</div>`;
    $('#vlView').onclick = (e) => { const b = e.target.closest('[data-lesson]'); if (b) openLesson(b.dataset.lesson); };
    card.hidden = false;
    return;
  }
  if (!progs.some((p) => p.id === vlSelected)) vlSelected = progs[0].id;
  const prog = progressionById(vlSelected);
  $('#vlPills').innerHTML = progs.map((p) => `<button class="pill${p.id === vlSelected ? ' active' : ''}${p.faulty ? ' err' : ''}" data-prog="${p.id}">${esc(p.title)}</button>`).join('');
  $('#vlKey').textContent = makeKey(prog.key.tonic, prog.key.mode).name;
  $('#vlNote').textContent = prog.note || '';
  renderProgression($('#vlView'), prog, drill && drill.prog.id === prog.id ? { drillState: drill } : {});
  if (drill) renderDrillBox();
}

$('#vlPills').addEventListener('click', (e) => {
  const b = e.target.closest('[data-prog]');
  if (!b) return;
  drillExit();
  vlSelected = b.dataset.prog;
  renderVl();
});

// ---------------------------------------------------------------- drill

let drill = null; // { prog, idx (last solved chord), selected:Set, misses }

function drillStart(prog) {
  drill = { prog, idx: 0, selected: new Set(), misses: 0 };
  renderVl();
  const first = prog.steps[0].voices.map((n) => parsePitch(n).midi);
  audio.chord(first.sort((a, b) => a - b), { dur: 1.4 });
}

function drillExit() {
  if (!drill) return;
  drill = null;
  document.querySelectorAll('.key.sel, .key.miss').forEach((el) => el.classList.remove('sel', 'miss'));
  $('#vlView').querySelector('.drill-box')?.remove();
}

function drillTarget() {
  const step = drill.prog.steps[drill.idx + 1];
  return step ? step.voices.map((n) => parsePitch(n).midi) : null;
}

function renderDrillBox() {
  const view = $('#vlView');
  view.querySelector('.drill-box')?.remove();
  const box = document.createElement('div');
  box.className = 'drill-box';
  const target = drillTarget();
  const step = drill.prog.steps[drill.idx + 1];
  if (!target) {
    box.innerHTML = `<strong>Done.</strong> <span>${drill.misses === 0 ? 'Every chord right first time.' : `${drill.misses} wrong attempt${drill.misses > 1 ? 's' : ''}.`}</span>
      <div class="row"><button class="btn btn-sm btn-primary" data-drill-again>Again</button><button class="btn btn-sm" data-drill-exit>Exit drill</button></div>`;
  } else {
    box.innerHTML = `<span>Play chord ${drill.idx + 2} of ${drill.prog.steps.length} (${rnHtml(step.label || step.rn || '')}): pick the four notes on the keyboard (click toggles), or hold them on a MIDI keyboard.</span>
      <span class="small muted" data-drill-msg>Selected: ${[...drill.selected].sort((a, b) => a - b).map((m) => prettyPitch(midiPitch(m))).join(' ') || 'nothing yet'}</span>
      <div class="row">
        <button class="btn btn-sm btn-primary" data-drill-check>Check</button>
        <button class="btn btn-sm" data-drill-clear>Clear</button>
        <button class="btn btn-sm" data-drill-show>Show answer</button>
        <button class="btn btn-sm" data-drill-exit>Exit drill</button>
      </div>`;
  }
  box.onclick = (e) => {
    if (e.target.closest('[data-drill-check]')) drillCheck();
    if (e.target.closest('[data-drill-clear]')) { drill.selected.clear(); syncSelection(); renderDrillBox(); }
    if (e.target.closest('[data-drill-show]')) { drill.misses += 1; drillAdvance(); }
    if (e.target.closest('[data-drill-exit]')) { drillExit(); renderVl(); }
    if (e.target.closest('[data-drill-again]')) drillStart(drill.prog);
  };
  view.prepend(box);
}

function syncSelection() {
  keyEls.forEach((el, m) => {
    el.classList.toggle('sel', !!drill && drill.selected.has(m));
    el.classList.remove('miss');
  });
}

function drillToggle(midi) {
  if (!drillTarget()) return;
  if (drill.selected.has(midi)) drill.selected.delete(midi);
  else drill.selected.add(midi);
  syncSelection();
  renderDrillBox();
}

function drillFromMidi() {
  if (!drillTarget()) return;
  drill.selected = new Set(held);
  syncSelection();
  renderDrillBox();
  if (held.size === drillTarget().length) drillCheck();
}

function drillCheck() {
  const target = drillTarget();
  if (!target) return;
  const want = new Set(target);
  const right = [...drill.selected].filter((m) => want.has(m));
  const wrong = [...drill.selected].filter((m) => !want.has(m));
  if (right.length === want.size && wrong.length === 0) {
    drillAdvance();
    return;
  }
  drill.misses += 1;
  wrong.forEach((m) => keyEls.get(m)?.classList.add('miss'));
  const msg = $('#vlView [data-drill-msg]');
  if (msg) msg.textContent = `${right.length} of ${want.size} right${wrong.length ? `; red keys are not in the chord` : ''}. Shortest path from the last chord.`;
}

function drillAdvance() {
  drill.idx += 1;
  drill.selected.clear();
  syncSelection();
  const step = drill.prog.steps[drill.idx];
  audio.chord(step.voices.map((n) => parsePitch(n).midi).sort((a, b) => a - b), { dur: 1.3 });
  renderVl();
}

// ================================================================ workbench

const WB_EXAMPLE = 'I:    E5 C5 G4 C3\nii6:  D5 A4 F4 F3\nV7:   D5 B4 F4 G3\nI:    C5 C5 E4 C3';

function normalizeRn(rn) {
  return rn.trim().replace(/^([ivIV]+)o/, '$1°').replace(/(65|43|42|64)$/, (f) => `${f[0]}/${f[1]}`);
}

function parseWorkbench(text, key) {
  const lines = text.split(/\n|\|/).map((s) => s.trim()).filter(Boolean);
  const steps = [];
  const errors = [];
  const notes = [];
  lines.forEach((line, i) => {
    let rn = null;
    let rest = line;
    const m = /^([^:\s]+)\s*:\s*(.*)$/.exec(line);
    if (m) { rn = normalizeRn(m[1]); rest = m[2]; }
    const voices = rest.split(/[\s,]+/).filter(Boolean)
      .map((n) => n.replace(/♯/g, '#').replace(/♭/g, 'b').replace(/^[a-g]/, (c) => c.toUpperCase()));
    if (voices.length !== 4) errors.push(`Line ${i + 1}: expected 4 notes (soprano alto tenor bass), found ${voices.length}.`);
    voices.forEach((n) => { try { parsePitch(n); } catch { errors.push(`Line ${i + 1}: “${n}” is not a note. Write it like C4, F#3 or Bb2.`); } });
    if (rn) {
      try {
        const ch = parseRoman(rn, key);
        const typed = /^[ivIV]+/.exec(rn)[0];
        const proper = romanLabel(key, ch.degree, { seventh: ch.seventh, inversion: ch.inversion }).numeral;
        if (typed !== proper) notes.push(`Line ${i + 1}: in ${key.name} this chord is ${proper}${ch.figure}, not ${typed}${ch.figure}. Checked as ${proper}.`);
      } catch { errors.push(`Line ${i + 1}: can’t read the Roman numeral “${rn}”. Try I, ii6, V7, V6/5, vii°6.`); rn = null; }
    }
    steps.push({ rn: rn || undefined, voices });
  });
  return { steps, errors, notes };
}

function wbCheck() {
  const key = keyFromValue($('#wbKey').value);
  const text = $('#wbText').value;
  state.workbench = { key: $('#wbKey').value, text };
  save();
  const view = $('#wbView');
  if (!text.trim()) { view.innerHTML = ''; return; }
  const { steps, errors, notes } = parseWorkbench(text, key);
  if (errors.length) {
    view.innerHTML = `<ul class="issues">${errors.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`;
    return;
  }
  renderProgression(view, { keyObj: key, steps, title: 'Workbench' });
  if (notes.length) view.insertAdjacentHTML('afterbegin', `<p class="small muted">${notes.map(esc).join('<br>')}</p>`);
}

$('#wbCheck').addEventListener('click', () => { wbCheck(); $('#wbView [data-play]')?.click(); });
$('#wbExample').addEventListener('click', () => { $('#wbKey').value = 'C-major'; $('#wbText').value = WB_EXAMPLE; wbCheck(); });
$('#wbText').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); $('#wbCheck').click(); } });
$('#wbKey').addEventListener('change', wbCheck);

// ================================================================ ear lab

let earExercise = 'intervals';
let question = null;
let answered = false;

function earSettings(ex) {
  const def = EXERCISES[ex];
  return (state.earSettings[ex] ||= { level: Object.keys(def.levels)[0], direction: 'up' });
}
const earStat = (ex) => (state.ear[ex] ||= { attempts: 0, correct: 0, items: {}, recent: [] });

function renderEar() {
  const ex = EXERCISES[earExercise];
  const s = earSettings(earExercise);
  if (!ex.levels[s.level]) s.level = Object.keys(ex.levels)[0];
  $('#earTabs').innerHTML = Object.entries(EXERCISES).map(([id, e]) => `<button class="pill${id === earExercise ? ' active' : ''}" data-ex="${id}" role="tab">${e.title}</button>`).join('');
  $('#earLevels').innerHTML = Object.entries(ex.levels).map(([id, lv]) => `<button class="pill${id === s.level ? ' active' : ''}" data-level="${id}">${esc(lv.label)}</button>`).join('');
  $('#earDirections').innerHTML = ex.directions ? Object.entries(ex.directions).map(([id, label]) => `<button class="pill${id === s.direction ? ' active' : ''}" data-dir="${id}">${label}</button>`).join('') : '';
  $('#earHint').textContent = ex.hint;
  question = null;
  answered = false;
  const items = ex.levels[s.level].items.map(String);
  $('#earAnswers').innerHTML = items.map((id, i) => `<button class="answer" data-answer="${id}">${i < 9 ? `<span class="k">${i + 1}</span>` : ''}${esc(ex.label(id))}</button>`).join('');
  $('#earFeedback').hidden = true;
  $('#earStatus').textContent = 'Press New, sing it back, then answer.';
  renderEarStats();
}

function renderEarStats() {
  const st = earStat(earExercise);
  const pct = st.attempts ? Math.round((100 * st.correct) / st.attempts) : 0;
  const recent = st.recent || [];
  const recentPct = recent.length ? Math.round((100 * recent.filter(Boolean).length) / recent.length) : null;
  $('#earStats').textContent = `${pct}% (${st.correct}/${st.attempts})${recentPct !== null ? ` · last ${recent.length}: ${recentPct}%` : ''}`;
  const ex = EXERCISES[earExercise];
  const weak = Object.entries(st.items || {})
    .filter(([, [att]]) => att >= 3)
    .map(([id, [att, cor]]) => ({ id, acc: cor / att, att }))
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 3);
  $('#earWeak').textContent = weak.length ? `Weakest: ${weak.map((w) => `${ex.label(w.id)} ${Math.round(w.acc * 100)}%`).join(' · ')}. These come up more often.` : '';
}

function earNew() {
  const s = earSettings(earExercise);
  question = makeQuestion(earExercise, s.level, { direction: s.direction, stats: earStat(earExercise) });
  answered = false;
  $('#earFeedback').hidden = true;
  document.querySelectorAll('#earAnswers .answer').forEach((b) => b.classList.remove('right', 'wrong'));
  $('#earStatus').textContent = 'Listen, sing it back, then answer.';
  playEvents(question.events);
}

function earReplay() {
  if (!question) { earNew(); return; }
  playEvents(question.events);
}

function earAnswer(id) {
  if (!question) { earNew(); return; }
  if (answered) return;
  answered = true;
  const ok = id === question.answer;
  const st = earStat(earExercise);
  st.attempts += 1;
  if (ok) st.correct += 1;
  const item = (st.items[question.answer] ||= [0, 0]);
  item[0] += 1;
  if (ok) item[1] += 1;
  st.recent = [...(st.recent || []), ok].slice(-20);
  save();
  document.querySelector(`#earAnswers [data-answer="${CSS.escape(question.answer)}"]`)?.classList.add('right');
  if (!ok) document.querySelector(`#earAnswers [data-answer="${CSS.escape(id)}"]`)?.classList.add('wrong');
  const fb = $('#earFeedback');
  fb.hidden = false;
  fb.className = `feedback ${ok ? 'right' : 'wrong'}`;
  fb.textContent = `${ok ? 'Right.' : 'Not quite.'} ${question.reveal}`;
  $('#earStatus').textContent = 'Space for the next one, R to hear it again.';
  renderEarStats();
}

$('#earCard').addEventListener('click', (e) => {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.dataset.ex) { earExercise = t.dataset.ex; renderEar(); }
  if (t.dataset.level) { earSettings(earExercise).level = t.dataset.level; save(); renderEar(); }
  if (t.dataset.dir) { earSettings(earExercise).direction = t.dataset.dir; save(); renderEar(); }
  if (t.dataset.answer) earAnswer(t.dataset.answer);
  if (t.id === 'earNew') earNew();
  if (t.id === 'earReplay') earReplay();
});

// ================================================================ chord explorer

let exKey = 'C-major';
const DIATONIC = { major: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], minor: ['i', 'ii°', 'III', 'iv', 'V', 'VI', 'vii°'] };
const QUALITY_7 = { '': 'dominant 7th (Mm7)', M: 'major 7th (MM7)', m: 'minor 7th (mm7)', 'ø': 'half-diminished 7th (ø7)', '°': 'fully diminished 7th (°7)' };

function explorerChords(key) {
  const l = current();
  const sameMode = !l.explorerKey || l.explorerKey.mode === key.mode;
  return l.explorer && sameMode ? l.explorer : DIATONIC[key.mode];
}

function renderExplorer() {
  fillKeySelect($('#exKey'), exKey);
  const key = keyFromValue(exKey);
  $('#exChords').innerHTML = explorerChords(key).map((rn) => {
    const ch = parseRoman(rn, key);
    const label = romanLabel(key, ch.degree, { seventh: ch.seventh, inversion: ch.inversion }).text;
    return `<button class="pill" data-rn="${esc(rn)}">${rnHtml(label)}</button>`;
  }).join('');
}

function showChord(rn) {
  const key = keyFromValue(exKey);
  const { chord, voices } = voiceChord(key, rn);
  const lab = romanLabel(key, chord.degree, { seventh: chord.seventh, inversion: chord.inversion });
  const [s, a, t, b] = voices;
  const root = makePitchFromPc(chord.members[0]);
  let quality;
  if (chord.seventh) {
    const sym = lab.symbol || (lab.numeral === lab.numeral.toLowerCase() ? 'm' : '');
    quality = QUALITY_7[sym];
  } else {
    const [r, th, f] = chord.members.map((pc, i) => makePitchFromPc(pc, i));
    quality = `${triadQuality(r, th, f)} triad`;
  }
  const memberName = ['root', '3rd', '5th', '7th'][chord.inversion];
  const above = [...new Set([t, a, s].map((p) => interval(b, p).simpleName))]
    .sort((x, y) => Number(y.slice(1)) - Number(x.slice(1)) || 0);
  $('#exView').innerHTML = `
    <strong>${rnHtml(lab.text)} in ${esc(key.name)}</strong> · ${esc(pcName(root.letter, root.acc))} ${esc(quality)}<br>
    Bass ${prettyPitch(b)} is the ${memberName}${chord.inversion ? '' : ' (root position)'}.<br>
    Above the bass: ${above.map(esc).join(', ')}.<br>
    S ${prettyPitch(s)} · A ${prettyPitch(a)} · T ${prettyPitch(t)} · B ${prettyPitch(b)}`;
  stopAll();
  audio.chord(voices.map((p) => p.midi).sort((x, y) => x - y), { dur: 1.6 });
}

// Spelled pitch for display, octave 4 upward so stacked thirds stay ascending.
function makePitchFromPc(pc, i = 0) {
  return parsePitch(`${['C', 'D', 'E', 'F', 'G', 'A', 'B'][pc.letter]}${{ '-2': 'bb', '-1': 'b', 0: '', 1: '#', 2: '##' }[pc.acc]}${4 + Math.floor(i / 4)}`);
}

$('#exChords').addEventListener('click', (e) => { const b = e.target.closest('[data-rn]'); if (b) showChord(b.dataset.rn); });
$('#exKey').addEventListener('change', (e) => { exKey = e.target.value; renderExplorer(); });

// ================================================================ drone & degrees

const SOLFEGE = { major: ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti'], minor: ['do', 're', 'me', 'fa', 'sol', 'le', 'ti'] };

function renderDegrees() {
  const key = keyFromValue($('#droneKey').value);
  const tonic = pitchAtOrAbove(degreePc(key, 1), 57);
  $('#degreeButtons').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8].map((d) => {
    const pc = degreePc(key, d === 8 ? 1 : d, { raised: d === 7 });
    const p = pitchAtOrAbove(pc, d === 8 ? tonic.midi + 12 : tonic.midi);
    return `<button class="pill mono" data-midi="${p.midi}">^${d === 8 ? 1 : d} ${SOLFEGE[key.mode][(d - 1) % 7]} · ${prettyPitch(p)}</button>`;
  }).join('');
}

$('#droneKey').addEventListener('change', () => {
  renderDegrees();
  if (audio.droneOn()) audio.startDrone(parsePitch(`${keyFromValue($('#droneKey').value).tonic}4`).midi % 12);
});
$('#droneToggle').addEventListener('click', () => {
  const btn = $('#droneToggle');
  if (audio.droneOn()) {
    audio.stopDrone();
    btn.textContent = '▶ Drone';
    btn.classList.remove('on');
  } else {
    audio.startDrone(parsePitch(`${keyFromValue($('#droneKey').value).tonic}4`).midi % 12);
    btn.textContent = '■ Drone';
    btn.classList.add('on');
  }
});
$('#degreeButtons').addEventListener('click', (e) => {
  const b = e.target.closest('[data-midi]');
  if (b) audio.note(Number(b.dataset.midi), { dur: 1.6, kind: 'upper' });
});

// ================================================================ journal

let journalTimer = null;
$('#journal').addEventListener('input', () => {
  clearTimeout(journalTimer);
  $('#journalSaved').textContent = 'Saving…';
  journalTimer = setTimeout(() => {
    lessonRec(state.current).journal = $('#journal').value;
    save();
    $('#journalSaved').textContent = 'Saved on this device';
  }, 400);
});

// ================================================================ practice timer

let sessionSecs = 0;
let ticking = null;
const today = () => new Date().toLocaleDateString('en-CA');
const fmt = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
const hm = (s) => `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`;

function practiceTotals() {
  const days = state.practice;
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return days[d.toLocaleDateString('en-CA')] || 0;
  }).reduce((a, b) => a + b, 0);
  const total = Object.values(days).reduce((a, b) => a + b, 0);
  return { today: days[today()] || 0, week, total };
}

function renderTimer() {
  $('#timerSession').textContent = fmt(sessionSecs);
  const t = practiceTotals();
  $('#timerTotals').textContent = `today ${hm(t.today)} · 7 days ${hm(t.week)}`;
}

$('#timerToggle').addEventListener('click', () => {
  const btn = $('#timerToggle');
  if (ticking) {
    clearInterval(ticking);
    ticking = null;
    btn.textContent = '▶';
    save();
  } else {
    ticking = setInterval(() => {
      sessionSecs += 1;
      state.practice[today()] = (state.practice[today()] || 0) + 1;
      if (sessionSecs % 15 === 0) save();
      renderTimer();
    }, 1000);
    btn.textContent = '❚❚';
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

// ================================================================ backup, restore, log

function progressLog() {
  const l = current();
  const t = practiceTotals();
  const lines = [
    'HARMONY & EAR ACADEMY: PROGRESS LOG',
    `Date: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
    `Current: Week ${l.week} Lesson ${l.n}: ${l.title}`,
    `Practice: today ${hm(t.today)}, last 7 days ${hm(t.week)}, total ${hm(t.total)}`,
    '',
    'LESSONS',
    ...LESSONS.map((x) => {
      const d = lessonDone(x);
      return `[${d === x.tasks.length ? 'x' : d ? '~' : ' '}] W${x.week} L${x.n} ${x.title} (${d}/${x.tasks.length})`;
    }),
    '',
    'EAR TRAINING',
    ...Object.entries(EXERCISES).filter(([id]) => state.ear[id]?.attempts).map(([id, ex]) => {
      const st = state.ear[id];
      const weak = Object.entries(st.items || {}).filter(([, [a]]) => a >= 3).sort(([, [a1, c1]], [, [a2, c2]]) => c1 / a1 - c2 / a2).slice(0, 2)
        .map(([item, [a, c]]) => `${ex.label(item)} ${Math.round((100 * c) / a)}%`);
      return `${ex.title}: ${Math.round((100 * st.correct) / st.attempts)}% (${st.correct}/${st.attempts})${weak.length ? `; weakest ${weak.join(', ')}` : ''}`;
    }),
    '',
    `JOURNAL (W${l.week} L${l.n})`,
    lessonRec(l.id).journal || 'No notes yet.',
  ];
  return lines.join('\n');
}

function openDialog(id) {
  const d = $(id);
  d.showModal();
  d.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => d.close(); });
}

$('#copyLogBtn').addEventListener('click', async () => {
  const text = progressLog();
  $('#logText').value = text;
  try {
    await navigator.clipboard.writeText(text);
    $('#logNote').textContent = 'Copied to the clipboard. Paste it into a chat to pick up where you left off.';
  } catch {
    $('#logNote').textContent = 'Select the text below and copy it.';
  }
  openDialog('#logDialog');
});

$('#backupBtn').addEventListener('click', () => {
  save();
  const blob = new Blob([JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `harmony-academy-backup-${today()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$('#restoreBtn').addEventListener('click', () => {
  $('#restoreError').textContent = '';
  $('#restoreText').value = '';
  $('#restoreFile').value = '';
  openDialog('#restoreDialog');
});
$('#restoreFile').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (f) $('#restoreText').value = await f.text();
});
$('#restoreApply').addEventListener('click', () => {
  let data;
  try { data = JSON.parse($('#restoreText').value); } catch { $('#restoreError').textContent = 'That is not valid JSON. Use a file from “Back up”.'; return; }
  if (!data || data.version !== 1 || typeof data.lessons !== 'object') { $('#restoreError').textContent = 'This does not look like a Harmony Academy backup.'; return; }
  delete data.exportedAt;
  state = { ...freshState(), ...data };
  save();
  $('#restoreDialog').close();
  openLesson(state.current, { scroll: false });
  renderTimer();
});

// ================================================================ dock, sources, boot

function setDock(open) {
  state.dockOpen = open;
  $('#dock').classList.toggle('closed', !open);
  document.body.classList.toggle('dock-closed', !open);
  $('#dockToggle').textContent = open ? '▾ Keyboard' : '▴ Keyboard';
  $('#dockToggle').setAttribute('aria-expanded', String(open));
}
$('#dockToggle').addEventListener('click', () => { setDock(!state.dockOpen); save(); });
$('#stopBtn').addEventListener('click', () => { stopAll(); });

function renderSources() {
  $('#sources').innerHTML = SOURCES.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a><br><span class="muted">${esc(s.note)}</span></li>`).join('');
}

function renderAll() {
  renderCourse();
  renderLessonHead();
  renderTasks();
  renderVl();
  renderEar();
  renderExplorer();
  $('#exView').textContent = 'Pick a chord to hear it and see how it is built.';
  $('#journal').value = lessonRec(state.current).journal || '';
}

function boot() {
  // Ask the browser not to evict saved progress under storage pressure.
  navigator.storage?.persist?.().catch(() => {});
  buildPiano();
  setupMidi();
  fillKeySelect($('#wbKey'), state.workbench.key || 'C-major');
  $('#wbText').value = state.workbench.text || '';
  fillKeySelect($('#droneKey'), 'C-major');
  renderDegrees();
  renderSources();
  setDock(state.dockOpen !== false);
  openLesson(state.current, { scroll: false });
  if (state.workbench.text) wbCheck();
  renderTimer();
}

boot();
