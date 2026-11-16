/* =====================================================
   Мои Финансы — логика приложения
   Данные хранятся в localStorage (прямо в браузере)
   ===================================================== */

// ---------- Категории ----------
const CATEGORIES = {
  expense: [
    { name: 'Продукты',    icon: '🍔' },
    { name: 'Транспорт',   icon: '🚌' },
    { name: 'Жильё',       icon: '🏠' },
    { name: 'Развлечения', icon: '🎬' },
    { name: 'Здоровье',    icon: '💊' },
    { name: 'Другое',      icon: '📦' },
  ],
  income: [
    { name: 'Зарплата',    icon: '💼' },
    { name: 'Фриланс',     icon: '💻' },
    { name: 'Подарки',     icon: '🎁' },
    { name: 'Другое',      icon: '✨' },
  ],
};

// ---------- Хранилище ----------
function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

let transactions = load('fin_transactions', []); // {id, type, amount, category, note, date}
let investments  = load('fin_investments', []);  // {id, name, invested, current}

function save() {
  localStorage.setItem('fin_transactions', JSON.stringify(transactions));
  localStorage.setItem('fin_investments', JSON.stringify(investments));
}

// ---------- Утилиты ----------
const fmt = new Intl.NumberFormat('ru-RU', {
  style: 'currency', currency: 'RUB', maximumFractionDigits: 0,
});

const fmtSign = (n) => (n >= 0 ? '+' : '−') + fmt.format(Math.abs(n));

const byId = (id) => document.getElementById(id);

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // формат ГГГГ-ММ-ДД
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['января','февраля','марта','апреля','мая','июня',
                  'июля','августа','сентября','октября','ноября','декабря'];
  const now = new Date();
  const label = `${d} ${months[m - 1]}` + (y !== now.getFullYear() ? ` ${y}` : '');
  if (iso === todayISO()) return 'Сегодня';
  return label;
}

function currentMonth() {
  return todayISO().slice(0, 7); // формат ГГГГ-ММ
}

function categoryIcon(type, name) {
  const list = CATEGORIES[type] || [];
  return (list.find((c) => c.name === name) || { icon: '❓' }).icon;
}

// ---------- Переключение экранов ----------
document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    btn.classList.add('active');
    byId('view-' + btn.dataset.view).classList.add('active');
  });
});

// ---------- Рендер: ОБЗОР ----------
function renderOverview() {
  // Общий баланс
  const balance = transactions.reduce(
    (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0
  );
  byId('total-balance').textContent = fmt.format(balance);

  // Доходы и расходы за текущий месяц
  const month = currentMonth();
  let monthIncome = 0;
  let monthExpense = 0;
  const byCategory = {};

  for (const t of transactions) {
    if (!t.date.startsWith(month)) continue;
    if (t.type === 'income') {
      monthIncome += t.amount;
    } else {
      monthExpense += t.amount;
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    }
  }

  byId('month-income').textContent = fmt.format(monthIncome);
  byId('month-expense').textContent = fmt.format(monthExpense);

  // Полоски по категориям
  const barsBox = byId('category-bars');
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    barsBox.innerHTML = '<div class="empty">Пока нет расходов в этом месяце</div>';
  } else {
    const max = entries[0][1];
    barsBox.innerHTML = entries.map(([name, sum]) => `
      <div class="bar-row">
        <div class="bar-top">
          <span>${categoryIcon('expense', name)} ${name}</span>
          <span>${fmt.format(sum)}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${Math.round((sum / max) * 100)}%"></div>
        </div>
      </div>
    `).join('');
  }

  // Сводка по инвестициям
  const invested = investments.reduce((s, i) => s + i.invested, 0);
  const current  = investments.reduce((s, i) => s + i.current, 0);
  const summaryBox = byId('invest-summary');

  if (investments.length === 0) {
    summaryBox.innerHTML = '<div class="empty">Пока нет инвестиций</div>';
  } else {
    const profit = current - invested;
    const percent = invested > 0 ? ((profit / invested) * 100).toFixed(1) : 0;
    const cls = profit >= 0 ? 'profit-pos' : 'profit-neg';
    summaryBox.innerHTML = `
      <div class="invest-rows">
        <div class="cell"><div class="lbl">Вложено</div><div class="val">${fmt.format(invested)}</div></div>
        <div class="cell"><div class="lbl">Сейчас</div><div class="val">${fmt.format(current)}</div></div>
        <div class="cell"><div class="lbl">Прибыль</div><div class="val ${cls}">${fmtSign(profit)} (${percent}%)</div></div>
      </div>
    `;
  }
}

// ---------- Рендер: ИСТОРИЯ ----------
function renderHistory() {
  const box = byId('history-list');

  if (transactions.length === 0) {
    box.innerHTML = '<div class="empty">Операций пока нет. Нажми «+», чтобы добавить первую</div>';
    return;
  }

  // Сортировка: сначала новые
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  // Группировка по датам
  let html = '';
  let lastDate = null;

  for (const t of sorted) {
    if (t.date !== lastDate) {
      if (lastDate !== null) html += '</div>';
      html += `<div class="day-group"><div class="day-title">${formatDate(t.date)}</div>`;
      lastDate = t.date;
    }
    const plus = t.type === 'income';
    html += `
      <div class="tx-item">
        <div class="tx-icon">${categoryIcon(t.type, t.category)}</div>
        <div class="tx-info">
          <div class="tx-category">${t.category}</div>
          ${t.note ? `<div class="tx-note">${escapeHtml(t.note)}</div>` : ''}
        </div>
        <div class="tx-amount ${plus ? 'plus' : 'minus'}">${plus ? '+' : '−'}${fmt.format(t.amount)}</div>
        <button class="tx-delete" data-id="${t.id}" aria-label="Удалить">✕</button>
      </div>
    `;
  }
  html += '</div>';
  box.innerHTML = html;

  // Удаление
  box.querySelectorAll('.tx-delete').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!confirm('Удалить эту операцию?')) return;
      transactions = transactions.filter((t) => t.id !== Number(btn.dataset.id));
      save();
      renderAll();
    });
  });
}

// ---------- Рендер: ИНВЕСТИЦИИ ----------
function renderInvestments() {
  const box = byId('invest-list');

  if (investments.length === 0) {
    box.innerHTML = '<div class="empty">Инвестиций пока нет. Нажми «+», чтобы добавить</div>';
    return;
  }

  box.innerHTML = investments.map((i) => {
    const profit = i.current - i.invested;
    const percent = i.invested > 0 ? ((profit / i.invested) * 100).toFixed(1) : 0;
    const cls = profit >= 0 ? 'profit-pos' : 'profit-neg';
    return `
      <div class="invest-item">
        <div class="invest-top">
          <div class="invest-name">${escapeHtml(i.name)}</div>
          <div class="invest-actions">
            <button data-action="edit" data-id="${i.id}">✏️</button>
            <button data-action="delete" data-id="${i.id}">🗑️</button>
          </div>
        </div>
        <div class="invest-rows">
          <div class="cell"><div class="lbl">Вложено</div><div class="val">${fmt.format(i.invested)}</div></div>
          <div class="cell"><div class="lbl">Сейчас</div><div class="val">${fmt.format(i.current)}</div></div>
          <div class="cell"><div class="lbl">Прибыль</div><div class="val ${cls}">${fmtSign(profit)} (${percent}%)</div></div>
        </div>
      </div>
    `;
  }).join('');

  // Кнопки редактирования и удаления
  box.querySelectorAll('button[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      const inv = investments.find((i) => i.id === id);

      if (btn.dataset.action === 'delete') {
        if (confirm(`Удалить «${inv.name}»?`)) {
          investments = investments.filter((i) => i.id !== id);
          save();
          renderAll();
        }
      } else {
        openModal('invest');
        byId('inv-name').value = inv.name;
        byId('inv-invested').value = inv.invested;
        byId('inv-current').value = inv.current;
        editingInvestmentId = id;
      }
    });
  });
}

function renderAll() {
  renderOverview();
  renderHistory();
  renderInvestments();
}

// Защита от вставки HTML через комментарий/название
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- МОДАЛЬНОЕ ОКНО ----------
const modal = byId('modal');
let currentFormType = 'tx';   // 'tx' (доход/расход) или 'invest'
let editingInvestmentId = null;
let txType = 'expense';       // текущий тип операции

function openModal(type) {
  currentFormType = type;
  byId('tx-form').hidden = type !== 'tx';
  byId('inv-form').hidden = type !== 'invest';
  modal.classList.add('open');

  if (type === 'tx') {
    byId('tx-date').value = todayISO();
    updateCategorySelect();
    setTimeout(() => byId('tx-amount').focus(), 100);
  } else {
    editingInvestmentId = null;
    byId('inv-form').reset();
  }
}

function closeModal() {
  modal.classList.remove('open');
  byId('tx-form').reset();
  byId('inv-form').reset();
  editingInvestmentId = null;
}

// Кнопка «+» — зависит от открытого экрана
byId('fab').addEventListener('click', () => {
  const activeView = document.querySelector('.view.active').id;
  openModal(activeView === 'view-investments' ? 'invest' : 'tx');
});

byId('tx-cancel').addEventListener('click', closeModal);
byId('inv-cancel').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// ---------- Переключатель Расход / Доход ----------
document.querySelectorAll('.type-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    txType = btn.dataset.type;
    document.querySelectorAll('.type-btn').forEach((b) => {
      b.classList.remove('active');
      b.classList.toggle('income-active', b.dataset.type === 'income');
    });
    btn.classList.add('active');
    updateCategorySelect();
  });
});

function updateCategorySelect() {
  byId('tx-category').innerHTML = CATEGORIES[txType]
    .map((c) => `<option value="${c.name}">${c.icon} ${c.name}</option>`)
    .join('');
}

// ---------- Сохранение дохода/расхода ----------
byId('tx-form').addEventListener('submit', (e) => {
  e.preventDefault();

  transactions.push({
    id: Date.now(),
    type: txType,
    amount: Math.round(parseFloat(byId('tx-amount').value) * 100) / 100,
    category: byId('tx-category').value,
    note: byId('tx-note').value.trim(),
    date: byId('tx-date').value || todayISO(),
  });

  save();
  renderAll();
  closeModal();
});

// ---------- Сохранение инвестиции ----------
byId('inv-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const data = {
    name: byId('inv-name').value.trim(),
    invested: parseFloat(byId('inv-invested').value),
    current: parseFloat(byId('inv-current').value),
  };

  if (editingInvestmentId) {
    const inv = investments.find((i) => i.id === editingInvestmentId);
    Object.assign(inv, data);
  } else {
    investments.push({ id: Date.now(), ...data });
  }

  save();
  renderAll();
  closeModal();
});

// ---------- Запуск ----------
renderAll();
