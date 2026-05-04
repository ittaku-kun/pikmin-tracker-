// メイン画面ロジック - 計算・表示・LocalStorage

// DOM 要素
const inputNextGoal = document.getElementById('inputNextGoal');
const inputRemaining = document.getElementById('inputRemaining');
const inputSimDate = document.getElementById('inputSimDate');
const elWarnDate = document.getElementById('warnDate');
const elErrorInput = document.getElementById('errorInput');
const btnUpdate = document.getElementById('btnUpdate');

const elCurrentTotal = document.getElementById('currentTotal');
const elRemainingToComplete = document.getElementById('remainingToComplete');
const elRemainingDays = document.getElementById('remainingDays');
const elRequiredPace = document.getElementById('requiredPace');
const elCurrentPace = document.getElementById('currentPace');
const elJudgment = document.getElementById('judgment');
const elSummarySection = document.getElementById('summarySection');
const elSummarySection2 = document.getElementById('summarySection2');
const elWelcome = document.getElementById('welcomeMsg');

// 今日の実際の日付を返す
function getTodayInfo() {
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  };
}

// 今日の日付を YYYY-MM-DD 形式で返す
function getTodayString() {
  const t = getTodayInfo();
  return `${t.year}-${String(t.month).padStart(2, '0')}-${String(t.day).padStart(2, '0')}`;
}

// 基準日入力欄から日付情報を取得する（未入力なら今日）
function getSimDateInfo() {
  const val = inputSimDate.value; // "YYYY-MM-DD"
  if (!val) return getTodayInfo();
  const [year, month, day] = val.split('-').map(Number);
  return { year, month, day };
}

// 確認日の入力範囲を今月に制限する
function setDateInputRange() {
  const today = getTodayInfo();
  const lastDay = getDaysInMonth(today.year, today.month);
  const mm = String(today.month).padStart(2, '0');
  inputSimDate.min = `${today.year}-${mm}-01`;
  inputSimDate.max = `${today.year}-${mm}-${String(lastDay).padStart(2, '0')}`;
}

// 確認日の警告を更新する
function updateDateWarning() {
  if (!elWarnDate) return;
  if (!inputSimDate.value) {
    elWarnDate.className = 'field-warning';
    elWarnDate.textContent = '';
    return;
  }

  // イベント月の範囲チェック
  const val = inputSimDate.value;
  const min = inputSimDate.min;
  const max = inputSimDate.max;
  if (min && max && (val < min || val > max)) {
    const data = loadData();
    const today = getTodayInfo();
    const month = data.eventMonth || today.month;
    elWarnDate.className = 'field-error';
    elWarnDate.textContent = `❌ 確認日は${month}月中で入力してください`;
  } else if (val !== getTodayString()) {
    elWarnDate.className = 'field-warning';
    elWarnDate.textContent = '⚠️ 確認日が今日と異なります';
  } else {
    elWarnDate.className = 'field-warning';
    elWarnDate.textContent = '';
  }
}

// 累計目標・あとの入力エラーを更新する
function updateInputError() {
  if (!elErrorInput) return;
  const nextGoal = parseCommaNumber(inputNextGoal.value);
  const remaining = parseCommaNumber(inputRemaining.value);
  if (!isNaN(nextGoal) && !isNaN(remaining) && nextGoal < remaining) {
    elErrorInput.textContent = '❌ 累計目標が「あと」より小さい値です';
  } else {
    elErrorInput.textContent = '';
  }
}

// 残り日数（今日から月末まで、今日を含む）
function calcRemainingDays(year, month, day) {
  return Math.max(0, getDaysInMonth(year, month) - day + 1);
}

// イベント経過日数（月初1日起算、今日まで）
function calcElapsedDays(day) {
  return day;
}

// サマリーを計算して表示する
function updateDisplay() {
  const data = loadData();
  const { nextGoal, remaining, completeGoal, bigMushroomDays } = data;

  // 入力値が未設定の場合はウェルカムメッセージを表示
  if (nextGoal === null || remaining === null) {
    elSummarySection.style.display = 'none';
    elSummarySection2.style.display = 'none';
    elWelcome.style.display = 'block';
    return;
  }

  elSummarySection.style.display = 'block';
  elSummarySection2.style.display = 'block';
  elWelcome.style.display = 'none';

  // 基準日（確認日 or 今日）
  const simDate = getSimDateInfo();
  const year = simDate.year;
  const month = simDate.month;
  const day = simDate.day;

  // 確認日の警告を更新
  updateDateWarning();

  // 現在の累計 = 次の目標 − あと○○個
  const currentTotal = Math.max(0, nextGoal - remaining);

  // コンプリートまでの残り個数
  const remainingToComplete = Math.max(0, completeGoal - currentTotal);

  // 残り日数（今日から月末）
  const remainingDays = calcRemainingDays(year, month, day);

  // 必要ペース（残り個数 ÷ 残り日数）
  const requiredPace = remainingDays > 0 ? remainingToComplete / remainingDays : Infinity;

  // 経過日数（今日まで）
  const elapsedDays = calcElapsedDays(day);

  // 現在ペース（現在累計 ÷ 経過日数）
  const currentPace = elapsedDays > 0 ? currentTotal / elapsedDays : 0;

  // 表示を更新
  elCurrentTotal.textContent = currentTotal.toLocaleString();
  elRemainingToComplete.textContent = remainingToComplete.toLocaleString();
  elRemainingDays.textContent = remainingDays;
  elRequiredPace.textContent = remainingDays > 0
    ? Math.ceil(requiredPace).toLocaleString()
    : '−';
  elCurrentPace.textContent = Math.floor(currentPace).toLocaleString();

  // ペースの色分け
  const isPaceOk = currentPace >= requiredPace;
  elCurrentPace.className = 'info-value ' + (isPaceOk ? 'success' : 'danger');
  elRequiredPace.className = 'info-value';

  // 現在ペースでのコンプ予定日を計算
  let completionDateStr = null;
  if (currentPace > 0 && remainingToComplete > 0) {
    const daysNeeded = remainingToComplete / currentPace;
    const estimatedDay = Math.ceil(day + daysNeeded);
    if (estimatedDay <= getDaysInMonth(year, month)) {
      completionDateStr = `${month}月${estimatedDay}日`;
    }
  }

  // 判定表示
  if (remainingToComplete <= 0) {
    // コンプリート済み
    elJudgment.className = 'judgment complete';
    elJudgment.innerHTML = '🎉 コンプリート達成！おめでとうございます！';
  } else if (remainingDays <= 0) {
    // 期限切れ
    elJudgment.className = 'judgment danger';
    elJudgment.innerHTML = '❌ イベント期間が終了しました';
  } else if (isPaceOk) {
    elJudgment.className = 'judgment success';
    const dateStr = completionDateStr
      ? `<span style="font-size:0.82rem;font-weight:400;">${completionDateStr}コンプペース</span>`
      : '';
    elJudgment.innerHTML = `<span style="white-space:nowrap;">✅ 今のペースで間に合います！</span>${dateStr}`;
  } else {
    elJudgment.className = 'judgment danger';
    elJudgment.innerHTML = '❌ ペースが遅れています';
  }

  // グラフを更新
  const chartData = buildChartData({
    completeGoal,
    bigMushroomDays: bigMushroomDays || [],
    currentTotal,
    currentDay: day,
    year,
    month,
  });
  renderChart('paceChart', chartData);
}

// 更新ボタンが押されたとき
function onUpdate() {
  // 基準日が空なら今日を補完
  if (!inputSimDate.value) {
    inputSimDate.value = getTodayString();
  }

  const nextGoal = parseCommaNumber(inputNextGoal.value);
  const remaining = parseCommaNumber(inputRemaining.value);

  if (isNaN(nextGoal) || nextGoal < 0) {
    alert('「累計目標」を正しく入力してください');
    return;
  }
  if (isNaN(remaining) || remaining < 0) {
    alert('「あと」を正しく入力してください');
    return;
  }

  // 今日の日付を保存
  const today = getTodayInfo();
  const updatedAt = `${today.year}-${String(today.month).padStart(2, '0')}-${String(today.day).padStart(2, '0')}`;

  saveData({ nextGoal, remaining, updatedAt });
  updateDisplay();

  // ボタンに押した感触を出す
  btnUpdate.textContent = '✓ 更新しました';
  setTimeout(() => { btnUpdate.textContent = '更新'; }, 1500);
}

// カンマ整形のフォーカス制御を設定する
function addCommaFormat(input) {
  input.addEventListener('blur', () => {
    const num = parseCommaNumber(input.value);
    if (!isNaN(num)) input.value = num.toLocaleString();
  });
  input.addEventListener('focus', () => {
    const num = parseCommaNumber(input.value);
    input.value = isNaN(num) ? '' : String(num);
  });
}

// フォームに保存済みの値を復元する
function restoreInputs() {
  const data = loadData();
  if (data.nextGoal !== null) inputNextGoal.value = formatWithComma(data.nextGoal);
  if (data.remaining !== null) inputRemaining.value = formatWithComma(data.remaining);
  // 確認日の入力範囲をイベント月に制限してから今日をセット
  setDateInputRange();
  inputSimDate.value = getTodayString();
  updateDateWarning();
  updateInputError();
}

// 初期化
function init() {
  // 月が変わっていたらデータをリセット
  checkAndResetIfNewMonth();
  restoreInputs();
  updateDisplay();

  btnUpdate.addEventListener('click', onUpdate);

  // Enterキーでも更新できる
  [inputNextGoal, inputRemaining].forEach((el) => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') onUpdate();
    });
  });

  // カンマ整形を設定
  addCommaFormat(inputNextGoal);
  addCommaFormat(inputRemaining);

  // リアルタイム入力チェック
  inputSimDate.addEventListener('change', updateDateWarning);
  inputNextGoal.addEventListener('input', updateInputError);
  inputRemaining.addEventListener('input', updateInputError);

  // 確認日はキーボード入力を禁止（カレンダーアイコンからのみ操作可）
  inputSimDate.addEventListener('keydown', e => e.preventDefault());

  // Service Worker を登録し、更新時に自動リロード
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('Service Worker 登録失敗:', err);
    });
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        window.location.reload();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
