import { useState, useEffect, useMemo, useRef } from "react";
import {
  ChevronLeft, ChevronRight, ChevronDown, Plus, Check, Minus,
  TrendingUp, Activity, BarChart3, ClipboardList,
  Trophy, Download, Play, Trash2, X,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";

// ═══════════════════════════════════════════════════════════════════════════
// PROGRAM
// ═══════════════════════════════════════════════════════════════════════════
const DAYS = [
  {
    id: "push", n: 1, label: "Push", sub: "Chest · Shoulders · Triceps", color: "#E5484D",
    exercises: [
      { name: "Barbell Bench Press",      sets: 4, reps: "8–10",  rest: "2 min" },
      { name: "Incline DB Press",          sets: 3, reps: "10–12", rest: "90 s"  },
      { name: "Dumbbell Shoulder Press",   sets: 4, reps: "10–12", rest: "90 s"  },
      { name: "Lateral Raises (Cable)",    sets: 4, reps: "12–15", rest: "60 s"  },
      { name: "Cable Fly",                 sets: 3, reps: "12–15", rest: "60 s"  },
      { name: "Tricep Pushdown",           sets: 3, reps: "12–15", rest: "60 s"  },
      { name: "Overhead Tricep Extension", sets: 3, reps: "12–15", rest: "60 s"  },
    ],
  },
  {
    id: "pull", n: 2, label: "Pull", sub: "Back · Biceps · Rear Delts", color: "#0091FF",
    exercises: [
      { name: "Cable Row (Seated)",        sets: 4, reps: "10–12", rest: "90 s"  },
      { name: "Lat Pulldown",              sets: 4, reps: "10–12", rest: "90 s"  },
      { name: "Dumbbell Row (Single Arm)", sets: 3, reps: "10–12", rest: "90 s"  },
      { name: "Reverse Fly",               sets: 3, reps: "15–20", rest: "60 s"  },
      { name: "EZ Bar Curl",               sets: 3, reps: "10–12", rest: "60 s"  },
      { name: "Hammer Curl",               sets: 3, reps: "10–12", rest: "60 s"  },
    ],
  },
  {
    id: "legs", n: 3, label: "Legs", sub: "Quads · Hamstrings · Calves", color: "#F5A623",
    exercises: [
      { name: "Barbell Back Squat", sets: 4, reps: "8–10",  rest: "2 min" },
      { name: "Leg Extension",       sets: 3, reps: "12–15", rest: "60 s"  },
      { name: "Leg Curl",            sets: 3, reps: "12–15", rest: "60 s"  },
      { name: "Standing Calf Raise", sets: 4, reps: "15–20", rest: "60 s"  },
    ],
  },
];
const findDay = id => DAYS.find(d => d.id === id);

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════
const c = {
  bg:        "#FAFAFA",
  panel:     "#F4F4F5",
  card:      "#FFFFFF",
  border:    "#E4E4E7",
  borderSoft:"#EEEEEF",
  text:      "#09090B",
  text2:     "#52525B",
  text3:     "#71717A",
  text4:     "#A1A1AA",
  accent:    "#09090B",
  blue:      "#0091FF",
  green:     "#00A656",
  red:       "#E5484D",
  orange:    "#F5A623",
  shadowSm:  "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)",
  shadowMd:  "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)",
  shadowLg:  "0 4px 6px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.06)",
};

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL STYLES
// ═══════════════════════════════════════════════════════════════════════════
function GlobalCSS() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;550;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
      *, *::before, *::after { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
      html, body { margin: 0; padding: 0; background: ${c.bg}; font-family: 'Inter', system-ui, sans-serif; color: ${c.text}; }
      button { border: none; background: none; padding: 0; cursor: pointer; font-family: inherit; color: inherit; -webkit-tap-highlight-color: transparent; }
      input { font-family: 'JetBrains Mono', ui-monospace, monospace; outline: none; }
      input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      input[type=number] { -moz-appearance: textfield; }
      select { -webkit-appearance: none; appearance: none; font-family: inherit; outline: none; }
      ::-webkit-scrollbar { display: none; }
      .btn { transition: background 120ms ease, transform 100ms ease, opacity 100ms ease; }
      .btn:active { transform: scale(0.985); opacity: 0.85; }
      @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      .slide-up { animation: slideUp 180ms cubic-bezier(0.16, 1, 0.3, 1) both; }
      .fade-in { animation: fadeIn 140ms ease both; }
      .hover-bg:hover { background: ${c.panel}; }
    `}</style>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE — Uses browser localStorage (persists forever on the device)
// ═══════════════════════════════════════════════════════════════════════════
const KEY_WO_PREFIX = "workout_";
const KEY_ACTIVE = "active_workout";

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.error("[storage.set]", key, e);
    return false;
  }
}

function storageDelete(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function storageList(prefix) {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    return keys;
  } catch {
    return [];
  }
}

async function loadAllFromStorage() {
  const keys = storageList(KEY_WO_PREFIX);
  const activeRaw = storageGet(KEY_ACTIVE);

  const workouts = [];
  for (const k of keys) {
    const v = storageGet(k);
    if (!v) continue;
    try { workouts.push(JSON.parse(v)); } catch {}
  }
  workouts.sort((a, b) => b.startedAt - a.startedAt);

  let active = null;
  if (activeRaw) {
    try { active = JSON.parse(activeRaw); } catch {}
  }

  return { workouts, active };
}

async function persistWorkout(w) { return storageSet(KEY_WO_PREFIX + w.id, JSON.stringify(w)); }
async function deleteWorkoutFromStorage(id) { return storageDelete(KEY_WO_PREFIX + id); }
async function persistActive(w) { return storageSet(KEY_ACTIVE, JSON.stringify(w)); }
async function clearActiveStorage() { return storageDelete(KEY_ACTIVE); }

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

const workoutVolume = w => (w.exercises || []).reduce((s, ex) =>
  s + ex.sets.reduce((s2, set) => s2 + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0), 0);
const workoutSets = w => (w.exercises || []).reduce((s, ex) => s + ex.sets.filter(x => x.done).length, 0);

function findLastSet(history, exerciseName) {
  for (const w of history) {
    const ex = (w.exercises || []).find(e => e.name === exerciseName);
    if (!ex) continue;
    const done = ex.sets.filter(s => s.done && s.weight !== "" && s.reps !== "");
    if (done.length) return done[done.length - 1];
  }
  return null;
}

function exerciseTimeSeries(workouts, name) {
  const result = [];
  const sorted = [...workouts].sort((a, b) => a.startedAt - b.startedAt);
  for (const w of sorted) {
    const ex = (w.exercises || []).find(e => e.name === name);
    if (!ex) continue;
    const done = ex.sets.filter(s => s.done && Number(s.reps) > 0 && s.weight !== "");
    if (!done.length) continue;
    const top = Math.max(...done.map(s => Number(s.weight)));
    const topReps = Math.max(...done.filter(s => Number(s.weight) === top).map(s => Number(s.reps)));
    const vol = done.reduce((s, x) => s + Number(x.weight) * Number(x.reps), 0);
    result.push({ date: w.startedAt, label: fmtDate(w.startedAt), top, topReps, vol });
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

function computePRs(workouts) {
  const map = new Map();
  const sorted = [...workouts].sort((a, b) => a.startedAt - b.startedAt);
  for (const w of sorted) {
    for (const ex of (w.exercises || [])) {
      for (const set of ex.sets) {
        if (!set.done || !set.weight || !set.reps) continue;
        const wt = Number(set.weight);
        const rp = Number(set.reps);
        const cur = map.get(ex.name);
        if (!cur || wt > cur.top || (wt === cur.top && rp > cur.reps)) {
          map.set(ex.name, { top: wt, reps: rp, date: w.startedAt });
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
// EXCEL EXPORT
// ═══════════════════════════════════════════════════════════════════════════
function exportToExcel(workouts) {
  if (!workouts || !workouts.length) return;

  const toDate = ts => new Date(ts).toISOString().slice(0, 10);
  const sorted = [...workouts].sort((a, b) => a.startedAt - b.startedAt);

  const setsData = [["Date", "Day", "Exercise", "Set", "Weight (lb)", "Reps", "Volume (lb)", "Completed"]];
  for (const w of sorted) {
    const day = findDay(w.dayId);
    for (const ex of (w.exercises || [])) {
      ex.sets.forEach((s, i) => {
        const weight = Number(s.weight) || 0;
        const reps = Number(s.reps) || 0;
        setsData.push([
          toDate(w.startedAt),
          day ? day.label : w.dayId,
          ex.name,
          i + 1,
          weight,
          reps,
          weight * reps,
          s.done ? "Yes" : "No",
        ]);
      });
    }
  }

  const summaryData = [["Date", "Day", "Duration (min)", "Sets Done", "Total Volume (lb)"]];
  for (const w of sorted) {
    const day = findDay(w.dayId);
    summaryData.push([
      toDate(w.startedAt),
      day ? day.label : w.dayId,
      Math.round((w.completedAt - w.startedAt) / 60000),
      workoutSets(w),
      workoutVolume(w),
    ]);
  }

  const prsData = [["Exercise", "Top Weight (lb)", "Reps at Top", "Date"]];
  const prs = computePRs(workouts).sort((a, b) => b.top - a.top);
  for (const pr of prs) {
    prsData.push([pr.name, pr.top, pr.reps, toDate(pr.date)]);
  }

  const historyData = [["Exercise", "Date", "Top Weight (lb)", "Top Reps", "Volume (lb)"]];
  const allNames = new Set();
  workouts.forEach(w => (w.exercises || []).forEach(e => allNames.add(e.name)));
  const sortedNames = Array.from(allNames).sort();
  for (const name of sortedNames) {
    const series = exerciseTimeSeries(workouts, name);
    for (const r of series) {
      historyData.push([name, toDate(r.date), r.top, r.topReps, r.vol]);
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
// ACTION SHEET
// ═══════════════════════════════════════════════════════════════════════════
function ActionSheet({ title, message, actions, onDismiss }) {
  return (
    <div
      className="fade-in"
      onClick={onDismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(0, 0, 0, 0.32)",
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        padding: "0 10px 12px",
      }}
    >
      <div
        className="slide-up"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 480, width: "100%", margin: "0 auto" }}
      >
        {(title || message) ? (
          <div style={{
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderRadius: 16, marginBottom: 8, padding: "16px 16px",
            textAlign: "center", boxShadow: c.shadowLg,
          }}>
            {title ? <div style={{ fontWeight: 600, fontSize: 15, color: c.text, letterSpacing: "-0.005em" }}>{title}</div> : null}
            {message ? <div style={{ fontSize: 13, color: c.text2, marginTop: 4, lineHeight: 1.5 }}>{message}</div> : null}
          </div>
        ) : null}
        <div style={{
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: 16, overflow: "hidden", boxShadow: c.shadowLg,
        }}>
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={a.fn}
              className="btn hover-bg"
              style={{
                display: "block", width: "100%", padding: "15px",
                textAlign: "center", fontSize: 16,
                fontWeight: a.variant === "cancel" ? 500 : 600,
                color: a.variant === "danger" ? c.red : c.text,
                borderTop: i === 0 ? "none" : `0.5px solid ${c.borderSoft}`,
                background: "transparent",
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("home");
  const [tab, setTab] = useState("home");
  const [active, setActive] = useState(null);
  const [history, setHistory] = useState([]);
  const [detailWorkout, setDetailWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(null);
  const saveTimer = useRef(null);

  const isTab = screen === "home" || screen === "history" || screen === "progress";

  useEffect(() => {
    let mounted = true;
    loadAllFromStorage()
      .then(({ workouts, active: a }) => {
        if (!mounted) return;
        setHistory(workouts);
        setActive(a);
      })
      .catch(err => { console.error("Load failed:", err); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // Emergency save on page unload
  useEffect(() => {
    function handler() {
      if (active) {
        if (saveTimer.current) {
          clearTimeout(saveTimer.current);
          saveTimer.current = null;
        }
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

  const goTab = t => { setTab(t); setScreen(t); };
  const goBack = () => setScreen(tab);
  const showSheet = cfg => setSheet(cfg);
  const closeSheet = () => setSheet(null);

  function saveActiveWithDebounce(w, immediate) {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (immediate) {
      persistActive(w);
    } else {
      saveTimer.current = setTimeout(() => {
        persistActive(w);
        saveTimer.current = null;
      }, 800);
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
          targetSets: ex.sets,
          targetReps: ex.reps,
          rest: ex.rest,
          sets: Array.from({ length: ex.sets }, () => ({ weight: "", reps: "", done: false })),
        })),
      };
      setActive(w);
      setScreen("workout");
      await clearActiveStorage();
      await persistActive(w);
    };

    if (active) {
      showSheet({
        title: "Workout in progress",
        message: "You have a workout already started. What would you like to do?",
        actions: [
          { label: "Resume workout", variant: "default", fn: () => { closeSheet(); setScreen("workout"); } },
          { label: "Start new workout", variant: "danger", fn: () => { closeSheet(); createAndStart(); } },
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
        exercises: active.exercises
          .map(ex => ({ ...ex, sets: ex.sets.filter(s => s.done || s.weight !== "" || s.reps !== "") }))
          .filter(ex => ex.sets.length > 0),
      };
      if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }

      // AWAIT the save — critical for persistence across sessions
      await persistWorkout(completed);
      await clearActiveStorage();

      setActive(null);
      setHistory(prev => [completed, ...prev.filter(w => w.id !== completed.id)]);
      setTab("home");
      setScreen("home");
    };

    if (!hasDone) {
      showSheet({
        title: "No sets logged",
        message: "You haven't completed any sets yet. Finish the workout anyway?",
        actions: [
          { label: "Finish anyway", variant: "danger", fn: () => { closeSheet(); doFinish(); } },
          { label: "Keep training", variant: "cancel", fn: closeSheet },
        ],
      });
    } else {
      doFinish();
    }
  }

  function discardWorkout() {
    showSheet({
      title: "Discard workout?",
      message: "All progress for this session will be permanently lost.",
      actions: [
        { label: "Discard", variant: "danger", fn: async () => {
          closeSheet();
          if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
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
      message: "This will be permanently removed from your history.",
      actions: [
        { label: "Delete", variant: "danger", fn: async () => {
          closeSheet();
          setHistory(prev => prev.filter(w => w.id !== id));
          goBack();
          await deleteWorkoutFromStorage(id);
        }},
        { label: "Cancel", variant: "cancel", fn: closeSheet },
      ],
    });
  }

  function deleteExerciseFromActive(exIdx) {
    if (!active) return;
    const exName = active.exercises[exIdx] ? active.exercises[exIdx].name : "";
    showSheet({
      title: "Remove exercise?",
      message: exName ? `${exName} will be removed from this session.` : "This exercise will be removed.",
      actions: [
        { label: "Remove", variant: "danger", fn: () => {
          closeSheet();
          const next = { ...active, exercises: active.exercises.filter((_, i) => i !== exIdx) };
          updateActive(next, true);
        }},
        { label: "Cancel", variant: "cancel", fn: closeSheet },
      ],
    });
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: c.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <GlobalCSS />
        <span style={{ fontSize: 13, color: c.text3, fontWeight: 500 }}>Loading</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: c.bg }}>
      <GlobalCSS />
      <div style={{
        maxWidth: 480, margin: "0 auto", minHeight: "100vh",
        paddingBottom: isTab ? 76 : 0,
      }}>
        {screen === "home" ? (
          <HomeScreen
            history={history}
            active={active}
            onStart={startWorkout}
            onResume={() => setScreen("workout")}
          />
        ) : null}
        {screen === "history" ? (
          <HistoryScreen
            history={history}
            onOpen={w => { setDetailWorkout(w); setScreen("detail"); }}
          />
        ) : null}
        {screen === "progress" ? (
          <ProgressScreen
            history={history}
            onExport={() => exportToExcel(history)}
          />
        ) : null}
        {screen === "workout" && active ? (
          <WorkoutScreen
            workout={active}
            history={history}
            onUpdate={updateActive}
            onFinish={finishWorkout}
            onDiscard={discardWorkout}
            onDeleteExercise={deleteExerciseFromActive}
            onBack={goBack}
          />
        ) : null}
        {screen === "detail" && detailWorkout ? (
          <DetailScreen
            workout={detailWorkout}
            onBack={goBack}
            onDelete={deleteWorkoutAction}
          />
        ) : null}
      </div>

      {isTab ? <BottomNav tab={tab} onSwitch={goTab} /> : null}
      {sheet ? <ActionSheet {...sheet} onDismiss={closeSheet} /> : null}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BOTTOM NAV
// ═══════════════════════════════════════════════════════════════════════════
function BottomNav({ tab, onSwitch }) {
  const items = [
    { id: "home",     label: "Today",    Icon: Activity },
    { id: "history",  label: "History",  Icon: ClipboardList },
    { id: "progress", label: "Progress", Icon: BarChart3 },
  ];
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
      background: "rgba(250, 250, 250, 0.82)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderTop: `0.5px solid ${c.border}`,
    }}>
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex" }}>
        {items.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onSwitch(id)}
            className="btn"
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3, padding: "10px 0 18px",
              color: tab === id ? c.text : c.text3,
            }}
          >
            <Icon size={22} strokeWidth={tab === id ? 2.3 : 1.8} />
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.02em" }}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CARD PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════
function Card({ children, style, padded = true }) {
  const base = {
    background: c.card,
    borderRadius: 12,
    border: `1px solid ${c.border}`,
    boxShadow: c.shadowSm,
    overflow: "hidden",
  };
  const padStyle = padded ? { padding: 16 } : {};
  return <div style={{ ...base, ...padStyle, ...style }}>{children}</div>;
}

function StatTile({ label, value, unit }) {
  return (
    <div style={{
      background: c.card,
      border: `1px solid ${c.border}`,
      borderRadius: 12,
      padding: "12px 14px",
      boxShadow: c.shadowSm,
    }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: c.text3 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 5 }}>
        <span style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 21, fontWeight: 600, color: c.text, letterSpacing: "-0.01em",
        }}>{value}</span>
        {unit ? <span style={{ fontSize: 11, color: c.text3, fontWeight: 500 }}>{unit}</span> : null}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════════════════════════════════════
function HomeScreen({ history, active, onStart, onResume }) {
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);
  const thisWeek = history.filter(w => w.startedAt >= monday.getTime()).length;
  const avg = avgPerWeek(history);
  const totalVol = history.reduce((s, w) => s + workoutVolume(w), 0);
  const nxt = nextDay(history);
  const nxtDay = findDay(nxt);

  return (
    <div className="slide-up">
      <div style={{ padding: "44px 20px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: c.text3 }}>{greet()}</p>
          <p style={{
            margin: 0, fontSize: 11, fontWeight: 600,
            color: c.text3, letterSpacing: "0.02em", textTransform: "uppercase",
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          }}>{fmtToday(Date.now())}</p>
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: c.text, letterSpacing: "-0.025em", lineHeight: 1.1 }}>Peter</h1>
      </div>

      {active ? (
        <div style={{ padding: "16px 20px 0" }}>
          <button
            onClick={onResume}
            className="btn"
            style={{
              width: "100%",
              background: c.text,
              color: "#fff",
              borderRadius: 12,
              padding: "13px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: c.shadowMd,
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Play size={16} fill="white" color="white" />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.55)", letterSpacing: "0.04em" }}>IN PROGRESS</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginTop: 1 }}>
                Resume {findDay(active.dayId) ? findDay(active.dayId).label : ""}
              </div>
            </div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
              {fmtDur(Date.now() - active.startedAt)}
            </span>
          </button>
        </div>
      ) : null}

      <div style={{ padding: "16px 20px 0" }}>
        <Card padded style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            border: `1.5px solid ${thisWeek > 0 ? c.text : c.border}`,
            background: thisWeek > 0 ? c.text : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 20, fontWeight: 600,
              color: thisWeek > 0 ? "#fff" : c.text4,
            }}>{thisWeek}</span>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: c.text3 }}>THIS WEEK</div>
            <div style={{ fontSize: 17, fontWeight: 600, color: c.text, marginTop: 2, letterSpacing: "-0.01em" }}>
              {thisWeek === 0 ? "No sessions" : `${thisWeek} ${thisWeek === 1 ? "session" : "sessions"}`}
            </div>
            {history.length > 2 ? (
              <div style={{ fontSize: 12, color: c.text3, marginTop: 1 }}>
                {avg} avg / week · {history.length} total
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <div style={{ padding: "10px 20px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <StatTile label="Total volume" value={fmtNum(totalVol)} unit="lb" />
        <StatTile label="Personal records" value={computePRs(history).length} />
      </div>

      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: c.text3, letterSpacing: "0.04em", textTransform: "uppercase" }}>Start workout</p>
          {nxtDay ? (
            <p style={{ margin: 0, fontSize: 12, color: c.text3 }}>
              Next: <strong style={{ color: c.text, fontWeight: 600 }}>{nxtDay.label}</strong>
            </p>
          ) : null}
        </div>
        <Card padded={false}>
          {DAYS.map((day, i) => {
            const last = history.find(w => w.dayId === day.id);
            const isNext = day.id === nxt;
            return (
              <button
                key={day.id}
                onClick={() => onStart(day.id)}
                className="btn hover-bg"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "13px 16px",
                  textAlign: "left",
                  background: "transparent",
                  borderTop: i === 0 ? "none" : `0.5px solid ${c.borderSoft}`,
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: c.panel,
                  border: `1px solid ${c.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: 13, fontWeight: 600, color: c.text,
                  }}>{day.n}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: c.text, letterSpacing: "-0.005em" }}>{day.label}</span>
                    {isNext ? (
                      <span style={{
                        fontSize: 10, fontWeight: 500, color: c.text3,
                        letterSpacing: "0.02em", padding: "1px 6px",
                        border: `1px solid ${c.border}`, borderRadius: 4,
                        background: c.panel,
                      }}>NEXT</span>
                    ) : null}
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: c.text3 }}>{day.sub}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 11, fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: c.text3 }}>
                    {last ? timeAgo(last.startedAt) : "—"}
                  </p>
                </div>
                <ChevronRight size={15} color={c.text4} />
              </button>
            );
          })}
        </Card>
      </div>

      {history.length > 0 ? (
        <div style={{ padding: "24px 20px 0" }}>
          <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: c.text3, letterSpacing: "0.04em", textTransform: "uppercase" }}>Recent</p>
          <Card padded={false}>
            {history.slice(0, 3).map((w, i) => {
              const day = findDay(w.dayId);
              return (
                <div key={w.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px",
                  borderTop: i === 0 ? "none" : `0.5px solid ${c.borderSoft}`,
                }}>
                  <div style={{
                    width: 3, height: 28, borderRadius: 2,
                    background: day ? day.color : c.text4,
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: c.text, letterSpacing: "-0.005em" }}>
                      {day ? day.label : "Workout"}
                    </p>
                    <p style={{ margin: "1px 0 0", fontSize: 12, color: c.text3 }}>
                      {timeAgo(w.startedAt)} · {workoutSets(w)} sets · {fmtNum(workoutVolume(w))} lb
                    </p>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      ) : null}
      <div style={{ height: 20 }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKOUT SCREEN — Collapsible exercises
// ═══════════════════════════════════════════════════════════════════════════
function WorkoutScreen({ workout, history, onUpdate, onFinish, onDiscard, onDeleteExercise, onBack }) {
  const day = findDay(workout.dayId);
  const [elapsed, setElapsed] = useState(Date.now() - workout.startedAt);
  const [expanded, setExpanded] = useState({});  // all collapsed by default
  const [swiped, setSwiped] = useState(null);    // index of exercise swiped open
  const [addingExercise, setAddingExercise] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - workout.startedAt), 30000);
    return () => clearInterval(t);
  }, [workout.startedAt]);

  const totalSets = workout.exercises.reduce((s, ex) => s + ex.sets.length, 0);
  const doneSets = workout.exercises.reduce((s, ex) => s + ex.sets.filter(x => x.done).length, 0);

  function toggleExpanded(idx) {
    // If the card is swiped open, tapping closes the swipe rather than toggling expand
    if (swiped === idx) {
      setSwiped(null);
      return;
    }
    setExpanded(prev => {
      const next = { ...prev };
      if (next[idx]) delete next[idx];
      else next[idx] = true;
      return next;
    });
  }

  function editSet(ei, si, field, value) {
    const next = {
      ...workout,
      exercises: workout.exercises.map((ex, i) =>
        i !== ei ? ex : { ...ex, sets: ex.sets.map((s, j) => j !== si ? s : { ...s, [field]: value }) }
      ),
    };
    onUpdate(next, false);
  }
  function toggleDone(ei, si) {
    const set = workout.exercises[ei].sets[si];
    if (!set.done && (set.weight === "" || set.reps === "")) return;
    const next = {
      ...workout,
      exercises: workout.exercises.map((ex, i) =>
        i !== ei ? ex : { ...ex, sets: ex.sets.map((s, j) => j !== si ? s : { ...s, done: !s.done }) }
      ),
    };
    onUpdate(next, true);
  }
  function addSet(ei) {
    const next = {
      ...workout,
      exercises: workout.exercises.map((ex, i) =>
        i !== ei ? ex : { ...ex, sets: [...ex.sets, { weight: "", reps: "", done: false }] }
      ),
    };
    onUpdate(next, true);
  }
  function removeSet(ei, si) {
    const next = {
      ...workout,
      exercises: workout.exercises.map((ex, i) => {
        if (i !== ei) return ex;
        if (ex.sets.length <= 1) return ex;
        return { ...ex, sets: ex.sets.filter((_, j) => j !== si) };
      }),
    };
    onUpdate(next, true);
  }
  function addExercise(name, sets, reps, rest) {
    const n = Math.max(1, Math.min(10, Number(sets) || 3));
    const newEx = {
      name: name.trim(),
      targetSets: n,
      targetReps: reps.trim() || "—",
      rest: rest.trim() || "—",
      sets: Array.from({ length: n }, () => ({ weight: "", reps: "", done: false })),
    };
    const next = { ...workout, exercises: [...workout.exercises, newEx] };
    onUpdate(next, true);
    // Auto-expand the newly added exercise
    setExpanded(prev => ({ ...prev, [next.exercises.length - 1]: true }));
    setAddingExercise(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: c.bg }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(250, 250, 250, 0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `0.5px solid ${c.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", gap: 12 }}>
          <button onClick={onBack} className="btn" style={{
            display: "flex", alignItems: "center", color: c.text,
            fontSize: 14, fontWeight: 500, gap: 2, flexShrink: 0,
          }}>
            <ChevronLeft size={18} strokeWidth={2} /> Back
          </button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: c.text, letterSpacing: "-0.005em" }}>
              {day ? day.label : "Workout"}
            </p>
            <p style={{ margin: 0, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10, color: c.text3 }}>
              {fmtDur(elapsed)} · {doneSets}/{totalSets} sets
            </p>
          </div>
          <button onClick={onDiscard} className="btn" style={{
            color: c.red, fontWeight: 500, fontSize: 14, flexShrink: 0,
          }}>Discard</button>
        </div>
        <div style={{ height: 2, background: c.borderSoft }}>
          <div style={{
            height: "100%",
            width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%`,
            background: day ? day.color : c.text,
            transition: "width 300ms",
          }} />
        </div>
      </div>

      <div style={{ padding: "14px 16px 160px" }}>
        {workout.exercises.map((ex, ei) => (
          <ExerciseCard
            key={ei}
            exercise={ex}
            index={ei}
            prev={findLastSet(history, ex.name)}
            dayColor={day ? day.color : c.text}
            isExpanded={!!expanded[ei]}
            isSwipedOpen={swiped === ei}
            onToggleExpand={() => toggleExpanded(ei)}
            onSwipeOpen={() => setSwiped(ei)}
            onSwipeClose={() => setSwiped(null)}
            onDelete={() => { setSwiped(null); onDeleteExercise(ei); }}
            onEditSet={(si, f, v) => editSet(ei, si, f, v)}
            onToggleDone={(si) => toggleDone(ei, si)}
            onAddSet={() => addSet(ei)}
            onRemoveSet={(si) => removeSet(ei, si)}
          />
        ))}

        {/* Add exercise button or form */}
        {addingExercise ? (
          <AddExerciseForm
            onAdd={addExercise}
            onCancel={() => setAddingExercise(false)}
          />
        ) : (
          <button
            onClick={() => setAddingExercise(true)}
            className="btn hover-bg"
            style={{
              width: "100%",
              padding: "14px 0",
              marginTop: 4,
              borderRadius: 12,
              border: `1px dashed ${c.border}`,
              background: "transparent",
              color: c.text2,
              fontSize: 13,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Plus size={14} strokeWidth={2} /> Add exercise
          </button>
        )}

        {workout.exercises.length === 0 ? (
          <div style={{
            padding: 32,
            textAlign: "center",
            background: c.card,
            border: `1px solid ${c.border}`,
            borderRadius: 12,
            color: c.text3,
            fontSize: 14,
          }}>
            All exercises removed. Discard this session and start over.
          </div>
        ) : null}
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 150,
        background: "linear-gradient(to top, rgba(250,250,250,1) 55%, rgba(250,250,250,0))",
        padding: "28px 16px 24px",
      }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <button
            onClick={onFinish}
            className="btn"
            style={{
              width: "100%",
              background: c.text,
              color: "#fff",
              borderRadius: 12,
              padding: "15px 0",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: c.shadowMd,
            }}
          >
            <Check size={17} strokeWidth={2.5} /> Finish workout
          </button>
        </div>
      </div>
    </div>
  );
}

function ExerciseCard({
  exercise: ex, index: ei, prev, dayColor,
  isExpanded, isSwipedOpen,
  onToggleExpand, onSwipeOpen, onSwipeClose, onDelete,
  onEditSet, onToggleDone, onAddSet, onRemoveSet,
}) {
  const doneCount = ex.sets.filter(s => s.done).length;
  const isComplete = doneCount === ex.sets.length && doneCount > 0;

  // Swipe state lives in refs so it doesn't cause re-renders during the gesture
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const touchCurrentX = useRef(0);
  const isSwipingRef = useRef(false);
  const cardRef = useRef(null);

  const DELETE_REVEAL = 88; // px width of the red action behind

  // Keep the card's visual offset in sync with swiped-open state
  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${isSwipedOpen ? -DELETE_REVEAL : 0}px)`;
    }
  }, [isSwipedOpen]);

  function handleTouchStart(e) {
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
    touchCurrentX.current = isSwipedOpen ? -DELETE_REVEAL : 0;
    isSwipingRef.current = false;
    if (cardRef.current) cardRef.current.style.transition = "none";
  }

  function handleTouchMove(e) {
    if (touchStartX.current === null) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    // Lock in swipe direction — horizontal motion > 8px AND more horizontal than vertical
    if (!isSwipingRef.current) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        isSwipingRef.current = true;
      } else if (Math.abs(dy) > 8) {
        // User is scrolling — bail
        touchStartX.current = null;
        return;
      } else {
        return;
      }
    }
    const base = isSwipedOpen ? -DELETE_REVEAL : 0;
    let offset = base + dx;
    // Clamp: only allow left-swipe from rest, and don't over-swipe past reveal
    if (offset > 0) offset = 0;
    if (offset < -DELETE_REVEAL - 20) offset = -DELETE_REVEAL - 20;
    touchCurrentX.current = offset;
    if (cardRef.current) cardRef.current.style.transform = `translateX(${offset}px)`;
  }

  function handleTouchEnd() {
    if (cardRef.current) cardRef.current.style.transition = "transform 200ms cubic-bezier(0.16, 1, 0.3, 1)";
    if (isSwipingRef.current) {
      // Snap to open or closed based on final position
      const shouldOpen = touchCurrentX.current < -DELETE_REVEAL / 2;
      if (shouldOpen && !isSwipedOpen) onSwipeOpen();
      else if (!shouldOpen && isSwipedOpen) onSwipeClose();
      else {
        // Reset visual to current logical state
        if (cardRef.current) cardRef.current.style.transform = `translateX(${isSwipedOpen ? -DELETE_REVEAL : 0}px)`;
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    isSwipingRef.current = false;
  }

  function handleCardClick(e) {
    // If we just completed a swipe, don't fire click
    if (isSwipingRef.current) { e.preventDefault(); return; }
    // If card is swiped open, close it rather than toggling expand
    if (isSwipedOpen) { onSwipeClose(); return; }
    onToggleExpand();
  }

  return (
    <div style={{ position: "relative", marginBottom: 10, borderRadius: 12, overflow: "hidden" }}>
      {/* Red delete action, revealed behind */}
      <div style={{
        position: "absolute", inset: 0,
        background: c.red, display: "flex",
        alignItems: "center", justifyContent: "flex-end",
        padding: "0 24px",
      }}>
        <button
          onClick={onDelete}
          style={{
            color: "#fff",
            background: "transparent",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <Trash2 size={18} strokeWidth={2} color="#fff" />
          Remove
        </button>
      </div>

      {/* Card itself — translates on swipe */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          position: "relative",
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: c.shadowSm,
          transform: `translateX(${isSwipedOpen ? -DELETE_REVEAL : 0}px)`,
          transition: "transform 200ms cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "transform",
        }}
      >
        <button
          onClick={handleCardClick}
          className="btn"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "13px 14px",
            textAlign: "left",
            background: "transparent",
          }}
        >
          <ChevronDown
            size={16}
            color={c.text3}
            strokeWidth={2}
            style={{
              flexShrink: 0,
              transition: "transform 200ms ease",
              transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: c.text, letterSpacing: "-0.005em" }}>{ex.name}</span>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: c.text3 }}>
              {ex.targetSets} × {ex.targetReps} · Rest {ex.rest}
            </p>
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 12, fontWeight: 600,
            color: isComplete ? c.green : c.text3,
            padding: "2px 7px",
            borderRadius: 5,
            background: isComplete ? `${c.green}14` : c.panel,
            border: `1px solid ${isComplete ? `${c.green}40` : c.border}`,
            flexShrink: 0,
          }}>{doneCount}/{ex.sets.length}</span>
        </button>

        {isExpanded ? (
          <div style={{ borderTop: `0.5px solid ${c.borderSoft}` }}>
            {prev ? (
              <div style={{
                padding: "8px 14px",
                fontSize: 11,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                color: c.text3,
                background: c.panel,
                borderBottom: `0.5px solid ${c.borderSoft}`,
              }}>
                Last time: {prev.weight} lb × {prev.reps} reps
              </div>
            ) : null}
            <div style={{
              display: "grid",
              gridTemplateColumns: "28px 1fr 1fr 52px",
              gap: 8,
              padding: "7px 14px 4px",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.04em",
              color: c.text3,
              textTransform: "uppercase",
            }}>
              <span>#</span>
              <span style={{ textAlign: "center" }}>Weight</span>
              <span style={{ textAlign: "center" }}>Reps</span>
              <span style={{ textAlign: "center" }}>Done</span>
            </div>
            {ex.sets.map((set, si) => (
              <SetRow
                key={si}
                set={set}
                idx={si}
                prev={prev}
                dayColor={dayColor}
                onChange={(f, v) => onEditSet(si, f, v)}
                onToggle={() => onToggleDone(si)}
                onRemove={() => onRemoveSet(si)}
              />
            ))}
            <button
              onClick={onAddSet}
              className="btn hover-bg"
              style={{
                width: "100%",
                padding: "10px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 500,
                color: c.text,
                background: "transparent",
                borderTop: `0.5px solid ${c.borderSoft}`,
              }}
            >
              <Plus size={14} strokeWidth={2} /> Add set
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AddExerciseForm({ onAdd, onCancel }) {
  const [name, setName] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10–12");
  const [rest, setRest] = useState("90 s");

  function handleSubmit() {
    if (!name.trim()) return;
    onAdd(name, sets, reps, rest);
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 14,
    fontWeight: 500,
    fontFamily: "'Inter', system-ui, sans-serif",
    border: `1px solid ${c.border}`,
    borderRadius: 8,
    background: c.card,
    color: c.text,
    outline: "none",
  };
  const labelStyle = {
    fontSize: 11, fontWeight: 500, color: c.text3,
    letterSpacing: "0.02em", textTransform: "uppercase",
    marginBottom: 4, display: "block",
  };

  return (
    <div style={{
      background: c.card,
      border: `1px solid ${c.border}`,
      borderRadius: 12,
      padding: 14,
      marginTop: 4,
      boxShadow: c.shadowSm,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: c.text, letterSpacing: "-0.005em" }}>New exercise</p>
        <button onClick={onCancel} className="btn" style={{ color: c.text3, padding: 2 }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Face Pull"
          autoFocus
          style={inputStyle}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: 8, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Sets</label>
          <input type="number" inputMode="numeric" value={sets} onChange={e => setSets(e.target.value)} style={{ ...inputStyle, textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }} />
        </div>
        <div>
          <label style={labelStyle}>Reps</label>
          <input type="text" value={reps} onChange={e => setReps(e.target.value)} style={{ ...inputStyle, textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }} />
        </div>
        <div>
          <label style={labelStyle}>Rest</label>
          <input type="text" value={rest} onChange={e => setRest(e.target.value)} style={{ ...inputStyle, textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }} />
        </div>
      </div>
      <button
        onClick={handleSubmit}
        disabled={!name.trim()}
        className="btn"
        style={{
          width: "100%",
          padding: "11px 0",
          borderRadius: 9,
          background: name.trim() ? c.text : c.panel,
          color: name.trim() ? "#fff" : c.text4,
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: "-0.005em",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <Plus size={14} strokeWidth={2.5} /> Add to workout
      </button>
    </div>
  );
}

function SetRow({ set, idx, prev, dayColor, onChange, onToggle, onRemove }) {
  const ready = set.weight !== "" && set.reps !== "";
  const inputStyle = {
    borderRadius: 7,
    padding: "7px 4px",
    fontSize: 14,
    fontWeight: 600,
    textAlign: "center",
    width: "100%",
    border: `1px solid ${set.done ? "transparent" : c.border}`,
    background: set.done ? "transparent" : c.panel,
    color: set.done ? dayColor : c.text,
  };
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "28px 1fr 1fr 52px",
      gap: 8,
      padding: "5px 14px",
      alignItems: "center",
      background: set.done ? `${dayColor}0A` : "transparent",
    }}>
      <span style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 12, fontWeight: 600,
        color: set.done ? dayColor : c.text3,
      }}>{idx + 1}</span>
      <input
        type="number"
        inputMode="decimal"
        value={set.weight}
        placeholder={prev && prev.weight !== undefined ? String(prev.weight) : "—"}
        onChange={e => onChange("weight", e.target.value)}
        style={inputStyle}
      />
      <input
        type="number"
        inputMode="numeric"
        value={set.reps}
        placeholder={prev && prev.reps !== undefined ? String(prev.reps) : "—"}
        onChange={e => onChange("reps", e.target.value)}
        style={inputStyle}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <button onClick={onRemove} className="btn" style={{ color: c.text4, padding: 3 }}>
          <Minus size={13} />
        </button>
        <button
          onClick={onToggle}
          disabled={!ready && !set.done}
          className="btn"
          style={{
            width: 26, height: 26, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: set.done ? dayColor : "transparent",
            border: `1.5px solid ${set.done ? dayColor : (ready ? c.text2 : c.border)}`,
            opacity: !ready && !set.done ? 0.4 : 1,
            flexShrink: 0,
          }}
        >
          {set.done ? <Check size={13} strokeWidth={3} color="#fff" /> : null}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HISTORY SCREEN
// ═══════════════════════════════════════════════════════════════════════════
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
    <div className="slide-up">
      <div style={{ padding: "44px 20px 12px" }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: c.text, letterSpacing: "-0.025em" }}>History</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: c.text3 }}>
          {history.length} session{history.length !== 1 ? "s" : ""} completed
        </p>
      </div>
      <div style={{ padding: "0 20px 24px" }}>
        {!history.length ? (
          <EmptyState
            icon={<ClipboardList size={24} color={c.text4} />}
            title="No workouts yet"
            sub="Start a session from Today to begin tracking."
          />
        ) : (
          grouped.map((g, gi) => (
            <div key={gi} style={{ marginBottom: 20 }}>
              <p style={{
                margin: "0 0 8px 4px",
                fontSize: 11, fontWeight: 600,
                color: c.text3, letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}>{g.label}</p>
              <Card padded={false}>
                {g.items.map((w, i) => {
                  const day = findDay(w.dayId);
                  return (
                    <button
                      key={w.id}
                      onClick={() => onOpen(w)}
                      className="btn hover-bg"
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "13px 16px",
                        textAlign: "left",
                        background: "transparent",
                        borderTop: i === 0 ? "none" : `0.5px solid ${c.borderSoft}`,
                      }}
                    >
                      <div style={{
                        width: 3, height: 32, borderRadius: 2,
                        background: day ? day.color : c.text4,
                        flexShrink: 0,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: c.text, letterSpacing: "-0.005em" }}>
                          {day ? day.label : "Workout"}
                        </p>
                        <p style={{ margin: "1px 0 0", fontSize: 12, color: c.text3 }}>{fmtLong(w.startedAt)}</p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{
                          margin: 0,
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: 12, fontWeight: 600, color: c.text,
                        }}>
                          {fmtNum(workoutVolume(w))}<span style={{ fontSize: 10, color: c.text3, marginLeft: 2 }}>lb</span>
                        </p>
                        <p style={{
                          margin: "1px 0 0",
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: 10, color: c.text3,
                        }}>{workoutSets(w)} sets</p>
                      </div>
                      <ChevronRight size={15} color={c.text4} />
                    </button>
                  );
                })}
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DETAIL SCREEN
// ═══════════════════════════════════════════════════════════════════════════
function DetailScreen({ workout, onBack, onDelete }) {
  const day = findDay(workout.dayId);
  return (
    <div className="slide-up" style={{ minHeight: "100vh", background: c.bg }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(250, 250, 250, 0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `0.5px solid ${c.border}`,
        padding: "12px 16px",
      }}>
        <button onClick={onBack} className="btn" style={{
          display: "flex", alignItems: "center",
          color: c.text, fontSize: 14, fontWeight: 500, gap: 2,
        }}>
          <ChevronLeft size={18} strokeWidth={2} /> History
        </button>
      </div>
      <div style={{ padding: "20px 20px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: day ? day.color : c.text }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: day ? day.color : c.text, letterSpacing: "0.01em" }}>
            {day ? day.label.toUpperCase() : ""}
          </span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: c.text, margin: "0 0 18px", letterSpacing: "-0.025em" }}>
          {fmtLong(workout.startedAt)}
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          <StatTile label="Sets" value={workoutSets(workout)} />
          <StatTile label="Duration" value={fmtDur(workout.completedAt - workout.startedAt)} />
          <StatTile label="Volume" value={fmtNum(workoutVolume(workout))} unit="lb" />
        </div>

        {(workout.exercises || []).map((ex, i) => (
          <div key={i} style={{
            background: c.card,
            border: `1px solid ${c.border}`,
            borderRadius: 12,
            marginBottom: 10,
            overflow: "hidden",
            boxShadow: c.shadowSm,
          }}>
            <div style={{ padding: "12px 16px 8px" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: c.text }}>{ex.name}</p>
              <p style={{ margin: "1px 0 0", fontSize: 11, color: c.text3 }}>Target: {ex.targetSets}×{ex.targetReps}</p>
            </div>
            <div style={{ borderTop: `0.5px solid ${c.borderSoft}` }}>
              {ex.sets.map((set, j) => (
                <div key={j} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 16px",
                  borderTop: j === 0 ? "none" : `0.5px solid ${c.borderSoft}`,
                }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: 11, fontWeight: 600, width: 16,
                    color: set.done ? (day ? day.color : c.green) : c.text3,
                  }}>{j + 1}</span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: 13, fontWeight: 500, flex: 1, color: c.text,
                  }}>
                    {set.weight || "—"}<span style={{ fontSize: 10, color: c.text3, marginLeft: 2 }}>lb</span>
                    <span style={{ color: c.text4, margin: "0 8px" }}>×</span>
                    {set.reps || "—"}<span style={{ fontSize: 10, color: c.text3, marginLeft: 2 }}>reps</span>
                  </span>
                  {set.done ? <Check size={12} color={day ? day.color : c.green} strokeWidth={2.5} /> : null}
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={() => onDelete(workout.id)}
          className="btn"
          style={{
            width: "100%", marginTop: 8, padding: "13px 0",
            borderRadius: 12,
            background: c.card,
            border: `1px solid ${c.border}`,
            color: c.red, fontWeight: 500, fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <Trash2 size={14} /> Delete workout
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS SCREEN
// ═══════════════════════════════════════════════════════════════════════════
function ProgressScreen({ history, onExport }) {
  const [view, setView] = useState("overview");

  return (
    <div className="slide-up">
      <div style={{ padding: "44px 20px 12px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: c.text, letterSpacing: "-0.025em" }}>Progress</h1>
        <button
          onClick={onExport}
          disabled={!history.length}
          className="btn"
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 12px", borderRadius: 8,
            fontSize: 12, fontWeight: 500,
            color: history.length ? c.text : c.text4,
            background: c.card,
            border: `1px solid ${c.border}`,
            boxShadow: c.shadowSm,
          }}
        >
          <Download size={12} /> Export
        </button>
      </div>
      <div style={{ padding: "12px 20px 16px" }}>
        <div style={{
          background: c.panel,
          border: `1px solid ${c.border}`,
          borderRadius: 9,
          padding: 3,
          display: "flex",
        }}>
          {[{ k: "overview", l: "Overview" }, { k: "exercise", l: "By Exercise" }].map(({ k, l }) => (
            <button
              key={k}
              onClick={() => setView(k)}
              className="btn"
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                background: view === k ? c.card : "transparent",
                color: view === k ? c.text : c.text3,
                border: view === k ? `0.5px solid ${c.border}` : "0.5px solid transparent",
                boxShadow: view === k ? c.shadowSm : "none",
              }}
            >{l}</button>
          ))}
        </div>
      </div>
      {view === "overview" ? <OverviewView history={history} /> : <ExerciseView history={history} />}
    </div>
  );
}

function OverviewView({ history }) {
  const weekly = useMemo(() => weeklyData(history, 12), [history]);
  const prs = useMemo(() => computePRs(history), [history]);
  const improvements = useMemo(() => {
    if (!history.length) return [];
    const names = [];
    const seen = new Set();
    history.forEach(w => (w.exercises || []).forEach(e => {
      if (!seen.has(e.name)) { seen.add(e.name); names.push(e.name); }
    }));
    return names.map(name => {
      const ts = exerciseTimeSeries(history, name);
      if (ts.length < 2) return null;
      return { name, first: ts[0].top, last: ts[ts.length - 1].top, delta: ts[ts.length - 1].top - ts[0].top };
    }).filter(x => x && x.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 5);
  }, [history]);

  if (!history.length) {
    return (
      <div style={{ padding: "0 20px" }}>
        <EmptyState
          icon={<BarChart3 size={24} color={c.text4} />}
          title="No data yet"
          sub="Complete your first workout to see trends."
        />
      </div>
    );
  }

  const totalV = history.reduce((s, w) => s + workoutVolume(w), 0);
  const avgD = history.reduce((s, w) => s + (w.completedAt - w.startedAt), 0) / history.length;
  const byDay = DAYS.map(d => ({ ...d, count: history.filter(w => w.dayId === d.id).length }));
  const dayT = byDay.reduce((s, d) => s + d.count, 0);

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ padding: "0 20px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <StatTile label="Total sessions" value={history.length} />
        <StatTile label="Total volume" value={fmtNum(totalV)} unit="lb" />
        <StatTile label="Avg per week" value={avgPerWeek(history)} unit="sessions" />
        <StatTile label="Avg duration" value={fmtDur(avgD)} />
      </div>

      <Section title="Sessions per week">
        <Card style={{ padding: "14px 10px 10px" }}>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={weekly} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid stroke={c.borderSoft} vertical={false} />
              <XAxis dataKey="wk" tick={{ fill: c.text3, fontSize: 9, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: c.text3, fontSize: 9, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CTip field="sessions" unit="sessions" />} cursor={{ fill: `${c.text}08` }} />
              <Bar dataKey="sessions" radius={[3, 3, 0, 0]}>
                {weekly.map((r, i) => <Cell key={i} fill={r.sessions > 0 ? c.text : c.borderSoft} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Section>

      <Section title="Weekly volume">
        <AreaCard data={weekly} field="vol" color={c.text} unit="lb" tf={fmtNum} />
      </Section>

      <Section title="Training split">
        <Card>
          <div style={{
            height: 6, borderRadius: 4, overflow: "hidden",
            display: "flex", background: c.borderSoft, marginBottom: 14,
          }}>
            {byDay.map(d => (
              <div key={d.id} style={{
                width: dayT ? `${(d.count / dayT) * 100}%` : "0%",
                background: d.color,
              }} />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {byDay.map(d => (
              <div key={d.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: d.color }} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: c.text3 }}>{d.label}</span>
                </div>
                <span style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: 19, fontWeight: 600, color: c.text,
                }}>{d.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      {improvements.length > 0 ? (
        <Section title="Most improved">
          <Card padded={false}>
            {improvements.map((imp, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 14px",
                borderTop: i === 0 ? "none" : `0.5px solid ${c.borderSoft}`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${c.green}14`,
                  border: `1px solid ${c.green}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: 11, fontWeight: 600, color: c.green,
                  }}>+{imp.delta}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0, fontSize: 13, fontWeight: 500, color: c.text,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{imp.name}</p>
                  <p style={{
                    margin: "1px 0 0", fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: 11, color: c.text3,
                  }}>{imp.first} → {imp.last} lb</p>
                </div>
                <TrendingUp size={12} color={c.green} />
              </div>
            ))}
          </Card>
        </Section>
      ) : null}

      {prs.length > 0 ? (
        <Section title="Personal records">
          <Card padded={false}>
            {prs.sort((a, b) => b.top - a.top).slice(0, 8).map((pr, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 14px",
                borderTop: i === 0 ? "none" : `0.5px solid ${c.borderSoft}`,
              }}>
                <Trophy size={13} color={c.orange} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0, fontSize: 13, fontWeight: 500, color: c.text,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{pr.name}</p>
                  <p style={{ margin: "1px 0 0", fontSize: 11, color: c.text3 }}>{timeAgo(pr.date)}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{
                    margin: 0, fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: 13, fontWeight: 600, color: c.text,
                  }}>{pr.top}<span style={{ fontSize: 10, color: c.text3, marginLeft: 2 }}>lb</span></p>
                  <p style={{
                    margin: 0, fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: 10, color: c.text3,
                  }}>{pr.reps} reps</p>
                </div>
              </div>
            ))}
          </Card>
        </Section>
      ) : null}
    </div>
  );
}

function ExerciseView({ history }) {
  const [ex, setEx] = useState("Barbell Bench Press");
  const series = useMemo(() => exerciseTimeSeries(history, ex), [history, ex]);
  const top = series.length ? Math.max(...series.map(s => s.top)) : 0;
  const delta = series.length >= 2 ? series[series.length - 1].top - series[0].top : 0;

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ padding: "0 20px 14px" }}>
        <Card style={{ padding: "12px 14px" }}>
          <p style={{
            margin: "0 0 4px", fontSize: 10, fontWeight: 500,
            letterSpacing: "0.04em", color: c.text3, textTransform: "uppercase",
          }}>Exercise</p>
          <select
            value={ex}
            onChange={e => setEx(e.target.value)}
            style={{
              width: "100%",
              background: "transparent",
              color: c.text,
              fontWeight: 600,
              fontSize: 15,
              border: "none",
              outline: "none",
              letterSpacing: "-0.005em",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2371717A'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0 center",
              paddingRight: 18,
            }}
          >
            {DAYS.map(d => (
              <optgroup key={d.id} label={d.label}>
                {d.exercises.map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
              </optgroup>
            ))}
          </select>
        </Card>
      </div>

      <div style={{ padding: "0 20px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <StatTile label="Sessions" value={series.length || "—"} />
        <StatTile label="Top wt" value={top || "—"} unit={top ? "lb" : ""} />
        <StatTile label="Change" value={delta === 0 ? "—" : (delta > 0 ? `+${delta}` : String(delta))} unit={delta !== 0 ? "lb" : ""} />
      </div>

      {!series.length ? (
        <div style={{ padding: "0 20px" }}>
          <EmptyState
            icon={<Activity size={24} color={c.text4} />}
            title="No data yet"
            sub="Log a set for this exercise to see your trend."
          />
        </div>
      ) : (
        <>
          <Section title="Top weight">
            <AreaCard data={series} field="top" color={c.text} unit="lb" height={160} />
          </Section>
          <Section title="Volume" sub="weight × reps">
            <AreaCard data={series} field="vol" color={c.orange} unit="lb" height={140} tf={fmtNum} />
          </Section>
          <Section title="Sessions">
            <Card padded={false}>
              {[...series].reverse().slice(0, 10).map((r, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px",
                  borderTop: i === 0 ? "none" : `0.5px solid ${c.borderSoft}`,
                }}>
                  <span style={{ fontSize: 12, color: c.text2, fontWeight: 500 }}>
                    {new Date(r.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: 12, fontWeight: 600, color: c.text,
                  }}>
                    <span style={{ color: c.text }}>{r.top}</span>
                    <span style={{ fontSize: 10, color: c.text3, marginLeft: 2 }}>lb</span>
                    <span style={{ color: c.text4, margin: "0 6px" }}>×</span>
                    {r.topReps}
                    <span style={{ fontSize: 10, color: c.text3, marginLeft: 2 }}>reps</span>
                  </span>
                </div>
              ))}
            </Card>
          </Section>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED
// ═══════════════════════════════════════════════════════════════════════════
function Section({ title, sub, children }) {
  return (
    <div style={{ padding: "0 20px 16px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: c.text3, letterSpacing: "0.04em", textTransform: "uppercase" }}>{title}</p>
        {sub ? <span style={{ fontSize: 11, color: c.text3 }}>{sub}</span> : null}
      </div>
      {children}
    </div>
  );
}

function AreaCard({ data, field, color, unit, height = 150, tf }) {
  const gid = `grad_${field}_${color.replace("#", "")}`;
  const xKey = data[0] && data[0].label !== undefined ? "label" : "wk";
  return (
    <Card style={{ padding: "14px 10px 10px 14px" }}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 6, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.12} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={c.borderSoft} vertical={false} />
          <XAxis dataKey={xKey} tick={{ fill: c.text3, fontSize: 9, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: c.text3, fontSize: 9, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }} axisLine={false} tickLine={false} width={34} tickFormatter={tf} />
          <Tooltip content={<CTip field={field} unit={unit} />} cursor={{ stroke: `${color}40`, strokeDasharray: "2 3" }} />
          <Area type="monotone" dataKey={field} stroke={color} strokeWidth={1.5} fill={`url(#${gid})`} dot={{ fill: color, r: 2.5, strokeWidth: 0 }} activeDot={{ r: 4, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

function CTip({ active, payload, field, unit }) {
  if (!active || !payload || !payload.length) return null;
  const r = payload[0].payload;
  const label = r.label !== undefined ? r.label : r.wk;
  return (
    <div style={{
      background: "rgba(255,255,255,0.97)",
      backdropFilter: "blur(16px)",
      border: `1px solid ${c.border}`,
      borderRadius: 8,
      padding: "7px 10px",
      boxShadow: c.shadowMd,
    }}>
      <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 500, color: c.text3 }}>{label}</p>
      <p style={{
        margin: 0,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 13, fontWeight: 600, color: c.text,
      }}>
        {fmtNum(r[field])}
        <span style={{ fontSize: 10, color: c.text3, marginLeft: 3 }}>{unit}</span>
      </p>
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{
      background: c.card,
      border: `1px solid ${c.border}`,
      borderRadius: 12,
      padding: "36px 20px",
      textAlign: "center",
      boxShadow: c.shadowSm,
    }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>{icon}</div>
      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: c.text, letterSpacing: "-0.005em" }}>{title}</p>
      {sub ? <p style={{ margin: "4px 0 0", fontSize: 12, color: c.text3, lineHeight: 1.5 }}>{sub}</p> : null}
    </div>
  );
}
