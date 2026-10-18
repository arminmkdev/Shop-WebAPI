const cartRows = document.getElementById('cartRows');
const pageMessage = document.getElementById('pageMessage');
let cart = null;

function cartItemsArray(value) {
  return Array.isArray(value?.cartItems) ? value.cartItems : [];
}
function renderCart() {
  const items = cartItemsArray(cart);
  cartRows.replaceChildren();
  if (!items.length) {
    const tr = document.createElement('tr'),
      td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'text-center text-secondary py-4';
    td.textContent = 'Your cart is empty.';
    tr.appendChild(td);
    cartRows.appendChild(tr);
  }
  items.forEach(item => {
    const tr = document.createElement('tr');
    const values = [
      safeText(item.productName, `Product ${item.productId}`),
      money(item.price),
      String(item.quantity),
      money(item.totalPrice)
    ];
    values.forEach((value, i) => {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    });
    const actionCell = document.createElement('td');
    const group = document.createElement('div');
    group.className = 'btn-group btn-group-sm';
    const minus = document.createElement('button');
    minus.className = 'btn btn-outline-secondary';
    minus.textContent = '−';
    minus.title = 'Decrease quantity';
    minus.addEventListener('click', () =>
      updateQuantity(item, Math.max(1, Number(item.quantity) - 1))
    );
    const plus = document.createElement('button');
    plus.className = 'btn btn-outline-secondary';
    plus.textContent = '+';
    plus.title = 'Increase quantity';
    plus.addEventListener('click', () =>
      updateQuantity(item, Number(item.quantity) + 1)
    );
    const remove = document.createElement('button');
    remove.className = 'btn btn-outline-danger';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => removeItem(item));
    group.append(minus, plus);
    actionCell.append(group, remove);
    tr.appendChild(actionCell);
    cartRows.appendChild(tr);
  });
  document.getElementById('cartTotal').textContent = money(cart?.totalPrice);
}
async function loadCart() {
  try {
    cart = await apiGet(API_PATHS.cart);
    renderCart();
  } catch (error) {
    showMessage(pageMessage, `${error.message}`, 'danger');
    cartRows.replaceChildren();
  }
}
async function updateQuantity(item, quantity) {
  try {
    await apiPatch(
      `${API_PATHS.cartItems}/${encodeURIComponent(item.cartItemId)}`,
      {
        quantity
      }
    );
    await loadCart();
  } catch (error) {
    showMessage(pageMessage, error.message, 'danger');
  }
}
async function removeItem(item) {
  try {
    await apiDelete(
      `${API_PATHS.cartItems}/${encodeURIComponent(item.cartItemId)}`
    );
    await loadCart();
  } catch (error) {
    showMessage(pageMessage, error.message, 'danger');
  }
}
document
  .getElementById('clearCartButton')
  .addEventListener('click', async () => {
    try {
      await apiDelete(API_PATHS.cart);
      await loadCart();
      showMessage(pageMessage, 'Cart cleared.', 'success');
    } catch (error) {
      showMessage(pageMessage, error.message, 'danger');
    }
  });
document
  .getElementById('checkoutButton')
  .addEventListener('click', async () => {
    if (!cartItemsArray(cart).length) {
      showMessage(pageMessage, 'Your cart is empty.', 'warning');
      return;
    }
    const userId = getCurrentUserId();
    if (!userId) {
      showMessage(
        pageMessage,
        'A user ID is required to create an order. The current login response does not expose one; configure user ID retrieval first.',
        'warning'
      );
      return;
    }
    try {
      await apiPost(API_PATHS.orders);
      await apiDelete(API_PATHS.cart);
      showMessage(pageMessage, 'Order created successfully.', 'success');
      window.location.href = '../orders.html';
    } catch (error) {
      showMessage(
        pageMessage,
        `Could not place order: ${error.message}`,
        'danger'
      );
    }
  });
loadCart();
