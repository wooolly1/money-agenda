/* أجندة فلوسي — تتبّع الميزانية الشهرية
   كل البيانات تُحفظ محليًا في المتصفح (localStorage). */

const STORE_KEY = "money-agenda-v1";

const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const CAT_COLORS = {
  "🍔 أكل": "#ef5b6b",
  "🚗 مواصلات": "#5b8def",
  "🛒 تسوق": "#f1b24a",
  "🏠 فواتير": "#36c98e",
  "☕ كافيهات": "#a06bdc",
  "💊 صحة": "#3fc4d8",
  "🎮 ترفيه": "#e06bb0",
  "📦 أخرى": "#8b93a3"
};

/* ---------- الحالة ---------- */
let state = load();

function defaultState() {
  const now = new Date();
  return {
    monthKey: monthKeyOf(now),
    budget: 0,
    currency: "ر.س",
    expenses: [] // {id, amount, category, date, note}
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const s = JSON.parse(raw);
    // ترحيل بسيط للحقول الناقصة
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

/* تقسيم الشهر إلى أسابيع (كل أسبوع 7 أيام بدءًا من اليوم 1) */
function weeksOfMonth(monthKey) {
  const { year, month } = parseMonthKey(monthKey);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = [];
  let start = 1;
  let idx = 1;
  while (start <= daysInMonth) {
    const end = Math.min(start + 6, daysInMonth);
    weeks.push({ index: idx, startDay: start, endDay: end });
    start = end + 1;
    idx++;
  }
  return weeks;
}

function dayOfDate(iso) {
  return Number(iso.split("-")[2]);
}

/* مصاريف الشهر الحالي فقط */
function monthExpenses() {
  return state.expenses.filter(e => e.date.startsWith(state.monthKey));
}

/* ---------- العناصر ---------- */
const el = id => document.getElementById(id);

/* ---------- العرض ---------- */
function render() {
  // ترويسة الشهر
  const { year, month } = parseMonthKey(state.monthKey);
  el("monthLabel").textContent = `${AR_MONTHS[month]} ${year}`;

  el("currency").value = state.currency;
  el("monthlyBudget").value = state.budget || "";
  el("expDate").value = el("expDate").value || todayISO();

  const exps = monthExpenses();
  const spent = exps.reduce((s, e) => s + Number(e.amount), 0);
  const remaining = state.budget - spent;
  const pct = state.budget > 0 ? (spent / state.budget) * 100 : 0;

  // الباقي
  const remEl = el("remaining");
  remEl.textContent = fmt(remaining);
  remEl.classList.toggle("negative", remaining < 0);

  el("spentTotal").textContent = fmt(spent);
  el("spentPct").textContent = Math.round(pct) + "%";

  // شريط التقدم
  const bar = el("monthProgress");
  bar.style.width = Math.min(pct, 100) + "%";
  bar.classList.remove("warn", "over");
  if (pct >= 100) bar.classList.add("over");
  else if (pct >= 80) bar.classList.add("warn");

  renderWeeks(exps);
  renderBreakdown(exps, spent);
  renderTxList(exps);
}

function renderWeeks(exps) {
  const weeks = weeksOfMonth(state.monthKey);
  // الحد الأسبوعي = الميزانية مقسومة على عدد الأسابيع
  const weeklyCap = state.budget > 0 ? state.budget / weeks.length : 0;
  el("weeklyCap").textContent = state.budget > 0
    ? `الحد لكل أسبوع: ${fmt(weeklyCap)}`
    : "حدّد ميزانيتك أولًا";

  const { year, month } = parseMonthKey(state.monthKey);
  const isCurrentMonth = state.monthKey === monthKeyOf(new Date());
  const todayDay = new Date().getDate();

  const grid = el("weeksGrid");
  grid.innerHTML = "";

  weeks.forEach(w => {
    const wSpent = exps
      .filter(e => {
        const d = dayOfDate(e.date);
        return d >= w.startDay && d <= w.endDay;
      })
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
      statusText = left >= 0
        ? `باقي لك ${fmt(left)}`
        : `تعدّيت بـ ${fmt(Math.abs(left))}`;
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
  if (exps.length === 0) {
    box.innerHTML = `<p class="empty">ما فيه مصاريف لهذا الشهر بعد 👌</p>`;
    return;
  }
  const totals = {};
  exps.forEach(e => { totals[e.category] = (totals[e.category] || 0) + Number(e.amount); });
  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  box.innerHTML = rows.map(([cat, amt]) => {
    const pct = spent > 0 ? (amt / spent) * 100 : 0;
    const color = CAT_COLORS[cat] || "#8b93a3";
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
    list.innerHTML = `<p class="empty">سجّل أول مصروف لك من فوق ⬆️</p>`;
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
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.className = "toast " + type;
  t.textContent = msg;
  requestAnimationFrame(() => t.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ---------- الأحداث ---------- */
el("saveBudget").addEventListener("click", () => {
  const v = Number(el("monthlyBudget").value);
  if (!(v >= 0)) { toast("اكتب مبلغ صحيح", "error"); return; }
  state.budget = v;
  save();
  render();
  toast("تم حفظ الميزانية ✅");
});

el("currency").addEventListener("change", e => {
  state.currency = e.target.value;
  save();
  render();
});

el("expenseForm").addEventListener("submit", e => {
  e.preventDefault();
  const amount = Number(el("expAmount").value);
  const category = el("expCategory").value;
  const date = el("expDate").value || todayISO();
  const note = el("expNote").value.trim();

  if (!(amount > 0)) { toast("اكتب مبلغ أكبر من صفر", "error"); return; }

  state.expenses.push({ id: uid(), amount, category, date, note });
  save();

  // تنبيهات الحد الأسبوعي والشهري
  checkLimits(date);

  // تصفير الحقول
  el("expAmount").value = "";
  el("expNote").value = "";
  render();
});

function checkLimits(date) {
  const exps = monthExpenses();
  const spent = exps.reduce((s, e) => s + Number(e.amount), 0);

  // الشهري
  if (state.budget > 0 && spent > state.budget) {
    toast("⚠️ تعدّيت ميزانيتك الشهرية!", "error");
    return;
  }

  // الأسبوعي
  const weeks = weeksOfMonth(state.monthKey);
  const weeklyCap = state.budget > 0 ? state.budget / weeks.length : 0;
  const day = dayOfDate(date);
  const w = weeks.find(w => day >= w.startDay && day <= w.endDay);
  if (w && weeklyCap > 0) {
    const wSpent = exps
      .filter(e => { const d = dayOfDate(e.date); return d >= w.startDay && d <= w.endDay; })
      .reduce((s, e) => s + Number(e.amount), 0);
    if (wSpent > weeklyCap) {
      toast(`⚠️ تعدّيت ميزانية الأسبوع ${w.index}!`, "error");
    } else if (wSpent >= weeklyCap * 0.8) {
      toast(`انتبه: قربت تخلّص ميزانية الأسبوع ${w.index}`, "warn");
    } else {
      toast("تمت إضافة المصروف ✅");
    }
  } else {
    toast("تمت إضافة المصروف ✅");
  }
}

el("txList").addEventListener("click", e => {
  const btn = e.target.closest(".tx-del");
  if (!btn) return;
  const id = btn.dataset.id;
  state.expenses = state.expenses.filter(x => x.id !== id);
  save();
  render();
  toast("تم حذف المصروف");
});

el("resetMonth").addEventListener("click", () => {
  const nowKey = monthKeyOf(new Date());
  if (state.monthKey === nowKey) {
    if (!confirm("تبدأ شهر جديد؟ سيتم الانتقال للشهر الحالي والاحتفاظ بكل سجلاتك السابقة.")) return;
  }
  state.monthKey = nowKey;
  save();
  render();
  toast("بدأنا متابعة الشهر الحالي 📅");
});

/* ---------- البدء ---------- */
el("expDate").value = todayISO();
render();
