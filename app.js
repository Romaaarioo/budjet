/* =====================================================
   Мои Финансы — логика. Все данные — в localStorage.
   ===================================================== */

const $ = (id) => document.getElementById(id);
const fmt = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });
const money = (n, currency = 'RUB') => new Intl.NumberFormat('ru-RU', { style: 'currency', currency, maximumFractionDigits: currency === 'RUB' ? 0 : 2 }).format(n);
const txCurrency = (t) => t.currency || (accounts.find(a=>a.id===(t.account||t.from))||{}).currency || 'RUB';
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
  localStorage.setItem('fin_budgets', JSON.stringify(budgets));
  localStorage.setItem('fin_goals', JSON.stringify(goals));
  localStorage.setItem('fin_cb_categories', JSON.stringify(cashbackCats));
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
  transfer:'<path d="M4 7h15"/><path d="m15 3 4 4-4 4"/><path d="M20 17H5"/><path d="m9 21-4-4 4-4"/>',
  list:    '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
  pie:     '<path d="M21.2 15.9A10 10 0 1 1 8 2.8"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
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
let cashbackCats = load('fin_cb_categories', null) || ['Всё','Продукты','Аптеки','Кафе и рестораны','Фастфуд','Одежда и обувь','Транспорт','Зоотовары','ЖД','Техника','Кино','Развлечения','Спорттовары','Дом и ремонт','Такси','Цветы','Фитнес','Маркетплейсы','Авиабилеты','Красота','Мед. услуги','Путешествия'].map((name,i)=>({name,icon:['✨','🛒','💊','🍽️','🍔','👕','🚇','🐾','🚆','💻','🎬','🎭','🏋️','🛠️','🚕','💐','🧘','📦','✈️','💄','🩺','🧳'][i]}));
let cbs = load('fin_cashback', []);       // полученный кэшбэк
let budgets = load('fin_budgets', {});    // лимиты: категория → сумма в месяц
let goals = load('fin_goals', []);
const BANKS = [['Альфа',3,'#ef3124','А'],['ВТБ',4,'#00a7e1','ВТБ'],['Озон',4,'#005bff','O'],['Т-Банк',4,'#ffdd2d','Т'],['Сбер',3,'#21a038','С'],['МТС',5,'#e30611','МТС'],['Яндекс',5,'#fc3f1d','Я'],['ОТП',4,'#d71920','ОТП'],['Яндекс ПРО',6,'#fc3f1d','ЯП'],['Апельсин',3,'#ff8c00','А'],['WB',4,'#cb11ab','WB'],['БКС',4,'#172d5c','БКС']];
let cashbackSeeded=false;
cards.forEach(c=>{if(!c.slots)c.slots=[{cat:c.cat||'Всё',pct:c.pct||0}];});
BANKS.forEach(([name,count,color,mark],i)=>{
  let c=cards.find(x=>x.name.toLowerCase()===name.toLowerCase());
  if(!c){c={id:Date.now()+i,name,cat:'Всё',pct:0,slots:[]};cards.push(c);cashbackSeeded=true;}
  if(!c.logo){c.logo={color,mark};cashbackSeeded=true;} else c.logo={color,mark};
  while(c.slots.length<count){c.slots.push({cat:'Всё',pct:0});cashbackSeeded=true;}
});
if(cashbackSeeded||!localStorage.getItem('fin_cb_categories')) {
  localStorage.setItem('fin_cards',JSON.stringify(cards));
  localStorage.setItem('fin_cb_categories',JSON.stringify(cashbackCats));
}
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

// Новые базовые категории добавляются без удаления пользовательских и старых записей.
const DEFAULT_CATS = {
  income: [['Подработка','🧑‍💻'],['Кэшбэк','💸'],['Зарплата','💼'],['Премия','🏆'],['% по НС','🏦'],['Донорство','🩸'],['Другое','✨'],['Подарки','🎁'],['Рефералки','🤝'],['Акции','📈']],
  expense: [['Продукты','🛒'],['Дом','🏠'],['Проезд','🚌'],['Подарки','🎁'],['Вещи','🛍️'],['Аптека','💊'],['Домашний интернет','📶'],['Другое','✨'],['Забота о себе','🧖'],['Здоровье','❤️'],['Кафе и рестики','🍽️'],['Квартира','🏢'],['Комиссии','🧾'],['Коммуналка','💡'],['Кредит','🏦'],['Кредитки','💳'],['Налоги','📑'],['Образование','🎓'],['Одежда','👕'],['Отдых и развлечения','🎭'],['Подписки','🔁'],['Путешествия','✈️'],['Связь','📱'],['Содержанке','💝'],['Спорт','🏋️'],['Такси','🚕'],['Техника','💻'],['Фастфуд','🍔']],
};
const ICON_EMOJI = { food:'🍽️',cart:'🛒',bus:'🚌',home:'🏠',play:'🎬',heart:'❤️',refresh:'🔁',box:'📦',case:'💼',laptop:'💻',gift:'🎁',sparkle:'✨',shirt:'👕',plane:'✈️',cap:'🎓',paw:'🐾',cash:'💵',card:'💳',bank:'🏦',coins:'🪙',trend:'📈',gem:'💎' };
// Миграция: старые эмодзи-иконки → ключи SVG
const E2K = { '🍔':'food','🛒':'cart','🚌':'bus','🏠':'home','🎬':'play','💊':'heart','👕':'shirt','✈️':'plane','🎓':'cap','🐾':'paw','💼':'case','💻':'laptop','🎁':'gift','✨':'sparkle','📦':'box','💳':'card','🔄':'refresh','💵':'cash','🏦':'bank','🪙':'coins','📈':'trend','💎':'gem' };
let migrated = false;
[...cats.expense, ...cats.income, ...accounts].forEach((c) => { if (E2K[c.icon]) { c.icon = E2K[c.icon]; migrated = true; } });
accounts.forEach((a) => { if (!a.currency) { a.currency = 'RUB'; migrated = true; } });
Object.entries(DEFAULT_CATS).forEach(([type, list]) => list.forEach(([name, icon]) => {
  if (!cats[type].some((c) => c.name === name)) { cats[type].push({ name, icon }); migrated = true; }
}));

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

// ---------- Свайп строк: редактирование и удаление ----------
let openSwipe = null;
function closeSwipe(el) {
  delete el.dataset.open;
  el.querySelector('.li, .card').style.transform = 'translateX(0)';
  if (openSwipe === el) openSwipe = null;
}
function bindSwipe(el, actions, onTap) {
  const content = el.querySelector('.li, .card');
  const w = actions.length * 52;

  el.querySelector('.swipe-actions').innerHTML = actions.map((a, i) =>
    `<button class="${a.cls}" data-i="${i}">${svgIcon(a.icon)}</button>`).join('');
  el.querySelectorAll('.swipe-actions button').forEach((b) => (b.onclick = () => {
    if (el.dataset.open) closeSwipe(el);
    actions[+b.dataset.i].cb();
  }));

  let x0 = null, y0 = 0, swiping = false;
  el.addEventListener('touchstart', (e) => {
    if (openSwipe && openSwipe !== el) closeSwipe(openSwipe);
    x0 = e.touches[0].clientX;
    y0 = e.touches[0].clientY;
    swiping = false;
  }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    if (x0 === null) return;
    const dx = e.touches[0].clientX - x0, dy = e.touches[0].clientY - y0;
    if (!swiping && Math.max(Math.abs(dx), Math.abs(dy)) < 10) return;
    if (!swiping && Math.abs(dy) >= Math.abs(dx)) { x0 = null; return; }
    swiping = true;
    content.style.transition = 'none';
    content.style.transform = `translateX(${Math.max((el.dataset.open ? -w : 0) + dx, -w)}px)`;
  }, { passive: true });
  el.addEventListener('touchend', () => {
    if (x0 === null) return;
    if (!swiping) { x0 = null; return; }
    content.style.transition = '';
    const cur = parseFloat(content.style.transform.match(/-?[\d.]+/)) || 0;
    if (cur < -w / 2) { el.dataset.open = '1'; content.style.transform = `translateX(${-w}px)`; openSwipe = el; }
    else closeSwipe(el);
    x0 = null;
    swiping = false;
  });
  el.addEventListener('touchcancel', () => { content.style.transition = ''; closeSwipe(el); x0 = null; swiping = false; });
  content.onclick = () => { if (el.dataset.open) { closeSwipe(el); return; } if (onTap) onTap(); };
}

// ---------- Навигация ----------
function showView(name) {
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + name));
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active',
    t.dataset.view === name || (t.dataset.view === 'more' && ['categories', 'autopays'].includes(name))));
  $('fab').hidden = name !== 'history'; // кнопка «+» только на «Операциях»
  if (openSwipe) closeSwipe(openSwipe);
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
  document.querySelector('meta[name=theme-color]').content = t === 'light' ? '#f2f2f7' : '#151613';
};

const glassBox = $('glass-toggle');
glassBox.checked = localStorage.getItem('fin_glass') !== 'false';
glassBox.onchange = () => {
  document.documentElement.classList.toggle('glass', glassBox.checked);
  localStorage.setItem('fin_glass', glassBox.checked);
};

const DATA_KEYS = ['fin_transactions', 'fin_investments', 'fin_categories', 'fin_autopays', 'fin_accounts', 'fin_cards', 'fin_cashback', 'fin_budgets', 'fin_goals', 'fin_cb_categories'];
$('export-data').onclick = () => {
  const data = { app: 'moi-finansy', exported: new Date().toISOString() };
  DATA_KEYS.forEach((k) => (data[k] = JSON.parse(localStorage.getItem(k) || 'null')));
  const a = document.createElement('a');
  const url = a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = `finansy-${todayISO()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$('import-data').onclick = () => $('import-file').click();
$('import-file').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'moi-finansy') throw new Error('not ours');
    if (!confirm('Заменить все текущие данные данными из файла?')) return;
    DATA_KEYS.forEach((k) => data[k] == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(data[k])));
    location.reload();
  } catch {
    alert('Не удалось прочитать файл. Выбери файл, экспортированный из этого приложения');
  }
};

$('clear-data').onclick = () => {
  if (confirm('Удалить ВСЕ данные? Действие необратимо.')) {
    ['fin_transactions', 'fin_investments', 'fin_categories', 'fin_autopays', 'fin_accounts', 'fin_cards', 'fin_cashback', 'fin_budgets', 'fin_goals', 'fin_cb_categories'].forEach((k) => localStorage.removeItem(k));
    location.reload();
  }
};

// ---------- Автоплатежи: списание при запуске ----------
function runPays() {
  const m = month(), d = new Date().getDate();
  let changed = false;
  for (const p of pays) {
    if (p.lastRun !== m && d >= p.day) {
      const a = accounts.find(x=>x.id===+(p.account||accounts[0]?.id));
      txs.push({ id: Date.now() + Math.random(), type: 'expense', amount: p.amount, category: 'Автоплатёж', note: p.name, date: todayISO(), account: a && a.id, currency: a && a.currency || 'RUB' });
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
let editingBudget = null; // категория редактируемого лимита
let editingGoal = null;
let editingPay = null;
let editingCat = null;

function openModal(kind) {
  ['tx', 'inv', 'cat', 'pay', 'acc', 'card', 'cb', 'budget', 'goal'].forEach((k) => ($(`${k}-form`).hidden = k !== kind));
  modal.classList.add('open');
  document.body.style.overflow = 'hidden'; // фон не скроллится, пока открыто окно
  if (kind === 'tx' && editingTx === null) {
    setSeg($('tx-form'), 'expense');
    $('tx-amount').value = ''; $('tx-note').value = '';
    $('tx-date').value = todayISO(); fillCat(); fillAcc(); syncTxForm();
    $('tx-repeat').hidden = !txs.length;
  }
  if (kind === 'cat' && !editingCat) {
    $('cat-form').querySelector('.h2').textContent = 'Новая категория';
    $('cat-type').hidden = false;
    $('cat-name').value = '';
    setSeg($('cat-form'), 'expense'); pickEmoji($('cat-form'), 'sparkle'); $('cat-emoji').value = '';
  }
  if (kind === 'goal' && !editingGoal) $('goal-form').querySelector('.h2').textContent = 'Цель накоплений';
  if (kind === 'acc') {
    $('acc-start-wrap').hidden = !!editingAcc;
    $('acc-current-wrap').hidden = !editingAcc;
    $('acc-currency').disabled = false;
    if (!editingAcc) $('acc-currency').value = 'RUB';
    pickEmoji($('acc-form'), 'cash'); $('acc-emoji').value = '';
  }
  if (kind === 'cb') { $('cb-date').value = todayISO(); fillCbCards(); }
  if (kind === 'card') {
    fillCbCards();
    $('cb-card-name').parentElement.hidden = !!editingCard;
    $('cb-card-name').required = !editingCard;
    if (!editingCard) $('card-form').querySelector('.h2').textContent = 'Новый банк';
  }
  if (kind === 'pay') {
    $('pay-account').innerHTML = accounts.map((a) => `<option value="${a.id}">${esc(a.name)} · ${a.currency||'RUB'}</option>`).join('');
    if (!editingPay) $('pay-account').value = accounts[0] ? accounts[0].id : '';
    $('pay-account').onchange();
  }
  if (kind === 'budget') {
    $('budget-title').textContent = 'Лимит: ' + editingBudget;
    $('budget-limit').value = budgets[editingBudget] || '';
    $('budget-remove').hidden = !budgets[editingBudget];
  }
}
function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
  document.querySelectorAll('.sheet form').forEach((f) => f.reset());
  editing = null;
  editingTx = null;
  editingAcc = null;
  editingCard = null;
  editingBudget = null;
  editingGoal = null;
  editingPay = null;
  editingCat = null;
  cbSlotIndex = null;
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

// Сегментированные переключатели
function setSeg(form, type) {
  form.dataset.type = type;
  form.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('on', b.dataset.type === type));
}
document.querySelectorAll('.seg').forEach((seg) => (seg.onclick = (e) => {
  const b = e.target.closest('.seg-btn');
  if (!b) return;
  seg.querySelectorAll('.seg-btn').forEach((x) => x.classList.toggle('on', x === b));
  const form = seg.closest('form');
  if (form) { form.dataset.type = b.dataset.type; if (form.id === 'tx-form') { syncTxForm(); if (b.dataset.type !== 'transfer') fillCat(); } }
  else { anMode = b.dataset.mode; renderAnalytics(); }
}));

function fillCat() {
  $('tx-category').innerHTML = cats[$('tx-form').dataset.type]
    .map((c) => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('');
}
function fillAcc() {
  const opts = accounts.map((a) => `<option value="${a.id}">${esc(a.name)} · ${a.currency||'RUB'}</option>`).join('');
  $('tx-account').innerHTML = opts;
  $('tx-from').innerHTML = opts;
  $('tx-to').innerHTML = opts;
}
// Быстрые суммы и повтор последней операции
$('tx-chips').innerHTML = [100, 300, 500, 1000, 5000].map((v) => `<button type="button" data-v="${v}">${v}</button>`).join('');
$('tx-chips').onclick = (e) => {
  const b = e.target.closest('button');
  if (b) $('tx-amount').value = b.dataset.v;
};
$('tx-repeat').onclick = () => {
  const last = [...txs].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)[0];
  setSeg($('tx-form'), last.type);
  fillAcc(); syncTxForm();
  $('tx-amount').value = last.amount;
  if (last.type === 'transfer') { $('tx-from').value = last.from; $('tx-to').value = last.to; $('tx-note').value = last.note || ''; }
  else { fillCat(); $('tx-category').value = last.category; $('tx-account').value = last.account; $('tx-note').value = last.note || ''; }
};

// Показ полей: перевод — «откуда/куда», расход/доход — категория и счёт
function syncTxForm() {
  const tr = $('tx-form').dataset.type === 'transfer';
  $('tx-cat-wrap').hidden = tr;
  $('tx-acc-wrap').hidden = tr;
  $('tx-transfer-wrap').hidden = !tr;
  const acc = accounts.find(a=>a.id===+(tr ? $('tx-from').value : $('tx-account').value));
  $('tx-amount-label').firstChild.textContent = `Сумма · ${acc?.currency||'RUB'}`;
  if (tr && accounts.length > 1 && $('tx-from').value === $('tx-to').value) {
    $('tx-to').value = accounts.find((a) => a.id !== +$('tx-from').value).id;
  }
}
$('tx-account').onchange = syncTxForm;
$('tx-from').onchange = syncTxForm;
function fillCbCards() {
  $('cb-card').innerHTML = cards.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  $('cb-card-cat').innerHTML = cashbackCats.map((c) => `<option value="${esc(c.name)}">${esc(c.icon)} ${esc(c.name)}</option>`).join('');
}

// Выбор иконки (для категорий и счетов)
const CAT_EMOJIS = ['food','cart','bus','home','play','heart','shirt','plane','cap','paw','case','laptop','gift','sparkle','box','card','🍎','🥑','🥩','🥐','🍔','🍕','🍜','☕','🍰','🧋','🚕','🚇','🚲','⛽','🛞','🧹','🛋️','🪴','🔧','🧻','🧴','💊','🩺','🧘','🏋️','⚽','🎮','🎟️','🎨','📚','🎧','📱','⌚','📺','📶','🔌','🧳','🏖️','🏨','🌿','🐶','🐱','👶','💐','💸','🧾','💡','🔑','🧺','🛍️','💝','🤝','🩸','🏆','📑'];
const ACC_EMOJIS = ['cash','card','bank','coins','trend','gem'];
const renderEmojiRow = (el, list) => (el.innerHTML = list.map((k) => `<button type="button" data-k="${esc(k)}">${renderIcon(k)}</button>`).join(''));
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
  const type = $('tx-form').dataset.type;
  let d;
  if (type === 'transfer') {
    const from = +$('tx-from').value, to = +$('tx-to').value;
    if (from === to) { alert('Выбери разные счета'); return; }
    if (accounts.find(a=>a.id===from)?.currency !== accounts.find(a=>a.id===to)?.currency) { alert('Переводы между разными валютами пока недоступны без курса'); return; }
    d = { type, amount: +$('tx-amount').value, from, to, note: $('tx-note').value.trim(), date: $('tx-date').value || todayISO() };
  } else {
    d = {
      type, amount: +$('tx-amount').value,
      category: $('tx-category').value, account: +$('tx-account').value,
      currency: accounts.find(a=>a.id===+$('tx-account').value)?.currency || 'RUB',
      note: $('tx-note').value.trim(), date: $('tx-date').value || todayISO(),
    };
  }
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
  const type = editingCat ? editingCat.type : $('cat-form').dataset.type;
  const oldName = editingCat && editingCat.name;
  const name = $('cat-name').value.trim();
  if (cats[type].some((c) => c.name === name && c.name !== oldName)) { alert('Такая категория уже есть'); return; }
  if (editingCat) {
    const c = cats[type].find((x) => x.name === oldName);
    if (c) { c.name = name; c.icon = $('cat-form').dataset.icon; }
    if (name !== oldName) txs.forEach((t) => { if (t.type === type && t.category === oldName) t.category = name; });
    if (type === 'expense' && name !== oldName) {
      if (budgets[oldName] != null) { budgets[name] = budgets[oldName]; delete budgets[oldName]; }
      cards.forEach((c) => { if (c.cat === oldName) c.cat = name; });
    }
  } else cats[type].push({ icon: $('cat-form').dataset.icon, name });
  save(); renderAll(); closeModal();
};

$('acc-form').onsubmit = (e) => {
  e.preventDefault();
  const d = { name: $('acc-name').value.trim(), icon: $('acc-form').dataset.icon, currency: $('acc-currency').value };
  if (editingAcc) {
    const a = accounts.find((x) => x.id === editingAcc);
    const flow = txs.reduce((s,t) => t.type === 'transfer' ? s + (t.to === a.id ? (t.toAmount ?? t.amount) : t.from === a.id ? -t.amount : 0) : t.account === a.id ? s + (t.type === 'income' ? t.amount : -t.amount) : s, 0);
    a.start = +$('acc-current').value - flow;
    Object.assign(a, d);
  } else accounts.push({ id: Date.now(), ...d, start: +$('acc-start').value || 0, currency: $('acc-currency').value });
  save(); renderAll(); closeModal();
};

$('card-form').onsubmit = (e) => {
  e.preventDefault();
  if (editingCard) {
    const c=cards.find(x=>x.id===editingCard);
    const slot={cat:$('cb-card-cat').value,pct:+$('cb-card-pct').value};
    if(cbSlotIndex==null)c.slots.push(slot);else c.slots[cbSlotIndex]=slot;
  } else cards.push({id:Date.now(),name:$('cb-card-name').value.trim(),logo:{color:'#8b7049',mark:$('cb-card-name').value.trim().slice(0,2).toUpperCase()},cat:$('cb-card-cat').value,pct:+$('cb-card-pct').value,slots:[{cat:$('cb-card-cat').value,pct:+$('cb-card-pct').value}]});
  cbSlotIndex=null;
  save(); renderAll(); closeModal();
};

$('cb-form').onsubmit = (e) => {
  e.preventDefault();
  cbs.push({ id: Date.now(), amount: +$('cb-amount').value, card: +$('cb-card').value, date: $('cb-date').value || todayISO() });
  save(); renderAll(); closeModal();
};

$('budget-form').onsubmit = (e) => {
  e.preventDefault();
  const v = +$('budget-limit').value;
  if (v > 0) budgets[editingBudget] = v; else delete budgets[editingBudget];
  save(); renderAll(); closeModal();
};
$('budget-remove').onclick = () => {
  delete budgets[editingBudget];
  save(); renderAll(); closeModal();
};
$('goal-form').onsubmit = (e) => {
  e.preventDefault();
  const d = {name:$('goal-name').value.trim(),target:+$('goal-target').value,saved:+$('goal-saved').value,date:$('goal-date').value};
  if (editingGoal) Object.assign(goals.find((g) => g.id === editingGoal), d);
  else goals.push({id:Date.now(),...d});
  save(); renderAll(); closeModal();
};
$('pay-form').onsubmit = (e) => {
  e.preventDefault();
  const d = {name:$('pay-name').value.trim(),amount:+$('pay-amount').value,day:+$('pay-day').value,account:+$('pay-account').value};
  if (editingPay) Object.assign(pays.find((p) => p.id == editingPay), d);
  else pays.push({id:Date.now(),...d});
  save(); renderAll(); closeModal();
};
$('pay-account').onchange = () => { $('pay-amount').parentElement.firstChild.textContent = `Сумма · ${(accounts.find(a=>a.id===+$('pay-account').value)||{}).currency||'RUB'}`; };

// ---------- Редактирование ----------
function editTx(id) {
  const t = txs.find((x) => x.id == id);
  editingTx = t.id;
  openModal('tx');
  setSeg($('tx-form'), t.type);
  fillAcc();
  syncTxForm();
  $('tx-amount').value = t.amount;
  if (t.type === 'transfer') {
    $('tx-from').value = t.from;
    $('tx-to').value = t.to;
  } else {
    fillCat();
    $('tx-category').value = t.category;
    $('tx-account').value = t.account || (accounts[0] && accounts[0].id);
  }
  $('tx-note').value = t.note || '';
  $('tx-date').value = t.date;
}

function editAcc(id) {
  const a = accounts.find((x) => x.id === id);
  editingAcc = a.id;
  openModal('acc');
  $('acc-name').value = a.name;
  $('acc-start-wrap').hidden = true;
  $('acc-current-wrap').hidden = false;
  $('acc-current').value = accountBalance(a);
  $('acc-currency').value = a.currency || 'RUB';
  $('acc-currency').disabled = false;
  pickEmoji($('acc-form'), a.icon);
}

function editCard(id) {
  const c = cards.find((x) => x.id === id);
  editingCard = c.id;
  openModal('card');
  fillCbCards();
  $('cb-card-name').parentElement.hidden = true;
  $('card-form').querySelector('.h2').textContent = `Новый слот · ${c.name}`;
  $('cb-card-pct').value = '';
}

function editGoal(id) {
  const g = goals.find((x) => x.id === id);
  if (!g) return;
  editingGoal = g.id;
  openModal('goal');
  $('goal-form').querySelector('.h2').textContent = 'Редактировать цель';
  $('goal-name').value = g.name; $('goal-target').value = g.target;
  $('goal-saved').value = g.saved; $('goal-date').value = g.date || '';
}

function editPay(id) {
  const p = pays.find((x) => x.id == id);
  if (!p) return;
  editingPay = p.id;
  openModal('pay');
  $('pay-name').value = p.name; $('pay-amount').value = p.amount;
  $('pay-day').value = p.day; $('pay-account').value = p.account || (accounts[0] && accounts[0].id);
}

function editCat(type, name) {
  const c = cats[type].find((x) => x.name === name);
  if (!c) return;
  editingCat = {type, name};
  openModal('cat');
  $('cat-form').querySelector('.h2').textContent = 'Редактировать категорию';
  $('cat-type').hidden = true;
  $('cat-name').value = c.name; $('cat-emoji').value = ICONS[c.icon] ? '' : c.icon;
  pickEmoji($('cat-form'), c.icon);
}

// ---------- Рендер: СЧЕТА ----------
let orderingAccounts = false;
function accountBalance(a) {
  return a.start + txs.reduce((s, t) => t.type === 'transfer'
    ? s + (t.to === a.id ? (t.toAmount ?? t.amount) : t.from === a.id ? -t.amount : 0)
    : t.account === a.id ? s + (t.type === 'income' ? t.amount : -t.amount) : s, 0);
}
function renderOverview() {
  const rubAccounts = accounts.filter(a => (a.currency || 'RUB') === 'RUB');
  $('total-balance').textContent = money(rubAccounts.reduce((s,a)=>s+accountBalance(a),0),'RUB');
  $('balance-note').hidden = !accounts.some(a => (a.currency || 'RUB') !== 'RUB');
  $('account-list').classList.toggle('ordering', orderingAccounts);
  $('order-mode').textContent = orderingAccounts ? 'Готово' : 'Изменить порядок';
  $('account-list').innerHTML = accounts.map((a) => {
    const b = accountBalance(a);
    return `
      <div class="swipe" data-account="${a.id}" draggable="${orderingAccounts}">
        <div class="swipe-actions"></div>
        <div class="li tap" data-id="${a.id}">
          <div class="ic">${renderIcon(a.icon)}</div>
          <div class="grow"><div class="name">${esc(a.name)}</div></div>
          <div class="amt ${b >= 0 ? 'in' : 'out'}">${money(b,a.currency)}</div>
          <span class="drag-handle" aria-label="Перетащить счёт">⠿</span>
        </div>
      </div>`;
  }).join('') || '<div class="empty">Счетов нет</div>';

  $('account-list').querySelectorAll('.swipe').forEach((el) => {
    const aid = +el.querySelector('.li').dataset.id;
    const handle=el.querySelector('.drag-handle');
    handle.onpointerdown=(e)=>{
      if(!orderingAccounts)return;
      e.preventDefault(); handle.setPointerCapture(e.pointerId); el.classList.add('dragging');
    };
    handle.onpointermove=(e)=>{
      if(!orderingAccounts||!handle.hasPointerCapture(e.pointerId))return;
      const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('#account-list .swipe');
      if(!target||target===el)return;
      const r=target.getBoundingClientRect();
      target.parentNode.insertBefore(el,e.clientY<r.top+r.height/2?target:target.nextSibling);
    };
    handle.onpointerup=(e)=>{
      if(!handle.hasPointerCapture(e.pointerId))return;
      handle.releasePointerCapture(e.pointerId);
      accounts=[...$('account-list').querySelectorAll('.swipe')].map(x=>accounts.find(a=>a.id===+x.dataset.account));
      save(); renderOverview();
    };
    el.ondragstart = (e) => { if (!orderingAccounts) { e.preventDefault(); return; } e.dataTransfer.setData('text/plain', String(aid)); };
    el.ondragover = (e) => { if (orderingAccounts) e.preventDefault(); };
    el.ondrop = (e) => {
      e.preventDefault();
      const from = accounts.findIndex(a=>a.id===+e.dataTransfer.getData('text/plain')), to = accounts.findIndex(a=>a.id===aid);
      if (from<0||to<0||from===to) return;
      accounts.splice(to,0,accounts.splice(from,1)[0]); save(); renderOverview();
    };
    bindSwipe(el, [
      { icon: 'pencil', cls: 'sw-edit', cb: () => editAcc(aid) },
      { icon: 'trash', cls: 'sw-del', cb: () => deleteAccount(aid) },
    ], () => editAcc(aid));
  });
}
$('order-mode').onclick = () => { orderingAccounts = !orderingAccounts; renderOverview(); };

function deleteAccount(id) {
  const a = accounts.find((x) => x.id === id);
  if (accounts.length === 1) { alert('Должен остаться хотя бы один счёт'); return; }
  if (confirm(`Удалить «${a.name}»? Его операции перейдут на другой счёт.`)) {
    const other = accounts.find((x) => x.id !== id).id;
    txs = txs.filter((t) => t.type !== 'transfer' || (t.from !== id && t.to !== id));
    txs.forEach((t) => { if (t.account === id) t.account = other; });
    pays.forEach((p) => { if (p.account == id) p.account = other; });
    accounts = accounts.filter((x) => x.id !== id);
    save(); renderAll();
  }
}

// ---------- Рендер: АНАЛИТИКА ----------
let anMonth = month();   // отображаемый месяц ГГГГ-ММ
let anMode = 'expense';  // expense | income | net
let anView = 'list';     // list | chart

$('month-prev').onclick = () => shiftMonth(-1);
$('month-next').onclick = () => shiftMonth(1);
$('an-currency').onchange = renderAnalytics;
function shiftMonth(d) {
  const [y, m] = anMonth.split('-').map(Number);
  const dt = new Date(y, m - 1 + d, 1);
  anMonth = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
  renderAnalytics();
}
$('an-view-list').innerHTML = svgIcon('list');
$('an-view-chart').innerHTML = svgIcon('pie');
$('an-view-list').onclick = () => { anView = 'list'; setAnSegUI(); renderAnalytics(); };
$('an-view-chart').onclick = () => { anView = 'chart'; setAnSegUI(); renderAnalytics(); };
function setAnSegUI() {
  $('an-view-list').classList.toggle('on', anView === 'list');
  $('an-view-chart').classList.toggle('on', anView === 'chart');
}

// Круговая диаграмма
function donut(entries, total, currency) {
  const C = ['#9a8769', '#b5a385', '#7e8b76', '#a87669', '#777c72', '#c0b89d', '#8c7965', '#a19a89', '#777f80', '#b28f83'];
  let acc = 0;
  const segs = entries.map(([n, s], i) => {
    const f = (s / total) * 100;
    const seg = `<circle r="15.915" cx="21" cy="21" fill="none" stroke="${C[i % C.length]}" stroke-width="5.5" stroke-dasharray="${f.toFixed(2)} ${(100 - f).toFixed(2)}" stroke-dashoffset="${(25 - acc).toFixed(2)}"/>`;
    acc += f;
    return seg;
  }).join('');
  return `<div class="donut-wrap"><svg viewBox="0 0 42 42" class="donut">${segs}<text x="21" y="24.5" text-anchor="middle" class="donut-t">${money(total,currency)}</text></svg></div>` +
    entries.map(([n, s], i) => `
      <div class="legend">
        <i style="background:${C[i % C.length]}"></i>
        <span class="grow">${esc(n)}</span>
        <span class="legend-v">${Math.round((s / total) * 100)}% · ${money(s,currency)}</span>
      </div>`).join('');
}

function renderAnalytics() {
  const currency = $('an-currency').value;
  const [y, m] = anMonth.split('-').map(Number);
  const MN = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  $('month-label').textContent = `${MN[m - 1]} ${y}`;
  $('month-next').disabled = anMonth >= month();

  let mi = 0, me = 0;
  const byE = {}, byI = {};
  for (const t of txs) {
    if (!t.date.startsWith(anMonth) || t.type === 'transfer' || txCurrency(t) !== currency) continue;
    if (t.type === 'income') { mi += t.amount; byI[t.category] = (byI[t.category] || 0) + t.amount; }
    else { me += t.amount; byE[t.category] = (byE[t.category] || 0) + t.amount; }
  }

  // Бюджеты по категориям
  if (anMode === 'budget') {
    $('an-toggle').style.display = 'none';
    if (currency !== 'RUB') {
      $('an-total-lbl').textContent = 'Лимиты сейчас заданы в рублях';
      $('an-total').textContent = 'Выбери RUB';
      $('an-break').innerHTML = '<div class="empty">Для валютных расходов пока нет автоматического пересчёта бюджета</div>';
      return;
    }
    const totalLimit = Object.values(budgets).reduce((s, v) => s + v, 0);
    const spent = Object.entries(byE).reduce((s, [n, v]) => s + (budgets[n] ? v : 0), 0);
    const left = totalLimit - spent;

    if (!totalLimit) {
      $('an-total-lbl').textContent = 'Бюджеты на месяц';
      $('an-total').textContent = 'Не настроены';
      $('an-total').className = 'big sm';
    } else {
      $('an-total-lbl').textContent = left >= 0 ? 'Осталось от бюджета' : 'Перерасход';
      $('an-total').textContent = money(Math.abs(left), currency);
      $('an-total').className = 'big sm ' + (left >= 0 ? 'in' : 'out');
    }

    const names = [...new Set([...cats.expense.map((c) => c.name), ...Object.keys(byE)])];
    const rows = names.map((n) => ({ n, s: byE[n] || 0, lim: budgets[n] || 0 }))
      .sort((a, b) => (b.lim ? 1 : 0) - (a.lim ? 1 : 0) || b.s - a.s);

    let html = '';
    if (totalLimit) {
      const pct = Math.round((spent / totalLimit) * 100);
      const w = Math.min(100, pct);
      const color = pct >= 100 ? 'var(--red)' : pct >= 80 ? 'var(--acc)' : 'var(--green)';
      const [ay, am] = anMonth.split('-').map(Number);
      const daysIn = new Date(ay, am, 0).getDate();
      const daysLeft = daysIn - new Date().getDate() + 1;
      const perDay = anMonth === month() && left > 0 ? Math.round(left / Math.max(1, daysLeft)) : null;
      html += `<div class="bar"><div class="bar-top"><span>Потрачено <b>${money(spent,currency)}</b> из ${money(totalLimit,currency)}</span><span class="pct">${pct}%</span></div><div class="track"><i style="width:${w}%;background:${color}"></i></div></div>`;
      if (perDay !== null) html += `<div class="budget-hint">Можно тратить <b>${money(perDay,currency)}</b> в день · осталось ${daysLeft} дн.</div>`;
    } else {
      html += '<div class="empty" style="margin-bottom:8px">Нажми на категорию, чтобы задать лимит</div>';
    }

    html += rows.map(({ n, s, lim }) => {
      if (!lim) return `<div class="bar tap-budget" data-cat="${esc(n)}"><div class="bar-top"><span>${catIcon('expense', n)} ${esc(n)}</span><span class="pct">＋ лимит</span></div></div>`;
      const pct = Math.min(100, Math.round((s / lim) * 100));
      const color = pct >= 100 ? 'var(--red)' : pct >= 80 ? 'var(--acc)' : 'var(--green)';
      const rest = lim - s;
      return `<div class="bar tap-budget" data-cat="${esc(n)}"><div class="bar-top"><span>${catIcon('expense', n)} ${esc(n)}</span><span><b>${money(s,currency)}</b> <i class="pct">из ${money(lim,currency)}</i></span></div><div class="track"><i style="width:${pct}%;background:${color}"></i></div><div class="budget-rest ${rest < 0 ? 'out' : ''}">${rest >= 0 ? 'Осталось ' + money(rest,currency) : 'Перерасход ' + money(-rest,currency)}</div></div>`;
    }).join('');

    $('an-break').innerHTML = html;
    $('an-break').querySelectorAll('.tap-budget').forEach((el) => (el.onclick = () => {
      editingBudget = el.dataset.cat;
      openModal('budget');
    }));
    return;
  }

  // «Доходы − расходы»
  if (anMode === 'net') {
    $('an-toggle').style.display = 'none';
    const net = mi - me;
    $('an-total-lbl').textContent = 'Доходы − расходы';
    $('an-total').textContent = (net>=0?'+':'−')+money(Math.abs(net),currency);
    $('an-total').className = 'big sm ' + (net >= 0 ? 'in' : 'out');
    $('an-break').innerHTML = `
      <div class="cols">
        <div><small>Доходы</small><b class="in">${money(mi,currency)}</b></div>
        <div><small>Расходы</small><b class="out">${money(me,currency)}</b></div>
        <div><small>Осталось</small><b>${money(net,currency)}</b></div>
      </div>`;
    return;
  }

  // Расходы или Доходы по категориям
  $('an-toggle').style.display = 'flex';
  const isExp = anMode === 'expense';
  const total = isExp ? me : mi;
  const by = isExp ? byE : byI;
  $('an-total-lbl').textContent = (isExp ? 'Расходы' : 'Доходы') + ' за месяц';
  $('an-total').textContent = money(total,currency);
  $('an-total').className = 'big sm';

  const en = Object.entries(by).sort((a, b) => b[1] - a[1]);
  if (!en.length) { $('an-break').innerHTML = '<div class="empty">Нет данных за этот месяц</div>'; return; }
  $('an-break').innerHTML = anView === 'chart'
     ? donut(en, total, currency)
    : en.map(([n, s]) => `
      <div class="bar">
        <div class="bar-top"><span>${catIcon(isExp ? 'expense' : 'income', n)} ${esc(n)}</span><span><b>${money(s,currency)}</b> <i class="pct">${Math.round((s / total) * 100)}%</i></span></div>
        <div class="track"><i style="width:${Math.round((s / total) * 100)}%"></i></div>
      </div>`).join('');
}

function renderTrend() {
  const months = Array.from({length:6},(_,i)=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-5+i);return d.toISOString().slice(0,7)});
  const currency=$('an-currency').value;
  const vals=months.map(m=>txs.filter(t=>t.date.startsWith(m)&&t.type!=='transfer'&&txCurrency(t)===currency).reduce((a,t)=>{a[t.type==='income'?'inc':'out']+=t.amount;return a},{inc:0,out:0}));
  const max=Math.max(1,...vals.flatMap(v=>[v.inc,v.out]));
  $('an-trend').innerHTML=vals.map((v,i)=>`<div class="trend"><span>${months[i].slice(5)}</span><i style="height:${Math.max(3,v.inc/max*70)}px;background:var(--green)"></i><i style="height:${Math.max(3,v.out/max*70)}px;background:var(--red)"></i></div>`).join('');
  const last=vals[5],prev=vals[4],catsNow={},catsPrev={};
  txs.filter(t=>t.type==='expense'&&txCurrency(t)===currency).forEach(t=>{const m=t.date.slice(0,7),o=m===months[5]?catsNow:m===months[4]?catsPrev:null;if(o)o[t.category]=(o[t.category]||0)+t.amount});
  const n=Object.keys(catsNow).sort((a,b)=>catsNow[b]-catsNow[a])[0];
  $('an-insights').textContent=n&&catsPrev[n]?`${n}: ${Math.round((catsNow[n]/catsPrev[n]-1)*100)}% к прошлому месяцу`:`Доходы ${money(last.inc,currency)}, расходы ${money(last.out,currency)} за месяц`;
}

function renderGoals() {
  $('goal-list').innerHTML = goals.length ? goals.map((g) => `
    <div class="swipe goal-swipe">
      <div class="swipe-actions"></div>
      <div class="card goal" data-id="${g.id}"><b>${esc(g.name)}</b><span>${fmt.format(g.saved)} / ${fmt.format(g.target)}</span><div class="track"><i style="width:${Math.min(100,g.saved/g.target*100)}%"></i></div><small>${g.date ? `К ${formatDate(g.date)}` : `Осталось ${fmt.format(Math.max(0,g.target-g.saved))}`}</small></div>
    </div>`).join('') : '<div class="empty">Пока нет целей</div>';
  $('goal-list').querySelectorAll('.swipe').forEach((el) => {
    const id = +el.querySelector('.goal').dataset.id;
    bindSwipe(el, [
      {icon:'pencil',cls:'sw-edit',cb:()=>editGoal(id)},
      {icon:'trash',cls:'sw-del',cb:()=>{const g=goals.find(x=>x.id===id);if(confirm(`Удалить цель «${g.name}»?`)){goals=goals.filter(x=>x.id!==id);save();renderAll();}}},
    ],()=>editGoal(id));
  });
}

// ---------- Рендер: ОПЕРАЦИИ ----------
let hFilter = 'all';   // all | expense | income | transfer
let hQuery = '';

$('h-search').oninput = (e) => { hQuery = e.target.value.trim().toLowerCase(); renderHistory(); };
$('h-filter').onclick = (e) => {
  const b = e.target.closest('.seg-btn');
  if (!b) return;
  hFilter = b.dataset.f;
  $('h-filter').querySelectorAll('.seg-btn').forEach((x) => x.classList.toggle('on', x === b));
  renderHistory();
};

function renderHistory() {
  const box = $('history-list');
  if (!txs.length) { box.innerHTML = '<div class="empty">Операций нет. Нажми «+», чтобы добавить первую</div>'; $('h-sum').textContent = ''; return; }

  const acc0 = (id) => (accounts.find((a) => a.id === id) || {}).name || '';
  const match = (t) => {
    if (hFilter !== 'all' && t.type !== hFilter) return false;
    if (!hQuery) return true;
    const hay = [t.category, t.note, acc0(t.account), acc0(t.from), acc0(t.to), String(t.amount)].join(' ').toLowerCase();
    return hay.includes(hQuery);
  };
  const shown = txs.filter(match);
  const sumText = (type) => {
    const sums = {};
    shown.filter(t=>t.type===type).forEach(t=>{const c=txCurrency(t);sums[c]=(sums[c]||0)+t.amount});
    return Object.entries(sums).map(([c,v])=>money(v,c)).join(' + ') || money(0);
  };
  $('h-sum').textContent = shown.length
    ? `Найдено ${shown.length}: доходы ${sumText('income')}, расходы ${sumText('expense')}, переводы ${sumText('transfer')}`
    : 'Ничего не найдено';
  if (!shown.length) { box.innerHTML = '<div class="empty">Подходящих операций нет</div>'; return; }

  const sorted = shown.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  let html = '', last = null;
  for (const t of sorted) {
    if (t.date !== last) {
      if (last) html += '</div>';
      html += `<div class="card list"><div class="sec">${formatDate(t.date)}</div>`;
      last = t.date;
    }
    const tr = t.type === 'transfer';
    const from = tr && accounts.find((a) => a.id === t.from);
    const to = tr && accounts.find((a) => a.id === t.to);
    const acc = accounts.find((a) => a.id === t.account);
    const inc = t.type === 'income';
    html += `
      <div class="swipe">
        <div class="swipe-actions"></div>
        <div class="li tap" data-id="${t.id}">
          <div class="ic">${tr ? svgIcon('transfer') : catIcon(t.type, t.category)}</div>
          <div class="grow"><div class="name">${tr ? 'Перевод' : esc(t.category)}</div>${t.note ? `<div class="note">${esc(t.note)}</div>` : ''}${tr ? `<div class="note">${from ? esc(from.name) : '—'} → ${to ? esc(to.name) : '—'}</div>` : acc ? `<div class="note">${esc(acc.name)}</div>` : ''}</div>
          <div class="amt ${tr ? '' : inc ? 'in' : 'out'}">${tr ? '' : inc ? '+' : '−'}${money(t.amount, txCurrency(t))}</div>
        </div>
      </div>`;
  }
  box.innerHTML = html + '</div>';

  box.querySelectorAll('.swipe').forEach((el) => {
    const tid = el.querySelector('.li').dataset.id;
    bindSwipe(el, [
      { icon: 'pencil', cls: 'sw-edit', cb: () => editTx(tid) },
      { icon: 'trash', cls: 'sw-del', cb: () => { if (confirm('Удалить операцию?')) { txs = txs.filter((t) => t.id != tid); save(); renderAll(); } } },
    ], () => editTx(tid));
  });
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
      <div class="swipe inv-swipe">
        <div class="swipe-actions"></div>
        <div class="card inv" data-id="${i.id}">
          <div class="name" style="margin-bottom:10px">${esc(i.name)}</div>
          <div class="cols">
            <div><small>Вложено</small><b>${fmt.format(i.invested)}</b></div>
            <div><small>Сейчас</small><b>${fmt.format(i.current)}</b></div>
            <div><small>Прибыль</small><b class="${pr >= 0 ? 'in' : 'out'}">${fmtSign(pr)} (${pct}%)</b></div>
          </div>
        </div>
      </div>`;
  }).join('');

  box.querySelectorAll('.swipe').forEach((el) => {
    const iid = +el.querySelector('.card').dataset.id;
    bindSwipe(el, [
      { icon: 'pencil', cls: 'sw-edit', cb: () => { editing = iid; openModal('inv'); const i = invs.find((x) => x.id === iid); $('inv-name').value = i.name; $('inv-invested').value = i.invested; $('inv-current').value = i.current; } },
      { icon: 'trash', cls: 'sw-del', cb: () => { const i = invs.find((x) => x.id === iid); if (confirm(`Удалить «${i.name}»?`)) { invs = invs.filter((x) => x.id !== iid); save(); renderAll(); } } },
    ], () => { editing = iid; openModal('inv'); const i = invs.find((x) => x.id === iid); $('inv-name').value = i.name; $('inv-invested').value = i.invested; $('inv-current').value = i.current; });
  });
}

// ---------- Рендер: КЭШБЭК ----------
let cbMode='categories', cbFilter='Всё', cbSlotIndex=null;
document.querySelectorAll('[data-cb-view]').forEach(b=>b.onclick=()=>{
  cbMode=b.dataset.cbView;
  document.querySelectorAll('[data-cb-view]').forEach(x=>x.classList.toggle('on',x===b));
  renderCashback();
});
function renderCashback() {
  const m = month();
  const sumMonth = cbs.filter((c) => c.date.startsWith(m)).reduce((s, c) => s + c.amount, 0);
  const sumAll = cbs.reduce((s, c) => s + c.amount, 0);
  $('cb-month').textContent = fmt.format(sumMonth);
  $('cb-total').textContent = 'Всего: ' + fmt.format(sumAll);
  $('cb-categories').innerHTML=cashbackCats.map(c=>`<button class="cb-chip ${cbFilter===c.name?'on':''}" data-cat="${esc(c.name)}"><span>${esc(c.icon)}</span>${esc(c.name)}</button>`).join('');
  $('cb-categories').onclick=e=>{const b=e.target.closest('[data-cat]');if(b){cbFilter=b.dataset.cat;cbMode='categories';document.querySelectorAll('[data-cb-view]').forEach(x=>x.classList.toggle('on',x.dataset.cbView==='categories'));renderCashback();}};
  $('cb-categories').hidden=cbMode!=='categories';
  $('cb-section-name').textContent=cbMode==='offers'?'Специальные акции':cbMode==='banks'?'Все банки':cbFilter;
  let shown=cards;
  if(cbMode==='categories'&&cbFilter!=='Всё')shown=cards.filter(c=>(c.slots||[]).some(s=>s.cat===cbFilter));
  $('cb-count').textContent=cbMode==='banks'?cards.reduce((s,c)=>s+(c.slots||[]).length,0):shown.length;
  $('card-list').className=`cb-list ${cbMode}`;
  if(cbMode==='offers'){$('card-list').innerHTML='<div class="cb-empty">Специальных акций пока нет</div>';return;}
  $('card-list').innerHTML=shown.map(c=>{
    const slots=c.slots||[{cat:c.cat||'Всё',pct:c.pct||0}];
    const relevant=cbMode==='categories'&&cbFilter!=='Всё'?slots.filter(s=>s.cat===cbFilter):slots;
    const best=relevant.reduce((m,s)=>Math.max(m,+s.pct||0),0);
    const logo=`<span class="cb-logo" style="--brand:${esc(c.logo?.color||'#53627b')}">${esc(c.logo?.mark||c.name.slice(0,2))}</span>`;
    return cbMode==='banks'?`<article class="cb-bank"><div class="cb-bank-head">${logo}<strong>${esc(c.name)}</strong><button class="cb-add-slot" data-bank="${c.id}" aria-label="Добавить слот">＋</button></div><div class="cb-slots">${slots.map((s,i)=>`<button class="cb-slot" data-bank="${c.id}" data-slot="${i}"><span>${esc(s.cat||'Выбрать категорию')}</span><b>${s.pct||0}%</b></button>`).join('')}</div></article>`:`<button class="cb-bank-row" data-bank="${c.id}">${logo}<strong>${esc(c.name)}</strong><b class="cb-rate">${best}%</b></button>`;
  }).join('')||'<div class="cb-empty">Пока нет банков с этой категорией</div>';
  $('card-list').onclick=e=>{const b=e.target.closest('[data-bank]');if(!b)return;const c=cards.find(x=>x.id===+b.dataset.bank);if(!c)return;if(b.dataset.slot!=null){cbSlotIndex=+b.dataset.slot;editingCard=c.id;openModal('card');$('card-form').querySelector('.h2').textContent=`Слот ${cbSlotIndex+1} · ${c.name}`;$('cb-card-cat').value=c.slots[cbSlotIndex].cat;$('cb-card-pct').value=c.slots[cbSlotIndex].pct;return;}if(cbMode==='banks'){cbSlotIndex=null;editingCard=c.id;openModal('card');$('card-form').querySelector('.h2').textContent=`Новый слот · ${c.name}`;return;}cbFilter='Всё';cbMode='banks';document.querySelector('[data-cb-view="banks"]').click();};
}

// ---------- Рендер: КАТЕГОРИИ и АВТОПЛАТЕЖИ ----------
function renderCats() {
  const row = (c, t) => `
    <div class="swipe">
      <div class="swipe-actions"></div>
      <div class="li" data-n="${esc(c.name)}" data-t="${t}">
        <div class="ic">${renderIcon(c.icon)}</div><div class="grow name">${esc(c.name)}</div>
      </div>
    </div>`;
  $('cat-list').innerHTML =
    '<div class="sec">Расходы</div>' + cats.expense.map((c) => row(c, 'expense')).join('') +
    '<div class="sec">Доходы</div>' + cats.income.map((c) => row(c, 'income')).join('');
  $('cat-list').querySelectorAll('.swipe').forEach((el) => {
    const li = el.querySelector('.li'), name = li.dataset.n, type = li.dataset.t;
    bindSwipe(el, [
      { icon: 'pencil', cls: 'sw-edit', cb: () => editCat(type, name) },
      { icon: 'trash', cls: 'sw-del', cb: () => {
        if (!confirm(`Удалить категорию «${name}»? История операций сохранится.`)) return;
        cats[type] = cats[type].filter((c) => c.name !== name);
        if (type === 'expense') {
          delete budgets[name];
          const fallback = cats.expense.find((c) => c.name === 'Другое');
          if (fallback) cards.forEach((c) => { if (c.cat === name) c.cat = fallback.name; });
        }
        save(); renderAll();
      } },
    ], () => editCat(type, name));
  });
}

function renderPays() {
  const now=new Date(), next=p=>{let d=new Date(now.getFullYear(),now.getMonth(),Math.min(p.day,new Date(now.getFullYear(),now.getMonth()+1,0).getDate()));if(d<new Date(now.getFullYear(),now.getMonth(),now.getDate()))d=new Date(now.getFullYear(),now.getMonth()+1,Math.min(p.day,new Date(now.getFullYear(),now.getMonth()+2,0).getDate()));return d};
  const accName = (id) => (accounts.find((a) => a.id === +id) || {}).name || (accounts[0] || {}).name || 'Счёт не выбран';
  const sums={}; pays.forEach(p=>{const c=(accounts.find(a=>a.id==p.account)||accounts[0]||{}).currency||'RUB';sums[c]=(sums[c]||0)+p.amount});
  const upcoming=Object.entries(sums).map(([c,v])=>money(v,c)).join(' + ');
  $('autopay-list').innerHTML = (pays.length?`<div class="sec">В месяц: ${upcoming}</div>`:'')+(pays.length ? [...pays].sort((a,b)=>next(a)-next(b)).map((p) => `
    <div class="swipe">
      <div class="swipe-actions"></div>
      <div class="li" data-id="${p.id}">
        <div class="ic">${svgIcon('refresh')}</div>
        <div class="grow"><div class="name">${esc(p.name)}</div><div class="note">${formatDate(next(p).toISOString().slice(0,10))} · ${money(p.amount,(accounts.find(a=>a.id==p.account)||accounts[0]||{}).currency||'RUB')} · ${esc(accName(p.account))}</div></div>
      </div>
    </div>`).join('') : '<div class="empty">Автоплатежей нет. Нажми «Добавить», чтобы настроить</div>');
  $('autopay-list').querySelectorAll('.swipe').forEach((el) => {
    const pid = el.querySelector('.li').dataset.id;
    bindSwipe(el, [
      { icon: 'pencil', cls: 'sw-edit', cb: () => editPay(pid) },
      { icon: 'trash', cls: 'sw-del', cb: () => { if (confirm('Удалить автоплатёж?')) { pays = pays.filter((p) => p.id != pid); save(); renderAll(); } } },
    ], () => editPay(pid));
  });
}

// ---------- Запуск ----------
$('add-goal').onclick = () => openModal('goal');
$('add-cat').onclick = () => openModal('cat');
$('add-pay').onclick = () => openModal('pay');
$('add-acc').onclick = () => openModal('acc');
$('add-card').onclick = () => openModal('card');
$('add-cb-cat').onclick = () => {
  const name=prompt('Название новой категории кэшбэка');
  if(!name||!name.trim())return;
  const icon=prompt('Эмодзи или значок для категории','✨')||'✨';
  cashbackCats.push({name:name.trim(),icon:icon.trim()||'✨'});
  save();fillCbCards();renderCashback();
};
$('add-cb').onclick = () => {
  if (!cards.length) { alert('Сначала добавь карту'); return; }
  openModal('cb');
};
function renderAll() { renderOverview(); renderAnalytics(); renderTrend(); renderGoals(); renderHistory(); renderInvestments(); renderCashback(); renderCats(); renderPays(); }
runPays();
renderAll();
showView('overview');
