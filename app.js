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
};

let txs = load('fin_transactions', []);   // доходы/расходы
let invs = load('fin_investments', []);   // инвестиции
let pays = load('fin_autopays', []);      // автоплатежи
let cats = load('fin_categories') || {    // категории
  expense: [
    { icon: '🍔', name: 'Продукты' }, { icon: '🚌', name: 'Транспорт' },
    { icon: '🏠', name: 'Жильё' }, { icon: '🎬', name: 'Развлечения' },
    { icon: '💊', name: 'Здоровье' }, { icon: '🔄', name: 'Автоплатёж' },
    { icon: '📦', name: 'Другое' },
  ],
  income: [
    { icon: '💼', name: 'Зарплата' }, { icon: '💻', name: 'Фриланс' },
    { icon: '🎁', name: 'Подарки' }, { icon: '✨', name: 'Другое' },
  ],
};
if (!localStorage.getItem('fin_categories')) save();

// ---------- Утилиты ----------
const fmtSign = (n) => (n >= 0 ? '+' : '−') + fmt.format(Math.abs(n));
const todayISO = () => new Date().toISOString().slice(0, 10);
const month = () => todayISO().slice(0, 7);
const icon = (type, name) => (cats[type].find((c) => c.name === name) || {}).icon || '🏷️';

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
  $('fab').hidden = name === 'more';
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

$('clear-data').onclick = () => {
  if (confirm('Удалить ВСЕ данные? Действие необратимо.')) { localStorage.clear(); location.reload(); }
};

// ---------- Автоплатежи: списание при запуске ----------
function runPays() {
  const m = month(), d = new Date().getDate();
  let changed = false;
  for (const p of pays) {
    if (p.lastRun !== m && d >= p.day) {
      txs.push({ id: Date.now() + Math.random(), type: 'expense', amount: p.amount, category: 'Автоплатёж', note: p.name, date: todayISO() });
      p.lastRun = m;
      changed = true;
    }
  }
  if (changed) save();
}

// ---------- Модальное окно ----------
const modal = $('modal');
let editing = null; // id редактируемой инвестиции

function openModal(kind) {
  ['tx', 'inv', 'cat', 'pay'].forEach((k) => ($(`${k}-form`).hidden = k !== kind));
  modal.classList.add('open');
  if (kind === 'tx') { $('tx-date').value = todayISO(); fillCat(); }
  if (kind === 'cat') { setSeg($('cat-form'), 'expense'); pickEmoji('🍔'); }
}
function closeModal() {
  modal.classList.remove('open');
  document.querySelectorAll('.sheet form').forEach((f) => f.reset());
  editing = null;
}
$('fab').onclick = () => {
  const v = document.querySelector('.view.active').id.slice(5);
  openModal({ overview: 'tx', history: 'tx', investments: 'inv', categories: 'cat', autopays: 'pay' }[v]);
};
modal.onclick = (e) => { if (e.target === modal) closeModal(); };
document.querySelectorAll('.cancel').forEach((b) => (b.onclick = closeModal));

// Сегментированные переключатели Расход/Доход
function setSeg(form, type) {
  form.dataset.type = type;
  form.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('on', b.dataset.type === type));
}
document.querySelectorAll('.seg').forEach((seg) => (seg.onclick = (e) => {
  const b = e.target.closest('.seg-btn');
  if (!b) return;
  setSeg(seg.closest('form'), b.dataset.type);
  if (seg.closest('form').id === 'tx-form') fillCat();
}));

function fillCat() {
  $('tx-category').innerHTML = cats[$('tx-form').dataset.type]
    .map((c) => `<option value="${esc(c.name)}">${c.icon} ${esc(c.name)}</option>`).join('');
}

// Выбор иконки категории
const EMOJIS = ['🍔','🛒','🚌','🏠','🎬','💊','👕','✈️','🎓','🐾','💼','💻','🎁','✨','📦','💳'];
$('emoji-row').innerHTML = EMOJIS.map((e) => `<button type="button">${e}</button>`).join('');
function pickEmoji(e) {
  $('cat-form').dataset.icon = e;
  $('emoji-row').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.textContent === e));
}
$('emoji-row').onclick = (e) => { if (e.target.tagName === 'BUTTON') pickEmoji(e.target.textContent); };

// ---------- Сохранение форм ----------
$('tx-form').onsubmit = (e) => {
  e.preventDefault();
  txs.push({
    id: Date.now(), type: $('tx-form').dataset.type, amount: +$('tx-amount').value,
    category: $('tx-category').value, note: $('tx-note').value.trim(), date: $('tx-date').value || todayISO(),
  });
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

$('pay-form').onsubmit = (e) => {
  e.preventDefault();
  pays.push({ id: Date.now(), name: $('pay-name').value.trim(), amount: +$('pay-amount').value, day: +$('pay-day').value, lastRun: null });
  save(); runPays(); renderAll(); closeModal();
};

// ---------- Рендер: ОБЗОР ----------
function renderOverview() {
  $('total-balance').textContent = fmt.format(txs.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0));

  const m = month();
  let mi = 0, me = 0;
  const by = {};
  for (const t of txs) {
    if (!t.date.startsWith(m)) continue;
    if (t.type === 'income') mi += t.amount;
    else { me += t.amount; by[t.category] = (by[t.category] || 0) + t.amount; }
  }
  $('month-income').textContent = fmt.format(mi);
  $('month-expense').textContent = fmt.format(me);

  const en = Object.entries(by).sort((a, b) => b[1] - a[1]);
  $('category-bars').innerHTML = en.length ? en.map(([n, s]) => `
    <div class="bar">
      <div class="bar-top"><span>${icon('expense', n)} ${esc(n)}</span><b>${fmt.format(s)}</b></div>
      <div class="track"><i style="width:${Math.round((s / en[0][1]) * 100)}%"></i></div>
    </div>`).join('') : '<div class="empty">Нет расходов в этом месяце</div>';

  const si = invs.reduce((s, i) => s + i.invested, 0);
  const sc = invs.reduce((s, i) => s + i.current, 0);
  const pr = sc - si;
  $('invest-summary').innerHTML = invs.length ? `
    <div class="cols">
      <div><small>Вложено</small><b>${fmt.format(si)}</b></div>
      <div><small>Сейчас</small><b>${fmt.format(sc)}</b></div>
      <div><small>Прибыль</small><b class="${pr >= 0 ? 'in' : 'out'}">${fmtSign(pr)} (${si ? ((pr / si) * 100).toFixed(1) : 0}%)</b></div>
    </div>` : '<div class="empty">Нет инвестиций</div>';
}

// ---------- Рендер: ИСТОРИЯ ----------
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
    html += `
      <div class="li">
        <div class="ic">${icon(t.type, t.category)}</div>
        <div class="grow"><div class="name">${esc(t.category)}</div>${t.note ? `<div class="note">${esc(t.note)}</div>` : ''}</div>
        <div class="amt ${inc ? 'in' : 'out'}">${inc ? '+' : '−'}${fmt.format(t.amount)}</div>
        <button class="del" data-id="${t.id}">✕</button>
      </div>`;
  }
  box.innerHTML = html + '</div>';

  box.querySelectorAll('.del').forEach((b) => (b.onclick = () => {
    if (confirm('Удалить операцию?')) { txs = txs.filter((t) => t.id != b.dataset.id); save(); renderAll(); }
  }));
}

// ---------- Рендер: ИНВЕСТИЦИИ ----------
function renderInvestments() {
  const box = $('invest-list');
  if (!invs.length) { box.innerHTML = '<div class="empty">Инвестиций нет. Нажми «+», чтобы добавить</div>'; return; }

  box.innerHTML = invs.map((i) => {
    const pr = i.current - i.invested, pct = i.invested ? ((pr / i.invested) * 100).toFixed(1) : 0;
    return `
      <div class="card">
        <div class="bar-top" style="margin-bottom:10px"><b style="font-size:16px">${esc(i.name)}</b><span>
          <button class="del" data-a="edit" data-id="${i.id}">✏️</button><button class="del" data-a="del" data-id="${i.id}">🗑️</button></span></div>
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

// ---------- Рендер: КАТЕГОРИИ и АВТОПЛАТЕЖИ ----------
function renderCats() {
  const row = (c, t) => `
    <div class="li">
      <div class="ic">${c.icon}</div><div class="grow name">${esc(c.name)}</div>
      <button class="del" data-t="${t}" data-n="${esc(c.name)}">✕</button>
    </div>`;
  $('cat-list').innerHTML =
    '<div class="sec">Расходы</div>' + cats.expense.map((c) => row(c, 'expense')).join('') +
    '<div class="sec">Доходы</div>' + cats.income.map((c) => row(c, 'income')).join('') ||
    '<div class="empty">Нет категорий</div>';
  $('cat-list').querySelectorAll('.del').forEach((b) => (b.onclick = () => {
    cats[b.dataset.t] = cats[b.dataset.t].filter((c) => c.name !== b.dataset.n);
    save(); renderAll();
  }));
}

function renderPays() {
  $('autopay-list').innerHTML = pays.length ? pays.map((p) => `
    <div class="li">
      <div class="ic">🔄</div>
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
function renderAll() { renderOverview(); renderHistory(); renderInvestments(); renderCats(); renderPays(); }
runPays();
renderAll();
showView('overview');
