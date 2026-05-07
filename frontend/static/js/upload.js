const FOOD_GROUP_EMOJI = {
  produce: '🥦', protein: '🥩', dairy: '🧀', grains: '🌾',
  snacks: '🍫', beverages: '🥤', condiments: '🫙', non_food: '🧹',
};

// ── Toast ──────────────────────────────────────────────────────────────────
function showToast(message, type = '') {
  const t = document.getElementById('toast');
  t.textContent = message;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ── Loading ────────────────────────────────────────────────────────────────
function showLoading(text = 'Reading your receipt…') {
  document.getElementById('loadingText').textContent = text;
  document.getElementById('loadingOverlay').classList.remove('hidden');
}
function hideLoading() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}

// ── Upload & parse receipt ─────────────────────────────────────────────────
async function uploadReceipt(file) {
  if (!file) return;

  showLoading('Reading your receipt…');

  const form = new FormData();
  form.append('file', file);

  let data;
  try {
    const res = await fetch('/api/receipts/upload', { method: 'POST', body: form });
    data = await res.json();

    if (!res.ok) {
      hideLoading();
      showToast(data.detail || 'Something went wrong — try again.', 'error');
      return;
    }
  } catch {
    hideLoading();
    showToast('No connection — check your internet and try again.', 'error');
    return;
  }

  // Store parsed receipt in session so the review page can read it
  sessionStorage.setItem('pendingReceipt', JSON.stringify(data));
  window.location.href = '/review';
}

// ── File input listeners ───────────────────────────────────────────────────
function attachFileListener(inputId) {
  const input = document.getElementById(inputId);
  if (input) input.addEventListener('change', e => uploadReceipt(e.target.files[0]));
}

attachFileListener('fileInput');
attachFileListener('cameraInput');
attachFileListener('galleryInput');

// ── Drag & drop ────────────────────────────────────────────────────────────
const zone = document.getElementById('uploadZone');

zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
zone.addEventListener('drop', e => {
  e.preventDefault();
  zone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) uploadReceipt(file);
});

// ── Load recent receipts ───────────────────────────────────────────────────
async function loadRecent() {
  let receipts;
  try {
    const res = await fetch('/api/receipts');
    receipts = await res.json();
  } catch {
    return;
  }

  const list = document.getElementById('recentList');
  if (!receipts.length) return;

  list.innerHTML = receipts.slice(0, 5).map(r => `
    <div class="receipt-row" onclick="window.location='/review?id=${r.id}'">
      <div class="receipt-thumb">${FOOD_GROUP_EMOJI.produce}</div>
      <div class="receipt-info">
        <div class="receipt-store">${r.store_name || 'Grocery shop'}</div>
        <div class="receipt-date">${formatDate(r.purchased_at)}</div>
      </div>
      <div class="receipt-amount">${r.total_amount ? '$' + parseFloat(r.total_amount).toFixed(2) : '—'}</div>
    </div>
  `).join('');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

loadRecent();
