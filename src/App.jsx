import { useState, useEffect, useMemo, useRef } from "react";
import {
  ChevronLeft, ChevronRight, Plus, Check, Minus,
  TrendingUp, Activity, BarChart3, ClipboardList,
  Trophy, Download, Upload, Trash2, X, Shield,
  Repeat, Copy, Flame, Timer, SkipForward, MoreHorizontal,
  FileText, Search, Undo2, ArrowRight, Pencil, ChevronUp, ChevronDown,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
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
const TOP_GAP = 0;

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
  recapSeen: null, lastBackup: 0, tipDismissed: false,
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
const fmtNum  = n  => n >= 10000 ? `${(n/1000).toFixed(0)}k` : n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(Math.round(n));
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

// Double progression. Load goes up only once EVERY set at the top load hit
// the top of the rep range last time; until then, build reps.
// Returns { increase, weight, reps, rationale } or null with no history.
// For bodyweight exercises, `weight` is ADDED load (0 = bodyweight only).
function recommendNextSet(history, exerciseName, targetRepsStr, bw) {
  const all = findLastSessionSets(history, exerciseName);
  const last = all ? all.filter(s => !s.warmup) : null;
  if (!last || !last.length) return null;
  const target = parseRepTarget(targetRepsStr);
  const topW = Math.max(...last.map(s => Number(s.weight) || 0));
  const atTop = last.filter(s => (Number(s.weight) || 0) === topW);
  const minReps = Math.min(...atTop.map(s => Number(s.reps) || 0));
  const increment = bw ? 5 : (isLowerBody(exerciseName) ? 10 : 5);
  if (target && minReps >= target.max) {
    return {
      increase: true,
      weight: String(topW + increment),
      reps: String(target.min),
      rationale: `+${increment} lb, every set hit ${target.max} last time`,
    };
  }
  return {
    increase: false,
    weight: String(topW),
    reps: String(target ? Math.min(minReps + 1, target.max) : minReps + 1),
    rationale: target ? `build every set to ${target.max}` : "try +1 rep",
  };
}

// Suggestion for one specific set: after a load increase, the new target;
// otherwise beat that same set from last time by a rep (capped at the top).
function setSuggestion(rec, lastSets, si, targetReps) {
  if (!rec) return null;
  if (!lastSets || !lastSets.length) return rec;
  const src = lastSets[si] || lastSets[lastSets.length - 1];
  if (src.warmup) return { increase: false, weight: src.weight, reps: src.reps };
  if (rec.increase) return rec;
  const t = parseRepTarget(targetReps);
  const r = Number(src.reps) || 0;
  return { increase: false, weight: src.weight, reps: String(t ? Math.min(r + 1, t.max) : r + 1) };
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
function buildSets(history, name, n) {
  const last = findLastSessionSets(history, name);
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
  return `${s.warmup ? "warm-up " : ""}${fmtSetShort(s.weight, bw)}×${s.reps}`;
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
  lines.push("Loads in lb; BW = bodyweight, BW+10 = 10 lb added.");
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
  L.push("Loads in lb. BW = bodyweight only, BW+10 = bodyweight plus 10 lb. Only completed sets are listed; warm-up sets are marked and excluded from volume and PRs. Est. 1RM uses the Epley formula.");
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
  return { volPct: pv ? ((v - pv) / pv) * 100 : null, beat, compared, date: prev.startedAt };
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
  const [swiping, setSwiping] = useState(false);
  const [noEnter, setNoEnter] = useState(false);
  const underRef = useRef(null);
  const saveTimer = useRef(null);

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

  const goTab = t => { setTab(t); setScreen(t); window.scrollTo(0, 0); };
  const goBack = () => { setScreen(tab); window.scrollTo(0, 0); };
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
          sets: buildSets(history, ex.name, ex.sets),
        })),
      };
      setRest(null);
      setActive(w);
      setScreen("workout");
      window.scrollTo(0, 0);
      await clearActiveStorage();
      await persistActive(w);
    };

    if (active) {
      showSheet({
        title: "Workout in progress",
        message: `Your ${(findDay(active.dayId) || {}).label || ""} session is still open. Starting a new one deletes it.`,
        actions: [
          { label: "Resume workout", icon: ArrowRight, fn: () => { closeSheet(); setScreen("workout"); } },
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

  async function finishWorkout() {
    if (!active) return;
    const hasDone = active.exercises.some(ex => ex.sets.some(s => s.done));

    const doFinish = async () => {
      const completed = {
        ...active,
        completedAt: Date.now(),
        bodyweight: bodyweight || null,
        exercises: active.exercises
          .map(ex => ({ ...ex, sets: ex.sets.filter(s => s.done) }))
          .filter(ex => ex.sets.length > 0),
      };
      if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
      const newList = [completed, ...history.filter(w => w.id !== completed.id)];
      saveWorkouts(newList);
      clearActiveStorage();

      const newPRs = detectSessionPRs(completed, history);

      setRest(null);
      setActive(null);
      setHistory(newList);
      setSummary({ workout: completed, newPRs });
    };

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
        <span style={{ fontSize: 14, color: c.ink3 }}>Loading</span>
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
            onResume={() => { setScreen("workout"); window.scrollTo(0, 0); }}
          />
    );
    if (t === "history") return (
          <HistoryScreen history={history} onOpen={w => { setDetailWorkout(w); setScreen("detail"); window.scrollTo(0, 0); }} />
    );
    return (
          <ProgressScreen
            history={history}
            bodyweight={bodyweight}
            onBodyweightChange={updateBodyweight}
            themePref={themePref}
            onThemeChange={updateThemePref}
            onExportClaude={exportForClaude}
            onCopyClaude={copyAllForClaude}
            onExportExcel={() => exportToExcel(history)}
            onBackup={() => exportBackup(history)}
            onRestore={handleRestore}
            onEditRoutine={dayId => { setRoutineDay(dayId); setScreen("routine"); window.scrollTo(0, 0); }}
            routineVersion={routineVersion}
          />
    );
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
          onStart={() => setSwiping(true)}
          onProgress={p => { if (underRef.current) setUnderlayProgress(underRef.current, p); }}
          onCancel={() => setSwiping(false)}
          onBack={() => { setNoEnter(true); setSwiping(false); goBack(); setTimeout(() => setNoEnter(false), 450); }}
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
              onBack={goBack}
            />
          ) : null}
          </div>
        </SwipeBack>
      )}

      {swiping ? (
        <div ref={underRef} aria-hidden="true" className="no-enter" style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", background: c.bg, pointerEvents: "none", transform: "translateX(-28%)" }}>
          <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", paddingBottom: 120 }}>{tabEl(tab)}</div>
          <BottomNav tab={tab} onSwitch={() => {}} />
          <div data-dim style={{ position: "absolute", inset: 0, background: "#000", opacity: 0.18 }} />
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

// Parallax + dim on the screen underneath while the page is dragged away
function setUnderlayProgress(el, p) {
  el.style.transform = `translateX(${-28 * (1 - p)}%)`;
  const dim = el.querySelector("[data-dim]");
  if (dim) dim.style.opacity = String(0.18 * (1 - p));
}

// iOS-style swipe back: drag from the left edge. Moves the page with "left"
// rather than a transform, so fixed bars inside stay fixed; they follow the
// drag via the --swipe-x variable.
function SwipeBack({ onBack, onStart, onProgress, onCancel, children }) {
  const ref = useRef(null);
  const cb = useRef({});
  cb.current = { onBack, onStart, onProgress, onCancel };
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    let s = null;
    const setX = x => { el.style.left = `${x}px`; root.style.setProperty("--swipe-x", `${x}px`); };
    function start(e) {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      if (t.clientX > 30) return;
      if (document.querySelector(".sheet-up")) return; // a sheet is open
      s = { x0: t.clientX, y0: t.clientY, dx: 0, lock: null, lastX: t.clientX, lastT: performance.now(), v: 0 };
    }
    function move(e) {
      if (!s) return;
      const t = e.touches[0];
      const dx = t.clientX - s.x0, dy = t.clientY - s.y0;
      if (!s.lock) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (dx > 0 && Math.abs(dx) > Math.abs(dy)) {
          s.lock = "x";
          el.style.transition = "none";
          cb.current.onStart();
        } else { s = null; return; }
      }
      e.preventDefault();
      const now = performance.now();
      s.v = (t.clientX - s.lastX) / Math.max(1, now - s.lastT);
      s.lastX = t.clientX; s.lastT = now;
      s.dx = Math.max(0, dx);
      setX(s.dx);
      cb.current.onProgress(Math.min(1, s.dx / window.innerWidth));
    }
    function end() {
      if (!s || s.lock !== "x") { s = null; return; }
      const W = window.innerWidth;
      const go = s.dx > W * 0.35 || (s.v > 0.45 && s.dx > 40);
      s = null;
      el.style.transition = "left 240ms cubic-bezier(0.2, 0.8, 0.2, 1)";
      setX(go ? W : 0);
      cb.current.onProgress(go ? 1 : 0);
      setTimeout(() => {
        el.style.transition = "";
        root.style.setProperty("--swipe-x", "0px");
        if (go) cb.current.onBack();
        else { el.style.left = ""; cb.current.onCancel(); }
      }, 240);
    }
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
      root.style.setProperty("--swipe-x", "0px");
    };
  }, []);
  return (
    <div
      ref={ref}
      style={{
        position: "relative", zIndex: 1, left: 0,
        background: c.bg, minHeight: "100vh",
        boxShadow: "-10px 0 30px rgba(0,0,0,0.14)",
      }}
    >{children}</div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HOME
// ═══════════════════════════════════════════════════════════════════════════
function HomeScreen({ history, active, target, onTargetChange, onStart, onResume }) {
  const now = new Date();
  const mon = mondayOf(Date.now());
  const thisWeek = sessionsBetween(history, mon, addDays(mon, 7));
  const streak = weekStreak(history, target);
  const nxt = findDay(nextDay(history));
  const activeDay = active ? findDay(active.dayId) : null;
  const hero = activeDay || nxt;
  const others = DAYS.filter(d => d.id !== hero.id);

  // Monthly recap: first week of a new month, until dismissed
  const [recapSeen, setRecapSeen] = useState(SETTINGS.recapSeen);
  const [tipOff, setTipOff] = useState(!!SETTINGS.tipDismissed);
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const recapKey = `${prevMonth.getFullYear()}-${prevMonth.getMonth() + 1}`;
  const recap = useMemo(
    () => monthRecap(history, prevMonth.getFullYear(), prevMonth.getMonth()),
    [history, recapKey]
  );
  const showRecap = now.getDate() <= 7 && recap.sessions > 0 && recapSeen !== recapKey;
  function dismissRecap() {
    saveSettings({ recapSeen: recapKey });
    setRecapSeen(recapKey);
  }

  const todayIdx = (now.getDay() + 6) % 7;
  const week = Array.from({ length: 7 }, (_, i) => {
    const start = addDays(mon, i);
    const w = history.find(x => x.startedAt >= start.getTime() && x.startedAt < addDays(start, 1).getTime());
    return { letter: "MTWTFSS"[i], today: i === todayIdx, day: w ? findDay(w.dayId) : null };
  });

  const lastHero = history.find(w => w.dayId === hero.id);
  const toBeat = active ? null : beatTarget(history, hero);
  const typical = typicalDuration(history, hero.id);
  const activeDone = active ? active.exercises.reduce((s, e) => s + e.sets.filter(x => x.done).length, 0) : 0;
  const activeTotal = active ? active.exercises.reduce((s, e) => s + e.sets.length, 0) : 0;

  return (
    <div className="rise" style={{ padding: `calc(env(safe-area-inset-top) + ${TOP_GAP + 12}px) 16px 0` }}>
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
            <span className="serif" style={{ fontSize: 22 }}>{greet()}, Peter</span>
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
                  <div>Started {fmtDur(Date.now() - active.startedAt)} ago</div>
                </>
              ) : (
                <>
                  <div>{lastHero ? `Last done ${ago(lastHero.startedAt)}` : "First one on the log"}</div>
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

      {/* This week */}
      <div className="card" style={{ padding: "20px 18px 8px", marginTop: 14, borderRadius: 26 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "0 4px" }}>
          <div>
            <div className="display num" style={{ fontSize: 60 }}>
              {thisWeek}<span style={{ color: c.ink3, fontSize: 36 }}>/{target}</span>
            </div>
            <div style={{ fontSize: 17, color: c.ink2, marginTop: 8 }}>
              {thisWeek >= target ? "Target hit this week" : "sessions this week"}
            </div>
          </div>
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

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: 18, padding: "8px 4px 4px", borderTop: `1px solid ${c.lineSoft}`,
        }}>
          <span style={{ fontSize: 16, color: c.ink2 }}>Weekly target</span>
          <div style={{ display: "flex", alignItems: "center" }}>
            <IconButton label="Lower weekly target" onClick={() => onTargetChange(target - 1)} style={{ color: target <= 1 ? c.ink4 : c.ink }}>
              <Minus size={20} strokeWidth={2.2} />
            </IconButton>
            <span className="num" style={{ minWidth: 24, textAlign: "center", fontSize: 19, fontWeight: 800 }}>{target}</span>
            <IconButton label="Raise weekly target" onClick={() => onTargetChange(target + 1)} style={{ color: target >= 7 ? c.ink4 : c.ink }}>
              <Plus size={20} strokeWidth={2.2} />
            </IconButton>
          </div>
        </div>
      </div>

      {showRecap ? (
        <div className="card rise" style={{ padding: 20, position: "relative", marginTop: 14, borderRadius: 26 }}>
          <IconButton label="Dismiss recap" onClick={dismissRecap} style={{ position: "absolute", top: 8, right: 8, color: c.ink3 }}>
            <X size={18} />
          </IconButton>
          <div className="serif" style={{ fontSize: 18, color: c.ink2 }}>Your month</div>
          <div className="display" style={{ fontSize: 40, marginTop: 4 }}>{recap.label}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 18 }}>
            <Stat label="Sessions" value={recap.sessions} />
            <Stat label="Sets" value={recap.sets} />
            <Stat label="Volume" value={fmtNum(recap.volume)} />
            <Stat label="PRs" value={recap.prs.length} />
          </div>
          {recap.prs.length ? (
            <p style={{ margin: "14px 0 0", fontSize: 14, color: c.ink2, lineHeight: 1.5 }}>
              New bests on {recap.prs.slice(0, 3).map(p => p.name).join(", ")}
              {recap.prs.length > 3 ? ` and ${recap.prs.length - 3} more` : ""}.
            </p>
          ) : null}
        </div>
      ) : null}

      {!history.length && !active && !tipOff ? (
        <div className="card rise" style={{ padding: "18px 18px 16px", marginTop: 14, borderRadius: 26, position: "relative" }}>
          <IconButton label="Dismiss" onClick={() => { setTipOff(true); saveSettings({ tipDismissed: true }); }} style={{ position: "absolute", top: 8, right: 8, color: c.ink3 }}>
            <X size={18} />
          </IconButton>
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
        </div>
      ) : null}

      <h2 className="h-sec" style={{ fontSize: 22, margin: "30px 6px 14px" }}>Other days</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {others.map(day => {
          const last = history.find(w => w.dayId === day.id);
          return (
            <button
              key={day.id}
              onClick={() => onStart(day.id)}
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
      padding: "0 12px calc(env(safe-area-inset-bottom) + 10px)",
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
                  display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12,
                  padding: "10px 0", borderTop: `1px solid ${c.lineSoft}`,
                }}>
                  <span style={{ fontSize: 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pr.name}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 750, color: c.good, background: a(c.good, 12), padding: "3px 7px", borderRadius: 6 }}>
                      {PR_SHORT[pr.kind]}
                    </span>
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
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);
  const cardRefs = useRef({});
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 64);
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
      sets: e.sets.map((s, j) => j === si ? { ...s, done: true, weight: bw && s.weight === "" ? "0" : s.weight } : s),
    }));
    // Carry the logged numbers forward into the next set if it's still empty
    const nextEx = next.exercises[ei];
    const following = nextEx.sets.findIndex((s, j) => j > si && !s.done);
    if (following >= 0 && nextEx.sets[following].weight === "" && nextEx.sets[following].reps === "") {
      nextEx.sets[following] = { ...nextEx.sets[following], weight: nextEx.sets[si].weight, reps: nextEx.sets[si].reps };
    }
    onUpdate(next, true);
    setActiveSet(prev => { const p = { ...prev }; delete p[ei]; return p; });

    const kind = prKind(statsByName[ex.name], nextEx.sets[si], bw, bodyweight);
    if (kind) {
      const logged = nextEx.sets[si];
      setToast({ id: Date.now(), kind, name: ex.name, text: `${fmtSetShort(logged.weight, bw)} × ${logged.reps}` });
    }

    const everything = next.exercises.every(isExerciseDone);
    if (!everything && !set.warmup) onStartRest(parseRestSeconds(ex.rest), ex.name);
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
        sets: buildSets(history, clean, orig.sets.length),
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
        sets: buildSets(history, clean, n),
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
                step={bw ? 5 : (isLowerBody(ex.name) ? 10 : 5)}
                bodyweight={bodyweight}
                onBodyweightChange={onBodyweightChange}
                note={notes[ex.name] || ""}
                onNoteChange={t => onNoteChange(ex.name, t)}
                stats={statsByName[ex.name]}
                onToggleWarmup={si => toggleWarmup(ei, si)}
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
      </div>

      {/* Bottom dock: rest countdown while resting, otherwise Finish */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 150,
        transform: "translateX(var(--swipe-x, 0px))",
        background: `linear-gradient(to top, ${c.bg} 62%, ${a(c.bg, 0)})`,
        padding: "26px 16px calc(env(safe-area-inset-bottom) + 14px)",
      }}>
        <div style={{ maxWidth: 448, margin: "0 auto" }}>
          {rest ? (
            <RestDock rest={rest} day={day} onAdjust={onAdjustRest} onClear={onClearRest} />
          ) : (
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
          position: "fixed", left: 0, right: 0, bottom: "calc(env(safe-area-inset-bottom) + 108px)", zIndex: 160,
          transform: "translateX(var(--swipe-x, 0px))",
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
              <div style={{ fontSize: 14, fontWeight: 800 }}>New PR, {PR_LABEL[toast.kind]}</div>
              <div className="num" style={{ fontSize: 13, opacity: 0.75, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {toast.name} {toast.text}
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
  ex, bw, day, open, onToggle, current, lastSets, rec, step,
  bodyweight, onBodyweightChange, note, onNoteChange, stats, onToggleWarmup,
  onSelectSet, onEditSet, onLog, onUndo, onRemoveSet, onAddSet, onFill, onSwap, onRemove,
}) {
  const done = ex.sets.filter(s => s.done).length;
  const complete = isExerciseDone(ex);
  const curSet = current >= 0 ? ex.sets[current] : null;
  const sug = curSet && !curSet.done && !curSet.warmup ? setSuggestion(rec, lastSets, current, ex.targetReps) : null;
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
          {rec && rec.increase && !complete ? (
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
              <SetLine
                key={si} set={set} idx={si} bw={bw} day={day}
                pr={set.done ? prKind(stats, set, bw, bodyweight) : null}
                onSelect={() => onSelectSet(si)}
              />
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "10px 4px 0" }}>
            <button onClick={onAddSet} className="tap link"><Plus size={15} strokeWidth={2.4} /> Add set</button>
            <button onClick={onSwap} className="tap link"><Repeat size={14} strokeWidth={2.4} /> Swap</button>
            <span style={{ flex: 1 }} />
            <button onClick={onRemove} className="tap link" style={{ color: c.ink3 }}>Remove</button>
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
        }}><Trophy size={12} strokeWidth={2.6} /> {PR_SHORT[pr]}</span>
      ) : wu ? (
        <span style={{ fontSize: 12, color: c.ink3, fontWeight: 600 }}>Warm-up</span>
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
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px 10px" }}>
        <span style={{ fontSize: 13, fontWeight: 750, color: c.ink2 }}>
          {wu ? "Warm-up set" : `Set ${idx + 1}`}{set.done ? ", logged" : ""}
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
            fontSize: 12, fontWeight: 750, padding: "5px 10px", borderRadius: 99,
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
          type="number"
          inputMode={inputMode}
          aria-label={label}
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
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
        type="number"
        inputMode="decimal"
        aria-label="Bodyweight in pounds"
        value={val}
        placeholder="lb"
        onChange={e => setVal(e.target.value)}
        className="num"
        style={{ width: 64, padding: "8px 6px", borderRadius: 10, border: `1px solid ${c.line}`, background: c.surface, textAlign: "center", fontWeight: 700 }}
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
          style={{ flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${c.line}`, background: c.surface, fontSize: 15 }}
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

function HistoryScreen({ history, onOpen }) {
  const grouped = useMemo(() => {
    const map = new Map();
    for (const w of history) {
      const d = new Date(w.startedAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      if (!map.has(key)) map.set(key, { label, items: [] });
      map.get(key).items.push(w);
    }
    return Array.from(map.values());
  }, [history]);

  return (
    <div className="rise">
      <ScreenTitle title="History" sub={`${history.length} session${history.length === 1 ? "" : "s"} logged`} />
      {history.length ? <TrainingGrid history={history} /> : null}
      {!history.length ? (
        <div style={{ padding: "0 20px" }}>
          <EmptyState icon={<ClipboardList size={20} />} title="Nothing logged yet" sub="Finished workouts show up here. Start one from Today." />
        </div>
      ) : grouped.map((g, gi) => (
        <Section key={gi} title={g.label} aside={`${g.items.length} session${g.items.length === 1 ? "" : "s"}`}>
          <div className="card" style={{ overflow: "hidden" }}>
            {g.items.map((w, i) => {
              const day = findDay(w.dayId);
              const d = new Date(w.startedAt);
              return (
                <button
                  key={w.id}
                  onClick={() => onOpen(w)}
                  className="tap"
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 14,
                    padding: "12px 16px", textAlign: "left",
                    borderTop: i === 0 ? "none" : `1px solid ${c.lineSoft}`,
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: day ? day.color : c.inset, color: day ? day.on : c.ink,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  }}>
                    <span className="display num" style={{ fontSize: 20 }}>{d.getDate()}</span>
                    <span style={{ fontSize: 9, fontWeight: 750, marginTop: 1, opacity: 0.85 }}>
                      {d.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{day ? day.label : "Workout"}</div>
                    <div className="num" style={{ fontSize: 13, color: c.ink3, marginTop: 1 }}>
                      {workoutSets(w)} set{workoutSets(w) === 1 ? "" : "s"}{w.completedAt ? `, ${fmtDur(w.completedAt - w.startedAt)}` : ""}
                    </div>
                  </div>
                  <div className="num" style={{ fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                    {fmtNum(workoutVolume(w))}<span style={{ fontSize: 12, color: c.ink3, marginLeft: 2 }}>lb</span>
                  </div>
                  <ChevronRight size={18} color={c.ink4} />
                </button>
              );
            })}
          </div>
        </Section>
      ))}
    </div>
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
                  >{s.warmup ? "W " : ""}{fmtSetShort(s.weight === "" ? "0" : s.weight, bw)} × {s.reps || "—"}</button>
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
function ProgressScreen({
  history, bodyweight, onBodyweightChange, themePref, onThemeChange,
  onExportClaude, onCopyClaude, onExportExcel, onBackup, onRestore, onEditRoutine, routineVersion,
}) {
  const [view, setView] = useState(() => ProgressScreen.lastView || "overview");
  useEffect(() => { ProgressScreen.lastView = view; }, [view]);
  const daysSince = daysSinceBackup();
  const backupDue = history.length >= 3 && daysSince >= 30;

  return (
    <div className="rise">
      <ScreenTitle title="Progress" />
      <div style={{ padding: "0 20px 22px" }}>
        <Segmented
          value={view}
          onChange={setView}
          options={[{ value: "overview", label: "Overview" }, { value: "exercise", label: "Exercises" }, { value: "data", label: "Setup" }]}
        />
      </div>

      {view !== "data" && backupDue ? (
        <div style={{ padding: "0 20px 16px" }}>
          <button
            onClick={() => setView("data")}
            className="tap"
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: a(c.caution, 12), textAlign: "left" }}
          >
            <Shield size={18} color={c.caution} />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
              {daysSince === Infinity ? "Your data isn't backed up yet" : `Last backup was ${daysSince} days ago`}
            </span>
            <ChevronRight size={18} color={c.ink3} />
          </button>
        </div>
      ) : null}

      {view === "overview" ? <OverviewView history={history} /> : null}
      {view === "exercise" ? <ExerciseView history={history} /> : null}
      {view === "data" ? (
        <DataView
          history={history}
          bodyweight={bodyweight}
          onBodyweightChange={onBodyweightChange}
          themePref={themePref}
          onThemeChange={onThemeChange}
          onExportClaude={onExportClaude}
          onCopyClaude={onCopyClaude}
          onExportExcel={onExportExcel}
          onBackup={onBackup}
          onRestore={onRestore}
          daysSince={daysSince}
          onEditRoutine={onEditRoutine}
        />
      ) : null}
    </div>
  );
}

function OverviewView({ history }) {
  const weekly = useMemo(() => weeklyData(history, 12), [history]);
  const prs = useMemo(() => computePRs(history), [history]);
  const improvements = useMemo(() => {
    const names = [];
    const seen = new Set();
    history.forEach(w => (w.exercises || []).forEach(e => { if (!seen.has(e.name)) { seen.add(e.name); names.push(e.name); } }));
    return names.map(name => {
      const ts = exerciseTimeSeries(history, name);
      if (ts.length < 2) return null;
      const first = ts[0], last = ts[ts.length - 1];
      if (first.e1rm && last.e1rm) {
        return { name, first: first.e1rm, last: last.e1rm, pct: (last.e1rm - first.e1rm) / first.e1rm * 100, est: true };
      }
      if (!first.top) return null;
      return { name, first: first.top, last: last.top, pct: (last.top - first.top) / first.top * 100, est: false, bw: last.bw };
    }).filter(x => x && x.pct >= 0.5).sort((x, y) => y.pct - x.pct).slice(0, 5);
  }, [history]);

  if (!history.length) {
    return (
      <div style={{ padding: "0 20px" }}>
        <EmptyState icon={<BarChart3 size={20} />} title="No data yet" sub="Finish a workout and your trends start here." />
      </div>
    );
  }

  const totalV = history.reduce((s, w) => s + workoutVolume(w), 0);
  const durs = history.filter(w => w.completedAt).map(w => w.completedAt - w.startedAt)
    .filter(d => d > 5 * 60000 && d < 3 * 3600000).sort((x, y) => x - y);
  const avgD = durs.length ? durs[Math.floor(durs.length / 2)] : 0;
  const byDay = DAYS.map(d => ({ ...d, count: history.filter(w => w.dayId === d.id).length }));
  const dayT = byDay.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <MuscleSets history={history} />

      <Section>
        <div className="card" style={{ padding: 18, display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 20, columnGap: 12 }}>
          <Stat label="Sessions" value={history.length} />
          <Stat label="Total volume" value={fmtNum(totalV)} unit="lb" />
          <Stat label="Per week, last 8" value={avgPerWeek(history)} />
          <Stat label="Typical session" value={avgD ? fmtDur(avgD) : "—"} />
        </div>
      </Section>

      <Section title="Sessions per week" aside="last 12 weeks">
        <div className="card" style={{ padding: "16px 10px 8px" }}>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={weekly} margin={{ top: 4, right: 6, left: -26, bottom: 0 }}>
              <CartesianGrid stroke={CHART_HEX.grid} vertical={false} />
              <XAxis dataKey="wk" tick={{ fill: CHART_HEX.muted, fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: CHART_HEX.muted, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTip field="sessions" unit="sessions" />} cursor={{ fill: CHART_HEX.grid }} />
              <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                {weekly.map((r, i) => <Cell key={i} fill={r.sessions > 0 ? CHART_HEX.ink : CHART_HEX.grid} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section title="Weekly volume" aside="lb">
        <AreaCard data={weekly} field="vol" unit="lb" tf={fmtNum} />
      </Section>

      <Section title="Split">
        <div className="card" style={{ padding: 18 }}>
          <div style={{ height: 10, borderRadius: 5, overflow: "hidden", display: "flex", gap: 2, background: c.inset }}>
            {byDay.map(d => (
              <div key={d.id} style={{ width: dayT ? `${(d.count / dayT) * 100}%` : "0%", background: d.color }} />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
            {byDay.map(d => (
              <div key={d.id}>
                <div className="display num" style={{ fontSize: 30 }}>{d.count}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                  <span style={{ fontSize: 13, color: c.ink3 }}>{d.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {improvements.length > 0 ? (
        <Section title="Most improved" aside="est. 1RM, first to latest">
          <div className="card" style={{ overflow: "hidden" }}>
            {improvements.map((imp, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderTop: i === 0 ? "none" : `1px solid ${c.lineSoft}` }}>
                <span className="display num" style={{ fontSize: 22, color: c.good, minWidth: 56 }}>+{imp.pct.toFixed(imp.pct < 10 ? 1 : 0)}%</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 650, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{imp.name}</div>
                  <div className="num" style={{ fontSize: 13, color: c.ink3, marginTop: 1 }}>
                    {imp.est ? `${imp.first} to ${imp.last} lb est. 1RM` : `${fmtLoadText(imp.first, imp.bw)} to ${fmtLoadText(imp.last, imp.bw)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {prs.length > 0 ? (
        <Section title="Personal records">
          <div className="card" style={{ overflow: "hidden" }}>
            {[...prs].sort((x, y) => y.date - x.date).slice(0, 10).map((pr, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: i === 0 ? "none" : `1px solid ${c.lineSoft}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 650, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pr.name}</div>
                  <div style={{ fontSize: 13, color: c.ink3, marginTop: 1 }}>Set {ago(pr.date)}</div>
                </div>
                <div className="num" style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 750 }}><LoadText weight={pr.top} bw={pr.bw} /></div>
                  <div style={{ fontSize: 12, color: c.ink3 }}>{pr.reps} reps{pr.e1rm ? `, est. 1RM ${pr.e1rm}` : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

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

function ExerciseView({ history }) {
  const routineNames = useMemo(() => new Set(DAYS.flatMap(d => d.exercises.map(e => e.name))), []);
  const otherNames = useMemo(() => {
    const s = new Set();
    history.forEach(w => (w.exercises || []).forEach(e => { if (!routineNames.has(e.name)) s.add(e.name); }));
    return Array.from(s).sort();
  }, [history, routineNames]);
  const [ex, setEx] = useState(() => ExerciseView.last || DAYS[0].exercises[0].name);
  const [picking, setPicking] = useState(false);
  useEffect(() => { ExerciseView.last = ex; }, [ex]);
  const exDay = DAYS.find(d => d.exercises.some(e => e.name === ex));
  const lineColor = exDay ? CHART_HEX[exDay.id] : CHART_HEX.ink;
  const series = useMemo(() => exerciseTimeSeries(history, ex), [history, ex]);
  const isBW = series.length ? series[series.length - 1].bw : isBodyweight(ex);
  const best = series.length ? series.reduce((b, s) => (s.top > b.top || (s.top === b.top && s.topReps > b.topReps)) ? s : b, series[0]) : null;
  const latest = series.length ? series[series.length - 1] : null;
  const hasE = series.length && series.every(s => s.e1rm);
  const bestE = hasE ? Math.max(...series.map(s => s.e1rm)) : 0;
  const eDelta = hasE && series.length >= 2 ? latest.e1rm - series[0].e1rm : 0;
  const delta = series.length >= 2 ? latest.top - series[0].top : 0;
  const rec = recommendNextSet(history, ex, (DAYS.flatMap(d => d.exercises).find(e => e.name === ex) || {}).reps || "8–12", isBW);

  return (
    <div>
      <Section>
        <button
          onClick={() => setPicking(true)}
          className="card tap"
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", textAlign: "left" }}
        >
          {exDay ? <MiniPlate color={exDay.color} on={exDay.on} size={34} /> : <div style={{ width: 34, height: 34, borderRadius: 99, background: c.inset }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 650, color: c.ink3 }}>{exDay ? `${exDay.label} day` : "No longer in routine"}</div>
            <div style={{ fontSize: 17, fontWeight: 750, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex}</div>
          </div>
          <span style={{ fontSize: 14, fontWeight: 650, color: c.ink2 }}>Change</span>
        </button>
      </Section>

      {!series.length ? (
        <div style={{ padding: "0 20px" }}>
          <EmptyState icon={<Activity size={20} />} title="No sets logged yet" sub="Log this exercise once and its trend appears here." />
        </div>
      ) : (
        <>
          <Section>
            <div className="card" style={{ padding: 18, display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 20, columnGap: 12 }}>
              <Stat label="Latest top set" value={`${fmtSetShort(latest.top, isBW)}×${latest.topReps}`} />
              {hasE ? (
                <>
                  <Stat label="Est. 1RM now" value={latest.e1rm} unit="lb" />
                  <Stat label="Best est. 1RM" value={bestE} unit="lb" />
                  <Stat label="Est. 1RM change" value={eDelta === 0 ? "0" : `${eDelta > 0 ? "+" : ""}${eDelta}`} unit="lb" />
                </>
              ) : (
                <>
                  <Stat label="Best" value={`${fmtSetShort(best.top, isBW)}×${best.topReps}`} />
                  <Stat label={isBW ? "Added weight change" : "Weight change"} value={delta === 0 ? "0" : `${delta > 0 ? "+" : ""}${delta}`} unit="lb" />
                </>
              )}
              {hasE ? null : <Stat label="Sessions" value={series.length} />}
            </div>
            {rec ? (
              <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 14, background: a(c.good, 10), display: "flex", alignItems: "center", gap: 10 }}>
                <TrendingUp size={17} color={c.good} strokeWidth={2.4} />
                <span style={{ fontSize: 14, color: c.ink2 }}>
                  Next time, try <strong className="num" style={{ color: c.ink }}>{fmtSetShort(rec.weight, isBW)} × {rec.reps}</strong>
                </span>
              </div>
            ) : null}
          </Section>
          <Section title={hasE ? "Estimated 1RM" : isBW ? "Added weight" : "Top weight"} aside={hasE ? "Epley, best set each session" : "lb"}>
            <AreaCard data={series} field={hasE ? "e1rm" : "top"} unit="lb" height={170} color={lineColor} />
          </Section>
          <Section title="Volume" aside={isBW ? "(bodyweight + added) × reps" : "weight × reps"}>
            <AreaCard data={series} field="vol" unit="lb" height={150} tf={fmtNum} accent />
          </Section>
          <Section title="Recent sessions">
            <div className="card" style={{ overflow: "hidden" }}>
              {[...series].reverse().slice(0, 10).map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: i === 0 ? "none" : `1px solid ${c.lineSoft}` }}>
                  <span style={{ fontSize: 14, color: c.ink2 }}>
                    {new Date(r.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <span className="num" style={{ fontSize: 15, fontWeight: 750 }}>
                    <LoadText weight={r.top} bw={r.bw} /> × {r.topReps}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}
      {picking ? (
        <ExerciseListSheet
          current={ex}
          otherNames={otherNames}
          history={history}
          onPick={n => { setEx(n); setPicking(false); }}
          onClose={() => setPicking(false)}
        />
      ) : null}
    </div>
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

function DataView({
  history, bodyweight, onBodyweightChange, themePref, onThemeChange,
  onExportClaude, onCopyClaude, onExportExcel, onBackup, onRestore, daysSince, onEditRoutine,
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
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 650 }}>Bodyweight</div>
              <div style={{ fontSize: 13, color: c.ink3, marginTop: 1 }}>Used for pull-up volume</div>
            </div>
            <input
              type="number"
              inputMode="decimal"
              aria-label="Bodyweight in pounds"
              value={bwVal}
              placeholder="—"
              onChange={e => setBwVal(e.target.value)}
              onBlur={commitBw}
              onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}
              className="num"
              style={{ width: 76, height: 44, borderRadius: 12, border: `1px solid ${c.line}`, background: c.surface, textAlign: "center", fontSize: 16, fontWeight: 750 }}
            />
            <span style={{ fontSize: 14, color: c.ink3 }}>lb</span>
          </div>
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
// CHARTS
// ═══════════════════════════════════════════════════════════════════════════
function AreaCard({ data, field, unit, height = 160, tf, accent, color: override }) {
  const color = override || (accent ? CHART_HEX.accent : CHART_HEX.ink);
  const gid = `grad_${field}_${String(color).replace("#", "")}`;
  const xKey = data[0] && data[0].label !== undefined ? "label" : "wk";
  return (
    <div className="card" style={{ padding: "16px 10px 8px 12px" }}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART_HEX.grid} vertical={false} />
          <XAxis dataKey={xKey} tick={{ fill: CHART_HEX.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: CHART_HEX.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={38} tickFormatter={tf} />
          <Tooltip content={<ChartTip field={field} unit={unit} />} cursor={{ stroke: CHART_HEX.muted, strokeDasharray: "2 3" }} />
          <Area type="monotone" dataKey={field} stroke={color} strokeWidth={2.2} fill={`url(#${gid})`} dot={{ fill: color, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTip({ active, payload, field, unit }) {
  if (!active || !payload || !payload.length) return null;
  const r = payload[0].payload;
  const label = r.label !== undefined ? r.label : r.wk;
  return (
    <div style={{ background: CHART_HEX.tip, border: `1px solid ${CHART_HEX.tipLine}`, borderRadius: 10, padding: "8px 12px", boxShadow: "0 4px 14px rgba(0,0,0,0.12)" }}>
      <div style={{ fontSize: 11, color: CHART_HEX.muted }}>{label}</div>
      <div className="num" style={{ fontSize: 15, fontWeight: 750, color: CHART_HEX.ink }}>
        {fmtNum(r[field])} <span style={{ fontSize: 11, color: CHART_HEX.muted }}>{unit}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TRAINING GRID — last 20 weeks, one square per day, colored by day
// ═══════════════════════════════════════════════════════════════════════════
function TrainingGrid({ history }) {
  const WEEKS = 20;
  const mon = mondayOf(Date.now());
  const start = addDays(mon, -7 * (WEEKS - 1));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const byDate = new Map();
  for (const w of history) {
    const d = new Date(w.startedAt); d.setHours(0, 0, 0, 0);
    if (!byDate.has(d.getTime())) byDate.set(d.getTime(), findDay(w.dayId));
  }
  const cols = Array.from({ length: WEEKS }, (_, wi) =>
    Array.from({ length: 7 }, (_, di) => {
      const d = addDays(start, wi * 7 + di); d.setHours(0, 0, 0, 0);
      return { t: d.getTime(), day: byDate.get(d.getTime()), future: d > today, today: d.getTime() === today.getTime() };
    })
  );
  const count = history.filter(w => w.startedAt >= start.getTime()).length;
  return (
    <Section title="Last 20 weeks" aside={`${count} session${count === 1 ? "" : "s"}`}>
      <div className="card" style={{ padding: 16 }}>
        <div role="img" aria-label={`${count} sessions in the last 20 weeks`} style={{ display: "grid", gridTemplateColumns: `repeat(${WEEKS}, 1fr)`, gap: 3 }}>
          {cols.map((col, i) => (
            <div key={i} style={{ display: "grid", gridTemplateRows: "repeat(7, auto)", gap: 3 }}>
              {col.map((cell, j) => (
                <div key={j} style={{
                  aspectRatio: "1 / 1", borderRadius: 3,
                  background: cell.day ? cell.day.color : cell.future ? "transparent" : c.inset,
                  boxShadow: cell.today ? `0 0 0 1.5px ${c.ink}` : "none",
                }} />
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12, fontSize: 12, color: c.ink3 }}>
          {DAYS.map(d => (
            <span key={d.id} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: d.color }} />{d.label}
            </span>
          ))}
          <span style={{ flex: 1 }} />
          <span>Mon at top</span>
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
