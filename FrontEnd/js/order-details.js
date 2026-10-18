const message = document.getElementById('pageMessage');
const detailsRows = document.getElementById('orderDetailsRows');

async function loadOrderDetails() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('id');

  if (!orderId || !Number.isInteger(Number(orderId)) || Number(orderId) <= 0) {
    showMessage(message, 'Invalid order ID.', 'danger');
    return;
  }

  try {
    const order = await apiGet(
      `${API_PATHS.orders}/${encodeURIComponent(orderId)}`
    );

    document.getElementById('orderId').textContent = safeText(order.orderId);

    document.getElementById('orderStatus').textContent = safeText(
      order.orderStatus
    );

    document.getElementById('orderTotal').textContent = money(order.totalPrice);

    detailsRows.replaceChildren();

    const items = Array.isArray(order.orderDetails) ? order.orderDetails : [];

    if (!items.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');

      td.colSpan = 4;
      td.className = 'text-center text-secondary py-4';
      td.textContent = 'No items found for this order.';

      tr.appendChild(td);
      detailsRows.appendChild(tr);
      return;
    }

    items.forEach(item => {
      const tr = document.createElement('tr');

      [
        item.productId,
        money(item.price),
        item.quantity,
        money(item.totalPrice)
      ].forEach(value => {
        const td = document.createElement('td');
        td.textContent = safeText(value);
        tr.appendChild(td);
      });

      detailsRows.appendChild(tr);
    });
  } catch (error) {
    showMessage(
      message,
      `Could not load order details: ${error.message}`,
      'danger'
    );
  }
}

loadOrderDetails();
