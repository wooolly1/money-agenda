/* أجندة فلوسي — تتبّع الميزانية الشهرية
   كل البيانات تُحفظ محليًا في المتصفح (localStorage). */

const STORE_KEY = "money-agenda-v1";

const MONTHS = {
  ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
       "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
  en: ["January", "February", "March", "April", "May", "June",
       "July", "August", "September", "October", "November", "December"]
};

/* ---------- الفئات والمصادر (القيمة المخزّنة عربية ثابتة، والعرض حسب اللغة) ---------- */
const CATEGORIES = [
  { v: "🍔 أكل", en: "🍔 Food" },
  { v: "🚗 مواصلات", en: "🚗 Transport" },
  { v: "🛒 تسوق", en: "🛒 Shopping" },
  { v: "🏠 فواتير", en: "🏠 Bills" },
  { v: "☕ كافيهات", en: "☕ Cafés" },
  { v: "💊 صحة", en: "💊 Health" },
  { v: "🎮 ترفيه", en: "🎮 Entertainment" },
  { v: "💄 جمال", en: "💄 Beauty" },
  { v: "🎁 هدايا", en: "🎁 Gifts" },
  { v: "📦 أخرى", en: "📦 Other" }
];
const REC_CATEGORIES = ["🏠 فواتير", "🎮 ترفيه", "🚗 مواصلات", "💊 صحة", "🛒 تسوق", "📦 أخرى"];
const SOURCES = [
  { v: "💼 راتب", en: "💼 Salary" },
  { v: "💸 مكافأة", en: "💸 Bonus" },
  { v: "🔁 تحويل", en: "🔁 Transfer" },
  { v: "🛍️ بيع", en: "🛍️ Sale" },
  { v: "📈 استثمار", en: "📈 Investment" },
  { v: "💻 عمل حر", en: "💻 Freelance" },
  { v: "🎁 هدية", en: "🎁 Gift" },
  { v: "🏷️ استرجاع", en: "🏷️ Refund" },
  { v: "✏️ مصدر آخر", en: "✏️ Other (type it)", ar: "✏️ مصدر آخر (اكتبيه)" }
];
const POT_EMOJIS = [
  { v: "🛟", ar: "🛟 احتياطي", en: "🛟 Emergency" },
  { v: "🚗", ar: "🚗 سيارة", en: "🚗 Car" },
  { v: "✈️", ar: "✈️ سفر", en: "✈️ Travel" },
  { v: "🏠", ar: "🏠 بيت", en: "🏠 Home" },
  { v: "🎓", ar: "🎓 تعليم", en: "🎓 Education" },
  { v: "📱", ar: "📱 جوال", en: "📱 Phone" },
  { v: "🎁", ar: "🎁 مناسبات", en: "🎁 Occasions" },
  { v: "💍", ar: "💍 ادخار كبير", en: "💍 Big goal" }
];
const CUSTOM_SOURCE = "✏️ مصدر آخر";

/* ---------- قاموس الترجمة ---------- */
const I18N = {
  ar: {
    title: "أجندة فلوسي · تتبّع الميزانية الشهرية", brand: "أجندة فلوسي", tag: "تتبّعي فلوسك بكل سهولة",
    currencyTitle: "العملة", excel: "📊 اكسل", backup: "💾 نسخة", restore: "📥 استرجاع",
    saveNote: "✅ بياناتك محفوظة تلقائيًا في هذه الصفحة على جهازك. للاحتفاظ بنسخة أو نقلها لجهاز ثاني استخدمي «💾 نسخة».",
    today: "اليوم",
    stIncome: "💵 الدخل", stSpent: "🧾 المصروف", stFixed: "🔁 ثابتة", stSaved: "🏦 ادّخرت",
    budgetLabel: "🎯 ميزانية هذا الشهر", save: "حفظ", incomeThisMonth: "💵 دخل هذا الشهر",
    remainingLabel: "الباقي لك", spentWord: "صُرف:", ofBudget: "من الميزانية",
    incomeTitle: "💵 سجّلي دخلك", amount: "المبلغ", sourceLabel: "من وين؟ (المصدر)",
    date: "التاريخ", noteOpt: "ملاحظة (اختياري)", add: "+ إضافة",
    customSourceLabel: "اسم المصدر", customSourcePh: "مثال: إيجار شقة، أرباح متجري…", incomeNotePh: "مثال: راتب هذا الشهر",
    incomeFromTitle: "💰 من وين جاك دخلك؟", yourIncome: "🧾 دخلك",
    goalTitle: "🏦 هدف الادخار", goalPh: "مثال: 1000", saveGoal: "حفظ الهدف", goalDefault: "حدّدي هدف ادخار لهذا الشهر 💕",
    weeksTitle: "📅 ميزانية الأسابيع",
    expenseTitle: "✏️ سجّلي مصروف", categoryLabel: "الفئة", expenseNotePh: "مثال: غداء مع الأصحاب",
    recurringTitle: "🔁 مصاريف متكررة (ثابتة)", recurringNote: "هذي المصاريف الثابتة ما تدخل في «المصروف» ولا الميزانية فوق — محسوبة لحالها.",
    dayLabel: "يوم الخصم", nameOpt: "الاسم (اختياري)", recurringNotePh: "مثال: اشتراك نتفلكس",
    potsTitle: "🫙 صناديق الادخار", iconLabel: "الأيقونة", potNameLabel: "اسم الصندوق", potNamePh: "مثال: تأمين السيارة",
    targetOpt: "الهدف (اختياري)", addPot: "+ صندوق",
    whereMoney: "🔍 وين راحت فلوسك؟", yourExpenses: "🧾 مصاريفك",
    foot: "بياناتك محفوظة على جهازك فقط 💖 أجندة فلوسي", cancel: "إلغاء", confirm: "تأكيد",
    // ديناميكية
    txCount: n => `${n} عملية`, incCount: n => `${n} دخل`,
    weeklyCap: v => `الحد لكل أسبوع: ${v}`, setBudgetFirst: "حدّدي ميزانيتك أولًا",
    week: i => `الأسبوع ${i}`, badgeOk: "تمام", badgeWarn: "انتبه", badgeOver: "تعدّيت!",
    weekLeft: v => `باقي لك ${v}`, weekOver: v => `تعدّيت بـ ${v}`,
    noExpenses: "ما فيه مصاريف لهذا الشهر بعد 👌", firstExpense: "سجّلي أول مصروف لك من فوق ⬆️",
    topCat: (c, a, p) => `أكثر شي صرفتي عليه: <b>${c}</b> — ${a} (${p}%)`,
    noIncome: "ما سجّلتي دخل لهذا الشهر بعد 💵", firstIncome: "سجّلي أول دخل لك من فوق ⬆️",
    topSource: (c, a, p) => `أكثر مصدر لدخلك: <b>${c}</b> — ${a} (${p}%)`,
    recTotal: v => `إجمالي الثابتة هذا الشهر: ${v} (خارج الميزانية)`,
    noRecurring: "ما فيه مصاريف متكررة · أضيفي اشتراكاتك الثابتة ⬆️", everyMonthDay: d => `كل شهر يوم ${d}`,
    potsSum: v => `المجموع: ${v}`, noPots: "أنشئي صندوقًا للاحتياطي أو تأمين السيارة 🫙",
    potTarget: (v, p) => `الهدف: ${v} (${p}%)`,
    goalDone: (g, s) => `🎉 مبروك! وصلتي لهدفك (${g}) وادّخرتي ${s}`,
    goalProg: (s, g, r, p) => `ادّخرتي ${s} من ${g} · باقي ${r} (${p}%)`,
    depTitle: n => `إيداع في «${n}»`, wdTitle: n => `سحب من «${n}»`, curBal: v => `الرصيد الحالي: ${v}`,
    delPotTitle: n => `حذف صندوق «${n}»؟`, delPotSub: v => `الرصيد ${v} سيُحذف.`,
    delRecTitle: "حذف هذا المصروف المتكرر؟", delRecSub: "لن يتكرر مستقبلًا، والمصاريف المسجّلة سابقًا تبقى.",
    restoreTitle: "استرجاع هذه النسخة؟", restoreSub: "سيتم استبدال بياناتك الحالية بالكامل.",
    tBudgetSaved: "تم حفظ الميزانية ✅", tGoalSaved: "تم حفظ هدف الادخار 🏦", tIncAdded: "تمت إضافة الدخل 💵",
    tExpAdded: "تمت إضافة المصروف ✅", tExpDeleted: "تم حذف المصروف", tIncDeleted: "تم حذف الدخل",
    tRecAdded: "تمت إضافة المصروف المتكرر 🔁", tRecDeleted: "تم حذف المصروف المتكرر",
    tPotAdded: "تم إنشاء الصندوق 🫙", tPotDeleted: "تم حذف الصندوق",
    tDep: (v, n) => `تم إيداع ${v} في «${n}» 💜`, tWd: (v, n) => `تم سحب ${v} من «${n}»`,
    tPotDone: n => `🎉 وصلتي لهدف «${n}»!`,
    tOverMonth: "⚠️ تعدّيتي ميزانيتك الشهرية!", tOverWeek: i => `⚠️ تعدّيتي ميزانية الأسبوع ${i}!`,
    tNearWeek: i => `انتبهي: قربتي تخلّصي ميزانية الأسبوع ${i}`,
    tToday: "بدأنا متابعة الشهر الحالي 📅", tExcel: "تم تصدير ملف الاكسل 📊", tBackup: "تم حفظ نسخة احتياطية 💾",
    tRestored: "تم استرجاع البيانات بنجاح ✅",
    errNumber: "اكتبي مبلغ صحيح", errAmount: "اكتبي مبلغ أكبر من صفر", errSource: "اكتبي اسم المصدر",
    errPotName: "اكتبي اسم الصندوق", errOverBal: "المبلغ أكبر من رصيد الصندوق",
    errNoData: "ما فيه بيانات للتصدير بعد", errBadFile: "الملف غير صالح ❌",
    xlSummary: "الملخّص الشهري", xlExpenses: "المصاريف", xlIncome: "الدخل", xlPots: "الصناديق", xlRecurring: "المصاريف المتكررة",
    xlMonth: "الشهر", xlDate: "التاريخ", xlCategory: "الفئة", xlNote: "ملاحظة", xlRecurringCol: "متكرر",
    xlYes: "نعم", xlNo: "لا", xlSource: "المصدر", xlBudget: "الميزانية", xlSpent: "المصروف",
    xlRemaining: "المتبقّي", xlSaved: "المُدّخر", xlGoal: "هدف الادخار", xlName: "الاسم", xlBalance: "الرصيد",
    xlTarget: "الهدف", xlDay: "يوم الخصم", xlFund: "الصندوق", expensesFile: "أجندة-فلوسي", backupFile: "نسخة-أجندة-فلوسي"
  },
  en: {
    title: "My Money Agenda · Monthly budget tracker", brand: "Money Agenda", tag: "Track your money easily",
    currencyTitle: "Currency", excel: "📊 Excel", backup: "💾 Backup", restore: "📥 Restore",
    saveNote: "✅ Your data is saved automatically in this page on your device. To keep a copy or move it to another device use “💾 Backup”.",
    today: "Today",
    stIncome: "💵 Income", stSpent: "🧾 Spent", stFixed: "🔁 Fixed", stSaved: "🏦 Saved",
    budgetLabel: "🎯 This month's budget", save: "Save", incomeThisMonth: "💵 This month's income",
    remainingLabel: "Left for you", spentWord: "Spent:", ofBudget: "of budget",
    incomeTitle: "💵 Add income", amount: "Amount", sourceLabel: "From where? (source)",
    date: "Date", noteOpt: "Note (optional)", add: "+ Add",
    customSourceLabel: "Source name", customSourcePh: "e.g. Apartment rent, shop profit…", incomeNotePh: "e.g. This month's salary",
    incomeFromTitle: "💰 Where did your income come from?", yourIncome: "🧾 Your income",
    goalTitle: "🏦 Savings goal", goalPh: "e.g. 1000", saveGoal: "Save goal", goalDefault: "Set a savings goal for this month 💕",
    weeksTitle: "📅 Weekly budget",
    expenseTitle: "✏️ Add expense", categoryLabel: "Category", expenseNotePh: "e.g. Lunch with friends",
    recurringTitle: "🔁 Recurring (fixed)", recurringNote: "These fixed expenses are NOT counted in “Spent” or the budget above — tracked separately.",
    dayLabel: "Charge day", nameOpt: "Name (optional)", recurringNotePh: "e.g. Netflix subscription",
    potsTitle: "🫙 Savings pots", iconLabel: "Icon", potNameLabel: "Pot name", potNamePh: "e.g. Car insurance",
    targetOpt: "Target (optional)", addPot: "+ Pot",
    whereMoney: "🔍 Where did your money go?", yourExpenses: "🧾 Your expenses",
    foot: "Your data is stored on your device only 💖 Money Agenda", cancel: "Cancel", confirm: "Confirm",
    txCount: n => `${n} entries`, incCount: n => `${n} income`,
    weeklyCap: v => `Weekly limit: ${v}`, setBudgetFirst: "Set your budget first",
    week: i => `Week ${i}`, badgeOk: "OK", badgeWarn: "Careful", badgeOver: "Over!",
    weekLeft: v => `${v} left`, weekOver: v => `Over by ${v}`,
    noExpenses: "No expenses this month yet 👌", firstExpense: "Add your first expense above ⬆️",
    topCat: (c, a, p) => `Top spending: <b>${c}</b> — ${a} (${p}%)`,
    noIncome: "No income recorded this month yet 💵", firstIncome: "Add your first income above ⬆️",
    topSource: (c, a, p) => `Top income source: <b>${c}</b> — ${a} (${p}%)`,
    recTotal: v => `Fixed total this month: ${v} (outside budget)`,
    noRecurring: "No recurring expenses · add your fixed subscriptions ⬆️", everyMonthDay: d => `Every month on day ${d}`,
    potsSum: v => `Total: ${v}`, noPots: "Create a pot for emergencies or car insurance 🫙",
    potTarget: (v, p) => `Target: ${v} (${p}%)`,
    goalDone: (g, s) => `🎉 Well done! You reached your goal (${g}) and saved ${s}`,
    goalProg: (s, g, r, p) => `Saved ${s} of ${g} · ${r} left (${p}%)`,
    depTitle: n => `Deposit to “${n}”`, wdTitle: n => `Withdraw from “${n}”`, curBal: v => `Current balance: ${v}`,
    delPotTitle: n => `Delete pot “${n}”?`, delPotSub: v => `Balance ${v} will be deleted.`,
    delRecTitle: "Delete this recurring expense?", delRecSub: "It won't recur in the future; past records stay.",
    restoreTitle: "Restore this backup?", restoreSub: "Your current data will be fully replaced.",
    tBudgetSaved: "Budget saved ✅", tGoalSaved: "Savings goal saved 🏦", tIncAdded: "Income added 💵",
    tExpAdded: "Expense added ✅", tExpDeleted: "Expense deleted", tIncDeleted: "Income deleted",
    tRecAdded: "Recurring expense added 🔁", tRecDeleted: "Recurring expense deleted",
    tPotAdded: "Pot created 🫙", tPotDeleted: "Pot deleted",
    tDep: (v, n) => `Deposited ${v} to “${n}” 💜`, tWd: (v, n) => `Withdrew ${v} from “${n}”`,
    tPotDone: n => `🎉 You reached the goal of “${n}”!`,
    tOverMonth: "⚠️ You exceeded your monthly budget!", tOverWeek: i => `⚠️ You exceeded Week ${i}'s budget!`,
    tNearWeek: i => `Careful: you're close to finishing Week ${i}'s budget`,
    tToday: "Now tracking the current month 📅", tExcel: "Excel file exported 📊", tBackup: "Backup saved 💾",
    tRestored: "Data restored successfully ✅",
    errNumber: "Enter a valid amount", errAmount: "Enter an amount greater than zero", errSource: "Enter the source name",
    errPotName: "Enter the pot name", errOverBal: "Amount exceeds the pot balance",
    errNoData: "No data to export yet", errBadFile: "Invalid file ❌",
    xlSummary: "Monthly summary", xlExpenses: "Expenses", xlIncome: "Income", xlPots: "Pots", xlRecurring: "Recurring",
    xlMonth: "Month", xlDate: "Date", xlCategory: "Category", xlNote: "Note", xlRecurringCol: "Recurring",
    xlYes: "Yes", xlNo: "No", xlSource: "Source", xlBudget: "Budget", xlSpent: "Spent",
    xlRemaining: "Remaining", xlSaved: "Saved", xlGoal: "Savings goal", xlName: "Name", xlBalance: "Balance",
    xlTarget: "Target", xlDay: "Charge day", xlFund: "Pot", expensesFile: "money-agenda", backupFile: "money-agenda-backup"
  }
};

function L() { return I18N[state && state.lang === "en" ? "en" : "ar"]; }
function mName(i) { return MONTHS[state.lang === "en" ? "en" : "ar"][i]; }
function t(key, ...args) {
  const v = L()[key];
  return typeof v === "function" ? v(...args) : v;
}
function catLabel(v) {
  if (state.lang !== "en") return v;
  const c = CATEGORIES.find(x => x.v === v);
  return c ? c.en : v;
}
function srcLabel(v) {
  if (state.lang !== "en") return v;
  const s = SOURCES.find(x => x.v === v);
  return s ? s.en : v; // المصادر المكتوبة يدويًا تبقى كما هي
}

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
    lang: "ar",
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
    base.lang = s.lang === "en" ? "en" : "ar";
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

/* ---------- اللغة ---------- */
function fillSelect(id, items, labelFn) {
  const sel = el(id);
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = items.map(it => `<option value="${it.v}">${labelFn(it)}</option>`).join("");
  if (prev && items.some(it => it.v === prev)) sel.value = prev;
}
function buildSelects() {
  const isEn = state.lang === "en";
  fillSelect("expCategory", CATEGORIES, it => isEn ? it.en : it.v);
  fillSelect("recCategory", CATEGORIES.filter(c => REC_CATEGORIES.includes(c.v)), it => isEn ? it.en : it.v);
  fillSelect("incSource", SOURCES, it => isEn ? it.en : (it.ar || it.v));
  fillSelect("potEmoji", POT_EMOJIS, it => isEn ? it.en : it.ar);
}
function applyStaticI18n() {
  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === "en" ? "ltr" : "rtl";
  document.querySelectorAll("[data-i18n]").forEach(node => {
    const v = L()[node.getAttribute("data-i18n")];
    if (typeof v === "string") node.textContent = v;
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(node => {
    const v = L()[node.getAttribute("data-i18n-ph")];
    if (typeof v === "string") node.setAttribute("placeholder", v);
  });
  document.querySelectorAll("[data-i18n-title]").forEach(node => {
    const v = L()[node.getAttribute("data-i18n-title")];
    if (typeof v === "string") node.setAttribute("title", v);
  });
  el("lang").value = state.lang;
}
function setLang(lang) {
  state.lang = lang === "en" ? "en" : "ar";
  save();
  applyStaticI18n();
  buildSelects();
  render();
}

/* ---------- العرض ---------- */
function render() {
  const { year, month } = parseMonthKey(viewKey);
  el("monthLabel").textContent = `${mName(month)} ${year}`;

  const ms = monthSettings();
  el("currency").value = state.currency;
  el("monthlyBudget").value = ms.budget || "";
  el("savingsGoal").value = ms.savingsGoal || "";
  if (!el("expDate").value) el("expDate").value = todayISO();
  if (!el("incDate").value) el("incDate").value = todayISO();

  const allExps = monthExpenses();
  // فصل المصاريف الثابتة (المتكررة) عن المصاريف العادية المتغيّرة
  const exps = allExps.filter(e => !e.recurringId);   // العادية = تدخل في الميزانية
  const fixedExps = allExps.filter(e => e.recurringId); // الثابتة = خارج الميزانية
  const incs = monthIncomes();
  const income = monthIncomeTotal();
  const spent = exps.reduce((s, e) => s + Number(e.amount), 0);
  const fixed = fixedExps.reduce((s, e) => s + Number(e.amount), 0);
  const remaining = ms.budget - spent;
  const pct = ms.budget > 0 ? (spent / ms.budget) * 100 : 0;

  el("incomeDisplay").textContent = fmt(income);
  el("statIncome").textContent = fmt(income);
  el("statSpent").textContent = fmt(spent);
  el("statFixed").textContent = fmt(fixed);
  // الادخار الحقيقي = الدخل − العادية − الثابتة
  el("statSaved").textContent = fmt(Math.max(income - spent - fixed, 0));

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

  renderGoal(income, spent + fixed);
  renderWeeks(ms, exps);
  renderBreakdown(exps, spent);
  renderTxList(exps);
  renderIncomeBreakdown(incs, income);
  renderIncomeList(incs);
  renderRecurring(fixed);
  renderPots();
}

function renderIncomeBreakdown(incs, income) {
  const box = el("incBreakdown");
  const topBox = el("incTopSource");
  if (incs.length === 0) {
    topBox.innerHTML = "";
    box.innerHTML = `<p class="empty">${t("noIncome")}</p>`;
    return;
  }
  const totals = {};
  incs.forEach(i => { totals[i.source] = (totals[i.source] || 0) + Number(i.amount); });
  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  const [topName, topAmt] = rows[0];
  const topPct = income > 0 ? Math.round((topAmt / income) * 100) : 0;
  topBox.innerHTML = `<div class="top-cat inc">${t("topSource", srcLabel(topName), fmt(topAmt), topPct)}</div>`;

  box.innerHTML = rows.map(([src, amt]) => {
    const pct = income > 0 ? (amt / income) * 100 : 0;
    const color = SOURCE_COLORS[src] || "#2bbf8a";
    return `
      <div class="bd-row">
        <div class="bd-top">
          <span>${srcLabel(src)}</span>
          <span class="amt">${fmt(amt)} · ${Math.round(pct)}%</span>
        </div>
        <div class="bd-bar"><div class="bd-fill" style="width:${pct}%;background:${color}"></div></div>
      </div>`;
  }).join("");
}

function renderIncomeList(incs) {
  const list = el("incList");
  el("incCount").textContent = t("incCount", incs.length);
  if (incs.length === 0) {
    list.innerHTML = `<p class="empty">${t("firstIncome")}</p>`;
    return;
  }
  const sorted = [...incs].sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  list.innerHTML = sorted.map(i => {
    const d = i.date.split("-");
    const dateStr = `${Number(d[2])} ${mName(Number(d[1]) - 1)}`;
    return `
      <li class="tx">
        <div class="tx-info">
          <span class="tx-cat">${srcLabel(i.source)}</span>
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
  totalEl.textContent = state.pots.length ? t("potsSum", fmt(total)) : "";

  if (state.pots.length === 0) {
    grid.innerHTML = `<p class="empty">${t("noPots")}</p>`;
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
        ${target > 0 ? `<div class="pot-target">${t("potTarget", fmt(target), Math.round(pct))}</div>
          <div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>` : ""}
        <div class="pot-actions">
          <button class="pot-btn dep" data-dep="${p.id}">+ ${state.lang === "en" ? "Deposit" : "إيداع"}</button>
          <button class="pot-btn wd" data-wd="${p.id}">− ${state.lang === "en" ? "Withdraw" : "سحب"}</button>
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
    msg.textContent = t("goalDefault");
    return;
  }
  const pct = Math.min((saved / goal) * 100, 100);
  fill.style.width = pct + "%";
  if (saved >= goal) {
    msg.className = "goal-msg done";
    msg.textContent = t("goalDone", fmt(goal), fmt(saved));
  } else {
    msg.className = "goal-msg";
    msg.textContent = t("goalProg", fmt(saved), fmt(goal), fmt(goal - saved), Math.round(pct));
  }
}

function renderWeeks(ms, exps) {
  const weeks = weeksOfMonth(viewKey);
  const weeklyCap = ms.budget > 0 ? ms.budget / weeks.length : 0;
  el("weeklyCap").textContent = ms.budget > 0
    ? t("weeklyCap", fmt(weeklyCap))
    : t("setBudgetFirst");

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

    let badgeClass = "badge-ok", badgeText = t("badgeOk"), barClass = "";
    if (weeklyCap > 0) {
      if (wSpent > weeklyCap) { badgeClass = "badge-over"; badgeText = t("badgeOver"); barClass = "over"; }
      else if (pct >= 80) { badgeClass = "badge-warn"; badgeText = t("badgeWarn"); barClass = "warn"; }
    }

    const left = weeklyCap - wSpent;
    let statusText = "";
    if (weeklyCap > 0) {
      statusText = left >= 0 ? t("weekLeft", fmt(left)) : t("weekOver", fmt(Math.abs(left)));
    }

    const div = document.createElement("div");
    div.className = "week" + (isActive ? " active" : "");
    div.innerHTML = `
      <div class="week-title">
        <span>${t("week", w.index)}</span>
        ${weeklyCap > 0 ? `<span class="week-badge ${badgeClass}">${badgeText}</span>` : ""}
      </div>`;
    div.innerHTML += `
      <div class="week-dates">${w.startDay} – ${w.endDay} ${mName(month)}</div>
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
    box.innerHTML = `<p class="empty">${t("noExpenses")}</p>`;
    return;
  }
  const totals = {};
  exps.forEach(e => { totals[e.category] = (totals[e.category] || 0) + Number(e.amount); });
  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  const [topName, topAmt] = rows[0];
  const topPct = spent > 0 ? Math.round((topAmt / spent) * 100) : 0;
  topBox.innerHTML = `<div class="top-cat">${t("topCat", catLabel(topName), fmt(topAmt), topPct)}</div>`;

  box.innerHTML = rows.map(([cat, amt]) => {
    const pct = spent > 0 ? (amt / spent) * 100 : 0;
    const color = CAT_COLORS[cat] || "#b06b8a";
    return `
      <div class="bd-row">
        <div class="bd-top">
          <span>${catLabel(cat)}</span>
          <span class="amt">${fmt(amt)} · ${Math.round(pct)}%</span>
        </div>
        <div class="bd-bar"><div class="bd-fill" style="width:${pct}%;background:${color}"></div></div>
      </div>`;
  }).join("");
}

function renderTxList(exps) {
  const list = el("txList");
  el("txCount").textContent = t("txCount", exps.length);
  if (exps.length === 0) {
    list.innerHTML = `<p class="empty">${t("firstExpense")}</p>`;
    return;
  }
  const sorted = [...exps].sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  list.innerHTML = sorted.map(e => {
    const d = e.date.split("-");
    const dateStr = `${Number(d[2])} ${mName(Number(d[1]) - 1)}`;
    return `
      <li class="tx">
        <div class="tx-info">
          <span class="tx-cat">${catLabel(e.category)}</span>
          <span class="tx-meta">${dateStr}${e.note ? " · " + escapeHtml(e.note) : ""}</span>
        </div>
        <div class="tx-right">
          <span class="tx-amt${e.recurringId ? " rec" : ""}">- ${fmt(e.amount)}</span>
          <button class="tx-del" data-id="${e.id}" title="حذف">✕</button>
        </div>
      </li>`;
  }).join("");
}

function renderRecurring(fixed = 0) {
  const totalEl = el("recTotal");
  if (totalEl) {
    totalEl.textContent = state.recurring.length ? t("recTotal", fmt(fixed)) : "";
  }
  const list = el("recList");
  if (state.recurring.length === 0) {
    list.innerHTML = `<p class="empty">${t("noRecurring")}</p>`;
    return;
  }
  list.innerHTML = state.recurring
    .slice()
    .sort((a, b) => a.day - b.day)
    .map(r => `
      <li class="tx">
        <div class="tx-info">
          <span class="tx-cat">${catLabel(r.category)}${r.note ? " · " + escapeHtml(r.note) : ""}</span>
          <span class="tx-meta">${t("everyMonthDay", r.day)}</span>
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

/* ---------- نافذة داخلية (بديلة عن prompt/confirm) ---------- */
let modalResolve = null;
function askAmount(title, sub = "") {
  return new Promise(resolve => {
    modalResolve = resolve;
    el("modalTitle").textContent = title;
    el("modalSub").textContent = sub;
    const inp = el("modalInput");
    inp.classList.remove("hidden");
    inp.value = "";
    el("modalOk").textContent = t("confirm");
    el("modal").hidden = false;
    setTimeout(() => inp.focus(), 50);
  });
}
function askConfirm(title, sub = "") {
  return new Promise(resolve => {
    modalResolve = resolve;
    el("modalTitle").textContent = title;
    el("modalSub").textContent = sub;
    el("modalInput").classList.add("hidden");
    el("modalOk").textContent = t("confirm");
    el("modal").hidden = false;
  });
}
function closeModal(value) {
  el("modal").hidden = true;
  const r = modalResolve;
  modalResolve = null;
  if (r) r(value);
}
el("modalCancel").addEventListener("click", () => closeModal(null));
el("modalOk").addEventListener("click", () => {
  const inp = el("modalInput");
  if (inp.classList.contains("hidden")) { closeModal(true); return; }
  closeModal(inp.value === "" ? null : Number(inp.value));
});
el("modalInput").addEventListener("keydown", e => {
  if (e.key === "Enter") el("modalOk").click();
});
el("modal").addEventListener("click", e => {
  if (e.target === el("modal")) closeModal(null);
});

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

/* ---------- اللغة ---------- */
el("lang").addEventListener("change", e => setLang(e.target.value));

/* ---------- الأحداث ---------- */
el("saveBudget").addEventListener("click", () => {
  const b = Number(el("monthlyBudget").value);
  if (!(b >= 0)) { toast(t("errNumber"), "error"); return; }
  monthSettings().budget = b;
  save(); render();
  toast(t("tBudgetSaved"));
});

/* ---------- الدخل ---------- */
// إظهار مربّع كتابة المصدر عند اختيار «مصدر آخر»
el("incSource").addEventListener("change", () => {
  const custom = el("incSource").value === CUSTOM_SOURCE;
  el("incCustomWrap").style.display = custom ? "flex" : "none";
  if (custom) el("incCustomSource").focus();
});

el("incomeForm").addEventListener("submit", e => {
  e.preventDefault();
  const amount = Number(el("incAmount").value);
  let source = el("incSource").value;
  const date = el("incDate").value || `${viewKey}-01`;
  const note = el("incNote").value.trim();

  if (!(amount > 0)) { toast(t("errAmount"), "error"); return; }

  // مصدر مكتوب بخط اليد
  if (source === CUSTOM_SOURCE) {
    const custom = el("incCustomSource").value.trim();
    if (!custom) { toast(t("errSource"), "error"); return; }
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
  toast(t("tIncAdded"));
});

el("incList").addEventListener("click", e => {
  const btn = e.target.closest(".inc-del");
  if (!btn) return;
  state.incomes = state.incomes.filter(x => x.id !== btn.dataset.id);
  save(); render();
  toast(t("tIncDeleted"));
});

el("saveGoal").addEventListener("click", () => {
  const g = Number(el("savingsGoal").value);
  if (!(g >= 0)) { toast(t("errNumber"), "error"); return; }
  monthSettings().savingsGoal = g;
  save(); render();
  toast(t("tGoalSaved"));
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

  if (!(amount > 0)) { toast(t("errAmount"), "error"); return; }

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
  // المصاريف العادية فقط (بدون الثابتة) تحسب على الميزانية
  const exps = monthExpenses(key).filter(e => !e.recurringId);
  const spent = exps.reduce((s, e) => s + Number(e.amount), 0);

  if (ms.budget > 0 && spent > ms.budget) {
    toast(t("tOverMonth"), "error");
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
    if (wSpent > weeklyCap) toast(t("tOverWeek", w.index), "error");
    else if (wSpent >= weeklyCap * 0.8) toast(t("tNearWeek", w.index), "warn");
    else toast(t("tExpAdded"));
  } else {
    toast(t("tExpAdded"));
  }
}

el("txList").addEventListener("click", e => {
  const btn = e.target.closest(".tx-del");
  if (!btn) return;
  state.expenses = state.expenses.filter(x => x.id !== btn.dataset.id);
  save(); render();
  toast(t("tExpDeleted"));
});

/* ---------- المصاريف المتكررة ---------- */
el("recurringForm").addEventListener("submit", e => {
  e.preventDefault();
  const amount = Number(el("recAmount").value);
  const category = el("recCategory").value;
  const day = Math.min(Math.max(Number(el("recDay").value) || 1, 1), 31);
  const note = el("recNote").value.trim();

  if (!(amount > 0)) { toast(t("errAmount"), "error"); return; }

  state.recurring.push({ id: uid(), amount, category, day, note });
  save();
  applyRecurring(); // طبّقه فورًا على الشهر الحالي

  el("recAmount").value = "";
  el("recNote").value = "";
  el("recDay").value = "1";
  render();
  toast(t("tRecAdded"));
});

el("recList").addEventListener("click", async e => {
  const btn = e.target.closest(".rec-del");
  if (!btn) return;
  const id = btn.dataset.id;
  const ok = await askConfirm(t("delRecTitle"), t("delRecSub"));
  if (!ok) return;
  state.recurring = state.recurring.filter(r => r.id !== id);
  save(); render();
  toast(t("tRecDeleted"));
});

/* ---------- صناديق الادخار / الاحتياطي ---------- */
el("potForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = el("potName").value.trim();
  const emoji = el("potEmoji").value;
  const target = Number(el("potTarget").value) || 0;
  if (!name) { toast(t("errPotName"), "error"); return; }

  state.pots.push({ id: uid(), name, emoji, target, balance: 0 });
  save();
  el("potName").value = "";
  el("potTarget").value = "";
  render();
  toast(t("tPotAdded"));
});

el("potsGrid").addEventListener("click", async e => {
  const dep = e.target.closest("[data-dep]");
  const wd = e.target.closest("[data-wd]");
  const del = e.target.closest(".pot-del");

  if (del) {
    const p = state.pots.find(x => x.id === del.dataset.id);
    if (!p) return;
    const ok = await askConfirm(t("delPotTitle", p.name), t("delPotSub", fmt(p.balance)));
    if (!ok) return;
    state.pots = state.pots.filter(x => x.id !== del.dataset.id);
    save(); render();
    toast(t("tPotDeleted"));
    return;
  }

  if (dep) {
    const p = state.pots.find(x => x.id === dep.dataset.dep);
    if (!p) return;
    const v = await askAmount(t("depTitle", p.name), t("curBal", fmt(p.balance)));
    if (!(v > 0)) return;
    p.balance = Number(p.balance || 0) + v;
    save(); render();
    if (p.target > 0 && p.balance >= p.target) toast(t("tPotDone", p.name));
    else toast(t("tDep", fmt(v), p.name));
    return;
  }

  if (wd) {
    const p = state.pots.find(x => x.id === wd.dataset.wd);
    if (!p) return;
    const v = await askAmount(t("wdTitle", p.name), t("curBal", fmt(p.balance)));
    if (!(v > 0)) return;
    if (v > Number(p.balance || 0)) { toast(t("errOverBal"), "error"); return; }
    p.balance = Number(p.balance) - v;
    save(); render();
    toast(t("tWd", fmt(v), p.name));
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
    .map(e => [e.date.slice(0, 7), e.date, catLabel(e.category), Number(e.amount), e.note || "", e.recurringId ? t("xlYes") : t("xlNo")]);

  // ورقة الدخل
  const incRows = [...state.incomes]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(i => [i.date.slice(0, 7), i.date, srcLabel(i.source), Number(i.amount), i.note || ""]);

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
  const recRows = state.recurring.map(r => [catLabel(r.category), Number(r.amount) || 0, r.day, r.note || ""]);

  const amt = `${t("amount")} (${cur})`;
  const sheets = [
    xlSheet(t("xlSummary"), [t("xlMonth"), `${t("xlBudget")} (${cur})`, `${t("xlIncome")} (${cur})`, `${t("xlSpent")} (${cur})`, `${t("xlRemaining")} (${cur})`, `${t("xlSaved")} (${cur})`, `${t("xlGoal")} (${cur})`], sumRows),
    xlSheet(t("xlExpenses"), [t("xlMonth"), t("xlDate"), t("xlCategory"), amt, t("xlNote"), t("xlRecurringCol")], expRows),
    xlSheet(t("xlIncome"), [t("xlMonth"), t("xlDate"), t("xlSource"), amt, t("xlNote")], incRows),
    xlSheet(t("xlPots"), [t("xlFund"), `${t("xlBalance")} (${cur})`, `${t("xlTarget")} (${cur})`], potRows),
    xlSheet(t("xlRecurring"), [t("xlCategory"), amt, t("xlDay"), t("xlName")], recRows)
  ].join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${sheets}
</Workbook>`;
}

el("excelBtn").addEventListener("click", () => {
  if (state.expenses.length === 0 && state.incomes.length === 0 && state.pots.length === 0) {
    toast(t("errNoData"), "warn");
    return;
  }
  download(`${t("expensesFile")}.xls`, buildExcel(), "application/vnd.ms-excel");
  toast(t("tExcel"));
});

/* ---------- نسخة احتياطية / استرجاع (JSON) ---------- */
el("backupBtn").addEventListener("click", () => {
  const data = JSON.stringify(state, null, 2);
  const stamp = todayISO();
  download(`${t("backupFile")}-${stamp}.json`, data, "application/json", false);
  toast(t("tBackup"));
});

el("restoreBtn").addEventListener("click", () => el("restoreFile").click());

el("restoreFile").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const obj = JSON.parse(String(reader.result).replace(/^﻿/, ""));
      if (!obj || typeof obj !== "object" || !Array.isArray(obj.expenses)) {
        throw new Error("صيغة غير صحيحة");
      }
      const ok = await askConfirm(t("restoreTitle"), t("restoreSub"));
      if (!ok) { el("restoreFile").value = ""; return; }
      localStorage.setItem(STORE_KEY, JSON.stringify(obj));
      state = load();
      viewKey = monthKeyOf(new Date());
      applyRecurring();
      applyStaticI18n();
      buildSelects();
      render();
      toast(t("tRestored"));
    } catch (err) {
      toast(t("errBadFile"), "error");
    }
    el("restoreFile").value = "";
  };
  reader.readAsText(file);
});

/* ---------- البدء ---------- */
applyRecurring();
applyStaticI18n();
buildSelects();
el("expDate").value = todayISO();
el("incDate").value = todayISO();
render();
