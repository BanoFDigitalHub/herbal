/* Herbal Power Frontend Logic */
(function(){
  'use strict';

  const API = '/api';
  const CART_KEY = 'vc_cart';
  let CONFIG = { whatsappNumber: '', deliveryFee: 50, freeDeliveryAbove: 2000 };
  let CATEGORIES = [];
  let ALL_PRODUCTS = [];

  /* ============ HELPERS ============ */
  const $ = (s, p=document) => p.querySelector(s);
  const $$ = (s, p=document) => Array.from(p.querySelectorAll(s));
  const fmt = n => 'Rs. ' + Number(n||0).toLocaleString();
  const escapeHtml = (s='') => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function toast(msg, type='success'){
    const t = $('#toast');
    if(!t) return;
    t.textContent = msg;
    t.className = 'toast show ' + type;
    setTimeout(() => t.classList.remove('show'), 2400);
  }

  async function api(path, opts={}){
    try{
      const res = await fetch(API + path, opts);
      const data = await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(data.message || data.error || 'Request failed');
      return data;
    }catch(e){
      console.error('API error:', path, e);
      throw e;
    }
  }

  /* ============ CART ============ */
  function getCart(){
    try{ return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch(e){ return []; }
  }
  function saveCart(c){
    localStorage.setItem(CART_KEY, JSON.stringify(c));
    updateCartBadge();
  }
  function updateCartBadge(){
    const cart = getCart();
    const count = cart.reduce((s,i) => s + (i.quantity||1), 0);
    const el = $('#cartCount');
    if(!el) return;
    if(count > 0){ el.textContent = count; el.style.display = 'flex'; }
    else el.style.display = 'none';
  }
  function addToCart(product, variant=null, qty=1){
    const cart = getCart();
    const variantId = variant ? variant.name : null;
    const price = variant ? (variant.discountPrice || variant.price) : (product.discountPrice || product.price);
    const existing = cart.find(i => i.productId === product._id && i.variantId === variantId);
    if(existing){
      existing.quantity += qty;
    }else{
      cart.push({
        productId: product._id,
        productName: product.name,
        productCode: product.productCode,
        slug: product.slug,
        variantId,
        variantName: variant ? variant.name : '',
        image: product.mainImage,
        price,
        quantity: qty
      });
    }
    saveCart(cart);
    toast('Cart me add ho gaya');
  }
  function removeFromCart(idx){
    const cart = getCart();
    cart.splice(idx, 1);
    saveCart(cart);
    renderCart();
  }
  function updateQty(idx, delta){
    const cart = getCart();
    if(!cart[idx]) return;
    cart[idx].quantity = Math.max(1, (cart[idx].quantity || 1) + delta);
    saveCart(cart);
    renderCart();
  }

  /* ============ MENU & CART DRAWER ============ */
  function openMenu(){
    $('#mobileMenu').classList.add('active');
    $('#overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu(){
    $('#mobileMenu').classList.remove('active');
    $('#overlay').classList.remove('active');
    document.body.style.overflow = '';
  }
  function openCart(){
    renderCart();
    $('#cartDrawer').classList.add('open');
    $('#overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeCart(){
    $('#cartDrawer').classList.remove('open');
    $('#overlay').classList.remove('active');
    document.body.style.overflow = '';
  }

  /* ============ RENDER: PRODUCT CARD ============ */
  function productCardHTML(p){
    const hasDiscount = p.discountPrice && p.discountPrice < p.price;
    const showPrice = hasDiscount ? p.discountPrice : p.price;
    const tag = p.saleTag || (hasDiscount ? 'SALE' : '');
    return `
      <div class="product-card" data-id="${p._id}">
        <div class="card-img-wrapper" data-action="view" data-id="${p._id}">
          ${tag ? `<span class="sale-tag">${escapeHtml(tag)}</span>` : ''}
          <img src="${escapeHtml(p.mainImage || '')}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x400/f7f5f2/999?text=Herbal Power'">
          <button class="cart-circle" data-action="add" data-id="${p._id}" aria-label="Add to cart">
            <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </button>
        </div>
        <div class="card-info">
          <div class="product-title">${escapeHtml(p.name)}</div>
          <div class="price-wrapper">
            <span class="discount-price">${fmt(showPrice)}</span>
            ${hasDiscount ? `<span class="original-price">${fmt(p.price)}</span>` : ''}
          </div>
          <a href="#" class="order-btn" data-action="add" data-id="${p._id}">Order Now</a>
        </div>
      </div>
    `;
  }

  function renderProductGrid(container, products){
    if(!container) return;
    if(!products || products.length === 0){
      container.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#999;padding:30px;font-size:13px;">Koi product available nahi.</p>';
      return;
    }
    container.innerHTML = products.map(productCardHTML).join('');
  }

  /* ============ RENDER: FEATURED ============ */
  function renderFeatured(p){
    const sec = $('#featuredSection');
    if(!sec) return;
    if(!p){ sec.innerHTML = ''; return; }
    const hasDiscount = p.discountPrice && p.discountPrice < p.price;
    const showPrice = hasDiscount ? p.discountPrice : p.price;
    sec.innerHTML = `
      <div class="featured-wrap">
        <div class="featured-card">
          <div class="featured-img" data-action="view" data-id="${p._id}">
            <img src="${escapeHtml(p.mainImage || '')}" alt="${escapeHtml(p.name)}" onerror="this.src='https://via.placeholder.com/600x600/f7f5f2/999?text=Herbal Power'">
            ${p.saleTag ? `<span class="featured-tag">${escapeHtml(p.saleTag)}</span>` : ''}
          </div>
          <div class="featured-content">
            <div class="featured-eyebrow">Featured Product</div>
            <h2 class="featured-title">${escapeHtml(p.name)}</h2>
            <p class="featured-desc">${escapeHtml(p.shortDescription || p.description || '')}</p>
            <div class="featured-price">
              <span class="discount-price">${fmt(showPrice)}</span>
              ${hasDiscount ? `<span class="original-price">${fmt(p.price)}</span>` : ''}
            </div>
            <button class="featured-cta" data-action="add" data-id="${p._id}">Order Now</button>
          </div>
        </div>
      </div>
    `;
  }

  /* ============ RENDER: CATEGORY HEROES ============ */
  function renderCategoryHeroes(cats){
    const sec = $('#categoryHeroes');
    if(!sec) return;
    const withHero = cats.filter(c => c.heroImage);
    if(withHero.length === 0){ sec.innerHTML = ''; return; }
    sec.innerHTML = `
      <div class="cat-heroes-wrap">
        ${withHero.map(c => `
          <a href="#cat-${escapeHtml(c.slug)}" class="cat-hero-card" data-cat="${escapeHtml(c.slug)}">
            <img src="${escapeHtml(c.heroImage)}" alt="${escapeHtml(c.name)}" onerror="this.src='https://via.placeholder.com/600x400/2d5043/fff?text='+encodeURIComponent('${escapeHtml(c.name)}')">
            <div class="cat-hero-overlay">
              <h3>${escapeHtml(c.heroTitle || c.name)}</h3>
              ${c.heroSubtitle ? `<p>${escapeHtml(c.heroSubtitle)}</p>` : ''}
              <span class="cat-hero-cta">Explore →</span>
            </div>
          </a>
        `).join('')}
      </div>
    `;
  }

  /* ============ RENDER: NAV ============ */
  function renderNav(cats){
    const desktop = $('#desktopNav');
    const mobile = $('#menuLinks');
    const links = cats.map(c => `<a href="#cat-${escapeHtml(c.slug)}" data-cat="${escapeHtml(c.slug)}">${escapeHtml(c.name)}</a>`).join('');
    if(desktop) desktop.innerHTML = links + '<a href="#all">All Products</a>';
    if(mobile) mobile.innerHTML = links.replace(/<a /g, '<a class="mobile-link" ') + '<a href="#all" class="mobile-link">All Products</a>';
  }

  /* ============ CART RENDER ============ */
  function calcTotals(cart){
    const subtotal = cart.reduce((s,i) => s + (i.price * i.quantity), 0);
    const deliveryFee = subtotal >= CONFIG.freeDeliveryAbove ? 0 : CONFIG.deliveryFee;
    const total = subtotal + deliveryFee;
    return { subtotal, deliveryFee, total };
  }

  function renderCart(){
    const cart = getCart();
    const wrap = $('#cartContent');
    if(!wrap) return;
    if(cart.length === 0){
      wrap.innerHTML = `
        <div class="cart-empty">
          <svg viewBox="0 0 24 24" width="50" height="50" stroke="#ccc" fill="none" stroke-width="1.3"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <p>Your cart is empty</p>
          <button class="btn-primary" id="continueShopping">Continue Shopping</button>
        </div>
      `;
      const btn = $('#continueShopping');
      if(btn) btn.addEventListener('click', closeCart);
      return;
    }
    const totals = calcTotals(cart);
    wrap.innerHTML = `
      <div class="cart-items">
        ${cart.map((it,i) => `
          <div class="cart-item">
            <img src="${escapeHtml(it.image||'')}" alt="${escapeHtml(it.productName)}" onerror="this.src='https://via.placeholder.com/80'">
            <div class="cart-item-info">
              <div class="cart-item-name">${escapeHtml(it.productName)}</div>
              ${it.variantName ? `<div class="cart-item-variant">${escapeHtml(it.variantName)}</div>` : ''}
              <div class="cart-item-price">${fmt(it.price)}</div>
              <div class="qty-row">
                <button class="qty-btn" data-action="qty-dec" data-idx="${i}">−</button>
                <span class="qty-val">${it.quantity}</span>
                <button class="qty-btn" data-action="qty-inc" data-idx="${i}">+</button>
                <button class="remove-btn" data-action="remove" data-idx="${i}">Remove</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="cart-totals">
        <div class="row"><span>Subtotal</span><span>${fmt(totals.subtotal)}</span></div>
        <div class="row"><span>Delivery</span><span>${totals.deliveryFee === 0 ? 'FREE' : fmt(totals.deliveryFee)}</span></div>
        <div class="row total"><span>Total</span><span>${fmt(totals.total)}</span></div>
        ${totals.deliveryFee > 0 ? `<div class="free-delivery-hint">Add ${fmt(CONFIG.freeDeliveryAbove - totals.subtotal)} more for free delivery</div>` : ''}
      </div>
      <button class="btn-primary checkout-btn" id="goToCheckout">Proceed to Checkout</button>
    `;
    const btn = $('#goToCheckout');
    if(btn) btn.addEventListener('click', renderCheckoutForm);
  }

  function renderCheckoutForm(){
    const cart = getCart();
    if(cart.length === 0) return;
    const totals = calcTotals(cart);
    $('#cartTitle').textContent = 'Checkout';
    $('#cartContent').innerHTML = `
      <form id="checkoutForm" class="checkout-form" autocomplete="on">
        <div class="checkout-summary">
          <div class="row"><span>${cart.length} item${cart.length>1?'s':''}</span><span>${fmt(totals.subtotal)}</span></div>
          <div class="row"><span>Delivery</span><span>${totals.deliveryFee === 0 ? 'FREE' : fmt(totals.deliveryFee)}</span></div>
          <div class="row total"><span>Total</span><span>${fmt(totals.total)}</span></div>
        </div>
        <h4 class="form-section-title">Delivery Details</h4>
        <div class="form-row">
          <label>Full Name *</label>
          <input name="customerName" required autocomplete="name">
        </div>
        <div class="form-row">
          <label>Phone Number *</label>
          <input name="phone" required pattern="[0-9+ -]{10,15}" placeholder="03XXXXXXXXX" autocomplete="tel">
        </div>
        <div class="form-row">
          <label>Email (optional)</label>
          <input name="email" type="email" autocomplete="email">
        </div>
        <div class="form-row">
          <label>City *</label>
          <input name="city" required autocomplete="address-level2">
        </div>
        <div class="form-row">
          <label>Complete Address *</label>
          <textarea name="address" required rows="3" autocomplete="street-address"></textarea>
        </div>
        <div class="form-row">
          <label>Order Notes (optional)</label>
          <textarea name="notes" rows="2" placeholder="Any specific instructions..."></textarea>
        </div>
        <div class="payment-info">
          <strong>Payment Method:</strong> Cash on Delivery (COD)
        </div>
        <button type="submit" class="btn-primary checkout-btn" id="placeOrderBtn">Place Order</button>
        <button type="button" class="btn-back" id="backToCart">← Back to Cart</button>
      </form>
    `;
    $('#backToCart').addEventListener('click', () => { $('#cartTitle').textContent = 'Your Cart'; renderCart(); });
    $('#checkoutForm').addEventListener('submit', placeOrder);
  }

  async function placeOrder(e){
    e.preventDefault();
    const btn = $('#placeOrderBtn');
    const cart = getCart();
    if(cart.length === 0) return;
    btn.disabled = true; btn.textContent = 'Placing order...';
    const fd = new FormData(e.target);
    const payload = {
      customerName: fd.get('customerName'),
      phone: fd.get('phone'),
      email: fd.get('email') || '',
      city: fd.get('city'),
      address: fd.get('address'),
      notes: fd.get('notes') || '',
      items: cart.map(i => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity
      }))
    };
    try{
      const res = await api('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      // Clear cart, show success
      localStorage.removeItem(CART_KEY);
      updateCartBadge();
      showOrderSuccess(res);
    }catch(err){
      btn.disabled = false; btn.textContent = 'Place Order';
      toast(err.message || 'Order failed. Please try again.', 'error');
    }
  }

  function showOrderSuccess(res){
    const orderNumber = res.order ? res.order.orderNumber : res.orderNumber;
    $('#cartTitle').textContent = 'Order Placed';
    $('#cartContent').innerHTML = `
      <div class="order-success">
        <div class="success-icon">
          <svg viewBox="0 0 24 24" width="60" height="60" stroke="#2d5043" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <h3>Shukria! Order place ho gaya</h3>
        <p class="order-num">Order #${escapeHtml(orderNumber || '')}</p>
        <p class="success-msg">Hum jaldi hi aapse contact karenge. WhatsApp pe confirmation ke liye neeche button click karein.</p>
        ${res.whatsappLink ? `<a href="${res.whatsappLink}" target="_blank" class="btn-primary wa-confirm">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
          Confirm on WhatsApp
        </a>` : ''}
        <button class="btn-back" id="closeSuccessBtn">Continue Shopping</button>
      </div>
    `;
    $('#closeSuccessBtn').addEventListener('click', () => { $('#cartTitle').textContent = 'Your Cart'; closeCart(); });
  }

  /* ============ PRODUCT QUICK VIEW ============ */
  function showProductDetail(productId){
    const p = ALL_PRODUCTS.find(x => x._id === productId);
    if(!p){ toast('Product not found', 'error'); return; }
    const hasDiscount = p.discountPrice && p.discountPrice < p.price;
    const showPrice = hasDiscount ? p.discountPrice : p.price;
    const overlay = document.createElement('div');
    overlay.className = 'product-modal-overlay active';
    overlay.innerHTML = `
      <div class="product-modal">
        <button class="close-btn modal-close" aria-label="Close">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="#555" fill="none" stroke-width="1.8" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="pm-grid">
          <div class="pm-images">
            <img class="pm-main-img" src="${escapeHtml(p.mainImage||'')}" alt="${escapeHtml(p.name)}" onerror="this.src='https://via.placeholder.com/600x600/f7f5f2/999?text=Herbal Power'">
            ${(p.gallery && p.gallery.length) ? `
              <div class="pm-thumbs">
                ${[p.mainImage, ...p.gallery].map((g,i) => `<img src="${escapeHtml(g)}" data-thumb="${i}" class="${i===0?'active':''}" onerror="this.style.display='none'">`).join('')}
              </div>
            ` : ''}
          </div>
          <div class="pm-info">
            ${p.saleTag ? `<span class="pm-tag">${escapeHtml(p.saleTag)}</span>` : ''}
            <h2 class="pm-title">${escapeHtml(p.name)}</h2>
            ${p.averageRating > 0 ? `
              <div class="pm-rating">
                <span>${'★'.repeat(Math.round(p.averageRating))}${'☆'.repeat(5-Math.round(p.averageRating))}</span>
                <span class="pm-rating-count">${p.averageRating.toFixed(1)} (${p.reviewsCount} reviews)</span>
              </div>
            ` : ''}
            <div class="pm-price">
              <span class="discount-price">${fmt(showPrice)}</span>
              ${hasDiscount ? `<span class="original-price">${fmt(p.price)}</span>` : ''}
            </div>
            ${p.shortDescription ? `<p class="pm-short">${escapeHtml(p.shortDescription)}</p>` : ''}
            ${(p.variants && p.variants.length) ? `
              <div class="pm-variants">
                <label>Select Variant:</label>
                <div class="variant-options">
                  ${p.variants.map((v,i) => `<button class="variant-opt ${i===0?'active':''}" data-vidx="${i}">${escapeHtml(v.name)}${v.discountPrice||v.price?` - ${fmt(v.discountPrice||v.price)}`:''}</button>`).join('')}
                </div>
              </div>
            ` : ''}
            <div class="pm-qty-row">
              <label>Quantity:</label>
              <div class="qty-control">
                <button class="qty-btn" id="pmQtyDec">−</button>
                <span class="qty-val" id="pmQty">1</span>
                <button class="qty-btn" id="pmQtyInc">+</button>
              </div>
            </div>
            <button class="btn-primary pm-add" id="pmAddBtn">Add to Cart</button>
            ${p.description ? `
              <div class="pm-section">
                <h4>Description</h4>
                <p>${escapeHtml(p.description).replace(/\n/g,'<br>')}</p>
              </div>
            ` : ''}
            ${(p.details && p.details.length) ? `
              <div class="pm-section">
                <h4>Product Details</h4>
                <table class="pm-details-table">
                  ${p.details.map(d => `<tr><td>${escapeHtml(d.key)}</td><td>${escapeHtml(d.value)}</td></tr>`).join('')}
                </table>
              </div>
            ` : ''}
            ${(p.reviews && p.reviews.length) ? `
              <div class="pm-section">
                <h4>Customer Reviews</h4>
                ${p.reviews.map(r => `
                  <div class="pm-review">
                    <div class="pm-review-head">
                      <strong>${escapeHtml(r.name)}</strong>
                      <span class="pm-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
                      ${r.verified ? '<span class="verified-badge">✓ Verified</span>' : ''}
                    </div>
                    ${r.city ? `<div class="pm-review-city">${escapeHtml(r.city)}</div>` : ''}
                    <p>${escapeHtml(r.text)}</p>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    let currentVariant = (p.variants && p.variants.length) ? p.variants[0] : null;
    let currentQty = 1;

    const close = () => { overlay.remove(); document.body.style.overflow = ''; };
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if(e.target === overlay) close(); });

    overlay.querySelectorAll('.pm-thumbs img').forEach(t => {
      t.addEventListener('click', () => {
        overlay.querySelector('.pm-main-img').src = t.src;
        overlay.querySelectorAll('.pm-thumbs img').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
      });
    });

    overlay.querySelectorAll('.variant-opt').forEach(b => {
      b.addEventListener('click', () => {
        overlay.querySelectorAll('.variant-opt').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        currentVariant = p.variants[parseInt(b.dataset.vidx)];
      });
    });

    overlay.querySelector('#pmQtyDec').addEventListener('click', () => {
      currentQty = Math.max(1, currentQty - 1);
      overlay.querySelector('#pmQty').textContent = currentQty;
    });
    overlay.querySelector('#pmQtyInc').addEventListener('click', () => {
      currentQty++;
      overlay.querySelector('#pmQty').textContent = currentQty;
    });

    overlay.querySelector('#pmAddBtn').addEventListener('click', () => {
      addToCart(p, currentVariant, currentQty);
      close();
    });
  }

  /* ============ FILTER BY CATEGORY (anchor links) ============ */
  function filterByCategorySlug(slug){
    if(!slug) return;
    const cat = CATEGORIES.find(c => c.slug === slug);
    if(!cat) return;
    const filtered = ALL_PRODUCTS.filter(p => p.category && (p.category._id === cat._id || p.category === cat._id));
    renderProductGrid($('#allProductsGrid'), filtered);
    const header = document.querySelector('#all h2');
    if(header) header.innerHTML = `${escapeHtml(cat.name)}`;
    setTimeout(() => {
      const el = $('#all');
      if(el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  /* ============ EVENT DELEGATION ============ */
  function setupGlobalClicks(){
    document.body.addEventListener('click', (e) => {
      // Product card actions
      const actionEl = e.target.closest('[data-action]');
      if(actionEl){
        const action = actionEl.dataset.action;
        const id = actionEl.dataset.id;
        if(action === 'add' && id){
          e.preventDefault();
          const p = ALL_PRODUCTS.find(x => x._id === id);
          if(p){
            if(p.variants && p.variants.length > 0){
              showProductDetail(id);
            }else{
              addToCart(p);
            }
          }
          return;
        }
        if(action === 'view' && id){
          e.preventDefault();
          showProductDetail(id);
          return;
        }
        if(action === 'qty-inc'){ updateQty(parseInt(actionEl.dataset.idx), 1); return; }
        if(action === 'qty-dec'){ updateQty(parseInt(actionEl.dataset.idx), -1); return; }
        if(action === 'remove'){ removeFromCart(parseInt(actionEl.dataset.idx)); return; }
      }

      // Mobile menu nav links
      const mLink = e.target.closest('.mobile-link');
      if(mLink){ closeMenu(); }

      // Category anchor click
      const catA = e.target.closest('[data-cat]');
      if(catA){
        e.preventDefault();
        filterByCategorySlug(catA.dataset.cat);
        closeMenu();
      }
    });
  }

  /* ============ INIT ============ */
  async function init(){
    // Wire menu/cart buttons
    const menuToggle = $('#menuToggle');
    const closeMenuBtn = $('#closeMenu');
    const overlay = $('#overlay');
    const cartToggle = $('#cartToggle');
    const closeCartBtn = $('#closeCart');

    if(menuToggle) menuToggle.addEventListener('click', openMenu);
    if(closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
    if(overlay) overlay.addEventListener('click', () => { closeMenu(); closeCart(); });
    if(cartToggle) cartToggle.addEventListener('click', openCart);
    if(closeCartBtn) closeCartBtn.addEventListener('click', closeCart);

    setupGlobalClicks();
    updateCartBadge();

    // Load config
    try{
      const cfg = await api('/config');
      CONFIG = { ...CONFIG, ...cfg };
      const wa = $('#waBtn');
      const fwa = $('#footerWa');
      const link = `https://wa.me/${CONFIG.whatsappNumber}`;
      if(wa) wa.href = link;
      if(fwa) fwa.href = link;
    }catch(e){ console.warn('Config load failed', e); }

    // Load categories + products in parallel
    try{
      const [catsRes, productsRes] = await Promise.all([
        api('/categories'),
        api('/products')
      ]);
      // Backend returns either array directly or { success, products/categories }
      CATEGORIES = Array.isArray(catsRes) ? catsRes : (catsRes.categories || []);
      ALL_PRODUCTS = Array.isArray(productsRes) ? productsRes : (productsRes.products || []);

      renderNav(CATEGORIES);
      renderCategoryHeroes(CATEGORIES);

      const featured = ALL_PRODUCTS.find(p => p.isFeatured);
      renderFeatured(featured);

      const bestSellers = ALL_PRODUCTS.filter(p => p.isBestSeller).slice(0, 4);
      renderProductGrid($('#bestSellersGrid'), bestSellers.length ? bestSellers : ALL_PRODUCTS.slice(0, 4));

      renderProductGrid($('#allProductsGrid'), ALL_PRODUCTS);

      // Handle hash on load
      if(window.location.hash){
        const h = window.location.hash.replace('#cat-', '');
        if(h && h !== 'all') filterByCategorySlug(h);
      }
    }catch(e){
      console.error('Failed to load products:', e);
      const grid = $('#allProductsGrid');
      if(grid) grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#a8443a;padding:30px;font-size:13px;">Products load nahi ho sake. Backend chal raha hai? <button onclick="location.reload()" style="margin-left:10px;padding:6px 14px;border:1px solid #2d5043;background:#fff;cursor:pointer;border-radius:4px;">Retry</button></p>';
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
