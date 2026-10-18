const ordersRows = document.getElementById("ordersRows");
const message = document.getElementById("pageMessage");
async function loadOrders() {
  try {
    const orders = unwrapArray(await apiGet(API_PATHS.orders));
    ordersRows.replaceChildren();
    if (!orders.length) {
      const tr = document.createElement("tr"), td = document.createElement("td");
      td.colSpan = 5; td.className = "text-center text-secondary py-4"; td.textContent = "No orders found.";
      tr.appendChild(td); ordersRows.appendChild(tr); return;
    }
    orders.forEach(order => {
      const tr = document.createElement("tr");
      [order.orderId, order.userId, order.orderStatus, money(order.totalPrice)].forEach(v => {
        const td = document.createElement("td"); td.textContent = safeText(v); tr.appendChild(td);
      });
      const td = document.createElement("td"), button = document.createElement("button");
      button.className = "btn btn-sm btn-outline-primary"; button.textContent = "Details";
      button.addEventListener("click", async () => {
        try {
          const detail = await apiGet(`${API_PATHS.orders}/${encodeURIComponent(order.orderId)}`);
          alert(JSON.stringify(detail, null, 2));
        } catch (error) { showMessage(message, error.message, "danger"); }
      });
      td.appendChild(button); tr.appendChild(td); ordersRows.appendChild(tr);
    });
  } catch (error) { showMessage(message, `Could not load orders: ${error.message}`, "danger"); }
}
loadOrders();