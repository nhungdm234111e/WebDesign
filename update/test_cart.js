/* =========================
   cart.js – Full implementation
   ========================= */

/* ---------- Helpers ---------- */

// Fix image paths (relative/http)
function fixImagePath(src) {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  // If path already starts with ../ keep it
  if (src.startsWith('../')) return src;
  // Normalize leading slash
  return src.replace(/^\//, '');
}

// Format price as USD (or change as needed)
function formatPrice(value) {
  const num = Number(value) || 0;
  return `$${num.toFixed(2)}`;
}

/* ---------- Persistence & State ---------- */

let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

function saveCart() {
  localStorage.setItem('cartItems', JSON.stringify(cartItems));
}

/* ---------- Toast / Notification ---------- */

function ensureToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message, duration = 3000) {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  // show
  requestAnimationFrame(() => toast.classList.add('show'));

  // hide after duration
  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 420);
  }, duration);
}

/* ---------- UI helpers ---------- */

function updateCartBadge() {
  const badge = document.getElementById('cart-badge') || document.querySelector('.cart-badge');
  if (!badge) return;
  const totalItems = cartItems.length; // Count unique items, not quantities
  
  if (totalItems > 0) {
    badge.textContent = totalItems;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none'; // Ẩn hoàn toàn khi = 0
  }
}

function updateBreadcrumbCount() {
  const bc = document.querySelector('.breadcrumb-current');
  if (bc) bc.textContent = `My Cart (${cartItems.length})`;
}

/* ---------- Core actions (add/update/remove) ---------- */

function addToCart(product) {
  // product: { id, name, price, size, color, image, images, quantity }
  const id = product.id ?? String(Date.now());
  const size = product.size ?? 'M';
  const qty = product.quantity ? Number(product.quantity) : 1;
  
  // Try to merge by id+size
  const existing = cartItems.find(i => i.id === id && (i.size ?? 'M') === size);
  if (existing) {
    existing.quantity = (existing.quantity || 0) + qty;
  } else {
    cartItems.push({
      id,
      name: product.name ?? 'Product',
      price: Number(product.price) || 0,
      size,
      color: product.color || 'Black',
      image: product.image ?? '',
      images: product.images || [product.image],
      quantity: qty,
      selected: false // Default: not selected
    });
  }
  saveCart();
  loadCart();
  updateCartBadge();
  showToast(`${product.name} has been added to your cart.`);
  return true;
}

function removeFromCart(index) {
  if (index < 0 || index >= cartItems.length) return;
  const removed = cartItems.splice(index, 1)[0];
  saveCart();
  loadCart();
  updateCartBadge();
  showToast(`${removed.name} has been removed from your cart.`);
}

function updateQuantity(index, quantity) {
  const q = parseInt(quantity, 10);
  if (isNaN(q) || q < 1) {
    // if invalid, remove item
    removeFromCart(index);
    return;
  }
  if (!cartItems[index]) return;
  cartItems[index].quantity = q;
  saveCart();
  loadCart();
  updateCartBadge();
  showToast(`${cartItems[index].name} quantity updated to ${q}.`);
}

function handleSizeChange(index, newSize) {
  if (!cartItems[index]) return;
  cartItems[index].size = newSize;
  saveCart();
  loadCart();
  showToast(`${cartItems[index].name} size set to ${newSize}.`);
}

/* ---------- Selection functions ---------- */

// Toggle selection of a single item
function toggleItemSelection(index) {
  if (cartItems[index]) {
    cartItems[index].selected = !cartItems[index].selected;
    saveCart();
    updateCart();
  }
}

// Select/Deselect all items
function selectAllItems() {
  if (cartItems.length === 0) return;
  
  // Check if all items are already selected
  const allSelected = cartItems.every(item => item.selected);
  
  // Toggle: if all selected -> deselect all, otherwise -> select all
  cartItems.forEach(item => {
    item.selected = !allSelected;
  });
  
  saveCart();
  loadCart();
  
  showToast(allSelected ? 'All items deselected' : 'All items selected');
}

// Update SELECT ALL button text
function updateSelectAllButton() {
  const selectAllBtn = document.querySelector('.selectAll');
  if (selectAllBtn && cartItems.length > 0) {
    const allSelected = cartItems.every(item => item.selected);
    selectAllBtn.textContent = allSelected ? 'DESELECT ALL' : 'SELECT ALL';
  }
}

/* ---------- Bulk & utility actions ---------- */

function updateCheckboxes() {
  // Recalculate any bulk UI state (e.g., enable delete button)
  const checked = document.querySelectorAll('.item-checkbox:checked').length;
  const deleteBtn = document.getElementById('delete-selected-btn');
  if (deleteBtn) deleteBtn.disabled = checked === 0;
}

function deleteSelected() {
  const selectedIndices = cartItems
    .map((item, index) => item.selected ? index : -1)
    .filter(index => index !== -1)
    .sort((a, b) => b - a); // Delete from end to start
  
  if (selectedIndices.length === 0) {
    showToast('Please select items to delete');
    return;
  }
  
  if (!confirm(`Delete ${selectedIndices.length} selected item(s)?`)) return;

  selectedIndices.forEach(index => cartItems.splice(index, 1));

  saveCart();
  loadCart();
  updateCartBadge();
  showToast(`${selectedIndices.length} item(s) removed from cart.`);
}

function clearCart() {
  cartItems = [];
  saveCart();
  loadCart();
  updateCartBadge();
  showToast('Cart cleared successfully');
}

function handleCheckout() {
  const selectedItems = cartItems.filter(item => item.selected);
  
  if (selectedItems.length === 0) {
    showToast('Please select items to checkout!');
    return;
  }
  
  // Save selected items to localStorage for checkout page
  localStorage.setItem('checkoutItems', JSON.stringify(selectedItems));
  
  // Remove selected items from cart
  cartItems = cartItems.filter(item => !item.selected);
  
  // Save updated cart
  saveCart();
  
  showToast('Proceeding to checkout...');
  setTimeout(() => {
    // adjust path if needed
    window.location.href = 'Checkout.html';
  }, 700);
}

/* ---------- Rendering ---------- */

function renderEmptyStateAsTableRow() {
  // Return a single TR HTML when tbody is used (keeps table markup)
  return `
    <tr>
      <td colspan="6" class="empty-cell-td" style="text-align:center; padding:60px 10px;">
        <div class="empty-cart">
          <i class="fas fa-shopping-cart" style="font-size:48px; color:#ccc; display:block; margin-bottom:12px;"></i>
          <div style="font-size:18px; color:#444;">Your cart is empty</div>
          <div style="margin-top:8px;">
            <a href="index.html" style="color:#666; text-decoration:underline;">Continue shopping</a>
          </div>
        </div>
      </td>
    </tr>
  `;
}

function loadCart() {
  const tbody = document.getElementById('cart-tbody');
  const cartTable = document.getElementById('cart-table');
  const summary = document.querySelector('.summary-section');
  const cartActions = document.querySelector('.cart-actions');
  const selectAllBtn = document.querySelector('.selectAll');

  if (!tbody) return;

  // Clear existing rows
  tbody.innerHTML = '';

  if (cartItems.length === 0) {
    // Hide table controls and show empty row
    tbody.innerHTML = renderEmptyStateAsTableRow();
    if (cartTable) cartTable.style.display = 'table';
    if (summary) summary.style.display = 'none';
    if (cartActions) cartActions.style.display = 'none';
    if (selectAllBtn) selectAllBtn.style.display = 'none';
    updateCart(); // make sure totals reflect zero
    return;
  }

  // If there are items, ensure summary / actions visible
  if (summary) summary.style.display = 'block';
  if (cartActions) cartActions.style.display = 'flex';
  if (selectAllBtn) selectAllBtn.style.display = 'inline-block';

  // Render each item as table row
  cartItems.forEach((item, index) => {
    const tr = document.createElement('tr');

    const imgSrc = fixImagePath(item.image);

    tr.innerHTML = `
      <td class="checkbox-cell" style="text-align:center;">
        <input type="checkbox" class="item-checkbox" data-index="${index}" 
               ${item.selected ? 'checked' : ''}>
      </td>
      <td>
        <div class="product-cell">
          <img src="${imgSrc}" alt="${item.name}" class="product-image" style="width:120px;height:120px;object-fit:cover;border:1px solid #eee;border-radius:4px;cursor:pointer;">
          <div class="product-details">
            <div class="product-name">${item.name}</div>
            <div class="product-color" style="color:#000;font-size:14px;margin-top:4px;">${item.color || ''}</div>
            <div class="product-price" style="color:#000;font-size:14px;margin-top:6px;font-weight:500;">${formatPrice(item.price)}</div>
          </div>
        </div>
      </td>
      <td class="size-cell" style="text-align:center;">
        <select class="size-select" data-index="${index}">
          <option value="S" ${item.size === 'S' ? 'selected' : ''}>S</option>
          <option value="M" ${item.size === 'M' ? 'selected' : ''}>M</option>
          <option value="L" ${item.size === 'L' ? 'selected' : ''}>L</option>
          <option value="XL" ${item.size === 'XL' ? 'selected' : ''}>XL</option>
        </select>
      </td>
      <td class="quantity-cell" style="text-align:center;">
        <div class="quantity-control">
          <button class="qty-minus">−</button>
          <input type="number" value="${item.quantity}" min="1" readonly>
          <button class="qty-plus">+</button>
        </div>
      </td>
      <td class="total-cell" style="text-align:center;">
        <div class="line-total">${formatPrice(item.price * item.quantity)}</div>
      </td>
      <td class="delete-cell" style="text-align:center;">
        <button class="delete-btn" title="Remove item">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;

    // Attach checkbox handler
    tr.querySelector('.item-checkbox')?.addEventListener('change', () => {
      toggleItemSelection(index);
    });

    // Attach delete handler
    tr.querySelector('.delete-btn')?.addEventListener('click', () => {
      if (confirm(`Remove "${item.name}" from cart?`)) {
        removeFromCart(index);
      }
    });

    // Size change handler
    tr.querySelector('.size-select')?.addEventListener('change', (e) => {
      handleSizeChange(index, e.target.value);
    });

    // Quantity change handlers
    tr.querySelector('.qty-minus')?.addEventListener('click', () => {
      handleQuantityChange(index, item.quantity - 1);
    });
    
    tr.querySelector('.qty-plus')?.addEventListener('click', () => {
      handleQuantityChange(index, item.quantity + 1);
    });

    tbody.appendChild(tr);
  });

  // After rendering, update UI
  updateCart();
  updateSelectAllButton();
}

/* ---------- small wrapper to keep naming consistent ---------- */
function handleQuantityChange(index, value) {
  updateQuantity(index, value);
}

/* ---------- Totals & summary ---------- */

function updateCart() {
  // ONLY calculate totals for SELECTED items
  const selectedItems = cartItems.filter(item => item.selected);
  
  const totals = selectedItems.reduce((acc, item) => {
    acc.subtotal += item.price * item.quantity;
    acc.quantity += item.quantity;
    return acc;
  }, { subtotal: 0, quantity: 0 });

  const shipping = selectedItems.length > 0 ? 10 : 0;
  const total = totals.subtotal + shipping;

  const subtotalEl = document.getElementById('subtotal');
  const totalQtyEl = document.getElementById('total-quantity');
  const shippingEl = document.getElementById('shipping');
  const totalEl = document.getElementById('total');

  if (subtotalEl) subtotalEl.textContent = formatPrice(totals.subtotal);
  if (totalQtyEl) totalQtyEl.textContent = totals.quantity;
  if (shippingEl) shippingEl.textContent = formatPrice(shipping);
  if (totalEl) totalEl.textContent = formatPrice(total);

  updateBreadcrumbCount();
  updateCartBadge();

  // Persist state
  saveCart();
}

function handleUpdateCart() {
  const qtyInputs = document.querySelectorAll('.qty-input');
  qtyInputs.forEach(input => {
    const index = parseInt(input.dataset.index, 10);
    const value = parseInt(input.value, 10);
    if (!isNaN(index) && !isNaN(value) && value > 0) {
      cartItems[index].quantity = value;
    }
  });

  const sizeSelects = document.querySelectorAll('.size-select');
  sizeSelects.forEach(select => {
    const index = parseInt(select.dataset.index, 10);
    const size = select.value;
    if (!isNaN(index)) {
      cartItems[index].size = size;
    }
  });

  saveCart();
  loadCart();
  updateCart();
  showToast('Cart updated successfully!');
}

/* ---------- Support functions for checkout page ---------- */

// Get checkout items
function getCheckoutItems() {
  const saved = localStorage.getItem('checkoutItems');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing checkoutItems:', e);
      return [];
    }
  }
  return [];
}

// Clear checkout items after payment
function clearCheckoutItems() {
  localStorage.removeItem('checkoutItems');
}

// Calculate checkout total
function calculateCheckoutTotal(items) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = items.length > 0 ? 10 : 0;
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + shipping + tax;
  
  return {
    subtotal: subtotal.toFixed(2),
    quantity: totalQuantity,
    shipping: shipping.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2)
  };
}

/* ---------- Event wiring on page load ---------- */

document.addEventListener('DOMContentLoaded', () => {
  // Ensure toast container exists
  ensureToastContainer();

  // Initial render
  loadCart();
  updateCartBadge();

  // Wire up global controls (if present)
  const selectAllBtn = document.querySelector('.selectAll');
  if (selectAllBtn) selectAllBtn.addEventListener('click', selectAllItems);

  const deleteSelectedBtn = document.getElementById('delete-selected-btn');
  if (deleteSelectedBtn) deleteSelectedBtn.addEventListener('click', deleteSelected);

  const clearBtn = document.getElementById('clear-cart-btn');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the cart?')) {
      clearCart();
    }
  });

  const checkoutBtn = document.querySelector('.checkout');
  if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);
  
  const updateBtn = document.querySelector('.update-cart');
  if (updateBtn) updateBtn.addEventListener('click', handleUpdateCart);
});

/* Make functions globally available */
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.getCheckoutItems = getCheckoutItems;
window.clearCheckoutItems = clearCheckoutItems;
window.calculateCheckoutTotal = calculateCheckoutTotal;