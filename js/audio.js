// Web Audio piano-ish synth and drone. Notes are scheduled on the audio clock,
// not with setTimeout, so chords stay together and progressions keep time.

import { midiToFreq } from './theory.js';

let ctx = null;
let master = null;
let wave = null;
const sounding = new Set();
const listeners = new Set();

function ensure() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 4;
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(comp);
    comp.connect(ctx.destination);
    // Harmonics falling off roughly like a struck string.
    const amps = [0, 1, 0.5, 0.32, 0.2, 0.12, 0.08, 0.05, 0.035, 0.022, 0.015, 0.01, 0.006];
    wave = ctx.createPeriodicWave(new Float32Array(amps.length), Float32Array.from(amps));
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Subscribe to note on/off events (for lighting keys): fn(midi, on, kind). */
export function onNote(fn) { listeners.add(fn); }
const emit = (midi, on, kind) => listeners.forEach((fn) => fn(midi, on, kind));

/**
 * Play one note. `at` is seconds from now; `kind` ('bass' | 'upper' | 'user')
 * only affects which colour the keyboard lights.
 */
export function note(midi, { at = 0, dur = 1.2, vel = 0.22, kind = 'upper' } = {}) {
  const c = ensure();
  const t0 = c.currentTime + 0.03 + at;
  const f = midiToFreq(midi);
  // Low notes need more level to sound as loud; high notes less.
  const level = vel * Math.min(1.6, Math.max(0.6, 1 + (60 - midi) / 40));
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(level, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(level * 0.4, t0 + 0.3);
  g.gain.exponentialRampToValueAtTime(level * 0.18, t0 + Math.max(0.35, dur));
  g.gain.setTargetAtTime(0.0001, t0 + dur, 0.07);
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(14000, f * 12), t0);
  filter.frequency.exponentialRampToValueAtTime(Math.max(500, f * 3), t0 + 1.2);
  const oscs = [0, 5].map((detune) => {
    const o = c.createOscillator();
    o.setPeriodicWave(wave);
    o.frequency.value = f;
    o.detune.value = detune;
    o.connect(filter);
    o.start(t0);
    o.stop(t0 + dur + 0.6);
    return o;
  });
  filter.connect(g);
  g.connect(master);
  const voice = { oscs, g, midi };
  sounding.add(voice);
  oscs[0].onended = () => sounding.delete(voice);
  const onDelay = Math.max(0, (t0 - c.currentTime) * 1000);
  voice.timers = [
    setTimeout(() => emit(midi, true, kind), onDelay),
    setTimeout(() => emit(midi, false, kind), onDelay + Math.min(dur, 1.5) * 1000),
  ];
  return voice;
}

/** Play a chord (array of MIDI numbers, lowest first is treated as the bass). */
export function chord(midis, { at = 0, dur = 1.4, roll = 0, bassKind = 'bass' } = {}) {
  const lowest = Math.min(...midis);
  midis.forEach((m, i) => note(m, { at: at + i * roll, dur, kind: m === lowest ? bassKind : 'upper' }));
}

/** Silence everything that is sounding or scheduled. */
export function stopAll() {
  if (!ctx) return;
  const now = ctx.currentTime;
  sounding.forEach((v) => {
    v.timers.forEach(clearTimeout);
    emit(v.midi, false);
    v.g.gain.cancelScheduledValues(now);
    v.g.gain.setTargetAtTime(0.0001, now, 0.02);
    v.oscs.forEach((o) => { try { o.stop(now + 0.15); } catch { /* already stopped */ } });
  });
  sounding.clear();
}

export const now = () => ensure().currentTime;

// ---------------------------------------------------------------- drone

let drone = null;

/** Start (or retune) a soft tonic + fifth drone on the given pitch class (0 = C). */
export function startDrone(pc) {
  const c = ensure();
  stopDrone();
  const root = 36 + pc; // octave 2
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, c.currentTime);
  out.gain.exponentialRampToValueAtTime(0.11, c.currentTime + 0.8);
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 700;
  filter.connect(out);
  out.connect(master);
  const oscs = [[root, 'sawtooth', 0.5], [root + 12, 'triangle', 0.5], [root + 19, 'triangle', 0.25]].map(([m, type, lvl]) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = midiToFreq(m);
    g.gain.value = lvl;
    o.connect(g);
    g.connect(filter);
    o.start();
    return o;
  });
  drone = { out, oscs };
}

export function stopDrone() {
  if (!drone || !ctx) return;
  const { out, oscs } = drone;
  drone = null;
  out.gain.cancelScheduledValues(ctx.currentTime);
  out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
  oscs.forEach((o) => o.stop(ctx.currentTime + 1));
}

export const droneOn = () => drone !== null;
