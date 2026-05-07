const FOOD_GROUPS = ['produce', 'protein', 'dairy', 'grains', 'snacks', 'beverages', 'condiments', 'non_food'];

const FOOD_GROUP_LABEL = {
  produce: 'Fruits & Veg', protein: 'Protein', dairy: 'Dairy',
  grains: 'Grains', snacks: 'Snacks', beverages: 'Drinks',
  condiments: 'Condiments', non_food: 'Non-food',
};

const FOOD_GROUP_EMOJI = {
  produce: '🥦', protein: '🥩', dairy: '🧀', grains: '🌾',
  snacks: '🍫', beverages: '🥤', condiments: '🫙', non_food: '🧹',
};

let receipt = null;
let activeFilter = 'all';

// ── Init ───────────────────────────────────────────────────────────────────
function init() {
  const raw = sessionStorage.getItem('pendingReceipt');
  if (!raw) {
    window.location.href = '/';
    return;
  }

  receipt = JSON.parse(raw);

  if (!receipt.items || receipt.items.length === 0) {
    document.getElementById('emptyState').classList.remove('hidden');
    return;
  }

  renderMeta();
  renderItems();

  document.getElementById('receiptMeta').style.display = '';
  document.getElementById('filterWrap').style.display = '';
  document.getElementById('saveSection').classList.remove('hidden');
}

// ── Meta header ────────────────────────────────────────────────────────────
function renderMeta() {
  document.getElementById('metaStore').textContent = receipt.store_name || 'Grocery shop';
  document.getElementById('metaDate').textContent  = formatDate(receipt.purchased_at);
  document.getElementById('metaTotal').textContent = receipt.total_amount
    ? '$' + parseFloat(receipt.total_amount).toFixed(2) : '—';

  const foodItems = receipt.items.filter(i => i.food_group !== 'non_food');
  document.getElementById('metaCount').textContent = `${receipt.items.length} items`;

  document.getElementById('pageTitle').textContent =
    `We found ${receipt.items.length} item${receipt.items.length !== 1 ? 's' : ''}`;
  document.getElementById('pageSubtitle').textContent =
    `${foodItems.length} food items and ${receipt.items.length - foodItems.length} non-food items. Fix anything that looks off.`;
}

// ── Render items ───────────────────────────────────────────────────────────
function renderItems() {
  const list    = document.getElementById('itemsList');
  const filtered = activeFilter === 'all'
    ? receipt.items
    : receipt.items.filter(i => i.food_group === activeFilter);

  if (filtered.length === 0) {
    list.innerHTML = `<p class="text-muted text-sm" style="text-align:center;padding:24px 0;">No items in this category.</p>`;
    return;
  }

  list.innerHTML = filtered.map((item, idx) => {
    const realIdx = receipt.items.indexOf(item);
    return `
      <div class="item-card ${item.confidence === 'low' ? 'low-confidence' : ''}" id="item-${realIdx}">
        <div>
          <span class="item-badge badge-${item.food_group}">
            ${FOOD_GROUP_EMOJI[item.food_group] || '•'} ${FOOD_GROUP_LABEL[item.food_group] || item.food_group}
          </span>
        </div>
        <div class="item-info">
          <div class="item-name">${escapeHtml(item.name)}</div>
          <div class="item-meta">${item.quantity ? item.quantity + (item.unit ? ' ' + item.unit : '') + ' · ' : ''}${item.confidence === 'low' ? '⚠️ Low confidence' : ''}</div>
        </div>
        <div class="item-price">$${parseFloat(item.price).toFixed(2)}</div>
        <div class="item-actions">
          <select class="group-select" onchange="changeGroup(${realIdx}, this.value)" title="Change category">
            ${FOOD_GROUPS.map(g => `<option value="${g}" ${g === item.food_group ? 'selected' : ''}>${FOOD_GROUP_EMOJI[g]} ${FOOD_GROUP_LABEL[g]}</option>`).join('')}
          </select>
          <button class="btn btn-danger btn-sm" onclick="removeItem(${realIdx})" title="Remove item">✕</button>
        </div>
      </div>
    `;
  }).join('');
}

// ── Filter tabs ────────────────────────────────────────────────────────────
function filterItems(btn, group) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  activeFilter = group;
  renderItems();
}

// ── Edit actions ───────────────────────────────────────────────────────────
function changeGroup(idx, newGroup) {
  receipt.items[idx].food_group = newGroup;
  renderItems();
}

function removeItem(idx) {
  receipt.items.splice(idx, 1);
  renderMeta();
  renderItems();
  if (receipt.items.length === 0) {
    document.getElementById('saveSection').classList.add('hidden');
    document.getElementById('emptyState').classList.remove('hidden');
  }
}

// ── Save ───────────────────────────────────────────────────────────────────
async function saveReceipt() {
  document.getElementById('loadingText').textContent = 'Saving your receipt…';
  document.getElementById('loadingOverlay').classList.remove('hidden');

  const payload = {
    store_name:   receipt.store_name,
    purchased_at: receipt.purchased_at,
    total_amount: receipt.total_amount,
    image_url:    receipt.image_url,
    items:        receipt.items,
  };

  try {
    const res = await fetch('/api/receipts/confirm', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    const data = await res.json();
    document.getElementById('loadingOverlay').classList.add('hidden');

    if (!res.ok) {
      showToast(data.detail || 'Something went wrong — try again.', 'error');
      return;
    }

    sessionStorage.removeItem('pendingReceipt');
    window.location.href = '/dashboard';

  } catch {
    document.getElementById('loadingOverlay').classList.add('hidden');
    showToast('No connection — check your internet and try again.', 'error');
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showToast(message, type = '') {
  const t = document.getElementById('toast');
  t.textContent = message;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

init();
