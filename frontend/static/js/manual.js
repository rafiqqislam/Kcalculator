/* Manual grocery item entry */

const FOOD_GROUP_LABEL = {
  produce:    'Produce',
  protein:    'Protein',
  dairy:      'Dairy',
  grains:     'Grains',
  snacks:     'Snacks',
  beverages:  'Beverages',
  condiments: 'Condiments',
  non_food:   'Non-food',
};

const FOOD_GROUP_EMOJI = {
  produce:    '🥦',
  protein:    '🥩',
  dairy:      '🥛',
  grains:     '🌾',
  snacks:     '🍿',
  beverages:  '🧃',
  condiments: '🫙',
  non_food:   '🧴',
};

let items = [];          // { name, price, quantity, unit, food_group, nutrient_tags }
let currentClassify = null; // latest classify result for the current name

// ── Debounce helper ────────────────────────────────────────────────────────
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ── DOM refs ───────────────────────────────────────────────────────────────
const nameInput       = document.getElementById('itemName');
const priceInput      = document.getElementById('itemPrice');
const qtyInput        = document.getElementById('itemQty');
const unitInput       = document.getElementById('itemUnit');
const addBtn          = document.getElementById('addBtn');
const classifyResult  = document.getElementById('classifyResult');
const foodGroupBadge  = document.getElementById('foodGroupBadge');
const nutrientTagsEl  = document.getElementById('nutrientTags');
const classifySpinner = document.getElementById('classifySpinner');
const itemListSection = document.getElementById('itemListSection');
const itemListEl      = document.getElementById('itemList');
const itemCountEl     = document.getElementById('itemCount');
const storeNameInput  = document.getElementById('storeName');
const purchaseDateInput = document.getElementById('purchaseDate');
const saveBtn         = document.getElementById('saveBtn');

// Default date to today
purchaseDateInput.value = new Date().toISOString().slice(0, 10);

// ── Classify via API ───────────────────────────────────────────────────────
async function classify(name) {
  if (!name.trim()) {
    classifyResult.style.display = 'none';
    addBtn.disabled = true;
    currentClassify = null;
    return;
  }

  classifySpinner.style.display = 'block';
  try {
    const res = await fetch('/api/items/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    currentClassify = data;

    const group = data.food_group;
    foodGroupBadge.textContent = `${FOOD_GROUP_EMOJI[group] || ''} ${FOOD_GROUP_LABEL[group] || group}`;
    foodGroupBadge.className = `badge badge-${group}`;

    nutrientTagsEl.innerHTML = (data.nutrient_tags || [])
      .map(t => `<span class="tag">${t.replace(/_/g, ' ')}</span>`)
      .join('');

    classifyResult.style.display = 'block';
    addBtn.disabled = false;
  } catch {
    classifyResult.style.display = 'none';
    currentClassify = null;
    addBtn.disabled = true;
  } finally {
    classifySpinner.style.display = 'none';
  }
}

const debouncedClassify = debounce(classify, 500);

nameInput.addEventListener('input', () => {
  addBtn.disabled = true;
  debouncedClassify(nameInput.value);
});

// ── Add item to running list ───────────────────────────────────────────────
addBtn.addEventListener('click', () => {
  if (!currentClassify) return;

  const name  = nameInput.value.trim();
  const price = parseFloat(priceInput.value) || 0;
  const qty   = parseFloat(qtyInput.value) || 1;
  const unit  = unitInput.value.trim() || null;

  items.push({
    name,
    price,
    quantity: qty,
    unit,
    food_group:    currentClassify.food_group,
    nutrient_tags: currentClassify.nutrient_tags || [],
    confidence:    'high',
  });

  renderList();

  // Reset form
  nameInput.value  = '';
  priceInput.value = '';
  qtyInput.value   = '';
  unitInput.value  = '';
  classifyResult.style.display = 'none';
  addBtn.disabled  = true;
  currentClassify  = null;
  nameInput.focus();
});

// ── Render running list ────────────────────────────────────────────────────
function renderList() {
  itemListSection.style.display = items.length ? 'block' : 'none';
  itemCountEl.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;

  itemListEl.innerHTML = items.map((item, i) => `
    <div class="receipt-row${i < items.length - 1 ? ' receipt-row-border' : ''}">
      <div style="flex:1;">
        <span style="font-weight:600; color:var(--text-primary);">${escHtml(item.name)}</span>
        <span class="badge badge-${item.food_group}" style="margin-left:8px; font-size:11px;">
          ${FOOD_GROUP_EMOJI[item.food_group] || ''} ${FOOD_GROUP_LABEL[item.food_group] || item.food_group}
        </span>
        <div style="font-size:12px; color:var(--text-secondary); margin-top:3px;">
          Qty: ${item.quantity}${item.unit ? ' ' + item.unit : ''}
        </div>
      </div>
      <span style="font-size:15px; font-weight:700; color:var(--text-primary); margin-right:16px;">
        ${item.price ? '$' + item.price.toFixed(2) : '—'}
      </span>
      <button class="btn btn-ghost btn-sm" onclick="removeItem(${i})" style="color:var(--red);">✕</button>
    </div>
  `).join('');
}

function removeItem(i) {
  items.splice(i, 1);
  renderList();
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Save all items ─────────────────────────────────────────────────────────
saveBtn.addEventListener('click', async () => {
  if (!items.length) return;

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  const total = items.reduce((s, i) => s + (i.price * i.quantity), 0);
  const payload = {
    store_name:   storeNameInput.value.trim() || 'Manual entry',
    purchased_at: purchaseDateInput.value || new Date().toISOString().slice(0, 10),
    total_amount: parseFloat(total.toFixed(2)),
    items,
  };

  try {
    const res = await fetch('/api/receipts/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Save failed');
    }
    showToast('Items saved! Redirecting…', 'success');
    setTimeout(() => { window.location.href = '/dashboard'; }, 1200);
  } catch (err) {
    showToast(err.message || 'Something went wrong — please try again.', 'error');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save all items';
  }
});

// ── Toast ──────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast toast-${type} show`;
  setTimeout(() => { el.className = 'toast'; }, 3500);
}
