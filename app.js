/* =====================================================
   Мои Финансы — логика. Все данные — в localStorage.
   ===================================================== */

const $ = (id) => document.getElementById(id);
const fmt = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });
const esc = (s) => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML.replace(/"/g, '&quot;'); };
const load = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
const save = () => {
  localStorage.setItem('fin_transactions', JSON.stringify(txs));
  localStorage.setItem('fin_investments', JSON.stringify(invs));
  localStorage.setItem('fin_categories', JSON.stringify(cats));
  localStorage.setItem('fin_autopays', JSON.stringify(pays));
  localStorage.setItem('fin_accounts', JSON.stringify(accounts));
  localStorage.setItem('fin_cards', JSON.stringify(cards));
  localStorage.setItem('fin_cashback', JSON.stringify(cbs));
};

// ---------- SVG-иконки (стиль Lucide) ----------
const ICONS = {
  food:    '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
  cart:    '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h2l2.7 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L22 6H5"/>',
  bus:     '<rect x="4" y="3" width="16" height="13" rx="3"/><path d="M4 10h16"/><path d="M8 21l1.5-3"/><path d="M16 21l-1.5-3"/><path d="M12 3v7"/>',
  home:    '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  play:    '<rect x="3" y="5" width="18" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',
  heart:   '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
  box:     '<path d="M21 8v8l-9 5-9-5V8l9-5z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/>',
  case:    '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  laptop:  '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9"/><path d="M4 16h16l1.3 2.5a1 1 0 0 1-.9 1.5H3.6a1 1 0 0 1-.9-1.5z"/>',
  gift:    '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v9H5v-9"/><path d="M12 8c-1-2.5-2.5-5-4.5-5C5 3 5 8 8 8"/><path d="M12 8c1-2.5 2.5-5 4.5-5C19 3 19 8 16 8"/>',
  sparkle: '<path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"/>',
  shirt:   '<path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.3 2.2l.6 3.5a1 1 0 0 0 1 .8H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.1a1 1 0 0 0 1-.8l.6-3.5a2 2 0 0 0-1.3-2.2z"/>',
  plane:   '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  cap:     '<path d="M22 10 12 5 2 10l10 5z"/><path d="M6 12.5V17c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5"/>',
  paw:     '<circle cx="7" cy="6" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="17" cy="6" r="1.5"/><path d="M12 21c-3 0-5-2-5-4.5 0-2 2-4.5 5-4.5s5 2.5 5 4.5c0 2.5-2 4.5-5 4.5z"/>',
  cash:    '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01"/><path d="M18 12h.01"/>',
  card:    '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/>',
  bank:    '<path d="M3 9.5 12 3l9 6.5"/><path d="M5 10v10"/><path d="M19 10v10"/><path d="M9 10v10"/><path d="M15 10v10"/><path d="M3 20h18"/>',
  coins:   '<circle cx="8" cy="8" r="5.5"/><path d="M14.5 9.5a5.5 5.5 0 1 1-5 9.3"/>',
  trend:   '<path d="M3 17l6-6 4 4 7-7"/><path d="M14 8h6v6"/>',
  gem:     '<path d="M6 3h12l4 6-10 13L2 9z"/><path d="M2 9h20"/><path d="m12 3 3 6-3 13-3-13z"/>',
  pencil:  '<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
  trash:   '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
  tag:     '<path d="M12.6 2.6 21.4 11.4a2 2 0 0 1 0 2.8l-7.2 7.2a2 2 0 0 1-2.8 0L2.6 12.6V4a2 2 0 0 1 2-2z"/><circle cx="7.5" cy="7.5" r="1"/>',
  moon:    '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
};
const svgIcon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.sparkle}</svg>`;
// иконка категории/счёта: ключ → SVG, иначе эмодзи
const renderIcon = (icon) => (ICONS[icon] ? svgIcon(icon) : esc(icon));

// ---------- Данные ----------
let txs = load('fin_transactions', []);   // доходы/расходы
let invs = load('fin_investments', []);   // инвестиции
let pays = load('fin_autopays', []);      // автоплатежи
let accounts = load('fin_accounts', []);  // счета
let cards = load('fin_cards', []);        // карты для кэшбэка
let cbs = load('fin_cashback', []);       // полученный кэшбэк
let cats = load('fin_categories') || {    // категории
  expense: [
    { icon: 'food', name: 'Продукты' }, { icon: 'bus', name: 'Транспорт' },
    { icon: 'home', name: 'Жильё' }, { icon: 'play', name: 'Развлечения' },
    { icon: 'heart', name: 'Здоровье' }, { icon: 'refresh', name: 'Автоплатёж' },
    { icon: 'box', name: 'Другое' },
  ],
  income: [
    { icon: 'case', name: 'Зарплата' }, { icon: 'laptop', name: 'Фриланс' },
    { icon: 'gift', name: 'Подарки' }, { icon: 'sparkle', name: 'Другое' },
  ],
};

// Миграция: старые эмодзи-иконки → ключи SVG
const E2K = { '🍔':'food','🛒':'cart','🚌':'bus','🏠':'home','🎬':'play','💊':'heart','👕':'shirt','✈️':'plane','🎓':'cap','🐾':'paw','💼':'case','💻':'laptop','🎁':'gift','✨':'sparkle','📦':'box','💳':'card','🔄':'refresh','💵':'cash','🏦':'bank','🪙':'coins','📈':'trend','💎':'gem' };
let migrated = false;
[...cats.expense, ...cats.income, ...accounts].forEach((c) => { if (E2K[c.icon]) { c.icon = E2K[c.icon]; migrated = true; } });

// Счета: при первом запуске создаём два счёта и привязываем к первому все операции без счёта
if (!accounts.length) {
  accounts = [
    { id: 1, name: 'Наличные', icon: 'cash', start: 0 },
    { id: 2, name: 'Карта', icon: 'card', start: 0 },
  ];
  txs.forEach((t) => (t.account = 1));
  migrated = true;
}
if (migrated || !localStorage.getItem('fin_categories')) save();

// ---------- Утилиты ----------
const fmtSign = (n) => (n >= 0 ? '+' : '−') + fmt.format(Math.abs(n));
const todayISO = () => new Date().toISOString().slice(0, 10);
const month = () => todayISO().slice(0, 7);
const catIcon = (type, name) => {
  const c = cats[type].find((x) => x.name === name);
  return c ? renderIcon(c.icon) : svgIcon('sparkle');
};

function formatDate(iso) {
  if (iso === todayISO()) return 'Сегодня';
  const [y, m, d] = iso.split('-').map(Number);
  const M = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  return `${d} ${M[m - 1]}` + (y !== new Date().getFullYear() ? ` ${y}` : '');
}

// ---------- Навигация ----------
function showView(name) {
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + name));
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active',
    t.dataset.view === name || (t.dataset.view === 'more' && ['categories', 'autopays'].includes(name))));
  $('fab').hidden = name !== 'history'; // кнопка «+» только на «Операциях»
}
document.querySelectorAll('.tab').forEach((t) => (t.onclick = () => showView(t.dataset.view)));
document.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => showView(b.dataset.go)));

// ---------- Тема и очистка данных ----------
const themeBox = $('theme-toggle');
themeBox.checked = document.documentElement.dataset.theme === 'dark';
themeBox.onchange = () => {
  const t = themeBox.checked ? 'dark' : 'light';
  document.documentElement.dataset.theme = t;
  localStorage.setItem('fin_theme', t);
  document.querySelector('meta[name=theme-color]').content = t === 'light' ? '#f2f2f7' : '#000000';
};

const glassBox = $('glass-toggle');
glassBox.checked = localStorage.getItem('fin_glass') !== 'false';
glassBox.onchange = () => {
  document.documentElement.classList.toggle('glass', glassBox.checked);
  localStorage.setItem('fin_glass', glassBox.checked);
};

$('clear-data').onclick = () => {
  if (confirm('Удалить ВСЕ данные? Действие необратимо.')) {
    ['fin_transactions', 'fin_investments', 'fin_categories', 'fin_autopays', 'fin_accounts', 'fin_cards', 'fin_cashback'].forEach((k) => localStorage.removeItem(k));
    location.reload();
  }
};

// ---------- Автоплатежи: списание при запуске ----------
function runPays() {
  const m = month(), d = new Date().getDate();
  let changed = false;
  for (const p of pays) {
    if (p.lastRun !== m && d >= p.day) {
      txs.push({ id: Date.now() + Math.random(), type: 'expense', amount: p.amount, category: 'Автоплатёж', note: p.name, date: todayISO(), account: accounts[0] && accounts[0].id });
      p.lastRun = m;
      changed = true;
    }
  }
  if (changed) save();
}

// ---------- Модальное окно ----------
const modal = $('modal');
let editing = null;      // id редактируемой инвестиции
let editingTx = null;    // id редактируемой операции
let editingAcc = null;   // id редактируемого счёта
let editingCard = null;  // id редактируемой карты

function openModal(kind) {
  ['tx', 'inv', 'cat', 'pay', 'acc', 'card', 'cb'].forEach((k) => ($(`${k}-form`).hidden = k !== kind));
  modal.classList.add('open');
  document.body.style.overflow = 'hidden'; // фон не скроллится, пока открыто окно
  if (kind === 'tx' && editingTx === null) { $('tx-date').value = todayISO(); fillCat(); fillAcc(); }
  if (kind === 'cat') { setSeg($('cat-form'), 'expense'); pickEmoji($('cat-form'), 'sparkle'); $('cat-emoji').value = ''; }
  if (kind === 'acc') { pickEmoji($('acc-form'), 'cash'); $('acc-emoji').value = ''; }
  if (kind === 'cb') { $('cb-date').value = todayISO(); fillCbCards(); }
  if (kind === 'card') fillCbCards();
}
function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
  document.querySelectorAll('.sheet form').forEach((f) => f.reset());
  editing = null;
  editingTx = null;
  editingAcc = null;
  editingCard = null;
}
$('fab').onclick = () => openModal('tx');
modal.onclick = (e) => { if (e.target === modal) closeModal(); };
document.querySelectorAll('.cancel').forEach((b) => (b.onclick = closeModal));

// Шторка: закрытие перетягиванием вниз (за верхнюю часть окна)
const sheetEl = document.querySelector('.sheet');
let dragY = null, lastDy = 0;
sheetEl.addEventListener('touchstart', (e) => {
  lastDy = 0;
  if (e.touches[0].clientY - sheetEl.getBoundingClientRect().top > 56) { dragY = null; return; }
  dragY = e.touches[0].clientY;
  sheetEl.style.transition = 'none';
}, { passive: true });
sheetEl.addEventListener('touchmove', (e) => {
  if (dragY === null) return;
  e.preventDefault();
  lastDy = Math.max(0, e.touches[0].clientY - dragY);
  sheetEl.style.transform = `translateY(${lastDy}px)`;
}, { passive: false });
sheetEl.addEventListener('touchend', () => {
  if (dragY === null) return;
  sheetEl.style.transition = '';
  sheetEl.style.transform = '';
  if (lastDy > 100) closeModal();
  dragY = null;
});

// Сегментированные переключатели Расход/Доход (в формах)
function setSeg(form, type) {
  form.dataset.type = type;
  form.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('on', b.dataset.type === type));
}

function fillCat() {
  $('tx-category').innerHTML = cats[$('tx-form').dataset.type]
    .map((c) => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('');
}
function fillAcc() {
  $('tx-account').innerHTML = accounts
    .map((a) => `<option value="${a.id}">${esc(a.name)}</option>`).join('');
}
function fillCbCards() {
  $('cb-card').innerHTML = cards.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  $('cb-card-cat').innerHTML = cats.expense.map((c) => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('');
}

// Выбор иконки (для категорий и счетов)
const CAT_EMOJIS = ['food','cart','bus','home','play','heart','shirt','plane','cap','paw','case','laptop','gift','sparkle','box','card'];
const ACC_EMOJIS = ['cash','card','bank','coins','trend','gem'];
const renderEmojiRow = (el, list) => (el.innerHTML = list.map((k) => `<button type="button" data-k="${k}">${svgIcon(k)}</button>`).join(''));
renderEmojiRow($('emoji-row'), CAT_EMOJIS);
renderEmojiRow($('acc-emoji-row'), ACC_EMOJIS);

function pickEmoji(form, k) {
  form.dataset.icon = k;
  form.querySelectorAll('.emoji-row button').forEach((b) => b.classList.toggle('on', b.dataset.k === k));
}
document.querySelectorAll('.emoji-row').forEach((row) => (row.onclick = (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  pickEmoji(row.closest('form'), b.dataset.k);
  row.closest('form').querySelector('.emoji-input').value = '';
}));
document.querySelectorAll('.emoji-input').forEach((inp) => (inp.oninput = (e) => {
  const v = e.target.value.trim();
  if (v) pickEmoji(inp.closest('form'), v);
}));

// ---------- Сохранение форм ----------
$('tx-form').onsubmit = (e) => {
  e.preventDefault();
  const d = {
    type: $('tx-form').dataset.type, amount: +$('tx-amount').value,
    category: $('tx-category').value, account: +$('tx-account').value,
    note: $('tx-note').value.trim(), date: $('tx-date').value || todayISO(),
  };
  if (editingTx) Object.assign(txs.find((t) => t.id === editingTx), d);
  else txs.push({ id: Date.now(), ...d });
  save(); renderAll(); closeModal();
};

$('inv-form').onsubmit = (e) => {
  e.preventDefault();
  const d = { name: $('inv-name').value.trim(), invested: +$('inv-invested').value, current: +$('inv-current').value };
  editing ? Object.assign(invs.find((i) => i.id === editing), d) : invs.push({ id: Date.now(), ...d });
  save(); renderAll(); closeModal();
};

$('cat-form').onsubmit = (e) => {
  e.preventDefault();
  cats[$('cat-form').dataset.type].push({ icon: $('cat-form').dataset.icon, name: $('cat-name').value.trim() });
  save(); renderAll(); closeModal();
};

$('acc-form').onsubmit = (e) => {
  e.preventDefault();
  const d = { name: $('acc-name').value.trim(), start: +$('acc-start').value || 0, icon: $('acc-form').dataset.icon };
  if (editingAcc) Object.assign(accounts.find((a) => a.id === editingAcc), d);
  else accounts.push({ id: Date.now(), ...d });
  save(); renderAll(); closeModal();
};

$('card-form').onsubmit = (e) => {
  e.preventDefault();
  const d = { name: $('cb-card-name').value.trim(), cat: $('cb-card-cat').value, pct: +$('cb-card-pct').value };
  if (editingCard) Object.assign(cards.find((c) => c.id === editingCard), d);
  else cards.push({ id: Date.now(), ...d });
  save(); renderAll(); closeModal();
};

$('cb-form').onsubmit = (e) => {
  e.preventDefault();
  cbs.push({ id: Date.now(), amount: +$('cb-amount').value, card: +$('cb-card').value, date: $('cb-date').value || todayISO() });
  save(); renderAll(); closeModal();
};

// ---------- Редактирование ----------
function editTx(id) {
  const t = txs.find((x) => x.id == id);
  editingTx = t.id;
  openModal('tx');
  setSeg($('tx-form'), t.type);
  fillCat();
  fillAcc();
  $('tx-amount').value = t.amount;
  $('tx-category').value = t.category;
  $('tx-account').value = t.account || (accounts[0] && accounts[0].id);
  $('tx-note').value = t.note || '';
  $('tx-date').value = t.date;
}

function editAcc(id) {
  const a = accounts.find((x) => x.id === id);
  editingAcc = a.id;
  openModal('acc');
  $('acc-name').value = a.name;
  $('acc-start').value = a.start;
  pickEmoji($('acc-form'), a.icon);
}

function editCard(id) {
  const c = cards.find((x) => x.id === id);
  editingCard = c.id;
  openModal('card');
  fillCbCards();
  $('cb-card-name').value = c.name;
  $('cb-card-cat').value = c.cat;
  $('cb-card-pct').value = c.pct;
}

// ---------- Рендер: СЧЕТА ----------
function renderOverview() {
  $('total-balance').textContent = fmt.format(
    accounts.reduce((s, a) => s + a.start, 0) +
    txs.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
  );

  const bal = (a) => a.start + txs.reduce((s, t) => t.account === a.id ? s + (t.type === 'income' ? t.amount : -t.amount) : s, 0);
  $('account-list').innerHTML = accounts.map((a) => {
    const b = bal(a);
    return `
      <div class="li tap" data-id="${a.id}">
        <div class="ic">${renderIcon(a.icon)}</div>
        <div class="grow"><div class="name">${esc(a.name)}</div><div class="note">Баланс счёта</div></div>
        <div class="amt ${b >= 0 ? 'in' : 'out'}">${fmt.format(b)}</div>
        <button class="del" data-id="${a.id}">✕</button>
      </div>`;
  }).join('') || '<div class="empty">Счетов нет</div>';

  $('account-list').querySelectorAll('.del').forEach((bEl) => (bEl.onclick = (e) => {
    e.stopPropagation();
    const a = accounts.find((x) => x.id === +bEl.dataset.id);
    if (accounts.length === 1) { alert('Должен остаться хотя бы один счёт'); return; }
    if (confirm(`Удалить «${a.name}»? Его операции перейдут на другой счёт.`)) {
      const other = accounts.find((x) => x.id !== a.id).id;
      txs.forEach((t) => { if (t.account === a.id) t.account = other; });
      accounts = accounts.filter((x) => x.id !== a.id);
      save(); renderAll();
    }
  }));
  $('account-list').querySelectorAll('.li.tap').forEach((row) => (row.onclick = (e) => {
    if (e.target.closest('.del')) return;
    editAcc(+row.dataset.id);
  }));
}

// ---------- Рендер: АНАЛИТИКА ----------
let anMonth = month();   // отображаемый месяц ГГГГ-ММ
let anMode = 'expense';  // expense | income | net

document.querySelectorAll('.seg').forEach((seg) => (seg.onclick = (e) => {
  const b = e.target.closest('.seg-btn');
  if (!b) return;
  seg.querySelectorAll('.seg-btn').forEach((x) => x.classList.toggle('on', x === b));
  const form = seg.closest('form');
  if (form) { form.dataset.type = b.dataset.type; if (form.id === 'tx-form') fillCat(); }
  else { anMode = b.dataset.mode; renderAnalytics(); }
}));
$('month-prev').onclick = () => { shiftMonth(-1); };
$('month-next').onclick = () => { shiftMonth(1); };
function shiftMonth(d) {
  const [y, m] = anMonth.split('-').map(Number);
  const dt = new Date(y, m - 1 + d, 1);
  anMonth = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
  renderAnalytics();
}

function renderAnalytics() {
  const [y, m] = anMonth.split('-').map(Number);
  const MN = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  $('month-label').textContent = `${MN[m - 1]} ${y}`;
  $('month-next').disabled = anMonth >= month();

  let mi = 0, me = 0;
  const byE = {}, byI = {};
  for (const t of txs) {
    if (!t.date.startsWith(anMonth)) continue;
    if (t.type === 'income') { mi += t.amount; byI[t.category] = (byI[t.category] || 0) + t.amount; }
    else { me += t.amount; byE[t.category] = (byE[t.category] || 0) + t.amount; }
  }

  // «Доходы − расходы»
  if (anMode === 'net') {
    const net = mi - me;
    $('an-total-lbl').textContent = 'Доходы − расходы';
    $('an-total').textContent = fmtSign(net);
    $('an-total').className = 'big sm ' + (net >= 0 ? 'in' : 'out');
    $('an-break').innerHTML = `
      <div class="cols">
        <div><small>Доходы</small><b class="in">${fmt.format(mi)}</b></div>
        <div><small>Расходы</small><b class="out">${fmt.format(me)}</b></div>
        <div><small>Осталось</small><b>${fmt.format(net)}</b></div>
      </div>`;
    return;
  }

  // Расходы или Доходы по категориям
  const isExp = anMode === 'expense';
  const total = isExp ? me : mi;
  const by = isExp ? byE : byI;
  $('an-total-lbl').textContent = (isExp ? 'Расходы' : 'Доходы') + ' за месяц';
  $('an-total').textContent = fmt.format(total);
  $('an-total').className = 'big sm';

  const en = Object.entries(by).sort((a, b) => b[1] - a[1]);
  $('an-break').innerHTML = en.length ? en.map(([n, s]) => `
    <div class="bar">
      <div class="bar-top"><span>${catIcon(isExp ? 'expense' : 'income', n)} ${esc(n)}</span><span><b>${fmt.format(s)}</b> <i class="pct">${Math.round((s / total) * 100)}%</i></span></div>
      <div class="track"><i style="width:${Math.round((s / total) * 100)}%"></i></div>
    </div>`).join('') : '<div class="empty">Нет данных за этот месяц</div>';
}

// ---------- Рендер: ОПЕРАЦИИ ----------
function renderHistory() {
  const box = $('history-list');
  if (!txs.length) { box.innerHTML = '<div class="empty">Операций нет. Нажми «+», чтобы добавить первую</div>'; return; }

  const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  let html = '', last = null;
  for (const t of sorted) {
    if (t.date !== last) {
      if (last) html += '</div>';
      html += `<div class="card list"><div class="sec">${formatDate(t.date)}</div>`;
      last = t.date;
    }
    const inc = t.type === 'income';
    const acc = accounts.find((a) => a.id === t.account);
    html += `
      <div class="li tap" data-id="${t.id}">
        <div class="ic">${catIcon(t.type, t.category)}</div>
        <div class="grow"><div class="name">${esc(t.category)}</div>${t.note ? `<div class="note">${esc(t.note)}</div>` : ''}${acc ? `<div class="note">${esc(acc.name)}</div>` : ''}</div>
        <div class="amt ${inc ? 'in' : 'out'}">${inc ? '+' : '−'}${fmt.format(t.amount)}</div>
        <button class="del" data-id="${t.id}">✕</button>
      </div>`;
  }
  box.innerHTML = html + '</div>';

  box.querySelectorAll('.del').forEach((b) => (b.onclick = (e) => {
    e.stopPropagation();
    if (confirm('Удалить операцию?')) { txs = txs.filter((t) => t.id != b.dataset.id); save(); renderAll(); }
  }));
  box.querySelectorAll('.li.tap').forEach((row) => (row.onclick = (e) => {
    if (e.target.closest('.del')) return;
    editTx(row.dataset.id);
  }));
}

// ---------- Рендер: ИНВЕСТИЦИИ ----------
function renderInvestments() {
  const box = $('invest-list');

  // Сводка
  const si = invs.reduce((s, i) => s + i.invested, 0);
  const sc = invs.reduce((s, i) => s + i.current, 0);
  const pr = sc - si;
  $('invest-summary').innerHTML = invs.length ? `
    <div class="cols">
      <div><small>Вложено</small><b>${fmt.format(si)}</b></div>
      <div><small>Сейчас</small><b>${fmt.format(sc)}</b></div>
      <div><small>Прибыль</small><b class="${pr >= 0 ? 'in' : 'out'}">${fmtSign(pr)} (${si ? ((pr / si) * 100).toFixed(1) : 0}%)</b></div>
    </div>` : '<div class="empty">Нет инвестиций</div>';

  if (!invs.length) { box.innerHTML = '<div class="empty">Инвестиций нет. Нажми «+», чтобы добавить</div>'; return; }

  box.innerHTML = invs.map((i) => {
    const pr = i.current - i.invested, pct = i.invested ? ((pr / i.invested) * 100).toFixed(1) : 0;
    return `
      <div class="card">
        <div class="bar-top" style="margin-bottom:10px"><b style="font-size:16px">${esc(i.name)}</b><span>
          <button class="del" data-a="edit" data-id="${i.id}">${svgIcon('pencil')}</button><button class="del" data-a="del" data-id="${i.id}">${svgIcon('trash')}</button></span></div>
        <div class="cols">
          <div><small>Вложено</small><b>${fmt.format(i.invested)}</b></div>
          <div><small>Сейчас</small><b>${fmt.format(i.current)}</b></div>
          <div><small>Прибыль</small><b class="${pr >= 0 ? 'in' : 'out'}">${fmtSign(pr)} (${pct}%)</b></div>
        </div>
      </div>`;
  }).join('');

  box.querySelectorAll('.del').forEach((b) => (b.onclick = () => {
    const i = invs.find((x) => x.id === +b.dataset.id);
    if (b.dataset.a === 'del') {
      if (confirm(`Удалить «${i.name}»?`)) { invs = invs.filter((x) => x.id !== i.id); save(); renderAll(); }
    } else {
      editing = i.id;
      openModal('inv');
      $('inv-name').value = i.name; $('inv-invested').value = i.invested; $('inv-current').value = i.current;
    }
  }));
}

// ---------- Рендер: КЭШБЭК ----------
function renderCashback() {
  const m = month();
  const sumMonth = cbs.filter((c) => c.date.startsWith(m)).reduce((s, c) => s + c.amount, 0);
  const sumAll = cbs.reduce((s, c) => s + c.amount, 0);
  $('cb-month').textContent = fmt.format(sumMonth);
  $('cb-total').textContent = 'Всего: ' + fmt.format(sumAll);

  $('card-list').innerHTML = cards.length ? cards.map((c) => `
    <div class="li tap" data-id="${c.id}">
      <div class="ic">${svgIcon('card')}</div>
      <div class="grow"><div class="name">${esc(c.name)}</div><div class="note">${c.pct}% · ${esc(c.cat)}</div></div>
      <button class="del" data-id="${c.id}">✕</button>
    </div>`).join('') : '<div class="empty">Карт нет. Добавь карту и её категорию кэшбэка</div>';

  $('card-list').querySelectorAll('.del').forEach((b) => (b.onclick = (e) => {
    e.stopPropagation();
    if (confirm('Удалить карту из списка?')) { cards = cards.filter((c) => c.id !== +b.dataset.id); save(); renderAll(); }
  }));
  $('card-list').querySelectorAll('.li.tap').forEach((row) => (row.onclick = (e) => {
    if (e.target.closest('.del')) return;
    editCard(+row.dataset.id);
  }));
}

// ---------- Рендер: КАТЕГОРИИ и АВТОПЛАТЕЖИ ----------
function renderCats() {
  const row = (c, t) => `
    <div class="li">
      <div class="ic">${renderIcon(c.icon)}</div><div class="grow name">${esc(c.name)}</div>
      <button class="del" data-t="${t}" data-n="${esc(c.name)}">✕</button>
    </div>`;
  $('cat-list').innerHTML =
    '<div class="sec">Расходы</div>' + cats.expense.map((c) => row(c, 'expense')).join('') +
    '<div class="sec">Доходы</div>' + cats.income.map((c) => row(c, 'income')).join('');
  $('cat-list').querySelectorAll('.del').forEach((b) => (b.onclick = () => {
    cats[b.dataset.t] = cats[b.dataset.t].filter((c) => c.name !== b.dataset.n);
    save(); renderAll();
  }));
}

function renderPays() {
  $('autopay-list').innerHTML = pays.length ? pays.map((p) => `
    <div class="li">
      <div class="ic">${svgIcon('refresh')}</div>
      <div class="grow"><div class="name">${esc(p.name)}</div><div class="note">${p.day}-го числа · ${fmt.format(p.amount)}</div></div>
      <button class="del" data-id="${p.id}">✕</button>
    </div>`).join('') : '<div class="empty">Автоплатежей нет. Нажми «Добавить», чтобы настроить</div>';
  $('autopay-list').querySelectorAll('.del').forEach((b) => (b.onclick = () => {
    if (confirm('Удалить автоплатёж?')) { pays = pays.filter((p) => p.id != b.dataset.id); save(); renderAll(); }
  }));
}

// ---------- Запуск ----------
$('add-cat').onclick = () => openModal('cat');
$('add-pay').onclick = () => openModal('pay');
$('add-acc').onclick = () => openModal('acc');
$('add-card').onclick = () => openModal('card');
$('add-cb').onclick = () => {
  if (!cards.length) { alert('Сначала добавь карту'); return; }
  openModal('cb');
};
function renderAll() { renderOverview(); renderAnalytics(); renderHistory(); renderInvestments(); renderCashback(); renderCats(); renderPays(); }
runPays();
renderAll();
showView('overview');
