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
let viewKey = monthKeyOf(new Date()); // الشهر المعروض حاليًا

function defaultState() {
  return {
    months: {},        // { "2026-06": { budget, savingsGoal } }
    recurring: [],      // [{ id, amount, category, day, note }]
    pots: [],           // [{ id, name, emoji, target, balance }]
    incomes: [],        // [{ id, amount, source, date, note }]
    currency: "ر.س",
    expenses: []        // [{ id, amount, category, date, note, recurringId? }]
  };
}

const SOURCE_COLORS = {
  "💼 راتب": "#2bbf8a",
  "💸 مكافأة": "#5b8def",
  "🔁 تحويل": "#b06bdc",
  "🛍️ بيع": "#ffa630",
  "📈 استثمار": "#3fc4d8",
  "💻 عمل حر": "#ff4d94",
  "🎁 هدية": "#f06292",
  "🏷️ استرجاع": "#ff6fa8",
  "➕ أخرى": "#b06b8a"
};

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const s = JSON.parse(raw);
    const base = defaultState();
    base.currency = s.currency || base.currency;
    base.expenses = Array.isArray(s.expenses) ? s.expenses : [];
    base.recurring = Array.isArray(s.recurring) ? s.recurring : [];
    base.pots = Array.isArray(s.pots) ? s.pots : [];
    base.incomes = Array.isArray(s.incomes) ? s.incomes : [];
    base.months = s.months && typeof s.months === "object" ? s.months : {};
    // ترحيل من النسخة القديمة (ميزانية واحدة عامة)
    if (!s.months && (s.budget || s.income || s.savingsGoal)) {
      const key = s.monthKey || monthKeyOf(new Date());
      base.months[key] = {
        budget: Number(s.budget) || 0,
        income: Number(s.income) || 0,
        savingsGoal: Number(s.savingsGoal) || 0
      };
    }
    // ترحيل الدخل القديم (رقم واحد لكل شهر) إلى سجلات دخل مفصّلة
    Object.keys(base.months).forEach(key => {
      const m = base.months[key];
      if (m && Number(m.income) > 0) {
        base.incomes.push({
          id: uid(), amount: Number(m.income), source: "💼 راتب",
          date: `${key}-01`, note: ""
        });
        m.income = 0;
      }
    });
    return base;
  } catch {
    return defaultState();
  }
}

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

/* إعدادات الشهر المعروض (تُنشأ عند الحاجة) */
function monthSettings(key = viewKey) {
  if (!state.months[key]) state.months[key] = { budget: 0, income: 0, savingsGoal: 0 };
  return state.months[key];
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
function daysInMonth(key) {
  const { year, month } = parseMonthKey(key);
  return new Date(year, month + 1, 0).getDate();
}
function weeksOfMonth(key) {
  const total = daysInMonth(key);
  const weeks = [];
  let start = 1, idx = 1;
  while (start <= total) {
    const end = Math.min(start + 6, total);
    weeks.push({ index: idx, startDay: start, endDay: end });
    start = end + 1; idx++;
  }
  return weeks;
}
function dayOfDate(iso) { return Number(iso.split("-")[2]); }
function monthExpenses(key = viewKey) {
  return state.expenses.filter(e => e.date.startsWith(key));
}
function monthIncomes(key = viewKey) {
  return state.incomes.filter(i => i.date.startsWith(key));
}
function monthIncomeTotal(key = viewKey) {
  return monthIncomes(key).reduce((s, i) => s + Number(i.amount), 0);
}

/* ---------- المصاريف المتكررة ----------
   تُطبّق على الشهر الحقيقي الحالي: لكل مصروف متكرر، إذا ما انضاف لهذا الشهر نضيفه. */
function applyRecurring() {
  const key = monthKeyOf(new Date());
  let changed = false;
  state.recurring.forEach(r => {
    const exists = state.expenses.some(e => e.recurringId === r.id && e.date.startsWith(key));
    if (!exists) {
      const day = Math.min(Math.max(Number(r.day) || 1, 1), daysInMonth(key));
      const date = `${key}-${String(day).padStart(2, "0")}`;
      state.expenses.push({
        id: uid(), amount: Number(r.amount), category: r.category,
        date, note: r.note || "", recurringId: r.id
      });
      changed = true;
    }
  });
  if (changed) save();
}

/* ---------- العناصر ---------- */
const el = id => document.getElementById(id);

/* ---------- العرض ---------- */
function render() {
  const { year, month } = parseMonthKey(viewKey);
  el("monthLabel").textContent = `${AR_MONTHS[month]} ${year}`;

  const ms = monthSettings();
  el("currency").value = state.currency;
  el("monthlyBudget").value = ms.budget || "";
  el("savingsGoal").value = ms.savingsGoal || "";
  if (!el("expDate").value) el("expDate").value = todayISO();
  if (!el("incDate").value) el("incDate").value = todayISO();

  const exps = monthExpenses();
  const incs = monthIncomes();
  const income = monthIncomeTotal();
  const spent = exps.reduce((s, e) => s + Number(e.amount), 0);
  const remaining = ms.budget - spent;
  const pct = ms.budget > 0 ? (spent / ms.budget) * 100 : 0;

  el("incomeDisplay").textContent = fmt(income);
  el("statIncome").textContent = fmt(income);
  el("statSpent").textContent = fmt(spent);
  el("statSaved").textContent = fmt(Math.max(income - spent, 0));

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

  renderGoal(income, spent);
  renderWeeks(ms, exps);
  renderBreakdown(exps, spent);
  renderTxList(exps);
  renderIncomeBreakdown(incs, income);
  renderIncomeList(incs);
  renderRecurring();
  renderPots();
}

function renderIncomeBreakdown(incs, income) {
  const box = el("incBreakdown");
  const topBox = el("incTopSource");
  if (incs.length === 0) {
    topBox.innerHTML = "";
    box.innerHTML = `<p class="empty">ما سجّلتي دخل لهذا الشهر بعد 💵</p>`;
    return;
  }
  const totals = {};
  incs.forEach(i => { totals[i.source] = (totals[i.source] || 0) + Number(i.amount); });
  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  const [topName, topAmt] = rows[0];
  const topPct = income > 0 ? Math.round((topAmt / income) * 100) : 0;
  topBox.innerHTML = `<div class="top-cat inc">أكثر مصدر لدخلك: <b>${topName}</b> — ${fmt(topAmt)} (${topPct}%)</div>`;

  box.innerHTML = rows.map(([src, amt]) => {
    const pct = income > 0 ? (amt / income) * 100 : 0;
    const color = SOURCE_COLORS[src] || "#2bbf8a";
    return `
      <div class="bd-row">
        <div class="bd-top">
          <span>${src}</span>
          <span class="amt">${fmt(amt)} · ${Math.round(pct)}%</span>
        </div>
        <div class="bd-bar"><div class="bd-fill" style="width:${pct}%;background:${color}"></div></div>
      </div>`;
  }).join("");
}

function renderIncomeList(incs) {
  const list = el("incList");
  el("incCount").textContent = `${incs.length} دخل`;
  if (incs.length === 0) {
    list.innerHTML = `<p class="empty">سجّلي أول دخل لك من فوق ⬆️</p>`;
    return;
  }
  const sorted = [...incs].sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  list.innerHTML = sorted.map(i => {
    const d = i.date.split("-");
    const dateStr = `${Number(d[2])} ${AR_MONTHS[Number(d[1]) - 1]}`;
    return `
      <li class="tx">
        <div class="tx-info">
          <span class="tx-cat">${i.source}</span>
          <span class="tx-meta">${dateStr}${i.note ? " · " + escapeHtml(i.note) : ""}</span>
        </div>
        <div class="tx-right">
          <span class="tx-amt inc">+ ${fmt(i.amount)}</span>
          <button class="inc-del" data-id="${i.id}" title="حذف">✕</button>
        </div>
      </li>`;
  }).join("");
}

function renderPots() {
  const grid = el("potsGrid");
  const totalEl = el("potsTotal");
  const total = state.pots.reduce((s, p) => s + Number(p.balance || 0), 0);
  totalEl.textContent = state.pots.length ? `المجموع: ${fmt(total)}` : "";

  if (state.pots.length === 0) {
    grid.innerHTML = `<p class="empty">أنشئي صندوقًا للاحتياطي أو تأمين السيارة 🫙</p>`;
    return;
  }
  grid.innerHTML = state.pots.map(p => {
    const bal = Number(p.balance || 0);
    const target = Number(p.target || 0);
    const pct = target > 0 ? Math.min((bal / target) * 100, 100) : 0;
    return `
      <div class="pot">
        <div class="pot-head">
          <span class="pot-emoji">${p.emoji || "🫙"}</span>
          <span class="pot-name">${escapeHtml(p.name)}</span>
          <button class="pot-del" data-id="${p.id}" title="حذف">✕</button>
        </div>
        <div class="pot-bal">${fmt(bal)}</div>
        ${target > 0 ? `<div class="pot-target">الهدف: ${fmt(target)} (${Math.round(pct)}%)</div>
          <div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>` : ""}
        <div class="pot-actions">
          <button class="pot-btn dep" data-dep="${p.id}">+ إيداع</button>
          <button class="pot-btn wd" data-wd="${p.id}">− سحب</button>
        </div>
      </div>`;
  }).join("");
}

function renderGoal(income, spent) {
  const ms = monthSettings();
  const saved = Math.max(income - spent, 0);
  const goal = ms.savingsGoal;
  const fill = el("goalFill");
  const msg = el("goalMsg");
  if (!goal || goal <= 0) {
    fill.style.width = "0%";
    msg.className = "goal-msg";
    msg.textContent = "حدّدي هدف ادخار لهذا الشهر 💕";
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

function renderWeeks(ms, exps) {
  const weeks = weeksOfMonth(viewKey);
  const weeklyCap = ms.budget > 0 ? ms.budget / weeks.length : 0;
  el("weeklyCap").textContent = ms.budget > 0
    ? `الحد لكل أسبوع: ${fmt(weeklyCap)}`
    : "حدّدي ميزانيتك أولًا";

  const { month } = parseMonthKey(viewKey);
  const isCurrentMonth = viewKey === monthKeyOf(new Date());
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
    const recBadge = e.recurringId ? `<span class="rec-tag">🔁 متكرر</span>` : "";
    return `
      <li class="tx">
        <div class="tx-info">
          <span class="tx-cat">${e.category}${recBadge}</span>
          <span class="tx-meta">${dateStr}${e.note ? " · " + escapeHtml(e.note) : ""}</span>
        </div>
        <div class="tx-right">
          <span class="tx-amt${e.recurringId ? " rec" : ""}">- ${fmt(e.amount)}</span>
          <button class="tx-del" data-id="${e.id}" title="حذف">✕</button>
        </div>
      </li>`;
  }).join("");
}

function renderRecurring() {
  const list = el("recList");
  if (state.recurring.length === 0) {
    list.innerHTML = `<p class="empty">ما فيه مصاريف متكررة · أضيفي اشتراكاتك الثابتة ⬆️</p>`;
    return;
  }
  list.innerHTML = state.recurring
    .slice()
    .sort((a, b) => a.day - b.day)
    .map(r => `
      <li class="tx">
        <div class="tx-info">
          <span class="tx-cat">${r.category}${r.note ? " · " + escapeHtml(r.note) : ""}</span>
          <span class="tx-meta">كل شهر يوم ${r.day}</span>
        </div>
        <div class="tx-right">
          <span class="tx-amt rec">- ${fmt(r.amount)}</span>
          <button class="rec-del" data-id="${r.id}" title="حذف">✕</button>
        </div>
      </li>`).join("");
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

/* ---------- التنقّل بين الشهور ---------- */
function shiftMonth(delta) {
  const { year, month } = parseMonthKey(viewKey);
  const d = new Date(year, month + delta, 1);
  viewKey = monthKeyOf(d);
  el("expDate").value = "";
  el("incDate").value = "";
  render();
}
el("prevMonth").addEventListener("click", () => shiftMonth(-1));
el("nextMonth").addEventListener("click", () => shiftMonth(1));
el("todayBtn").addEventListener("click", () => {
  viewKey = monthKeyOf(new Date());
  el("expDate").value = todayISO();
  el("incDate").value = todayISO();
  render();
});

/* ---------- الأحداث ---------- */
el("saveBudget").addEventListener("click", () => {
  const b = Number(el("monthlyBudget").value);
  if (!(b >= 0)) { toast("اكتبي مبلغ صحيح", "error"); return; }
  monthSettings().budget = b;
  save(); render();
  toast("تم حفظ الميزانية ✅");
});

/* ---------- الدخل ---------- */
// إظهار مربّع كتابة المصدر عند اختيار «مصدر آخر»
el("incSource").addEventListener("change", () => {
  const custom = el("incSource").value === "✏️ مصدر آخر";
  el("incCustomWrap").style.display = custom ? "flex" : "none";
  if (custom) el("incCustomSource").focus();
});

el("incomeForm").addEventListener("submit", e => {
  e.preventDefault();
  const amount = Number(el("incAmount").value);
  let source = el("incSource").value;
  const date = el("incDate").value || `${viewKey}-01`;
  const note = el("incNote").value.trim();

  if (!(amount > 0)) { toast("اكتبي مبلغ أكبر من صفر", "error"); return; }

  // مصدر مكتوب بخط اليد
  if (source === "✏️ مصدر آخر") {
    const custom = el("incCustomSource").value.trim();
    if (!custom) { toast("اكتبي اسم المصدر", "error"); return; }
    source = custom.startsWith("💰") ? custom : "💰 " + custom;
  }

  state.incomes.push({ id: uid(), amount, source, date, note });
  save();
  el("incAmount").value = "";
  el("incNote").value = "";
  el("incCustomSource").value = "";
  el("incSource").value = "💼 راتب";
  el("incCustomWrap").style.display = "none";
  viewKey = date.slice(0, 7);
  render();
  toast("تمت إضافة الدخل 💵");
});

el("incList").addEventListener("click", e => {
  const btn = e.target.closest(".inc-del");
  if (!btn) return;
  state.incomes = state.incomes.filter(x => x.id !== btn.dataset.id);
  save(); render();
  toast("تم حذف الدخل");
});

el("saveGoal").addEventListener("click", () => {
  const g = Number(el("savingsGoal").value);
  if (!(g >= 0)) { toast("اكتبي مبلغ صحيح", "error"); return; }
  monthSettings().savingsGoal = g;
  save(); render();
  toast("تم حفظ هدف الادخار 🏦");
});

el("currency").addEventListener("change", e => {
  state.currency = e.target.value; save(); render();
});

el("expenseForm").addEventListener("submit", e => {
  e.preventDefault();
  const amount = Number(el("expAmount").value);
  const category = el("expCategory").value;
  const date = el("expDate").value || `${viewKey}-01`;
  const note = el("expNote").value.trim();

  if (!(amount > 0)) { toast("اكتبي مبلغ أكبر من صفر", "error"); return; }

  state.expenses.push({ id: uid(), amount, category, date, note });
  save();
  checkLimits(date);

  el("expAmount").value = "";
  el("expNote").value = "";
  // تأكد إن الشهر المعروض هو شهر المصروف الجديد
  viewKey = date.slice(0, 7);
  render();
});

function checkLimits(date) {
  const key = date.slice(0, 7);
  const ms = monthSettings(key);
  const exps = monthExpenses(key);
  const spent = exps.reduce((s, e) => s + Number(e.amount), 0);

  if (ms.budget > 0 && spent > ms.budget) {
    toast("⚠️ تعدّيتي ميزانيتك الشهرية!", "error");
    return;
  }

  const weeks = weeksOfMonth(key);
  const weeklyCap = ms.budget > 0 ? ms.budget / weeks.length : 0;
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

/* ---------- المصاريف المتكررة ---------- */
el("recurringForm").addEventListener("submit", e => {
  e.preventDefault();
  const amount = Number(el("recAmount").value);
  const category = el("recCategory").value;
  const day = Math.min(Math.max(Number(el("recDay").value) || 1, 1), 31);
  const note = el("recNote").value.trim();

  if (!(amount > 0)) { toast("اكتبي مبلغ أكبر من صفر", "error"); return; }

  state.recurring.push({ id: uid(), amount, category, day, note });
  save();
  applyRecurring(); // طبّقه فورًا على الشهر الحالي

  el("recAmount").value = "";
  el("recNote").value = "";
  el("recDay").value = "1";
  render();
  toast("تمت إضافة المصروف المتكرر 🔁");
});

el("recList").addEventListener("click", e => {
  const btn = e.target.closest(".rec-del");
  if (!btn) return;
  const id = btn.dataset.id;
  if (!confirm("حذف هذا المصروف المتكرر؟ (لن يتكرر مستقبلًا، والمصاريف المسجّلة سابقًا تبقى)")) return;
  state.recurring = state.recurring.filter(r => r.id !== id);
  save(); render();
  toast("تم حذف المصروف المتكرر");
});

/* ---------- صناديق الادخار / الاحتياطي ---------- */
el("potForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = el("potName").value.trim();
  const emoji = el("potEmoji").value;
  const target = Number(el("potTarget").value) || 0;
  if (!name) { toast("اكتبي اسم الصندوق", "error"); return; }

  state.pots.push({ id: uid(), name, emoji, target, balance: 0 });
  save();
  el("potName").value = "";
  el("potTarget").value = "";
  render();
  toast("تم إنشاء الصندوق 🫙");
});

el("potsGrid").addEventListener("click", e => {
  const dep = e.target.closest("[data-dep]");
  const wd = e.target.closest("[data-wd]");
  const del = e.target.closest(".pot-del");

  if (del) {
    const p = state.pots.find(x => x.id === del.dataset.id);
    if (!p) return;
    if (!confirm(`حذف صندوق «${p.name}»؟ (الرصيد ${fmt(p.balance)} سيُحذف)`)) return;
    state.pots = state.pots.filter(x => x.id !== del.dataset.id);
    save(); render();
    toast("تم حذف الصندوق");
    return;
  }

  if (dep) {
    const p = state.pots.find(x => x.id === dep.dataset.id);
    if (!p) return;
    const v = Number(prompt(`كم تبين تودعين في «${p.name}»؟`, ""));
    if (!(v > 0)) return;
    p.balance = Number(p.balance || 0) + v;
    save(); render();
    if (p.target > 0 && p.balance >= p.target) toast(`🎉 وصلتي لهدف «${p.name}»!`);
    else toast(`تم إيداع ${fmt(v)} في «${p.name}» 💜`);
    return;
  }

  if (wd) {
    const p = state.pots.find(x => x.id === wd.dataset.id);
    if (!p) return;
    const v = Number(prompt(`كم تبين تسحبين من «${p.name}»؟ (الرصيد ${fmt(p.balance)})`, ""));
    if (!(v > 0)) return;
    if (v > Number(p.balance || 0)) { toast("المبلغ أكبر من رصيد الصندوق", "error"); return; }
    p.balance = Number(p.balance) - v;
    save(); render();
    toast(`تم سحب ${fmt(v)} من «${p.name}»`);
  }
});

/* ---------- تنزيل ملف ---------- */
function download(filename, content, mime, bom = true) {
  const parts = bom ? ["﻿", content] : [content];
  const blob = new Blob(parts, { type: mime + ";charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------- تصدير اكسل شامل (كل البيانات، كل الشهور) ---------- */
function xmlEscape(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]
  ));
}
function xlCell(v) {
  if (typeof v === "number" && isFinite(v)) {
    return `<Cell><Data ss:Type="Number">${v}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${xmlEscape(v == null ? "" : v)}</Data></Cell>`;
}
function xlRow(cells) {
  return `<Row>${cells.map(xlCell).join("")}</Row>`;
}
function xlSheet(name, headerRow, dataRows) {
  const rows = [xlRow(headerRow), ...dataRows.map(xlRow)].join("");
  return `<Worksheet ss:Name="${xmlEscape(name)}">
<Table>${rows}</Table>
<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><DisplayRightToLeft/></WorksheetOptions>
</Worksheet>`;
}

function buildExcel() {
  const cur = state.currency;

  // كل الشهور المعروفة (من الإعدادات + المصاريف + الدخل)
  const keys = new Set([
    ...Object.keys(state.months),
    ...state.expenses.map(e => e.date.slice(0, 7)),
    ...state.incomes.map(i => i.date.slice(0, 7))
  ]);
  const monthsSorted = [...keys].filter(Boolean).sort();

  // ورقة المصاريف
  const expRows = [...state.expenses]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(e => [e.date.slice(0, 7), e.date, e.category, Number(e.amount), e.note || "", e.recurringId ? "نعم" : "لا"]);

  // ورقة الدخل
  const incRows = [...state.incomes]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(i => [i.date.slice(0, 7), i.date, i.source, Number(i.amount), i.note || ""]);

  // ورقة الميزانيات الشهرية (ملخّص)
  const sumRows = monthsSorted.map(k => {
    const ms = state.months[k] || {};
    const budget = Number(ms.budget) || 0;
    const goal = Number(ms.savingsGoal) || 0;
    const spent = state.expenses.filter(e => e.date.startsWith(k)).reduce((s, e) => s + Number(e.amount), 0);
    const income = state.incomes.filter(i => i.date.startsWith(k)).reduce((s, i) => s + Number(i.amount), 0);
    return [k, budget, income, spent, budget - spent, Math.max(income - spent, 0), goal];
  });

  // ورقة الصناديق
  const potRows = state.pots.map(p => [p.name, Number(p.balance) || 0, Number(p.target) || 0]);

  // ورقة المتكررة
  const recRows = state.recurring.map(r => [r.category, Number(r.amount) || 0, r.day, r.note || ""]);

  const sheets = [
    xlSheet("الملخّص الشهري", ["الشهر", `الميزانية (${cur})`, `الدخل (${cur})`, `المصروف (${cur})`, `المتبقّي (${cur})`, `المُدّخر (${cur})`, `هدف الادخار (${cur})`], sumRows),
    xlSheet("المصاريف", ["الشهر", "التاريخ", "الفئة", `المبلغ (${cur})`, "ملاحظة", "متكرر"], expRows),
    xlSheet("الدخل", ["الشهر", "التاريخ", "المصدر", `المبلغ (${cur})`, "ملاحظة"], incRows),
    xlSheet("الصناديق", ["الصندوق", `الرصيد (${cur})`, `الهدف (${cur})`], potRows),
    xlSheet("المصاريف المتكررة", ["الفئة", `المبلغ (${cur})`, "يوم الخصم", "الاسم"], recRows)
  ].join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${sheets}
</Workbook>`;
}

el("excelBtn").addEventListener("click", () => {
  if (state.expenses.length === 0 && state.incomes.length === 0 && state.pots.length === 0) {
    toast("ما فيه بيانات للتصدير بعد", "warn");
    return;
  }
  download("أجندة-فلوسي.xls", buildExcel(), "application/vnd.ms-excel");
  toast("تم تصدير ملف الاكسل 📊");
});

/* ---------- نسخة احتياطية / استرجاع (JSON) ---------- */
el("backupBtn").addEventListener("click", () => {
  const data = JSON.stringify(state, null, 2);
  const stamp = todayISO();
  download(`نسخة-أجندة-فلوسي-${stamp}.json`, data, "application/json", false);
  toast("تم حفظ نسخة احتياطية 💾");
});

el("restoreBtn").addEventListener("click", () => el("restoreFile").click());

el("restoreFile").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(String(reader.result).replace(/^﻿/, ""));
      if (!obj || typeof obj !== "object" || !Array.isArray(obj.expenses)) {
        throw new Error("صيغة غير صحيحة");
      }
      if (!confirm("استرجاع هذه النسخة سيستبدل بياناتك الحالية. متأكدة؟")) {
        el("restoreFile").value = "";
        return;
      }
      localStorage.setItem(STORE_KEY, JSON.stringify(obj));
      state = load();
      viewKey = monthKeyOf(new Date());
      applyRecurring();
      render();
      toast("تم استرجاع البيانات بنجاح ✅");
    } catch (err) {
      toast("الملف غير صالح ❌", "error");
    }
    el("restoreFile").value = "";
  };
  reader.readAsText(file);
});

/* ---------- البدء ---------- */
applyRecurring();
el("expDate").value = todayISO();
el("incDate").value = todayISO();
render();
