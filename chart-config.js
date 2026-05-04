// Chart.js グラフ設定モジュール

// 5角形の星アイコンを Canvas で描いて返す
function createStarImage(color, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 1;
  const innerR = outerR * 0.42; // 内径比（黄金比に近い値）
  const points = 5;

  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  return canvas;
}

// グラフ用のデータセットを生成する
// data: { completeGoal, bigMushroomDays, currentTotal, currentDay, year, month }
function buildChartData(data) {
  const { completeGoal, bigMushroomDays, currentTotal, currentDay, year, month } = data;
  const totalDays = getDaysInMonth(year, month);

  // --- 理想ラインの計算 ---
  // 巨大キノコ開催日のボーナス合計（1日600個）
  const bigMushroomBonus = bigMushroomDays.length * 600;
  // 平日の日数
  const weekdayCount = totalDays - bigMushroomDays.length;
  // 平日1日あたりの割り当て
  const weekdayDaily = weekdayCount > 0
    ? (completeGoal - bigMushroomBonus) / weekdayCount
    : completeGoal / totalDays;

  // 各日の理想累計を計算
  const idealData = [];
  let idealCumulative = 0;
  for (let day = 1; day <= totalDays; day++) {
    if (bigMushroomDays.includes(day)) {
      idealCumulative += 600;
    } else {
      idealCumulative += weekdayDaily;
    }
    idealData.push({ x: day, y: Math.round(idealCumulative) });
  }

  // --- 現在ペース予測線の計算 ---
  // 現在ペース（1日あたり）= 現在累計 ÷ 経過日数
  const predictData = [];
  if (currentTotal !== null && currentDay >= 1) {
    const dailyPace = currentTotal / currentDay;
    for (let day = 1; day <= totalDays; day++) {
      predictData.push({ x: day, y: Math.round(dailyPace * day) });
    }
  }

  // --- 現在地（★）---
  const currentPointData = [];
  if (currentTotal !== null && currentDay >= 1) {
    currentPointData.push({ x: currentDay, y: currentTotal });
  }

  return { idealData, predictData, currentPointData, totalDays, completeGoal };
}

// グラフを描画する（または更新する）
function renderChart(canvasId, chartData) {
  const { idealData, predictData, currentPointData, totalDays, completeGoal } = chartData;
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;

  const datasets = [
    {
      label: '目標ペース',
      data: idealData,
      borderColor: '#1565c0',
      backgroundColor: 'rgba(21, 101, 192, 0.08)',
      borderWidth: 2,
      pointRadius: 0,
      fill: true,
      tension: 0.1,
      parsing: false,
    },
    {
      label: '現在ペース',
      data: predictData,
      borderColor: '#c62828',
      borderWidth: 2,
      borderDash: [6, 4],
      pointRadius: 0,
      fill: false,
      tension: 0,
      parsing: false,
    },
    {
      label: '現在地',
      data: currentPointData,
      borderColor: '#ff6f00',
      backgroundColor: '#ff6f00',
      borderWidth: 2,
      pointRadius: 8,
      pointStyle: createStarImage('#ff6f00', 20),
      showLine: false,
      parsing: false,
    },
  ];

  const config = {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      scales: {
        x: {
          type: 'linear',
          min: 1,
          max: totalDays,
          ticks: {
            stepSize: 5,
            font: { size: 11 },
            callback: (val) => val + '日',
          },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
        y: {
          min: 0,
          max: completeGoal,
          ticks: {
            stepSize: 2000,
            font: { size: 10 },
            callback: (val) => val.toLocaleString(),
          },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => items[0].raw.x + '日',
            label: (item) => item.dataset.label + ': ' + item.raw.y.toLocaleString() + '個',
          },
        },
      },
    },
  };

  // 既存のグラフを破棄してから再描画
  const existingChart = Chart.getChart(canvasId);
  if (existingChart) existingChart.destroy();

  return new Chart(ctx, config);
}
