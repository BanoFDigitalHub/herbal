// =========================================================
// Herbal Power Admin Panel - Main App
// =========================================================

const TOKEN = localStorage.getItem('vc_admin_token');
if (!TOKEN) location.href = '/admin/login.html';

const API = '/api';
const authHeaders = () => ({ 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' });

// ---------- TOAST ----------
const toast = document.getElementById('toast');
function showToast(msg, type = '') {
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ---------- API ----------
async function api(path, opts = {}) {
  const cfg = { ...opts, headers: { ...authHeaders(), ...(opts.headers || {}) } };
  if (cfg.body && typeof cfg.body !== 'string' && !(cfg.body instanceof FormData)) {
    cfg.body = JSON.stringify(cfg.body);
  }
  if (cfg.body instanceof FormData) {
    delete cfg.headers['Content-Type'];
  }
  const res = await fetch(API + path, cfg);
  if (res.status === 401) {
    localStorage.removeItem('vc_admin_token');
    location.href = '/admin/login.html';
    return;
  }
  return res.json();
}

async function uploadFile(path, file, fieldName = 'image') {
  const fd = new FormData();
  fd.append(fieldName, file);
  return api(path, { method: 'POST', body: fd });
}

// ---------- NAV ----------
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    const view = link.dataset.view;
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('view' + view.charAt(0).toUpperCase() + view.slice(1)).classList.remove('hidden');
    document.getElementById('pageTitle').textContent = link.textContent.trim();
    if (window.innerWidth < 900) document.getElementById('sidebar').classList.remove('open');
    loadView(view);
  });
});

// mobile menu
document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlayMob').classList.toggle('show');
});
document.getElementById('overlayMob').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlayMob').classList.remove('show');
});

// logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  if (confirm('Sign out?')) {
    localStorage.removeItem('vc_admin_token');
    location.href = '/admin/login.html';
  }
});

// ---------- MODAL ----------
const modal = document.getElementById('modal');
function openModal(title, bodyHtml, footHtml = '') {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  document.getElementById('modalFoot').innerHTML = footHtml;
  modal.classList.add('show');
}
function closeModal() { modal.classList.remove('show'); }
document.getElementById('modalClose').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

// ---------- VIEW LOADER ----------
function loadView(name) {
  if (name === 'dashboard') return loadDashboard();
  if (name === 'orders') return loadOrders();
  if (name === 'products') return loadProducts();
  if (name === 'inventory') return loadInventory();
  if (name === 'categories') return loadCategories();
}

// helpers
const fmt = n => 'Rs. ' + Number(n || 0).toLocaleString('en-PK');
const date = d => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
const datetime = d => new Date(d).toLocaleString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const escapeHtml = s => String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const imgSrc = src => !src ? '' : (src.startsWith('http') ? src : src);

// =========================================================
// DASHBOARD
// =========================================================
async function loadDashboard() {
  const root = document.getElementById('viewDashboard');
  root.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

  const data = await api('/orders/stats/overview');
  if (!data || !data.success) { root.innerHTML = '<div class="empty"><h4>Could not load</h4></div>'; return; }
  const s = data.stats;

  root.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon"><svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke-linecap="round" stroke-linejoin="round"/><line x1="3" y1="6" x2="21" y2="6" stroke-linecap="round"/></svg></div>
        <div class="stat-label">Total Orders</div>
        <div class="stat-value">${s.totalOrders}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
        <div class="stat-label">Pending</div>
        <div class="stat-value">${s.pendingOrders}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
        <div class="stat-label">Delivered</div>
        <div class="stat-value">${s.deliveredOrders}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
        <div class="stat-label">Revenue</div>
        <div class="stat-value">${fmt(s.totalRevenue)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>
        <div class="stat-label">Products</div>
        <div class="stat-value">${s.totalProducts}</div>
      </div>
      <div class="stat-card ${s.lowStock > 0 ? 'danger' : ''}">
        <div class="stat-icon"><svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
        <div class="stat-label">Low Stock</div>
        <div class="stat-value">${s.lowStock}</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head"><h3>Last 7 Days</h3></div>
      <div class="panel-body">
        ${s.recent.length === 0 ? '<div class="empty"><p>No recent orders</p></div>' :
          `<div class="table-wrap"><table>
            <thead><tr><th>Date</th><th>Orders</th><th>Revenue</th></tr></thead>
            <tbody>${s.recent.map(r => `<tr><td>${r._id}</td><td>${r.orders}</td><td>${fmt(r.revenue)}</td></tr>`).join('')}</tbody>
          </table></div>`
        }
      </div>
    </div>
  `;
}

// =========================================================
// ORDERS
// =========================================================
let ordersCache = [];
async function loadOrders() {
  const root = document.getElementById('viewOrders');
  root.innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <h3>All Orders</h3>
        <div class="filters">
          <select id="orderStatusFilter">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input type="text" id="orderSearch" placeholder="Search name/phone/order#">
        </div>
      </div>
      <div class="panel-body" id="ordersList"><div class="loader"><div class="spinner"></div></div></div>
    </div>
  `;

  document.getElementById('orderStatusFilter').addEventListener('change', renderOrders);
  document.getElementById('orderSearch').addEventListener('input', renderOrders);

  const data = await api('/orders');
  ordersCache = data.success ? data.orders : [];
  renderOrders();
}

function renderOrders() {
  const list = document.getElementById('ordersList');
  const status = document.getElementById('orderStatusFilter').value;
  const search = document.getElementById('orderSearch').value.toLowerCase();

  let rows = ordersCache;
  if (status) rows = rows.filter(o => o.status === status);
  if (search) rows = rows.filter(o =>
    (o.customerName || '').toLowerCase().includes(search) ||
    (o.phone || '').includes(search) ||
    (o.orderNumber || '').toLowerCase().includes(search)
  );

  if (!rows.length) {
    list.innerHTML = '<div class="empty"><h4>No orders</h4><p>Orders will appear here</p></div>';
    return;
  }

  list.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Order#</th><th>Customer</th><th>Phone</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th></th></tr></thead>
    <tbody>${rows.map(o => `
      <tr>
        <td><b>${o.orderNumber}</b></td>
        <td>${escapeHtml(o.customerName)}</td>
        <td>${escapeHtml(o.phone)}</td>
        <td>${o.items.length}</td>
        <td><b>${fmt(o.total)}</b></td>
        <td><span class="badge badge-${o.status}">${o.status}</span></td>
        <td>${datetime(o.createdAt)}</td>
        <td><button class="btn btn-sm btn-light" onclick="viewOrder('${o._id}')">View</button></td>
      </tr>
    `).join('')}</tbody>
  </table></div>`;
}

window.viewOrder = function(id) {
  const o = ordersCache.find(x => x._id === id);
  if (!o) return;

  const itemsHtml = o.items.map(i => `
    <div class="order-item">
      <img src="${imgSrc(i.image)}" alt="" onerror="this.style.background='#f0ede8';this.src='';">
      <div class="order-item-info">
        <b>${escapeHtml(i.productName)}</b>
        <span>${i.variant ? escapeHtml(i.variant) + ' · ' : ''}Qty: ${i.quantity} · ${fmt(i.price)}</span>
      </div>
      <div><b>${fmt(i.subtotal)}</b></div>
    </div>
  `).join('');

  const body = `
    <div class="order-section">
      <h4>Order Info</h4>
      <div class="order-row"><span class="label">Order #</span><b>${o.orderNumber}</b></div>
      <div class="order-row"><span class="label">Date</span><span>${datetime(o.createdAt)}</span></div>
      <div class="order-row"><span class="label">Status</span><span class="badge badge-${o.status}">${o.status}</span></div>
    </div>
    <div class="order-section">
      <h4>Customer</h4>
      <div class="order-row"><span class="label">Name</span><span>${escapeHtml(o.customerName)}</span></div>
      <div class="order-row"><span class="label">Phone</span><span>${escapeHtml(o.phone)}</span></div>
      ${o.email ? `<div class="order-row"><span class="label">Email</span><span>${escapeHtml(o.email)}</span></div>` : ''}
      <div class="order-row"><span class="label">City</span><span>${escapeHtml(o.city)}</span></div>
      <div class="order-row"><span class="label">Address</span><span style="text-align:right;max-width:60%;">${escapeHtml(o.address)}</span></div>
      ${o.notes ? `<div class="order-row"><span class="label">Notes</span><span style="text-align:right;max-width:60%;">${escapeHtml(o.notes)}</span></div>` : ''}
    </div>
    <div class="order-section">
      <h4>Items</h4>
      <div class="order-items">${itemsHtml}</div>
    </div>
    <div class="order-section">
      <div class="order-row"><span class="label">Subtotal</span><span>${fmt(o.subtotal)}</span></div>
      <div class="order-row"><span class="label">Delivery</span><span>${fmt(o.deliveryFee)}</span></div>
      <div class="order-row" style="border-top:1px solid #f0ede8;padding-top:10px;margin-top:6px;font-size:15px;"><b>Total</b><b>${fmt(o.total)}</b></div>
    </div>
    <div class="order-section">
      <h4>Update Status</h4>
      <div class="form-group">
        <select id="orderNewStatus">
          ${['pending','confirmed','processing','shipped','delivered','cancelled'].map(s => `<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <a href="https://wa.me/${o.phone.replace(/\D/g,'')}" target="_blank" class="btn btn-sm btn-light">Open WhatsApp</a>
    </div>
  `;

  const foot = `
    <button class="btn btn-danger btn-sm" onclick="deleteOrder('${o._id}')">Delete</button>
    <button class="btn btn-light btn-sm" onclick="closeModal()">Close</button>
    <button class="btn btn-primary btn-sm" onclick="updateOrderStatus('${o._id}')">Save Status</button>
  `;
  openModal('Order Details', body, foot);
};

window.updateOrderStatus = async function(id) {
  const status = document.getElementById('orderNewStatus').value;
  const r = await api(`/orders/${id}/status`, { method: 'PATCH', body: { status } });
  if (r.success) { showToast('Status updated', 'success'); closeModal(); loadOrders(); }
  else showToast('Failed', 'error');
};

window.deleteOrder = async function(id) {
  if (!confirm('Delete this order?')) return;
  const r = await api(`/orders/${id}`, { method: 'DELETE' });
  if (r.success) { showToast('Order deleted', 'success'); closeModal(); loadOrders(); }
};

// initial
loadDashboard();

// =========================================================
// PRODUCTS
// =========================================================
let productsCache = [];
let categoriesCache = [];

async function loadProducts() {
  const root = document.getElementById('viewProducts');
  root.innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <h3>All Products</h3>
        <div class="filters">
          <select id="prodCatFilter"><option value="">All Categories</option></select>
          <input type="text" id="prodSearch" placeholder="Search...">
          <button class="btn btn-primary" id="addProdBtn">+ Add Product</button>
        </div>
      </div>
      <div class="panel-body" id="productsList"><div class="loader"><div class="spinner"></div></div></div>
    </div>
  `;

  document.getElementById('addProdBtn').addEventListener('click', () => openProductForm());
  document.getElementById('prodCatFilter').addEventListener('change', renderProducts);
  document.getElementById('prodSearch').addEventListener('input', renderProducts);

  await loadCategoriesCache();
  const catSel = document.getElementById('prodCatFilter');
  categoriesCache.forEach(c => {
    const o = document.createElement('option');
    o.value = c._id; o.textContent = c.name;
    catSel.appendChild(o);
  });

  const data = await api('/products/admin/all');
  productsCache = data.success ? data.products : [];
  renderProducts();
}

async function loadCategoriesCache() {
  const c = await api('/categories/all');
  categoriesCache = c.success ? c.categories : [];
}

function renderProducts() {
  const list = document.getElementById('productsList');
  const cat = document.getElementById('prodCatFilter').value;
  const search = document.getElementById('prodSearch').value.toLowerCase();

  let rows = productsCache;
  if (cat) rows = rows.filter(p => p.category && p.category._id === cat);
  if (search) rows = rows.filter(p => (p.name || '').toLowerCase().includes(search));

  if (!rows.length) {
    list.innerHTML = '<div class="empty"><svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg><h4>No products yet</h4><p>Click "Add Product" to start</p></div>';
    return;
  }

  list.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th></th><th>Name</th><th>Code</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows.map(p => `
      <tr>
        <td><img class="thumb" src="${imgSrc(p.mainImage)}" onerror="this.style.background='#f0ede8';this.src='';"></td>
        <td><b>${escapeHtml(p.name)}</b>${p.isFeatured ? ' <span class="badge badge-default">Featured</span>' : ''}</td>
        <td>${p.productCode}</td>
        <td>${p.category ? escapeHtml(p.category.name) : '-'}</td>
        <td>${p.discountPrice > 0 ? `<b>${fmt(p.discountPrice)}</b><br><small style="text-decoration:line-through;color:#aaa;">${fmt(p.price)}</small>` : `<b>${fmt(p.price)}</b>`}</td>
        <td><span class="badge ${p.stock <= 5 ? 'badge-stock-low' : 'badge-stock-ok'}">${p.stock}</span></td>
        <td>${p.active ? '<span class="badge badge-stock-ok">Active</span>' : '<span class="badge badge-cancelled">Hidden</span>'}</td>
        <td>
          <button class="btn btn-sm btn-light" onclick="editProduct('${p._id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p._id}')">Del</button>
        </td>
      </tr>
    `).join('')}</tbody>
  </table></div>`;
}

window.editProduct = id => openProductForm(id);
window.deleteProduct = async id => {
  if (!confirm('Delete this product?')) return;
  const r = await api(`/products/${id}`, { method: 'DELETE' });
  if (r.success) { showToast('Product deleted', 'success'); loadProducts(); }
};

// ---- PRODUCT FORM (full page form, not popup) ----
async function openProductForm(id = null) {
  const root = document.getElementById('viewProducts');
  let product = {
    name: '', shortDescription: '', description: '', mainImage: '', gallery: [],
    category: categoriesCache[0]?._id || '', price: 0, discountPrice: 0, stock: 0,
    saleTag: 'SALE', isFeatured: false, isBestSeller: false, active: true,
    variants: [], details: [], reviews: []
  };

  if (id) {
    const r = await api(`/products/${id}`);
    if (r.success) product = r.product;
  }

  root.innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <h3>${id ? 'Edit Product' : 'Add New Product'}</h3>
        <button class="btn btn-light btn-sm" id="cancelProdBtn">← Back</button>
      </div>
      <div class="panel-body">
        <form id="productForm">
          <div class="form-grid">
            <div class="form-group">
              <label>Product Name *</label>
              <input type="text" name="name" value="${escapeHtml(product.name)}" required>
            </div>
            <div class="form-group">
              <label>Category *</label>
              <select name="category" required>
                ${categoriesCache.map(c => `<option value="${c._id}" ${product.category && (product.category._id || product.category) === c._id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Price (Rs.) *</label>
              <input type="number" name="price" value="${product.price || 0}" min="0" required>
            </div>
            <div class="form-group">
              <label>Discount Price (Rs.)</label>
              <input type="number" name="discountPrice" value="${product.discountPrice || 0}" min="0">
            </div>
            <div class="form-group">
              <label>Stock</label>
              <input type="number" name="stock" value="${product.stock || 0}" min="0">
            </div>
            <div class="form-group">
              <label>Sale Tag</label>
              <select name="saleTag">
                ${['', 'SALE', 'NEW', 'POPULAR', 'BEST'].map(t => `<option value="${t}" ${product.saleTag === t ? 'selected' : ''}>${t || '— None —'}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Short Description</label>
            <textarea name="shortDescription" rows="2">${escapeHtml(product.shortDescription)}</textarea>
          </div>

          <div class="form-group">
            <label>Full Description</label>
            <textarea name="description" rows="5">${escapeHtml(product.description)}</textarea>
          </div>

          <!-- MAIN IMAGE PICKER -->
          <div class="form-group">
            <label>Main Image *</label>
            <div class="image-picker">
              <div class="tabs">
                <button type="button" class="tab active" data-tab-target="mainImg" data-tab="link">By Link</button>
                <button type="button" class="tab" data-tab-target="mainImg" data-tab="upload">Upload</button>
              </div>
              <div data-tab-content="mainImg-link">
                <input type="text" id="mainImgLink" placeholder="https://..." value="${escapeHtml(product.mainImage)}">
              </div>
              <div data-tab-content="mainImg-upload" class="hidden">
                <input type="file" id="mainImgFile" accept="image/*">
              </div>
              <div style="margin-top:10px;">
                <img id="mainImgPreview" class="preview-img" src="${imgSrc(product.mainImage)}" onerror="this.src=''">
              </div>
            </div>
          </div>

          <!-- GALLERY -->
          <div class="form-group">
            <label>Gallery Images</label>
            <div class="image-picker">
              <div class="tabs">
                <button type="button" class="tab active" data-tab-target="gallery" data-tab="link">Add by Link</button>
                <button type="button" class="tab" data-tab-target="gallery" data-tab="upload">Upload Multiple</button>
              </div>
              <div data-tab-content="gallery-link">
                <div class="dynamic-row">
                  <input type="text" id="galleryLinkInput" placeholder="https://...">
                  <button type="button" class="btn btn-sm btn-light" id="addGalleryLink">Add</button>
                </div>
              </div>
              <div data-tab-content="gallery-upload" class="hidden">
                <input type="file" id="galleryFiles" accept="image/*" multiple>
              </div>
              <div class="gallery-grid" id="galleryGrid"></div>
            </div>
          </div>

          <!-- VARIANTS -->
          <div class="form-group">
            <label>Variants (e.g. 30g, 60g, 100g)</label>
            <div id="variantsList"></div>
            <button type="button" class="add-row-btn" id="addVariantBtn">+ Add Variant</button>
          </div>

          <!-- DETAILS -->
          <div class="form-group">
            <label>Additional Details (Key / Value)</label>
            <div id="detailsList"></div>
            <button type="button" class="add-row-btn" id="addDetailBtn">+ Add Detail</button>
          </div>

          <!-- REVIEWS -->
          <div class="form-group">
            <label>Reviews</label>
            <div id="reviewsList"></div>
            <button type="button" class="add-row-btn" id="addReviewBtn">+ Add Review</button>
          </div>

          <div class="checkbox-row">
            <div class="checkbox-group"><input type="checkbox" id="isFeatured" ${product.isFeatured ? 'checked' : ''}><label for="isFeatured">Featured Product</label></div>
            <div class="checkbox-group"><input type="checkbox" id="isBestSeller" ${product.isBestSeller ? 'checked' : ''}><label for="isBestSeller">Best Seller</label></div>
            <div class="checkbox-group"><input type="checkbox" id="active" ${product.active ? 'checked' : ''}><label for="active">Active (visible on site)</label></div>
          </div>

          <div style="margin-top:24px;display:flex;gap:10px;">
            <button type="submit" class="btn btn-primary">${id ? 'Update Product' : 'Create Product'}</button>
            <button type="button" class="btn btn-light" id="cancelProdBtn2">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('cancelProdBtn').addEventListener('click', loadProducts);
  document.getElementById('cancelProdBtn2').addEventListener('click', loadProducts);

  // tabs switching
  document.querySelectorAll('[data-tab-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tabTarget;
      const tab = btn.dataset.tab;
      document.querySelectorAll(`[data-tab-target="${target}"]`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll(`[data-tab-content^="${target}-"]`).forEach(c => c.classList.add('hidden'));
      document.querySelector(`[data-tab-content="${target}-${tab}"]`).classList.remove('hidden');
    });
  });

  // main image: link change updates preview
  const mainImgLink = document.getElementById('mainImgLink');
  const mainImgFile = document.getElementById('mainImgFile');
  const mainImgPreview = document.getElementById('mainImgPreview');
  mainImgLink.addEventListener('input', () => {
    mainImgPreview.src = mainImgLink.value;
    mainImgFile.value = '';
  });
  mainImgFile.addEventListener('change', async () => {
    if (!mainImgFile.files[0]) return;
    showToast('Uploading...');
    const r = await uploadFile('/products/upload', mainImgFile.files[0], 'image');
    if (r.success) {
      mainImgLink.value = r.url;
      mainImgPreview.src = r.url;
      showToast('Uploaded', 'success');
    } else { showToast('Upload failed', 'error'); }
  });

  // gallery
  const galleryGrid = document.getElementById('galleryGrid');
  let gallery = [...(product.gallery || [])];
  function renderGallery() {
    galleryGrid.innerHTML = gallery.map((g, i) => `
      <div class="gallery-item">
        <img src="${imgSrc(g)}" onerror="this.src=''">
        <button type="button" class="gallery-remove" data-i="${i}">×</button>
      </div>
    `).join('');
    galleryGrid.querySelectorAll('.gallery-remove').forEach(b => {
      b.addEventListener('click', () => {
        gallery.splice(parseInt(b.dataset.i), 1);
        renderGallery();
      });
    });
  }
  renderGallery();

  document.getElementById('addGalleryLink').addEventListener('click', () => {
    const v = document.getElementById('galleryLinkInput').value.trim();
    if (!v) return;
    gallery.push(v);
    document.getElementById('galleryLinkInput').value = '';
    renderGallery();
  });

  document.getElementById('galleryFiles').addEventListener('change', async (e) => {
    if (!e.target.files.length) return;
    showToast('Uploading...');
    const fd = new FormData();
    Array.from(e.target.files).forEach(f => fd.append('images', f));
    const res = await fetch('/api/products/upload-gallery', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + TOKEN },
      body: fd
    });
    const r = await res.json();
    if (r.success) {
      gallery = [...gallery, ...r.urls];
      renderGallery();
      showToast('Uploaded', 'success');
    } else showToast('Upload failed', 'error');
    e.target.value = '';
  });

  // VARIANTS
  const variantsList = document.getElementById('variantsList');
  let variants = [...(product.variants || [])];
  function renderVariants() {
    variantsList.innerHTML = variants.map((v, i) => `
      <div class="dynamic-row">
        <input type="text" placeholder="Name (e.g. 30g)" value="${escapeHtml(v.name||'')}" data-vk="name" data-vi="${i}">
        <input type="number" placeholder="Price" value="${v.price||0}" data-vk="price" data-vi="${i}" style="max-width:100px;">
        <input type="number" placeholder="Discount" value="${v.discountPrice||0}" data-vk="discountPrice" data-vi="${i}" style="max-width:100px;">
        <input type="number" placeholder="Stock" value="${v.stock||0}" data-vk="stock" data-vi="${i}" style="max-width:80px;">
        <button type="button" class="remove-row" data-vi="${i}">×</button>
      </div>
    `).join('');
    variantsList.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = parseInt(inp.dataset.vi);
        const k = inp.dataset.vk;
        variants[idx][k] = k === 'name' ? inp.value : parseFloat(inp.value) || 0;
      });
    });
    variantsList.querySelectorAll('.remove-row').forEach(b => {
      b.addEventListener('click', () => {
        variants.splice(parseInt(b.dataset.vi), 1);
        renderVariants();
      });
    });
  }
  renderVariants();
  document.getElementById('addVariantBtn').addEventListener('click', () => {
    variants.push({ name: '', price: 0, discountPrice: 0, stock: 0 });
    renderVariants();
  });

  // DETAILS
  const detailsList = document.getElementById('detailsList');
  let details = [...(product.details || [])];
  function renderDetails() {
    detailsList.innerHTML = details.map((d, i) => `
      <div class="dynamic-row">
        <input type="text" placeholder="Key (e.g. Weight)" value="${escapeHtml(d.key||'')}" data-dk="key" data-di="${i}">
        <input type="text" placeholder="Value (e.g. 30g)" value="${escapeHtml(d.value||'')}" data-dk="value" data-di="${i}">
        <button type="button" class="remove-row" data-di="${i}">×</button>
      </div>
    `).join('');
    detailsList.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', () => {
        details[parseInt(inp.dataset.di)][inp.dataset.dk] = inp.value;
      });
    });
    detailsList.querySelectorAll('.remove-row').forEach(b => {
      b.addEventListener('click', () => {
        details.splice(parseInt(b.dataset.di), 1);
        renderDetails();
      });
    });
  }
  renderDetails();
  document.getElementById('addDetailBtn').addEventListener('click', () => {
    details.push({ key: '', value: '' });
    renderDetails();
  });

  // REVIEWS
  const reviewsList = document.getElementById('reviewsList');
  let reviews = [...(product.reviews || [])];
  function renderReviews() {
    reviewsList.innerHTML = reviews.map((r, i) => `
      <div style="border:1px solid #e5e2dd;padding:10px;border-radius:3px;margin-bottom:8px;">
        <div class="dynamic-row" style="margin-bottom:6px;">
          <input type="text" placeholder="Name" value="${escapeHtml(r.name||'')}" data-rk="name" data-ri="${i}">
          <input type="text" placeholder="City" value="${escapeHtml(r.city||'')}" data-rk="city" data-ri="${i}" style="max-width:120px;">
          <input type="number" placeholder="Rating 1-5" min="1" max="5" value="${r.rating||5}" data-rk="rating" data-ri="${i}" style="max-width:80px;">
          <button type="button" class="remove-row" data-ri="${i}">×</button>
        </div>
        <textarea placeholder="Review text" data-rk="text" data-ri="${i}" rows="2" style="width:100%;padding:8px;border:1px solid #e5e2dd;font-family:inherit;font-size:13px;border-radius:3px;background:#faf9f7;">${escapeHtml(r.text||'')}</textarea>
      </div>
    `).join('');
    reviewsList.querySelectorAll('input, textarea').forEach(inp => {
      inp.addEventListener('input', () => {
        const idx = parseInt(inp.dataset.ri);
        const k = inp.dataset.rk;
        reviews[idx][k] = k === 'rating' ? parseInt(inp.value) || 5 : inp.value;
      });
    });
    reviewsList.querySelectorAll('.remove-row').forEach(b => {
      b.addEventListener('click', () => {
        reviews.splice(parseInt(b.dataset.ri), 1);
        renderReviews();
      });
    });
  }
  renderReviews();
  document.getElementById('addReviewBtn').addEventListener('click', () => {
    reviews.push({ name: '', city: '', rating: 5, text: '', verified: true });
    renderReviews();
  });

  // SUBMIT
  document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const payload = {
      name: f.name.value.trim(),
      category: f.category.value,
      price: parseFloat(f.price.value) || 0,
      discountPrice: parseFloat(f.discountPrice.value) || 0,
      stock: parseInt(f.stock.value) || 0,
      saleTag: f.saleTag.value,
      shortDescription: f.shortDescription.value,
      description: f.description.value,
      mainImage: mainImgLink.value.trim(),
      gallery,
      variants: variants.filter(v => v.name),
      details: details.filter(d => d.key),
      reviews: reviews.filter(r => r.name && r.text),
      isFeatured: document.getElementById('isFeatured').checked,
      isBestSeller: document.getElementById('isBestSeller').checked,
      active: document.getElementById('active').checked
    };

    if (!payload.mainImage) { showToast('Main image is required', 'error'); return; }

    const url = id ? `/products/${id}` : '/products';
    const method = id ? 'PUT' : 'POST';
    const r = await api(url, { method, body: payload });
    if (r.success) {
      showToast(id ? 'Product updated' : 'Product created', 'success');
      loadProducts();
    } else {
      showToast(r.message || 'Failed', 'error');
    }
  });
}

// =========================================================
// INVENTORY
// =========================================================
async function loadInventory() {
  const root = document.getElementById('viewInventory');
  root.innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <h3>Inventory Management</h3>
        <div class="filters">
          <select id="invFilter">
            <option value="all">All</option>
            <option value="low">Low Stock (≤5)</option>
            <option value="out">Out of Stock</option>
          </select>
          <input type="text" id="invSearch" placeholder="Search...">
        </div>
      </div>
      <div class="panel-body" id="invList"><div class="loader"><div class="spinner"></div></div></div>
    </div>
  `;

  document.getElementById('invFilter').addEventListener('change', renderInventory);
  document.getElementById('invSearch').addEventListener('input', renderInventory);

  const data = await api('/products/admin/all');
  productsCache = data.success ? data.products : [];
  renderInventory();
}

function renderInventory() {
  const list = document.getElementById('invList');
  const filter = document.getElementById('invFilter').value;
  const search = document.getElementById('invSearch').value.toLowerCase();

  let rows = productsCache;
  if (filter === 'low') rows = rows.filter(p => p.stock > 0 && p.stock <= 5);
  if (filter === 'out') rows = rows.filter(p => p.stock === 0);
  if (search) rows = rows.filter(p => (p.name||'').toLowerCase().includes(search) || (p.productCode||'').includes(search));

  if (!rows.length) { list.innerHTML = '<div class="empty"><h4>Nothing here</h4></div>'; return; }

  list.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th></th><th>Name</th><th>Code</th><th>Stock</th><th>Update</th></tr></thead>
    <tbody>${rows.map(p => `
      <tr>
        <td><img class="thumb" src="${imgSrc(p.mainImage)}" onerror="this.src=''"></td>
        <td><b>${escapeHtml(p.name)}</b></td>
        <td>${p.productCode}</td>
        <td><span class="badge ${p.stock <= 5 ? 'badge-stock-low' : 'badge-stock-ok'}">${p.stock}</span></td>
        <td>
          <input type="number" id="stock-${p._id}" value="${p.stock}" min="0" style="width:90px;padding:6px 8px;border:1px solid #e5e2dd;border-radius:3px;">
          <button class="btn btn-sm btn-primary" onclick="updateStock('${p._id}')">Save</button>
        </td>
      </tr>
    `).join('')}</tbody>
  </table></div>`;
}

window.updateStock = async (id) => {
  const v = parseInt(document.getElementById('stock-' + id).value) || 0;
  const r = await api(`/products/${id}/stock`, { method: 'PATCH', body: { stock: v } });
  if (r.success) {
    showToast('Stock updated', 'success');
    const p = productsCache.find(x => x._id === id);
    if (p) p.stock = v;
    renderInventory();
  }
};

// =========================================================
// CATEGORIES
// =========================================================
async function loadCategories() {
  const root = document.getElementById('viewCategories');
  root.innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <h3>Categories</h3>
        <button class="btn btn-primary" id="addCatBtn">+ Add Category</button>
      </div>
      <div class="panel-body" id="catList"><div class="loader"><div class="spinner"></div></div></div>
    </div>
  `;

  document.getElementById('addCatBtn').addEventListener('click', () => openCategoryForm());
  await loadCategoriesCache();
  renderCategories();
}

function renderCategories() {
  const list = document.getElementById('catList');
  if (!categoriesCache.length) { list.innerHTML = '<div class="empty"><h4>No categories</h4></div>'; return; }

  list.innerHTML = `<div class="cat-grid">${categoriesCache.map(c => `
    <div class="cat-card">
      <div class="cat-card-img">
        ${c.heroImage ? `<img src="${imgSrc(c.heroImage)}" onerror="this.style.display='none'">` : '<div class="cat-card-img-placeholder">No hero image</div>'}
      </div>
      <div class="cat-card-body">
        <div class="cat-card-name">
          ${escapeHtml(c.name)} ${c.isDefault ? '<span class="badge badge-default">Default</span>' : ''}
        </div>
        <div class="cat-card-meta">${escapeHtml(c.heroTitle || '—')}</div>
        <div class="cat-card-actions">
          <button class="btn btn-sm btn-light" onclick="editCategory('${c._id}')">Edit</button>
          ${!c.isDefault ? `<button class="btn btn-sm btn-danger" onclick="deleteCategory('${c._id}')">Del</button>` : ''}
        </div>
      </div>
    </div>
  `).join('')}</div>`;
}

window.editCategory = id => openCategoryForm(id);
window.deleteCategory = async id => {
  if (!confirm('Delete this category?')) return;
  const r = await api(`/categories/${id}`, { method: 'DELETE' });
  if (r.success) { showToast('Deleted', 'success'); loadCategories(); }
  else showToast(r.message, 'error');
};

function openCategoryForm(id = null) {
  const cat = id ? categoriesCache.find(x => x._id === id) : { name: '', heroImage: '', heroTitle: '', heroSubtitle: '', order: 0 };
  if (!cat) return;

  const body = `
    <div class="form-group">
      <label>Name *</label>
      <input type="text" id="catName" value="${escapeHtml(cat.name)}" ${cat.isDefault ? 'readonly' : ''} required>
    </div>
    <div class="form-group">
      <label>Hero Title</label>
      <input type="text" id="catHeroTitle" value="${escapeHtml(cat.heroTitle || '')}">
    </div>
    <div class="form-group">
      <label>Hero Subtitle</label>
      <input type="text" id="catHeroSubtitle" value="${escapeHtml(cat.heroSubtitle || '')}">
    </div>
    <div class="form-group">
      <label>Hero Image</label>
      <div class="image-picker">
        <div class="tabs">
          <button type="button" class="tab active" data-tab-target="catHero" data-tab="link">By Link</button>
          <button type="button" class="tab" data-tab-target="catHero" data-tab="upload">Upload</button>
        </div>
        <div data-tab-content="catHero-link">
          <input type="text" id="catHeroLink" placeholder="https://..." value="${escapeHtml(cat.heroImage || '')}">
        </div>
        <div data-tab-content="catHero-upload" class="hidden">
          <input type="file" id="catHeroFile" accept="image/*">
        </div>
        <div style="margin-top:10px;">
          <img id="catHeroPreview" class="preview-img" src="${imgSrc(cat.heroImage)}" onerror="this.src=''">
        </div>
      </div>
    </div>
    <div class="form-group">
      <label>Order (lower = first)</label>
      <input type="number" id="catOrder" value="${cat.order || 0}">
    </div>
  `;
  const foot = `
    <button class="btn btn-light btn-sm" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary btn-sm" id="saveCatBtn">${id ? 'Update' : 'Create'}</button>
  `;
  openModal(id ? 'Edit Category' : 'Add Category', body, foot);

  // tabs
  document.querySelectorAll('[data-tab-target="catHero"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('[data-tab-target="catHero"]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('[data-tab-content^="catHero-"]').forEach(c => c.classList.add('hidden'));
      document.querySelector(`[data-tab-content="catHero-${tab}"]`).classList.remove('hidden');
    });
  });

  const linkInp = document.getElementById('catHeroLink');
  const fileInp = document.getElementById('catHeroFile');
  const preview = document.getElementById('catHeroPreview');
  linkInp.addEventListener('input', () => preview.src = linkInp.value);
  fileInp.addEventListener('change', async () => {
    if (!fileInp.files[0]) return;
    showToast('Uploading...');
    const r = await uploadFile('/categories/upload-hero', fileInp.files[0], 'image');
    if (r.success) { linkInp.value = r.url; preview.src = r.url; showToast('Uploaded', 'success'); }
    else showToast('Upload failed', 'error');
  });

  document.getElementById('saveCatBtn').addEventListener('click', async () => {
    const payload = {
      name: document.getElementById('catName').value.trim(),
      heroImage: linkInp.value.trim(),
      heroTitle: document.getElementById('catHeroTitle').value.trim(),
      heroSubtitle: document.getElementById('catHeroSubtitle').value.trim(),
      order: parseInt(document.getElementById('catOrder').value) || 0
    };
    if (!payload.name) { showToast('Name required', 'error'); return; }

    const url = id ? `/categories/${id}` : '/categories';
    const method = id ? 'PUT' : 'POST';
    const r = await api(url, { method, body: payload });
    if (r.success) { showToast('Saved', 'success'); closeModal(); loadCategories(); }
    else showToast(r.message || 'Failed', 'error');
  });
}
