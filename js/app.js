import { LESSONS, WEEKS, SOURCES, lessonById, progressionById } from './curriculum.js';
import {
  parsePitch, parseRoman, romanLabel, makeKey, voiceChord, interval,
  degreePc, pitchAtOrAbove, prettyPitch, prettyName, pcName, triadQuality,
} from './theory.js';
import * as audio from './audio.js';
import { EXERCISES, makeQuestion } from './ear.js';
import { cloudAvailable, initCloud, signIn, signOut, readProgress, writeProgress } from './cloud.js';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const narrow = window.matchMedia('(max-width: 1023px)');

// ================================================================ state

const STORE = 'harmony-academy:v1';
const TOOLS = ['ear', 'explore'];
const HISTORY_MAX = 500;

function freshState() {
  return {
    version: 1,
    current: 'w1l1',
    lessons: {},
    drills: {},
    history: [],
    ear: {},
    earSettings: {},
    practice: {},
    tab: 'ear',
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE));
    if (saved && saved.version === 1) {
      ['lessonCollapsed', 'workbench'].forEach((k) => delete saved[k]); // retired features
      return { ...freshState(), ...saved };
    }
  } catch { /* storage blocked or corrupt: start fresh */ }
  return freshState();
}

// Settings that belong to this device and stay out of sync: which tab is
// open, whether the keyboard is showing. updatedAt is sync bookkeeping.
const DEVICE_KEYS = ['tab', 'dockOpen', 'updatedAt'];
function portable(st) {
  const out = { ...st };
  DEVICE_KEYS.forEach((k) => delete out[k]);
  return out;
}

let state = loadState();
let lastPayload = JSON.stringify(portable(state));

/** Persist locally; when progress actually changed, stamp it and queue an upload. */
function save() {
  const payload = JSON.stringify(portable(state));
  if (payload !== lastPayload) {
    state.updatedAt = Date.now();
    lastPayload = payload;
    cloudChanged();
  }
  try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* private mode */ }
}

const lessonRec = (id) => (state.lessons[id] ||= { tasks: {}, journal: '' });
const current = () => lessonById(state.current) || LESSONS[0];
const drillKey = (lessonId, i) => `${lessonId}:${i}`;
const drillPassed = (lessonId, i) => !!state.drills[drillKey(lessonId, i)]?.passed;

// A lesson is done when its tasks are ticked and its drills passed.
const lessonTotal = (l) => l.tasks.length + (l.practice || []).length;
const lessonDone = (l) => l.tasks.filter((t) => lessonRec(l.id).tasks[t.id]).length
  + (l.practice || []).filter((_, i) => drillPassed(l.id, i)).length;
const lessonComplete = (l) => lessonDone(l) === lessonTotal(l);

/** Add an entry to the timeline. */
function logEvent(type, text, lesson = state.current) {
  state.history = [...(state.history || []), { t: Date.now(), type, text, lesson }].slice(-HISTORY_MAX);
}

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

/** "V6/5" → numeral with a stacked figure. */
function rnHtml(text) {
  const m = /^(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)([°oø+M]?)([0-9/–]*)(.*)$/.exec(text);
  if (!m) return `<span class="rn">${esc(text)}</span>`;
  const [, num, sym, fig] = m;
  let figHtml = '';
  if (fig.includes('/')) figHtml = `<span class="fig">${fig.split('/').map((f) => `<span>${esc(f)}</span>`).join('')}</span>`;
  else if (fig) figHtml = `<sup>${esc(fig)}</sup>`;
  return `<span class="rn">${esc(num)}${sym === 'o' ? '°' : esc(sym)}${figHtml}</span>`;
}

// ================================================================ tabs and layout

let view = 'lesson'; // the lesson, or the current tool

function showTab(tab) {
  if (tab === 'lesson') {
    view = 'lesson';
  } else {
    state.tab = tab;
    view = 'tool';
    save();
  }
  renderTabs();
  if (tab !== 'lesson') $('#toolPane').scrollTop = 0;
}

function renderTabs() {
  if (!TOOLS.includes(state.tab)) state.tab = 'ear';
  const lessonView = view === 'lesson';
  $('#main').dataset.view = lessonView ? 'lesson' : state.tab;
  document.querySelectorAll('#tabs .tab').forEach((b) => {
    const on = b.dataset.tab === 'lesson' ? lessonView : !lessonView && b.dataset.tab === state.tab;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', String(on));
  });
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === state.tab));
  placeEar();
  const l = current();
  $('#crumb').textContent = narrow.matches ? `Week ${l.week} · Lesson ${l.n}` : 'Harmony Academy';
}

$('#tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab); });
narrow.addEventListener('change', renderTabs);
// On phones the header shows where you are. Tapping it goes back to the lesson.
$('#crumb').addEventListener('click', () => showTab('lesson'));

// ================================================================ popovers and dialogs

function togglePopover(btn, pop) {
  const open = pop.hidden;
  document.querySelectorAll('.popover').forEach((p) => { p.hidden = true; });
  pop.hidden = !open;
  btn.setAttribute('aria-expanded', String(open));
}
$('#menuBtn').addEventListener('click', (e) => { e.stopPropagation(); renderAccount(); renderTimer(); togglePopover($('#menuBtn'), $('#menu')); });
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
// Clicking the backdrop closes a dialog (except the one that must be answered).
document.querySelectorAll('dialog:not(#chooseDialog)').forEach((d) => d.addEventListener('click', (e) => {
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

const SHARP_SPELL = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const midiPitch = (m) => parsePitch(`${SHARP_SPELL[m % 12]}${Math.floor(m / 12) - 1}`);

/** A note the user played (click, computer key or MIDI). */
function userNote(midi, vel = 0.22) {
  audio.note(midi, { dur: 1.1, vel, kind: 'user' });
  $('#dockStatus').textContent = `${prettyPitch(midiPitch(midi))} · MIDI ${midi}`;
}

// Computer keyboard: A row is the white keys from C, W row the black keys.
const KEYMAP = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, ';': 16 };
let kbOctave = 4;
const typing = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
const earVisible = () => (view === 'lesson' ? !!session : state.tab === 'ear');

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
  if ((status & 0xf0) === 0x90 && vel > 0) {
    audio.note(midi, { dur: 1.2, vel: 0.08 + (vel / 127) * 0.25, kind: 'user' });
    $('#dockStatus').textContent = `${prettyPitch(midiPitch(midi))} · MIDI ${midi}`;
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

// ================================================================ playback

let playTimers = [];
function stopAll() {
  audio.stopAll();
  playTimers.forEach(clearTimeout);
  playTimers = [];
  document.querySelectorAll('.hear.playing').forEach((el) => el.classList.remove('playing'));
}

function playEvents(events, { light = true } = {}) {
  stopAll();
  events.forEach((ev) => ev.notes.forEach((m, i) => audio.note(m, {
    at: ev.at, dur: ev.dur, light, kind: ev.notes.length > 1 && i === 0 ? 'bass' : 'upper',
  })));
}

/** A "hear it" example as note events: a progression id, or a { seq, step } sequence. */
function hearEvents(spec) {
  if (typeof spec === 'string') {
    const prog = progressionById(spec);
    return prog.steps.map((s, k) => ({ at: k * 1.1, dur: 1.05, notes: s.voices.map((n) => parsePitch(n).midi).sort((a, b) => a - b) }));
  }
  return spec.seq.map((group, k) => ({ at: k * spec.step, dur: Math.max(spec.step * 0.95, 0.4), notes: group.map((n) => parsePitch(n).midi).sort((a, b) => a - b) }));
}

function hearLabel(spec) {
  if (typeof spec !== 'string') return { title: spec.label, note: '', faulty: false };
  const prog = progressionById(spec);
  return { title: prog.title, note: prog.note, faulty: !!prog.faulty };
}

// ================================================================ week navigator

const statusClass = (l) => {
  const done = lessonDone(l);
  return done === lessonTotal(l) ? 'status done' : done > 0 ? 'status partial' : 'status';
};

/**
 * The current lesson's week up to the open lesson, with its details under its
 * row. Later lessons stay hidden behind the Next lesson button.
 */
function renderWeek() {
  const l = current();
  const body = $('#lessonBody');
  $('#lessonPane').appendChild(body); // park it before the list is rebuilt
  $('#weekLessons').innerHTML = LESSONS.filter((x) => x.week === l.week && x.n <= l.n).map((x) => {
    const open = x.id === l.id;
    return `
      <li class="lesson${open ? ' open' : ''}">
        <button class="lesson-row" data-lesson="${x.id}"${open ? ' aria-current="true"' : ''}>
          <span class="${statusClass(x)}"></span>
          <span class="lesson-row-text">
            <span class="lesson-row-title"${open ? ' id="lessonTitle"' : ''}>${esc(x.title)}</span>
            <span class="lesson-row-meta">Lesson ${x.n} · ${lessonDone(x)} of ${lessonTotal(x)} done</span>
          </span>
        </button>
      </li>`;
  }).join('');
  $('#weekLessons .lesson.open').appendChild(body);
  renderWeekHead();
}

function renderWeekHead() {
  $('#weekSelect').innerHTML = WEEKS.map((w) => {
    const complete = LESSONS.filter((x) => x.week === w.n).every(lessonComplete);
    return `<option value="${w.n}">Week ${w.n} · ${esc(w.title)}${complete ? ' ✓' : ''}</option>`;
  }).join('');
  $('#weekSelect').value = String(current().week);
  const i = LESSONS.indexOf(current());
  $('#prevLesson').disabled = i === 0;
  $('#nextLesson').disabled = i === LESSONS.length - 1;
  renderPace();
}

// Refresh the open lesson's row after a task or drill changes.
function renderOpenRow() {
  const l = current();
  const row = $('#weekLessons .lesson.open .lesson-row');
  if (!row) return;
  row.querySelector('.status').className = statusClass(l);
  row.querySelector('.lesson-row-meta').textContent = `Lesson ${l.n} · ${lessonDone(l)} of ${lessonTotal(l)} done`;
  renderWeekHead();
}

/** Record a lesson as finished on the timeline the first time everything in it is done. */
function checkLessonComplete(l) {
  const rec = lessonRec(l.id);
  if (lessonComplete(l) && !rec.completedAt) {
    rec.completedAt = Date.now();
    logEvent('lesson', `Finished W${l.week} L${l.n}: ${l.title}`, l.id);
  }
}

$('#weekLessons').addEventListener('click', (e) => {
  const b = e.target.closest('.lesson-row');
  if (b && b.dataset.lesson !== state.current) openLesson(b.dataset.lesson);
});
$('#weekSelect').addEventListener('change', (e) => {
  const lessons = LESSONS.filter((x) => x.week === Number(e.target.value));
  openLesson((lessons.find((x) => !lessonComplete(x)) || lessons[0]).id);
});
$('#prevLesson').addEventListener('click', () => { const i = LESSONS.indexOf(current()); if (i > 0) openLesson(LESSONS[i - 1].id); });
$('#nextLesson').addEventListener('click', () => { const i = LESSONS.indexOf(current()); if (i < LESSONS.length - 1) openLesson(LESSONS[i + 1].id); });

// ---------------------------------------------------------------- start date and pace

const DAY = 86400000;
const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const shortDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) });

/**
 * The start date is the day of the first sign-in (set when the account is
 * created); before anyone signs in, it is the first day the app was used.
 */
function ensureStart() {
  if (state.startedAt) return;
  state.startedAt = Object.keys(state.practice).sort()[0] || today();
  save();
}

/** Calendar weeks since starting, against the week of the first unfinished lesson. */
function paceInfo() {
  const start = new Date(`${state.startedAt}T00:00:00`);
  const days = Math.max(0, Math.round((midnight(new Date()) - start) / DAY));
  const calWeek = Math.floor(days / 7) + 1;
  const next = LESSONS.find((x) => !lessonComplete(x));
  let pace;
  let cls = '';
  if (!next) { pace = 'Phase 1 complete'; cls = 'done'; } else {
    const diff = calWeek - next.week;
    const weeks = (n) => `${n} week${n > 1 ? 's' : ''}`;
    if (diff === 0) pace = 'on pace';
    else if (diff > 0) { pace = `${weeks(diff)} behind`; cls = 'behind'; } else { pace = `${weeks(-diff)} ahead`; cls = 'ahead'; }
  }
  const head = `Started ${shortDate(start)} · week ${calWeek} · `;
  return { text: head + pace, html: esc(head) + (cls ? `<span class="${cls}">${esc(pace)}</span>` : esc(pace)) };
}

function renderPace() {
  $('#paceLine').innerHTML = paceInfo().html;
}

// ================================================================ lesson

let openTasks = new Set();

function openLesson(id) {
  state.current = id;
  save();
  endSession();
  const l = current();
  exKey = l.explorerKey ? keyValue(l.explorerKey) : 'C-major';
  const firstOpen = l.tasks.find((t) => !lessonRec(l.id).tasks[t.id]);
  openTasks = new Set(firstOpen ? [firstOpen.id] : []);
  view = 'lesson';
  renderAll();
  $('#lessonPane').scrollTop = 0;
}

function renderLesson() {
  const l = current();
  renderWeek();
  $('#lessonGoal').textContent = l.goal;
  const journal = lessonRec(l.id).journal || '';
  $('#journal').value = journal;
  $('#notesBox').hidden = true;
  $('#notesBtn').setAttribute('aria-expanded', 'false');
  $('#notesDot').hidden = !journal.trim();
  renderExplain();
  renderDrills();
  renderTasks();
}

function renderExplain() {
  const l = current();
  $('#explain').innerHTML = (l.explain || []).map((sec, s) => `
    <section class="explain">
      <h3 class="section-title">${esc(sec.h)}</h3>
      ${sec.p.map((p) => `<p>${esc(p)}</p>`).join('')}
      ${sec.hear ? `<ul class="hears">${sec.hear.map((h, i) => {
        const lab = hearLabel(h);
        return `<li><button class="hear${lab.faulty ? ' faulty' : ''}" data-hear="${s}:${i}"><span class="play-icon" aria-hidden="true">▶</span><span><span class="hear-title">${esc(lab.title)}</span>${lab.note ? `<span class="hear-note">${esc(lab.note)}</span>` : ''}</span></button></li>`;
      }).join('')}</ul>` : ''}
    </section>`).join('');
}

$('#explain').addEventListener('click', (e) => {
  const b = e.target.closest('[data-hear]');
  if (!b) return;
  const [s, i] = b.dataset.hear.split(':').map(Number);
  const events = hearEvents(current().explain[s].hear[i]);
  playEvents(events);
  b.classList.add('playing');
  const end = Math.max(...events.map((ev) => ev.at + ev.dur));
  playTimers.push(setTimeout(() => b.classList.remove('playing'), end * 1000 + 100));
});

// ---------------------------------------------------------------- ear-training plan

function drillLabel(d) {
  const ex = EXERCISES[d.exercise];
  const items = d.items ? d.items.map((id) => ex.label(String(id))).join(', ') : ex.levels[d.level].label;
  const dir = d.direction && ex.directions ? ` · ${ex.directions[d.direction].toLowerCase()}` : '';
  return `${ex.title}: ${items}${dir}`;
}

function renderDrills() {
  const l = current();
  const plan = l.practice || [];
  $('#toolPane').prepend($('#panel-ear')); // park it before the list is rebuilt
  $('#drills').innerHTML = plan.map((d, i) => {
    const rec = state.drills[drillKey(l.id, i)];
    const tried = rec?.best !== undefined;
    const aim = `aim for ${d.target}%`;
    const result = tried ? (rec.passed ? `Best ${rec.best}%` : `Best ${rec.best}% · ${aim}`)
      : rec?.passed ? 'Marked done' : `Not tried · ${aim}`;
    const running = session?.lessonId === l.id && session.index === i;
    return `
      <li class="drill${rec?.passed ? ' passed' : ''}${running ? ' running' : ''}">
        <label class="check"><input type="checkbox" data-drill-done="${i}" ${rec?.passed ? 'checked' : ''} aria-label="Done: ${esc(drillLabel(d))}"><span class="ring"></span></label>
        <div class="drill-text">
          <span class="drill-title">${esc(drillLabel(d))}</span>
          <span class="drill-why">${esc(d.why)}</span>
          <span class="drill-meta">${d.count} questions · ${esc(result)}</span>
          <button class="text-link" data-learn="${i}">Learn more</button>
        </div>
        <button class="btn${rec?.passed ? '' : ' primary'}" data-drill="${i}">${tried ? 'Again' : 'Start'}</button>
      </li>`;
  }).join('');
  const passed = plan.filter((_, i) => drillPassed(l.id, i)).length;
  $('#practicePct').textContent = plan.length ? `${passed} of ${plan.length} done` : '';
  placeEar();
}

/** A lesson drill runs under its row in the lesson; free practice, in the Ear training tab. */
function placeEar() {
  const panel = $('#panel-ear');
  const row = session && view === 'lesson' ? $('#drills .drill.running') : null;
  if (row) row.appendChild(panel);
  else if (panel.parentElement !== $('#toolPane')) $('#toolPane').prepend(panel);
  panel.classList.toggle('inline', !!row);
  renderSession();
}

$('#drills').addEventListener('click', (e) => {
  const b = e.target.closest('[data-drill]');
  if (b) startSession(current().id, Number(b.dataset.drill));
  const learn = e.target.closest('[data-learn]');
  if (learn) {
    const d = current().practice[Number(learn.dataset.learn)];
    openLearn(drillLabel(d), drillConfig(d), d.more);
  }
});

/** A drill's question settings, in the shape activeConfig() returns. */
const drillConfig = (d) => ({ exercise: d.exercise, level: d.level, items: d.items ? d.items.map(String) : null, direction: d.direction || 'up' });

/** Learn more: what you hear, how to work it out, the answers and why it matters. Short, in a dialog. */
function openLearn(title, cfg, more) {
  const ex = EXERCISES[cfg.exercise];
  const items = cfg.items || ex.levels[cfg.level || Object.keys(ex.levels)[0]].items.map(String);
  const opts = { ...cfg, items };
  $('#learnTitle').textContent = title;
  $('#learnBody').innerHTML = `
    <p>${esc(ex.hears(opts))}</p>
    <h3 class="learn-h">How to work it out</h3>
    <ol class="learn-steps">${ex.how(opts).map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    <h3 class="learn-h">The answers</h3>
    <dl class="learn-answers">${items.map((id) => `<div><dt>${esc(ex.label(id))}</dt><dd>${esc(ex.tips[id])}</dd></div>`).join('')}</dl>
    <h3 class="learn-h">Why it matters</h3>
    <p>${esc(more || ex.why)}</p>`;
  openDialog('#learnDialog');
}
// Tick a drill off by hand, e.g. after practising it away from the app.
$('#drills').addEventListener('change', (e) => {
  const i = e.target.dataset.drillDone;
  if (i === undefined) return;
  const l = current();
  const key = drillKey(l.id, Number(i));
  state.drills[key] = { ...state.drills[key], passed: e.target.checked, at: Date.now() };
  if (e.target.checked) {
    logEvent('drill', `${drillLabel(l.practice[i])}: marked done`);
    checkLessonComplete(l);
  }
  save();
  renderDrills();
  renderTasks();
  renderOpenRow();
});

// ---------------------------------------------------------------- tasks

const KIND_LABEL = { watch: 'Watch', read: 'Read', write: 'Write', play: 'Keyboard' };

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
          ${t.action?.explorer ? '<button class="btn quiet" data-explore>Open Explore →</button>' : ''}
        </div>
      </li>`;
  }).join('');
  const done = l.tasks.filter((t) => rec.tasks[t.id]).length;
  const minutes = l.tasks.reduce((a, t) => a + t.minutes, 0);
  $('#checklistPct').textContent = `${done} of ${l.tasks.length} · ${minutes} min`;
  $('#progressFill').style.width = `${(100 * done) / l.tasks.length}%`;
  const next = LESSONS[LESSONS.indexOf(l) + 1];
  $('#nextUp').innerHTML = next ? `
    <button class="next-lesson${lessonComplete(l) ? ' ready' : ''}" data-lesson="${next.id}">
      <span><span class="next-label">${next.week === l.week ? 'Next lesson' : `Next · week ${next.week}`}</span><span class="next-title">${esc(next.title)}</span></span>
      <span class="next-arrow" aria-hidden="true">→</span>
    </button>` : '';
}

$('#tasks').addEventListener('change', (e) => {
  const id = e.target.dataset.task;
  if (!id) return;
  const l = current();
  lessonRec(l.id).tasks[id] = e.target.checked;
  if (e.target.checked) {
    logEvent('task', l.tasks.find((t) => t.id === id).title);
    // Close the finished task and open the next unfinished one.
    openTasks.delete(id);
    const nextTask = l.tasks.find((t) => !lessonRec(l.id).tasks[t.id]);
    if (nextTask) openTasks.add(nextTask.id);
    checkLessonComplete(l);
  }
  save();
  renderTasks();
  renderOpenRow();
});
$('#tasks').addEventListener('click', (e) => {
  const toggle = e.target.closest('[data-toggle]');
  if (toggle) {
    const id = toggle.dataset.toggle;
    if (openTasks.has(id)) openTasks.delete(id); else openTasks.add(id);
    renderTasks();
  }
  if (e.target.closest('[data-explore]')) showTab('explore');
});
$('#nextUp').addEventListener('click', (e) => { const b = e.target.closest('[data-lesson]'); if (b) openLesson(b.dataset.lesson); });

// ---------------------------------------------------------------- notes

$('#notesBtn').addEventListener('click', () => {
  const box = $('#notesBox');
  box.hidden = !box.hidden;
  $('#notesBtn').setAttribute('aria-expanded', String(!box.hidden));
  if (!box.hidden) $('#journal').focus();
});

let journalTimer = null;
$('#journal').addEventListener('input', () => {
  clearTimeout(journalTimer);
  $('#journalSaved').textContent = 'Saving…';
  journalTimer = setTimeout(() => {
    lessonRec(state.current).journal = $('#journal').value;
    $('#notesDot').hidden = !$('#journal').value.trim();
    save();
    $('#journalSaved').textContent = 'Saved';
  }, 400);
});

// ================================================================ ear training

let earExercise = 'intervals';
let question = null;
let answered = false;
let session = null; // a lesson drill in progress: { lessonId, index, spec, asked, correct }

function earSettings(ex) {
  const def = EXERCISES[ex];
  return (state.earSettings[ex] ||= { level: Object.keys(def.levels)[0], direction: 'up' });
}
const earStat = (ex) => (state.ear[ex] ||= { attempts: 0, correct: 0, items: {}, recent: [] });

/** The items and direction the next question uses: the drill's, or the free-practice settings. */
function activeConfig() {
  if (session) return drillConfig(session.spec);
  const s = earSettings(earExercise);
  return { exercise: earExercise, level: s.level, items: null, direction: s.direction };
}

function renderEar() {
  const cfg = activeConfig();
  const ex = EXERCISES[cfg.exercise];
  if (!session) {
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
  }
  $('#earHead').hidden = !!session;
  renderSession();
  $('#earHint').textContent = ex.hint;
  question = null;
  answered = false;
  $('#earRef').hidden = true;
  const items = cfg.items || ex.levels[cfg.level || Object.keys(ex.levels)[0]].items.map(String);
  $('#earAnswers').innerHTML = items.map((id, i) => `<button class="tile" data-answer="${id}">${i < 9 ? `<span class="k">${i + 1}</span>` : ''}${esc(ex.label(id))}</button>`).join('');
  setFeedback('', session ? 'Press New for the first question.' : 'Press New, sing it back, then answer.');
  renderEarStats();
}

function renderSession() {
  const box = $('#session');
  box.hidden = !session;
  if (!session) return;
  const l = lessonById(session.lessonId);
  const d = session.spec;
  const pct = session.asked ? Math.round((100 * session.correct) / session.asked) : 0;
  const finished = session.asked >= d.count;
  const end = `<button class="btn quiet sm" data-end>${finished ? 'Close' : 'End drill'}</button>`;
  const bar = `<div class="session-bar"><span style="width:${(100 * session.asked) / d.count}%"></span></div>`;
  const score = finished
    ? `<strong class="${pct >= d.target ? 'ok' : 'bad'}">${session.correct} of ${d.count} · ${pct}% ${pct >= d.target ? '✓ target met' : `· target ${d.target}%`}</strong>`
    : `Question ${Math.min(session.asked + 1, d.count)} of ${d.count} · ${session.correct} right`;
  const again = '<button class="btn primary" data-again>Again</button>';
  // Under its row the drill's name and purpose are already on screen.
  box.innerHTML = $('#panel-ear').classList.contains('inline') ? `
    <div class="session-head"><span class="sm">${score}</span>${end}</div>
    ${bar}
    ${finished ? `<div class="row">${again}</div>` : ''}` : `
    <div class="session-head">
      <span class="sm muted">Lesson drill · W${l.week} L${l.n}</span>
      ${end}
    </div>
    <div class="session-title">${esc(drillLabel(d))}</div>
    <p class="sm muted">${esc(d.why)}</p>
    ${bar}
    <p class="sm">${score}</p>
    ${finished ? `<div class="row">${again}<button class="btn" data-back>Back to the lesson</button></div>` : ''}`;
}

$('#session').addEventListener('click', (e) => {
  if (e.target.closest('[data-end]')) { endSession(); renderDrills(); renderEar(); }
  if (e.target.closest('[data-again]')) startSession(session.lessonId, session.index);
  if (e.target.closest('[data-back]')) { endSession(); renderDrills(); renderEar(); showTab('lesson'); }
});

function startSession(lessonId, index) {
  const spec = lessonById(lessonId).practice[index];
  session = { lessonId, index, spec, asked: 0, correct: 0 };
  earExercise = spec.exercise;
  renderDrills();
  renderEar();
  $('#panel-ear').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function endSession() {
  session = null;
  question = null;
}

function finishSession() {
  const { lessonId, index, spec } = session;
  const pct = Math.round((100 * session.correct) / spec.count);
  const key = drillKey(lessonId, index);
  const prev = state.drills[key];
  const passed = pct >= spec.target;
  state.drills[key] = { best: Math.max(prev?.best || 0, pct), last: pct, passed: !!prev?.passed || passed, at: Date.now() };
  logEvent('drill', `${drillLabel(spec)}: ${session.correct}/${spec.count} (${pct}%)${passed ? ' ✓' : ''}`, lessonId);
  checkLessonComplete(lessonById(lessonId));
  save();
  if (lessonId === state.current) { renderDrills(); renderOpenRow(); renderTasks(); }
}

function setFeedback(cls, text) {
  const fb = $('#earFeedback');
  fb.className = `feedback ${cls}`;
  fb.textContent = text;
}

function renderEarStats() {
  const ex = activeConfig().exercise;
  const st = earStat(ex);
  const pct = st.attempts ? Math.round((100 * st.correct) / st.attempts) : 0;
  $('#earStats').textContent = st.attempts ? `${pct}% · ${st.correct} of ${st.attempts}` : 'No answers yet';
  const recent = st.recent || [];
  const weak = Object.entries(st.items || {})
    .filter(([, [att]]) => att >= 3)
    .map(([id, [att, cor]]) => ({ id, acc: cor / att }))
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 3);
  const parts = [];
  if (recent.length) parts.push(`Last ${recent.length}: ${Math.round((100 * recent.filter(Boolean).length) / recent.length)}%`);
  if (weak.length) parts.push(`Weakest: ${weak.map((w) => `${EXERCISES[ex].label(w.id)} ${Math.round(w.acc * 100)}%`).join(', ')}`);
  $('#earWeak').textContent = session ? '' : parts.join(' · ');
}

function earNew() {
  if (session && session.asked >= session.spec.count) return;
  const cfg = activeConfig();
  question = makeQuestion(cfg.exercise, cfg.level, { direction: cfg.direction, items: cfg.items, stats: earStat(cfg.exercise) });
  answered = false;
  document.querySelectorAll('#earAnswers .tile').forEach((b) => b.classList.remove('right', 'wrong'));
  setFeedback('', 'Listen, sing it back, then answer.');
  $('#earRef').hidden = !question.reference;
  if (question.reference) $('#earRef').textContent = question.reference.label;
  // Keys stay dark while a question plays, or the keyboard would give the answer away.
  playEvents(question.events, { light: false });
}

function earReplay() {
  if (!question) { earNew(); return; }
  playEvents(question.events, { light: answered });
}

$('#earRef').addEventListener('click', () => { if (question?.reference) playEvents(question.reference.events, { light: answered }); });
$('#earHow').addEventListener('click', () => {
  const cfg = activeConfig();
  const ex = EXERCISES[cfg.exercise];
  const title = session ? drillLabel(session.spec)
    : `${ex.title}: ${ex.levels[cfg.level].label}${ex.directions ? ` · ${ex.directions[cfg.direction].toLowerCase()}` : ''}`;
  openLearn(title, cfg, session?.spec.more);
});

function earAnswer(id) {
  if (!question) { earNew(); return; }
  if (answered) return;
  answered = true;
  const ok = id === question.answer;
  const st = earStat(question.exercise);
  st.attempts += 1;
  if (ok) st.correct += 1;
  const item = (st.items[question.answer] ||= [0, 0]);
  item[0] += 1;
  if (ok) item[1] += 1;
  st.recent = [...(st.recent || []), ok].slice(-20);
  document.querySelector(`#earAnswers [data-answer="${CSS.escape(question.answer)}"]`)?.classList.add('right');
  if (!ok) document.querySelector(`#earAnswers [data-answer="${CSS.escape(id)}"]`)?.classList.add('wrong');
  setFeedback(ok ? 'right' : 'wrong', `${ok ? '✓ Right.' : '✗ Not quite.'} ${question.reveal}`);
  if (question.after) playEvents(question.after);
  if (session) {
    session.asked += 1;
    if (ok) session.correct += 1;
    if (session.asked >= session.spec.count) finishSession();
    renderSession();
  }
  save();
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

// Chord members as pitches stacked upward from octave 4, so root–3rd–5th–7th ascend.
function stackThirds(members) {
  const out = [];
  members.forEach((pc) => out.push(pitchAtOrAbove(pc, out.length ? out[out.length - 1].midi + 1 : 60)));
  return out;
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

// ================================================================ timeline

function renderTimeline() {
  const t = practiceTotals();
  const done = LESSONS.filter(lessonComplete).length;
  $('#timelineSummary').textContent = `${paceInfo().text} · ${done} of ${LESSONS.length} lessons finished · ${hm(t.total)} practised`;
  // One group per day that has events or practice time, newest first.
  const days = new Map();
  const day = (key) => {
    if (!days.has(key)) days.set(key, { events: [], secs: 0 });
    return days.get(key);
  };
  (state.history || []).forEach((ev) => day(new Date(ev.t).toLocaleDateString('en-CA')).events.push(ev));
  Object.entries(state.practice).forEach(([key, secs]) => { day(key).secs = secs; });
  const ICON = { task: '✓', drill: '♪', lesson: '★' };
  const keys = [...days.keys()].sort().reverse();
  $('#timeline').innerHTML = keys.length ? keys.map((key) => {
    const d = days.get(key);
    const label = new Date(`${key}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    return `
      <section class="tl-day">
        <h3><span>${esc(label)}</span>${d.secs ? `<span class="sm muted">${hm(d.secs)} practice</span>` : ''}</h3>
        <ul>${d.events.slice().reverse().map((ev) => `
          <li class="tl-${ev.type}"><span class="tl-icon" aria-hidden="true">${ICON[ev.type] || '·'}</span><span class="tl-text">${esc(ev.text)}</span>
          <span class="xs muted">${new Date(ev.t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span></li>`).join('')}</ul>
      </section>`;
  }).join('') : '<p class="muted">Nothing yet. Tick a task or finish a drill and it shows up here.</p>';
}

$('#timelineBtn').addEventListener('click', () => { renderTimeline(); openDialog('#timelineDialog'); });
$('#sourcesBtn').addEventListener('click', () => openDialog('#sourcesDialog'));

// ================================================================ account and sync

const SYNC_META = 'harmony-academy:account';
const cloud = { ready: false, user: null, status: '', error: '', at: 0, pushTimer: null, lastPull: 0 };

const loadMeta = () => { try { return JSON.parse(localStorage.getItem(SYNC_META)) || {}; } catch { return {}; } };
const saveMeta = (m) => { try { localStorage.setItem(SYNC_META, JSON.stringify(m)); } catch { /* storage blocked */ } };

const tasksDone = (st) => Object.values(st.lessons || {}).reduce((n, r) => n + Object.values(r.tasks || {}).filter(Boolean).length, 0);
const hasProgress = (st) => tasksDone(st) > 0
  || Object.keys(st.drills || {}).length > 0
  || Object.values(st.lessons || {}).some((r) => (r.journal || '').trim())
  || Object.values(st.ear || {}).some((e) => e.attempts > 0)
  || Object.values(st.practice || {}).some((sec) => sec > 0);

function startCloud() {
  if (!cloudAvailable()) return;
  initCloud(onUser).then(() => { cloud.ready = true; renderAccount(); }).catch(() => { cloud.ready = false; renderAccount(); });
}

function cloudChanged() {
  if (!cloud.user) return;
  clearTimeout(cloud.pushTimer);
  cloud.pushTimer = setTimeout(pushCloud, 3000);
}

async function pushCloud() {
  clearTimeout(cloud.pushTimer);
  cloud.pushTimer = null;
  if (!cloud.user) return;
  setSync('saving');
  try {
    await writeProgress(cloud.user.uid, portable(state), state.updatedAt || Date.now());
    setSync('synced');
  } catch (err) {
    setSync('error', err.code || err.message);
  }
}

/** Newest copy wins: take the account's if it is newer, upload ours if ours is. */
async function pullCloud() {
  if (!cloud.user) return;
  cloud.lastPull = Date.now();
  try {
    const remote = await readProgress(cloud.user.uid);
    const localAt = state.updatedAt || 0;
    if (!remote) await pushCloud();
    else if (remote.updatedAt > localAt) { applyRemote(remote); setSync('synced'); }
    else if (localAt > remote.updatedAt) await pushCloud();
    else setSync('synced');
  } catch (err) {
    setSync('error', err.code || err.message);
  }
}

function applyRemote(remote) {
  state = { ...freshState(), ...remote.state, tab: state.tab, dockOpen: state.dockOpen, updatedAt: remote.updatedAt };
  lastPayload = JSON.stringify(portable(state));
  ensureStart();
  try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* private mode */ }
  openLesson(state.current);
  renderTimer();
}

/** A new account starts its clock today: the start date is the day of the first sign-in. */
async function createAccountCopy() {
  state.startedAt = today();
  save();
  await pushCloud();
  renderPace();
}

async function onUser(user) {
  cloud.user = user;
  if (!user) { setSync(''); return; }
  setSync('saving');
  const meta = loadMeta();
  try {
    const remote = await readProgress(user.uid);
    if (meta.uid && meta.uid !== user.uid) {
      // Someone else used this browser before: never hand them that progress.
      applyRemote(remote || { state: freshState(), updatedAt: Date.now() });
      if (!remote) await createAccountCopy();
    } else if (!remote) {
      await createAccountCopy(); // first device for this account
    } else if (JSON.stringify(portable(state)) === JSON.stringify(remote.state)) {
      // already identical
    } else if (!hasProgress(state)) {
      applyRemote(remote);
    } else if (!hasProgress(remote.state)) {
      await pushCloud();
    } else if (meta.uid === user.uid) {
      await pullCloud(); // this browser was already linked: newest copy wins
    } else if (await chooseCopy(remote)) {
      applyRemote(remote); // first sign-in here, and both copies have progress
    } else {
      await pushCloud();
    }
    saveMeta({ uid: user.uid });
    setSync('synced');
  } catch (err) {
    setSync('error', err.code || err.message);
  }
}

/** Ask which progress to keep. Resolves true for the account's copy. */
function chooseCopy(remote) {
  const when = new Date(remote.updatedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const tasks = (n) => `${n} task${n === 1 ? '' : 's'} done`;
  $('#chooseAccount').textContent = `Use my account’s (${tasks(tasksDone(remote.state))}, saved ${when})`;
  $('#chooseLocal').textContent = `Use this browser’s (${tasks(tasksDone(state))})`;
  const d = $('#chooseDialog');
  d.showModal();
  return new Promise((resolve) => {
    $('#chooseAccount').onclick = () => { d.close(); resolve(true); };
    $('#chooseLocal').onclick = () => { d.close(); resolve(false); };
    d.oncancel = (e) => e.preventDefault();
  });
}

function setSync(status, error = '') {
  cloud.status = status;
  cloud.error = error;
  if (status === 'synced') cloud.at = Date.now();
  renderAccount();
}

const SIGN_IN_ERRORS = {
  'auth/operation-not-allowed': 'Google sign-in isn’t switched on for this app yet.',
  'auth/configuration-not-found': 'Sign-in isn’t set up for this app yet (Firebase Authentication is off).',
  'auth/unauthorized-domain': 'This address isn’t on the app’s allowed sign-in list yet.',
  'auth/network-request-failed': 'No connection. Try again when you’re online.',
  'permission-denied': 'The server refused to save. Try signing out and in again.',
};
// Unknown errors show their code, so a failure can be traced.
const errorText = (code) => SIGN_IN_ERRORS[code] || `Sign-in failed (${code}).`;

function renderAccount() {
  const show = cloudAvailable() && cloud.ready;
  $('#signInTop').hidden = !show || !!cloud.user;
  $('#avatarBtn').hidden = !show || !cloud.user;
  $('#account').hidden = !show;
  if (!show) return;
  const u = cloud.user;
  if (u) {
    $('#avatarBtn').innerHTML = u.photo ? `<img src="${esc(u.photo)}" alt="" referrerpolicy="no-referrer">` : esc((u.name || '?')[0].toUpperCase());
    $('#avatarBtn').title = `${u.name} · ${syncText()}`;
  }
  $('#account').innerHTML = u
    ? `<p><strong>${esc(u.name || '')}</strong><br><span class="sm muted">${esc(u.email || '')}</span><br><span class="sm ${cloud.status === 'error' ? 'bad' : 'muted'}">${esc(syncText())}</span></p>
       <button class="menu-item" id="signOutBtn">Sign out</button>`
    : `<p class="sm muted">Sign in to keep your progress on every device.</p>
       <button class="menu-item" id="signInBtn">Sign in with Google</button>
       ${cloud.error ? `<p class="sm bad">${esc(errorText(cloud.error))}</p>` : ''}`;
}

function syncText() {
  if (cloud.status === 'saving') return 'Syncing…';
  if (cloud.status === 'error') return SIGN_IN_ERRORS[cloud.error] || `Couldn’t sync (${cloud.error}). Will retry.`;
  if (!cloud.at) return 'Synced';
  const mins = Math.round((Date.now() - cloud.at) / 60000);
  return mins < 1 ? 'Synced just now' : `Synced ${mins} min ago`;
}

async function doSignIn() {
  cloud.error = '';
  try { await signIn(); } catch (err) { cloud.error = err.code || err.message; renderAccount(); $('#menu').hidden = false; }
}

$('#signInTop').addEventListener('click', (e) => { e.stopPropagation(); doSignIn(); });
$('#avatarBtn').addEventListener('click', (e) => { e.stopPropagation(); renderAccount(); renderTimer(); togglePopover($('#avatarBtn'), $('#menu')); });
$('#account').addEventListener('click', async (e) => {
  if (e.target.closest('#signInBtn')) doSignIn();
  if (e.target.closest('#signOutBtn')) { if (cloud.pushTimer) await pushCloud(); await signOut(); $('#menu').hidden = true; }
});
// Catch up with other devices when coming back to the app; flush edits when leaving.
window.addEventListener('focus', () => { if (cloud.user && Date.now() - cloud.lastPull > 5000) pullCloud(); });
document.addEventListener('visibilitychange', () => {
  if (!cloud.user) return;
  if (document.hidden && cloud.pushTimer) pushCloud();
  if (!document.hidden && Date.now() - cloud.lastPull > 5000) pullCloud();
});

// ================================================================ boot

function renderSources() {
  $('#sources').innerHTML = SOURCES.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a><br><span class="muted">${esc(s.note)}</span></li>`).join('');
}

function renderAll() {
  renderLesson();
  renderTabs();
  renderEar();
  renderExplorer();
}

function boot() {
  // Ask the browser not to evict saved progress under storage pressure.
  navigator.storage?.persist?.().catch(() => {});
  buildPiano();
  setupMidi();
  fillKeySelect($('#droneKey'), 'C-major');
  renderDegrees();
  renderSources();
  ensureStart();
  setDock(state.dockOpen ?? false); // folded away until asked for
  openLesson(state.current);
  renderTimer();
  startCloud();
}

boot();
