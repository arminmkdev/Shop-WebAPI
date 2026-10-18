const ordersRows = document.getElementById('ordersRows');
const message = document.getElementById('pageMessage');

async function loadOrders() {
  try {
    const orders = unwrapArray(await apiGet(API_PATHS.orders));

    ordersRows.replaceChildren();

    if (!orders.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');

      td.colSpan = 4;
      td.className = 'text-center text-secondary py-4';
      td.textContent = 'No orders found.';

      tr.appendChild(td);
      ordersRows.appendChild(tr);
      return;
    }

    orders.forEach(order => {
      const tr = document.createElement('tr');

      [order.orderId, order.orderStatus, money(order.totalPrice)].forEach(
        value => {
          const td = document.createElement('td');
          td.textContent = safeText(value);
          tr.appendChild(td);
        }
      );

      const actionCell = document.createElement('td');
      const button = document.createElement('a');

      button.className = 'btn btn-sm btn-outline-primary';
      button.textContent = 'Details';
      button.href = `order-details.html?id=${encodeURIComponent(
        order.orderId
      )}`;

      actionCell.appendChild(button);
      tr.appendChild(actionCell);
      ordersRows.appendChild(tr);
    });
  } catch (error) {
    showMessage(message, `Could not load orders: ${error.message}`, 'danger');
  }
}

loadOrders();
