const adminMessage = document.getElementById('adminMessage');
const productModal = new bootstrap.Modal(
  document.getElementById('productModal')
);
const productForm = document.getElementById('productForm');
let adminProducts = [],
  adminCategories = [],
  adminOrders = [];

function adminStatus(text, type = 'success') {
  showMessage(adminMessage, text, type);
}
function makeCell(row, value) {
  const td = document.createElement('td');
  td.textContent = safeText(value);
  row.appendChild(td);
  return td;
}

async function loadAdminData() {
  hideMessage(adminMessage);
  const results = await Promise.allSettled([
    apiGet(API_PATHS.products).then(unwrapArray),
    apiGet(API_PATHS.categories).then(unwrapArray),
    apiGet(API_PATHS.orders).then(unwrapArray)
  ]);
  adminProducts = results[0].status === 'fulfilled' ? results[0].value : [];
  adminCategories = results[1].status === 'fulfilled' ? results[1].value : [];
  adminOrders = results[2].status === 'fulfilled' ? results[2].value : [];
  renderAdminProducts();
  renderAdminCategories();
  renderAdminOrders();
  fillCategoryOptions();
  const errors = results
    .filter(r => r.status === 'rejected')
    .map(r => r.reason?.message || 'API error');
  if (errors.length)
    adminStatus(
      `Some data could not be loaded: ${errors.join('; ')}`,
      'warning'
    );
}
function renderAdminProducts() {
  const tbody = document.getElementById('adminProductsRows');
  tbody.replaceChildren();
  if (!adminProducts.length) {
    const tr = document.createElement('tr');
    const td = makeCell(tr, 'No products found.');
    td.colSpan = 7;
    td.className = 'text-center py-4 text-secondary';
    tbody.appendChild(tr);
    return;
  }
  adminProducts.forEach(p => {
    const tr = document.createElement('tr');
    makeCell(tr, p.productId);
    makeCell(tr, p.name);
    const category = adminCategories.find(
      c => String(c.categoryId) === String(p.categoryId)
    );
    makeCell(tr, category?.name || p.categoryId);
    makeCell(tr, money(p.price));
    makeCell(tr, p.quantity);
    const status = document.createElement('td');
    status.innerHTML =
      p.isActive === false
        ? '<span class="badge text-bg-secondary">Inactive</span>'
        : '<span class="badge text-bg-success">Active</span>';
    tr.appendChild(status);
    const actions = document.createElement('td');
    actions.className = 'text-nowrap';
    const edit = document.createElement('button');
    edit.className = 'btn btn-sm btn-outline-primary me-1';
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => openProduct(p));
    const del = document.createElement('button');
    del.className = 'btn btn-sm btn-outline-danger';
    del.textContent = 'Delete';
    del.addEventListener('click', () => deleteProduct(p));
    actions.append(edit, del);
    tr.appendChild(actions);
    tbody.appendChild(tr);
  });
}
function renderAdminCategories() {
  const tbody = document.getElementById('adminCategoriesRows');
  tbody.replaceChildren();
  if (!adminCategories.length) {
    const tr = document.createElement('tr'),
      td = makeCell(tr, 'No categories found.');
    td.colSpan = 4;
    td.className = 'text-center py-4 text-secondary';
    tbody.appendChild(tr);
    return;
  }
  adminCategories.forEach(c => {
    const tr = document.createElement('tr');
    makeCell(tr, c.categoryId);
    makeCell(tr, c.name);
    makeCell(tr, c.description);
    const td = document.createElement('td');
    td.innerHTML = c.isActive
      ? '<span class="badge text-bg-success">Active</span>'
      : '<span class="badge text-bg-secondary">Inactive</span>';
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
}
function renderAdminOrders() {
  const tbody = document.getElementById('adminOrdersRows');
  tbody.replaceChildren();
  if (!adminOrders.length) {
    const tr = document.createElement('tr'),
      td = makeCell(tr, 'No orders found.');
    td.colSpan = 5;
    td.className = 'text-center py-4 text-secondary';
    tbody.appendChild(tr);
    return;
  }
  adminOrders.forEach(o => {
    const tr = document.createElement('tr');
    makeCell(tr, o.orderId);
    makeCell(tr, o.userId);
    makeCell(tr, o.orderStatus);
    makeCell(tr, money(o.totalPrice));
    const td = document.createElement('td'),
      btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-outline-primary';
    btn.textContent = 'Details';
    btn.addEventListener('click', async () => {
      try {
        const d = await apiGet(
          `${API_PATHS.orders}/${encodeURIComponent(o.orderId)}`
        );
        alert(JSON.stringify(d, null, 2));
      } catch (e) {
        adminStatus(e.message, 'danger');
      }
    });
    td.appendChild(btn);
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
}
function fillCategoryOptions(selected) {
  const select = document.getElementById('productCategory');
  select.replaceChildren(new Option('Select category', ''));
  adminCategories.forEach(c =>
    select.add(
      new Option(
        c.name,
        c.categoryId,
        false,
        String(c.categoryId) === String(selected)
      )
    )
  );
}
function openProduct(product = null) {
  productForm.reset();
  document.getElementById('productId').value = product?.productId ?? '';
  document.getElementById('productName').value = product?.name ?? '';
  document.getElementById('productDescription').value =
    product?.description ?? '';
  document.getElementById('productPrice').value = product?.price ?? '';
  document.getElementById('productQuantity').value = product?.quantity ?? 0;
  document.getElementById('productActive').checked = product?.isActive ?? true;
  document.getElementById('productModalTitle').textContent = product
    ? 'Edit product'
    : 'Add product';
  document.getElementById('productFormError').textContent = '';
  fillCategoryOptions(product?.categoryId);
  productModal.show();
}
async function saveProduct(event) {
  event.preventDefault();
  const id = document.getElementById('productId').value;
  const data = {
    name: document.getElementById('productName').value.trim(),
    description:
      document.getElementById('productDescription').value.trim() || null,
    price: Number(document.getElementById('productPrice').value),
    quantity: Number(document.getElementById('productQuantity').value),
    isActive: document.getElementById('productActive').checked,
    categoryId: Number(document.getElementById('productCategory').value)
  };
  try {
    if (id)
      await apiPatch(`${API_PATHS.products}/${encodeURIComponent(id)}`, {
        id: Number(id),
        ...data,
        categoryId: String(data.categoryId)
      });
    else await apiPost(API_PATHS.products, data);
    productModal.hide();
    adminStatus(id ? 'Product updated.' : 'Product created.');
    await loadAdminData();
  } catch (error) {
    document.getElementById('productFormError').textContent = error.message;
  }
}
async function deleteProduct(product) {
  if (!confirm(`Delete "${product.name}"?`)) return;
  try {
    await apiDelete(
      `${API_PATHS.products}/${encodeURIComponent(product.productId)}`
    );
    adminStatus('Product deleted.');
    await loadAdminData();
  } catch (error) {
    adminStatus(`Could not delete product: ${error.message}`, 'danger');
  }
}
document
  .getElementById('newProductButton')
  .addEventListener('click', () => openProduct());
document
  .getElementById('refreshAdmin')
  .addEventListener('click', loadAdminData);
productForm.addEventListener('submit', saveProduct);
loadAdminData();
