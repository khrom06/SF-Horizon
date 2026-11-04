// Pure logic: solar forecast series, tariff windows and the "best time to run a load" search. No DOM, no network.
const HZ_STEP = 15 * 60e3;   // search resolution: 15 minutes

// "00:56-06:56" or {start, end} -> {from, to} in minutes since midnight. Windows may cross midnight. Invalid entries are dropped.
function hzParseWindows(list) {
  const out = [];
  for (const w of Array.isArray(list) ? list : []) {
    let a, b;
    if (typeof w === "string") { const m = w.match(/^\s*(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\s*$/); if (!m) continue; a = +m[1] * 60 + +m[2]; b = +m[3] * 60 + +m[4]; }
    else if (w && typeof w === "object") { const p = (s) => { const m = String(s).match(/^(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : NaN; }; a = p(w.start); b = p(w.end); }
    if (Number.isFinite(a) && Number.isFinite(b) && a >= 0 && b >= 0 && a < 1440 + 1 && b < 1440 + 1 && a !== b) out.push({ from: a, to: b });
  }
  return out;
}
function hzIsOffpeak(tMs, windows) {
  const d = new Date(tMs), m = d.getHours() * 60 + d.getMinutes();
  return windows.some((w) => (w.from < w.to ? m >= w.from && m < w.to : m >= w.from || m < w.to));
}

// Merge the `watts` attribute (ISO time -> W) of one or more forecast entities into a sorted [{t, w}] series.
function hzSeries(states, ids) {
  const map = new Map();
  for (const id of ids) {
    const a = states[id] && states[id].attributes, src = a && (a.watts || a.wh_period_15m);
    if (!src || typeof src !== "object") continue;
    const isEnergy = !a.watts;   // wh_period_15m is Wh per 15 min -> W = Wh * 4
    for (const k of Object.keys(src)) { const t = Date.parse(k), v = parseFloat(src[k]); if (Number.isFinite(t) && Number.isFinite(v)) map.set(t, Math.max(0, isEnergy ? v * 4 : v)); }
  }
  return [...map.entries()].sort((x, y) => x[0] - y[0]).map(([t, w]) => ({ t, w }));
}
// Linear interpolation; 0 outside the data (no forecast = no solar assumed). Data gaps longer than 3 h count as 0 too.
function hzPowerAt(series, t) {
  if (!series.length || t < series[0].t || t > series[series.length - 1].t) return 0;
  let lo = 0, hi = series.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (series[mid].t <= t) lo = mid; else hi = mid; }
  const a = series[lo], b = series[hi];
  if (b.t === a.t || b.t - a.t > 3 * 3600e3) return t === a.t ? a.w : 0;
  return a.w + ((b.w - a.w) * (t - a.t)) / (b.t - a.t);
}

// Best start for a load of `loadW` watts running `hours` hours, within [now, now + horizon]. For each 15-minute sample of the run:
// solar available = max(0, forecast - baseline); covered share = min(load, available) / load. Candidates are ranked by solar coverage (in 5 % steps),
// then by grid cost, then by exact coverage, then by the earliest start. Returns null when the run does not fit in the horizon.
function hzBestSlot(series, { now, horizonH = 24, loadW, hours, baselineW = 0, windows = [], peakPrice = 0, offpeakPrice = 0 }) {
  if (!(loadW > 0) || !(hours > 0)) return null;
  const n = Math.max(1, Math.round((hours * 3600e3) / HZ_STEP));
  const first = Math.ceil(now / HZ_STEP) * HZ_STEP, end = now + horizonH * 3600e3;
  let best = null;
  const evalSlot = (s) => {
    let cov = 0, cost = 0, kwh = 0;
    for (let i = 0; i < n; i++) {
      const t = s + i * HZ_STEP, avail = Math.max(0, hzPowerAt(series, t + HZ_STEP / 2) - baselineW), c = Math.min(loadW, avail) / loadW;
      cov += c;
      const gridKwh = (loadW * (1 - c) * (HZ_STEP / 3600e3)) / 1000; kwh += gridKwh;
      cost += gridKwh * (hzIsOffpeak(t, windows) ? offpeakPrice : peakPrice);
    }
    return { start: s, end: s + n * HZ_STEP, coverage: cov / n, cost, gridKwh: kwh };
  };
  for (let s = first; s + n * HZ_STEP <= end; s += HZ_STEP) {
    const r = evalSlot(s), key = Math.round(r.coverage * 20);
    if (!best || key > best.key || (key === best.key && (r.cost < best.r.cost - 1e-9 || (Math.abs(r.cost - best.r.cost) <= 1e-9 && r.coverage > best.r.coverage + 1e-9)))) best = { key, r };
  }
  return best ? best.r : null;
}
