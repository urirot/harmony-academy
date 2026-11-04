import { LESSONS, WEEKS, SOURCES, lessonById, progressionById } from './curriculum.js';
import {
  parsePitch, parseRoman, romanLabel, makeKey, voiceChord, analyzeProgression, interval,
  degreePc, pitchAtOrAbove, prettyPitch, prettyName, pcName, triadQuality, VOICES,
} from './theory.js';
import * as audio from './audio.js';
import { EXERCISES, makeQuestion } from './ear.js';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const narrow = window.matchMedia('(max-width: 1023px)');

// ================================================================ state

const STORE = 'harmony-academy:v1';
const TOOLS = ['lab', 'workbench', 'ear', 'explore'];

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
    tab: 'lab',
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

/** "V6/5 (passing)" → serif numeral with stacked figure, plus a small label. */
function rnHtml(text) {
  if (!text) return '';
  const m = /^(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)([°oø+M]?)([0-9/–]*)(.*)$/.exec(text);
  if (!m) return `<span class="rn">${esc(text)}</span>`;
  const [, num, sym, fig, rest] = m;
  let figHtml = '';
  if (fig.includes('/')) figHtml = `<span class="fig">${fig.split('/').map((f) => `<span>${esc(f)}</span>`).join('')}</span>`;
  else if (fig) figHtml = `<sup>${esc(fig)}</sup>`;
  const label = rest.trim().replace(/^\((.*)\)$/, '$1');
  return `<span class="rn">${esc(num)}${sym === 'o' ? '°' : esc(sym)}${figHtml}</span>${label ? `<span class="lbl">${esc(label)}</span>` : ''}`;
}

// ================================================================ tabs and layout

let phoneView = 'lesson'; // on narrow screens: the lesson, or the current tool

function showTab(tab) {
  if (tab === 'lesson') {
    phoneView = 'lesson';
  } else {
    state.tab = tab;
    phoneView = 'tool';
    save();
  }
  renderTabs();
  if (tab !== 'lesson') $('#toolPane').scrollTop = 0;
}

function renderTabs() {
  if (!TOOLS.includes(state.tab)) state.tab = 'lab';
  const lessonView = narrow.matches && phoneView === 'lesson';
  $('#main').dataset.view = lessonView ? 'lesson' : state.tab;
  document.querySelectorAll('#tabs .tab').forEach((b) => {
    const on = b.dataset.tab === 'lesson' ? lessonView : !lessonView && b.dataset.tab === state.tab;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', String(on));
  });
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === state.tab));
  const l = current();
  $('#crumb').textContent = narrow.matches ? `Week ${l.week} · Lesson ${l.n}` : 'Harmony Academy';
  // Phones show one pane at a time, so collapsing only applies to the two-pane layout.
  $('#main').classList.toggle('collapsed', !!state.lessonCollapsed && !narrow.matches);
  $('#railLabel').textContent = `Week ${l.week} · Lesson ${l.n} · ${l.title}`;
}

function setLessonCollapsed(collapsed) {
  state.lessonCollapsed = collapsed;
  save();
  renderTabs();
}
$('#collapseLesson').addEventListener('click', () => setLessonCollapsed(true));
$('#expandLesson').addEventListener('click', () => setLessonCollapsed(false));
$('#railLabel').addEventListener('click', () => setLessonCollapsed(false));

$('#tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab); });
narrow.addEventListener('change', renderTabs);

// ================================================================ popovers and dialogs

function togglePopover(btn, pop) {
  const open = pop.hidden;
  document.querySelectorAll('.popover').forEach((p) => { p.hidden = true; });
  document.querySelectorAll('[aria-expanded][aria-haspopup], #helpBtn').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  pop.hidden = !open;
  btn.setAttribute('aria-expanded', String(open));
}
$('#menuBtn').addEventListener('click', (e) => { e.stopPropagation(); renderTimer(); togglePopover($('#menuBtn'), $('#menu')); });
$('#helpBtn').addEventListener('click', (e) => { e.stopPropagation(); togglePopover($('#helpBtn'), $('#help')); });
document.addEventListener('click', (e) => {
  if (!e.target.closest('.popover')) document.querySelectorAll('.popover').forEach((p) => { p.hidden = true; });
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.querySelectorAll('.popover').forEach((p) => { p.hidden = true; });
});

function openDialog(id) {
  const d = $(id);
  document.querySelectorAll('.popover').forEach((p) => { p.hidden = true; });
  d.showModal();
  d.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => d.close(); });
}
// Clicking the backdrop closes a dialog.
document.querySelectorAll('dialog').forEach((d) => d.addEventListener('click', (e) => {
  if (e.target !== d) return;
  const r = d.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
}));

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
      el.className = 'key white';
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
  centerPiano();
}

// Show the middle of the keyboard when it is wider than the screen.
function centerPiano() {
  const wrap = $('.piano-wrap');
  requestAnimationFrame(() => { wrap.scrollLeft = (wrap.scrollWidth - wrap.clientWidth) / 2; });
}

audio.onNote((midi, on, kind) => {
  const el = keyEls.get(midi);
  if (!el) return;
  if (on) {
    lit.set(midi, (lit.get(midi) || 0) + 1);
    el.classList.add(`lit-${kind || 'upper'}`);
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
const earVisible = () => state.tab === 'ear' && !(narrow.matches && phoneView === 'lesson');

document.addEventListener('keydown', (e) => {
  if (typing(e) || e.metaKey || e.ctrlKey || e.altKey || e.repeat || document.querySelector('dialog[open]')) return;
  const k = e.key.toLowerCase();
  if (earVisible()) {
    if (k === ' ') { e.preventDefault(); earNew(); return; }
    if (k === 'r') { earReplay(); return; }
    if (/^[1-9]$/.test(k)) { $('#earAnswers').children[Number(k) - 1]?.click(); return; }
  }
  if (k === 'z' || k === 'x') {
    kbOctave = k === 'z' ? Math.max(2, kbOctave - 1) : Math.min(5, kbOctave + 1);
    $('#dockStatus').textContent = `Computer keys start at C${kbOctave}`;
    return;
  }
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
        btn.textContent = n ? 'MIDI ✓' : 'No MIDI';
        btn.title = n ? `${n} MIDI input${n > 1 ? 's' : ''} connected` : 'No MIDI keyboard found';
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
    $('#dockStatus').textContent = `${prettyPitch(midiPitch(midi))} · MIDI ${midi}`;
    if (drill) drillFromMidi();
  } else if (cmd === 0x80 || (cmd === 0x90 && vel === 0)) {
    held.delete(midi);
  }
}

function setDock(open) {
  state.dockOpen = open;
  $('#dock').classList.toggle('closed', !open);
  $('#dockToggle').textContent = open ? 'Keyboard ▾' : 'Keyboard ▴';
  $('#dockToggle').setAttribute('aria-expanded', String(open));
  if (open) centerPiano();
}
$('#dockToggle').addEventListener('click', () => { setDock(!state.dockOpen); save(); });
$('#stopBtn').addEventListener('click', () => stopAll());

// ================================================================ playback helpers

let playTimers = [];
function stopAll() {
  audio.stopAll();
  playTimers.forEach(clearTimeout);
  playTimers = [];
  document.querySelectorAll('.playing').forEach((el) => el.classList.remove('playing'));
}

function playEvents(events, { light = true } = {}) {
  stopAll();
  events.forEach((ev) => ev.notes.forEach((m, i) => audio.note(m, {
    at: ev.at, dur: ev.dur, light, kind: ev.notes.length > 1 && i === 0 ? 'bass' : 'upper',
  })));
}

// ================================================================ course drawer

function renderCourse() {
  const status = (l) => {
    const done = lessonDone(l);
    if (done === l.tasks.length) return '<span class="status done" aria-label="Complete"></span>';
    if (done > 0) return `<span class="status partial" aria-label="${done} of ${l.tasks.length} done"></span>`;
    return '<span class="status" aria-label="Not started"></span>';
  };
  $('#course').innerHTML = WEEKS.map((w) => `
    <div class="week">
      <h3>Week ${w.n} · ${esc(w.title)}</h3>
      ${LESSONS.filter((l) => l.week === w.n).map((l) => `
        <button class="lesson-link${l.id === state.current ? ' active' : ''}" data-lesson="${l.id}">
          ${status(l)}<span>${esc(l.title)}</span>
        </button>`).join('')}
    </div>`).join('');
  const complete = LESSONS.filter((l) => lessonDone(l) === l.tasks.length).length;
  $('#courseCount').textContent = `${complete} of ${LESSONS.length} lessons complete`;
}

function openDrawer() {
  renderCourse();
  openDialog('#drawer');
  $('#course .lesson-link.active')?.focus();
}
$('#drawerBtn').addEventListener('click', openDrawer);
$('#crumb').addEventListener('click', openDrawer);
$('#course').addEventListener('click', (e) => {
  const b = e.target.closest('[data-lesson]');
  if (!b) return;
  $('#drawer').close();
  openLesson(b.dataset.lesson);
});

// ================================================================ lesson pane

let openTasks = new Set();

function openLesson(id) {
  state.current = id;
  save();
  drillExit();
  const l = current();
  vlIndex = 0;
  if (l.ear) {
    earExercise = l.ear.exercise;
    earSettings(earExercise).level = l.ear.level;
    if (l.ear.direction) earSettings(earExercise).direction = l.ear.direction;
  }
  exKey = l.explorerKey ? keyValue(l.explorerKey) : 'C-major';
  const firstOpen = l.tasks.find((t) => !lessonRec(l.id).tasks[t.id]);
  openTasks = new Set(firstOpen ? [firstOpen.id] : []);
  phoneView = 'lesson';
  renderAll();
  $('#lessonPane').scrollTop = 0;
}

function renderLesson() {
  const l = current();
  const i = LESSONS.indexOf(l);
  $('#eyebrow').textContent = `Week ${l.week} · Lesson ${l.n} of 3`;
  $('#prevLesson').disabled = i === 0;
  $('#nextLesson').disabled = i === LESSONS.length - 1;
  $('#lessonTitle').textContent = l.title;
  $('#lessonGoal').textContent = l.goal;
  $('#ideas').innerHTML = l.ideas.map((x) => `<li>${esc(x)}</li>`).join('');
  $('#journal').value = lessonRec(l.id).journal || '';
  renderTasks();
}

const KIND_LABEL = { watch: 'Watch', read: 'Read', write: 'Write', play: 'Keyboard', ear: 'Ear', spot: 'Analyze' };
const ACTION_LABEL = (a) => (a.ear ? 'Open in Ear →' : a.progression ? 'Open in Lab →' : a.explorer ? 'Open in Explore →' : 'Open the Workbench →');

function renderTasks() {
  const l = current();
  const rec = lessonRec(l.id);
  $('#tasks').innerHTML = l.tasks.map((t) => {
    const done = !!rec.tasks[t.id];
    const open = openTasks.has(t.id);
    const links = (t.links || []).map((k) => `<li><a href="${esc(k.url)}" target="_blank" rel="noopener">${esc(k.label)} ↗</a>${k.note ? ` <span class="note">${esc(k.note)}</span>` : ''}</li>`).join('');
    return `
      <li class="task${done ? ' done' : ''}${open ? ' open' : ''}">
        <label class="check"><input type="checkbox" data-task="${t.id}" ${done ? 'checked' : ''} aria-label="Done: ${esc(t.title)}"><span class="ring"></span></label>
        <button class="task-head" data-toggle="${t.id}" aria-expanded="${open}">
          <span><span class="task-title">${esc(t.title)}</span><span class="task-meta">${KIND_LABEL[t.kind] || t.kind} · ${t.minutes} min</span></span>
          <span class="chev" aria-hidden="true">›</span>
        </button>
        <div class="task-body">
          ${t.detail ? `<p>${esc(t.detail)}</p>` : ''}
          ${links ? `<ul class="task-links">${links}</ul>` : ''}
          ${t.action ? `<button class="btn quiet" data-action='${esc(JSON.stringify(t.action))}'>${ACTION_LABEL(t.action)}</button>` : ''}
        </div>
      </li>`;
  }).join('');
  const done = lessonDone(l);
  const minutes = l.tasks.reduce((a, t) => a + t.minutes, 0);
  $('#checklistPct').textContent = `${done} of ${l.tasks.length} · ${minutes} min`;
  $('#progressFill').style.width = `${(100 * done) / l.tasks.length}%`;
  const next = LESSONS[LESSONS.indexOf(l) + 1];
  $('#nextUp').innerHTML = done === l.tasks.length && next
    ? `<button class="btn primary" data-lesson="${next.id}">Next: ${esc(next.title)} →</button>` : '';
}

$('#tasks').addEventListener('change', (e) => {
  const id = e.target.dataset.task;
  if (!id) return;
  lessonRec(state.current).tasks[id] = e.target.checked;
  if (e.target.checked) {
    // Close the finished task and open the next unfinished one.
    openTasks.delete(id);
    const nextTask = current().tasks.find((t) => !lessonRec(state.current).tasks[t.id]);
    if (nextTask) openTasks.add(nextTask.id);
  }
  save();
  renderTasks();
});
$('#tasks').addEventListener('click', (e) => {
  const toggle = e.target.closest('[data-toggle]');
  if (toggle) {
    const id = toggle.dataset.toggle;
    if (openTasks.has(id)) openTasks.delete(id); else openTasks.add(id);
    renderTasks();
    return;
  }
  const b = e.target.closest('[data-action]');
  if (!b) return;
  const a = JSON.parse(b.dataset.action);
  if (a.ear) {
    earExercise = a.ear;
    if (a.level) earSettings(a.ear).level = a.level;
    if (a.direction) earSettings(a.ear).direction = a.direction;
    save();
    renderEar();
    showTab('ear');
  } else if (a.progression) {
    const progs = current().progressions || [];
    vlIndex = Math.max(0, progs.findIndex((p) => p.id === a.progression));
    drillExit();
    renderVl();
    showTab('lab');
  } else if (a.explorer) {
    showTab('explore');
  } else if (a.workbench) {
    showTab('workbench');
  }
});
$('#nextUp').addEventListener('click', (e) => { const b = e.target.closest('[data-lesson]'); if (b) openLesson(b.dataset.lesson); });
$('#prevLesson').addEventListener('click', () => { const i = LESSONS.indexOf(current()); if (i > 0) openLesson(LESSONS[i - 1].id); });
$('#nextLesson').addEventListener('click', () => { const i = LESSONS.indexOf(current()); if (i < LESSONS.length - 1) openLesson(LESSONS[i + 1].id); });

let journalTimer = null;
$('#journal').addEventListener('input', () => {
  clearTimeout(journalTimer);
  $('#journalSaved').textContent = 'Saving…';
  journalTimer = setTimeout(() => {
    lessonRec(state.current).journal = $('#journal').value;
    save();
    $('#journalSaved').textContent = 'Saved in this browser';
  }, 400);
});

// ================================================================ progression view (lab + workbench)

let tempo = 1.1; // seconds per chord
let outerOnly = false;
const CHECKED = 'Ranges, spacing, voice crossing, doubling, parallel and direct 5ths and octaves, overlaps, augmented and diminished leaps, and the leading tone and chordal 7th.';

/**
 * Render a progression with its analysis into `root`. A "find the error"
 * progression keeps its issues hidden until revealed; in drill mode the chords
 * still to play are hidden and the drill panel replaces the controls.
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
  const rows = VOICES.map((v, i) => `<tr><th class="voice"><span class="long">${v}</span><span class="short">${v[0]}</span></th>${cols.map((c) => {
    if (c.type === 'chord') {
      const cls = hidden(c.k) ? 'note hidden-note' : drillState && c.k > 0 ? 'note drill-ok' : 'note';
      return `<td class="${cls}" data-col="${c.k}">${hidden(c.k) ? '?' : prettyPitch(steps[c.k].voices[i])}</td>`;
    }
    if (hidden(c.k)) return '<td class="motion"></td>';
    const mo = r.transitions[c.k - 1].motions[i];
    return `<td class="motion${mo.dir === 0 ? ' held' : mo.leap ? ' leap' : ''}">${esc(mo.label)}</td>`;
  }).join('')}</tr>`).join('');
  const outer = prog.standalone ? '' : `<tr class="outer"><th class="voice">S–B</th>${cols.map((c) => (c.type === 'motion' && !hidden(c.k) ? `<td>${r.transitions[c.k - 1].outer}</td>` : '<td></td>')).join('')}</tr>`;

  const issues = [
    ...steps.flatMap((c, k) => c.issues.map((x) => ({ where: `Chord ${k + 1}`, ...x }))),
    ...r.transitions.flatMap((t, k) => t.issues.map((x) => ({ where: `${k + 1} → ${k + 2}`, ...x }))),
  ];
  let result;
  if (!reveal) result = '<button class="btn" data-reveal>Reveal the errors</button>';
  else if (issues.length) result = `<div class="callout bad"><strong>${issues.length} problem${issues.length > 1 ? 's' : ''}</strong><ul>${issues.map((x) => `<li><span class="where">${x.where}</span>${esc(x.msg)}</li>`).join('')}</ul></div>`;
  else result = `<details class="callout ok"><summary>✓ No voice-leading problems</summary><p>Checked: ${CHECKED}</p></details>`;

  const isLab = root.id === 'vlView';
  const controls = drillState ? '<div class="callout drill" id="drillBox"></div>' : `
    <div class="vl-controls">
      <div class="row">
        <button class="btn primary" data-play>▶ Play</button>
        <label><input type="checkbox" data-outer ${outerOnly ? 'checked' : ''}> Outer voices</label>
        <label>Speed <input type="range" min="0.5" max="2" step="0.1" value="${2.5 - tempo}" data-tempo></label>
      </div>
      ${isLab ? '<div class="row"><button class="btn quiet" data-drill>Drill at the keyboard</button><button class="btn quiet" data-edit>Edit in Workbench</button></div>' : ''}
    </div>`;

  root.innerHTML = `
    <div class="vl-scroll"><table class="vl"><thead><tr><th></th>${head}</tr></thead><tbody>${rows}${outer}</tbody></table></div>
    ${controls}
    ${drillState ? '' : result}`;

  const midisOf = (k) => steps[k].voices.map((p) => p.midi);
  root.onclick = (e) => {
    if (e.target.closest('[data-play]')) {
      stopAll();
      steps.forEach((_, k) => {
        const m = midisOf(k);
        const notes = (outerOnly ? [m[0], m[3]] : m).sort((a, b) => a - b);
        notes.forEach((n, i) => audio.note(n, { at: k * tempo, dur: tempo * 0.95, kind: i === 0 ? 'bass' : 'upper' }));
        playTimers.push(setTimeout(() => markCol(root, k), k * tempo * 1000 + 30));
      });
      playTimers.push(setTimeout(() => markCol(root, -1), steps.length * tempo * 1000 + 100));
    }
    const headCell = e.target.closest('.chord-head');
    if (headCell && !hidden(Number(headCell.dataset.col))) {
      stopAll();
      const k = Number(headCell.dataset.col);
      audio.chord(midisOf(k).sort((a, b) => a - b), { dur: 1.4 });
      markCol(root, k);
      playTimers.push(setTimeout(() => markCol(root, -1), 1400));
    }
    if (e.target.closest('[data-reveal]')) renderProgression(root, prog, { reveal: true });
    if (e.target.closest('[data-drill]')) drillStart(prog);
    if (e.target.closest('[data-edit]')) {
      $('#wbKey').value = keyValue(key);
      $('#wbText').value = progressionToText(prog);
      wbCheck();
      showTab('workbench');
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

const progressionToText = (prog) => prog.steps.map((s) => `${s.rn ? `${s.rn}:` : ''}`.padEnd(7) + s.voices.join(' ')).join('\n');

// ================================================================ lab

let vlIndex = 0;

function renderVl() {
  const progs = current().progressions || [];
  const has = progs.length > 0;
  $('#vlPrev').parentElement.hidden = !has;
  if (!has) {
    $('#vlKey').textContent = '';
    $('#vlTitle').textContent = 'No worked examples in this lesson';
    $('#vlNote').textContent = 'Write your own progression in the Workbench and it gets the same checks.';
    $('#vlView').innerHTML = '<button class="btn" data-go-wb>Open the Workbench</button>';
    $('#vlView').onclick = (e) => { if (e.target.closest('[data-go-wb]')) showTab('workbench'); };
    return;
  }
  vlIndex = Math.min(Math.max(vlIndex, 0), progs.length - 1);
  const prog = progs[vlIndex];
  $('#vlCount').textContent = `${vlIndex + 1} / ${progs.length}`;
  $('#vlPrev').disabled = vlIndex === 0;
  $('#vlNext').disabled = vlIndex === progs.length - 1;
  $('#vlKey').textContent = makeKey(prog.key.tonic, prog.key.mode).name;
  const m = /^Find the errors?:\s*(.*)$/.exec(prog.title);
  $('#vlTitle').innerHTML = m
    ? `<span class="flag">Find the error${prog.faulty.length > 1 || /errors/.test(prog.title) ? 's' : ''}</span>${esc(m[1][0].toUpperCase() + m[1].slice(1))}`
    : esc(prog.title);
  $('#vlNote').textContent = prog.note || '';
  renderProgression($('#vlView'), prog, drill && drill.prog.id === prog.id ? { drillState: drill } : {});
  if (drill) renderDrillBox();
}

$('#vlPrev').addEventListener('click', () => { drillExit(); vlIndex -= 1; renderVl(); });
$('#vlNext').addEventListener('click', () => { drillExit(); vlIndex += 1; renderVl(); });

// ---------------------------------------------------------------- drill

let drill = null; // { prog, idx (last chord shown), selected:Set, misses }

function drillStart(prog) {
  drill = { prog, idx: 0, selected: new Set(), misses: 0 };
  setDock(true);
  renderVl();
  const first = prog.steps[0].voices.map((n) => parsePitch(n).midi);
  audio.chord(first.sort((a, b) => a - b), { dur: 1.4 });
}

function drillExit() {
  if (!drill) return;
  drill = null;
  document.querySelectorAll('.key.sel, .key.miss').forEach((el) => el.classList.remove('sel', 'miss'));
}

function drillTarget() {
  const step = drill.prog.steps[drill.idx + 1];
  return step ? step.voices.map((n) => parsePitch(n).midi) : null;
}

function renderDrillBox() {
  const box = $('#drillBox');
  if (!box) return;
  const target = drillTarget();
  const step = drill.prog.steps[drill.idx + 1];
  if (!target) {
    box.innerHTML = `<strong>Done. ${drill.misses === 0 ? 'Every chord right first time.' : `${drill.misses} wrong attempt${drill.misses > 1 ? 's' : ''}.`}</strong>
      <div class="row"><button class="btn primary" data-drill-again>Again</button><button class="btn quiet" data-drill-exit>Exit drill</button></div>`;
  } else {
    const sel = [...drill.selected].sort((a, b) => a - b).map((m) => prettyPitch(midiPitch(m))).join(' ');
    box.innerHTML = `<span>Play chord ${drill.idx + 2} of ${drill.prog.steps.length}, <strong>${esc(step.label || step.rn || '')}</strong>. Tap its four notes on the keyboard, or hold them on a MIDI keyboard.</span>
      <span class="sm muted" data-drill-msg>${sel ? `Selected: ${sel}` : 'Nothing selected yet.'}</span>
      <div class="row">
        <button class="btn primary" data-drill-check>Check</button>
        <button class="btn" data-drill-clear>Clear</button>
        <button class="btn quiet" data-drill-show>Show answer</button>
        <button class="btn quiet" data-drill-exit>Exit</button>
      </div>`;
  }
  box.onclick = (e) => {
    if (e.target.closest('[data-drill-check]')) drillCheck();
    if (e.target.closest('[data-drill-clear]')) { drill.selected.clear(); syncSelection(); renderDrillBox(); }
    if (e.target.closest('[data-drill-show]')) { drill.misses += 1; drillAdvance(); }
    if (e.target.closest('[data-drill-exit]')) { drillExit(); renderVl(); }
    if (e.target.closest('[data-drill-again]')) drillStart(drill.prog);
  };
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
  const msg = $('#drillBox [data-drill-msg]');
  if (msg) msg.textContent = `${right.length} of ${want.size} right${wrong.length ? '; the outlined keys are not in the chord' : ''}. Move each voice the shortest way from the last chord.`;
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
    view.innerHTML = `<div class="callout bad"><strong>Can’t read this yet</strong><ul>${errors.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>`;
    return;
  }
  renderProgression(view, { keyObj: key, steps, title: 'Workbench' });
  if (notes.length) view.insertAdjacentHTML('afterbegin', `<p class="callout info">${notes.map(esc).join('<br>')}</p>`);
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
  $('#earEx').innerHTML = Object.entries(EXERCISES).map(([id, e]) => `<option value="${id}">${esc(e.title)}</option>`).join('');
  $('#earEx').value = earExercise;
  $('#earLevel').innerHTML = Object.entries(ex.levels).map(([id, lv]) => `<option value="${id}">${esc(lv.label)}</option>`).join('');
  $('#earLevel').value = s.level;
  $('#earDir').hidden = !ex.directions;
  if (ex.directions) {
    $('#earDir').innerHTML = Object.entries(ex.directions).map(([id, label]) => `<option value="${id}">${esc(label)}</option>`).join('');
    $('#earDir').value = s.direction;
  }
  $('#earHint').textContent = ex.hint;
  question = null;
  answered = false;
  const items = ex.levels[s.level].items.map(String);
  $('#earAnswers').innerHTML = items.map((id, i) => `<button class="tile" data-answer="${id}">${i < 9 ? `<span class="k">${i + 1}</span>` : ''}${esc(ex.label(id))}</button>`).join('');
  setFeedback('', 'Press New, sing it back, then answer.');
  renderEarStats();
}

function setFeedback(cls, text) {
  const fb = $('#earFeedback');
  fb.className = `feedback ${cls}`;
  fb.textContent = text;
}

function renderEarStats() {
  const st = earStat(earExercise);
  const pct = st.attempts ? Math.round((100 * st.correct) / st.attempts) : 0;
  $('#earStats').textContent = st.attempts ? `${pct}% · ${st.correct} of ${st.attempts}` : 'No answers yet';
  const ex = EXERCISES[earExercise];
  const recent = st.recent || [];
  const weak = Object.entries(st.items || {})
    .filter(([, [att]]) => att >= 3)
    .map(([id, [att, cor]]) => ({ id, acc: cor / att }))
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 3);
  const parts = [];
  if (recent.length) parts.push(`Last ${recent.length}: ${Math.round((100 * recent.filter(Boolean).length) / recent.length)}%`);
  if (weak.length) parts.push(`Weakest: ${weak.map((w) => `${ex.label(w.id)} ${Math.round(w.acc * 100)}%`).join(', ')}`);
  $('#earWeak').textContent = parts.join(' · ');
}

function earNew() {
  const s = earSettings(earExercise);
  question = makeQuestion(earExercise, s.level, { direction: s.direction, stats: earStat(earExercise) });
  answered = false;
  document.querySelectorAll('#earAnswers .tile').forEach((b) => b.classList.remove('right', 'wrong'));
  setFeedback('', 'Listen, sing it back, then answer.');
  // Keys stay dark while a question plays, or the keyboard would give the answer away.
  playEvents(question.events, { light: false });
}

function earReplay() {
  if (!question) { earNew(); return; }
  playEvents(question.events, { light: answered });
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
  setFeedback(ok ? 'right' : 'wrong', `${ok ? '✓ Right.' : '✗ Not quite.'} ${question.reveal}`);
  renderEarStats();
}

$('#earEx').addEventListener('change', (e) => { earExercise = e.target.value; renderEar(); });
$('#earLevel').addEventListener('change', (e) => { earSettings(earExercise).level = e.target.value; save(); renderEar(); });
$('#earDir').addEventListener('change', (e) => { earSettings(earExercise).direction = e.target.value; save(); renderEar(); });
$('#earAnswers').addEventListener('click', (e) => { const b = e.target.closest('[data-answer]'); if (b) earAnswer(b.dataset.answer); });
$('#earNew').addEventListener('click', earNew);
$('#earReplay').addEventListener('click', earReplay);

// ================================================================ explore: chords

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
    return `<button class="tile" data-rn="${esc(rn)}">${rnHtml(label)}</button>`;
  }).join('');
  $('#exView').textContent = 'Pick a chord to hear it and see how it is built.';
}

function showChord(rn, btn) {
  const key = keyFromValue(exKey);
  const { chord, voices } = voiceChord(key, rn);
  const lab = romanLabel(key, chord.degree, { seventh: chord.seventh, inversion: chord.inversion });
  const [s, a, t, b] = voices;
  const stacked = stackThirds(chord.members);
  const root = stacked[0];
  let quality;
  if (chord.seventh) {
    const sym = lab.symbol || (lab.numeral === lab.numeral.toLowerCase() ? 'm' : '');
    quality = QUALITY_7[sym];
  } else {
    quality = `${triadQuality(...stacked)} triad`;
  }
  const memberName = ['root', '3rd', '5th', '7th'][chord.inversion];
  // Simple intervals above the bass, with a doubled bass shown as an octave.
  const above = [...new Set([t, a, s].map((p) => {
    const iv = interval(b, p);
    return iv.simpleName === 'P1' && iv.gen > 0 ? 'P8' : iv.simpleName;
  }))].sort((x, y) => Number(y.slice(1)) - Number(x.slice(1)));
  $('#exView').innerHTML = `
    <strong>${esc(lab.text)} in ${esc(key.name)}: ${esc(pcName(root.letter, root.acc))} ${esc(quality)}</strong><br>
    The bass, ${prettyPitch(b)}, is the ${memberName}${chord.inversion ? '' : ' (root position)'}.
    Above it: ${above.map(esc).join(', ')}.<br>
    Soprano ${prettyPitch(s)}, alto ${prettyPitch(a)}, tenor ${prettyPitch(t)}, bass ${prettyPitch(b)}.`;
  document.querySelectorAll('#exChords .tile').forEach((el) => el.classList.toggle('active', el === btn));
  stopAll();
  audio.chord(voices.map((p) => p.midi).sort((x, y) => x - y), { dur: 1.6 });
}

// Chord members as pitches stacked upward from octave 4, so root–3rd–5th–7th ascend.
function stackThirds(members) {
  const out = [];
  members.forEach((pc) => out.push(pitchAtOrAbove(pc, out.length ? out[out.length - 1].midi + 1 : 60)));
  return out;
}

$('#exChords').addEventListener('click', (e) => { const b = e.target.closest('[data-rn]'); if (b) showChord(b.dataset.rn, b); });
$('#exKey').addEventListener('change', (e) => { exKey = e.target.value; renderExplorer(); });

// ================================================================ explore: drone and degrees

const SOLFEGE = { major: ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti'], minor: ['do', 're', 'me', 'fa', 'sol', 'le', 'ti'] };
const droneTonicPc = () => parsePitch(`${keyFromValue($('#droneKey').value).tonic}4`).midi % 12;

function renderDegrees() {
  const key = keyFromValue($('#droneKey').value);
  const tonic = pitchAtOrAbove(degreePc(key, 1), 57);
  $('#degreeButtons').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8].map((d) => {
    const pc = degreePc(key, d === 8 ? 1 : d, { raised: d === 7 });
    const p = pitchAtOrAbove(pc, d === 8 ? tonic.midi + 12 : tonic.midi);
    return `<button class="tile" data-midi="${p.midi}">^${d === 8 ? 1 : d} ${SOLFEGE[key.mode][(d - 1) % 7]}<span class="sub">${prettyPitch(p)}</span></button>`;
  }).join('');
}

$('#droneKey').addEventListener('change', () => {
  renderDegrees();
  if (audio.droneOn()) audio.startDrone(droneTonicPc());
});
$('#droneToggle').addEventListener('click', () => {
  const btn = $('#droneToggle');
  if (audio.droneOn()) {
    audio.stopDrone();
    btn.textContent = '▶ Drone';
    btn.classList.remove('on');
  } else {
    audio.startDrone(droneTonicPc());
    btn.textContent = '■ Drone';
    btn.classList.add('on');
  }
});
$('#degreeButtons').addEventListener('click', (e) => {
  const b = e.target.closest('[data-midi]');
  if (b) audio.note(Number(b.dataset.midi), { dur: 1.6, kind: 'upper' });
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
  $('#timerTotals').textContent = `Practice today ${hm(t.today)} · last 7 days ${hm(t.week)}`;
}

$('#timerToggle').addEventListener('click', () => {
  const btn = $('#timerToggle');
  if (ticking) {
    clearInterval(ticking);
    ticking = null;
    $('#timerIcon').textContent = '▶';
    btn.classList.remove('on');
    save();
  } else {
    ticking = setInterval(() => {
      sessionSecs += 1;
      state.practice[today()] = (state.practice[today()] || 0) + 1;
      if (sessionSecs % 15 === 0) save();
      renderTimer();
    }, 1000);
    $('#timerIcon').textContent = '❚❚';
    btn.classList.add('on');
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

// ================================================================ progress log, save, load

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
    `NOTES (W${l.week} L${l.n})`,
    lessonRec(l.id).journal || 'No notes yet.',
  ];
  return lines.join('\n');
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

// The saved file leads with the readable progress log, so it makes sense opened
// in a text editor; the rest is the full state that "Load progress" reads back.
$('#backupBtn').addEventListener('click', () => {
  save();
  const file = { summary: progressLog().split('\n'), savedAt: new Date().toISOString(), ...state };
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `harmony-academy-progress-${today()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  $('#menu').hidden = true;
});

$('#restoreBtn').addEventListener('click', () => {
  $('#restoreError').textContent = '';
  $('#restoreText').value = '';
  $('#restoreFile').value = '';
  $('#restoreFileName').textContent = '';
  openDialog('#restoreDialog');
});
$('#restoreChoose').addEventListener('click', () => $('#restoreFile').click());
$('#restoreFile').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  $('#restoreFileName').textContent = f.name;
  $('#restoreText').value = await f.text();
});
$('#restoreApply').addEventListener('click', () => {
  let data;
  try { data = JSON.parse($('#restoreText').value); } catch { $('#restoreError').textContent = 'That is not valid JSON. Use a file from “Save progress”.'; return; }
  if (!data || data.version !== 1 || typeof data.lessons !== 'object') { $('#restoreError').textContent = 'This does not look like a Harmony Academy progress file.'; return; }
  ['summary', 'savedAt', 'exportedAt'].forEach((k) => delete data[k]);
  state = { ...freshState(), ...data };
  save();
  $('#restoreDialog').close();
  openLesson(state.current);
  renderTimer();
});

// ================================================================ boot

function renderSources() {
  $('#sources').innerHTML = SOURCES.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a><br><span class="muted">${esc(s.note)}</span></li>`).join('');
}

function renderAll() {
  renderLesson();
  renderTabs();
  renderVl();
  renderEar();
  renderExplorer();
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
  // Keyboard open by default on desktop, folded away on phones.
  setDock(state.dockOpen ?? !narrow.matches);
  openLesson(state.current);
  if (state.workbench.text) wbCheck();
  renderTimer();
}

boot();
