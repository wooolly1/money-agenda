/* أجندة فلوسي — تتبّع الميزانية الشهرية
   كل البيانات تُحفظ محليًا في المتصفح (localStorage). */

const STORE_KEY = "money-agenda-v1";

const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const CAT_COLORS = {
  "🍔 أكل": "#ff5470",
  "🚗 مواصلات": "#5b8def",
  "🛒 تسوق": "#ffa630",
  "🏠 فواتير": "#2bbf8a",
  "☕ كافيهات": "#b06bdc",
  "💊 صحة": "#3fc4d8",
  "🎮 ترفيه": "#ff4d94",
  "💄 جمال": "#ff6fa8",
  "🎁 هدايا": "#f06292",
  "📦 أخرى": "#b06b8a"
};

/* ---------- الحالة ---------- */
let state = load();

function defaultState() {
  const now = new Date();
  return {
    monthKey: monthKeyOf(now),
    budget: 0,
    income: 0,
    savingsGoal: 0,
    currency: "ر.س",
    expenses: [] // {id, amount, category, date, note}
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const s = JSON.parse(raw);
    return Object.assign(defaultState(), s);
  } catch {
    return defaultState();
  }
}

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

/* ---------- أدوات مساعدة ---------- */
function monthKeyOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonthKey(key) {
  const [y, m] = key.split("-").map(Number);
  return { year: y, month: m - 1 };
}

function fmt(n) {
  const v = Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " " + state.currency;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function weeksOfMonth(monthKey) {
  const { year, month } = parseMonthKey(monthKey);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = [];
  let start = 1, idx = 1;
  while (start <= daysInMonth) {
    const end = Math.min(start + 6, daysInMonth);
    weeks.push({ index: idx, startDay: start, endDay: end });
    start = end + 1; idx++;
  }
  return weeks;
}

function dayOfDate(iso) { return Number(iso.split("-")[2]); }

function monthExpenses() {
  return state.expenses.filter(e => e.date.startsWith(state.monthKey));
}

/* ---------- العناصر ---------- */
const el = id => document.getElementById(id);

/* ---------- العرض ---------- */
function render() {
  const { year, month } = parseMonthKey(state.monthKey);
  el("monthLabel").textContent = `${AR_MONTHS[month]} ${year}`;

  el("currency").value = state.currency;
  el("monthlyBudget").value = state.budget || "";
  el("income").value = state.income || "";
  el("savingsGoal").value = state.savingsGoal || "";
  if (!el("expDate").value) el("expDate").value = todayISO();

  const exps = monthExpenses();
  const spent = exps.reduce((s, e) => s + Number(e.amount), 0);
  const remaining = state.budget - spent;
  const pct = state.budget > 0 ? (spent / state.budget) * 100 : 0;

  // البطاقات السريعة
  el("statIncome").textContent = fmt(state.income);
  el("statSpent").textContent = fmt(spent);
  el("statSaved").textContent = fmt(Math.max(state.income - spent, 0));

  // الباقي
  const remEl = el("remaining");
  remEl.textContent = fmt(remaining);
  remEl.classList.toggle("negative", remaining < 0);

  el("spentTotal").textContent = fmt(spent);
  el("spentPct").textContent = Math.round(pct) + "%";

  const bar = el("monthProgress");
  bar.style.width = Math.min(pct, 100) + "%";
  bar.classList.remove("warn", "over");
  if (pct >= 100) bar.classList.add("over");
  else if (pct >= 80) bar.classList.add("warn");

  renderGoal(spent);
  renderWeeks(exps);
  renderBreakdown(exps, spent);
  renderTxList(exps);
}

function renderGoal(spent) {
  const saved = Math.max(state.income - spent, 0);
  const goal = state.savingsGoal;
  const fill = el("goalFill");
  const msg = el("goalMsg");
  if (!goal || goal <= 0) {
    fill.style.width = "0%";
    msg.className = "goal-msg";
    msg.textContent = "حدّد هدف ادخار لهذا الشهر 💕";
    return;
  }
  const pct = Math.min((saved / goal) * 100, 100);
  fill.style.width = pct + "%";
  if (saved >= goal) {
    msg.className = "goal-msg done";
    msg.textContent = `🎉 مبروك! وصلتي لهدفك (${fmt(goal)}) وادّخرتي ${fmt(saved)}`;
  } else {
    msg.className = "goal-msg";
    msg.textContent = `ادّخرتي ${fmt(saved)} من ${fmt(goal)} · باقي ${fmt(goal - saved)} (${Math.round(pct)}%)`;
  }
}

function renderWeeks(exps) {
  const weeks = weeksOfMonth(state.monthKey);
  const weeklyCap = state.budget > 0 ? state.budget / weeks.length : 0;
  el("weeklyCap").textContent = state.budget > 0
    ? `الحد لكل أسبوع: ${fmt(weeklyCap)}`
    : "حدّد ميزانيتك أولًا";

  const { month } = parseMonthKey(state.monthKey);
  const isCurrentMonth = state.monthKey === monthKeyOf(new Date());
  const todayDay = new Date().getDate();

  const grid = el("weeksGrid");
  grid.innerHTML = "";

  weeks.forEach(w => {
    const wSpent = exps
      .filter(e => { const d = dayOfDate(e.date); return d >= w.startDay && d <= w.endDay; })
      .reduce((s, e) => s + Number(e.amount), 0);

    const pct = weeklyCap > 0 ? (wSpent / weeklyCap) * 100 : 0;
    const isActive = isCurrentMonth && todayDay >= w.startDay && todayDay <= w.endDay;

    let badgeClass = "badge-ok", badgeText = "تمام", barClass = "";
    if (weeklyCap > 0) {
      if (wSpent > weeklyCap) { badgeClass = "badge-over"; badgeText = "تعدّيت!"; barClass = "over"; }
      else if (pct >= 80) { badgeClass = "badge-warn"; badgeText = "انتبه"; barClass = "warn"; }
    }

    const left = weeklyCap - wSpent;
    let statusText = "";
    if (weeklyCap > 0) {
      statusText = left >= 0 ? `باقي لك ${fmt(left)}` : `تعدّيت بـ ${fmt(Math.abs(left))}`;
    }

    const div = document.createElement("div");
    div.className = "week" + (isActive ? " active" : "");
    div.innerHTML = `
      <div class="week-title">
        <span>الأسبوع ${w.index}</span>
        ${weeklyCap > 0 ? `<span class="week-badge ${badgeClass}">${badgeText}</span>` : ""}
      </div>
      <div class="week-dates">${w.startDay} – ${w.endDay} ${AR_MONTHS[month]}</div>
      <div class="week-amt"><b>${fmt(wSpent)}</b>${weeklyCap > 0 ? ` / ${fmt(weeklyCap)}` : ""}</div>
      <div class="progress"><div class="progress-bar ${barClass}" style="width:${Math.min(pct, 100)}%"></div></div>
      <div class="week-status">${statusText}</div>
    `;
    grid.appendChild(div);
  });
}

function renderBreakdown(exps, spent) {
  const box = el("breakdown");
  const topBox = el("topCat");
  if (exps.length === 0) {
    topBox.innerHTML = "";
    box.innerHTML = `<p class="empty">ما فيه مصاريف لهذا الشهر بعد 👌</p>`;
    return;
  }
  const totals = {};
  exps.forEach(e => { totals[e.category] = (totals[e.category] || 0) + Number(e.amount); });
  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  const [topName, topAmt] = rows[0];
  const topPct = spent > 0 ? Math.round((topAmt / spent) * 100) : 0;
  topBox.innerHTML = `<div class="top-cat">أكثر شي صرفتي عليه: <b>${topName}</b> — ${fmt(topAmt)} (${topPct}%)</div>`;

  box.innerHTML = rows.map(([cat, amt]) => {
    const pct = spent > 0 ? (amt / spent) * 100 : 0;
    const color = CAT_COLORS[cat] || "#b06b8a";
    return `
      <div class="bd-row">
        <div class="bd-top">
          <span>${cat}</span>
          <span class="amt">${fmt(amt)} · ${Math.round(pct)}%</span>
        </div>
        <div class="bd-bar"><div class="bd-fill" style="width:${pct}%;background:${color}"></div></div>
      </div>`;
  }).join("");
}

function renderTxList(exps) {
  const list = el("txList");
  el("txCount").textContent = `${exps.length} عملية`;
  if (exps.length === 0) {
    list.innerHTML = `<p class="empty">سجّلي أول مصروف لك من فوق ⬆️</p>`;
    return;
  }
  const sorted = [...exps].sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  list.innerHTML = sorted.map(e => {
    const d = e.date.split("-");
    const dateStr = `${Number(d[2])} ${AR_MONTHS[Number(d[1]) - 1]}`;
    return `
      <li class="tx">
        <div class="tx-info">
          <span class="tx-cat">${e.category}</span>
          <span class="tx-meta">${dateStr}${e.note ? " · " + escapeHtml(e.note) : ""}</span>
        </div>
        <div class="tx-right">
          <span class="tx-amt">- ${fmt(e.amount)}</span>
          <button class="tx-del" data-id="${e.id}" title="حذف">✕</button>
        </div>
      </li>`;
  }).join("");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

/* ---------- التوست ---------- */
let toastTimer;
function toast(msg, type = "") {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.className = "toast " + type;
  t.textContent = msg;
  requestAnimationFrame(() => t.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ---------- الأحداث ---------- */
el("saveBudget").addEventListener("click", () => {
  const b = Number(el("monthlyBudget").value);
  const inc = Number(el("income").value);
  if (!(b >= 0) || !(inc >= 0)) { toast("اكتبي أرقام صحيحة", "error"); return; }
  state.budget = b;
  state.income = inc;
  save(); render();
  toast("تم الحفظ ✅");
});

el("income").addEventListener("change", () => {
  const inc = Number(el("income").value);
  if (inc >= 0) { state.income = inc; save(); render(); }
});

el("saveGoal").addEventListener("click", () => {
  const g = Number(el("savingsGoal").value);
  if (!(g >= 0)) { toast("اكتبي مبلغ صحيح", "error"); return; }
  state.savingsGoal = g;
  save(); render();
  toast("تم حفظ هدف الادخار 🐷");
});

el("currency").addEventListener("change", e => {
  state.currency = e.target.value; save(); render();
});

el("expenseForm").addEventListener("submit", e => {
  e.preventDefault();
  const amount = Number(el("expAmount").value);
  const category = el("expCategory").value;
  const date = el("expDate").value || todayISO();
  const note = el("expNote").value.trim();

  if (!(amount > 0)) { toast("اكتبي مبلغ أكبر من صفر", "error"); return; }

  state.expenses.push({ id: uid(), amount, category, date, note });
  save();
  checkLimits(date);

  el("expAmount").value = "";
  el("expNote").value = "";
  render();
});

function checkLimits(date) {
  const exps = monthExpenses();
  const spent = exps.reduce((s, e) => s + Number(e.amount), 0);

  if (state.budget > 0 && spent > state.budget) {
    toast("⚠️ تعدّيتي ميزانيتك الشهرية!", "error");
    return;
  }

  const weeks = weeksOfMonth(state.monthKey);
  const weeklyCap = state.budget > 0 ? state.budget / weeks.length : 0;
  const day = dayOfDate(date);
  const w = weeks.find(w => day >= w.startDay && day <= w.endDay);
  if (w && weeklyCap > 0) {
    const wSpent = exps
      .filter(e => { const d = dayOfDate(e.date); return d >= w.startDay && d <= w.endDay; })
      .reduce((s, e) => s + Number(e.amount), 0);
    if (wSpent > weeklyCap) toast(`⚠️ تعدّيتي ميزانية الأسبوع ${w.index}!`, "error");
    else if (wSpent >= weeklyCap * 0.8) toast(`انتبهي: قربتي تخلّصي ميزانية الأسبوع ${w.index}`, "warn");
    else toast("تمت إضافة المصروف ✅");
  } else {
    toast("تمت إضافة المصروف ✅");
  }
}

el("txList").addEventListener("click", e => {
  const btn = e.target.closest(".tx-del");
  if (!btn) return;
  state.expenses = state.expenses.filter(x => x.id !== btn.dataset.id);
  save(); render();
  toast("تم حذف المصروف");
});

el("resetMonth").addEventListener("click", () => {
  const nowKey = monthKeyOf(new Date());
  if (!confirm("تبين تنتقلين للشهر الحالي؟ سيتم الاحتفاظ بكل سجلاتك السابقة.")) return;
  state.monthKey = nowKey;
  save(); render();
  toast("بدأنا متابعة الشهر الحالي 📅");
});

/* ---------- تصدير CSV ---------- */
el("exportBtn").addEventListener("click", () => {
  const exps = monthExpenses();
  if (exps.length === 0) { toast("ما فيه مصاريف للتصدير", "warn"); return; }
  const header = ["التاريخ", "الفئة", "المبلغ", "ملاحظة"];
  const rows = [...exps]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(e => [e.date, e.category, e.amount, (e.note || "").replace(/"/g, '""')]);
  const csv = [header, ...rows]
    .map(r => r.map(c => `"${c}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `مصاريف-${state.monthKey}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast("تم تصدير الملف ⬇️");
});

/* ---------- البدء ---------- */
el("expDate").value = todayISO();
render();
