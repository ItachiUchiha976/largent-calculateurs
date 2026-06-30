/* =============================================
   L'Argent Expliqué — Shared JS
   Helpers, financial formulas, canvas charts
   No external dependencies.
   ============================================= */

"use strict";

/* ---- Formatting ---- */

/**
 * Format a number as euros (French locale)
 * e.g. 4321.94 → "4 321,94 €"
 */
function fmtEur(value, decimals = 2) {
  if (!isFinite(value)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a number as a percentage (French locale)
 * e.g. 0.054 → "5,40 %"
 */
function fmtPct(value, decimals = 2) {
  if (!isFinite(value)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a plain number (French locale, no currency)
 * e.g. 30.5 → "30,5"
 */
function fmtNum(value, decimals = 2) {
  if (!isFinite(value)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Safe parse float — returns NaN if blank
 */
function parseVal(str) {
  const s = String(str).replace(",", ".").trim();
  if (s === "") return NaN;
  return parseFloat(s);
}

/* ---- Financial formulas ---- */

/**
 * Future value with monthly compounding + optional monthly contributions
 * @param {number} C   - initial capital (€)
 * @param {number} r   - annual interest rate (decimal, e.g. 0.05 for 5%)
 * @param {number} n   - duration in years
 * @param {number} V   - monthly contribution (€), default 0
 * @returns {number} future value (€)
 */
function futureValueMonthly(C, r, n, V = 0) {
  if (n <= 0) return C;
  const months = n * 12;
  const i = Math.pow(1 + r, 1 / 12) - 1; // monthly rate
  let fv = C * Math.pow(1 + i, months);
  if (V !== 0) {
    fv += V * ((Math.pow(1 + i, months) - 1) / i);
  }
  return fv;
}

/**
 * Build year-by-year data for compound interest chart
 * Returns array of {year, totalInvested, fv}
 */
function buildCompoundData(C, r, n, V = 0) {
  const data = [];
  for (let y = 0; y <= n; y++) {
    const fv = futureValueMonthly(C, r, y, V);
    const totalInvested = C + V * 12 * y;
    data.push({ year: y, fv, totalInvested });
  }
  return data;
}

/**
 * Rule of 72 — approximate years to double
 * @param {number} r - annual rate (decimal)
 * @returns {number} years
 */
function rule72(r) {
  if (r <= 0) return Infinity;
  return 72 / (r * 100);
}

/**
 * Exact doubling time using logarithms
 * @param {number} r - annual rate (decimal)
 * @returns {number} years
 */
function exactDoubleTime(r) {
  if (r <= 0) return Infinity;
  return Math.log(2) / Math.log(1 + r);
}

/**
 * Future purchasing power (inflation adjusted)
 * @param {number} M - current amount (€)
 * @param {number} f - annual inflation rate (decimal)
 * @param {number} n - years
 * @returns {number} equivalent purchasing power in today's euros
 */
function realValue(M, f, n) {
  if (n <= 0) return M;
  return M / Math.pow(1 + f, n);
}

/**
 * Livret A nominal value after n years
 * @param {number} M - initial amount
 * @param {number} livretA - annual Livret A rate (decimal)
 * @param {number} n - years
 * @returns {number} nominal value
 */
function livretANominal(M, livretA, n) {
  // Livret A uses biannual compounding (1 Jan and 1 Jul) simplified as annual
  return M * Math.pow(1 + livretA, n);
}

/**
 * Real return rate ≈ (1 + livretA) / (1 + inflation) - 1
 */
function realReturnRate(livretA, inflation) {
  return (1 + livretA) / (1 + inflation) - 1;
}

/* ---- Canvas chart utilities ---- */

const COLORS = {
  accent:    "#1FE08A",
  accentDim: "#17b06e",
  invested:  "#9FB4AB",
  danger:    "#FF6B6B",
  warn:      "#FFD166",
  grid:      "rgba(26,74,51,0.7)",
  text:      "#9FB4AB",
  bg:        "#102D20",
};

/**
 * Get device pixel ratio aware canvas 2D context
 * Sets canvas logical size = CSS size * dpr for crisp rendering
 */
function getCtx(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || canvas.offsetWidth || 400;
  const h = parseInt(canvas.getAttribute("data-height") || 200);
  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  return { ctx, w, h };
}

/**
 * Draw horizontal grid lines + Y axis labels
 */
function drawGrid(ctx, w, h, pad, minVal, maxVal, steps, fmtFn) {
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 0.5;
  ctx.fillStyle = COLORS.text;
  ctx.font = "10px -apple-system, sans-serif";
  ctx.textAlign = "right";

  for (let s = 0; s <= steps; s++) {
    const ratio = s / steps;
    const y = pad.top + (h - pad.top - pad.bottom) * (1 - ratio);
    const val = minVal + (maxVal - minVal) * ratio;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
    ctx.fillText(fmtFn(val), pad.left - 4, y + 3);
  }
}

/**
 * Draw X axis labels (years)
 */
function drawXAxis(ctx, w, h, pad, labels, skipEvery) {
  ctx.fillStyle = COLORS.text;
  ctx.font = "10px -apple-system, sans-serif";
  ctx.textAlign = "center";
  const chartW = w - pad.left - pad.right;

  labels.forEach((label, i) => {
    if (i % skipEvery !== 0 && i !== labels.length - 1) return;
    const x = pad.left + (i / (labels.length - 1)) * chartW;
    ctx.fillText(label, x, h - pad.bottom + 14);
  });
}

/**
 * Draw a line on the chart
 * @param {Array} values - array of y-values (same length as xCount)
 * @param {number} xCount - number of points
 */
function drawLine(ctx, w, h, pad, values, color, lineWidth = 2, fill = false) {
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const n = values.length;
  if (n < 2) return;

  const maxV = Math.max(...values);
  const minV = 0;
  const range = maxV - minV || 1;

  const xOf = i => pad.left + (i / (n - 1)) * chartW;
  const yOf = v => pad.top + chartH * (1 - (v - minV) / range);

  ctx.beginPath();
  ctx.moveTo(xOf(0), yOf(values[0]));
  for (let i = 1; i < n; i++) ctx.lineTo(xOf(i), yOf(values[i]));

  if (fill) {
    ctx.lineTo(xOf(n - 1), h - pad.bottom);
    ctx.lineTo(xOf(0), h - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = color + "22";
    ctx.fill();
    // Redraw stroke on top
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(values[0]));
    for (let i = 1; i < n; i++) ctx.lineTo(xOf(i), yOf(values[i]));
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.stroke();
}

/**
 * Draw a line chart with two series (e.g. fv vs invested)
 * data: array of {year, fv, totalInvested}
 */
function drawCompoundChart(canvas, data) {
  if (!canvas || data.length < 2) return;
  const { ctx, w, h } = getCtx(canvas);
  ctx.clearRect(0, 0, w, h);

  const pad = { top: 16, right: 14, bottom: 28, left: 58 };

  const maxFV = Math.max(...data.map(d => d.fv));
  const maxInv = Math.max(...data.map(d => d.totalInvested));
  const maxVal = Math.max(maxFV, maxInv, 1);
  const minVal = 0;

  // Y-axis labels
  const steps = 4;
  const chartH = h - pad.top - pad.bottom;
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 0.5;
  ctx.fillStyle = COLORS.text;
  ctx.font = "10px -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let s = 0; s <= steps; s++) {
    const ratio = s / steps;
    const y = pad.top + chartH * (1 - ratio);
    const val = maxVal * ratio;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
    // Format: shorten large numbers
    let label;
    if (val >= 1e6) label = fmtNum(val / 1e6, 1) + " M€";
    else if (val >= 1e3) label = fmtNum(val / 1e3, 0) + " k€";
    else label = fmtNum(val, 0) + " €";
    ctx.fillText(label, pad.left - 4, y);
  }

  // X-axis labels
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const years = data.map(d => d.year);
  const skipEvery = data.length > 15 ? 5 : (data.length > 8 ? 2 : 1);
  years.forEach((y, i) => {
    if (i % skipEvery !== 0 && i !== years.length - 1) return;
    const x = pad.left + (i / (data.length - 1)) * (w - pad.left - pad.right);
    ctx.fillText("" + y, x, h - pad.bottom + 4);
  });

  // Normalize values
  const norm = v => pad.top + chartH * (1 - v / maxVal);
  const xOf  = i => pad.left + (i / (data.length - 1)) * (w - pad.left - pad.right);

  // Fill: invested
  ctx.beginPath();
  ctx.moveTo(xOf(0), norm(data[0].totalInvested));
  data.forEach((d, i) => ctx.lineTo(xOf(i), norm(d.totalInvested)));
  ctx.lineTo(xOf(data.length - 1), h - pad.bottom);
  ctx.lineTo(xOf(0), h - pad.bottom);
  ctx.closePath();
  ctx.fillStyle = COLORS.invested + "30";
  ctx.fill();

  // Fill: fv (on top)
  ctx.beginPath();
  ctx.moveTo(xOf(0), norm(data[0].fv));
  data.forEach((d, i) => ctx.lineTo(xOf(i), norm(d.fv)));
  ctx.lineTo(xOf(data.length - 1), h - pad.bottom);
  ctx.lineTo(xOf(0), h - pad.bottom);
  ctx.closePath();
  ctx.fillStyle = COLORS.accent + "18";
  ctx.fill();

  // Lines
  // Invested line
  ctx.beginPath();
  ctx.strokeStyle = COLORS.invested;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";
  ctx.moveTo(xOf(0), norm(data[0].totalInvested));
  data.forEach((d, i) => ctx.lineTo(xOf(i), norm(d.totalInvested)));
  ctx.stroke();

  // FV line
  ctx.beginPath();
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.moveTo(xOf(0), norm(data[0].fv));
  data.forEach((d, i) => ctx.lineTo(xOf(i), norm(d.fv)));
  ctx.stroke();
}

/**
 * Draw a bar chart for inflation (purchasing power by decade)
 * data: array of {label, value}
 */
function drawBarChart(canvas, data, colorFn) {
  if (!canvas || data.length < 1) return;
  const { ctx, w, h } = getCtx(canvas);
  ctx.clearRect(0, 0, w, h);

  const pad = { top: 16, right: 14, bottom: 36, left: 58 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barGap = 6;
  const barW = (chartW - barGap * (data.length - 1)) / data.length;

  // Grid lines
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 0.5;
  ctx.fillStyle = COLORS.text;
  ctx.font = "10px -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const steps = 4;

  for (let s = 0; s <= steps; s++) {
    const ratio = s / steps;
    const y = pad.top + chartH * (1 - ratio);
    const val = maxVal * ratio;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
    let label;
    if (val >= 1e3) label = fmtNum(val / 1e3, 1) + " k€";
    else label = fmtNum(val, 0) + " €";
    ctx.fillText(label, pad.left - 4, y);
  }

  // Bars
  data.forEach((d, i) => {
    const x = pad.left + i * (barW + barGap);
    const barH = (d.value / maxVal) * chartH;
    const y = pad.top + chartH - barH;
    const color = colorFn ? colorFn(i, data.length) : COLORS.accent;
    ctx.fillStyle = color;
    const r = Math.min(4, barW / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + barW - r, y);
    ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
    ctx.lineTo(x + barW, y + barH);
    ctx.lineTo(x, y + barH);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();

    // X label
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "9px -apple-system, sans-serif";
    ctx.fillText(d.label, x + barW / 2, pad.top + chartH + 5);
  });
}

/* ---- Utility: validate inputs ---- */

/**
 * Check that a value is a valid positive number (or zero-ok)
 * Returns {ok: bool, error: string}
 */
function validate(val, label, { min = 0, max = Infinity, allowZero = true } = {}) {
  if (isNaN(val)) return { ok: false, error: `Veuillez saisir un ${label} valide.` };
  if (!allowZero && val === 0) return { ok: false, error: `Le ${label} doit être supérieur à 0.` };
  if (val < min) return { ok: false, error: `Le ${label} doit être ≥ ${min}.` };
  if (val > max) return { ok: false, error: `Le ${label} doit être ≤ ${max}.` };
  return { ok: true };
}

/**
 * Show/hide error message next to an input
 */
function showError(inputEl, msg) {
  const errEl = inputEl.parentElement.querySelector(".input-error") ||
                inputEl.closest(".form-group").querySelector(".input-error");
  if (!errEl) return;
  if (msg) {
    errEl.textContent = msg;
    errEl.classList.add("show");
    inputEl.style.borderColor = "var(--danger)";
  } else {
    errEl.classList.remove("show");
    inputEl.style.borderColor = "";
  }
}

/**
 * Clear all errors in a form
 */
function clearErrors(form) {
  form.querySelectorAll(".input-error").forEach(el => {
    el.classList.remove("show");
    el.textContent = "";
  });
  form.querySelectorAll("input").forEach(el => {
    el.style.borderColor = "";
  });
}

/* ---- Resize chart on window resize ---- */

const _chartQueue = [];

function registerChart(canvas, drawFn) {
  _chartQueue.push({ canvas, drawFn });
}

let _resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    _chartQueue.forEach(({ canvas, drawFn }) => drawFn(canvas));
  }, 120);
});

/* ---- Email capture (Web3Forms, AJAX) ---- */
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("form.lae-email-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var wrap = form.parentElement;
      var btn = form.querySelector('button[type="submit"]');
      var successEl = wrap.querySelector(".lae-email-success");
      var errorEl = wrap.querySelector(".lae-email-error");
      if (errorEl) errorEl.style.display = "none";
      var origLabel = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Envoi…"; }

      fetch(form.action, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(form)
      })
        .then(function (r) { return r.json(); })
        .then(function (json) {
          if (json && json.success) {
            form.style.display = "none";
            if (successEl) {
              successEl.style.display = "block";
              // 2e ligne sous le guide gratuit : pousser vers l'offre payante (pic d'intention)
              if (!successEl.querySelector(".lae-pack-link")) {
                var packLink = document.createElement("a");
                packLink.className = "lae-pack-link";
                packLink.href = "https://boutiquefred.gumroad.com/l/pack-maitre-budget";
                packLink.target = "_blank";
                packLink.rel = "noopener";
                packLink.textContent = "Prêt à passer à l'action ? → Pack Maître du Budget (12€)";
                successEl.appendChild(document.createElement("br"));
                successEl.appendChild(packLink);
              }
            }
          } else {
            throw new Error((json && json.message) || "error");
          }
        })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = origLabel; }
          if (errorEl) errorEl.style.display = "block";
        });
    });
  });
});
