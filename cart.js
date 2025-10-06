// Global cart array 
let cartItems = [];

// ADD TO CART FUNCTION
function addToCart(product) {
  const existingItem = cartItems.find(
    item => item.id === product.id && item.size === product.size
  );
  
  if (existingItem) {
    existingItem.quantity += product.quantity || 1;
  } else {
    cartItems.push({
      id: product.id || Date.now().toString(),
      name: product.name,
      price: parseFloat(product.price),
      size: product.size || 'M',
      image: product.image,
      quantity: product.quantity || 1
    });
  }
  
  updateCartBadge();
  loadCart();
  return true;
}

// REMOVE FROM CART
function removeFromCart(index) {
  if (index >= 0 && index < cartItems.length) {
    cartItems.splice(index, 1);
    updateCartBadge();
    loadCart();
    showNotification('Product removed from cart');
  }
}

// UPDATE QUANTITY
function updateQuantity(index, quantity) {
  const qty = parseInt(quantity);
  
  if (index >= 0 && index < cartItems.length) {
    if (qty > 0) {
      cartItems[index].quantity = qty;
      updateCartBadge();
      loadCart();
    } else {
      removeFromCart(index);
    }
  }
}

function getCartTotals() {
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = cartItems.length > 0 ? 10 : 0;
  const total = subtotal + shipping;
  
  return {
    subtotal: subtotal,
    quantity: totalQuantity,
    shipping: shipping,
    total: total
  };
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (badge) {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'flex' : 'none';
  }
}

function showNotification(message, type = 'success') {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = 'notification';
  
  const icon = type === 'success' ? 'check-circle' : 
              type === 'error' ? 'exclamation-circle' : 'info-circle';
  
  notification.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 2500);
}

function clearCart() {
  cartItems = [];
  updateCartBadge();
  loadCart();
}

// LOAD CART
function loadCart() {
  const tbody = document.getElementById('cart-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (cartItems.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-cart">
          <i class="fas fa-shopping-cart"></i>
          <div style="font-size: 18px; margin-top: 0px;">Your cart is empty</div>
          <div class="continue-shopping" style="font-size: 14px; margin-top: 10px; color: #999;">
            <a href="index.html">Continue shopping!</a>
          </div>
        </td>
      </tr>
    `;
    updateCart();
    return;
  }
  
  cartItems.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="checkbox-cell">
        <input type="checkbox" class="item-checkbox" data-index="${index}" onchange="updateCheckboxes()">
      </td>
      <td>
        <div class="product-cell">
          <img src="${item.image}" alt="${item.name}" class="product-image">
          <div class="product-details">
            <div class="product-name">${item.name}</div>
            <div class="product-color">${item.color} / ${item.size}</div>
            <div class="product-price">${formatPrice(item.price)}</div>
          </div>
          <i class="fas fa-trash remove-icon" onclick="handleRemoveItem(${index})" title="Remove"></i>
        </div>
      </td>
      <td class="size-cell">
        <select class="size-select" data-index="${index}" onchange="handleSizeChange(${index}, this.value)">
          <option value="S" ${item.size === 'S' ? 'selected' : ''}>S</option>
          <option value="M" ${item.size === 'M' ? 'selected' : ''}>M</option>
          <option value="L" ${item.size === 'L' ? 'selected' : ''}>L</option>
          <option value="XL" ${item.size === 'XL' ? 'selected' : ''}>XL</option>
        </select>
      </td>
      <td class="quantity-cell">
        <div class="quantity-control">
          <button onclick="handleQuantityChange(${index}, ${item.quantity - 1})">−</button>
          <input type="number" value="${item.quantity}" min="1" readonly>
          <button onclick="handleQuantityChange(${index}, ${item.quantity + 1})">+</button>
        </div>
      </td>
      <td class="total-cell">
        ${formatPrice(item.price * item.quantity)}
      </td>
    `;
    tbody.appendChild(row);
  });
  
  updateCart();
}

function updateCart() {
  let subtotal = 0;
  let totalQty = 0;
  
  cartItems.forEach(item => {
    subtotal += item.price * item.quantity;
    totalQty += item.quantity;
  });
  
  const shipping = cartItems.length > 0 ? 10 : 0;
  const total = subtotal + shipping;

  document.getElementById("subtotal").innerText = `$${subtotal.toFixed(2)}`;
  document.getElementById("total-quantity").innerText = totalQty;
  document.getElementById("shipping").innerText = `$${shipping.toFixed(2)}`;
  document.getElementById("total").innerText = `$${total.toFixed(2)}`;
  
  updateBreadcrumbCount(cartItems.length);
  updateCartBadge();
}

function formatPrice(price) {
  return `$${price.toFixed(2)}`;
}
function updateBreadcrumbCount(cartCount) {
  const breadcrumbCurrent = document.querySelector('.breadcrumb-current');
  if (breadcrumbCurrent) {
    breadcrumbCurrent.textContent = `My Cart (${cartCount})`;
  }
}

function handleSizeChange(index, newSize) {
  if (cartItems[index]) {
    cartItems[index].size = newSize;
  }
}

function handleQuantityChange(index, newQuantity) {
  updateQuantity(index, newQuantity);
}

function handleRemoveItem(index) {
  const item = cartItems[index];
  if (confirm(`Remove "${item.name}" from cart?`)) {
    removeFromCart(index);
    showNotification('Item removed from cart');
  }
}

function selectAllItems() {
  const checkboxes = document.querySelectorAll('.item-checkbox');
  const allChecked = Array.from(checkboxes).every(cb => cb.checked);
  checkboxes.forEach(cb => cb.checked = !allChecked);
  updateCheckboxes();
}

function updateCheckboxes() {
  // reserved for later
}

function deleteSelected() {
  const checkboxes = document.querySelectorAll('.item-checkbox:checked');
  
  if (checkboxes.length === 0) {
    showNotification('Please select items to delete', 'info');
    return;
  }
  
  if (confirm(`Delete ${checkboxes.length} selected item(s)?`)) {
    const indices = Array.from(checkboxes)
      .map(cb => parseInt(cb.dataset.index))
      .sort((a, b) => b - a);
    
    indices.forEach(index => {
      cartItems.splice(index, 1);
    });
    
    updateCartBadge();
    loadCart();
    showNotification(`${checkboxes.length} item(s) removed`);
  }
}

function handleClearCart() {
  if (cartItems.length === 0) {
    showNotification('Cart is already empty', 'info');
    return;
  }
  
  if (confirm('Are you sure you want to clear all items from cart?')) {
    clearCart();
    showNotification('Cart cleared successfully');
  }
}

function handleCheckout() {
  if (cartItems.length === 0) {
    showNotification('Your cart is empty!');
    return;
  }
  
  showNotification('Proceeding to checkout...');
  console.log('Checkout items:', cartItems);
}

window.addEventListener('DOMContentLoaded', function() {
  loadCart();
  updateCartBadge();
});

window.addToCart = addToCart;
