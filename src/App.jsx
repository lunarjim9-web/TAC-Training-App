import { useState, useEffect, useMemo, useRef } from "react";
import {
  ChevronLeft, ChevronRight, Plus, Check, Minus,
  TrendingUp, Activity, BarChart3, ClipboardList,
  Trophy, Download, Upload, Trash2, X, Shield,
  Repeat, Copy, Flame, Timer, SkipForward, MoreHorizontal,
  FileText, Search, Undo2, ArrowRight, Pencil, ChevronUp, ChevronDown, Settings, Info,
} from "lucide-react";
import * as XLSX from "xlsx";

// ═══════════════════════════════════════════════════════════════════════════
// PROGRAM
// Day colors follow competition plate coding: red, blue, yellow.
// Names match earlier versions where the exercise is unchanged, so history,
// "last time" and progression suggestions carry over.
// `bw: true` marks a bodyweight exercise: the weight field logs ADDED load.
// ═══════════════════════════════════════════════════════════════════════════
const BASE_DAYS = [
  {
    id: "push", n: 1, label: "Push", sub: "Chest, shoulders, triceps",
    color: "var(--push)", on: "var(--push-on)", ink: "var(--push-ink)",
    exercises: [
      { name: "Barbell Bench Press",       sets: 4, reps: "8–12", rest: "2 min" },
      { name: "Dumbbell Shoulder Press",   sets: 3, reps: "8–12", rest: "90 s"  },
      { name: "Incline DB Press",          sets: 3, reps: "8–12", rest: "90 s"  },
      { name: "Lateral Raises (Dumbbell)", sets: 3, reps: "8–12", rest: "60 s"  },
      { name: "Technogym Chest Press",     sets: 3, reps: "8–12", rest: "90 s"  },
      { name: "Tricep Pushdown",           sets: 3, reps: "8–12", rest: "60 s"  },
      { name: "Fly Machine",               sets: 3, reps: "8–12", rest: "60 s"  },
      { name: "Overhead Tricep Extension", sets: 3, reps: "8–12", rest: "60 s"  },
    ],
  },
  {
    id: "pull", n: 2, label: "Pull", sub: "Back, biceps, rear delts",
    color: "var(--pull)", on: "var(--pull-on)", ink: "var(--pull-ink)",
    exercises: [
      { name: "Pull-ups",              sets: 3, reps: "8–12", rest: "2 min", bw: true },
      { name: "Technogym Low Row",     sets: 3, reps: "8–12", rest: "90 s"  },
      { name: "Rear Delt Fly Machine", sets: 3, reps: "8–12", rest: "60 s"  },
      { name: "Preacher EZ Bar Curl",  sets: 3, reps: "8–12", rest: "60 s"  },
      { name: "Hammer Curl",           sets: 3, reps: "8–12", rest: "60 s"  },
    ],
  },
  {
    id: "legs", n: 3, label: "Legs", sub: "Quads, hamstrings, calves",
    color: "var(--legs)", on: "var(--legs-on)", ink: "var(--legs-ink)",
    exercises: [
      { name: "Barbell Back Squat",  sets: 3, reps: "8–12", rest: "2 min" },
      { name: "Technogym Leg Press", sets: 3, reps: "8–12", rest: "2 min" },
      { name: "Standing Calf Raise", sets: 3, reps: "8–12", rest: "60 s"  },
      { name: "Leg Curl",            sets: 3, reps: "8–12", rest: "60 s"  },
      { name: "Leg Extension",       sets: 3, reps: "8–12", rest: "60 s"  },
    ],
  },
];
// The live program: base days with any edits from the routine editor applied
let DAYS = BASE_DAYS;
function rebuildDays() {
  const r = SETTINGS.routine;
  DAYS = BASE_DAYS.map(d => (r && Array.isArray(r[d.id])) ? { ...d, exercises: r[d.id] } : d);
}
const findDay = id => DAYS.find(d => d.id === id);

// Exercise library — common exercises grouped by category, with sensible defaults.
const EXERCISE_LIBRARY = [
  { category: "Chest", items: [
    { name: "Bench Press", sets: 4, reps: "8–10", rest: "2 min" },
    { name: "Incline DB Press", sets: 3, reps: "8–12", rest: "90 s" },
    { name: "Technogym Chest Press", sets: 3, reps: "8–12", rest: "90 s" },
    { name: "Fly Machine", sets: 3, reps: "8–12", rest: "60 s" },
    { name: "Decline Bench Press", sets: 3, reps: "8–10", rest: "90 s" },
    { name: "Dumbbell Fly", sets: 3, reps: "12–15", rest: "60 s" },
    { name: "Cable Fly", sets: 3, reps: "12–15", rest: "60 s" },
    { name: "Push-ups", sets: 3, reps: "AMRAP", rest: "60 s" },
    { name: "Dips (Chest)", sets: 3, reps: "8–12", rest: "90 s" },
  ]},
  { category: "Back", items: [
    { name: "Pull-ups", sets: 3, reps: "8–12", rest: "2 min" },
    { name: "Chin-ups", sets: 3, reps: "8–12", rest: "2 min" },
    { name: "Lat Pulldown", sets: 3, reps: "8–12", rest: "90 s" },
    { name: "Technogym Low Row", sets: 3, reps: "8–12", rest: "90 s" },
    { name: "Seated Cable Row", sets: 3, reps: "8–12", rest: "90 s" },
    { name: "Single-Arm Cable Row", sets: 3, reps: "8–12", rest: "90 s" },
    { name: "Chest-Supported Row", sets: 3, reps: "8–12", rest: "90 s" },
    { name: "Barbell Row", sets: 4, reps: "8–10", rest: "2 min" },
    { name: "Dumbbell Row (Single Arm)", sets: 3, reps: "8–12", rest: "90 s" },
    { name: "T-Bar Row", sets: 3, reps: "8–10", rest: "90 s" },
    { name: "Deadlift", sets: 3, reps: "5–8", rest: "3 min" },
    { name: "Face Pull", sets: 3, reps: "15–20", rest: "60 s" },
    { name: "Straight-Arm Pulldown", sets: 3, reps: "12–15", rest: "60 s" },
  ]},
  { category: "Shoulders", items: [
    { name: "Overhead Press (Barbell)", sets: 4, reps: "6–8", rest: "2 min" },
    { name: "Dumbbell Shoulder Press", sets: 3, reps: "8–12", rest: "90 s" },
    { name: "Arnold Press", sets: 3, reps: "10–12", rest: "90 s" },
    { name: "Lateral Raises (Dumbbell)", sets: 3, reps: "8–12", rest: "60 s" },
    { name: "Lateral Raises (Cable)", sets: 3, reps: "8–12", rest: "60 s" },
    { name: "Rear Delt Fly Machine", sets: 3, reps: "8–12", rest: "60 s" },
    { name: "Front Raise", sets: 3, reps: "12–15", rest: "60 s" },
    { name: "Upright Row", sets: 3, reps: "10–12", rest: "60 s" },
    { name: "Shrugs", sets: 3, reps: "12–15", rest: "60 s" },
  ]},
  { category: "Arms", items: [
    { name: "Barbell Curl", sets: 3, reps: "8–10", rest: "60 s" },
    { name: "EZ Bar Curl", sets: 3, reps: "10–12", rest: "60 s" },
    { name: "Preacher EZ Bar Curl", sets: 3, reps: "8–12", rest: "60 s" },
    { name: "Dumbbell Curl", sets: 3, reps: "10–12", rest: "60 s" },
    { name: "Hammer Curl", sets: 3, reps: "8–12", rest: "60 s" },
    { name: "Cable Curl", sets: 3, reps: "12–15", rest: "60 s" },
    { name: "Tricep Pushdown", sets: 3, reps: "8–12", rest: "60 s" },
    { name: "Overhead Tricep Extension", sets: 3, reps: "8–12", rest: "60 s" },
    { name: "Skull Crushers", sets: 3, reps: "10–12", rest: "60 s" },
    { name: "Close-Grip Bench Press", sets: 3, reps: "8–10", rest: "90 s" },
    { name: "Dips (Triceps)", sets: 3, reps: "8–12", rest: "90 s" },
  ]},
  { category: "Legs", items: [
    { name: "Barbell Back Squat", sets: 3, reps: "8–12", rest: "2 min" },
    { name: "Front Squat", sets: 4, reps: "6–8", rest: "2 min" },
    { name: "Bulgarian Split Squat", sets: 3, reps: "8–10", rest: "90 s" },
    { name: "Romanian Deadlift", sets: 3, reps: "8–10", rest: "2 min" },
    { name: "Technogym Leg Press", sets: 3, reps: "8–12", rest: "2 min" },
    { name: "Leg Extension", sets: 3, reps: "8–12", rest: "60 s" },
    { name: "Leg Curl", sets: 3, reps: "8–12", rest: "60 s" },
    { name: "Walking Lunges", sets: 3, reps: "10 each", rest: "90 s" },
    { name: "Standing Calf Raise", sets: 3, reps: "8–12", rest: "60 s" },
    { name: "Seated Calf Raise", sets: 3, reps: "15–20", rest: "60 s" },
    { name: "Hip Thrust", sets: 3, reps: "8–12", rest: "90 s" },
  ]},
  { category: "Core", items: [
    { name: "Plank", sets: 3, reps: "45–60 s", rest: "45 s" },
    { name: "Hanging Leg Raise", sets: 3, reps: "10–15", rest: "60 s" },
    { name: "Cable Crunch", sets: 3, reps: "15–20", rest: "45 s" },
    { name: "Ab Wheel Rollout", sets: 3, reps: "8–12", rest: "60 s" },
    { name: "Dead Bug", sets: 3, reps: "10 each", rest: "45 s" },
  ]},
];

// ═══════════════════════════════════════════════════════════════════════════
// THEME
// Colors live in CSS variables so light and dark switch without re-rendering
// every inline style. `a()` makes a translucent tint of any token.
// Charts (SVG attributes) can't read CSS variables, so they use CHART_HEX,
// which the App swaps when the theme changes.
// ═══════════════════════════════════════════════════════════════════════════
const c = {
  bg: "var(--bg)", surface: "var(--surface)", inset: "var(--inset)",
  line: "var(--line)", lineSoft: "var(--line-soft)",
  ink: "var(--ink)", ink2: "var(--ink-2)", ink3: "var(--ink-3)", ink4: "var(--ink-4)",
  good: "var(--good)", danger: "var(--danger)", caution: "var(--caution)",
};
// Extra clearance at the top of each screen, on top of the phone's safe area.
// 0 for the standalone app; set to ~52 if viewing inside Claude's full-screen
// artifact view, whose floating close/menu buttons sit over the top corners.
const TOP_GAP = 14;

const a = (color, pct) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

const CHART_PALETTES = {
  light: { ink: "#15171A", grid: "#E6E2DC", muted: "#AFAAA3", accent: "#2F8A48", tip: "#FBFAF8", tipLine: "#D9D5CF", push: "#D63A2C", pull: "#2461C8", legs: "#C99A12" },
  dark:  { ink: "#EEF0EC", grid: "#272A2E", muted: "#50555B", accent: "#55B872", tip: "#1B1E21", tipLine: "#30343A", push: "#E2483A", pull: "#5B8DE6", legs: "#F0BD2E" },
};
let CHART_HEX = CHART_PALETTES.light;
const KEY_THEME = "theme_pref"; // "system" | "light" | "dark"

const FONT = "'Archivo', system-ui, -apple-system, sans-serif";

function GlobalCSS() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..900&family=Fraunces:ital,opsz,wght@1,9..144,500..700&display=swap');

      :root, [data-theme="light"] {
        color-scheme: light;
        --bg: #ECEAE6;
        --surface: #FBFAF8;
        --inset: #E7E4DF;
        --line: #D9D5CF;
        --line-soft: #E6E2DC;
        --ink: #15171A;
        --ink-2: #474C52;
        --ink-3: #767C83;
        --ink-4: #A9AEB3;
        --good: #2F8A48;
        --danger: #C23A2E;
        --caution: #C77A12;
        --push: #D63A2C;  --push-on: #FFFFFF; --push-ink: #B32F23;
        --pull: #2461C8;  --pull-on: #FFFFFF; --pull-ink: #1D52AA;
        --legs: #EDB41E;  --legs-on: #1C1500; --legs-ink: #8C6400;
      }
      [data-theme="dark"] {
        color-scheme: dark;
        --bg: #0E1012;
        --surface: #17191C;
        --inset: #202327;
        --line: #2E3237;
        --line-soft: #23262A;
        --ink: #EEF0EC;
        --ink-2: #B8BCC1;
        --ink-3: #868C92;
        --ink-4: #555A60;
        --good: #55B872;
        --danger: #EC6154;
        --caution: #E9A23B;
        --push: #E2483A;  --push-on: #FFFFFF; --push-ink: #FF8A7D;
        --pull: #3A76DD;  --pull-on: #FFFFFF; --pull-ink: #8FB4F5;
        --legs: #F0BD2E;  --legs-on: #1C1500; --legs-ink: #F4CD5C;
      }

      *, *::before, *::after { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
      html { overflow-x: clip; }
      html, body {
        margin: 0; padding: 0;
        background: var(--bg); color: var(--ink);
        font-family: ${FONT}; font-size: 15px; line-height: 1.4;
        transition: background 200ms ease;
      }
      button { border: none; background: none; padding: 0; margin: 0; cursor: pointer; font: inherit; color: inherit; -webkit-tap-highlight-color: transparent; }
      button:disabled { cursor: default; }
      input, select { font: inherit; color: inherit; outline: none; }
      :focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; border-radius: 6px; }
      input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      input[type=number] { -moz-appearance: textfield; }
      select { -webkit-appearance: none; appearance: none; }
      ::-webkit-scrollbar { display: none; }

      .num { font-variant-numeric: tabular-nums; }
      .display { font-stretch: 75%; font-weight: 800; letter-spacing: -0.01em; line-height: 0.92; }
      .cond { font-stretch: 80%; }
      .muted { color: var(--ink-3); }
      .serif { font-family: 'Fraunces', Georgia, serif; font-style: italic; font-weight: 600; letter-spacing: -0.01em; }
      .card { background: var(--surface); border: 1px solid var(--line-soft); border-radius: 18px; }
      .tap { transition: transform 120ms ease, opacity 120ms ease, background 160ms ease; }
      .tap:active:not(:disabled) { transform: scale(0.975); opacity: 0.85; }
      .h-sec { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; margin: 0; }
      .link { font-size: 14px; font-weight: 650; color: var(--ink-2); display: inline-flex; align-items: center; gap: 6px; padding: 8px 0; white-space: nowrap; flex-shrink: 0; }

      .bw-input::placeholder { color: inherit; opacity: 0.4; }
      .bw-input.is-done::placeholder { opacity: 1; }
      .big-in::placeholder { color: var(--ink-4); }

      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
      @keyframes sheetUp { from { transform: translateY(100%); } to { transform: none; } }
      @keyframes pop { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); } }
      @keyframes stamp { 0% { transform: scale(1.06); } 100% { transform: scale(1); } }
      @keyframes livePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
      .live-dot { animation: livePulse 2s ease-in-out infinite; }
      .fade-in { animation: fadeIn 160ms ease backwards; }
      .no-enter .rise, .no-enter .fade-in { animation: none; }
      .rise { animation: rise 260ms cubic-bezier(0.16, 1, 0.3, 1) backwards; }
      .sheet-up { animation: sheetUp 280ms cubic-bezier(0.16, 1, 0.3, 1) both; }
      .pop { animation: pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }
      .stamp { animation: stamp 260ms cubic-bezier(0.16, 1, 0.3, 1) both; }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
      }
    `}</style>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE
// Three records: finished workouts, the in-progress workout, and settings.
// Saved to Claude's persistent artifact storage when it's available (survives
// app updates and cleared browser data), and mirrored to this device.
// Older versions kept one key per workout in localStorage; that data is
// migrated automatically on first load.
// ═══════════════════════════════════════════════════════════════════════════
const K_WORKOUTS = "tac_workouts_v2";
const K_ACTIVE = "tac_active_v2";
const K_SETTINGS = "tac_settings_v2";
const DEFAULT_SETTINGS = {
  bodyweight: 0, target: 3, theme: "system",
  notes: {}, perSide: {}, bars: {}, aliases: {}, routine: null,
  recapSeen: null, lastBackup: 0, tipDismissed: false, goals: {}, name: "Peter",
};
let SETTINGS = { ...DEFAULT_SETTINGS };
let STORE_MODE = "device"; // becomes "claude" once artifact storage accepts a write

const hasCloud = () => {
  try { return typeof window !== "undefined" && !!window.storage && typeof window.storage.get === "function"; }
  catch { return false; }
};
function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch {} }
function lsDel(k) { try { localStorage.removeItem(k); } catch {} }
async function cloudGet(k) {
  if (!hasCloud()) return null;
  try { const r = await window.storage.get(k, false); return r && typeof r.value === "string" ? r.value : null; }
  catch { return null; }
}
async function cloudSet(k, v) {
  if (!hasCloud()) return false;
  try { return !!(await window.storage.set(k, v, false)); } catch { return false; }
}
async function cloudDel(k) {
  if (!hasCloud()) return;
  try { await window.storage.delete(k, false); } catch {}
}

// Writes to the same key run in order, so an older save can't land after a newer one
const writeChains = {};
function writeKey(k, value) {
  if (value === null) lsDel(k); else lsSet(k, value);
  const prev = writeChains[k] || Promise.resolve();
  const next = prev
    .then(() => (value === null ? cloudDel(k).then(() => null) : cloudSet(k, value)))
    .then(ok => { if (ok) STORE_MODE = "claude"; })
    .catch(() => {});
  writeChains[k] = next;
  return next;
}
function parseJSON(raw, fallback) {
  if (raw === null || raw === undefined) return fallback;
  try { const v = JSON.parse(raw); return v === null || v === undefined ? fallback : v; } catch { return fallback; }
}

function readLegacy() {
  const workouts = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("workout_")) {
        const w = parseJSON(localStorage.getItem(k), null);
        if (w && w.id) workouts.push(w);
      }
    }
  } catch {}
  const s = {};
  const bw = Number(lsGet("bodyweight_lb")); if (bw) s.bodyweight = bw;
  const t = Number(lsGet("weekly_target")); if (t) s.target = t;
  const th = lsGet("theme_pref"); if (th) s.theme = th;
  const n = parseJSON(lsGet("exercise_notes"), null); if (n) s.notes = n;
  const ps = parseJSON(lsGet("per_side_entry"), null); if (ps) s.perSide = ps;
  const rs = lsGet("recap_seen_month"); if (rs) s.recapSeen = rs;
  const lb = Number(lsGet("last_backup_at")); if (lb) s.lastBackup = lb;
  return { workouts, active: parseJSON(lsGet("active_workout"), null), settings: s };
}

function applySettingsGlobals() {
  CURRENT_BW = Number(SETTINGS.bodyweight) || 0;
  rebuildDays();
}
function saveSettings(patch) {
  SETTINGS = { ...SETTINGS, ...patch };
  applySettingsGlobals();
  return writeKey(K_SETTINGS, JSON.stringify(SETTINGS));
}
function saveWorkouts(list) { return writeKey(K_WORKOUTS, JSON.stringify(list)); }
async function persistActive(w) { return writeKey(K_ACTIVE, JSON.stringify(w)); }
async function clearActiveStorage() { return writeKey(K_ACTIVE, null); }

async function loadStore() {
  const [cw, ca, cs] = await Promise.all([cloudGet(K_WORKOUTS), cloudGet(K_ACTIVE), cloudGet(K_SETTINGS)]);
  if (cw !== null || cs !== null) STORE_MODE = "claude";
  let workouts = parseJSON(cw !== null ? cw : lsGet(K_WORKOUTS), null);
  let active = parseJSON(ca !== null ? ca : lsGet(K_ACTIVE), null);
  let settings = parseJSON(cs !== null ? cs : lsGet(K_SETTINGS), null);

  let needsUpload = cw === null && Array.isArray(workouts) && workouts.length > 0;
  if (!workouts && !settings) {
    const legacy = readLegacy();
    if (legacy.workouts.length || legacy.active || Object.keys(legacy.settings).length) {
      workouts = legacy.workouts;
      active = active || legacy.active;
      settings = legacy.settings;
      needsUpload = true;
    }
  }
  SETTINGS = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  applySettingsGlobals();
  workouts = (Array.isArray(workouts) ? workouts : []).map(normalizeWorkout).sort((x, y) => y.startedAt - x.startedAt);
  active = active ? normalizeWorkout(active) : null;

  if (needsUpload) {
    saveWorkouts(workouts);
    writeKey(K_SETTINGS, JSON.stringify(SETTINGS));
    if (active) persistActive(active);
  } else if (hasCloud() && STORE_MODE !== "claude") {
    // First run with artifact storage available: confirm it accepts writes
    await writeKey(K_SETTINGS, JSON.stringify(SETTINGS));
  }
  return { workouts, active };
}

// Old exercise names mapped to current ones, applied whenever data loads.
const NAME_ALIASES = {
  "Lateral Raises (Cable)": "Lateral Raises (Dumbbell)",
};
function resolveName(name) {
  const map = { ...NAME_ALIASES, ...(SETTINGS.aliases || {}) };
  let n = name, guard = 0;
  while (map[n] && map[n] !== n && guard++ < 10) n = map[n];
  return n;
}
function normalizeWorkout(w) {
  if (!w || !Array.isArray(w.exercises)) return w;
  return { ...w, exercises: w.exercises.map(ex => { const n = resolveName(ex.name); return n !== ex.name ? { ...ex, name: n } : ex; }) };
}

// ═══════════════════════════════════════════════════════════════════════════
// BODYWEIGHT — each finished workout stores a snapshot so old volume
// numbers don't shift when bodyweight changes later.
// ═══════════════════════════════════════════════════════════════════════════
let CURRENT_BW = 0;
function saveBodyweight(v) {
  saveSettings({ bodyweight: Number(v) || 0 });
  return CURRENT_BW;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════
const fmtDate = ts => new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtLong = ts => new Date(ts).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
const fmtToday = ts => new Date(ts).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
const fmtDur  = ms => { const m = Math.floor(ms / 60000); return m >= 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m}m`; };
const fmtNum  = n  => n >= 1e6 ? `${+(n/1e6).toFixed(n >= 1e7 ? 0 : 1)}M` : n >= 10000 ? `${(n/1000).toFixed(0)}k` : n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(Math.round(n));
const greet   = ()  => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };
const timeAgo = ts  => {
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d/7)}w ago`;
  return fmtDate(ts);
};

// Exercise name heuristics for progression logic:
const LOWER_BODY_KEYWORDS = ["squat", "deadlift", "leg press", "lunge", "hip thrust", "calf"];
const BODYWEIGHT_KEYWORDS = ["pull-up", "pullup", "chin-up", "chinup", "push-up", "pushup", "dip", "plank", "hanging"];

function isLowerBody(name) {
  const n = name.toLowerCase();
  return LOWER_BODY_KEYWORDS.some(k => n.includes(k));
}
function isBodyweight(name) {
  const n = name.toLowerCase();
  return BODYWEIGHT_KEYWORDS.some(k => n.includes(k));
}
// Explicit flag wins; older saved workouts fall back to the name heuristic.
function exIsBW(ex) {
  if (!ex) return false;
  return typeof ex.bw === "boolean" ? ex.bw : isBodyweight(ex.name || "");
}

// Effective load for volume: bodyweight exercises count bodyweight + added.
function setLoad(set, bw, bodyweight) {
  const added = Number(set.weight) || 0;
  return bw ? (Number(bodyweight) || 0) + added : added;
}

// Plain-text load label: "BW", "BW + 25 lb", or "185 lb"
function fmtLoadText(weight, bw) {
  const n = Number(weight) || 0;
  if (bw) return n > 0 ? `BW + ${n} lb` : "BW";
  return `${weight === "" || weight === undefined ? "—" : weight} lb`;
}

const workoutVolume = w => {
  const bwLb = w.bodyweight || CURRENT_BW;
  return (w.exercises || []).reduce((s, ex) => {
    const bw = exIsBW(ex);
    return s + ex.sets.reduce((s2, set) => set.warmup ? s2 : s2 + setLoad(set, bw, bwLb) * (Number(set.reps) || 0), 0);
  }, 0);
};
// Working sets only; warm-ups are logged but don't count toward sets, volume or PRs
const workoutSets = w => (w.exercises || []).reduce((s, ex) => s + ex.sets.filter(x => x.done && !x.warmup).length, 0);

// Estimated one-rep max (Epley). Only meaningful up to ~12 reps, which covers the program.
function e1rm(load, reps) {
  const r = Number(reps) || 0;
  const l = Number(load) || 0;
  if (r <= 0 || l <= 0) return 0;
  return r === 1 ? l : l * (1 + r / 30);
}
// Load used for e1RM: bodyweight moves need a known bodyweight
function e1rmLoad(set, bw, bodyweight) {
  if (bw) return bodyweight ? bodyweight + (Number(set.weight) || 0) : 0;
  return Number(set.weight) || 0;
}

function findLastSet(history, exerciseName) {
  for (const w of history) {
    const ex = (w.exercises || []).find(e => e.name === exerciseName);
    if (!ex) continue;
    const done = ex.sets.filter(s => s.done && s.weight !== "" && s.reps !== "");
    if (done.length) return done[done.length - 1];
  }
  return null;
}

// Returns the full array of completed sets from the MOST RECENT session
// for this exercise, so we can prepopulate them in the next session.
function findLastSessionSets(history, exerciseName) {
  for (const w of history) {
    const ex = (w.exercises || []).find(e => e.name === exerciseName);
    if (!ex) continue;
    const done = ex.sets.filter(s => s.done && s.weight !== "" && s.reps !== "");
    if (done.length) return done.map(s => ({ weight: String(s.weight), reps: String(s.reps), warmup: !!s.warmup }));
  }
  return null;
}

// Parse target reps like "8–10", "10-12", "AMRAP", "15" — returns { min, max } or null
function parseRepTarget(repsStr) {
  if (!repsStr || typeof repsStr !== "string") return null;
  // Match "N-M" or "N–M" (regular or em-dash)
  const range = repsStr.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };
  const single = repsStr.match(/(\d+)/);
  if (single) return { min: Number(single[1]), max: Number(single[1]) };
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// NEXT-SESSION TARGETS — one model used everywhere (Today card, Try chip,
// exercise screen), so the app never shows two different numbers for a lift.
//   • Each set aims to beat that same set from last time by one rep, capped
//     at the top of the rep range.
//   • Once every set at your top weight hit the top of the range, the top
//     weight goes up (5 lb upper body / 10 lb lower) at the bottom of the range.
//   • Coming back from 3+ weeks off: every set about 10% lighter, same reps,
//     for your first two sessions back.
// The "top" target is the one for last time's best set.
// ═══════════════════════════════════════════════════════════════════════════
const COMEBACK_DAYS = 21;

// Returns { weeks, sessionsBack } while you're easing back in, else null
function comebackInfo(history) {
  if (!history.length) return null;
  const now = Date.now();
  const gapNow = (now - history[0].startedAt) / 86400000;
  if (gapNow >= COMEBACK_DAYS) return { weeks: Math.floor(gapNow / 7), sessionsBack: 0, last: history[0].startedAt };
  // Sessions since the most recent 3+ week gap (history is newest first)
  for (let i = 0; i < Math.min(history.length - 1, 2); i++) {
    const gap = (history[i].startedAt - history[i + 1].startedAt) / 86400000;
    if (gap >= COMEBACK_DAYS) return { weeks: Math.floor(gap / 7), sessionsBack: i + 1, last: history[i + 1].startedAt };
  }
  return null;
}

function roundLoad(w, name, bw) {
  const step = bw || isLowerBody(name) || /barbell|bench|squat|deadlift/i.test(name) ? 5 : 2.5;
  return Math.max(0, Math.round(w / step) * step);
}

function nextTargets(history, name, repsText, bw) {
  const last = findLastSessionSets(history, name);
  if (!last || !last.length) return null;
  const work = last.filter(s => !s.warmup);
  if (!work.length) return null;
  const num = x => Number(x) || 0;
  const t = parseRepTarget(repsText || "8–12");
  const inc = bw ? 5 : (isLowerBody(name) ? 10 : 5);
  const cb = comebackInfo(history);
  const topW = Math.max(...work.map(s => num(s.weight)));
  const minTopReps = Math.min(...work.filter(s => num(s.weight) === topW).map(s => num(s.reps)));
  const increase = !cb && !!t && minTopReps >= t.max;

  const sets = last.map(s => {
    if (s.warmup) return { weight: cb ? String(roundLoad(num(s.weight) * 0.9, name, bw)) : s.weight, reps: s.reps, warmup: true };
    if (cb) return { weight: String(roundLoad(num(s.weight) * 0.9, name, bw)), reps: s.reps };
    if (increase && num(s.weight) === topW) return { weight: String(topW + inc), reps: String(t.min) };
    const r = num(s.reps) + 1;
    return { weight: s.weight, reps: String(t ? Math.min(r, t.max) : r) };
  });

  // Last time's best working set → its target is the headline number
  let bestIdx = -1;
  last.forEach((s, i) => {
    if (s.warmup) return;
    if (bestIdx < 0) { bestIdx = i; return; }
    const b = last[bestIdx];
    if (num(s.weight) > num(b.weight) || (num(s.weight) === num(b.weight) && num(s.reps) > num(b.reps))) bestIdx = i;
  });
  const top = sets[bestIdx];
  const rationale = cb
    ? `back after ${cb.weeks} weeks, about 10% lighter`
    : increase
      ? `+${inc} lb, every top set hit ${t.max} last time`
      : "beat each set by a rep";
  return { increase, comeback: !!cb, sets, top, rationale };
}

// Headline target for a lift: { increase, comeback, weight, reps, rationale }
function recommendNextSet(history, exerciseName, targetRepsStr, bw) {
  const n = nextTargets(history, exerciseName, targetRepsStr, bw);
  if (!n || !n.top) return null;
  return { increase: n.increase, comeback: n.comeback, weight: n.top.weight, reps: n.top.reps, rationale: n.rationale };
}

function exerciseTimeSeries(workouts, name) {
  const result = [];
  const sorted = [...workouts].sort((a, b) => a.startedAt - b.startedAt);
  for (const w of sorted) {
    const ex = (w.exercises || []).find(e => e.name === name);
    if (!ex) continue;
    const bw = exIsBW(ex);
    const bwLb = w.bodyweight || CURRENT_BW;
    const done = ex.sets.filter(s => s.done && !s.warmup && Number(s.reps) > 0 && s.weight !== "");
    if (!done.length) continue;
    const top = Math.max(...done.map(s => Number(s.weight) || 0));
    const topReps = Math.max(...done.filter(s => (Number(s.weight) || 0) === top).map(s => Number(s.reps)));
    const vol = done.reduce((s, x) => s + setLoad(x, bw, bwLb) * Number(x.reps), 0);
    const est = Math.round(Math.max(...done.map(s => e1rm(e1rmLoad(s, bw, bwLb), s.reps))));
    result.push({ date: w.startedAt, label: fmtDate(w.startedAt), top, topReps, vol, bw, e1rm: est || null });
  }
  return result;
}

function weeklyData(workouts, n) {
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);

  const result = [];
  for (let i = 0; i < n; i++) {
    const start = new Date(monday);
    start.setDate(monday.getDate() - 7 * (n - 1 - i));
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const ws = workouts.filter(w => w.startedAt >= start.getTime() && w.startedAt < end.getTime());
    result.push({
      wk: `${start.getMonth() + 1}/${start.getDate()}`,
      sessions: ws.length,
      vol: ws.reduce((s, w) => s + workoutVolume(w), 0),
    });
  }
  return result;
}

// PRs rank by weight (added weight for bodyweight moves), then reps.
function computePRs(workouts) {
  const map = new Map();
  const sorted = [...workouts].sort((a, b) => a.startedAt - b.startedAt);
  for (const w of sorted) {
    for (const ex of (w.exercises || [])) {
      const bw = exIsBW(ex);
      const bwLb = w.bodyweight || CURRENT_BW;
      for (const set of ex.sets) {
        if (!set.done || set.warmup || set.weight === "" || !set.reps) continue;
        const wt = Number(set.weight) || 0;
        const rp = Number(set.reps);
        const est = Math.round(e1rm(e1rmLoad(set, bw, bwLb), rp));
        const cur = map.get(ex.name);
        if (!cur || wt > cur.top || (wt === cur.top && rp > cur.reps)) {
          map.set(ex.name, { top: wt, reps: rp, date: w.startedAt, bw, e1rm: Math.max(est, cur ? cur.e1rm : 0) });
        } else if (est > cur.e1rm) {
          cur.e1rm = est;
        }
      }
    }
  }
  return Array.from(map.entries()).map(([name, d]) => ({ name, ...d }));
}

function nextDay(workouts) {
  const last = workouts.find(w => w.dayId);
  if (!last) return "push";
  const order = ["push", "pull", "legs"];
  return order[(order.indexOf(last.dayId) + 1) % 3];
}

function avgPerWeek(workouts) {
  const data = weeklyData(workouts, 8);
  const active = data.filter(w => w.sessions > 0);
  if (!active.length) return 0;
  return Math.round((active.reduce((s, w) => s + w.sessions, 0) / active.length) * 10) / 10;
}

// ═══════════════════════════════════════════════════════════════════════════
// WEEKS, TARGETS, RECAPS
// ═══════════════════════════════════════════════════════════════════════════
const KEY_TARGET = "weekly_target";
const KEY_RECAP_SEEN = "recap_seen_month";

function mondayOf(ts) {
  const d = new Date(ts);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function sessionsBetween(workouts, start, end) {
  return workouts.filter(w => w.startedAt >= start.getTime() && w.startedAt < end.getTime()).length;
}

// Consecutive weeks hitting the target. The current week only counts once
// it's hit, so an in-progress week never breaks the streak.
function weekStreak(workouts, target) {
  if (!target) return 0;
  let start = mondayOf(Date.now());
  let streak = sessionsBetween(workouts, start, addDays(start, 7)) >= target ? 1 : 0;
  for (let i = 0; i < 520; i++) {
    start = addDays(start, -7);
    if (sessionsBetween(workouts, start, addDays(start, 7)) >= target) streak++;
    else break;
  }
  return streak;
}

function monthRecap(workouts, year, month) {
  const start = new Date(year, month, 1).getTime();
  const end = new Date(year, month + 1, 1).getTime();
  const ws = workouts.filter(w => w.startedAt >= start && w.startedAt < end);
  const before = workouts.filter(w => w.startedAt < start);
  const topBefore = new Map(computePRs(before).map(p => [p.name, p.top]));
  const prs = computePRs([...ws, ...before]).filter(p => {
    const b = topBefore.get(p.name);
    return b !== undefined && p.top > b;
  });
  return {
    label: new Date(year, month, 1).toLocaleDateString("en-US", { month: "long" }),
    sessions: ws.length,
    sets: ws.reduce((s, w) => s + workoutSets(w), 0),
    volume: ws.reduce((s, w) => s + workoutVolume(w), 0),
    prs,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MUSCLE GROUPS — direct sets per muscle (primary mover only)
// ═══════════════════════════════════════════════════════════════════════════
const MUSCLES = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Quads", "Hamstrings", "Calves"];
// Direct (1) and indirect (0.5) sets per exercise. Counting secondary movers
// at half a set is the convention in recent volume research.
const MUSCLE_WEIGHTS = {
  "Barbell Bench Press": { Chest: 1, Triceps: 0.5, Shoulders: 0.5 },
  "Incline DB Press": { Chest: 1, Shoulders: 0.5, Triceps: 0.5 },
  "Technogym Chest Press": { Chest: 1, Triceps: 0.5, Shoulders: 0.5 },
  "Fly Machine": { Chest: 1 },
  "Dumbbell Shoulder Press": { Shoulders: 1, Triceps: 0.5 },
  "Lateral Raises (Dumbbell)": { Shoulders: 1 },
  "Rear Delt Fly Machine": { Shoulders: 1, Back: 0.5 },
  "Tricep Pushdown": { Triceps: 1 },
  "Overhead Tricep Extension": { Triceps: 1 },
  "Pull-ups": { Back: 1, Biceps: 0.5 },
  "Technogym Low Row": { Back: 1, Biceps: 0.5, Shoulders: 0.5 },
  "Preacher EZ Bar Curl": { Biceps: 1 },
  "Hammer Curl": { Biceps: 1 },
  "Barbell Back Squat": { Quads: 1 },
  "Technogym Leg Press": { Quads: 1 },
  "Leg Extension": { Quads: 1 },
  "Leg Curl": { Hamstrings: 1 },
  "Standing Calf Raise": { Calves: 1 },
};
function muscleFor(name) {
  if (MUSCLE_WEIGHTS[name]) return Object.keys(MUSCLE_WEIGHTS[name])[0];
  const n = name.toLowerCase();
  const has = (...ks) => ks.some(k => n.includes(k));
  if (has("calf")) return "Calves";
  if (has("leg curl", "romanian", "rdl", "hip thrust")) return "Hamstrings";
  if (has("squat", "leg press", "leg extension", "lunge")) return "Quads";
  if (has("tricep", "pushdown", "skull", "close-grip")) return "Triceps";
  if (has("curl")) return "Biceps";
  if (has("rear delt", "lateral", "shoulder", "overhead press", "arnold", "front raise", "upright", "shrug", "face pull")) return "Shoulders";
  if (has("row", "pull", "chin", "deadlift")) return "Back";
  if (has("bench", "chest", "fly", "push-up", "dip")) return "Chest";
  return null;
}
function muscleWeights(name) {
  if (MUSCLE_WEIGHTS[name]) return MUSCLE_WEIGHTS[name];
  const m = muscleFor(name);
  if (!m) return {};
  const n = name.toLowerCase();
  if (m === "Chest" && /press|dip|push-up/.test(n)) return { Chest: 1, Triceps: 0.5, Shoulders: 0.5 };
  if (m === "Shoulders" && /press/.test(n)) return { Shoulders: 1, Triceps: 0.5 };
  if (m === "Back" && /row|pull|chin/.test(n)) return { Back: 1, Biceps: 0.5 };
  if (m === "Quads" && /squat|lunge/.test(n)) return { Quads: 1 };
  return { [m]: 1 };
}
const fmtSets = v => (Number.isInteger(v) ? String(v) : v.toFixed(1));

function setsByMuscle(workouts, start, end) {
  const out = Object.fromEntries(MUSCLES.map(m => [m, 0]));
  for (const w of workouts) {
    if (w.startedAt < start.getTime() || w.startedAt >= end.getTime()) continue;
    for (const ex of (w.exercises || [])) {
      const n = ex.sets.filter(s => s.done && !s.warmup).length;
      if (!n) continue;
      const wts = muscleWeights(ex.name);
      for (const m in wts) if (m in out) out[m] += n * wts[m];
    }
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════
// IN-GYM HELPERS
// ═══════════════════════════════════════════════════════════════════════════
// "2 min" → 120, "90 s" → 90, "1:30" → 90
function parseRestSeconds(rest) {
  if (!rest || typeof rest !== "string") return 0;
  const mmss = rest.match(/(\d+):(\d{2})/);
  if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2]);
  const n = parseFloat(rest);
  if (!n) return 0;
  return /min|\bm\b/i.test(rest) ? Math.round(n * 60) : Math.round(n);
}

// Sets for a newly added or swapped exercise, prefilled from its last session
function buildSets(history, name, n, bw) {
  let last = findLastSessionSets(history, name);
  // Easing back in after a break: prefill the lighter targets, not old numbers
  const cb = last && comebackInfo(history);
  if (cb) last = last.map(x => ({ ...x, weight: String(roundLoad((Number(x.weight) || 0) * 0.9, name, bw)) }));
  return Array.from({ length: n }, (_, i) => {
    const src = last ? (last[i] || last[last.length - 1]) : null;
    return src
      ? { weight: src.weight, reps: src.reps, done: false, ...(src.warmup ? { warmup: true } : {}) }
      : { weight: "", reps: "", done: false };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// COPY FOR CLAUDE — plain-text session summary to paste into a chat
// ═══════════════════════════════════════════════════════════════════════════
function fmtSetShort(weight, bw) {
  const n = Number(weight) || 0;
  if (bw) return n > 0 ? `BW+${n}` : "BW";
  return String(weight);
}

function fmtSetForText(s, bw) {
  const rir = s.rir !== undefined && s.rir !== null ? ` RIR${Number(s.rir) >= 3 ? "3+" : s.rir}` : "";
  return `${s.warmup ? "warm-up " : ""}${fmtSetShort(s.weight, bw)}×${s.reps}${rir}`;
}

function buildSessionText(w, prior, newPRs) {
  const day = findDay(w.dayId);
  const date = new Date(w.startedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const lines = [];
  lines.push(`${day ? day.label : "Workout"} day, ${date}`);
  const meta = [];
  if (w.completedAt) meta.push(fmtDur(w.completedAt - w.startedAt));
  meta.push(`${workoutSets(w)} sets`, `${fmtNum(workoutVolume(w))} lb volume`);
  if (w.bodyweight) meta.push(`bodyweight ${w.bodyweight} lb`);
  lines.push(meta.join(", "));
  lines.push("Loads in lb; BW = bodyweight, BW+10 = 10 lb added; RIR = reps left in reserve (0 = failure).");
  lines.push("");
  for (const ex of (w.exercises || [])) {
    const bw = exIsBW(ex);
    const done = ex.sets.filter(s => s.done);
    if (!done.length) continue;
    const swapped = ex.swappedFrom ? ` (swapped in for ${ex.swappedFrom})` : "";
    lines.push(`${ex.name}${swapped}, target ${ex.targetSets}×${ex.targetReps}`);
    lines.push(`  Today: ${done.map(s => fmtSetForText(s, bw)).join(", ")}`);
    const last = findLastSessionSets(prior, ex.name);
    if (last) lines.push(`  Last time: ${last.map(s => fmtSetForText(s, bw)).join(", ")}`);
    const note = getNote(ex.name);
    if (note) lines.push(`  Setup: ${note}`);
  }
  if (newPRs && newPRs.length) {
    lines.push("");
    lines.push(`New PRs: ${newPRs.map(p => `${p.name} ${fmtLoadText(p.weight, p.bw)} × ${p.reps} (${PR_LABEL[p.kind]})`).join("; ")}`);
  }
  lines.push("");
  lines.push("I run push/pull/legs with double progression in the 8–12 range. Review this session: where am I progressing, where am I stalling, and what should I change next time?");
  return lines.join("\n");
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXCEL EXPORT
// ═══════════════════════════════════════════════════════════════════════════
function exportToExcel(workouts) {
  if (!workouts || !workouts.length) return;

  const toDate = ts => new Date(ts).toISOString().slice(0, 10);
  const sorted = [...workouts].sort((a, b) => a.startedAt - b.startedAt);

  const setsData = [["Date", "Day", "Exercise", "Set", "Load", "Weight / Added (lb)", "Reps", "Volume (lb)", "Completed"]];
  for (const w of sorted) {
    const day = findDay(w.dayId);
    const bwLb = w.bodyweight || CURRENT_BW;
    for (const ex of (w.exercises || [])) {
      const bw = exIsBW(ex);
      ex.sets.forEach((s, i) => {
        const weight = Number(s.weight) || 0;
        const reps = Number(s.reps) || 0;
        setsData.push([
          toDate(w.startedAt),
          day ? day.label : w.dayId,
          ex.name,
          i + 1,
          fmtLoadText(s.weight, bw),
          weight,
          reps,
          setLoad(s, bw, bwLb) * reps,
          s.done ? "Yes" : "No",
        ]);
      });
    }
  }

  const summaryData = [["Date", "Day", "Duration (min)", "Sets Done", "Total Volume (lb)", "Bodyweight (lb)"]];
  for (const w of sorted) {
    const day = findDay(w.dayId);
    summaryData.push([
      toDate(w.startedAt),
      day ? day.label : w.dayId,
      Math.round((w.completedAt - w.startedAt) / 60000),
      workoutSets(w),
      workoutVolume(w),
      w.bodyweight || "",
    ]);
  }

  const prsData = [["Exercise", "Top Load", "Reps at Top", "Date"]];
  const prs = computePRs(workouts).sort((a, b) => b.top - a.top);
  for (const pr of prs) {
    prsData.push([pr.name, fmtLoadText(pr.top, pr.bw), pr.reps, toDate(pr.date)]);
  }

  const historyData = [["Exercise", "Date", "Top Load", "Top Reps", "Volume (lb)"]];
  const allNames = new Set();
  workouts.forEach(w => (w.exercises || []).forEach(e => allNames.add(e.name)));
  const sortedNames = Array.from(allNames).sort();
  for (const name of sortedNames) {
    const series = exerciseTimeSeries(workouts, name);
    for (const r of series) {
      historyData.push([name, toDate(r.date), fmtLoadText(r.top, r.bw), r.topReps, r.vol]);
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(setsData), "Sets");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Workouts");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prsData), "Personal Records");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(historyData), "Exercise History");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `tac-training-${toDate(Date.now())}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ═══════════════════════════════════════════════════════════════════════════
// BACKUP / RESTORE — a JSON file you keep somewhere safe
// ═══════════════════════════════════════════════════════════════════════════
const BACKUP_VERSION = 2;

function exportBackup(workouts) {
  const toDate = ts => new Date(ts).toISOString().slice(0, 10);
  const payload = { version: BACKUP_VERSION, exportedAt: Date.now(), bodyweight: CURRENT_BW || null, settings: SETTINGS, workouts };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `tac-backup-${toDate(Date.now())}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  saveSettings({ lastBackup: Date.now() });
}

// Validate that a parsed backup is structurally sound
function validateBackup(parsed) {
  if (!parsed || typeof parsed !== "object") return false;
  if (!Array.isArray(parsed.workouts)) return false;
  for (const w of parsed.workouts) {
    if (!w || typeof w !== "object") return false;
    if (typeof w.id !== "string") return false;
    if (typeof w.dayId !== "string") return false;
    if (typeof w.startedAt !== "number") return false;
    if (!Array.isArray(w.exercises)) return false;
    for (const ex of w.exercises) {
      if (!ex || typeof ex !== "object") return false;
      if (typeof ex.name !== "string") return false;
      if (!Array.isArray(ex.sets)) return false;
    }
  }
  return true;
}

// Replaces all workouts (and settings, if the backup has them). Returns the new list.
function applyBackup(parsed) {
  try {
    const patch = parsed.settings && typeof parsed.settings === "object" ? { ...parsed.settings } : {};
    if (!patch.bodyweight && parsed.bodyweight) patch.bodyweight = parsed.bodyweight;
    patch.lastBackup = Date.now();
    saveSettings(patch);
    const list = parsed.workouts.map(normalizeWorkout).sort((x, y) => y.startedAt - x.startedAt);
    saveWorkouts(list);
    return list;
  } catch (e) {
    console.error("[applyBackup]", e);
    return null;
  }
}

// Days since last backup — Infinity if never
function daysSinceBackup() {
  const ts = Number(SETTINGS.lastBackup);
  if (!ts) return Infinity;
  return Math.floor((Date.now() - ts) / 86400000);
}

// ═══════════════════════════════════════════════════════════════════════════
// MORE HELPERS
// ═══════════════════════════════════════════════════════════════════════════
// Sentence-friendly relative time: "today", "yesterday", "3 days ago", "on Aug 18"
function ago(ts) {
  const d = Math.floor((mondayOfDay(Date.now()) - mondayOfDay(ts)) / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 7) return `${d} days ago`;
  if (d < 28) { const w = Math.floor(d / 7); return `${w} week${w === 1 ? "" : "s"} ago`; }
  return `on ${fmtDate(ts)}`;
}
// Midnight of the given day (used for whole-day differences)
function mondayOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function firstOpenSet(ex) {
  return ex.sets.findIndex(s => !s.done);
}
function isExerciseDone(ex) {
  return ex.sets.length > 0 && ex.sets.every(s => s.done);
}

// Average duration of recent sessions for a day, for the "about 55m" estimate
// Median of recent sessions, ignoring any left open for hours by accident
function typicalDuration(history, dayId) {
  const ds = history
    .filter(w => w.dayId === dayId && w.completedAt)
    .map(w => w.completedAt - w.startedAt)
    .filter(d => d > 5 * 60000 && d < 3 * 3600000)
    .slice(0, 6)
    .sort((x, y) => x - y);
  if (!ds.length) return null;
  const mid = Math.floor(ds.length / 2);
  return ds.length % 2 ? ds[mid] : (ds[mid - 1] + ds[mid]) / 2;
}

// ═══════════════════════════════════════════════════════════════════════════
// FULL EXPORT FOR CLAUDE — every workout as one plain-text file
// ═══════════════════════════════════════════════════════════════════════════
function buildFullExportText(workouts, { bodyweight, target }) {
  const sorted = [...workouts].sort((x, y) => x.startedAt - y.startedAt);
  const d = ts => new Date(ts).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const L = [];

  L.push("TRAINING LOG EXPORT");
  L.push(`Exported ${d(Date.now())}`);
  if (sorted.length) {
    L.push(`${sorted.length} sessions from ${d(sorted[0].startedAt)} to ${d(sorted[sorted.length - 1].startedAt)}`);
  }
  if (bodyweight) L.push(`Current bodyweight: ${bodyweight} lb`);
  L.push(`Weekly target: ${target} sessions`);
  L.push("Loads in lb. BW = bodyweight only, BW+10 = bodyweight plus 10 lb. Only completed sets are listed; warm-up sets are marked and excluded from volume and PRs. RIR = reps left in reserve (0 = failure). Est. 1RM uses the Epley formula.");
  L.push("");

  L.push("CURRENT PROGRAM");
  for (const day of DAYS) {
    L.push(`${day.label}`);
    for (const e of day.exercises) L.push(`  ${e.name}: ${e.sets} × ${e.reps}, rest ${e.rest}`);
  }
  L.push("");

  L.push("SUMMARY BY EXERCISE");
  const names = [];
  const seen = new Set();
  for (const w of sorted) for (const e of (w.exercises || [])) {
    if (!seen.has(e.name)) { seen.add(e.name); names.push(e.name); }
  }
  const prMap = new Map(computePRs(workouts).map(p => [p.name, p]));
  for (const name of names) {
    const series = exerciseTimeSeries(workouts, name);
    if (!series.length) continue;
    const first = series[0];
    const last = series[series.length - 1];
    const bw = last.bw;
    const pr = prMap.get(name);
    const parts = [
      `${series.length} session${series.length === 1 ? "" : "s"}`,
      `first ${fmtSetShort(first.top, bw)}×${first.topReps} (${fmtDate(first.date)})`,
      `latest ${fmtSetShort(last.top, bw)}×${last.topReps} (${fmtDate(last.date)})`,
    ];
    if (pr) parts.push(`best ${fmtSetShort(pr.top, bw)}×${pr.reps}`);
    if (first.e1rm && last.e1rm) parts.push(`est. 1RM ${first.e1rm} to ${last.e1rm}`);
    const note = getNote(name);
    if (note) parts.push(`setup: ${note}`);
    L.push(`  ${name}: ${parts.join(", ")}`);
  }
  L.push("");

  L.push("WEEKLY SESSIONS AND SETS PER MUSCLE (last 8 weeks, newest first; secondary muscles count as half a set)");
  const mon = mondayOf(Date.now());
  for (let i = 0; i < 8; i++) {
    const start = addDays(mon, -7 * i);
    const end = addDays(start, 7);
    const n = sessionsBetween(workouts, start, end);
    const m = setsByMuscle(workouts, start, end);
    L.push(`  Week of ${fmtDate(start.getTime())}: ${n} session${n === 1 ? "" : "s"}; ${MUSCLES.map(k => `${k} ${fmtSets(m[k])}`).join(", ")}`);
  }
  L.push("");

  L.push("SESSIONS (oldest first)");
  for (const w of sorted) {
    const day = findDay(w.dayId);
    const meta = [d(w.startedAt), day ? day.label : w.dayId];
    if (w.completedAt) meta.push(fmtDur(w.completedAt - w.startedAt));
    meta.push(`${workoutSets(w)} sets`, `${fmtNum(workoutVolume(w))} lb volume`);
    if (w.bodyweight) meta.push(`bodyweight ${w.bodyweight} lb`);
    L.push("");
    L.push(meta.join(", "));
    for (const ex of (w.exercises || [])) {
      const bw = exIsBW(ex);
      const done = ex.sets.filter(s => s.done);
      if (!done.length) continue;
      const note = ex.swappedFrom ? ` [swapped in for ${ex.swappedFrom}]` : "";
      L.push(`  ${ex.name}${note}: ${done.map(s => fmtSetForText(s, bw)).join(", ")}`);
    }
  }
  L.push("");
  L.push("I run a push/pull/legs split with double progression in the 8–12 rep range. Review my training: which lifts are progressing or stalling, whether weekly volume per muscle is balanced, and what you would change.");
  return L.join("\n");
}

// On phones, hand the file to the share sheet (Save to Files, AirDrop, Claude);
// elsewhere, download it.
async function shareOrDownload(text, filename, type = "text/plain") {
  const blob = new Blob([text], { type });
  try {
    const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    const file = new File([blob], filename, { type });
    if (coarse && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: filename });
      return "shared";
    }
  } catch (e) {
    if (e && e.name === "AbortError") return "cancelled";
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return "downloaded";
}

// ═══════════════════════════════════════════════════════════════════════════
// SETUP NOTES — one line per exercise (seat height, pins, grip)
// ═══════════════════════════════════════════════════════════════════════════
function getNote(name) { return (SETTINGS.notes || {})[name] || ""; }
function saveNote(name, text) {
  const t = (text || "").trim();
  const notes = { ...(SETTINGS.notes || {}) };
  if (t) notes[name] = t; else delete notes[name];
  saveSettings({ notes });
  return notes;
}

// ═══════════════════════════════════════════════════════════════════════════
// PERSONAL RECORDS
// A set is a PR if, against every earlier working set of that exercise, it's:
//   heaviest   – more weight (added weight for bodyweight moves)
//   est. 1RM   – higher Epley estimate
//   rep PR     – more reps than ever done at this weight or heavier
// First-ever sessions don't count, so PRs always mean you beat something.
// ═══════════════════════════════════════════════════════════════════════════
const PR_LABEL = { weight: "heaviest", e1rm: "best est. 1RM", reps: "rep PR" };
const PR_SHORT = { weight: "Heaviest", e1rm: "Est. 1RM", reps: "Rep PR" };

function priorStats(history, name) {
  const sets = [];
  for (const w of history) {
    const ex = (w.exercises || []).find(e => e.name === name);
    if (!ex) continue;
    const bw = exIsBW(ex);
    const bwLb = w.bodyweight || CURRENT_BW;
    for (const s of ex.sets) {
      if (!s.done || s.warmup || !s.reps) continue;
      sets.push({ w: Number(s.weight) || 0, r: Number(s.reps) || 0, e: e1rm(e1rmLoad(s, bw, bwLb), s.reps) });
    }
  }
  if (!sets.length) return null;
  return {
    topW: Math.max(...sets.map(x => x.w)),
    bestE: Math.max(...sets.map(x => x.e)),
    repsAtOrAbove: w => Math.max(0, ...sets.filter(x => x.w >= w).map(x => x.r)),
  };
}

function prKind(stats, set, bw, bodyweight) {
  if (!stats || !set || set.warmup) return null;
  const w = Number(set.weight) || 0;
  const r = Number(set.reps) || 0;
  if (r <= 0) return null;
  if (w > stats.topW) return "weight";
  const e = e1rm(e1rmLoad(set, bw, bodyweight), r);
  if (e > 0 && e > stats.bestE + 0.5) return "e1rm";
  const best = stats.repsAtOrAbove(w);
  if (best > 0 && r > best) return "reps";
  return null;
}

// One PR per exercise (best kind wins) for the post-workout summary
function detectSessionPRs(completed, history) {
  const order = { weight: 0, e1rm: 1, reps: 2 };
  const out = [];
  for (const ex of completed.exercises || []) {
    const stats = priorStats(history, ex.name);
    if (!stats) continue;
    const bw = exIsBW(ex);
    let best = null;
    for (const s of ex.sets) {
      if (!s.done) continue;
      const k = prKind(stats, s, bw, completed.bodyweight || CURRENT_BW);
      if (k && (!best || order[k] < order[best.kind])) best = { kind: k, weight: s.weight, reps: s.reps };
    }
    if (best) out.push({ name: ex.name, bw, ...best });
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════
// PLATE MATH — 45 lb bar, standard plates, per side
// ═══════════════════════════════════════════════════════════════════════════
const PLATES = [45, 35, 25, 10, 5, 2.5];
function isBarbell(name) {
  const n = name.toLowerCase();
  if (/dumbbell|\bdb\b|machine|technogym|cable|smith|leg press/.test(n)) return false;
  return /barbell|ez bar|bench press|squat|deadlift|overhead press|close-grip/.test(n);
}
function platesPerSide(total, bar = 45) {
  const t = Number(total);
  if (!t || t < bar) return null;
  let side = (t - bar) / 2;
  if (side === 0) return [];
  const out = [];
  for (const p of PLATES) {
    while (side >= p - 1e-9) { out.push(p); side -= p; }
  }
  return side > 0.01 ? null : out;
}

// Per-side entry preference for barbell lifts, remembered per exercise
function getPerSide(name) { return !!(SETTINGS.perSide || {})[name]; }
function setPerSide(name, on) {
  const perSide = { ...(SETTINGS.perSide || {}) };
  if (on) perSide[name] = true; else delete perSide[name];
  saveSettings({ perSide });
}
// Bar weight per exercise: 45 lb Olympic by default, 25 lb for EZ bars
const BAR_OPTIONS = [45, 35, 25];
function getBar(name) {
  const b = (SETTINGS.bars || {})[name];
  if (b) return b;
  return /ez bar/i.test(name) ? 25 : 45;
}
function setBar(name, bar) {
  saveSettings({ bars: { ...(SETTINGS.bars || {}), [name]: bar } });
}
// total ↔ per side, rounded to the nearest half pound
function totalToSide(t, bar = 45) {
  if (t === "" || t === undefined || t === null) return "";
  const n = (Number(t) - bar) / 2;
  return n <= 0 ? "0" : String(Math.round(n * 100) / 100);
}
function sideToTotal(v, bar = 45) {
  if (v === "" || v === undefined) return "";
  return String(Math.round((bar + 2 * (Number(v) || 0)) * 2) / 2);
}

// Live clock: "4:07", "12:30", "1:05:09"
function fmtClock(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60;
  const ss = String(sec).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// BEAT LAST TIME
// ═══════════════════════════════════════════════════════════════════════════
// This session vs the previous session of the same day (prior = newest first)
function compareToLast(w, prior) {
  const prev = prior.find(p => p.dayId === w.dayId);
  if (!prev) return null;
  const pv = workoutVolume(prev);
  const v = workoutVolume(w);
  let beat = 0, compared = 0;
  for (const ex of w.exercises || []) {
    const pex = (prev.exercises || []).find(e => e.name === ex.name);
    if (!pex) continue;
    const cur = ex.sets.filter(s => s.done && !s.warmup);
    const old = pex.sets.filter(s => s.done && !s.warmup);
    cur.forEach((s, i) => {
      const p = old[i];
      if (!p) return;
      compared++;
      const sw = Number(s.weight) || 0, pw = Number(p.weight) || 0;
      const sr = Number(s.reps) || 0, pr = Number(p.reps) || 0;
      if (sw > pw || (sw === pw && sr > pr)) beat++;
    });
  }
  const sets = workoutSets(w), prevSets = workoutSets(prev);
  const comparable = prevSets > 0 && sets >= prevSets * 0.8;
  return { volPct: pv && comparable ? ((v - pv) / pv) * 100 : null, beat, compared, date: prev.startedAt };
}

// The number to beat on a day's first lift, for the Home card
function beatTarget(history, day) {
  for (const e of day.exercises.slice(0, 2)) {
    const last = findLastSessionSets(history, e.name);
    const work = last ? last.filter(s => !s.warmup) : null;
    if (!work || !work.length) continue;
    const bw = !!e.bw;
    const top = work.reduce((b, s) => ((Number(s.weight) || 0) > (Number(b.weight) || 0) || ((Number(s.weight) || 0) === (Number(b.weight) || 0) && Number(s.reps) > Number(b.reps))) ? s : b, work[0]);
    const short = e.name.replace(/^Barbell /, "").replace(/^Technogym /, "");
    return `${short} ${fmtSetShort(top.weight, bw)} × ${top.reps}`;
  }
  return null;
}

// One-line headline for a session: its first lift's best working set
function shortLiftName(name) {
  return name.replace(/^(Barbell|Technogym|Dumbbell) /, "").replace(/ \((Dumbbell|Single Arm|Seated)\)$/, "");
}
function sessionHeadline(w) {
  for (const ex of w.exercises || []) {
    const work = ex.sets.filter(s => s.done && !s.warmup && s.reps !== "");
    if (!work.length) continue;
    const bw = exIsBW(ex);
    const top = work.reduce((b, s) => {
      const sw = Number(s.weight) || 0, bwt = Number(b.weight) || 0;
      return sw > bwt || (sw === bwt && Number(s.reps) > Number(b.reps)) ? s : b;
    }, work[0]);
    return `${shortLiftName(ex.name)} ${fmtSetShort(top.weight, bw)} × ${top.reps}`;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// GAINS — the math behind the Progress tab
// ═══════════════════════════════════════════════════════════════════════════
const avg = arr => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0);

// Rolling average of the last k points (smooths out one-off good/bad days)
function smoothSeries(values, k = 3) {
  return values.map((_, i) => avg(values.slice(Math.max(0, i - k + 1), i + 1)));
}

// Lifts with an estimated-1RM history, in routine order (first lift of each day first)
function trackedLifts(history, minSessions = 2) {
  const order = [];
  const seen = new Set();
  const push = n => { if (!seen.has(n)) { seen.add(n); order.push(n); } };
  // Main lifts = the first two of each day (your compounds), then everything else
  DAYS.forEach(d => d.exercises[0] && push(d.exercises[0].name));
  DAYS.forEach(d => d.exercises[1] && push(d.exercises[1].name));
  DAYS.forEach(d => d.exercises.forEach(e => push(e.name)));
  const out = [];
  for (const name of order) {
    const series = exerciseTimeSeries(history, name).filter(s => s.e1rm);
    if (series.length >= minSessions) {
      const day = DAYS.find(d => d.exercises.some(e => e.name === name));
      out.push({ name, series, day });
    }
  }
  return out;
}

// Progressing / holding / stalled, from the smoothed e1RM series
function liftStatus(series) {
  const v = series.map(s => s.e1rm);
  if (v.length < 3) return { key: "new", label: `${v.length} session${v.length === 1 ? "" : "s"} so far` };
  const sm = smoothSeries(v);
  const bestBefore = v.length >= 5 ? Math.max(...v.slice(0, -3)) : Infinity;
  const recentBest = Math.max(...v.slice(-3));
  if (v.length >= 5 && recentBest <= bestBefore) return { key: "stalled", label: "Stalled" };
  const prev = sm[Math.max(0, sm.length - 4)];
  if (sm[sm.length - 1] > prev * 1.01) return { key: "up", label: "Progressing" };
  return { key: "flat", label: "Holding" };
}

// % change: average of first 3 sessions vs average of last 3
function liftChange(series) {
  const v = series.map(s => s.e1rm);
  if (v.length < 2) return 0;
  const k = Math.min(3, Math.floor(v.length / 2) || 1);
  const a = avg(v.slice(0, k)), b = avg(v.slice(-k));
  return a ? ((b - a) / a) * 100 : 0;
}

// Which slice of history the Progress tab measures: the last 12 weeks when
// there's enough there, otherwise everything since you started (so older
// logs never leave the screen blank).
function progressWindow(history, weeks = 12) {
  const start12 = addDays(mondayOf(Date.now()), -7 * (weeks - 1));
  const recent = history.filter(w => w.startedAt >= start12.getTime());
  if (trackedLifts(recent, 2).length) {
    return { list: recent, start: start12, label: `last ${weeks} weeks` };
  }
  if (!history.length) return { list: [], start: start12, label: "" };
  const first = Math.min(...history.map(w => w.startedAt));
  return { list: history, start: mondayOf(first), label: `since ${fmtDate(first)}` };
}

// Strength Index: average e1RM gain across your main lifts, 100 = where you started
function strengthIndex(history, weeks = 12) {
  const win = progressWindow(history, weeks);
  let lifts = trackedLifts(win.list, 2);
  if (lifts.length < 1) return null;
  lifts = lifts.slice(0, 6);
  // Baseline and current: the first and last k sessions of each lift (k = up to 3)
  const k = l => Math.min(3, Math.floor(l.series.length / 2) || 1);
  const base = l => avg(l.series.slice(0, k(l)).map(s => s.e1rm));
  const change = 100 * avg(lifts.map(l => avg(l.series.slice(-k(l)).map(s => s.e1rm)) / base(l))) - 100;
  // The line stops at your last session; a gap isn't drawn as a plateau
  const lastAt = Math.max(...lifts.map(l => l.series[l.series.length - 1].date));
  const nWeeks = Math.min(52, Math.max(1, Math.ceil((lastAt + 1 - win.start.getTime()) / (7 * 86400000))));
  const points = [];
  for (let i = 0; i < nWeeks; i++) {
    const end = addDays(win.start, 7 * (i + 1)).getTime();
    const ratios = [];
    for (const l of lifts) {
      const upTo = l.series.filter(s => s.date < end).map(s => s.e1rm);
      if (!upTo.length) continue;
      ratios.push(avg(upTo.slice(-k(l))) / base(l));
    }
    if (ratios.length) points.push({ t: addDays(win.start, 7 * i).getTime(), v: 100 * avg(ratios) });
  }
  // Collapse runs of identical weeks so long gaps don't draw as flat plateaus
  const compact = points.filter((p, i) => i === 0 || i === points.length - 1 || Math.abs(p.v - points[i - 1].v) > 1e-9);
  return { points: compact, change, lifts, label: win.label, short: compact.length < 2, lastAt };
}

// Share of working sets that beat the same set from the previous session of that lift
function beatRateByWeek(history, weeks = 8) {
  const asc = [...history].sort((x, y) => x.startedAt - y.startedAt);
  const last = new Map();
  const byWeek = new Map();
  for (const w of asc) {
    const wk = mondayOf(w.startedAt).getTime();
    for (const ex of w.exercises || []) {
      const cur = ex.sets.filter(s => s.done && !s.warmup);
      const prev = last.get(ex.name);
      if (prev && cur.length) {
        const agg = byWeek.get(wk) || { beat: 0, n: 0 };
        cur.forEach((s, i) => {
          const p = prev[i];
          if (!p) return;
          agg.n++;
          const sw = Number(s.weight) || 0, pw = Number(p.weight) || 0;
          if (sw > pw || (sw === pw && Number(s.reps) > Number(p.reps))) agg.beat++;
        });
        byWeek.set(wk, agg);
      }
      if (cur.length) last.set(ex.name, cur);
    }
  }
  const mon = mondayOf(Date.now());
  return Array.from({ length: weeks }, (_, i) => {
    const t = addDays(mon, -7 * (weeks - 1 - i)).getTime();
    const g = byWeek.get(t) || { beat: 0, n: 0 };
    return { t, beat: g.beat, n: g.n, pct: g.n ? (g.beat / g.n) * 100 : null };
  });
}

// Goals: a working weight at the bottom of the rep range, projected from the e1RM trend
function goalFor(name) { return (SETTINGS.goals || {})[name] || null; }
function setGoal(name, weight) {
  const goals = { ...(SETTINGS.goals || {}) };
  if (weight) goals[name] = Number(weight); else delete goals[name];
  saveSettings({ goals });
}
function goalProgress(name, series, repsText, bw) {
  const goal = goalFor(name);
  if (!goal || !series.length) return null;
  const t = parseRepTarget(repsText || "8–12");
  const reps = t ? t.min : 8;
  const load = bw ? (CURRENT_BW ? CURRENT_BW + goal : 0) : goal;
  if (!load) return { goal, reps, status: "needs-bw" };
  const targetE = e1rm(load, reps);
  const pts = series.slice(-8).filter(s => s.e1rm);
  const cur = pts.length ? avg(pts.slice(-3).map(s => s.e1rm)) : 0;
  if (cur >= targetE) return { goal, reps, status: "reached" };
  const toGo = bw ? goal - Math.max(0, Math.round((cur / (1 + reps / 30)) - CURRENT_BW)) : Math.round(goal - cur / (1 + reps / 30));
  if (pts.length < 3) return { goal, reps, status: "early", toGo };
  // least-squares slope of e1RM per day
  const xs = pts.map(p => p.date / 86400000), ys = pts.map(p => p.e1rm);
  const mx = avg(xs), my = avg(ys);
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  const slope = den ? num / den : 0;
  if (slope <= 0.02) return { goal, reps, status: "flat", toGo };
  const days = (targetE - cur) / slope;
  if (days > 540) return { goal, reps, status: "far", toGo };
  return { goal, reps, status: "pace", toGo, date: Date.now() + days * 86400000 };
}
function goalLine(g) {
  if (!g) return null;
  const tgt = `${g.goal} × ${g.reps}`;
  if (g.status === "reached") return `Goal ${tgt} reached`;
  if (g.status === "pace") return `Goal ${tgt}: on pace for ${fmtDate(g.date)}`;
  if (g.status === "needs-bw") return `Goal ${tgt}: add bodyweight in Setup`;
  if (g.status === "flat") return `Goal ${tgt}: ${Math.max(1, g.toGo)} lb to go, trend flat`;
  return `Goal ${tgt}: ${Math.max(1, g.toGo || 0)} lb to go`;
}

// Milestones: next round number on each main lift, plus sessions and lifetime volume
function nextMilestone(history) {
  const cands = [];
  for (const l of trackedLifts(history, 2).slice(0, 6)) {
    const ex = DAYS.flatMap(d => d.exercises).find(e => e.name === l.name) || {};
    if (ex.bw) continue;
    const best = Math.max(...l.series.map(s => s.top));
    const step = isLowerBody(l.name) ? 50 : 25;
    const next = Math.floor(best / step) * step + step;
    cands.push({ ratio: best / next, text: `${shortLiftName(l.name)}: ${next - best} lb from a ${next} top set`, name: l.name });
  }
  const n = history.length;
  const nextN = [10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500].find(x => x > n);
  if (nextN) cands.push({ ratio: n / nextN, text: `${nextN - n} session${nextN - n === 1 ? "" : "s"} to your ${nextN}th workout` });
  const vol = history.reduce((s, w) => s + workoutVolume(w), 0);
  const nextV = [100e3, 250e3, 500e3, 750e3, 1e6, 1.5e6, 2e6, 3e6, 5e6].find(x => x > vol);
  if (nextV) cands.push({ ratio: vol / nextV, text: `${fmtNum(nextV - vol)} lb to ${fmtNum(nextV)} lifted all-time` });
  const close = cands.filter(x => x.ratio >= 0.93).sort((x, y) => y.ratio - x.ratio);
  return close[0] || null;
}

// Days since each muscle was last trained as a main mover
function recoveryMap(history) {
  const out = {};
  const now = Date.now();
  for (const m of MUSCLES) out[m] = null;
  for (const w of history) {
    for (const ex of w.exercises || []) {
      if (!ex.sets.some(s => s.done && !s.warmup)) continue;
      const wts = muscleWeights(ex.name);
      for (const m in wts) {
        if (wts[m] < 1 || !(m in out)) continue;
        const d = Math.floor((mondayOfDay(now) - mondayOfDay(w.startedAt)) / 86400000);
        if (out[m] === null || d < out[m]) out[m] = d;
      }
    }
  }
  return out;
}

// Last week's recap for the Monday card
function weekRecap(history, weekStart) {
  const end = addDays(weekStart, 7).getTime();
  const ws = history.filter(w => w.startedAt >= weekStart.getTime() && w.startedAt < end);
  if (!ws.length) return null;
  const prior = history.filter(w => w.startedAt < weekStart.getTime());
  let prs = 0;
  const asc = [...ws].sort((x, y) => x.startedAt - y.startedAt);
  const seen = [...prior];
  for (const w of asc) { prs += detectSessionPRs(w, seen).length; seen.unshift(w); }
  const br = beatRateByWeek(history, 8).find(b => b.t === weekStart.getTime());
  const idx = strengthIndex(history, 12);
  let idxDelta = null;
  if (idx && idx.points.length >= 2) {
    const i = idx.points.findIndex(p => p.t === weekStart.getTime());
    if (i > 0) idxDelta = idx.points[i].v - idx.points[i - 1].v;
  }
  return { sessions: ws.length, prs, beatPct: br && br.pct !== null ? br.pct : null, idxDelta, volume: ws.reduce((s, w) => s + workoutVolume(w), 0) };
}

// Keep numeric text clean: comma decimals (some keyboards) become dots, one dot max
function cleanNum(v, decimals = true) {
  let s = String(v ?? "").replace(/,/g, ".").replace(decimals ? /[^0-9.]/g : /[^0-9]/g, "");
  if (decimals) {
    const i = s.indexOf(".");
    if (i >= 0) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, "");
  }
  return s.slice(0, 7);
}
// "+11%", "+5.7%", "0%"
function fmtPct(x) {
  if (!isFinite(x) || Math.abs(x) < 0.05) return "0%";
  return `${x > 0 ? "+" : ""}${x.toFixed(Math.abs(x) < 10 ? 1 : 0)}%`;
}

// ═══════════════════════════════════════════════════════════════════════════
// TODAY — what's at stake in the next session
// ═══════════════════════════════════════════════════════════════════════════
// Each lift's headline target for next time, flagged if hitting it would be a record
function todayTargets(history, day) {
  const cb = comebackInfo(history);
  const rows = [];
  for (const e of day.exercises) {
    const bw = !!e.bw;
    const rec = recommendNextSet(history, e.name, e.reps, bw);
    if (!rec) continue;
    const t = { weight: rec.weight, reps: rec.reps };
    rows.push({ name: e.name, bw, ...t, kind: cb ? null : prKind(priorStats(history, e.name), t, bw, CURRENT_BW) });
  }
  const prs = rows.filter(r => r.kind);
  const order = new Map(day.exercises.map((e, i) => [e.name, i]));
  const shown = [...prs, ...rows.filter(r => !r.kind)].slice(0, 3).sort((x, y) => order.get(x.name) - order.get(y.name));
  return { rows: shown, prCount: prs.length, comeback: cb };
}

// Only when this week could break a streak of 2+ weeks
function streakAtRisk(history, target) {
  const mon = mondayOf(Date.now());
  const done = sessionsBetween(history, mon, addDays(mon, 7));
  if (done >= target) return null;
  const past = weekStreak(history, target);
  if (past < 2) return null;
  const daysLeft = 7 - ((new Date().getDay() + 6) % 7); // including today
  const need = target - done;
  if (daysLeft > need + 1 || need > daysLeft) return null; // only when it's close and still savable
  return { need, streak: past, daysLeft };
}

// The day's main muscles trained within 48h, if any (null = rested)
function readinessFor(history, day) {
  const rec = recoveryMap(history);
  const muscles = new Set();
  day.exercises.forEach(e => { const w = muscleWeights(e.name); for (const m in w) if (w[m] >= 1) muscles.add(m); });
  let worst = null;
  for (const m of muscles) {
    const d = rec[m];
    if (d !== null && d < 2 && (!worst || d < worst.d)) worst = { m, d };
  }
  return worst;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════
// Bottom sheet for choices and confirmations. The first normal action is the
// primary (filled); destructive actions are tinted red; Cancel is a quiet link.
function ActionSheet({ title, message, actions, onDismiss }) {
  const main = actions.filter(x => x.variant !== "cancel");
  const cancel = actions.find(x => x.variant === "cancel");
  const primaryIdx = main.findIndex(x => x.variant !== "danger");
  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onDismiss(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <div
      className="fade-in"
      onClick={onDismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(10,10,10,0.38)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0 10px calc(env(safe-area-inset-bottom) + 10px)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || "Options"}
        className="sheet-up"
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 460,
          background: c.surface, borderRadius: 30,
          padding: "10px 16px 12px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", paddingBottom: 12 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: c.line }} />
        </div>
        {(title || message) ? (
          <div style={{ padding: "2px 6px 18px" }}>
            {title ? <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>{title}</div> : null}
            {message ? <div style={{ fontSize: 15, color: c.ink3, marginTop: 6, lineHeight: 1.45 }}>{message}</div> : null}
          </div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {main.map((x, i) => {
            const primary = i === primaryIdx;
            const danger = x.variant === "danger";
            const Icon = x.icon;
            return (
              <button
                key={i}
                onClick={x.fn}
                className="tap"
                style={{
                  width: "100%", height: 56, borderRadius: 18, padding: "0 18px",
                  display: "flex", alignItems: "center", justifyContent: Icon ? "flex-start" : "center", gap: 12,
                  fontSize: 16, fontWeight: 750,
                  background: primary ? c.ink : danger ? a(c.danger, 11) : c.inset,
                  color: primary ? c.bg : danger ? c.danger : c.ink,
                }}
              >
                {Icon ? <Icon size={19} strokeWidth={2.3} /> : null}
                {x.label}
              </button>
            );
          })}
        </div>
        {cancel ? (
          <button
            onClick={cancel.fn}
            className="tap"
            style={{ width: "100%", height: 50, marginTop: 4, fontSize: 16, fontWeight: 650, color: c.ink3 }}
          >{cancel.label}</button>
        ) : null}
      </div>
    </div>
  );
}

function BottomSheet({ title, onClose, children }) {
  return (
    <div
      className="fade-in"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end" }}
    >
      <div
        className="sheet-up"
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, margin: "0 auto",
          maxHeight: "86vh", display: "flex", flexDirection: "column",
          background: c.bg, borderRadius: "22px 22px 0 0",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 2px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: c.line }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 12px" }}>
          <h2 className="h-sec">{title}</h2>
          <IconButton label="Close" onClick={onClose}><X size={20} /></IconButton>
        </div>
        <div style={{ overflowY: "auto", padding: "0 20px 20px" }}>{children}</div>
      </div>
    </div>
  );
}

function IconButton({ label, onClick, children, style }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="tap"
      style={{
        width: 44, height: 44, borderRadius: 12,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: c.ink, ...style,
      }}
    >{children}</button>
  );
}

function Section({ title, aside, children, style }) {
  return (
    <section style={{ padding: "0 20px", marginBottom: 28, ...style }}>
      {title ? (
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12, gap: 12 }}>
          <h2 className="h-sec">{title}</h2>
          {aside ? <span style={{ fontSize: 13, color: c.ink3 }}>{aside}</span> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function Stat({ label, value, unit, big }) {
  return (
    <div>
      <div className="display num" style={{ fontSize: big ? 40 : 30 }}>
        {value}
        {unit ? <span style={{ fontSize: big ? 16 : 14, fontWeight: 600, color: c.ink3, marginLeft: 3, fontStretch: "100%" }}>{unit}</span> : null}
      </div>
      <div style={{ fontSize: 13, color: c.ink3, marginTop: 6 }}>{label}</div>
    </div>
  );
}

function Segmented({ options, value, onChange, style }) {
  return (
    <div style={{ display: "flex", background: c.inset, borderRadius: 12, padding: 3, ...style }}>
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className="tap"
          aria-pressed={value === o.value}
          style={{
            flex: 1, padding: "9px 0", borderRadius: 9,
            fontSize: 14, fontWeight: 650,
            background: value === o.value ? c.surface : "transparent",
            color: value === o.value ? c.ink : c.ink3,
            boxShadow: value === o.value ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
          }}
        >{o.label}</button>
      ))}
    </div>
  );
}

// Renders a load consistently: "BW", "BW + 25 lb", "185 lb"
function LoadText({ weight, bw, unitColor = c.ink3 }) {
  const n = Number(weight) || 0;
  const unit = <span style={{ fontSize: "0.72em", color: unitColor, marginLeft: 2, fontWeight: 600 }}>lb</span>;
  if (bw) return n > 0 ? <>BW + {n}{unit}</> : <>BW</>;
  return <>{weight === "" || weight === undefined ? "—" : weight}{unit}</>;
}

function EmptyState({ icon, title, sub }) {
  return (
    <div className="card" style={{ padding: "40px 24px", textAlign: "center" }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14, margin: "0 auto 14px",
        background: c.inset, color: c.ink2,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</div>
      <p style={{ margin: 0, fontWeight: 700, fontSize: 17 }}>{title}</p>
      {sub ? <p style={{ margin: "6px auto 0", fontSize: 14, color: c.ink3, lineHeight: 1.5, maxWidth: 280 }}>{sub}</p> : null}
    </div>
  );
}

// Weight-plate motif for the hero: rim, face and collar hole, drawn in currentColor
function PlateRings({ size = 240, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" aria-hidden="true" style={{ position: "absolute", pointerEvents: "none", ...style }}>
      <circle cx="120" cy="120" r="116" fill="none" stroke="currentColor" strokeOpacity="0.16" strokeWidth="8" />
      <circle cx="120" cy="120" r="92" fill="none" stroke="currentColor" strokeOpacity="0.10" strokeWidth="2" />
      <circle cx="120" cy="120" r="70" fill="none" stroke="currentColor" strokeOpacity="0.10" strokeWidth="2" />
      <circle cx="120" cy="120" r="26" fill="currentColor" fillOpacity="0.12" />
      <circle cx="120" cy="120" r="12" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
    </svg>
  );
}

// Small round plate swatch: rim, face, collar hole
function MiniPlate({ color, on, size = 44 }) {
  return (
    <div aria-hidden="true" style={{
      width: size, height: size, borderRadius: 99, flexShrink: 0, background: color,
      boxShadow: `inset 0 0 0 ${Math.round(size * 0.09)}px ${a(on, 16)}`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ width: size * 0.28, height: size * 0.28, borderRadius: 99, background: a(on, 30), boxShadow: `0 0 0 ${Math.round(size * 0.07)}px ${a(on, 10)}` }} />
    </div>
  );
}

function CopyForClaudeButton({ getText, style, label = "Copy for Claude" }) {
  const [state, setState] = useState("idle"); // idle | copied | failed
  async function handle() {
    const ok = await copyText(getText());
    setState(ok ? "copied" : "failed");
    setTimeout(() => setState("idle"), 2000);
  }
  return (
    <button
      onClick={handle}
      className="tap"
      style={{
        height: 50, borderRadius: 14,
        background: c.inset,
        color: state === "copied" ? c.good : state === "failed" ? c.danger : c.ink,
        fontSize: 15, fontWeight: 650,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        ...style,
      }}
    >
      {state === "copied" ? <Check size={17} strokeWidth={2.6} /> : <Copy size={16} strokeWidth={2.2} />}
      {state === "copied" ? "Copied" : state === "failed" ? "Couldn't copy" : label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════
function resolveTheme(pref) {
  if (pref === "light" || pref === "dark") return pref;
  try {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [tab, setTab] = useState("home");
  const [active, setActive] = useState(null);
  const [history, setHistory] = useState([]);
  const [detailWorkout, setDetailWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(null);
  const [summary, setSummary] = useState(null);
  const [bodyweight, setBodyweight] = useState(CURRENT_BW);
  const [target, setTarget] = useState(3);
  const [rest, setRest] = useState(null); // { endsAt, total, name } — survives leaving the workout screen
  const [notes, setNotes] = useState({});
  const [themePref, setThemePref] = useState("system");
  const [theme, setTheme] = useState(() => resolveTheme("system"));
  const [routineVersion, setRoutineVersion] = useState(0); // bumps when the program changes
  const [routineDay, setRoutineDay] = useState(null);
  const [routineReset, setRoutineReset] = useState(0);
  const [exerciseName, setExerciseName] = useState(null);
  const openExercise = name => { setExerciseName(name); openScreen("exercise"); };
  const [noEnter, setNoEnter] = useState(false);
  const underRef = useRef(null);
  const saveTimer = useRef(null);
  const scrollPos = useRef({});

  const isTab = screen === "home" || screen === "history" || screen === "progress";

  // Theme: follow the system unless overridden, and keep chart colors in sync
  useEffect(() => {
    const apply = () => setTheme(resolveTheme(themePref));
    apply();
    let mq;
    try { mq = window.matchMedia("(prefers-color-scheme: dark)"); } catch {}
    if (themePref === "system" && mq) {
      mq.addEventListener ? mq.addEventListener("change", apply) : mq.addListener(apply);
      return () => { mq.removeEventListener ? mq.removeEventListener("change", apply) : mq.removeListener(apply); };
    }
  }, [themePref]);
  CHART_HEX = CHART_PALETTES[theme];
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "theme-color"; document.head.appendChild(meta); }
    meta.content = theme === "dark" ? "#0E1012" : "#ECEAE6";
  }, [theme]);

  function updateThemePref(p) {
    setThemePref(p);
    saveSettings({ theme: p });
  }
  function updateNote(name, text) {
    setNotes(saveNote(name, text));
  }
  function updateBodyweight(v) {
    setBodyweight(saveBodyweight(v));
  }
  function updateTarget(v) {
    const n = Math.max(1, Math.min(7, v));
    setTarget(n);
    saveSettings({ target: n });
  }
  function startRest(seconds, name) {
    if (!seconds) return;
    setRest({ endsAt: Date.now() + seconds * 1000, total: seconds, name });
  }
  function adjustRest(delta) {
    setRest(r => r ? { ...r, endsAt: r.endsAt + delta * 1000, total: Math.max(1, r.total + delta) } : r);
  }

  useEffect(() => {
    let mounted = true;
    loadStore()
      .then(({ workouts, active: act }) => {
        if (!mounted) return;
        setHistory(workouts);
        setActive(act);
        setBodyweight(CURRENT_BW);
        setTarget(Number(SETTINGS.target) || 3);
        setThemePref(SETTINGS.theme || "system");
        setNotes(SETTINGS.notes || {});
        setRoutineVersion(v => v + 1);
        // A session left open for hours (forgot to tap Finish): offer to wrap it up
        if (act && Date.now() - act.startedAt > 6 * 3600000) {
          const logged = act.exercises.reduce((n, e) => n + e.sets.filter(x => x.done).length, 0);
          const lastAt = Math.max(0, ...act.exercises.flatMap(e => e.sets.map(x => x.at || 0)));
          const endAt = lastAt > act.startedAt ? lastAt + 60000 : act.startedAt + 60 * 60000;
          const label = (findDay(act.dayId) || {}).label || "";
          setSheet({
            title: `Your ${label} workout is still open`,
            message: logged
              ? `Started ${ago(act.startedAt)}, with ${logged} set${logged === 1 ? "" : "s"} logged. Save them to history?`
              : `Started ${ago(act.startedAt)} with nothing logged.`,
            actions: [
              ...(logged ? [{ label: `Save ${logged} logged set${logged === 1 ? "" : "s"}`, icon: Check, fn: () => { setSheet(null); completeWorkout(act, endAt, workouts); } }] : []),
              { label: "Discard it", icon: Trash2, variant: "danger", fn: () => { setSheet(null); setActive(null); clearActiveStorage(); } },
              { label: "Keep it open", variant: "cancel", fn: () => setSheet(null) },
            ],
          });
        }
      })
      .catch(err => { console.error("Load failed:", err); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // Emergency save on page unload
  useEffect(() => {
    function handler() {
      if (active) {
        if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
        persistActive(active);
      }
    }
    window.addEventListener("beforeunload", handler);
    window.addEventListener("pagehide", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      window.removeEventListener("pagehide", handler);
    };
  }, [active]);

  // Each tab remembers its scroll position; tapping the tab you're on scrolls to top
  const restoreScroll = y => requestAnimationFrame(() => window.scrollTo(0, y || 0));
  const saveTabScroll = () => { if (screen === tab) scrollPos.current[tab] = window.scrollY; };
  const goTab = t => {
    if (t === screen) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    saveTabScroll();
    setTab(t);
    setScreen(t);
    restoreScroll(scrollPos.current[t]);
  };
  const goBack = () => { setScreen(tab); restoreScroll(scrollPos.current[tab]); };
  // Leave a tab for a deeper screen, remembering where you were
  const openScreen = to => { saveTabScroll(); setScreen(to); window.scrollTo(0, 0); };
  const showSheet = cfg => setSheet(cfg);
  const closeSheet = () => setSheet(null);

  function saveActiveWithDebounce(w, immediate) {
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    if (immediate) {
      persistActive(w);
    } else {
      saveTimer.current = setTimeout(() => { persistActive(w); saveTimer.current = null; }, 800);
    }
  }

  async function startWorkout(dayId) {
    const createAndStart = async () => {
      const day = findDay(dayId);
      const w = {
        id: String(Date.now()),
        dayId,
        startedAt: Date.now(),
        completedAt: null,
        exercises: day.exercises.map(ex => ({
          name: ex.name,
          bw: !!ex.bw,
          targetSets: ex.sets,
          targetReps: ex.reps,
          rest: ex.rest,
          // Prefilled from last session, never pre-marked done
          sets: buildSets(history, ex.name, ex.sets, !!ex.bw),
        })),
      };
      setRest(null);
      setActive(w);
      openScreen("workout");
      await clearActiveStorage();
      await persistActive(w);
    };

    if (active) {
      showSheet({
        title: "Workout in progress",
        message: `Your ${(findDay(active.dayId) || {}).label || ""} session is still open. Starting a new one deletes it.`,
        actions: [
          { label: "Resume workout", icon: ArrowRight, fn: () => { closeSheet(); openScreen("workout"); } },
          { label: "Discard it and start new", icon: Trash2, variant: "danger", fn: () => { closeSheet(); createAndStart(); } },
          { label: "Cancel", variant: "cancel", fn: closeSheet },
        ],
      });
    } else {
      createAndStart();
    }
  }

  function updateActive(next, isStructural) {
    setActive(next);
    saveActiveWithDebounce(next, isStructural);
  }

  // Save a workout's logged sets to history and show the summary
  function completeWorkout(w, endAt, hist) {
    const completed = {
      ...w,
      completedAt: endAt,
      bodyweight: bodyweight || CURRENT_BW || null,
      exercises: w.exercises
        .map(ex => ({ ...ex, sets: ex.sets.filter(s => s.done) }))
        .filter(ex => ex.sets.length > 0),
    };
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    const newList = [completed, ...hist.filter(x => x.id !== completed.id)].sort((x, y) => y.startedAt - x.startedAt);
    saveWorkouts(newList);
    clearActiveStorage();
    const newPRs = detectSessionPRs(completed, hist);
    setRest(null);
    setActive(null);
    setHistory(newList);
    setSummary({ workout: completed, newPRs });
  }

  async function finishWorkout() {
    if (!active) return;
    const hasDone = active.exercises.some(ex => ex.sets.some(s => s.done));

    const doFinish = async () => completeWorkout(active, Date.now(), history);

    if (!hasDone) {
      showSheet({
        title: "No sets logged",
        message: "Nothing has been logged yet. Finish anyway?",
        actions: [
          { label: "Finish anyway", variant: "danger", fn: () => { closeSheet(); doFinish(); } },
          { label: "Keep training", variant: "cancel", fn: closeSheet },
        ],
      });
    } else {
      const open = active.exercises.reduce((s, ex) => s + ex.sets.filter(x => !x.done).length, 0);
      if (open > 0) {
        showSheet({
          title: "Finish workout?",
          message: `${open} set${open === 1 ? "" : "s"} not logged. Only logged sets are saved.`,
          actions: [
            { label: "Finish workout", fn: () => { closeSheet(); doFinish(); } },
            { label: "Keep training", variant: "cancel", fn: closeSheet },
          ],
        });
      } else {
        doFinish();
      }
    }
  }

  function discardWorkout() {
    showSheet({
      title: "Discard workout?",
      message: "Everything logged in this session will be deleted.",
      actions: [
        { label: "Discard workout", variant: "danger", fn: async () => {
          closeSheet();
          if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
          setRest(null);
          setActive(null);
          goBack();
          await clearActiveStorage();
        }},
        { label: "Keep training", variant: "cancel", fn: closeSheet },
      ],
    });
  }

  function deleteWorkoutAction(id) {
    showSheet({
      title: "Delete workout?",
      message: "It will be removed from your history for good.",
      actions: [
        { label: "Delete workout", variant: "danger", fn: async () => {
          closeSheet();
          const newList = history.filter(w => w.id !== id);
          setHistory(newList);
          goBack();
          saveWorkouts(newList);
        }},
        { label: "Cancel", variant: "cancel", fn: closeSheet },
      ],
    });
  }

  function deleteExerciseFromActive(exIdx) {
    if (!active) return;
    const exName = active.exercises[exIdx] ? active.exercises[exIdx].name : "";
    showSheet({
      title: `Remove ${exName || "exercise"}?`,
      message: "It's removed from this session only. Your routine stays the same.",
      actions: [
        { label: "Remove from session", variant: "danger", fn: () => {
          closeSheet();
          updateActive({ ...active, exercises: active.exercises.filter((_, i) => i !== exIdx) }, true);
        }},
        { label: "Cancel", variant: "cancel", fn: closeSheet },
      ],
    });
  }

  function handleRestore(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      let parsed;
      try { parsed = JSON.parse(ev.target.result); }
      catch {
        showSheet({
          title: "Not a backup file",
          message: "Choose a .json file that was saved from this app's Backup button.",
          actions: [{ label: "OK", variant: "cancel", fn: closeSheet }],
        });
        return;
      }
      if (!validateBackup(parsed)) {
        showSheet({
          title: "Backup can't be read",
          message: "The file doesn't have the expected structure. Nothing was changed.",
          actions: [{ label: "OK", variant: "cancel", fn: closeSheet }],
        });
        return;
      }
      const count = parsed.workouts.length;
      const existingCount = history.length;
      showSheet({
        title: "Restore from backup?",
        message: `Your ${existingCount} current workout${existingCount === 1 ? "" : "s"} will be replaced by the ${count} in this backup.`,
        actions: [
          { label: `Replace with ${count} workouts`, variant: "danger", fn: async () => {
            closeSheet();
            const list = applyBackup(parsed);
            if (list === null) {
              showSheet({
                title: "Restore failed",
                message: "Storage couldn't be written. Your data is unchanged.",
                actions: [{ label: "OK", variant: "cancel", fn: closeSheet }],
              });
              return;
            }
            setHistory(list);
            setBodyweight(CURRENT_BW);
            setTarget(Number(SETTINGS.target) || 3);
            setNotes(SETTINGS.notes || {});
            setThemePref(SETTINGS.theme || "system");
            setRoutineVersion(v => v + 1);
          }},
          { label: "Cancel", variant: "cancel", fn: closeSheet },
        ],
      });
    };
    reader.onerror = () => {
      showSheet({
        title: "Couldn't open file",
        message: "Try choosing the file again.",
        actions: [{ label: "OK", variant: "cancel", fn: closeSheet }],
      });
    };
    reader.readAsText(file);
  }

  // Fix a finished workout from History
  function editWorkout(updated) {
    const newList = history.map(w => (w.id === updated.id ? updated : w));
    setHistory(newList);
    setDetailWorkout(updated);
    saveWorkouts(newList);
  }

  // Routine editor: save a day's exercise list
  function updateRoutine(dayId, exercises) {
    saveSettings({ routine: { ...(SETTINGS.routine || {}), [dayId]: exercises } });
    setRoutineVersion(v => v + 1);
  }
  function resetRoutine(dayId) {
    const r = { ...(SETTINGS.routine || {}) };
    delete r[dayId];
    saveSettings({ routine: Object.keys(r).length ? r : null });
    setRoutineVersion(v => v + 1);
    setRoutineReset(n => n + 1);
  }
  // Renaming keeps history, notes and preferences attached to the new name
  function renameExercise(oldName, newName) {
    if (!oldName || !newName || oldName === newName) return;
    const aliases = { ...(SETTINGS.aliases || {}) };
    for (const k in aliases) if (aliases[k] === oldName) aliases[k] = newName;
    aliases[oldName] = newName;
    delete aliases[newName];
    const moveKey = obj => {
      const o = { ...(obj || {}) };
      if (oldName in o && !(newName in o)) o[newName] = o[oldName];
      delete o[oldName];
      return o;
    };
    saveSettings({
      aliases,
      notes: moveKey(SETTINGS.notes),
      perSide: moveKey(SETTINGS.perSide),
      bars: moveKey(SETTINGS.bars),
    });
    setNotes(SETTINGS.notes || {});
    const newList = history.map(normalizeWorkout);
    setHistory(newList);
    saveWorkouts(newList);
    if (active) {
      const a2 = normalizeWorkout(active);
      setActive(a2);
      persistActive(a2);
    }
  }

  async function exportForClaude() {
    const text = buildFullExportText(history, { bodyweight, target });
    const date = new Date().toISOString().slice(0, 10);
    return shareOrDownload(text, `training-log-${date}.txt`);
  }
  function copyAllForClaude() {
    return copyText(buildFullExportText(history, { bodyweight, target }));
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GlobalCSS />
        <div className="live-dot" aria-label="Loading" style={{ width: 44, height: 44, borderRadius: 99, background: c.inset, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 12, height: 12, borderRadius: 99, background: c.ink4 }} />
        </div>
      </div>
    );
  }

  // The three tab screens, reused as the backdrop while swiping back
  const tabEl = t => {
    if (t === "home") return (
          <HomeScreen
            key={routineVersion}
            history={history}
            active={active}
            target={target}
            onTargetChange={updateTarget}
            onStart={startWorkout}
            onResume={() => openScreen("workout")}
            onOpenSetup={() => openScreen("setup")}
          />
    );
    if (t === "history") return (
          <HistoryScreen history={history} target={target} onOpen={w => { setDetailWorkout(w); openScreen("detail"); }} />
    );
    return <ProgressScreen history={history} onOpenExercise={openExercise} />;
  };

  const setupEl = (
    <SetupScreen
      onBack={goBack}
      history={history}
      bodyweight={bodyweight}
      onBodyweightChange={updateBodyweight}
      target={target}
      onTargetChange={updateTarget}
      themePref={themePref}
      onThemeChange={updateThemePref}
      onExportClaude={exportForClaude}
      onCopyClaude={copyAllForClaude}
      onExportExcel={() => exportToExcel(history)}
      onBackup={() => exportBackup(history)}
      onRestore={handleRestore}
      daysSince={daysSinceBackup()}
      onEditRoutine={dayId => { setRoutineDay(dayId); setScreen("routine"); window.scrollTo(0, 0); }}
    />
  );
  // Where "back" goes: the routine editor returns to Setup, everything else to its tab
  const backFromHere = () => {
    if (screen === "routine") { setScreen("setup"); window.scrollTo(0, 0); }
    else goBack();
  };

  return (
    <div className={noEnter ? "no-enter" : ""} style={{ minHeight: "100vh", background: c.bg, color: c.ink, overflowX: "clip" }}>
      <GlobalCSS />
      {isTab ? (
        <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", paddingBottom: 120 }}>
          {tabEl(screen)}
        </div>
      ) : (
        <SwipeBack
          key={screen}
          underRef={underRef}
          onBack={() => { setNoEnter(true); backFromHere(); setTimeout(() => setNoEnter(false), 450); }}
        >
          <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh" }}>
        {screen === "workout" && active ? (
            <WorkoutScreen
              workout={active}
              history={history}
              bodyweight={bodyweight}
              onBodyweightChange={updateBodyweight}
              notes={notes}
              onNoteChange={updateNote}
              rest={rest}
              onStartRest={startRest}
              onAdjustRest={adjustRest}
              onClearRest={() => setRest(null)}
              onUpdate={updateActive}
              onFinish={finishWorkout}
              onDiscard={discardWorkout}
              onDeleteExercise={deleteExerciseFromActive}
              onBack={goBack}
            />
          ) : null}
          {screen === "detail" && detailWorkout ? (
            <DetailScreen workout={detailWorkout} history={history} onBack={goBack} onDelete={deleteWorkoutAction} onEdit={editWorkout} />
          ) : null}
          {screen === "routine" && routineDay ? (
            <RoutineScreen
              key={`${routineDay}-${routineReset}`}
              day={findDay(routineDay)}
              isCustom={!!(SETTINGS.routine && SETTINGS.routine[routineDay])}
              onChange={list => updateRoutine(routineDay, list)}
              onRename={renameExercise}
              onReset={() => showSheet({
                title: `Reset ${findDay(routineDay).label} day?`,
                message: "Goes back to the original exercises. Your history is kept.",
                actions: [
                  { label: "Reset to original", variant: "danger", fn: () => { closeSheet(); resetRoutine(routineDay); } },
                  { label: "Cancel", variant: "cancel", fn: closeSheet },
                ],
              })}
              onBack={backFromHere}
            />
          ) : null}
          {screen === "setup" ? setupEl : null}
          {screen === "exercise" && exerciseName ? (
            <ExerciseScreen key={exerciseName} name={exerciseName} history={history} onBack={goBack} />
          ) : null}
          </div>
        </SwipeBack>
      )}

      {!isTab ? (
        // Pre-rendered, hidden screen to reveal while swiping back
        <div key={`under-${screen}`} ref={underRef} aria-hidden="true" className="no-enter" style={{
          position: "fixed", inset: 0, zIndex: 0, overflow: "hidden",
          background: c.bg, pointerEvents: "none", visibility: "hidden",
        }}>
          <div style={{
            maxWidth: 480, margin: "0 auto", minHeight: "100vh", paddingBottom: 120,
            transform: screen === "routine" ? "none" : `translateY(${-(scrollPos.current[tab] || 0)}px)`,
          }}>{screen === "routine" ? setupEl : tabEl(tab)}</div>
          {screen === "routine" ? null : <BottomNav tab={tab} onSwitch={() => {}} />}
          <div data-dim style={{ position: "absolute", inset: 0, background: "#000", opacity: 0 }} />
        </div>
      ) : null}

      {isTab ? <BottomNav tab={tab} onSwitch={goTab} /> : null}
      {sheet ? <ActionSheet {...sheet} onDismiss={closeSheet} /> : null}
      {summary ? (
        <SessionSummary
          workout={summary.workout}
          newPRs={summary.newPRs}
          history={history}
          onDismiss={() => { setSummary(null); setTab("home"); setScreen("home"); window.scrollTo(0, 0); }}
        />
      ) : null}
    </div>
  );
}

// iOS-style swipe back, built the way UIKit's interactive pop works:
// - 1:1 tracking from the left edge; the screen underneath parallaxes in from
//   30% and un-dims as you drag.
// - On release, Apple projects where the finger's momentum would carry the
//   page (UIScrollView deceleration, rate 0.998) and completes if that point
//   passes the midpoint, so a short fast flick still goes back.
// - The settle is a critically damped spring that starts at the finger's
//   release velocity, so there's no speed jump when you let go.
// - Interruptible: touch the page mid-animation and you catch it again.
// Page is lifted into a viewport-sized layer while dragging so it can move on
// the GPU; every frame is transform/opacity only.
let SWIPE_LIFTED = false; // true while the page is lifted for a swipe

function SwipeBack({ onBack, underRef, children }) {
  const ref = useRef(null);
  const cb = useRef({});
  cb.current = { onBack };
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const PARALLAX = 30;       // % the screen underneath starts shifted left
    const DIM = 0.16;          // backdrop dim at rest
    const EDGE = 28;           // px from the left edge that starts a swipe
    const RESPONSE = 0.36;     // spring response (s); UIKit-like critically damped
    const DECEL = 0.998;       // UIScrollView.DecelerationRate.normal
    const W = () => window.innerWidth;

    let drag = null;           // active touch
    let x = 0;                 // current page offset (px)
    let lifted = false;
    let savedY = 0;
    let anim = 0;              // rAF id for the settle spring
    let frame = 0;             // rAF id for drag painting

    const under = () => {
      const u = underRef.current;
      return u ? { u, dim: u.querySelector("[data-dim]") } : null;
    };
    function paint() {
      frame = 0;
      const p = Math.min(1, Math.max(0, x / W()));
      el.style.transform = `translate3d(${x}px, 0, 0)`;
      const b = under();
      if (b) {
        b.u.style.transform = `translate3d(${-PARALLAX * (1 - p)}%, 0, 0)`;
        if (b.dim) b.dim.style.opacity = String(DIM * (1 - p));
      }
    }
    function lift() {
      if (lifted) return;
      lifted = true;
      SWIPE_LIFTED = true;
      savedY = window.scrollY;
      Object.assign(el.style, {
        position: "fixed", top: "0", left: "0", right: "0", bottom: "0",
        overflow: "hidden", willChange: "transform",
      });
      el.scrollTop = savedY;
      el.style.setProperty("--lift-y", `${savedY}px`); // keep fixed bars in place
      const b = under();
      if (b) Object.assign(b.u.style, { visibility: "visible", willChange: "transform" });
      paint();
    }
    function drop() {
      if (!lifted) return;
      lifted = false;
      Object.assign(el.style, {
        position: "", top: "", left: "", right: "", bottom: "",
        overflow: "", willChange: "", transform: "",
      });
      el.style.removeProperty("--lift-y");
      window.scrollTo(0, savedY);
      SWIPE_LIFTED = false;
      const b = under();
      if (b) Object.assign(b.u.style, { visibility: "hidden", willChange: "", transform: "" });
    }
    // Where momentum would carry the page (Apple's projection formula)
    const project = vPxPerMs => vPxPerMs * (DECEL / (1 - DECEL));

    function settle(target, v0PxPerMs, done) {
      cancelAnimationFrame(anim);
      const omega = (2 * Math.PI) / RESPONSE;   // critically damped: zeta = 1
      let v = v0PxPerMs * 1000;                 // px/s
      let last = performance.now();
      const step = now => {
        let dt = Math.min(0.032, (now - last) / 1000);
        last = now;
        // semi-implicit Euler in small substeps for stability
        const n = 4;
        for (let i = 0; i < n; i++) {
          const h = dt / n;
          const a = -omega * omega * (x - target) - 2 * omega * v;
          v += a * h;
          x += v * h;
        }
        if (target > 0 && x > target) { x = target; v = 0; } // never overshoot past the edge
        if (x < 0) { x = 0; v = 0; }
        paint();
        if (Math.abs(x - target) < 0.5 && Math.abs(v) < 20) {
          x = target;
          paint();
          anim = 0;
          done();
        } else {
          anim = requestAnimationFrame(step);
        }
      };
      anim = requestAnimationFrame(step);
    }

    function start(e) {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      if (anim) {
        // Catch the page mid-animation
        cancelAnimationFrame(anim);
        anim = 0;
        drag = { x0: t.clientX - x, y0: t.clientY, lock: "x", lastX: t.clientX, lastT: performance.now(), v: 0 };
        return;
      }
      if (t.clientX > EDGE || document.querySelector(".sheet-up")) return;
      drag = { x0: t.clientX, y0: t.clientY, lock: null, lastX: t.clientX, lastT: performance.now(), v: 0 };
    }
    function move(e) {
      if (!drag) return;
      const t = e.touches[0];
      const dx = t.clientX - drag.x0;
      const dy = t.clientY - drag.y0;
      if (!drag.lock) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (dx > 0 && Math.abs(dx) > Math.abs(dy) * 1.2) { drag.lock = "x"; lift(); }
        else { drag = null; return; }
      }
      if (e.cancelable) e.preventDefault();
      const now = performance.now();
      const dt = Math.max(1, now - drag.lastT);
      drag.v = drag.v * 0.5 + ((t.clientX - drag.lastX) / dt) * 0.5; // smoothed px/ms
      drag.lastX = t.clientX;
      drag.lastT = now;
      x = Math.max(0, dx);
      if (!frame) frame = requestAnimationFrame(paint);
    }
    function end() {
      if (!drag) return;
      const d = drag;
      drag = null;
      if (d.lock !== "x") return;
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      const v = performance.now() - d.lastT > 80 ? 0 : d.v; // paused before lifting
      const w = W();
      const go = x + project(v) > w / 2;
      settle(go ? w : 0, v, () => {
        if (go) { SWIPE_LIFTED = false; cb.current.onBack(); }
        else drop();
      });
    }
    // Listen on the window so a moving page can be caught wherever you touch
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
    window.addEventListener("touchcancel", end);
    return () => {
      cancelAnimationFrame(anim);
      cancelAnimationFrame(frame);
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", end);
      SWIPE_LIFTED = false;
    };
  }, []);
  return (
    <div
      ref={ref}
      style={{
        position: "relative", zIndex: 1,
        background: c.bg, minHeight: "100vh",
        boxShadow: "-8px 0 24px rgba(0,0,0,0.12)",
        touchAction: "pan-y",
      }}
    >{children}</div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HOME
// ═══════════════════════════════════════════════════════════════════════════
// One card at a time on Today, picked by what matters most right now:
// Monday recap → done-for-today wrap-up → today's targets (with PRs on the
// table, and a streak nudge when the week is at risk) → first-run guide.
function ContextCard({ history, active, hero, target, onStart }) {
  const [dismissed, setDismissed] = useState(SETTINGS.recapSeen);
  const [tipOff, setTipOff] = useState(!!SETTINGS.tipDismissed);
  const lastMon = addDays(mondayOf(Date.now()), -7);
  const weekKey = `w${lastMon.getTime()}`;
  const recap = useMemo(() => weekRecap(history, lastMon), [history, weekKey]);
  const milestone = useMemo(() => nextMilestone(history), [history]);
  const targets = useMemo(() => todayTargets(history, hero), [history, hero.id]);
  const risk = streakAtRisk(history, target);
  const todays = history.filter(w => mondayOfDay(w.startedAt) === mondayOfDay(Date.now()));
  const dow = new Date().getDay();

  const shell = (children, { onClose, onPress } = {}) => {
    const body = (
      <>
        {onClose ? (
          <IconButton label="Dismiss" onClick={e => { e.stopPropagation(); onClose(); }} style={{ position: "absolute", top: 8, right: 8, color: c.ink3 }}><X size={18} /></IconButton>
        ) : null}
        {children}
      </>
    );
    const style = { padding: "18px 18px 16px", marginTop: 14, borderRadius: 26, position: "relative", width: "100%", textAlign: "left", display: "block" };
    return onPress
      ? <div role="button" tabIndex={0} onClick={onPress} onKeyDown={e => { if (e.key === "Enter") onPress(); }} className="card tap rise" style={{ ...style, cursor: "pointer" }}>{body}</div>
      : <div className="card rise" style={style}>{body}</div>;
  };
  const footer = (icon, text, color) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${c.lineSoft}`, fontSize: 14, fontWeight: 650, color }}>
      {icon}<span>{text}</span>
    </div>
  );

  if (active) return null;

  // 1) Monday/Tuesday: last week's recap
  if ((dow === 1 || dow === 2) && recap && dismissed !== weekKey && !todays.length) {
    const close = () => { saveSettings({ recapSeen: weekKey }); setDismissed(weekKey); };
    return shell(
      <>
        <div className="serif" style={{ fontSize: 18, color: c.ink2 }}>Last week</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
          {recap.idxDelta !== null ? (
            <Stat label="Strength" value={fmtPct(recap.idxDelta)} />
          ) : <Stat label="Sessions" value={recap.sessions} />}
          <Stat label="PRs" value={recap.prs} />
          <Stat label="Beat last time" value={recap.beatPct !== null ? `${Math.round(recap.beatPct)}%` : "—"} />
        </div>
      </>,
      { onClose: close }
    );
  }

  // 2) Trained today: a short wrap-up, plus what's next to chase
  if (todays.length) {
    const w = todays[0];
    const prior = history.filter(x => x.startedAt < w.startedAt);
    const prs = detectSessionPRs(w, prior).length;
    const vs = compareToLast(w, prior);
    const day = findDay(w.dayId);
    const bits = [];
    if (prs) bits.push(`${prs} PR${prs === 1 ? "" : "s"}`);
    if (vs && vs.compared) bits.push(`${vs.beat} of ${vs.compared} sets beat last time`);
    return shell(
      <>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 99, background: day ? day.color : c.good, color: day ? day.on : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Check size={18} strokeWidth={3} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{day ? day.label : "Workout"} done today</div>
            <div className="num" style={{ fontSize: 14, color: c.ink2, marginTop: 2 }}>{bits.length ? bits.join(", ") : `${workoutSets(w)} sets logged`}</div>
          </div>
        </div>
        {milestone ? footer(<Trophy size={16} strokeWidth={2.4} />, milestone.text, c.good) : null}
      </>
    );
  }

  // 3) Today's targets: the hook
  if (targets.rows.length) {
    const n = targets.prCount;
    return shell(
      <>
        <div style={{ fontSize: 13, fontWeight: 700, color: hero.ink }}>{hero.label} day</div>
        <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 2 }}>
          {targets.comeback ? "Easing back in" : n ? `${n} PR${n === 1 ? "" : "s"} on the table` : "Numbers to beat"}
        </div>
        {targets.comeback ? (
          <div style={{ fontSize: 14, color: c.ink2, marginTop: 4, lineHeight: 1.45 }}>
            {targets.comeback.sessionsBack === 0
              ? `It's been ${targets.comeback.weeks} weeks. Targets are about 10% lighter for your first two sessions back.`
              : "One more lighter session, then back to chasing PRs."}
          </div>
        ) : null}
        <div style={{ marginTop: 12 }}>
          {targets.rows.map((r, i) => (
            <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: i === 0 ? "none" : `1px solid ${c.lineSoft}` }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, color: c.ink2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shortLiftName(r.name)}</span>
              <span className="num" style={{ fontSize: 16, fontWeight: 800, flexShrink: 0 }}>{fmtSetShort(r.weight, r.bw)} × {r.reps}</span>
              <span style={{ width: 78, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
                {r.kind ? (
                  <span style={{ fontSize: 11, fontWeight: 800, color: c.good, background: a(c.good, 12), padding: "4px 7px", borderRadius: 7, whiteSpace: "nowrap" }}>PR</span>
                ) : null}
              </span>
            </div>
          ))}
        </div>
        {risk
          ? footer(<Flame size={16} strokeWidth={2.4} />, `${risk.need} more session${risk.need === 1 ? "" : "s"} this week keeps your ${risk.streak}-week streak`, c.caution)
          : milestone
            ? footer(<Trophy size={16} strokeWidth={2.4} />, milestone.text, c.good)
            : null}
      </>,
      { onPress: () => onStart(hero.id) }
    );
  }

  // 4) First run
  if (!history.length && !tipOff) {
    const close = () => { setTipOff(true); saveSettings({ tipDismissed: true }); };
    return shell(
      <>
        <div className="serif" style={{ fontSize: 18, color: c.ink2 }}>How it works</div>
        {[
          ["Start", "Tap Start. Each set opens with last time's numbers filled in."],
          ["Log", "Adjust with + and −, then Log set. The rest clock runs by itself."],
          ["Beat it", "Next session suggests the rep or weight to beat, set by set."],
        ].map(([k, v], i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <span className="display num" style={{ fontSize: 22, color: hero.ink, minWidth: 16 }}>{i + 1}</span>
            <div style={{ fontSize: 14, color: c.ink2, lineHeight: 1.45 }}><strong style={{ color: c.ink }}>{k}.</strong> {v}</div>
          </div>
        ))}
      </>,
      { onClose: close }
    );
  }
  return null;
}

function HomeScreen({ history, active, target, onTargetChange, onStart, onResume, onOpenSetup }) {
  const now = new Date();
  const mon = mondayOf(Date.now());
  const thisWeek = sessionsBetween(history, mon, addDays(mon, 7));
  const streak = weekStreak(history, target);
  const nxt = findDay(nextDay(history));
  const activeDay = active ? findDay(active.dayId) : null;
  const hero = activeDay || nxt;
  const others = DAYS.filter(d => d.id !== hero.id);

  const todayIdx = (now.getDay() + 6) % 7;
  const week = Array.from({ length: 7 }, (_, i) => {
    const start = addDays(mon, i);
    const w = history.find(x => x.startedAt >= start.getTime() && x.startedAt < addDays(start, 1).getTime());
    return { letter: "MTWTFSS"[i], today: i === todayIdx, day: w ? findDay(w.dayId) : null };
  });

  const lastHero = history.find(w => w.dayId === hero.id);
  const toBeat = null; // targets now live in the Today card below
  const sore = active ? null : readinessFor(history, hero);
  const cbHero = active ? null : comebackInfo(history);
  const [editTarget, setEditTarget] = useState(false);
  const [preview, setPreview] = useState(null); // day id for the Other days preview
  const typical = typicalDuration(history, hero.id);
  const activeDone = active ? active.exercises.reduce((s, e) => s + e.sets.filter(x => x.done).length, 0) : 0;
  const activeTotal = active ? active.exercises.reduce((s, e) => s + e.sets.length, 0) : 0;

  return (
    <div className="rise" style={{ padding: `calc(env(safe-area-inset-top) + ${TOP_GAP + 4}px) 16px 0` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 0 8px 6px" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: c.ink3 }}>{fmtToday(Date.now())}</span>
        <IconButton label="Setup" onClick={onOpenSetup} style={{ color: c.ink2, width: 40, height: 40 }}>
          <Settings size={21} strokeWidth={2.1} />
        </IconButton>
      </div>
      {/* Hero: the next workout, colored like its plate */}
      <button
        onClick={active ? onResume : () => onStart(hero.id)}
        className="tap"
        style={{
          position: "relative", overflow: "hidden", display: "block",
          width: "100%", textAlign: "left",
          background: hero.color, color: hero.on,
          borderRadius: 30, padding: "22px 22px 22px",
          boxShadow: `0 14px 34px ${a(hero.color, 28)}`,
        }}
      >
        <PlateRings size={330} style={{ right: -120, top: -30 }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <span className="serif" style={{ fontSize: 22 }}>{greet()}{SETTINGS.name ? `, ${SETTINGS.name}` : ""}</span>
            <span style={{ fontSize: 11, fontWeight: 750, letterSpacing: "0.18em", opacity: 0.8, flexShrink: 0 }}>
              {active ? "IN PROGRESS" : "UP NEXT"}
            </span>
          </div>
          <div className="display" style={{ fontSize: 104, margin: "30px 0 12px", fontStretch: "88%" }}>{hero.label}</div>
          <div style={{ fontSize: 17, fontWeight: 650, opacity: 0.92 }}>{hero.sub}</div>
          {toBeat ? (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginTop: 14,
              padding: "6px 11px", borderRadius: 99, background: a(hero.on, 16),
              fontSize: 14, fontWeight: 700,
            }}>
              <TrendingUp size={15} strokeWidth={2.6} /> To beat: <span className="num">{toBeat}</span>
            </div>
          ) : null}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: toBeat ? 24 : 34, gap: 12 }}>
            <div style={{ fontSize: 15, lineHeight: 1.55, opacity: 0.88 }}>
              {active ? (
                <>
                  <div>{activeDone} of {activeTotal} sets logged</div>
                  <div>{Date.now() - active.startedAt > 4 * 3600000 ? `Started ${ago(active.startedAt)}` : `Started ${fmtDur(Date.now() - active.startedAt)} ago`}</div>
                </>
              ) : (
                <>
                  <div>{cbHero && cbHero.sessionsBack === 0
                    ? `Welcome back, last trained ${fmtDate(cbHero.last)}`
                    : sore
                    ? `${sore.m} trained ${sore.d === 0 ? "today" : "yesterday"}`
                    : lastHero ? `Rested, last done ${ago(lastHero.startedAt)}` : "First one on the log"}</div>
                  <div>{hero.exercises.length} exercises{typical ? `, about ${fmtDur(typical)}` : ""}</div>
                </>
              )}
            </div>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0,
              background: hero.on, color: hero.color,
              borderRadius: 99, padding: "13px 22px",
              fontSize: 17, fontWeight: 800,
            }}>
              {active ? "Resume" : "Start"} <ArrowRight size={19} strokeWidth={2.6} />
            </span>
          </div>
        </div>
      </button>

      {/* What's at stake today, right under the day it's about */}
      <ContextCard history={history} active={active} hero={hero} target={target} onStart={onStart} />

      {/* This week */}
      <div className="card" style={{ padding: "20px 18px 20px", marginTop: 14, borderRadius: 26 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "0 4px" }}>
          <button onClick={() => setEditTarget(true)} className="tap" aria-label={`${thisWeek} of ${target} sessions this week. Change weekly target`} style={{ textAlign: "left" }}>
            <div className="display num" style={{ fontSize: 60 }}>
              {thisWeek}<span style={{ color: c.ink3, fontSize: 36 }}>/{target}</span>
            </div>
            <div style={{ fontSize: 17, color: c.ink2, marginTop: 8 }}>
              {thisWeek >= target ? "Target hit this week" : "sessions this week"}
            </div>
          </button>
          {streak > 0 ? (
            <div style={{ textAlign: "right", paddingTop: 6 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, color: c.caution }}>
                <Flame size={20} strokeWidth={2.3} />
                <span className="display num" style={{ fontSize: 34, color: c.ink }}>{streak}</span>
              </div>
              <div style={{ fontSize: 13, color: c.ink3, marginTop: 4 }}>week{streak === 1 ? "" : "s"} on target</div>
            </div>
          ) : null}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginTop: 20, padding: "0 4px" }}>
          {week.map((d, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{
                width: "100%", aspectRatio: "1 / 1", borderRadius: 99,
                background: d.day ? d.day.color : c.inset,
                boxShadow: d.today ? `0 0 0 2px ${c.surface}, 0 0 0 3.5px ${c.ink}` : "none",
              }} />
              <span style={{ fontSize: 12, fontWeight: 750, color: d.today ? c.ink : c.ink3 }}>{d.letter}</span>
            </div>
          ))}
        </div>

      </div>

      <h2 className="h-sec" style={{ fontSize: 22, margin: "30px 6px 14px" }}>Other days</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {others.map(day => {
          const last = history.find(w => w.dayId === day.id);
          return (
            <button
              key={day.id}
              onClick={() => setPreview(day.id)}
              className="card tap"
              style={{ position: "relative", overflow: "hidden", textAlign: "left", padding: "18px 16px 18px", borderRadius: 26 }}
            >
              <span style={{ color: day.color }}>
                <PlateRings size={190} style={{ right: -62, top: -38, opacity: 0.9 }} />
              </span>
              <div style={{ position: "relative" }}>
                <MiniPlate color={day.color} on={day.on} size={34} />
                <div className="display" style={{ fontSize: 44, marginTop: 28, fontStretch: "88%" }}>{day.label}</div>
                <div style={{ fontSize: 14, color: c.ink2, marginTop: 6, lineHeight: 1.35 }}>{day.sub}</div>
                <div style={{ fontSize: 14, color: c.ink3, marginTop: 10 }}>{last ? `Last ${ago(last.startedAt)}` : "Not yet"}</div>
              </div>
            </button>
          );
        })}
      </div>

      {editTarget ? (
        <BottomSheet title="Weekly target" onClose={() => setEditTarget(false)}>
          <p style={{ margin: "0 0 18px", fontSize: 14, color: c.ink3, lineHeight: 1.45 }}>
            Sessions per week you're aiming for. Hitting it builds your streak.
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 20 }}>
            <button onClick={() => onTargetChange(target - 1)} disabled={target <= 1} className="tap" aria-label="Lower weekly target" style={{ width: 56, height: 56, borderRadius: 18, background: c.inset, color: target <= 1 ? c.ink4 : c.ink, display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={22} strokeWidth={2.6} /></button>
            <span className="display num" style={{ fontSize: 64, minWidth: 60, textAlign: "center" }}>{target}</span>
            <button onClick={() => onTargetChange(target + 1)} disabled={target >= 7} className="tap" aria-label="Raise weekly target" style={{ width: 56, height: 56, borderRadius: 18, background: c.inset, color: target >= 7 ? c.ink4 : c.ink, display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={22} strokeWidth={2.6} /></button>
          </div>
          <button onClick={() => setEditTarget(false)} className="tap" style={{ width: "100%", height: 52, borderRadius: 16, background: c.ink, color: c.bg, fontSize: 16, fontWeight: 750 }}>Done</button>
        </BottomSheet>
      ) : null}

      {preview ? (() => {
        const d = findDay(preview);
        const last = history.find(w => w.dayId === d.id);
        return (
          <BottomSheet title={`${d.label} day`} onClose={() => setPreview(null)}>
            <div style={{ fontSize: 14, color: c.ink3, margin: "-4px 0 14px" }}>
              {d.exercises.length} exercises{last ? `, last done ${ago(last.startedAt)}` : ""}
            </div>
            <div className="card" style={{ overflow: "hidden", marginBottom: 16 }}>
              {d.exercises.map((e, i) => {
                const rec = recommendNextSet(history, e.name, e.reps, !!e.bw);
                return (
                  <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderTop: i === 0 ? "none" : `1px solid ${c.lineSoft}` }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 650, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shortLiftName(e.name)}</span>
                    <span className="num" style={{ fontSize: 14, fontWeight: 700, color: rec ? c.ink : c.ink4, flexShrink: 0 }}>
                      {rec ? `${fmtSetShort(rec.weight, !!e.bw)} × ${rec.reps}` : `${e.sets} × ${e.reps}`}
                    </span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => { setPreview(null); onStart(d.id); }}
              className="tap"
              style={{ width: "100%", height: 56, borderRadius: 18, background: d.color, color: d.on, fontSize: 17, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >Start {d.label} <ArrowRight size={19} strokeWidth={2.6} /></button>
          </BottomSheet>
        );
      })() : null}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BOTTOM NAV — floating pill, active tab filled
// ═══════════════════════════════════════════════════════════════════════════
function BottomNav({ tab, onSwitch }) {
  const items = [
    { id: "home", label: "Today", Icon: Activity },
    { id: "history", label: "History", Icon: ClipboardList },
    { id: "progress", label: "Progress", Icon: BarChart3 },
  ];
  return (
    <nav style={{
      position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 200,
      padding: "0 12px max(10px, calc(env(safe-area-inset-bottom) - 4px))",
      pointerEvents: "none",
    }}>
      <div style={{
        maxWidth: 456, margin: "0 auto", display: "flex", gap: 4, padding: 5,
        borderRadius: 30, pointerEvents: "auto",
        background: a(c.surface, 90),
        backdropFilter: "blur(20px) saturate(1.4)", WebkitBackdropFilter: "blur(20px) saturate(1.4)",
        border: `1px solid ${c.lineSoft}`,
        boxShadow: "0 8px 28px rgba(0,0,0,0.10)",
      }}>
        {items.map(({ id, label, Icon }) => {
          const on = tab === id;
          return (
            <button
              key={id}
              onClick={() => onSwitch(id)}
              className="tap"
              aria-current={on ? "page" : undefined}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                padding: "10px 0 9px", borderRadius: 25,
                background: on ? c.ink : "transparent",
                color: on ? c.bg : c.ink3,
                transition: "background 200ms ease, color 200ms ease",
              }}
            >
              <Icon size={22} strokeWidth={on ? 2.3 : 2} />
              <span style={{ fontSize: 12, fontWeight: 750 }}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SESSION SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
function SessionSummary({ workout, newPRs, history, onDismiss }) {
  const day = findDay(workout.dayId) || DAYS[0];
  const prior = (history || []).filter(w => w.id !== workout.id && w.startedAt < workout.startedAt);
  const duration = workout.completedAt - workout.startedAt;
  const vs = compareToLast(workout, prior);

  return (
    <div
      className="fade-in"
      onClick={onDismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 950,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        className="sheet-up"
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, overflow: "hidden",
          background: c.surface, borderRadius: "28px 28px 0 0",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
        }}
      >
        <div style={{ position: "relative", overflow: "hidden", background: day.color, color: day.on, padding: "26px 22px 22px" }}>
          <PlateRings size={240} style={{ right: -70, top: -60 }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 14, fontWeight: 650, opacity: 0.85 }}>Workout complete</div>
            <div className="display stamp" style={{ fontSize: 64, marginTop: 8 }}>{day.label} done</div>
          </div>
        </div>

        <div style={{ padding: "20px 22px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Stat label="Sets" value={workoutSets(workout)} />
            <Stat label="Time" value={fmtDur(duration)} />
            <Stat label="Volume" value={fmtNum(workoutVolume(workout))} unit="lb" />
          </div>

          {vs ? (
            <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
              {vs.volPct !== null ? (
                <span className="num" style={{
                  padding: "7px 12px", borderRadius: 99, fontSize: 14, fontWeight: 700,
                  background: vs.volPct >= 0 ? a(c.good, 12) : c.inset,
                  color: vs.volPct >= 0 ? c.good : c.ink2,
                }}>
                  {vs.volPct >= 0 ? "+" : ""}{vs.volPct.toFixed(Math.abs(vs.volPct) < 10 ? 1 : 0)}% volume vs last {day.label.toLowerCase()}
                </span>
              ) : null}
              {vs.compared ? (
                <span className="num" style={{ padding: "7px 12px", borderRadius: 99, fontSize: 14, fontWeight: 700, background: c.inset, color: c.ink2 }}>
                  {vs.beat} of {vs.compared} sets beat last time
                </span>
              ) : null}
            </div>
          ) : null}

          {newPRs.length > 0 ? (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, color: c.good, marginBottom: 8 }}>
                <Trophy size={15} strokeWidth={2.4} />
                {newPRs.length === 1 ? "New personal record" : `${newPRs.length} new personal records`}
              </div>
              {newPRs.slice(0, 4).map((pr, i) => (
                <div key={i} className="rise" style={{
                  animationDelay: `${120 + i * 70}ms`,
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                  padding: "10px 0", borderTop: `1px solid ${c.lineSoft}`,
                }}>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pr.name}</span>
                    <span style={{ display: "block", fontSize: 12, color: c.ink3, marginTop: 1 }}>{PR_LABEL[pr.kind].replace(/^./, ch => ch.toUpperCase())}</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: c.good, background: a(c.good, 12), padding: "3px 7px", borderRadius: 6 }}>PR</span>
                    <span className="num" style={{ fontSize: 16, fontWeight: 750 }}>
                      <LoadText weight={pr.weight} bw={pr.bw} /> × {pr.reps}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <CopyForClaudeButton getText={() => buildSessionText(workout, prior, newPRs)} style={{ flex: 1 }} />
            <button
              onClick={onDismiss}
              className="tap"
              style={{ flex: 1, height: 50, borderRadius: 14, background: c.ink, color: c.bg, fontSize: 15, fontWeight: 700 }}
            >Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKOUT
// One exercise open at a time; inside it, only the current set has controls.
// Every other set is a plain line of numbers you can tap to edit.
// ═══════════════════════════════════════════════════════════════════════════
function WorkoutScreen({
  workout, history, bodyweight, onBodyweightChange, notes, onNoteChange,
  rest, onStartRest, onAdjustRest, onClearRest,
  onUpdate, onFinish, onDiscard, onDeleteExercise, onBack,
}) {
  const day = findDay(workout.dayId) || DAYS[0];
  const [elapsed, setElapsed] = useState(Date.now() - workout.startedAt);
  const [openIdx, setOpenIdx] = useState(() => {
    const i = workout.exercises.findIndex(ex => !isExerciseDone(ex));
    return i >= 0 ? i : null;
  });
  const [activeSet, setActiveSet] = useState({}); // { [exerciseIdx]: setIdx } when chosen by hand
  const [picker, setPicker] = useState(null);      // null | { mode: "add" } | { mode: "swap", ei }
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState(null); // PR celebration
  const [rirAsk, setRirAsk] = useState(null); // { ei, si } just logged, offer "left in the tank"
  const [insight, setInsight] = useState(null); // exercise name for the history sheet
  useEffect(() => {
    if (!rirAsk) return;
    const t = setTimeout(() => setRirAsk(null), 6000);
    return () => clearTimeout(t);
  }, [rirAsk]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);
  const cardRefs = useRef({});
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => { if (!SWIPE_LIFTED) setScrolled(window.scrollY > 64); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const roundBtn = {
    width: 40, height: 40, borderRadius: 99, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: c.surface, color: c.ink,
    boxShadow: `inset 0 0 0 1px ${c.lineSoft}`,
  };

  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - workout.startedAt), 1000);
    return () => clearInterval(t);
  }, [workout.startedAt]);

  // Keep the screen awake for the whole workout (no toggle needed)
  useEffect(() => {
    let lock = null;
    let cancelled = false;
    async function acquire() {
      try {
        if ("wakeLock" in navigator && document.visibilityState === "visible") {
          lock = await navigator.wakeLock.request("screen");
          if (cancelled) { try { lock.release(); } catch {} }
        }
      } catch {}
    }
    function onVisible() { if (document.visibilityState === "visible") acquire(); }
    acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (lock) { try { lock.release(); } catch {} }
    };
  }, []);

  // Bring the newly opened exercise into view
  useEffect(() => {
    if (openIdx === null) return;
    const el = cardRefs.current[openIdx];
    if (el && el.getBoundingClientRect) {
      const r = el.getBoundingClientRect();
      if (r.top < 90 || r.top > window.innerHeight * 0.55) {
        window.scrollTo({ top: window.scrollY + r.top - 96, behavior: "smooth" });
      }
    }
  }, [openIdx]);

  // Previous bests per exercise, for live PR badges
  const statsByName = useMemo(() => {
    const m = {};
    for (const ex of workout.exercises) if (!(ex.name in m)) m[ex.name] = priorStats(history, ex.name);
    return m;
  }, [history, workout.exercises.map(e => e.name).join("|")]);

  const totalSets = workout.exercises.reduce((s, ex) => s + ex.sets.length, 0);
  const doneSets = workout.exercises.reduce((s, ex) => s + ex.sets.filter(x => x.done).length, 0);
  const allDone = totalSets > 0 && doneSets === totalSets;
  // When the last set is logged, bring the Finish card into view
  const doneRef = useRef(null);
  const wasDone = useRef(allDone);
  useEffect(() => {
    if (allDone && !wasDone.current && doneRef.current) {
      setTimeout(() => doneRef.current && doneRef.current.scrollIntoView({ behavior: "smooth", block: "center" }), 350);
    }
    wasDone.current = allDone;
  }, [allDone]);

  const currentSetOf = ei => {
    const ex = workout.exercises[ei];
    if (!ex) return -1;
    const chosen = activeSet[ei];
    if (chosen !== undefined && chosen < ex.sets.length) return chosen;
    return firstOpenSet(ex);
  };

  function mapEx(ei, fn) {
    return { ...workout, exercises: workout.exercises.map((ex, i) => i === ei ? fn(ex) : ex) };
  }
  function editSet(ei, si, field, value) {
    onUpdate(mapEx(ei, ex => ({ ...ex, sets: ex.sets.map((s, j) => j === si ? { ...s, [field]: value } : s) })), false);
  }
  function logSet(ei, si) {
    const ex = workout.exercises[ei];
    const bw = exIsBW(ex);
    const set = ex.sets[si];
    const ready = bw ? set.reps !== "" : (set.weight !== "" && set.reps !== "");
    if (!ready) return;
    const next = mapEx(ei, e => ({
      ...e,
      sets: e.sets.map((s, j) => j === si ? { ...s, done: true, at: Date.now(), weight: bw && s.weight === "" ? "0" : s.weight } : s),
    }));
    // Carry the logged numbers forward into the next set if it's still empty
    const nextEx = next.exercises[ei];
    const following = nextEx.sets.findIndex((s, j) => j > si && !s.done);
    if (following >= 0 && nextEx.sets[following].weight === "" && nextEx.sets[following].reps === "") {
      nextEx.sets[following] = { ...nextEx.sets[following], weight: nextEx.sets[si].weight, reps: nextEx.sets[si].reps };
    }
    onUpdate(next, true);
    setActiveSet(prev => { const p = { ...prev }; delete p[ei]; return p; });

    if (!set.warmup) setRirAsk({ ei, si, id: Date.now() });

    const kind = prKind(statsByName[ex.name], nextEx.sets[si], bw, bodyweight);
    if (kind) {
      const logged = nextEx.sets[si];
      setToast({ id: Date.now(), kind, name: ex.name, text: `${fmtSetShort(logged.weight, bw)} × ${logged.reps}` });
    }

    const everything = next.exercises.every(isExerciseDone);
    if (everything) onClearRest(); // last set: no rest, straight to Finish
    else if (!set.warmup) onStartRest(parseRestSeconds(ex.rest), ex.name);
    if (isExerciseDone(nextEx)) {
      const n = next.exercises.length;
      let target = null;
      for (let k = 1; k < n; k++) {
        const j = (ei + k) % n;
        if (!isExerciseDone(next.exercises[j])) { target = j; break; }
      }
      setOpenIdx(target);
    }
  }
  function setRir(ei, si, v) {
    onUpdate(mapEx(ei, ex => ({ ...ex, sets: ex.sets.map((s, j) => j === si ? { ...s, rir: v } : s) })), true);
    setRirAsk(null);
  }
  function toggleWarmup(ei, si) {
    onUpdate(mapEx(ei, ex => ({ ...ex, sets: ex.sets.map((s, j) => j === si ? { ...s, warmup: !s.warmup } : s) })), true);
  }
  function undoSet(ei, si) {
    onUpdate(mapEx(ei, ex => ({ ...ex, sets: ex.sets.map((s, j) => j === si ? { ...s, done: false } : s) })), true);
  }
  function addSet(ei) {
    const ex = workout.exercises[ei];
    const last = ex.sets[ex.sets.length - 1];
    const seed = last ? { weight: last.weight, reps: last.reps } : { weight: "", reps: "" };
    onUpdate(mapEx(ei, e => ({ ...e, sets: [...e.sets, { ...seed, done: false }] })), true);
    setActiveSet(prev => ({ ...prev, [ei]: ex.sets.length }));
  }
  function removeSet(ei, si) {
    const ex = workout.exercises[ei];
    if (ex.sets.length <= 1) return;
    onUpdate(mapEx(ei, e => ({ ...e, sets: e.sets.filter((_, j) => j !== si) })), true);
    setActiveSet(prev => { const p = { ...prev }; delete p[ei]; return p; });
  }
  function fillFromRecommendation(ei, rec) {
    const si = currentSetOf(ei);
    if (si < 0 || !rec) return;
    onUpdate(mapEx(ei, ex => ({ ...ex, sets: ex.sets.map((s, j) => j === si ? { ...s, weight: rec.weight, reps: rec.reps } : s) })), false);
  }
  function pickExercise(item) {
    const clean = item.name.trim();
    if (!clean) return;
    if (picker && picker.mode === "swap") {
      const ei = picker.ei;
      const orig = workout.exercises[ei];
      const newEx = {
        name: clean,
        bw: isBodyweight(clean),
        swappedFrom: orig.swappedFrom || orig.name,
        targetSets: orig.targetSets,
        targetReps: item.reps || orig.targetReps,
        rest: item.rest || orig.rest,
        sets: buildSets(history, clean, orig.sets.length, isBodyweight(clean)),
      };
      onUpdate({ ...workout, exercises: workout.exercises.map((e, i) => i === ei ? newEx : e) }, true);
      setActiveSet(prev => { const p = { ...prev }; delete p[ei]; return p; });
      setOpenIdx(ei);
    } else {
      const n = Math.max(1, Math.min(10, Number(item.sets) || 3));
      const newEx = {
        name: clean,
        bw: isBodyweight(clean),
        targetSets: n,
        targetReps: item.reps || "8–12",
        rest: item.rest || "90 s",
        sets: buildSets(history, clean, n, isBodyweight(clean)),
      };
      onUpdate({ ...workout, exercises: [...workout.exercises, newEx] }, true);
      setOpenIdx(workout.exercises.length);
    }
    setPicker(null);
  }

  return (
    <div className="fade-in" style={{ minHeight: "100vh", paddingBottom: 170 }}>
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: scrolled ? a(c.bg, 86) : c.bg,
        backdropFilter: scrolled ? "blur(22px) saturate(1.5)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(22px) saturate(1.5)" : "none",
        padding: `calc(env(safe-area-inset-top) + ${TOP_GAP}px) 8px 0`,
        transition: "background 200ms ease",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 44px", alignItems: "center", height: 44 }}>
          <IconButton label="Back" onClick={onBack}><ChevronLeft size={26} strokeWidth={2.2} /></IconButton>
          <div aria-hidden={!scrolled} style={{
            textAlign: "center", opacity: scrolled ? 1 : 0,
            transform: scrolled ? "none" : "translateY(6px)",
            transition: "opacity 180ms ease, transform 180ms ease",
          }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{day.label}</div>
            <div className="num" style={{ fontSize: 12, fontWeight: 600, color: c.ink3 }}>
              {fmtClock(elapsed)}, {doneSets} of {totalSets}
            </div>
          </div>
          <IconButton label="Workout options" onClick={() => setMenu(true)}><MoreHorizontal size={22} /></IconButton>
        </div>
        <div aria-hidden="true" style={{ height: 3, margin: "8px -8px 0", background: scrolled ? c.inset : "transparent", transition: "background 200ms ease" }}>
          <div style={{
            height: "100%", background: day.color, opacity: scrolled ? 1 : 0,
            width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%`,
            transition: "width 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease",
          }} />
        </div>
      </header>

      {/* Large title: scrolls away and hands off to the compact bar above */}
      <div style={{ padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
          <h1 className="display" style={{ margin: 0, fontSize: 56, fontStretch: "88%" }}>{day.label}</h1>
          <div className="num" role="timer" aria-label={`Workout time ${fmtClock(elapsed)}`} style={{ textAlign: "right", paddingBottom: 2 }}>
            <div className="display" style={{ fontSize: 30, color: c.ink2 }}>{fmtClock(elapsed)}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, fontSize: 14, color: c.ink3 }}>
          <span className="num">{doneSets} of {totalSets} sets{allDone ? ", all done" : ""}</span>
          <span>elapsed</span>
        </div>
        <div aria-hidden="true" style={{ height: 6, borderRadius: 3, background: c.inset, overflow: "hidden", margin: "12px 0 14px" }}>
          <div style={{
            height: "100%", borderRadius: 3, background: day.color,
            width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%`,
            transition: "width 400ms cubic-bezier(0.16, 1, 0.3, 1)",
          }} />
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        {workout.exercises.map((ex, ei) => {
          const bw = exIsBW(ex);
          return (
            <div key={ei} ref={el => { cardRefs.current[ei] = el; }}>
              <ExerciseCard
                ex={ex}
                bw={bw}
                day={day}
                open={openIdx === ei}
                onToggle={() => setOpenIdx(openIdx === ei ? null : ei)}
                current={currentSetOf(ei)}
                lastSets={findLastSessionSets(history, ex.name)}
                rec={recommendNextSet(history, ex.name, ex.targetReps, bw)}
                targets={nextTargets(history, ex.name, ex.targetReps, bw)}
                step={bw ? 5 : (isLowerBody(ex.name) ? 10 : 5)}
                bodyweight={bodyweight}
                onBodyweightChange={onBodyweightChange}
                note={notes[ex.name] || ""}
                onNoteChange={t => onNoteChange(ex.name, t)}
                stats={statsByName[ex.name]}
                onToggleWarmup={si => toggleWarmup(ei, si)}
                rirAsk={rirAsk && rirAsk.ei === ei ? rirAsk.si : -1}
                onRir={(si, v) => setRir(ei, si, v)}
                onHistory={() => setInsight(ex.name)}
                onSelectSet={si => setActiveSet(prev => ({ ...prev, [ei]: si }))}
                onEditSet={(si, f, v) => editSet(ei, si, f, v)}
                onLog={si => logSet(ei, si)}
                onUndo={si => undoSet(ei, si)}
                onRemoveSet={si => removeSet(ei, si)}
                onAddSet={() => addSet(ei)}
                onFill={rec => fillFromRecommendation(ei, rec)}
                onSwap={() => setPicker({ mode: "swap", ei })}
                onRemove={() => onDeleteExercise(ei)}
              />
            </div>
          );
        })}

        {workout.exercises.length === 0 ? (
          <EmptyState icon={<ClipboardList size={20} />} title="No exercises left" sub="Add one below, or discard this session from the menu." />
        ) : null}

        <button
          onClick={() => setPicker({ mode: "add" })}
          className="tap"
          style={{
            width: "100%", marginTop: 4, padding: "16px 0", borderRadius: 18,
            border: `1.5px dashed ${c.line}`, color: c.ink2,
            fontSize: 15, fontWeight: 650,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <Plus size={17} strokeWidth={2.4} /> Add exercise
        </button>

        {allDone ? (
          <div ref={doneRef} className="rise" style={{
            marginTop: 16, padding: "20px 18px 18px", borderRadius: 24, textAlign: "center",
            background: a(day.color, 10), border: `1.5px solid ${a(day.color, 35)}`,
          }}>
            <div className="pop" style={{
              width: 48, height: 48, borderRadius: 99, margin: "0 auto",
              background: day.color, color: day.on,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}><Check size={24} strokeWidth={3} /></div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 12 }}>All {totalSets} sets logged</div>
            <div style={{ fontSize: 14, color: c.ink2, marginTop: 4 }}>{fmtDur(elapsed)} of work. Wrap it up to see your PRs.</div>
            <button
              onClick={onFinish}
              className="tap"
              style={{
                width: "100%", height: 56, marginTop: 16, borderRadius: 16,
                background: day.color, color: day.on, fontSize: 17, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            ><Check size={20} strokeWidth={3} /> Finish workout</button>
          </div>
        ) : null}
      </div>

      {/* Bottom dock: rest countdown while resting, otherwise Finish */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 150,
        transform: "translateY(var(--lift-y, 0px))",
        background: `linear-gradient(to top, ${c.bg} 62%, ${a(c.bg, 0)})`,
        padding: "26px 16px max(12px, env(safe-area-inset-bottom))",
      }}>
        <div style={{ maxWidth: 448, margin: "0 auto" }}>
          {rest ? (
            <RestDock rest={rest} day={day} onAdjust={onAdjustRest} onClear={onClearRest} />
          ) : allDone ? null : (
            <button
              onClick={onFinish}
              className="tap"
              style={{
                width: "100%", height: 58, borderRadius: 18,
                background: allDone ? day.color : c.ink,
                color: allDone ? day.on : c.bg,
                fontSize: 17, fontWeight: 750,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: "0 6px 20px rgba(0,0,0,0.14)",
              }}
            >
              <Check size={20} strokeWidth={2.8} /> Finish workout
            </button>
          )}
        </div>
      </div>

      {toast ? (
        <div key={toast.id} role="status" className="pop" style={{
          position: "fixed", left: 0, right: 0, bottom: "calc(env(safe-area-inset-bottom) + 94px)", zIndex: 160,
          transform: "translateY(var(--lift-y, 0px))",
            display: "flex", justifyContent: "center", pointerEvents: "none",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "11px 16px 11px 12px", borderRadius: 99,
            background: c.ink, color: c.bg,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)", maxWidth: "88%",
          }}>
            <span style={{ width: 30, height: 30, borderRadius: 99, background: c.good, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Trophy size={16} strokeWidth={2.4} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>New PR</div>
              <div className="num" style={{ fontSize: 13, opacity: 0.75, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {shortLiftName(toast.name)} {toast.text}, {PR_LABEL[toast.kind]}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {menu ? (
        <ActionSheet
          title={`${day.label} day`}
          actions={[
            { label: "Finish workout", icon: Check, fn: () => { setMenu(false); onFinish(); } },
            { label: "Add exercise", icon: Plus, fn: () => { setMenu(false); setPicker({ mode: "add" }); } },
            { label: "Discard workout", icon: Trash2, variant: "danger", fn: () => { setMenu(false); onDiscard(); } },
            { label: "Cancel", variant: "cancel", fn: () => setMenu(false) },
          ]}
          onDismiss={() => setMenu(false)}
        />
      ) : null}

      {insight ? (
        <BottomSheet title={insight} onClose={() => setInsight(null)}>
          <ExerciseInsight name={insight} history={history} compact />
        </BottomSheet>
      ) : null}

      {picker ? (
        <BottomSheet
          title={picker.mode === "swap" ? "Swap for today" : "Add exercise"}
          onClose={() => setPicker(null)}
        >
          {picker.mode === "swap" ? (
            <p style={{ margin: "0 0 14px", fontSize: 14, color: c.ink3, lineHeight: 1.45 }}>
              Replacing <strong style={{ color: c.ink }}>{workout.exercises[picker.ei].name}</strong> for this session only.
              Your routine stays the same.
            </p>
          ) : null}
          <ExercisePicker
            onPick={pickExercise}
            prefer={picker.mode === "swap" ? categoryForMuscle(muscleFor(workout.exercises[picker.ei].name)) : null}
          />
        </BottomSheet>
      ) : null}
    </div>
  );
}

function ExerciseCard({
  ex, bw, day, open, onToggle, current, lastSets, rec, targets, step,
  bodyweight, onBodyweightChange, note, onNoteChange, stats, onToggleWarmup, rirAsk, onRir, onHistory,
  onSelectSet, onEditSet, onLog, onUndo, onRemoveSet, onAddSet, onFill, onSwap, onRemove,
}) {
  const done = ex.sets.filter(s => s.done).length;
  const complete = isExerciseDone(ex);
  const curSet = current >= 0 ? ex.sets[current] : null;
  // Same target model as Today and the exercise screen: this set's own target
  const sugFor = i => {
    if (!targets) return null;
    const t = targets.sets[i] || targets.sets[targets.sets.length - 1];
    return t && !t.warmup ? t : targets.top;
  };
  const sug = curSet && !curSet.done && !curSet.warmup ? sugFor(current) : null;
  const recApplied = sug && curSet.weight === sug.weight && curSet.reps === sug.reps;
  const showRec = !!sug && !complete;

  return (
    <div
      className="card"
      style={{
        marginBottom: 10, overflow: "hidden",
        borderColor: open ? a(day.color, 45) : undefined,
        boxShadow: open ? `0 8px 24px ${a(day.color, 12)}` : "none",
        transition: "border-color 200ms ease, box-shadow 200ms ease",
      }}
    >
      <button
        onClick={onToggle}
        className="tap"
        aria-expanded={open}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "15px 16px", textAlign: "left" }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em",
            color: complete && !open ? c.ink3 : c.ink,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{ex.name}</div>
          <div style={{ fontSize: 13, color: ex.swappedFrom ? day.ink : c.ink3, marginTop: 2 }}>
            {ex.swappedFrom ? `Swapped in for ${ex.swappedFrom}` : `${ex.targetSets} × ${ex.targetReps}, rest ${ex.rest}`}
          </div>
        </div>
        {complete ? (
          <div className="pop" style={{
            width: 28, height: 28, borderRadius: 99, background: day.color, color: day.on,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}><Check size={16} strokeWidth={3} /></div>
        ) : (
          <div aria-label={`${done} of ${ex.sets.length} sets logged`} style={{ display: "flex", gap: 3, flexShrink: 0 }}>
            {ex.sets.map((s, i) => (
              <span key={i} style={{
                width: 12, height: 5, borderRadius: 3,
                background: s.done ? day.color : c.inset,
                transition: "background 200ms ease",
              }} />
            ))}
          </div>
        )}
      </button>

      <Collapse open={open}>
        <div style={{ padding: "0 12px 12px" }}>
          <NoteLine note={note} onSave={onNoteChange} />
          {lastSets || showRec ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px 12px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {lastSets ? (
                  <>
                    <div style={{ fontSize: 12, color: c.ink3 }}>Last time</div>
                    <div className="num" style={{ display: "flex", flexWrap: "wrap", columnGap: 12, rowGap: 2, fontSize: 14, fontWeight: 650, color: c.ink2, marginTop: 2 }}>
                      {lastSets.slice(0, 6).map((s, i) => (
                        <span key={i} style={{ whiteSpace: "nowrap", opacity: s.warmup ? 0.55 : 1 }}>{fmtSetShort(s.weight, bw)}×{s.reps}</span>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
              {showRec ? (
                <button
                  onClick={() => onFill(sug)}
                  className="tap"
                  aria-label={`Fill set ${current + 1} with ${fmtLoadText(sug.weight, bw)} for ${sug.reps} reps`}
                  style={{
                    flexShrink: 0, textAlign: "left",
                    padding: "7px 12px", borderRadius: 12,
                    border: `1.5px solid ${recApplied ? c.lineSoft : a(day.color, 60)}`,
                    background: recApplied ? "transparent" : a(day.color, 8),
                    color: recApplied ? c.ink3 : day.ink,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    {recApplied ? <Check size={12} strokeWidth={3} /> : <TrendingUp size={12} strokeWidth={2.6} />} Try, set {current + 1}
                  </div>
                  <div className="num" style={{ fontSize: 15, fontWeight: 800 }}>
                    {fmtSetShort(sug.weight, bw)} × {sug.reps}
                  </div>
                </button>
              ) : null}
            </div>
          ) : null}
          {rec && rec.comeback && !complete ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: c.caution, fontWeight: 650, padding: "0 4px 12px", marginTop: -4 }}>
              <Undo2 size={14} strokeWidth={2.6} /> Easing back in: {rec.rationale}
            </div>
          ) : rec && rec.increase && !complete ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: c.good, fontWeight: 650, padding: "0 4px 12px", marginTop: -4 }}>
              <TrendingUp size={14} strokeWidth={2.6} /> Time to go up: {rec.rationale}
            </div>
          ) : null}

          {bw && !bodyweight ? <BodyweightPrompt onSave={onBodyweightChange} /> : null}

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {ex.sets.map((set, si) => si === current ? (
              <ActiveSet
                key={si}
                set={set}
                idx={si}
                name={ex.name}
                bw={bw}
                step={step}
                day={day}
                prev={lastSets ? (lastSets[si] || lastSets[lastSets.length - 1]) : null}
                canRemove={ex.sets.length > 1}
                onChange={(f, v) => onEditSet(si, f, v)}
                onToggleWarmup={() => onToggleWarmup(si)}
                onLog={() => onLog(si)}
                onUndo={() => onUndo(si)}
                onRemove={() => onRemoveSet(si)}
              />
            ) : (
              <div key={si}>
                <SetLine
                  set={set} idx={si} bw={bw} day={day}
                  pr={set.done ? prKind(stats, set, bw, bodyweight) : null}
                  onSelect={() => onSelectSet(si)}
                />
                {rirAsk === si && set.done ? <RirPrompt value={set.rir} onPick={v => onRir(si, v)} /> : null}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 4px 0" }}>
            <button onClick={onAddSet} className="tap link"><Plus size={15} strokeWidth={2.4} /> Add set</button>
            <button onClick={onSwap} className="tap link"><Repeat size={14} strokeWidth={2.4} /> Swap</button>
            <button onClick={onHistory} className="tap link"><TrendingUp size={14} strokeWidth={2.4} /> Trend</button>
            <span style={{ flex: 1 }} />
            <button onClick={onRemove} className="tap link" aria-label={`Remove ${ex.name} from this session`} style={{ color: c.ink3, padding: 8 }}>
              <Trash2 size={16} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </Collapse>
    </div>
  );
}

// Smooth open/close by animating grid rows from 0fr to 1fr
function Collapse({ open, children }) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      let r2;
      const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setShown(true)); });
      return () => { cancelAnimationFrame(r1); if (r2) cancelAnimationFrame(r2); };
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 300);
    return () => clearTimeout(t);
  }, [open]);
  if (!mounted) return null;
  return (
    <div style={{
      display: "grid", gridTemplateRows: shown ? "1fr" : "0fr",
      opacity: shown ? 1 : 0,
      transition: "grid-template-rows 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease",
    }}>
      <div style={{ overflow: "hidden", minHeight: 0 }}>{children}</div>
    </div>
  );
}

// Optional, one tap: how many reps were left after this set. Fades away if ignored.
function RirPrompt({ value, onPick }) {
  const opts = [{ v: 0, l: "Failure" }, { v: 1, l: "1" }, { v: 2, l: "2" }, { v: 3, l: "3+" }];
  return (
    <div className="rise" style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px 8px 52px" }}>
      <span style={{ fontSize: 12, fontWeight: 650, color: c.ink3, marginRight: 2, whiteSpace: "nowrap" }}>Reps left</span>
      {opts.map(o => (
        <button
          key={o.v}
          onClick={() => onPick(o.v)}
          className="tap num"
          aria-pressed={value === o.v}
          style={{
            height: 30, padding: "0 10px", borderRadius: 99, fontSize: 12, fontWeight: 750,
            background: value === o.v ? c.ink : c.inset, color: value === o.v ? c.bg : c.ink2,
          }}
        >{o.l}</button>
      ))}
    </div>
  );
}

// A set that isn't being edited: number badge + "165 × 8"
function SetLine({ set, idx, bw, day, pr, onSelect }) {
  const has = set.reps !== "" && (bw || set.weight !== "");
  const wu = !!set.warmup;
  return (
    <button
      onClick={onSelect}
      className="tap"
      aria-label={`${wu ? "Warm-up set" : `Set ${idx + 1}`}${set.done ? ", logged" : ""}${pr ? `, ${PR_LABEL[pr]}` : ""}. Tap to edit.`}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "9px 10px", borderRadius: 12, width: "100%", textAlign: "left",
        background: set.done && !wu ? a(day.color, 9) : "transparent",
      }}
    >
      <span style={{
        width: 28, height: 28, borderRadius: 99, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: set.done ? (wu ? c.inset : day.color) : "transparent",
        color: set.done ? (wu ? c.ink2 : day.on) : c.ink3,
        boxShadow: set.done ? "none" : `inset 0 0 0 1.5px ${c.line}`,
        fontSize: 12, fontWeight: 800,
      }}>
        {wu ? "W" : set.done ? <Check size={15} strokeWidth={3} /> : idx + 1}
      </span>
      <span className="display num" style={{
        fontSize: wu ? 20 : 24, fontWeight: 750,
        color: set.done ? (wu ? c.ink3 : c.ink) : c.ink4,
      }}>
        {has ? `${fmtSetShort(set.weight === "" ? "0" : set.weight, bw)} × ${set.reps}` : "—"}
      </span>
      <span style={{ flex: 1 }} />
      {pr ? (
        <span className="pop" style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11, fontWeight: 800, color: c.good,
          background: a(c.good, 12), padding: "4px 8px", borderRadius: 7,
        }} title={PR_LABEL[pr]}><Trophy size={12} strokeWidth={2.6} /> PR</span>
      ) : wu ? (
        <span style={{ fontSize: 12, color: c.ink3, fontWeight: 600 }}>Warm-up</span>
      ) : set.done && set.rir !== undefined && set.rir !== null ? (
        <span style={{ fontSize: 12, color: c.ink3, fontWeight: 650 }}>
          {Number(set.rir) === 0 ? "To failure" : `${set.rir === 3 ? "3+" : set.rir} left`}
        </span>
      ) : null}
    </button>
  );
}

// The one set with controls: big steppers and a single Log button
function ActiveSet({ set, idx, name, bw, step, day, prev, canRemove, onChange, onToggleWarmup, onLog, onUndo, onRemove }) {
  const ready = bw ? set.reps !== "" : (set.weight !== "" && set.reps !== "");
  const wu = !!set.warmup;
  const barbell = !bw && isBarbell(name);
  const [perSide, setPerSideState] = useState(() => barbell && getPerSide(name));
  const [sideDraft, setSideDraft] = useState(null); // raw text while typing per side
  const [bar, setBarState] = useState(() => getBar(name));
  const plates = barbell && set.weight !== "" ? platesPerSide(set.weight, bar) : undefined;
  function cycleBar() {
    const next = BAR_OPTIONS[(BAR_OPTIONS.indexOf(bar) + 1) % BAR_OPTIONS.length];
    setBarState(next);
    setBar(name, next);
    setSideDraft(null);
  }

  function togglePerSide() {
    const next = !perSide;
    setPerSideState(next);
    setPerSide(name, next);
    setSideDraft(null);
  }
  function stepWeight(dir) {
    setSideDraft(null);
    const base = set.weight !== "" ? Number(set.weight) || 0 : (prev ? Number(prev.weight) || 0 : 0);
    if (perSide) {
      const side = Math.max(0, (base - bar) / 2 + dir * (step / 2));
      onChange("weight", sideToTotal(side, bar));
      return;
    }
    const n = Math.max(0, base + dir * step);
    onChange("weight", String(n));
  }
  function stepReps(dir) {
    const base = set.reps !== "" ? Number(set.reps) || 0 : (prev ? Number(prev.reps) || 0 : 0);
    const n = Math.max(0, base + dir);
    onChange("reps", n === 0 ? "" : String(n));
  }

  return (
    <div className="rise" style={{ background: c.inset, borderRadius: 18, padding: 12, margin: "2px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 4px 10px" }}>
        <span style={{ fontSize: 13, fontWeight: 750, color: c.ink2, whiteSpace: "nowrap" }}>
          {wu ? "Warm-up" : `Set ${idx + 1}`}{set.done ? ", logged" : ""}
        </span>
        <span style={{ flex: 1 }} />
        {barbell ? (
          <button
            onClick={togglePerSide}
            className="tap"
            aria-pressed={perSide}
            style={{
              fontSize: 12, fontWeight: 750, padding: "5px 10px", borderRadius: 99,
              background: perSide ? c.ink : "transparent",
              color: perSide ? c.bg : c.ink3,
              boxShadow: perSide ? "none" : `inset 0 0 0 1.5px ${c.line}`,
            }}
          >Per side</button>
        ) : null}
        <button
          onClick={onToggleWarmup}
          className="tap"
          aria-pressed={wu}
          style={{
            fontSize: 12, fontWeight: 750, padding: "5px 10px", borderRadius: 99, whiteSpace: "nowrap", flexShrink: 0,
            background: wu ? c.ink : "transparent",
            color: wu ? c.bg : c.ink3,
            boxShadow: wu ? "none" : `inset 0 0 0 1.5px ${c.line}`,
          }}
        >Warm-up</button>
        {canRemove ? (
          <button onClick={onRemove} className="tap" aria-label={`Delete set ${idx + 1}`} style={{ color: c.ink3, padding: 4, display: "flex" }}>
            <Trash2 size={16} strokeWidth={2} />
          </button>
        ) : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {perSide ? (
          <BigStepper
            label="Per side lb"
            value={sideDraft !== null ? sideDraft : totalToSide(set.weight, bar)}
            placeholder={prev ? totalToSide(prev.weight, bar) : "0"}
            inputMode="decimal"
            onDec={() => stepWeight(-1)}
            onInc={() => stepWeight(1)}
            onChange={v => { setSideDraft(v); onChange("weight", sideToTotal(v, bar)); }}
            onBlur={() => setSideDraft(null)}
          />
        ) : (
          <BigStepper
            label={bw ? "Added lb" : "Weight lb"}
            value={bw && set.weight === "0" ? "" : set.weight}
            placeholder={bw ? "BW" : (prev ? String(prev.weight) : "0")}
            bwStyle={bw}
            inputMode="decimal"
            onDec={() => stepWeight(-1)}
            onInc={() => stepWeight(1)}
            onChange={v => onChange("weight", v)}
          />
        )}
        <BigStepper
          label="Reps"
          value={set.reps}
          placeholder={prev ? String(prev.reps) : "0"}
          inputMode="numeric"
          onDec={() => stepReps(-1)}
          onInc={() => stepReps(1)}
          onChange={v => onChange("reps", v)}
        />
      </div>

      {plates !== undefined ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", padding: "10px 4px 0", minHeight: 36 }}>
          {perSide ? (
            <span style={{ fontSize: 13, fontWeight: 750, color: c.ink, marginRight: 4 }}>
              <span className="num">{set.weight}</span> total
            </span>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 650, color: c.ink3, marginRight: 2 }}>Each side</span>
          )}
          {plates === null ? (
            <span style={{ fontSize: 12, color: c.ink3 }}>
              {Number(set.weight) < bar ? `Less than the ${bar} lb bar` : "Not loadable with standard plates"}
            </span>
          ) : plates.length === 0 ? (
            <span style={{ fontSize: 13, fontWeight: 700, color: c.ink2 }}>Empty bar</span>
          ) : plates.map((p, i) => (
            <span key={i} className="num" style={{
              minWidth: 30, padding: "3px 7px", borderRadius: 7, textAlign: "center",
              background: c.surface, fontSize: 13, fontWeight: 750, color: c.ink,
            }}>{p}</span>
          ))}
          <span style={{ flex: 1 }} />
          <button
            onClick={cycleBar}
            className="tap num"
            aria-label={`Bar weight ${bar} pounds. Tap to change.`}
            style={{ fontSize: 12, fontWeight: 700, color: c.ink3, padding: "4px 8px", borderRadius: 7, boxShadow: `inset 0 0 0 1.5px ${c.line}` }}
          >Bar {bar}</button>
        </div>
      ) : null}

      {set.done ? (
        <button
          onClick={onUndo}
          className="tap"
          style={{
            width: "100%", height: 50, marginTop: 10, borderRadius: 14,
            background: c.surface, color: c.ink2, fontSize: 15, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        ><Undo2 size={17} strokeWidth={2.4} /> Mark as not done</button>
      ) : (
        <button
          onClick={onLog}
          disabled={!ready}
          className="tap"
          style={{
            width: "100%", height: 54, marginTop: 10, borderRadius: 14,
            background: !ready ? c.line : wu ? c.ink : day.color,
            color: !ready ? c.ink3 : wu ? c.bg : day.on,
            fontSize: 17, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "background 200ms ease",
          }}
        ><Check size={20} strokeWidth={3} /> {wu ? "Log warm-up" : `Log set ${idx + 1}`}</button>
      )}
    </div>
  );
}

function BigStepper({ label, value, placeholder, bwStyle, inputMode, onDec, onInc, onChange, onBlur }) {
  const selectAll = e => {
    const el = e.currentTarget;
    try { el.select(); } catch {}
    setTimeout(() => { try { el.select(); } catch {} }, 0);
  };
  const len = String(value || placeholder || "").length;
  const size = len >= 4 ? 26 : len === 3 ? 32 : 38;
  const btn = {
    width: 36, height: 48, borderRadius: 12, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: c.inset, color: c.ink,
  };
  return (
    <div style={{ background: c.surface, borderRadius: 14, padding: "8px 5px 5px" }}>
      <div style={{ fontSize: 12, fontWeight: 650, color: c.ink3, textAlign: "center" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 2 }}>
        <button onClick={onDec} className="tap" aria-label={`Decrease ${label.toLowerCase()}`} style={btn}>
          <Minus size={18} strokeWidth={2.6} />
        </button>
        <input
          type="text"
          inputMode={inputMode}
          enterKeyHint="done"
          autoComplete="off"
          aria-label={label}
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(cleanNum(e.target.value, inputMode === "decimal"))}
          onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}
          onFocus={selectAll}
          onBlur={onBlur}
          className={`display num big-in${bwStyle ? " bw-input" : ""}`}
          style={{
            flex: 1, minWidth: 0, width: "100%",
            background: "transparent", border: "none", padding: 0,
            textAlign: "center", fontSize: size, color: c.ink,
            transition: "font-size 120ms ease",
          }}
        />
        <button onClick={onInc} className="tap" aria-label={`Increase ${label.toLowerCase()}`} style={btn}>
          <Plus size={18} strokeWidth={2.6} />
        </button>
      </div>
    </div>
  );
}

function BodyweightPrompt({ onSave }) {
  const [val, setVal] = useState("");
  const n = Number(val);
  const valid = n > 50 && n < 700;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", margin: "0 0 10px", borderRadius: 14, background: a(c.caution, 10) }}>
      <div style={{ flex: 1, fontSize: 13, color: c.ink2, lineHeight: 1.4 }}>
        Add your bodyweight so these sets count toward volume.
      </div>
      <input
        type="text"
        inputMode="decimal"
        aria-label="Bodyweight in pounds"
        value={val}
        placeholder="lb"
        onChange={e => setVal(cleanNum(e.target.value))}
        className="num"
        style={{ width: 68, padding: "8px 6px", borderRadius: 10, border: `1px solid ${c.line}`, background: c.surface, textAlign: "center", fontSize: 16, fontWeight: 700 }}
      />
      <button
        onClick={() => valid && onSave(n)}
        disabled={!valid}
        className="tap"
        style={{ padding: "9px 12px", borderRadius: 10, background: valid ? c.ink : c.line, color: valid ? c.bg : c.ink3, fontWeight: 700, fontSize: 13 }}
      >Save</button>
    </div>
  );
}

// Rest clock. Counts down, then keeps counting up so you can see how long you've rested.
function RestDock({ rest, day, onAdjust, onClear }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const diff = Math.ceil((rest.endsAt - now) / 1000);
  const over = diff <= 0;
  const secs = Math.abs(over ? Math.floor((now - rest.endsAt) / 1000) : diff);
  const pct = rest.total > 0 && !over ? Math.min(100, (diff / rest.total) * 100) : 0;
  const mm = Math.floor(secs / 60);
  const ss = String(secs % 60).padStart(2, "0");
  const ctl = {
    height: 44, minWidth: 52, padding: "0 12px", borderRadius: 12,
    background: c.inset, color: c.ink,
    fontSize: 14, fontWeight: 750,
    display: "flex", alignItems: "center", justifyContent: "center",
  };

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={over ? `Rest over by ${mm} minutes ${ss} seconds` : `${mm} minutes ${ss} seconds of rest left`}
      className="rise"
      style={{
        position: "relative", overflow: "hidden", borderRadius: 18,
        background: c.surface,
        border: `1.5px solid ${over ? day.color : c.lineSoft}`,
        boxShadow: "0 6px 20px rgba(0,0,0,0.14)",
        transition: "border-color 250ms ease",
      }}
    >
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 4, width: `${pct}%`, background: day.color, transition: "width 250ms linear" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 10px 12px 16px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="display num" style={{ fontSize: 40, color: over ? day.ink : c.ink }}>
            {over ? "+" : ""}{mm}:{ss}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: c.ink3, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {over ? "Rest's up, time since" : `Resting after ${rest.name}`}
          </div>
        </div>
        {!over ? (
          <>
            <button onClick={() => onAdjust(-15)} className="tap num" style={ctl} aria-label="Shorten rest by 15 seconds">−15</button>
            <button onClick={() => onAdjust(30)} className="tap num" style={ctl} aria-label="Add 30 seconds of rest">+30</button>
          </>
        ) : null}
        <button onClick={onClear} className="tap" style={ctl} aria-label={over ? "Hide rest clock" : "Skip rest"}>
          {over ? <X size={18} strokeWidth={2.6} /> : <SkipForward size={17} strokeWidth={2.4} />}
        </button>
      </div>
    </div>
  );
}

// One-line setup note under the exercise name: tap to edit
function NoteLine({ note, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(note);
  useEffect(() => { if (!editing) setVal(note); }, [note, editing]);
  if (editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px 12px" }}>
        <input
          autoFocus
          value={val}
          maxLength={80}
          onChange={e => setVal(e.target.value)}
          onBlur={() => { onSave(val); setEditing(false); }}
          onKeyDown={e => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") { setVal(note); setEditing(false); }
          }}
          placeholder="Seat 4, back pad 2, neutral grip"
          aria-label="Setup note"
          style={{ flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${c.line}`, background: c.surface, fontSize: 16 }}
        />
      </div>
    );
  }
  return (
    <button
      onClick={() => setEditing(true)}
      className="tap"
      style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "0 4px 12px", fontSize: 14, color: note ? c.ink2 : c.ink4 }}
    >
      <Pencil size={14} strokeWidth={2.2} style={{ flexShrink: 0 }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: note ? 600 : 500 }}>
        {note || "Add setup note"}
      </span>
    </button>
  );
}

function categoryForMuscle(m) {
  return { Chest: "Chest", Back: "Back", Shoulders: "Shoulders", Biceps: "Arms", Triceps: "Arms", Quads: "Legs", Hamstrings: "Legs", Calves: "Legs" }[m] || null;
}

function ExercisePicker({ onPick, prefer }) {
  const [q, setQ] = useState("");
  const [custom, setCustom] = useState(false);
  const [name, setName] = useState("");
  const query = q.trim().toLowerCase();
  const groups = useMemo(() => {
    const lib = prefer
      ? [...EXERCISE_LIBRARY.filter(g => g.category === prefer), ...EXERCISE_LIBRARY.filter(g => g.category !== prefer)]
      : EXERCISE_LIBRARY;
    if (!query) return lib;
    return lib
      .map(g => ({ ...g, items: g.items.filter(x => x.name.toLowerCase().includes(query)) }))
      .filter(g => g.items.length);
  }, [query, prefer]);

  if (custom) {
    return (
      <div>
        <label style={{ fontSize: 13, color: c.ink3, fontWeight: 600 }}>Exercise name</label>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Landmine Press"
          style={{ display: "block", width: "100%", marginTop: 6, padding: "13px 14px", borderRadius: 14, border: `1px solid ${c.line}`, background: c.surface, fontSize: 16 }}
        />
        <p style={{ fontSize: 13, color: c.ink3, margin: "8px 2px 16px" }}>Starts at 3 × 8–12 with 90 s rest.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setCustom(false)} className="tap" style={{ flex: 1, height: 50, borderRadius: 14, background: c.inset, fontWeight: 700 }}>Back</button>
          <button
            onClick={() => name.trim() && onPick({ name, sets: 3, reps: "8–12", rest: "90 s" })}
            disabled={!name.trim()}
            className="tap"
            style={{ flex: 2, height: 50, borderRadius: 14, background: name.trim() ? c.ink : c.line, color: name.trim() ? c.bg : c.ink3, fontWeight: 750 }}
          >Use this exercise</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={17} color={c.ink3} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search exercises"
          aria-label="Search exercises"
          style={{ width: "100%", padding: "13px 14px 13px 40px", borderRadius: 14, border: `1px solid ${c.line}`, background: c.surface, fontSize: 16 }}
        />
      </div>
      {groups.map(g => (
        <div key={g.category} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: c.ink3, margin: "0 2px 6px" }}>
            {g.category}{prefer === g.category && !query ? ", same muscle group" : ""}
          </div>
          <div className="card" style={{ overflow: "hidden" }}>
            {g.items.map((x, i) => (
              <button
                key={x.name}
                onClick={() => onPick(x)}
                className="tap"
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "13px 14px", textAlign: "left",
                  borderTop: i === 0 ? "none" : `1px solid ${c.lineSoft}`,
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 600 }}>{x.name}</span>
                <span className="num" style={{ fontSize: 13, color: c.ink3 }}>{x.sets} × {x.reps}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      {!groups.length ? <p style={{ fontSize: 14, color: c.ink3, textAlign: "center", margin: "8px 0 16px" }}>No match in the library.</p> : null}
      <button
        onClick={() => { setName(q); setCustom(true); }}
        className="tap"
        style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: `1.5px dashed ${c.line}`, fontWeight: 650, color: c.ink2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
      ><Plus size={16} strokeWidth={2.4} /> {query ? `Add “${q.trim()}” as custom` : "Custom exercise"}</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════════════════════
function ScreenTitle({ title, sub, right }) {
  return (
    <header style={{ padding: `calc(env(safe-area-inset-top) + ${TOP_GAP + 16}px) 20px 18px`, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
      <div>
        <h1 className="display" style={{ margin: 0, fontSize: 46 }}>{title}</h1>
        {sub ? <p style={{ margin: "8px 0 0", fontSize: 14, color: c.ink3 }}>{sub}</p> : null}
      </div>
      {right}
    </header>
  );
}

function HistoryScreen({ history, target, onOpen }) {
  const [filter, setFilter] = useState(() => HistoryScreen.lastFilter || "all");
  const [openMonths, setOpenMonths] = useState({});
  useEffect(() => { HistoryScreen.lastFilter = filter; }, [filter]);

  // PRs and headline lift per session, computed once per history change
  const meta = useMemo(() => {
    const m = new Map();
    const asc = [...history].sort((x, y) => x.startedAt - y.startedAt);
    const before = [];
    for (const w of asc) {
      const prs = detectSessionPRs(w, [...before].reverse());
      m.set(w.id, { prs: prs.length, lead: sessionHeadline(w) });
      before.push(w);
    }
    return m;
  }, [history]);

  const list = filter === "all" ? history : history.filter(w => w.dayId === filter);
  const mon = mondayOf(Date.now());
  const recentStart = addDays(mon, -7).getTime(); // this week and last week stay open

  const recent = list.filter(w => w.startedAt >= recentStart);
  const older = list.filter(w => w.startedAt < recentStart);
  const months = useMemo(() => {
    const map = new Map();
    for (const w of older) {
      const d = new Date(w.startedAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map.has(key)) {
        const sameYear = d.getFullYear() === new Date().getFullYear();
        map.set(key, { key, label: d.toLocaleDateString("en-US", sameYear ? { month: "long" } : { month: "long", year: "numeric" }), items: [] });
      }
      map.get(key).items.push(w);
    }
    return Array.from(map.values());
  }, [older.length, filter, history]);

  const dayLabel = filter === "all" ? "" : `${findDay(filter).label.toLowerCase()} `;
  const totalPRs = list.reduce((n, w) => n + ((meta.get(w.id) || {}).prs || 0), 0);

  return (
    <div className="rise">
      <ScreenTitle
        title="History"
        sub={`${list.length} ${dayLabel}session${list.length === 1 ? "" : "s"}${totalPRs ? `, ${totalPRs} PR${totalPRs === 1 ? "" : "s"}` : ""}`}
      />

      {history.length ? (
        <div style={{ display: "flex", gap: 8, padding: "0 20px 18px", overflowX: "auto" }}>
          {[{ id: "all", label: "All" }, ...DAYS].map(d => {
            const on = filter === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setFilter(d.id)}
                className="tap"
                aria-pressed={on}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7, flexShrink: 0,
                  height: 38, padding: "0 15px", borderRadius: 99,
                  fontSize: 14, fontWeight: 750,
                  background: on ? c.ink : c.surface,
                  color: on ? c.bg : c.ink2,
                  boxShadow: on ? "none" : `inset 0 0 0 1px ${c.lineSoft}`,
                }}
              >
                {d.color ? <span style={{ width: 9, height: 9, borderRadius: 99, background: d.color }} /> : null}
                {d.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {!history.length ? (
        <div style={{ padding: "0 20px" }}>
          <EmptyState icon={<ClipboardList size={20} />} title="Nothing logged yet" sub="Finished workouts show up here. Start one from Today." />
        </div>
      ) : (
        <>
          {history.some(w => w.startedAt >= addDays(mondayOf(Date.now()), -77).getTime()) ? (
            <TrainingGrid history={history} filter={filter} onOpen={onOpen} />
          ) : null}

          {!list.length ? (
            <div style={{ padding: "0 20px" }}>
              <EmptyState icon={<ClipboardList size={20} />} title={`No ${dayLabel}sessions yet`} sub="They'll show up here once you log one." />
            </div>
          ) : null}

          {weekGroups(recent).map(g => (
            <WeekGroup key={g.start} group={g} target={filter === "all" ? target : null} meta={meta} onOpen={onOpen} />
          ))}

          {months.length ? (
            <Section title={recent.length ? "Earlier" : null}>
              <div className="card" style={{ overflow: "hidden" }}>
                {months.map((m, i) => {
                  const open = !!openMonths[m.key];
                  const prs = m.items.reduce((n, w) => n + ((meta.get(w.id) || {}).prs || 0), 0);
                  const byDay = DAYS.map(d => ({ d, n: m.items.filter(w => w.dayId === d.id).length })).filter(x => x.n);
                  return (
                    <div key={m.key} style={{ borderTop: i === 0 ? "none" : `1px solid ${c.lineSoft}` }}>
                      <button
                        onClick={() => setOpenMonths(o => ({ ...o, [m.key]: !o[m.key] }))}
                        className="tap"
                        aria-expanded={open}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "15px 16px", textAlign: "left", background: open ? c.inset : "transparent", transition: "background 200ms ease" }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 16, fontWeight: 750 }}>{m.label}</div>
                          <div className="num" style={{ fontSize: 13, color: c.ink3, marginTop: 2 }}>
                            {m.items.length} session{m.items.length === 1 ? "" : "s"}{prs ? `, ${prs} PR${prs === 1 ? "" : "s"}` : ""}
                          </div>
                        </div>
                        <div aria-hidden="true" style={{ display: "flex", gap: 3 }}>
                          {byDay.map(x => (
                            <span key={x.d.id} className="num" style={{
                              minWidth: 22, height: 22, padding: "0 6px", borderRadius: 99,
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              background: a(x.d.color, 16), color: x.d.ink, fontSize: 12, fontWeight: 800,
                            }}>{x.n}</span>
                          ))}
                        </div>
                        <ChevronRight size={18} color={c.ink4} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 200ms ease" }} />
                      </button>
                      <Collapse open={open}>
                        {/* Recessed panel with white week cards, so the month reads as opened */}
                        <div style={{ background: c.inset, padding: "4px 10px 12px", borderTop: `1px solid ${c.lineSoft}` }}>
                          {weekGroups(m.items).map(g => (
                            <WeekGroup key={g.start} group={g} target={filter === "all" ? target : null} meta={meta} onOpen={onOpen} nested />
                          ))}
                        </div>
                      </Collapse>
                    </div>
                  );
                })}
              </div>
            </Section>
          ) : null}
        </>
      )}
    </div>
  );
}

// Group sessions (newest first) into Monday-start weeks
function weekGroups(sessions) {
  const map = new Map();
  for (const w of sessions) {
    const start = mondayOf(w.startedAt).getTime();
    if (!map.has(start)) map.set(start, { start, items: [] });
    map.get(start).items.push(w);
  }
  return Array.from(map.values()).sort((x, y) => y.start - x.start);
}

function weekLabel(start) {
  const s = new Date(start);
  const e = addDays(s, 6);
  const thisMon = mondayOf(Date.now()).getTime();
  if (start === thisMon) return "This week";
  if (start === addDays(new Date(thisMon), -7).getTime()) return "Last week";
  const m1 = s.toLocaleDateString("en-US", { month: "short" });
  const m2 = e.toLocaleDateString("en-US", { month: "short" });
  return m1 === m2 ? `${m1} ${s.getDate()}–${e.getDate()}` : `${m1} ${s.getDate()} – ${m2} ${e.getDate()}`;
}

function WeekGroup({ group, target, meta, onOpen, nested }) {
  const n = group.items.length;
  const vol = group.items.reduce((s, w) => s + workoutVolume(w), 0);
  const hit = target && n >= target;
  const header = (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, padding: nested ? "8px 6px 8px" : "0 4px 10px" }}>
      <span style={{ fontSize: nested ? 14 : 17, fontWeight: nested ? 750 : 700, letterSpacing: "-0.01em", color: nested ? c.ink2 : c.ink }}>
        {weekLabel(group.start)}
      </span>
      <span className="num" style={{ fontSize: 13, color: c.ink3, display: "inline-flex", alignItems: "center", gap: 6 }}>
        {target ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: hit ? c.good : c.ink3, fontWeight: 700 }}>
            {hit ? <Check size={14} strokeWidth={3} /> : null}{n} of {target}
          </span>
        ) : `${n} session${n === 1 ? "" : "s"}`}
        <span>{fmtNum(vol)} lb</span>
      </span>
    </div>
  );
  const rows = group.items.map((w, i) => (
    <SessionRow key={w.id} w={w} meta={meta.get(w.id)} first={i === 0} onOpen={onOpen} />
  ));
  if (nested) {
    return (
      <div style={{ marginTop: 8 }}>
        {header}
        <div style={{ background: c.surface, borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>{rows}</div>
      </div>
    );
  }
  return (
    <section style={{ padding: "0 20px", marginBottom: 24 }}>
      {header}
      <div className="card" style={{ overflow: "hidden" }}>{rows}</div>
    </section>
  );
}

function SessionRow({ w, meta, first, onOpen }) {
  const day = findDay(w.dayId);
  const d = new Date(w.startedAt);
  const m = meta || { prs: 0, lead: null };
  return (
    <button
      onClick={() => onOpen(w)}
      className="tap"
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 12,
        padding: "13px 16px", textAlign: "left",
        borderTop: first ? "none" : `1px solid ${c.lineSoft}`,
      }}
    >
      <span aria-hidden="true" style={{ width: 4, alignSelf: "stretch", minHeight: 36, borderRadius: 2, background: day ? day.color : c.ink4, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 750 }}>{day ? day.label : "Workout"}</span>
          <span className="num" style={{ fontSize: 13, color: c.ink3, flexShrink: 0 }}>
            {d.toLocaleDateString("en-US", { weekday: "short" })} {d.getDate()}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 3 }}>
          <span className="num" style={{ fontSize: 13, color: c.ink2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
            {m.lead || `${workoutSets(w)} sets`}
          </span>
          {m.prs ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0, fontSize: 12, fontWeight: 800, color: c.good, background: a(c.good, 12), padding: "2px 7px", borderRadius: 6 }}>
              <Trophy size={11} strokeWidth={2.8} /> {m.prs} PR{m.prs === 1 ? "" : "s"}
            </span>
          ) : (
            <span className="num" style={{ fontSize: 12, color: c.ink4, flexShrink: 0 }}>{fmtNum(workoutVolume(w))} lb</span>
          )}
        </div>
      </div>
      <ChevronRight size={17} color={c.ink4} style={{ flexShrink: 0 }} />
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DETAIL
// ═══════════════════════════════════════════════════════════════════════════
function DetailScreen({ workout, history, onBack, onDelete, onEdit }) {
  const day = findDay(workout.dayId) || DAYS[0];
  const [editing, setEditing] = useState(null); // { ei, si } — si === -1 adds a set

  function saveSet(ei, si, patch) {
    const exercises = workout.exercises.map((ex, i) => {
      if (i !== ei) return ex;
      if (si < 0) return { ...ex, sets: [...ex.sets, { weight: "", reps: "", ...patch, done: true }] };
      return { ...ex, sets: ex.sets.map((s, j) => (j === si ? { ...s, ...patch, done: true } : s)) };
    });
    onEdit({ ...workout, exercises });
    setEditing(null);
  }
  function deleteSet(ei, si) {
    const exercises = workout.exercises
      .map((ex, i) => (i === ei ? { ...ex, sets: ex.sets.filter((_, j) => j !== si) } : ex))
      .filter(ex => ex.sets.length > 0);
    onEdit({ ...workout, exercises });
    setEditing(null);
  }
  const prior = (history || []).filter(w => w.id !== workout.id && w.startedAt < workout.startedAt);
  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>
      <div style={{ position: "relative", overflow: "hidden", background: day.color, color: day.on, padding: `calc(env(safe-area-inset-top) + ${TOP_GAP}px) 8px 22px` }}>
        <PlateRings size={240} style={{ right: -80, top: -40 }} />
        <IconButton label="Back to history" onClick={onBack} style={{ color: day.on }}><ChevronLeft size={26} strokeWidth={2.2} /></IconButton>
        <div style={{ position: "relative", padding: "8px 12px 0" }}>
          <div style={{ fontSize: 14, fontWeight: 650, opacity: 0.85 }}>{fmtLong(workout.startedAt)}</div>
          <div className="display" style={{ fontSize: 64, marginTop: 6 }}>{day.label}</div>
        </div>
      </div>

      <div style={{ padding: "20px 20px 8px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Stat label="Sets" value={workoutSets(workout)} />
        <Stat label="Time" value={workout.completedAt ? fmtDur(workout.completedAt - workout.startedAt) : "—"} />
        <Stat label="Volume" value={fmtNum(workoutVolume(workout))} unit="lb" />
      </div>

      <div style={{ padding: "14px 20px 0" }}>
        {(workout.exercises || []).map((ex, i) => {
          const bw = exIsBW(ex);
          return (
            <div key={i} className="card" style={{ padding: "14px 16px", marginBottom: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{ex.name}</div>
              {ex.swappedFrom ? <div style={{ fontSize: 13, color: day.ink, marginTop: 2 }}>Swapped in for {ex.swappedFrom}</div> : null}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {ex.sets.map((s, j) => (
                  <button
                    key={j}
                    onClick={() => setEditing({ ei: i, si: j })}
                    className="tap num"
                    aria-label={`Edit ${s.warmup ? "warm-up" : `set ${j + 1}`}`}
                    style={{
                      padding: "6px 10px", borderRadius: 10, background: c.inset,
                      fontSize: 15, fontWeight: 700, color: s.warmup ? c.ink3 : c.ink,
                    }}
                  >{s.warmup ? "W " : ""}{fmtSetShort(s.weight === "" ? "0" : s.weight, bw)} × {s.reps || "—"}{s.rir !== undefined && s.rir !== null ? <span style={{ color: c.ink4, fontWeight: 650 }}>{Number(s.rir) === 0 ? " F" : ` @${s.rir}`}</span> : null}</button>
                ))}
                <button
                  onClick={() => setEditing({ ei: i, si: -1 })}
                  className="tap"
                  aria-label={`Add a set to ${ex.name}`}
                  style={{ padding: "6px 10px", borderRadius: 10, boxShadow: `inset 0 0 0 1.5px ${c.line}`, color: c.ink3, display: "flex", alignItems: "center" }}
                ><Plus size={16} strokeWidth={2.4} /></button>
              </div>
            </div>
          );
        })}

        <p style={{ fontSize: 13, color: c.ink3, textAlign: "center", margin: "4px 0 12px" }}>Tap a set to fix it.</p>
        <CopyForClaudeButton
          getText={() => buildSessionText(workout, prior, null)}
          label="Copy session for Claude"
          style={{ width: "100%", marginTop: 8 }}
        />
        <button
          onClick={() => onDelete(workout.id)}
          className="tap"
          style={{ width: "100%", height: 50, marginTop: 10, borderRadius: 14, color: c.danger, fontWeight: 650, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        ><Trash2 size={16} /> Delete workout</button>
      </div>

      {editing ? (() => {
        const ex = workout.exercises[editing.ei];
        const adding = editing.si < 0;
        const src = adding ? (ex.sets[ex.sets.length - 1] || { weight: "", reps: "" }) : ex.sets[editing.si];
        return (
          <BottomSheet title={adding ? `Add a set to ${ex.name}` : ex.name} onClose={() => setEditing(null)}>
            <EditSetForm
              set={src}
              bw={exIsBW(ex)}
              isNew={adding}
              canDelete={!adding}
              onSave={patch => saveSet(editing.ei, editing.si, patch)}
              onDelete={() => deleteSet(editing.ei, editing.si)}
            />
          </BottomSheet>
        );
      })() : null}
    </div>
  );
}

function EditSetForm({ set, bw, isNew, canDelete, onSave, onDelete }) {
  const [weight, setWeight] = useState(bw && set.weight === "0" ? "" : String(set.weight ?? ""));
  const [reps, setReps] = useState(String(set.reps ?? ""));
  const [warmup, setWarmup] = useState(!!set.warmup && !isNew);
  const ready = reps !== "" && Number(reps) > 0 && (bw || weight !== "");
  const step = 5;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: c.inset, padding: 10, borderRadius: 18 }}>
        <BigStepper
          label={bw ? "Added lb" : "Weight lb"}
          value={weight}
          placeholder={bw ? "BW" : "0"}
          bwStyle={bw}
          inputMode="decimal"
          onDec={() => setWeight(String(Math.max(0, (Number(weight) || 0) - step)))}
          onInc={() => setWeight(String((Number(weight) || 0) + step))}
          onChange={setWeight}
        />
        <BigStepper
          label="Reps"
          value={reps}
          placeholder="0"
          inputMode="numeric"
          onDec={() => setReps(String(Math.max(0, (Number(reps) || 0) - 1)))}
          onInc={() => setReps(String((Number(reps) || 0) + 1))}
          onChange={setReps}
        />
      </div>
      <button
        onClick={() => setWarmup(!warmup)}
        className="tap"
        aria-pressed={warmup}
        style={{ marginTop: 12, fontSize: 13, fontWeight: 750, padding: "7px 12px", borderRadius: 99, background: warmup ? c.ink : "transparent", color: warmup ? c.bg : c.ink3, boxShadow: warmup ? "none" : `inset 0 0 0 1.5px ${c.line}` }}
      >Warm-up set</button>
      <button
        onClick={() => ready && onSave({ weight: bw && weight === "" ? "0" : weight, reps, warmup })}
        disabled={!ready}
        className="tap"
        style={{ width: "100%", height: 54, marginTop: 16, borderRadius: 16, background: ready ? c.ink : c.line, color: ready ? c.bg : c.ink3, fontSize: 16, fontWeight: 800 }}
      >{isNew ? "Add set" : "Save changes"}</button>
      {canDelete ? (
        <button onClick={onDelete} className="tap" style={{ width: "100%", height: 48, marginTop: 6, color: c.danger, fontWeight: 700 }}>Delete this set</button>
      ) : null}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS
// ═══════════════════════════════════════════════════════════════════════════
// Direct sets per muscle, this week or last, against a 10–20 weekly range
function MuscleSets({ history }) {
  const [which, setWhich] = useState("this");
  const mon = mondayOf(Date.now());
  const monKey = mon.getTime();
  const thisWeek = useMemo(() => setsByMuscle(history, mon, addDays(mon, 7)), [history, monKey]);
  const lastWeek = useMemo(() => setsByMuscle(history, addDays(mon, -7), mon), [history, monKey]);
  const data = which === "this" ? thisWeek : lastWeek;
  const LOW = 10, HIGH = 20, MAX = 26;
  const pos = v => `${Math.min(100, (v / MAX) * 100)}%`;
  const inRangeCount = MUSCLES.filter(m => data[m] >= LOW && data[m] <= HIGH).length;

  return (
    <Section title="Sets per muscle" aside={`${inRangeCount} of ${MUSCLES.length} in 10–20`}>
      <div className="card" style={{ padding: 18 }}>
        <Segmented
          value={which}
          onChange={setWhich}
          options={[{ value: "this", label: "This week" }, { value: "last", label: "Last week" }]}
          style={{ marginBottom: 18 }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {MUSCLES.map(m => {
            const v = data[m];
            const inRange = v >= LOW && v <= HIGH;
            const color = v === 0 ? c.inset : inRange ? c.good : v > HIGH ? c.caution : c.ink3;
            return (
              <div key={m} style={{ display: "grid", gridTemplateColumns: "88px 1fr 34px", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: c.ink2 }}>{m}</span>
                <div style={{ position: "relative", height: 12, borderRadius: 6, background: c.inset }}>
                  <div style={{
                    position: "absolute", top: -3, bottom: -3,
                    left: pos(LOW), width: `calc(${pos(HIGH)} - ${pos(LOW)})`,
                    borderRadius: 4, background: a(c.good, 12),
                  }} />
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0,
                    width: pos(v), borderRadius: 6, background: color,
                    transition: "width 400ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }} />
                </div>
                <span className="num" style={{ fontSize: 15, fontWeight: 750, textAlign: "right", color: inRange ? c.good : c.ink }}>{fmtSets(v)}</span>
              </div>
            );
          })}
        </div>
        <p style={{ margin: "16px 0 0", fontSize: 12, color: c.ink3, lineHeight: 1.45 }}>
          Warm-ups excluded. Secondary muscles count as half a set, so bench adds 1 to chest and 0.5 to triceps and shoulders.
        </p>
      </div>
    </Section>
  );
}

function ExerciseListSheet({ current, otherNames, history, onPick, onClose }) {
  const count = name => history.reduce((n, w) => n + ((w.exercises || []).some(e => e.name === name) ? 1 : 0), 0);
  const row = (name, i) => (
    <button
      key={name}
      onClick={() => onPick(name)}
      className="tap"
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        padding: "13px 14px", textAlign: "left",
        borderTop: i === 0 ? "none" : `1px solid ${c.lineSoft}`,
        background: name === current ? c.inset : "transparent",
      }}
    >
      <span style={{ fontSize: 15, fontWeight: name === current ? 800 : 600 }}>{name}</span>
      <span className="num" style={{ fontSize: 13, color: c.ink3, flexShrink: 0 }}>{count(name) || "—"}</span>
    </button>
  );
  return (
    <BottomSheet title="Choose an exercise" onClose={onClose}>
      {DAYS.map(d => (
        <div key={d.id} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 2px 8px" }}>
            <MiniPlate color={d.color} on={d.on} size={18} />
            <span style={{ fontSize: 14, fontWeight: 750 }}>{d.label}</span>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: c.ink3 }}>sessions</span>
          </div>
          <div className="card" style={{ overflow: "hidden" }}>{d.exercises.map((e, i) => row(e.name, i))}</div>
        </div>
      ))}
      {otherNames.length ? (
        <div>
          <div style={{ fontSize: 14, fontWeight: 750, margin: "0 2px 8px" }}>No longer in routine</div>
          <div className="card" style={{ overflow: "hidden" }}>{otherNames.map((n, i) => row(n, i))}</div>
        </div>
      ) : null}
    </BottomSheet>
  );
}

// Name used in the greeting; saves when you leave the field
function NameRow() {
  const [val, setVal] = useState(SETTINGS.name || "");
  const commit = () => {
    const v = val.trim().slice(0, 24);
    setVal(v);
    if (v !== (SETTINGS.name || "")) saveSettings({ name: v });
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 650 }}>Name</div>
        <div style={{ fontSize: 13, color: c.ink3, marginTop: 1 }}>Shown in the greeting on Today</div>
      </div>
      <input
        type="text"
        value={val}
        placeholder="Your name"
        aria-label="Your name"
        autoComplete="given-name"
        autoCapitalize="words"
        enterKeyHint="done"
        maxLength={24}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}
        style={{ width: 150, height: 44, padding: "0 12px", borderRadius: 12, border: `1px solid ${c.line}`, background: c.surface, textAlign: "right", fontSize: 16, fontWeight: 650 }}
      />
    </div>
  );
}

function DataView({
  history, bodyweight, onBodyweightChange, themePref, onThemeChange,
  onExportClaude, onCopyClaude, onExportExcel, onBackup, onRestore, daysSince, onEditRoutine,
  target, onTargetChange,
}) {
  const restoreRef = useRef(null);
  const [exportState, setExportState] = useState("idle");
  const [copyState, setCopyState] = useState("idle"); // idle | copied | failed
  async function runCopy() {
    const ok = await onCopyClaude();
    setCopyState(ok ? "copied" : "failed");
    setTimeout(() => setCopyState("idle"), 3000);
  }
  const [bwVal, setBwVal] = useState(bodyweight ? String(bodyweight) : "");
  useEffect(() => { setBwVal(bodyweight ? String(bodyweight) : ""); }, [bodyweight]);

  async function runExport() {
    setExportState("working");
    const r = await onExportClaude();
    setExportState(r === "cancelled" ? "idle" : "done");
    setTimeout(() => setExportState("idle"), 2500);
  }
  function commitBw() {
    const n = Number(bwVal);
    if (bwVal === "") onBodyweightChange(0);
    else if (n > 50 && n < 700) onBodyweightChange(n);
    else setBwVal(bodyweight ? String(bodyweight) : "");
  }
  const rowBtn = {
    height: 44, padding: "0 16px", borderRadius: 12,
    background: c.inset, fontSize: 14, fontWeight: 700,
    display: "inline-flex", alignItems: "center", gap: 6,
  };
  const totalSetsAll = history.reduce((s, w) => s + workoutSets(w), 0);

  return (
    <div>
      <Section title="Your routine" aside={SETTINGS.routine ? "edited" : "original"}>
        <div className="card" style={{ overflow: "hidden" }}>
          {DAYS.map((d, i) => (
            <button
              key={d.id}
              onClick={() => onEditRoutine(d.id)}
              className="tap"
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", textAlign: "left", borderTop: i === 0 ? "none" : `1px solid ${c.lineSoft}` }}
            >
              <MiniPlate color={d.color} on={d.on} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{d.label}</div>
                <div style={{ fontSize: 13, color: c.ink3, marginTop: 1 }}>
                  {d.exercises.length} exercises, {d.exercises.reduce((n, e) => n + (Number(e.sets) || 0), 0)} sets
                </div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 650, color: c.ink2 }}>Edit</span>
              <ChevronRight size={18} color={c.ink4} />
            </button>
          ))}
        </div>
      </Section>

      <Section>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: c.ink, color: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 750 }}>Send to Claude</div>
              <div className="num" style={{ fontSize: 13, color: c.ink3, marginTop: 1 }}>
                {history.length} sessions, {totalSetsAll} working sets
              </div>
            </div>
          </div>
          <p style={{ fontSize: 14, color: c.ink2, lineHeight: 1.5, margin: "14px 0 16px" }}>
            Your program, every session set by set, progress per exercise and weekly sets per muscle. One tap copies it all; paste it into a chat.
          </p>
          <button
            onClick={runCopy}
            disabled={!history.length}
            className="tap"
            style={{
              width: "100%", height: 54, borderRadius: 16,
              background: !history.length ? c.line : copyState === "copied" ? c.good : copyState === "failed" ? c.danger : c.ink,
              color: history.length ? (copyState === "idle" ? c.bg : "#fff") : c.ink3,
              fontSize: 16, fontWeight: 750,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background 200ms ease",
            }}
          >
            {copyState === "copied" ? <><Check size={19} strokeWidth={2.8} /> Copied, paste it into Claude</>
              : copyState === "failed" ? <>Couldn't copy, save the file instead</>
              : <><Copy size={18} strokeWidth={2.3} /> Copy everything</>}
          </button>
          <button
            onClick={runExport}
            disabled={!history.length || exportState === "working"}
            className="tap"
            style={{
              width: "100%", height: 44, marginTop: 6, borderRadius: 14,
              fontSize: 14, fontWeight: 650, color: c.ink2,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {exportState === "done" ? <><Check size={16} strokeWidth={2.8} /> Saved</> : <><Download size={16} strokeWidth={2.3} /> Or save as a .txt file</>}
          </button>
        </div>
      </Section>

      <Section title="Your numbers">
        <div className="card" style={{ overflow: "hidden" }}>
          <NameRow />
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderTop: `1px solid ${c.lineSoft}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 650 }}>Bodyweight</div>
              <div style={{ fontSize: 13, color: c.ink3, marginTop: 1 }}>Used for pull-up volume</div>
            </div>
            <input
              type="text"
              inputMode="decimal"
              aria-label="Bodyweight in pounds"
              value={bwVal}
              placeholder="—"
              onChange={e => setBwVal(cleanNum(e.target.value))}
              onBlur={commitBw}
              onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}
              className="num"
              style={{ width: 76, height: 44, borderRadius: 12, border: `1px solid ${c.line}`, background: c.surface, textAlign: "center", fontSize: 16, fontWeight: 750 }}
            />
            <span style={{ fontSize: 14, color: c.ink3 }}>lb</span>
          </div>
          {onTargetChange ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderTop: `1px solid ${c.lineSoft}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 650 }}>Weekly target</div>
                <div style={{ fontSize: 13, color: c.ink3, marginTop: 1 }}>Sessions per week for your streak</div>
              </div>
              <IconButton label="Lower weekly target" onClick={() => onTargetChange(target - 1)} style={{ color: target <= 1 ? c.ink4 : c.ink }}><Minus size={18} strokeWidth={2.4} /></IconButton>
              <span className="num" style={{ minWidth: 20, textAlign: "center", fontSize: 17, fontWeight: 800 }}>{target}</span>
              <IconButton label="Raise weekly target" onClick={() => onTargetChange(target + 1)} style={{ color: target >= 7 ? c.ink4 : c.ink }}><Plus size={18} strokeWidth={2.4} /></IconButton>
            </div>
          ) : null}
          <div style={{ padding: "14px 16px", borderTop: `1px solid ${c.lineSoft}` }}>
            <div style={{ fontSize: 15, fontWeight: 650, marginBottom: 10 }}>Appearance</div>
            <Segmented
              value={themePref}
              onChange={onThemeChange}
              options={[{ value: "system", label: "Auto" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]}
            />
          </div>
        </div>
      </Section>

      <Section title="Backup" aside={daysSince === Infinity ? "never backed up" : daysSince === 0 ? "backed up today" : `last ${daysSince}d ago`}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: STORE_MODE === "claude" ? c.good : c.caution }}>
            <Shield size={16} strokeWidth={2.4} />
            {STORE_MODE === "claude" ? "Saving to your Claude storage" : "Saving on this device only"}
          </div>
          <p style={{ margin: "0 0 14px", fontSize: 14, color: c.ink2, lineHeight: 1.5 }}>
            {STORE_MODE === "claude"
              ? "Your log is kept in Claude's artifact storage, so updates to the app shouldn't wipe it. A backup file is still a good idea now and then."
              : "Your log lives in this browser only. Save a backup file now and then, and before opening a new version of the app."}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={onBackup} disabled={!history.length} className="tap" style={rowBtn}><Download size={16} /> Save backup</button>
            <button onClick={() => restoreRef.current && restoreRef.current.click()} className="tap" style={rowBtn}><Upload size={16} /> Restore</button>
            <button onClick={onExportExcel} disabled={!history.length} className="tap" style={rowBtn}><BarChart3 size={16} /> Excel</button>
          </div>
          <input
            ref={restoreRef}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={e => { const f = e.target.files && e.target.files[0]; if (f) onRestore(f); e.target.value = ""; }}
          />
        </div>
      </Section>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// TRAINING GRID — last 12 weeks, one square per day; tap a day to open it
// ═══════════════════════════════════════════════════════════════════════════
function TrainingGrid({ history, filter = "all", onOpen }) {
  const WEEKS = 12;
  const mon = mondayOf(Date.now());
  const start = addDays(mon, -7 * (WEEKS - 1));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const byDate = new Map();
  for (const w of history) {
    if (filter !== "all" && w.dayId !== filter) continue;
    const d = new Date(w.startedAt); d.setHours(0, 0, 0, 0);
    if (!byDate.has(d.getTime())) byDate.set(d.getTime(), w); // history is newest first
  }
  const cols = Array.from({ length: WEEKS }, (_, wi) =>
    Array.from({ length: 7 }, (_, di) => {
      const d = addDays(start, wi * 7 + di); d.setHours(0, 0, 0, 0);
      return { d, w: byDate.get(d.getTime()), future: d > today, today: d.getTime() === today.getTime() };
    })
  );
  const count = Array.from(byDate.keys()).filter(t => t >= start.getTime()).length;
  const monthMarks = cols.map((col, i) => {
    const first = col[0].d;
    const prev = i ? cols[i - 1][0].d : null;
    return !prev || prev.getMonth() !== first.getMonth() ? first.toLocaleDateString("en-US", { month: "short" }) : "";
  });

  return (
    <Section title="Last 12 weeks" aside={`${count} session${count === 1 ? "" : "s"}, tap a day to open`}>
      <div className="card" style={{ padding: "14px 14px 12px" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${WEEKS}, 1fr)`, gap: 4, marginBottom: 6 }}>
          {monthMarks.map((m, i) => (
            <span key={i} style={{ fontSize: 10, fontWeight: 700, color: c.ink3, whiteSpace: "nowrap", overflow: "visible" }}>{m}</span>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${WEEKS}, 1fr)`, gap: 4 }}>
          {cols.map((col, i) => (
            <div key={i} style={{ display: "grid", gridTemplateRows: "repeat(7, auto)", gap: 4 }}>
              {col.map((cell, j) => {
                const day = cell.w ? findDay(cell.w.dayId) : null;
                const style = {
                  aspectRatio: "1 / 1", borderRadius: 5, width: "100%", padding: 0,
                  background: day ? day.color : cell.future ? "transparent" : c.inset,
                  boxShadow: cell.today ? `0 0 0 1.5px ${c.ink}` : "none",
                };
                return cell.w ? (
                  <button
                    key={j}
                    onClick={() => onOpen(cell.w)}
                    className="tap"
                    aria-label={`${day ? day.label : "Workout"}, ${cell.d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`}
                    style={style}
                  />
                ) : <div key={j} style={style} />;
              })}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTINE EDITOR — changes save as you go
// ═══════════════════════════════════════════════════════════════════════════
const REST_OPTIONS = ["60 s", "90 s", "2 min", "3 min"];

function RoutineScreen({ day, isCustom, onChange, onRename, onReset, onBack }) {
  const [list, setList] = useState(() => day.exercises.map((e, i) => ({ ...e, _k: `${i}-${e.name}` })));
  const [openK, setOpenK] = useState(null);
  const [picking, setPicking] = useState(false);

  const commit = next => { setList(next); onChange(next.map(({ _k, ...e }) => e)); };
  const update = (k, patch) => commit(list.map(e => (e._k === k ? { ...e, ...patch } : e)));
  const move = (k, dir) => {
    const i = list.findIndex(e => e._k === k);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };
  const remove = k => commit(list.filter(e => e._k !== k));
  const add = item => {
    const name = item.name.trim();
    if (!name) return;
    const e = { name, sets: 3, reps: "8–12", rest: item.rest || "90 s", ...(isBodyweight(name) ? { bw: true } : {}), _k: `n${Date.now()}` };
    commit([...list, e]);
    setOpenK(e._k);
    setPicking(false);
  };
  const rename = (k, oldName, raw) => {
    const n = raw.trim();
    if (!n || n === oldName) return false;
    if (list.some(e => e._k !== k && e.name === n)) return false;
    commit(list.map(e => (e._k === k ? { ...e, name: n } : e)));
    onRename(oldName, n);
    return true;
  };
  const totalSets = list.reduce((n, e) => n + (Number(e.sets) || 0), 0);

  return (
    <div className="fade-in" style={{ paddingBottom: 60 }}>
      <header style={{
        position: "sticky", top: 0, zIndex: 100, background: a(c.bg, 88),
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        padding: `calc(env(safe-area-inset-top) + ${TOP_GAP}px) 8px 6px`,
      }}>
        <IconButton label="Back" onClick={onBack}><ChevronLeft size={26} strokeWidth={2.2} /></IconButton>
      </header>
      <div style={{ padding: "0 20px 18px", display: "flex", alignItems: "center", gap: 14 }}>
        <MiniPlate color={day.color} on={day.on} size={44} />
        <div>
          <h1 className="display" style={{ margin: 0, fontSize: 44, fontStretch: "88%" }}>{day.label} routine</h1>
          <p className="num" style={{ margin: "8px 0 0", fontSize: 14, color: c.ink3 }}>
            {list.length} exercises, {totalSets} sets. Saves as you go.
          </p>
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        {list.map((e, i) => (
          <RoutineRow
            key={e._k}
            ex={e}
            idx={i}
            last={i === list.length - 1}
            day={day}
            open={openK === e._k}
            onToggle={() => setOpenK(openK === e._k ? null : e._k)}
            onUpdate={patch => update(e._k, patch)}
            onRename={raw => rename(e._k, e.name, raw)}
            onMove={dir => move(e._k, dir)}
            onRemove={() => remove(e._k)}
          />
        ))}

        <button
          onClick={() => setPicking(true)}
          className="tap"
          style={{
            width: "100%", marginTop: 4, padding: "16px 0", borderRadius: 18,
            border: `1.5px dashed ${c.line}`, color: c.ink2, fontSize: 15, fontWeight: 650,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        ><Plus size={17} strokeWidth={2.4} /> Add exercise</button>

        <p style={{ fontSize: 13, color: c.ink3, lineHeight: 1.5, margin: "18px 4px 0" }}>
          Renaming keeps its history, notes and "last time" numbers. Removing an exercise hides it from this day; its history stays in Progress.
        </p>
        {isCustom ? (
          <button onClick={onReset} className="tap" style={{ width: "100%", height: 48, marginTop: 10, color: c.danger, fontWeight: 700 }}>
            Reset {day.label} to original
          </button>
        ) : null}
      </div>

      {picking ? (
        <BottomSheet title={`Add to ${day.label}`} onClose={() => setPicking(false)}>
          <ExercisePicker onPick={add} />
        </BottomSheet>
      ) : null}
    </div>
  );
}

function RoutineRow({ ex, idx, last, day, open, onToggle, onUpdate, onRename, onMove, onRemove }) {
  const [name, setName] = useState(ex.name);
  useEffect(() => { setName(ex.name); }, [ex.name]);
  const sets = Number(ex.sets) || 3;
  const chip = on => ({
    padding: "8px 12px", borderRadius: 99, fontSize: 13, fontWeight: 750,
    background: on ? c.ink : "transparent", color: on ? c.bg : c.ink2,
    boxShadow: on ? "none" : `inset 0 0 0 1.5px ${c.line}`,
  });
  const label = { fontSize: 12, fontWeight: 700, color: c.ink3, margin: "14px 0 6px" };
  const iconBtn = { width: 44, height: 40, borderRadius: 12, background: c.inset, display: "flex", alignItems: "center", justifyContent: "center", color: c.ink };

  return (
    <div className="card" style={{ marginBottom: 10, overflow: "hidden", borderColor: open ? a(day.color, 45) : undefined }}>
      <button onClick={onToggle} aria-expanded={open} className="tap" style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", textAlign: "left" }}>
        <span className="num" style={{
          width: 28, height: 28, borderRadius: 99, flexShrink: 0, fontSize: 13, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: a(day.color, 14), color: day.ink,
        }}>{idx + 1}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.name}</div>
          <div className="num" style={{ fontSize: 13, color: c.ink3, marginTop: 2 }}>
            {sets} × {ex.reps}, rest {ex.rest}{ex.bw ? ", bodyweight" : ""}
          </div>
        </div>
        <ChevronRight size={18} color={c.ink4} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 200ms ease" }} />
      </button>

      <Collapse open={open}>
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ ...label, marginTop: 0 }}>Name</div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => { if (!onRename(name)) setName(ex.name); }}
            onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}
            aria-label="Exercise name"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: `1.5px solid ${c.line}`, background: c.surface, fontSize: 16, fontWeight: 600 }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={label}>Sets</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => onUpdate({ sets: Math.max(1, sets - 1) })} className="tap" aria-label="Fewer sets" style={iconBtn}><Minus size={17} strokeWidth={2.6} /></button>
                <span className="display num" style={{ flex: 1, textAlign: "center", fontSize: 30 }}>{sets}</span>
                <button onClick={() => onUpdate({ sets: Math.min(8, sets + 1) })} className="tap" aria-label="More sets" style={iconBtn}><Plus size={17} strokeWidth={2.6} /></button>
              </div>
            </div>
            <div>
              <div style={label}>Rep range</div>
              <input
                value={ex.reps}
                onChange={e => onUpdate({ reps: e.target.value })}
                aria-label="Rep range"
                className="num"
                style={{ width: "100%", height: 40, padding: "0 12px", borderRadius: 12, border: `1.5px solid ${c.line}`, background: c.surface, fontSize: 16, fontWeight: 700, textAlign: "center" }}
              />
            </div>
          </div>

          <div style={label}>Rest</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {REST_OPTIONS.map(r => (
              <button key={r} onClick={() => onUpdate({ rest: r })} className="tap num" aria-pressed={ex.rest === r} style={chip(ex.rest === r)}>{r}</button>
            ))}
          </div>

          <div style={label}>Type</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => onUpdate({ bw: undefined })} className="tap" aria-pressed={!ex.bw} style={chip(!ex.bw)}>Weighted</button>
            <button onClick={() => onUpdate({ bw: true })} className="tap" aria-pressed={!!ex.bw} style={chip(!!ex.bw)}>Bodyweight + added</button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 18 }}>
            <button onClick={() => onMove(-1)} disabled={idx === 0} className="tap" aria-label="Move up" style={{ ...iconBtn, opacity: idx === 0 ? 0.4 : 1 }}><ChevronUp size={19} strokeWidth={2.4} /></button>
            <button onClick={() => onMove(1)} disabled={last} className="tap" aria-label="Move down" style={{ ...iconBtn, opacity: last ? 0.4 : 1 }}><ChevronDown size={19} strokeWidth={2.4} /></button>
            <span style={{ flex: 1 }} />
            <button onClick={onRemove} className="tap" style={{ height: 40, padding: "0 14px", borderRadius: 12, background: a(c.danger, 11), color: c.danger, fontSize: 14, fontWeight: 750, display: "flex", alignItems: "center", gap: 6 }}>
              <Trash2 size={15} strokeWidth={2.3} /> Remove
            </button>
          </div>
        </div>
      </Collapse>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LIGHTWEIGHT CHARTS — plain SVG in the app's own colors
// ═══════════════════════════════════════════════════════════════════════════
function Sparkline({ values, color, width = 72, height = 26 }) {
  if (!values || values.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * (width - 4) + 2,
    height - 3 - ((v - min) / span) * (height - 6),
  ]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ flexShrink: 0, overflow: "visible" }}>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.8" fill={color} />
    </svg>
  );
}

// Line chart with optional reference line (e.g. 100 for the Strength Index)
function LineChart({ points, color, height = 150, refY, format = v => Math.round(v), labelLast = true }) {
  const ref = useRef(null);
  const [w, setW] = useState(320);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setW(el.clientWidth || 320);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  if (!points || points.length < 2) return <div ref={ref} style={{ height }} />;
  const pad = { l: 4, r: labelLast ? 44 : 6, t: 12, b: 20 };
  const ys = points.map(p => p.v).concat(refY !== undefined ? [refY] : []);
  let min = Math.min(...ys), max = Math.max(...ys);
  const span0 = max - min || Math.max(1, Math.abs(max) * 0.05);
  min -= span0 * 0.12; max += span0 * 0.12;
  const X = i => pad.l + (i / (points.length - 1)) * (w - pad.l - pad.r);
  const Y = v => pad.t + (1 - (v - min) / (max - min)) * (height - pad.t - pad.b);
  const d = points.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(p.v).toFixed(1)}`).join(" ");
  const area = `${d} L${X(points.length - 1).toFixed(1)} ${height - pad.b} L${X(0).toFixed(1)} ${height - pad.b} Z`;
  const gid = `lc${String(color).replace(/[^a-z0-9]/gi, "")}`;
  const lastP = points[points.length - 1];
  const fmtT = t => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div ref={ref} style={{ width: "100%" }}>
      <svg width={w} height={height} role="img" aria-label={`Trend from ${format(points[0].v)} to ${format(lastP.v)}`}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {refY !== undefined ? (
          <line x1={pad.l} x2={w - pad.r} y1={Y(refY)} y2={Y(refY)} stroke={CHART_HEX.muted} strokeDasharray="3 4" strokeWidth="1" />
        ) : null}
        <path d={area} fill={`url(#${gid})`} />
        <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={X(points.length - 1)} cy={Y(lastP.v)} r="4.5" fill={color} stroke={CHART_HEX.tip} strokeWidth="2" />
        {labelLast ? (
          <text x={X(points.length - 1) + 9} y={Y(lastP.v) + 4} fontSize="13" fontWeight="800" fill={CHART_HEX.ink} style={{ fontVariantNumeric: "tabular-nums" }}>
            {format(lastP.v)}
          </text>
        ) : null}
        <text x={pad.l} y={height - 4} fontSize="11" fill={CHART_HEX.muted}>{fmtT(points[0].t)}</text>
        <text x={w - pad.r} y={height - 4} fontSize="11" fill={CHART_HEX.muted} textAnchor="end">{fmtT(lastP.t)}</text>
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS — Strength | Volume
// ═══════════════════════════════════════════════════════════════════════════
function ProgressScreen({ history, onOpenExercise }) {
  const [view, setView] = useState(() => ProgressScreen.lastView || "strength");
  useEffect(() => { ProgressScreen.lastView = view; }, [view]);
  return (
    <div className="rise">
      <ScreenTitle title="Progress" />
      <div style={{ padding: "0 20px 22px" }}>
        <Segmented value={view} onChange={setView} options={[{ value: "strength", label: "Strength" }, { value: "volume", label: "Volume" }]} />
      </div>
      {!history.length ? (
        <div style={{ padding: "0 20px" }}>
          <EmptyState icon={<BarChart3 size={20} />} title="No data yet" sub="Finish a few workouts and your gains start showing here." />
        </div>
      ) : view === "strength" ? (
        <StrengthView history={history} onOpenExercise={onOpenExercise} />
      ) : (
        <VolumeView history={history} />
      )}
    </div>
  );
}

const STATUS_STYLE = {
  up: { color: "var(--good)", label: "Progressing" },
  flat: { color: "var(--ink-3)", label: "Holding" },
  stalled: { color: "var(--caution)", label: "Stalled" },
  new: { color: "var(--ink-4)", label: "Building data" },
};

function StrengthView({ history, onOpenExercise }) {
  const idx = useMemo(() => strengthIndex(history, 12), [history]);
  const lifts = useMemo(() => {
    // Same window as the index, so the numbers agree; lifts with one session show as "Building data"
    const windowed = progressWindow(history, 12).list;
    const all = trackedLifts(windowed, 1).map(l => {
      const st = liftStatus(l.series);
      const ex = DAYS.flatMap(d => d.exercises).find(e => e.name === l.name) || {};
      return { ...l, st, change: liftChange(l.series), goal: goalProgress(l.name, l.series, ex.reps, !!ex.bw) };
    });
    const rank = { stalled: 0, up: 1, flat: 2, new: 3 };
    const main = new Set(idx && idx.lifts ? idx.lifts.map(l => l.name) : []);
    return all.sort((x, y) =>
      (main.has(y.name) - main.has(x.name)) || (rank[x.st.key] - rank[y.st.key])
    ).map(l => ({ ...l, main: main.has(l.name) }));
  }, [history, idx]);
  const [showAll, setShowAll] = useState(false);
  const [picking, setPicking] = useState(false);
  const [info, setInfo] = useState(false);
  const mainCount = lifts.filter(l => l.main).length || Math.min(6, lifts.length);
  const shown = showAll ? lifts : lifts.slice(0, mainCount);
  const up = idx && idx.change >= 0;
  const color = up ? CHART_HEX.accent : CHART_HEX.ink;

  return (
    <div>
      {/* Hero: Strength Index */}
      <Section>
        <div className="card" style={{ padding: "18px 16px 10px" }}>
          <div style={{ padding: "0 4px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 14, fontWeight: 650, color: c.ink3 }}>Strength Index</div>
              <button
                onClick={() => setInfo(true)}
                className="tap"
                aria-label="How the Strength Index works"
                style={{ width: 36, height: 36, margin: "-8px -8px -8px 0", borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", color: c.ink3 }}
              ><Info size={18} strokeWidth={2.2} /></button>
            </div>
            {idx ? (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
                  <span className="display num" style={{ fontSize: 56, color: up ? c.good : c.ink }}>
                    {fmtPct(idx.change)}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: c.ink2, marginTop: 8, lineHeight: 1.4 }}>
                  Estimated 1RM across your {idx.lifts.length} main lift{idx.lifts.length === 1 ? "" : "s"}, {idx.label}
                </div>
                {Date.now() - idx.lastAt > 14 * 86400000 ? (
                  <div style={{ fontSize: 13, color: c.caution, fontWeight: 650, marginTop: 6 }}>No training since {fmtDate(idx.lastAt)}</div>
                ) : null}
              </>
            ) : (
              <div style={{ fontSize: 15, color: c.ink2, marginTop: 8, lineHeight: 1.45 }}>
                Repeat any main lift once more and your index starts here. It tracks the average estimated-1RM gain across your main lifts.
              </div>
            )}
          </div>
          {idx && !idx.short ? (
            <div style={{ marginTop: 10 }}>
              <LineChart points={idx.points} color={color} refY={100} format={v => Math.round(v)} height={140} />
            </div>
          ) : null}
        </div>
      </Section>

      {/* Overload scoreboard */}
      <Section title="Your lifts" aside="main lifts, stalled first">
        <div className="card" style={{ overflow: "hidden" }}>
          {shown.map((l, i) => {
            const s = STATUS_STYLE[l.st.key];
            const lineColor = l.day ? CHART_HEX[l.day.id] : CHART_HEX.ink;
            const gl = goalLine(l.goal);
            return (
              <button
                key={l.name}
                onClick={() => onOpenExercise(l.name)}
                className="tap"
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", textAlign: "left", borderTop: i === 0 ? "none" : `1px solid ${c.lineSoft}` }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shortLiftName(l.name)}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, fontSize: 13, color: c.ink3, minWidth: 0 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: s.color, flexShrink: 0 }} />
                    <span style={{ color: l.st.key === "stalled" ? c.caution : c.ink3, fontWeight: l.st.key === "stalled" ? 700 : 500, flexShrink: 0 }}>{l.st.key === "new" ? l.st.label : s.label}</span>
                    {gl ? <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>, {gl.replace(/^Goal /, "goal ")}</span> : null}
                  </div>
                </div>
                <Sparkline values={smoothSeries(l.series.map(x => x.e1rm))} color={lineColor} />
                <span className="num" style={{ minWidth: 54, textAlign: "right", fontSize: 15, fontWeight: 800, color: l.change > 0.5 ? c.good : l.change < -0.5 ? c.danger : c.ink3 }}>
                  {l.series.length < 3 ? "" : fmtPct(l.change)}
                </span>
              </button>
            );
          })}
          {lifts.length > mainCount ? (
            <button onClick={() => setShowAll(!showAll)} className="tap" style={{ width: "100%", padding: "13px 16px", borderTop: `1px solid ${c.lineSoft}`, fontSize: 14, fontWeight: 700, color: c.ink2 }}>
              {showAll ? "Main lifts only" : `Show ${lifts.length - mainCount} more lifts`}
            </button>
          ) : null}
          <button onClick={() => setPicking(true)} className="tap" style={{ width: "100%", padding: "13px 16px", borderTop: `1px solid ${c.lineSoft}`, fontSize: 14, fontWeight: 700, color: c.ink2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Search size={15} strokeWidth={2.4} /> Any exercise
          </button>
        </div>
        <p style={{ fontSize: 12, color: c.ink3, margin: "10px 4px 0", lineHeight: 1.45 }}>
          {progressWindow(history, 12).label.replace(/^./, ch => ch.toUpperCase())}. % is estimated 1RM, first sessions vs latest (up to 3 each); lines are 3-session averages so one off day doesn't read as a drop.
        </p>
      </Section>

      {info ? <StrengthInfoSheet idx={idx} onClose={() => setInfo(false)} /> : null}

      {picking ? (
        <ExerciseListSheet
          current={null}
          otherNames={[]}
          history={history}
          onPick={n => { setPicking(false); onOpenExercise(n); }}
          onClose={() => setPicking(false)}
        />
      ) : null}
    </div>
  );
}

function StrengthInfoSheet({ idx, onClose }) {
  const P = ({ children }) => <p style={{ margin: "0 0 12px", fontSize: 15, color: c.ink2, lineHeight: 1.55 }}>{children}</p>;
  const H = ({ children }) => <div style={{ fontSize: 15, fontWeight: 800, margin: "18px 0 6px" }}>{children}</div>;
  return (
    <BottomSheet title="How the Strength Index works" onClose={onClose}>
      <P>One number for "am I getting stronger?", averaged across your main lifts so one good or bad day on a single lift doesn't swing it.</P>

      <H>How it's calculated</H>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "4px 0 6px" }}>
        {[
          ["Estimate your 1-rep max", "for every working set, using the Epley formula: weight × (1 + reps ÷ 30). Your best set each session counts."],
          ["Compare each lift to itself", "Your latest sessions (up to 3, averaged) versus your first ones. 100 = where you started."],
          ["Average across lifts", "Your main lifts, the first two of each day, count equally. +6% means they're up about 6% on average."],
        ].map(([k, v], i) => (
          <div key={i} style={{ display: "flex", gap: 12 }}>
            <span className="display num" style={{ fontSize: 22, minWidth: 16, color: c.good }}>{i + 1}</span>
            <div style={{ fontSize: 15, color: c.ink2, lineHeight: 1.5 }}><strong style={{ color: c.ink }}>{k}</strong> {v}</div>
          </div>
        ))}
      </div>
      {idx && idx.lifts ? (
        <div style={{ fontSize: 13, color: c.ink3, margin: "6px 0 0" }}>
          Counting now: {idx.lifts.map(l => shortLiftName(l.name)).join(", ")}.
        </div>
      ) : null}

      <H>Why it's a good measure</H>
      <P>Double progression moves weight and reps in turn, so "heaviest weight" stays flat for weeks even while you're improving. An estimated 1RM rises whether you add a rep or add a plate, so it captures both kinds of progress in one number.</P>
      <P>Each lift is compared to itself in percentage terms, so a 10 lb gain on shoulder press (a big jump there) isn't drowned out by 10 lb on leg press (a small one). Averaging over several sessions smooths out one-off good or bad days.</P>

      <H>What to keep in mind</H>
      <P>The absolute 1RM estimate can be off by 5–10% at 8–12 reps, but the trend is reliable because the error is about the same each week. Changing machines, grips or rep ranges can shift a lift's line, so judge it over a few weeks rather than day to day.</P>
    </BottomSheet>
  );
}

function VolumeView({ history }) {
  const rates = useMemo(() => beatRateByWeek(history, 8), [history]);
  const cur = rates[rates.length - 1];
  const withData = rates.filter(r => r.pct !== null);
  const headline = cur.pct !== null ? cur : withData[withData.length - 1];
  const maxH = 110;
  return (
    <div>
      <Section>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 650, color: c.ink3 }}>Sets that beat last time</div>
          {headline ? (
            <>
              <div className="display num" style={{ fontSize: 52, marginTop: 6 }}>{Math.round(headline.pct)}%</div>
              <div style={{ fontSize: 14, color: c.ink2, marginTop: 8, lineHeight: 1.45 }}>
                {headline === cur ? "This week" : "Your latest week"}: {headline.beat} of {headline.n} sets added weight or reps.
                {" "}30–50% is healthy double progression.
              </div>
              <div role="img" aria-label="Weekly share of sets that beat last time, last 8 weeks" style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 6, height: maxH, marginTop: 18 }}>
                <div style={{ position: "absolute", left: 0, right: 0, bottom: maxH * 0.3, height: maxH * 0.2, background: a(c.good, 10), borderRadius: 4 }} />
                {rates.map((r, i) => (
                  <div key={r.t} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", position: "relative" }}>
                    <div style={{
                      width: "100%", borderRadius: 6,
                      height: r.pct === null ? 4 : Math.max(4, (Math.min(100, r.pct) / 100) * maxH),
                      background: r.pct === null ? c.inset : i === rates.length - 1 ? c.good : a(c.good, 45),
                    }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: c.ink3 }}>
                <span>{fmtDate(rates[0].t)}</span><span>This week</span>
              </div>
            </>
          ) : (
            <div style={{ fontSize: 15, color: c.ink2, marginTop: 8 }}>Repeat a workout once and this starts counting.</div>
          )}
        </div>
      </Section>
      <MuscleSets history={history} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXERCISE INSIGHT — full screen from Progress, compact sheet mid-workout
// ═══════════════════════════════════════════════════════════════════════════
function ExerciseInsight({ name, history, compact, onGoalChange }) {
  const routineEx = DAYS.flatMap(d => d.exercises).find(e => e.name === name) || {};
  const day = DAYS.find(d => d.exercises.some(e => e.name === name));
  const series = useMemo(() => exerciseTimeSeries(history, name), [history, name]);
  const bw = series.length ? series[series.length - 1].bw : !!routineEx.bw || isBodyweight(name);
  const hasE = series.length >= 2 && series.every(s => s.e1rm);
  const lineColor = day ? CHART_HEX[day.id] : CHART_HEX.ink;
  const rec = recommendNextSet(history, name, routineEx.reps || "8–12", bw);
  const st = hasE ? liftStatus(series.filter(s => s.e1rm)) : null;
  const gp = hasE ? goalProgress(name, series.filter(s => s.e1rm), routineEx.reps, bw) : null;
  const [editGoal, setEditGoal] = useState(false);
  const [goalVal, setGoalVal] = useState(goalFor(name) ? String(goalFor(name)) : "");
  const prs = useMemo(() => computePRs(history).find(p => p.name === name), [history, name]);

  // Recent sessions with RIR notes
  const sessions = useMemo(() => {
    const out = [];
    for (const w of history) {
      const ex = (w.exercises || []).find(e => e.name === name);
      if (!ex) continue;
      const work = ex.sets.filter(s => s.done && !s.warmup);
      if (!work.length) continue;
      out.push({ t: w.startedAt, sets: work });
      if (out.length >= (compact ? 5 : 10)) break;
    }
    return out;
  }, [history, name, compact]);

  if (!series.length) {
    return <EmptyState icon={<Activity size={20} />} title="No sets logged yet" sub="Log this exercise once and its trend appears here." />;
  }
  const latest = series[series.length - 1];
  const first = series[0];
  const eChange = hasE ? latest.e1rm - first.e1rm : 0;

  // Stall advice uses RIR: at failure and not moving means back off; otherwise push harder
  let stallTip = null;
  if (st && st.key === "stalled") {
    const recentRir = sessions.slice(0, 3).flatMap(s => s.sets.map(x => x.rir)).filter(x => x !== undefined && x !== null);
    const atFailure = recentRir.length && recentRir.filter(x => Number(x) === 0).length >= recentRir.length / 2;
    stallTip = atFailure
      ? "No new best in 3 sessions and you're training to failure. Drop about 10% and rebuild over 2–3 sessions."
      : "No new best in 3 sessions. Take the last set closer to failure, or drop about 10% and rebuild.";
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 18, columnGap: 12, marginBottom: 16 }}>
        <Stat label="Latest top set" value={`${fmtSetShort(latest.top, bw)}×${latest.topReps}`} />
        {hasE ? <Stat label="Est. 1RM now" value={latest.e1rm} unit="lb" /> : <Stat label="Sessions" value={series.length} />}
        {hasE && !compact ? <Stat label="Est. 1RM change" value={`${eChange >= 0 ? "+" : ""}${eChange}`} unit="lb" /> : null}
        {!compact ? <Stat label="Sessions" value={series.length} /> : null}
      </div>

      {st ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: STATUS_STYLE[st.key].color, marginBottom: stallTip ? 6 : 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: STATUS_STYLE[st.key].color }} /> {st.key === "new" ? st.label : STATUS_STYLE[st.key].label}
        </div>
      ) : null}
      {stallTip ? <p style={{ margin: "0 0 14px", fontSize: 14, color: c.ink2, lineHeight: 1.45 }}>{stallTip}</p> : null}

      {series.length >= 2 ? (
        <div className="card" style={{ padding: "12px 10px 6px", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 650, color: c.ink3, padding: "0 6px 6px" }}>{hasE ? "Estimated 1RM" : bw ? "Added weight" : "Top weight"}</div>
          <LineChart points={series.map(s => ({ t: s.date, v: hasE ? s.e1rm : s.top }))} color={lineColor} height={compact ? 120 : 150} />
        </div>
      ) : null}

      {rec ? (
        <div style={{ padding: "12px 14px", borderRadius: 14, background: a(c.good, 10), display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <TrendingUp size={17} color={c.good} strokeWidth={2.4} />
          <span style={{ fontSize: 14, color: c.ink2, lineHeight: 1.4 }}>
            Next top set <strong className="num" style={{ color: c.ink }}>{fmtSetShort(rec.weight, bw)} × {rec.reps}</strong>
            <span style={{ display: "block", fontSize: 12, color: c.ink3 }}>{rec.rationale.replace(/^./, ch => ch.toUpperCase())}</span>
          </span>
        </div>
      ) : null}

      {/* Goal */}
      {!compact || goalFor(name) ? (
        <div className="card" style={{ padding: "14px 16px", marginBottom: 12 }}>
          {editGoal ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 650, color: c.ink2 }}>{bw ? "Goal added lb" : "Goal weight"}</span>
              <input
                autoFocus type="text" inputMode="decimal" value={goalVal}
                onChange={e => setGoalVal(cleanNum(e.target.value))}
                aria-label="Goal weight in pounds"
                className="num"
                style={{ width: 80, height: 40, borderRadius: 10, border: `1.5px solid ${c.line}`, background: c.surface, textAlign: "center", fontSize: 16, fontWeight: 750 }}
              />
              <span style={{ fontSize: 14, color: c.ink3 }}>× {(parseRepTarget(routineEx.reps || "8–12") || { min: 8 }).min}</span>
              <span style={{ flex: 1 }} />
              <button onClick={() => { setGoal(name, Number(goalVal) > 0 ? goalVal : null); setEditGoal(false); onGoalChange && onGoalChange(); }} className="tap" style={{ height: 40, padding: "0 14px", borderRadius: 10, background: c.ink, color: c.bg, fontWeight: 750 }}>Save</button>
            </div>
          ) : (
            <button onClick={() => setEditGoal(true)} className="tap" style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
              <Trophy size={17} color={gp ? c.good : c.ink3} strokeWidth={2.3} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 650, color: gp ? c.ink : c.ink2 }}>
                {gp ? goalLine(gp) : "Set a goal and get a projected date"}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: c.ink3 }}>{gp ? "Edit" : "Set"}</span>
            </button>
          )}
        </div>
      ) : null}

      {!compact && prs ? (
        <div className="card" style={{ padding: "14px 16px", marginBottom: 12, display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: c.ink3, fontWeight: 650 }}>Heaviest</div>
            <div className="num" style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}><LoadText weight={prs.top} bw={prs.bw} /> × {prs.reps}</div>
          </div>
          {prs.e1rm ? (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: c.ink3, fontWeight: 650 }}>Best est. 1RM</div>
              <div className="num" style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>{prs.e1rm} lb</div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={{ fontSize: 13, fontWeight: 700, color: c.ink3, margin: "6px 2px 8px" }}>Recent sessions</div>
      <div className="card" style={{ overflow: "hidden" }}>
        {sessions.map((s, i) => (
          <div key={s.t} style={{ display: "flex", alignItems: "baseline", gap: 12, padding: "11px 14px", borderTop: i === 0 ? "none" : `1px solid ${c.lineSoft}` }}>
            <span style={{ fontSize: 13, color: c.ink3, width: 54, flexShrink: 0 }}>{fmtDate(s.t)}</span>
            <span className="num" style={{ fontSize: 14, fontWeight: 650, color: c.ink2, display: "flex", flexWrap: "wrap", columnGap: 10 }}>
              {s.sets.map((x, j) => (
                <span key={j} style={{ whiteSpace: "nowrap" }}>
                  {fmtSetShort(x.weight, bw)}×{x.reps}{x.rir !== undefined && x.rir !== null ? <span style={{ color: c.ink4, fontWeight: 600 }}>{Number(x.rir) === 0 ? " F" : ` @${x.rir}`}</span> : null}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExerciseScreen({ name, history, onBack }) {
  const day = DAYS.find(d => d.exercises.some(e => e.name === name));
  const [, bump] = useState(0);
  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>
      <header style={{
        position: "sticky", top: 0, zIndex: 100, background: a(c.bg, 88),
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        padding: `calc(env(safe-area-inset-top) + ${TOP_GAP}px) 8px 4px`,
      }}>
        <IconButton label="Back" onClick={onBack}><ChevronLeft size={26} strokeWidth={2.2} /></IconButton>
      </header>
      <div style={{ padding: "0 20px 18px" }}>
        {day ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: day.ink }}>
            <MiniPlate color={day.color} on={day.on} size={18} /> {day.label} day
          </div>
        ) : null}
        <h1 className="display" style={{ margin: "8px 0 0", fontSize: 40, fontStretch: "88%" }}>{name}</h1>
      </div>
      <div style={{ padding: "0 20px" }}>
        <ExerciseInsight name={name} history={history} onGoalChange={() => bump(x => x + 1)} />
      </div>
    </div>
  );
}

function SetupScreen({ onBack, ...props }) {
  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>
      <header style={{
        position: "sticky", top: 0, zIndex: 100, background: a(c.bg, 88),
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        padding: `calc(env(safe-area-inset-top) + ${TOP_GAP}px) 8px 4px`,
      }}>
        <IconButton label="Back" onClick={onBack}><ChevronLeft size={26} strokeWidth={2.2} /></IconButton>
      </header>
      <div style={{ padding: "0 20px 20px" }}>
        <h1 className="display" style={{ margin: 0, fontSize: 46 }}>Setup</h1>
      </div>
      <DataView {...props} />
    </div>
  );
}
