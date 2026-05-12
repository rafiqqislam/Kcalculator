// ── Constants ──────────────────────────────────────────────────────────────
const GROUP_COLOR = {
  produce:    '#16A34A', protein:    '#DC2626', dairy:      '#D97706',
  grains:     '#CA8A04', snacks:     '#9333EA', beverages:  '#2563EB',
  condiments: '#EA580C', non_food:   '#6B7280',
};

const GROUP_LABEL = {
  produce: 'Fruits & Veg', protein: 'Protein', dairy: 'Dairy',
  grains: 'Grains & Carbs', snacks: 'Snacks', beverages: 'Drinks',
  condiments: 'Condiments', non_food: 'Household',
};

const GROUP_EMOJI = {
  produce: '🥦', protein: '🥩', dairy: '🧀', grains: '🌾',
  snacks: '🍫', beverages: '🥤', condiments: '🫙', non_food: '🧹',
};

let currentPeriod = 7;
let donutChart = null;
let trendChart  = null;

// ── Entry point ────────────────────────────────────────────────────────────
async function loadDashboard(days) {
  try {
    const res = await fetch(`/api/dashboard/summary?days=${days}`);
    if (!res.ok) throw new Error('Server error');
    const data = await res.json();
    render(data);
  } catch {
    showToast('Couldn\'t load your dashboard — try refreshing.', 'error');
  }
}

// ── Master render ──────────────────────────────────────────────────────────
function render(data) {
  if (!data.total_receipts) {
    document.getElementById('emptyState').classList.remove('hidden');
    document.getElementById('dashContent').classList.add('hidden');
    return;
  }

  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('dashContent').classList.remove('hidden');

  const period = data.period_days;
  document.getElementById('dashSubtitle').textContent =
    `${data.total_receipts} receipt${data.total_receipts !== 1 ? 's' : ''} · last ${period} day${period !== 1 ? 's' : ''}`;

  renderStats(data);
  renderHealthReport(data.health_report);
  renderSpending(data.spending_by_group);
  renderTrend(data.weekly_trend);
  renderNutrientGaps(data.health_report.nutrient_gaps);
  renderReceipts(data.recent_receipts);
}

// ── Stats ──────────────────────────────────────────────────────────────────
function renderStats(data) {
  document.getElementById('statTotal').textContent    = '$' + data.total_spent.toFixed(2);
  document.getElementById('statReceipts').textContent = data.total_receipts;
  document.getElementById('statScore').textContent    = data.health_report.overall_score + '%';
}

// ── Health report ──────────────────────────────────────────────────────────
function renderHealthReport(report) {
  const score = report.overall_score;

  // Score ring
  const arc = document.getElementById('scoreArc');
  const circumference = 201;
  arc.style.strokeDashoffset = circumference - (score / 100 * circumference);
  arc.style.stroke = score >= 70 ? '#16A34A' : score >= 40 ? '#D97706' : '#DC2626';
  document.getElementById('scoreNumber').textContent = score + '%';
  document.getElementById('scoreMessage').textContent = report.summary_message;

  const good    = report.body_systems.filter(s => s.status === 'good').length;
  const partial = report.body_systems.filter(s => s.status === 'partial').length;
  const total   = report.body_systems.length;
  document.getElementById('scoreSub').textContent =
    `${good} areas well covered · ${partial} partial · ${total - good - partial} missing`;

  // Body grid
  document.getElementById('bodyGrid').innerHTML = report.body_systems.map(s => `
    <div class="body-cell status-${s.status}" title="${systemTooltip(s)}">
      <span class="body-emoji">${s.emoji}</span>
      <div class="body-name">${s.name}</div>
      <div class="body-dot"></div>
    </div>
  `).join('');
}

function systemTooltip(s) {
  const covered = s.covered_nutrients.join(', ') || 'none';
  const missing = s.missing_nutrients.join(', ')  || 'none';
  return `Covered: ${covered}\nMissing: ${missing}`;
}

// ── Spending donut + list ──────────────────────────────────────────────────
function renderSpending(groups) {
  const food = groups.filter(g => g.food_group !== 'non_food');
  const labels = food.map(g => GROUP_LABEL[g.food_group] || g.food_group);
  const values = food.map(g => g.total);
  const colors = food.map(g => GROUP_COLOR[g.food_group] || '#999');

  if (donutChart) donutChart.destroy();
  const ctx = document.getElementById('donutChart').getContext('2d');
  donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }] },
    options: {
      cutout: '68%',
      plugins: { legend: { display: false }, tooltip: {
        callbacks: { label: ctx => ` ${ctx.label}: $${ctx.raw.toFixed(2)} (${food[ctx.dataIndex].percentage}%)` }
      }},
      animation: { animateRotate: true, duration: 700 },
    },
  });

  document.getElementById('spendingList').innerHTML = groups.map(g => `
    <div class="spending-row">
      <div class="spending-dot" style="background:${GROUP_COLOR[g.food_group] || '#999'}"></div>
      <div class="spending-label">${GROUP_EMOJI[g.food_group] || ''} ${GROUP_LABEL[g.food_group] || g.food_group}</div>
      <div class="spending-bar-wrap">
        <div class="spending-bar" style="width:${g.percentage}%; background:${GROUP_COLOR[g.food_group] || '#999'}"></div>
      </div>
      <div class="spending-pct">${g.percentage}%</div>
      <div class="spending-amount">$${g.total.toFixed(2)}</div>
    </div>
  `).join('');
}

// ── Weekly trend chart ─────────────────────────────────────────────────────
function renderTrend(weeks) {
  if (!weeks.length) {
    document.getElementById('trendSection').classList.add('hidden');
    return;
  }
  document.getElementById('trendSection').classList.remove('hidden');

  if (trendChart) trendChart.destroy();
  const ctx = document.getElementById('trendChart').getContext('2d');
  trendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: weeks.map(w => w.week),
      datasets: [{
        label: 'Spent ($)',
        data: weeks.map(w => w.total),
        backgroundColor: '#DCFCE7',
        borderColor: '#16A34A',
        borderWidth: 2,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: v => '$' + v }, grid: { color: '#F5F4F2' } },
        x: { grid: { display: false } },
      },
      animation: { duration: 700 },
    },
  });
}

// ── Nutrient gaps ──────────────────────────────────────────────────────────
function renderNutrientGaps(gaps) {
  const section = document.getElementById('gapsSection');

  if (!gaps.length) {
    section.innerHTML = `
      <div class="section-title"><span>What your body is missing</span></div>
      <div class="card">
        <div class="empty-state" style="padding:24px;">
          <span class="empty-icon">🎉</span>
          <p class="empty-title">All health areas covered!</p>
          <p class="empty-text">Your recent shop has a great variety of nutrients.</p>
        </div>
      </div>`;
    return;
  }

  document.getElementById('gapsCount').textContent = `${gaps.length} missing`;

  document.getElementById('gapsList').innerHTML = gaps.map(g => `
    <div class="gap-card">
      <div class="gap-header">
        <span class="gap-label">${g.label}</span>
        ${g.last_seen_days_ago !== null && g.last_seen_days_ago !== undefined
          ? `<span class="text-xs text-muted">Last seen ${g.last_seen_days_ago}d ago</span>`
          : `<span class="text-xs text-red">Not seen recently</span>`}
      </div>
      <div class="gap-body-parts">
        ${g.body_parts.map(p => `<span class="gap-body-tag">${p}</span>`).join('')}
      </div>
      <p class="gap-benefits">${g.health_benefits}</p>
      <p class="gap-sources">${g.food_sources}</p>
    </div>
  `).join('');
}

// ── Recent receipts ────────────────────────────────────────────────────────
function renderReceipts(receipts) {
  if (!receipts.length) {
    document.getElementById('receiptList').innerHTML = '<p class="text-muted text-sm" style="text-align:center;padding:16px;">No receipts in this period.</p>';
    return;
  }

  document.getElementById('receiptList').innerHTML = receipts.map(r => `
    <div class="receipt-row">
      <div class="receipt-thumb">🧾</div>
      <div class="receipt-info">
        <div class="receipt-store">${r.store_name || 'Grocery shop'}</div>
        <div class="receipt-date">${formatDate(r.purchased_at)}</div>
      </div>
      <div class="receipt-amount">${r.total_amount ? '$' + parseFloat(r.total_amount).toFixed(2) : '—'}</div>
    </div>
  `).join('');
}

// ── Period switcher ────────────────────────────────────────────────────────
function setPeriod(btn, days) {
  document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  currentPeriod = days;
  loadDashboard(days);
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function showToast(message, type = '') {
  const t = document.getElementById('toast');
  t.textContent = message;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

loadDashboard(currentPeriod);
