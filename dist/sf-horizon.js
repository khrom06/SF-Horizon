(() => {
"use strict";
// SF-kit 1.0 — shared design tokens and card base class. The same file ships in every SF-* card repository (keep them identical).
// Visual language: the palette and HUD frame of SF-Cards (https://github.com/khrom06/SF-Cards), so cards from different repos sit side by side.
const SF_VARS_DARK = `--sf-cyan:#00e5ff; --sf-amber:#ffb300; --sf-red:#ff3355; --sf-green:#2bff88; --sf-grey:#5b6b7d; --sf-text:#cfefff; --sf-dim:#7fa3bd;
    --sf-cyan-rgb:0 229 255; --sf-amber-rgb:255 179 0; --sf-red-rgb:255 51 85; --sf-green-rgb:43 255 136; --sf-fg-rgb:255 255 255; --sf-strong:#fff;
    --sf-bg0:#0d2440; --sf-bg1:#06101d; --sf-bg2:#03080f; --sf-on-accent:#03080f; --sf-violet:#b388ff; --sf-violet-rgb:179 136 255;`;
const SF_VARS_LIGHT = `--sf-cyan:#00798f; --sf-amber:#a85f00; --sf-red:#c8173d; --sf-green:#08783f; --sf-grey:#52687a; --sf-text:#1c3a4e; --sf-dim:#37536a;
    --sf-cyan-rgb:0 121 143; --sf-amber-rgb:168 95 0; --sf-red-rgb:200 23 61; --sf-green-rgb:8 120 63; --sf-fg-rgb:4 40 62; --sf-strong:#04141f;
    --sf-bg0:#fbfdff; --sf-bg1:#eef5fb; --sf-bg2:#e2edf6; --sf-on-accent:#fff; --sf-violet:#6a3bc4; --sf-violet-rgb:106 59 196;`;

const SF_BASE_CSS = `
  :host { display:block; ${SF_VARS_DARK} }
  :host([theme="light"]) { ${SF_VARS_LIGHT} }
  * { box-sizing:border-box; }
  .hud { position:relative; overflow:hidden; border-radius:14px; padding:16px 18px 18px; color:var(--sf-text);
    background: radial-gradient(ellipse at 50% -20%, var(--sf-bg0) 0%, var(--sf-bg1) 60%, var(--sf-bg2) 100%);
    border:1px solid rgb(var(--sf-cyan-rgb) / .22); font-family:'B612 Mono', ui-monospace, monospace; font-size:13px;
    box-shadow: inset 0 0 40px rgb(var(--sf-cyan-rgb) / .06), 0 0 22px rgb(var(--sf-cyan-rgb) / .07); }
  .hud::after { content:""; position:absolute; inset:0; pointer-events:none;
    background: repeating-linear-gradient(0deg, rgb(var(--sf-fg-rgb) / .022) 0 1px, transparent 1px 3px); }
  .c { position:absolute; width:14px; height:14px; border-color:var(--sf-cyan); border-style:solid; opacity:.8; }
  .c.tl { top:6px; left:6px; border-width:2px 0 0 2px; } .c.tr { top:6px; right:6px; border-width:2px 2px 0 0; }
  .c.bl { bottom:6px; left:6px; border-width:0 0 2px 2px; } .c.br { bottom:6px; right:6px; border-width:0 2px 2px 0; }
  .head { display:flex; align-items:center; gap:10px; margin-bottom:14px; font-family:Orbitron, ui-sans-serif, sans-serif; font-weight:700;
    font-size:12px; letter-spacing:.22em; text-transform:uppercase; color:var(--sf-cyan); }
  .head .grow { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .head .tag { font-size:10px; letter-spacing:.12em; padding:2px 8px; border-radius:20px; border:1px solid currentColor; }
  .tag.ok { color:var(--sf-green); } .tag.warn { color:var(--sf-amber); } .tag.bad { color:var(--sf-red); }
  .empty { padding:18px 6px; text-align:center; color:var(--sf-dim); letter-spacing:.08em; }
  .err { color:var(--sf-red); padding:10px; border:1px dashed var(--sf-red); border-radius:8px; }
  [data-act] { cursor:pointer; }
  [data-act]:focus-visible, button:focus-visible, input:focus-visible { outline:2px solid var(--sf-cyan); outline-offset:2px; border-radius:6px; }
  button { font:inherit; color:inherit; background:rgb(var(--sf-cyan-rgb) / .1); border:1px solid rgb(var(--sf-cyan-rgb) / .35);
    border-radius:8px; padding:6px 12px; cursor:pointer; }
  button:hover { background:rgb(var(--sf-cyan-rgb) / .2); }
  @media (pointer: coarse) { button, .row { min-height:40px; } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; } }
`;

const sfEsc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const sfNum = (v, d = NaN) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
const sfLang = (hass) => String((hass && (hass.locale?.language || hass.language)) || "en").slice(0, 2).toLowerCase();
// Translation lookup with English fallback: sfT(dict, lang, key, {n: 3}) replaces {n}.
const sfT = (dict, lang, key, vars) => {
  let s = (dict[lang] && dict[lang][key]) ?? (dict.en && dict.en[key]) ?? key;
  if (vars) for (const k of Object.keys(vars)) s = s.split("{" + k + "}").join(String(vars[k]));
  return s;
};
// Human duration from seconds: "45 s", "12 min", "3 h 05", "2 d 4 h".
const sfAge = (sec) => {
  if (!Number.isFinite(sec) || sec < 0) return "–";
  if (sec < 90) return Math.round(sec) + " s";
  const m = Math.floor(sec / 60); if (m < 90) return m + " min";
  const h = Math.floor(m / 60); if (h < 48) return h + " h " + String(m % 60).padStart(2, "0");
  return Math.floor(h / 24) + " d " + (h % 24) + " h";
};
const sfName = (st, id) => (st && st.attributes && st.attributes.friendly_name) || id;
const sfMoreInfo = (el, entityId) => el.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));

// Base class. Subclasses provide: normalize(config) -> config, signature() -> string (cheap; the card re-renders only when it changes),
// body() -> html string, title(), tag() (optional {cls,text}), css (optional), onAct(el, ev) for [data-act] clicks, tick (ms, optional timer).
// Re-rendering never loops: it happens on (a) a new signature, (b) setConfig, (c) the optional timer, nothing else.
class SFCard extends HTMLElement {
  constructor() {
    super(); this.attachShadow({ mode: "open" }); this._cfg = null; this._hass = null; this._sig = null; this._timer = null;
    this.shadowRoot.addEventListener("click", (ev) => { const el = ev.target.closest && ev.target.closest("[data-act]"); if (el && this.onAct) this.onAct(el, ev); });
    this.shadowRoot.addEventListener("keydown", (ev) => { if ((ev.key === "Enter" || ev.key === " ") && ev.target.matches && ev.target.matches("[data-act][role=button]")) { ev.preventDefault(); ev.target.click(); } });
  }
  setConfig(c) { if (!c || typeof c !== "object") throw new Error("Invalid configuration"); this._cfg = this.normalize(c); this._sig = null; this._draw(); }
  set hass(h) { this._hass = h; if (!this._cfg) return; const s = this.signature(); if (s !== this._sig) { this._sig = s; this._draw(); } }
  get hass() { return this._hass; }
  connectedCallback() { if (this.tick && !this._timer) this._timer = setInterval(() => this._draw(), this.tick); }
  disconnectedCallback() { if (this._timer) { clearInterval(this._timer); this._timer = null; } }
  getCardSize() { return 3; }
  _theme() { const t = this._cfg && this._cfg.theme; if (t === "light" || t === "dark") return t; return this._hass && this._hass.themes && this._hass.themes.darkMode === false ? "light" : "dark"; }
  _draw() {
    if (!this._cfg) return;
    const root = this.shadowRoot, ae = root.activeElement;
    const keep = ae && ae.id ? { id: ae.id, value: ae.value, s: ae.selectionStart, e: ae.selectionEnd } : null;
    this.setAttribute("theme", this._theme());
    let inner;
    try {
      const tag = this.tag ? this.tag() : null;
      inner = `<div class="hud"><i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i>
        <div class="head"><span class="grow">${sfEsc(this.title())}</span>${tag ? `<span class="tag ${tag.cls}">${sfEsc(tag.text)}</span>` : ""}</div>${this.body()}</div>`;
    } catch (e) { inner = `<div class="hud"><div class="err">${sfEsc(this.constructor.name)}: ${sfEsc(e && e.message)}</div></div>`; }
    root.innerHTML = `<style>${SF_BASE_CSS}${this.css || ""}</style>${inner}`;
    if (keep) { const n = root.getElementById(keep.id); if (n) { if (n.value !== undefined && n.tagName === "INPUT" && n.type !== "range") n.value = keep.value; n.focus(); try { n.setSelectionRange(keep.s, keep.e); } catch (e) { /* not a text input */ } } }
  }
}
const sfRegister = (tag, cls, name, description) => {
  if (!customElements.get(tag)) customElements.define(tag, cls);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === tag)) window.customCards.push({ type: tag, name, description, preview: false });
};
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
const HZ_I18N = {
  en: { title: "Energy horizon", best: "Best start", solar: "solar", grid: "from the grid", nodata: "No forecast data — showing the cheapest window only", surplus: "Surplus now",
        nofit: "The run does not fit in the next {h} h", forecast: "Solar forecast", offpeak: "Off-peak", load: "Load", now: "now", cheap: "Cheapest start" },
  fr: { title: "Horizon énergie", best: "Meilleur départ", solar: "solaire", grid: "depuis le réseau", nodata: "Pas de prévision — seule la plage la moins chère est proposée", surplus: "Surplus actuel",
        nofit: "Le cycle ne tient pas dans les {h} prochaines heures", forecast: "Prévision solaire", offpeak: "Heures creuses", load: "Charge", now: "maint.", cheap: "Départ le moins cher" },
  de: { title: "Energie-Horizont", best: "Bester Start", solar: "Solar", grid: "aus dem Netz", nodata: "Keine Prognose — nur das günstigste Fenster", surplus: "Aktueller Überschuss",
        nofit: "Der Lauf passt nicht in die nächsten {h} h", forecast: "Solarprognose", offpeak: "Niedertarif", load: "Last", now: "jetzt", cheap: "Günstigster Start" },
  es: { title: "Horizonte energético", best: "Mejor inicio", solar: "solar", grid: "de la red", nodata: "Sin previsión — solo la franja más barata", surplus: "Excedente ahora",
        nofit: "El ciclo no cabe en las próximas {h} h", forecast: "Previsión solar", offpeak: "Valle", load: "Carga", now: "ahora", cheap: "Inicio más barato" },
};
const hzHm = (t) => { const d = new Date(t); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };

class SFHorizonCard extends SFCard {
  static getStubConfig() { return { forecast: "sensor.energy_production_today", forecast_tomorrow: "sensor.energy_production_tomorrow", offpeak: ["00:00-06:00"], load_w: 2000, load_hours: 2 }; }
  normalize(c) {
    const loads = (Array.isArray(c.loads) && c.loads.length ? c.loads : [{ name: c.load_name || "", power: c.load_w, hours: c.load_hours }])
      .map((l) => ({ name: String(l.name || ""), power: sfNum(l.power, 2000), hours: sfNum(l.hours, 2) })).filter((l) => l.power > 0 && l.hours > 0 && l.hours <= 12);
    if (!loads.length) throw new Error("loads: power and hours must be positive numbers (hours <= 12)");
    this._sel = 0;
    return { ...c, loads, windows: hzParseWindows(c.offpeak), peak: sfNum(c.peak_price, 0), off: sfNum(c.offpeak_price, 0), currency: c.currency || "€", baseline: sfNum(c.baseline_w, 500),
      horizon: Math.min(48, Math.max(6, sfNum(c.hours, 24))), ids: [].concat(c.forecast || [], c.forecast_tomorrow || [], c.forecast_after || []).filter((x) => typeof x === "string") };
  }
  get tick() { return 60000; }
  _baseline() { const c = this._cfg, s = c.consumption && this._hass && this._hass.states[c.consumption]; const v = s ? sfNum(s.state) : NaN; return Number.isFinite(v) ? v : c.baseline; }
  signature() {
    const st = this._hass ? this._hass.states : {}, c = this._cfg;
    return c.ids.map((id) => id + (st[id] ? st[id].last_updated : "-")).join("|") + "#" + (c.surplus && st[c.surplus] ? st[c.surplus].state : "") + "#" + (c.consumption && st[c.consumption] ? Math.round(sfNum(st[c.consumption].state, 0) / 100) : "") + "#" + this._sel + this._theme();
  }
  title() { return this._cfg.title || sfT(HZ_I18N, sfLang(this._hass), "title"); }
  get css() { return `
    .pick { display:flex; flex-wrap:wrap; gap:6px; margin:-4px 0 10px; } .pick button { font-size:11px; padding:3px 10px; border-radius:20px; } .pick button.on { background:rgb(var(--sf-cyan-rgb) / .28); border-color:var(--sf-cyan); color:var(--sf-strong); }
    svg.ch { display:block; width:100%; height:auto; overflow:visible; } .ax { fill:var(--sf-dim); font-size:9px; } .gl { stroke:rgb(var(--sf-cyan-rgb) / .14); stroke-width:1; }
    .big { margin-top:12px; display:flex; flex-wrap:wrap; gap:6px 18px; align-items:baseline; } .big .v { font-family:Orbitron, ui-sans-serif, sans-serif; font-size:22px; color:var(--sf-green); letter-spacing:.05em; }
    .big .s { color:var(--sf-dim); } .big b { color:var(--sf-strong); font-weight:400; } .leg { display:flex; gap:14px; margin-top:8px; font-size:10.5px; color:var(--sf-dim); flex-wrap:wrap; }
    .sw { display:inline-block; width:10px; height:10px; border-radius:2px; margin-right:5px; vertical-align:-1px; }`; }
  body() {
    const c = this._cfg, L = sfLang(this._hass), t = (k, v) => sfT(HZ_I18N, L, k, v), st = this._hass ? this._hass.states : {};
    const now = Date.now(), series = hzSeries(st, c.ids), load = c.loads[Math.min(this._sel, c.loads.length - 1)], base = this._baseline();
    const best = hzBestSlot(series, { now, horizonH: c.horizon, loadW: load.power, hours: load.hours, baselineW: base, windows: c.windows, peakPrice: c.peak, offpeakPrice: c.off });
    const W = 560, H = 190, pl = 34, pr = 8, pt = 8, pb = 34, iw = W - pl - pr, ih = H - pt - pb, t0 = now, t1 = now + c.horizon * 3600e3;
    const x = (tm) => pl + ((tm - t0) / (t1 - t0)) * iw;
    const peak = Math.max(1000, load.power + base, ...series.filter((p) => p.t >= t0 && p.t <= t1).map((p) => p.w)) * 1.1, y = (w) => pt + ih - (Math.min(w, peak) / peak) * ih;
    let svg = `<svg class="ch" viewBox="0 0 ${W} ${H}" role="img" aria-label="${sfEsc(t("forecast"))}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sf-cyan)" stop-opacity=".55"/><stop offset="1" stop-color="var(--sf-cyan)" stop-opacity=".03"/></linearGradient></defs>`;
    for (let i = 0; i <= 3; i++) { const w = (peak / 1.1) * (i / 3); svg += `<line class="gl" x1="${pl}" x2="${W - pr}" y1="${y(w)}" y2="${y(w)}"/><text class="ax" x="${pl - 4}" y="${y(w) + 3}" text-anchor="end">${w >= 1000 ? (w / 1000).toFixed(1) + "k" : Math.round(w)}</text>`; }
    // tariff strip: one cell per 15 minutes
    for (let tm = Math.floor(t0 / HZ_STEP) * HZ_STEP; tm < t1; tm += HZ_STEP) { if (c.windows.length && hzIsOffpeak(tm, c.windows)) svg += `<rect x="${Math.max(pl, x(tm))}" y="${pt + ih + 4}" width="${x(tm + HZ_STEP) - Math.max(pl, x(tm)) + .3}" height="6" fill="var(--sf-green)" opacity=".75"/>`; }
    if (series.length) {
      const pts = []; for (let tm = t0; tm <= t1; tm += HZ_STEP) pts.push([x(tm), y(hzPowerAt(series, tm))]);
      svg += `<path d="M${pts[0][0]} ${pt + ih} ${pts.map((p) => "L" + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ")} L${pts[pts.length - 1][0]} ${pt + ih} Z" fill="url(#g)"/><path d="M${pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L")}" fill="none" stroke="var(--sf-cyan)" stroke-width="1.6"/>`;
    }
    svg += `<line x1="${pl}" x2="${W - pr}" y1="${y(base)}" y2="${y(base)}" stroke="var(--sf-amber)" stroke-width="1" stroke-dasharray="4 3"/>`;
    if (best) svg += `<rect x="${x(best.start)}" y="${pt}" width="${Math.max(2, x(best.end) - x(best.start))}" height="${ih}" fill="var(--sf-green)" opacity=".16" stroke="var(--sf-green)" stroke-width="1.4" rx="3"/>`;
    for (let k = Math.ceil(t0 / 3600e3 / 3) * 3; k * 3600e3 <= t1; k += 3) { const tm = k * 3600e3; svg += `<text class="ax" x="${x(tm)}" y="${H - 8}" text-anchor="middle">${hzHm(tm).slice(0, 2)}h</text>`; }
    svg += `<line x1="${pl}" x2="${pl}" y1="${pt}" y2="${pt + ih}" stroke="var(--sf-text)" stroke-width="1.4"/><text class="ax" x="${pl + 4}" y="${pt + 9}" fill="var(--sf-text)">${sfEsc(t("now"))}</text></svg>`;
    let h = "";
    if (c.loads.length > 1) h += `<div class="pick">${c.loads.map((l, i) => `<button data-act="load" data-i="${i}" class="${i === this._sel ? "on" : ""}" aria-pressed="${i === this._sel}">${sfEsc(l.name || l.power + " W")}</button>`).join("")}</div>`;
    h += svg;
    if (!series.length && !c.windows.length) h += `<div class="empty">${sfEsc(t("nodata"))}</div>`;
    else if (!best) h += `<div class="empty">${sfEsc(t("nofit", { h: c.horizon }))}</div>`;
    else {
      const money = c.peak > 0 || c.off > 0 ? ` · <b>${best.cost.toFixed(2)} ${sfEsc(c.currency)}</b>` : "";
      h += `<div class="big"><span class="s">${sfEsc(t(series.length ? "best" : "cheap"))}</span><span class="v">${hzHm(best.start)} → ${hzHm(best.end)}</span>`
        + `<span class="s">${series.length ? `<b>${Math.round(best.coverage * 100)} %</b> ${sfEsc(t("solar"))} · ` : ""}<b>${best.gridKwh.toFixed(2)} kWh</b> ${sfEsc(t("grid"))}${money}</span></div>`;
    }
    const sur = c.surplus && st[c.surplus] ? sfNum(st[c.surplus].state) : NaN;
    h += `<div class="leg"><span><i class="sw" style="background:var(--sf-cyan)"></i>${sfEsc(t("forecast"))}</span>${c.windows.length ? `<span><i class="sw" style="background:var(--sf-green)"></i>${sfEsc(t("offpeak"))}</span>` : ""}<span><i class="sw" style="background:var(--sf-amber)"></i>${Math.round(base)} W</span>`
      + `<span>${sfEsc(t("load"))}: ${load.power} W × ${load.hours} h</span>${Number.isFinite(sur) ? `<span>${sfEsc(t("surplus"))}: <b>${Math.round(sur)} W</b></span>` : ""}</div>`;
    return h;
  }
  onAct(el) { if (el.dataset.act === "load") { this._sel = +el.dataset.i || 0; this._sig = null; this._draw(); } }
}
sfRegister("sf-horizon-card", SFHorizonCard, "SF Horizon", "24-hour solar forecast with tariff windows and the best time to start a heavy appliance.");
window.__sfHorizon = { windows: hzParseWindows, offpeak: hzIsOffpeak, series: hzSeries, powerAt: hzPowerAt, best: hzBestSlot };   // exposed for the test page only

})();
