// 設定画面ロジック

const inputCompleteGoal = document.getElementById('inputCompleteGoal');
const calendarEl = document.getElementById('calendar');
const btnSave = document.getElementById('btnSave');
const btnBack = document.getElementById('btnBack');

// 曜日の名前（日曜=0）
const WEEKDAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

// カレンダーを描画する
function renderCalendar(year, month, checkedDays) {
  calendarEl.innerHTML = '';

  const totalDays = getDaysInMonth(year, month);
  // 月の1日が何曜日か（0=日曜）
  const firstWeekday = new Date(year, month - 1, 1).getDay();

  // 曜日ヘッダー
  const header = document.createElement('div');
  header.className = 'calendar-header';
  WEEKDAY_NAMES.forEach((name, i) => {
    const cell = document.createElement('div');
    cell.className = 'calendar-weekday' + (i === 0 ? ' sun' : i === 6 ? ' sat' : '');
    cell.textContent = name;
    header.appendChild(cell);
  });
  calendarEl.appendChild(header);

  // 日付グリッド
  const grid = document.createElement('div');
  grid.className = 'calendar';

  // 1日より前の空白セル
  for (let i = 0; i < firstWeekday; i++) {
    const empty = document.createElement('div');
    empty.className = 'calendar-day empty';
    const lbl = document.createElement('label');
    empty.appendChild(lbl);
    grid.appendChild(empty);
  }

  // 各日付のチェックボックス
  for (let day = 1; day <= totalDays; day++) {
    const weekday = (firstWeekday + day - 1) % 7;
    const isSun = weekday === 0;
    const isSat = weekday === 6;

    const cell = document.createElement('div');
    cell.className = 'calendar-day';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'day-' + day;
    checkbox.value = day;
    checkbox.checked = checkedDays.includes(day);

    const label = document.createElement('label');
    label.htmlFor = 'day-' + day;
    label.textContent = day;
    if (isSun) label.classList.add('sun');
    if (isSat) label.classList.add('sat');

    cell.appendChild(checkbox);
    cell.appendChild(label);
    grid.appendChild(cell);
  }

  calendarEl.appendChild(grid);
}

// チェック済みの日付一覧を取得する
function getCheckedDays() {
  const checkboxes = calendarEl.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(checkboxes).map((cb) => parseInt(cb.value, 10));
}

// 保存する
function onSave() {
  const completeGoal = parseCommaNumber(inputCompleteGoal.value);
  if (isNaN(completeGoal) || completeGoal <= 0) {
    alert('コンプリート目標個数を正しく入力してください');
    return;
  }

  const bigMushroomDays = getCheckedDays().sort((a, b) => a - b);

  saveData({ completeGoal, bigMushroomDays });

  // トーストを表示してから元の画面に戻る
  showToast('設定を保存しました ✓');
  setTimeout(() => { history.back(); }, 800);
}

// トースト通知を表示する
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => { toast.classList.remove('show'); }, 2000);
}

// 初期化
function init() {
  const data = loadData();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  // 月見出しを更新
  const calendarTitle = document.getElementById('calendarTitle');
  if (calendarTitle) {
    calendarTitle.textContent = `🍄 巨大キノコ開催日（${year}年${month}月）`;
  }

  // 入力値を復元（カンマ整形して表示）
  inputCompleteGoal.value = formatWithComma(data.completeGoal || 12000);

  // カレンダーを描画（未設定の場合は土日をデフォルトでチェック）
  const checkedDays = data.bigMushroomDays && data.bigMushroomDays.length > 0
    ? data.bigMushroomDays
    : getWeekendDays(year, month);
  renderCalendar(year, month, checkedDays);

  // カンマ整形のフォーカス制御
  inputCompleteGoal.addEventListener('blur', () => {
    const num = parseCommaNumber(inputCompleteGoal.value);
    if (!isNaN(num)) inputCompleteGoal.value = num.toLocaleString();
  });
  inputCompleteGoal.addEventListener('focus', () => {
    const num = parseCommaNumber(inputCompleteGoal.value);
    inputCompleteGoal.value = isNaN(num) ? '' : String(num);
  });

  // イベントリスナー
  btnSave.addEventListener('click', onSave);
  btnBack.addEventListener('click', () => {
    history.back();
  });
}

document.addEventListener('DOMContentLoaded', init);
