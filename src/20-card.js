const HZ_I18N = {
  en: { title: "Energy horizon", best: "Best start", solar: "solar", grid: "from the grid", nodata: "No forecast data — showing the cheapest window only", surplus: "Surplus now",
        nofit: "The run does not fit in the next {h} h", forecast: "Solar forecast", offpeak: "Off-peak", load: "Load", now: "now", cheap: "Cheapest start" },
  fr: { title: "Horizon énergie", best: "Meilleur départ", solar: "solaire", grid: "depuis le réseau", nodata: "Pas de prévision — seule la plage la moins chère est proposée", surplus: "Surplus actuel",
        nofit: "Le cycle ne tient pas dans les {h} prochaines heures", forecast: "Prévision solaire", offpeak: "Heures creuses", load: "Charge", now: "maint.", cheap: "Départ le moins cher" },
  de: { title: "Energie-Horizont", best: "Bester Start", solar: "Solar", grid: "aus dem Netz", nodata: "Keine Prognose — nur das günstigste Fenster", surplus: "Aktueller Überschuss",
        nofit: "Der Lauf passt nicht in die nächsten {h} h", forecast: "Solarprognose", offpeak: "Niedertarif", load: "Last", now: "jetzt", cheap: "Günstigster Start" },
  es: { title: "Horizonte energético", best: "Mejor inicio", solar: "solar", grid: "de la red", nodata: "Sin previsión — solo la franja más barata", surplus: "Excedente ahora",
        nofit: "El ciclo no cabe en las próximas {h} h", forecast: "Previsión solar", offpeak: "Valle", load: "Carga", now: "ahora", cheap: "Inicio más barato" },
  nl: {"title": "Energiehorizon", "best": "Beste starttijd", "solar": "zon", "grid": "van het net", "nodata": "Geen voorspelling — alleen het goedkoopste tijdvenster", "surplus": "Overschot nu", "nofit": "De cyclus past niet in de komende {h} u", "forecast": "Zonnevoorspelling", "offpeak": "Daluren", "load": "Belasting", "now": "nu", "cheap": "Goedkoopste start"},
  it: {"title": "Orizzonte energetico", "best": "Miglior avvio", "solar": "solare", "grid": "dalla rete", "nodata": "Nessuna previsione — solo la fascia più economica", "surplus": "Surplus ora", "nofit": "Il ciclo non rientra nelle prossime {h} h", "forecast": "Previsione solare", "offpeak": "Fascia bassa", "load": "Carico", "now": "ora", "cheap": "Avvio più economico"},
  pt: {"title": "Horizonte energético", "best": "Melhor início", "solar": "solar", "grid": "da rede", "nodata": "Sem previsão — apenas a janela mais barata", "surplus": "Excedente agora", "nofit": "O ciclo não cabe nas próximas {h} h", "forecast": "Previsão solar", "offpeak": "Vazio", "load": "Carga", "now": "agora", "cheap": "Início mais barato"},
  pl: {"title": "Horyzont energii", "best": "Najlepszy start", "solar": "słońce", "grid": "z sieci", "nodata": "Brak prognozy — tylko najtańsze okno", "surplus": "Nadwyżka teraz", "nofit": "Cykl nie mieści się w najbliższych {h} h", "forecast": "Prognoza słoneczna", "offpeak": "Taryfa nocna", "load": "Obciążenie", "now": "teraz", "cheap": "Najtańszy start"},
  ru: {"title": "Энергогоризонт", "best": "Лучшее время старта", "solar": "солнце", "grid": "из сети", "nodata": "Нет прогноза — только самое дешёвое окно", "surplus": "Избыток сейчас", "nofit": "Цикл не помещается в ближайшие {h} ч", "forecast": "Прогноз солнца", "offpeak": "Ночной тариф", "load": "Нагрузка", "now": "сейчас", "cheap": "Самый дешёвый старт"},
  zh: {"title": "能源展望", "best": "最佳启动时间", "solar": "太阳能", "grid": "来自电网", "nodata": "无预测数据——仅显示最便宜的时段", "surplus": "当前盈余", "nofit": "该周期无法在未来 {h} 小时内完成", "forecast": "太阳能预测", "offpeak": "低谷电价", "load": "负载", "now": "现在", "cheap": "最便宜的启动时间"},
  ar: {"title": "أفق الطاقة", "best": "أفضل وقت للبدء", "solar": "شمسي", "grid": "من الشبكة", "nodata": "لا توجد توقعات — يُعرض أرخص نطاق فقط", "surplus": "الفائض الآن", "nofit": "لا تتسع الدورة في الساعات {h} القادمة", "forecast": "التوقعات الشمسية", "offpeak": "الساعات المنخفضة التعرفة", "load": "الحِمل", "now": "الآن", "cheap": "أرخص وقت للبدء"},
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
  title() { return this._cfg.title || sfT(HZ_I18N, this._lang(), "title"); }
  get css() { return `
    .pick { display:flex; flex-wrap:wrap; gap:6px; margin:-4px 0 10px; } .pick button { font-size:11px; padding:3px 10px; border-radius:20px; } .pick button.on { background:rgb(var(--sf-cyan-rgb) / .28); border-color:var(--sf-cyan); color:var(--sf-strong); }
    svg.ch { display:block; width:100%; height:auto; overflow:visible; } .ax { fill:var(--sf-dim); font-size:9px; } .gl { stroke:rgb(var(--sf-cyan-rgb) / .14); stroke-width:1; }
    .big { margin-top:12px; display:flex; flex-wrap:wrap; gap:6px 18px; align-items:baseline; } .big .v { direction:ltr; unicode-bidi:isolate; font-family:Orbitron, ui-sans-serif, sans-serif; font-size:22px; color:var(--sf-green); letter-spacing:.05em; }
    .big .s { color:var(--sf-dim); } .big b { color:var(--sf-strong); font-weight:400; } .leg { display:flex; gap:14px; margin-top:8px; font-size:10.5px; color:var(--sf-dim); flex-wrap:wrap; }
    .sw { display:inline-block; width:10px; height:10px; border-radius:2px; margin-right:5px; vertical-align:-1px; }`; }
  body() {
    const c = this._cfg, L = this._lang(), t = (k, v) => sfT(HZ_I18N, L, k, v), st = this._hass ? this._hass.states : {};
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
    h += `<div class="leg"><span><i class="sw" style="background:var(--sf-cyan)"></i>${sfEsc(t("forecast"))}</span>${c.windows.length ? `<span><i class="sw" style="background:var(--sf-green)"></i>${sfEsc(t("offpeak"))}</span>` : ""}<span><i class="sw" style="background:var(--sf-amber)"></i><bdi dir="ltr">${Math.round(base)} W</bdi></span>`
      + `<span>${sfEsc(t("load"))}: <bdi dir="ltr">${load.power} W × ${load.hours} h</bdi></span>${Number.isFinite(sur) ? `<span>${sfEsc(t("surplus"))}: <b>${Math.round(sur)} W</b></span>` : ""}</div>`;
    return h;
  }
  onAct(el) { if (el.dataset.act === "load") { this._sel = +el.dataset.i || 0; this._sig = null; this._draw(); } }
}
sfRegister("sf-horizon-card", SFHorizonCard, "SF Horizon", "24-hour solar forecast with tariff windows and the best time to start a heavy appliance.");
window.__sfHorizon = { i18n: HZ_I18N, windows: hzParseWindows, offpeak: hzIsOffpeak, series: hzSeries, powerAt: hzPowerAt, best: hzBestSlot };   // exposed for the test page only
