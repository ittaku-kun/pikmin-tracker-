// LocalStorage の読み書きをまとめたモジュール
const STORAGE_KEY = 'pikmin_tracker';

// デフォルト値
const DEFAULT_DATA = {
  completeGoal: 12000,
  bigMushroomDays: [],
  nextGoal: null,
  remaining: null,
  updatedAt: null,
  lastActiveMonth: null, // 月変わり検知用 "YYYY-MM" 形式
};

// データを読み込む
function loadData() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return { ...DEFAULT_DATA };
    return { ...DEFAULT_DATA, ...JSON.parse(json) };
  } catch (e) {
    console.error('データ読み込みエラー:', e);
    return { ...DEFAULT_DATA };
  }
}

// データを保存する
function saveData(data) {
  try {
    const current = loadData();
    const merged = { ...current, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return true;
  } catch (e) {
    console.error('データ保存エラー:', e);
    return false;
  }
}

// データを全てリセットする
function resetData() {
  localStorage.removeItem(STORAGE_KEY);
}

// 指定した年月の末日を返す（共通ユーティリティ）
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

// 数値をカンマ区切り文字列に変換する
function formatWithComma(value) {
  const num = parseInt(String(value).replace(/,/g, ''), 10);
  return isNaN(num) ? '' : num.toLocaleString();
}

// カンマ区切り文字列を数値に変換する
function parseCommaNumber(value) {
  return parseInt(String(value).replace(/,/g, ''), 10);
}

// 指定した年月の土日の日付一覧を返す
function getWeekendDays(year, month) {
  const totalDays = getDaysInMonth(year, month);
  const weekends = [];
  for (let day = 1; day <= totalDays; day++) {
    const weekday = new Date(year, month - 1, day).getDay();
    if (weekday === 0 || weekday === 6) weekends.push(day);
  }
  return weekends;
}

// 月が変わっていたら入力値・巨大キノコ開催日をリセットする
function checkAndResetIfNewMonth() {
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const data = loadData();
  if (data.lastActiveMonth !== currentMonth) {
    saveData({
      bigMushroomDays: [],
      nextGoal: null,
      remaining: null,
      updatedAt: null,
      lastActiveMonth: currentMonth,
    });
  }
}
