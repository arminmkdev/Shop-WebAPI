const grid = document.getElementById('productsGrid');
const message = document.getElementById('pageMessage');
const search = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
let products = [];
let categories = [];

// Resolve image paths returned by the API. For example, /images/men/mens_jacket.jpg
// becomes https://localhost:5001/images/men/mens_jacket.jpg.
function getProductImageUrl(imageUrl) {
  const value = safeText(imageUrl, '').trim();
  if (!value) return '';

  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) {
    return value;
  }

  const apiBase = API_BASE_URL.replace(/\/+$/, '');
  return `${apiBase}/${value.replace(/^\/+/, '')}`;
}

function showImagePlaceholder(img) {
  const placeholder = document.createElement('div');
  placeholder.className =
    'product-image d-flex align-items-center justify-content-center text-secondary';
  placeholder.textContent = 'Image unavailable';
  img.replaceWith(placeholder);
}

function renderStore() {
  const term = search.value.trim().toLowerCase();
  const categoryId = categoryFilter.value;
  const filtered = products.filter(
    p =>
      (safeText(p.name, '').toLowerCase().includes(term) ||
        safeText(p.description, '').toLowerCase().includes(term)) &&
      (!categoryId || String(p.categoryId) === categoryId)
  );
  grid.replaceChildren();
  if (!filtered.length) {
    const col = document.createElement('div');
    col.className = 'col-12';
    col.innerHTML =
      '<div class="alert alert-light border">No products found.</div>';
    grid.appendChild(col);
    return;
  }
  filtered.forEach(p => {
    const col = document.createElement('div');
    col.className = 'col';
    const card = document.createElement('article');
    card.className = 'card h-100 product-card';
    const imageUrl = getProductImageUrl(p.imageUrl);
    if (imageUrl) {
      const img = document.createElement('img');
      img.className = 'product-image card-img-top';
      img.src = imageUrl;
      img.alt = safeText(p.name, 'Product');
      img.loading = 'lazy';
      img.addEventListener('error', () => showImagePlaceholder(img), {
        once: true
      });
      card.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className =
        'product-image d-flex align-items-center justify-content-center text-secondary';
      placeholder.textContent = 'No image';
      card.appendChild(placeholder);
    }
    const body = document.createElement('div');
    body.className = 'card-body d-flex flex-column';
    const title = document.createElement('h2');
    title.className = 'h6 card-title';
    title.textContent = safeText(p.name, 'Untitled product');
    const desc = document.createElement('p');
    desc.className = 'small text-secondary flex-grow-1';
    desc.textContent = safeText(p.description, 'No description available.');
    const meta = document.createElement('div');
    meta.className =
      'd-flex align-items-center justify-content-between gap-2 mt-2';
    const price = document.createElement('strong');
    price.textContent = money(p.price);
    const add = document.createElement('button');
    add.className = 'btn btn-sm btn-primary';
    const stockKnown =
      p.quantity !== null && p.quantity !== undefined && p.quantity !== '';
    const outOfStock = stockKnown && Number(p.quantity) <= 0;
    const inactive = p.isActive === false;
    add.textContent = outOfStock
      ? 'Out of stock'
      : inactive
      ? 'Unavailable'
      : 'Add to cart';
    add.disabled = outOfStock || inactive;
    add.title = outOfStock
      ? 'This product has zero stock. Update Stock in Admin > Products.'
      : inactive
      ? 'This product is inactive.'
      : '';
    add.addEventListener('click', () => addToCart(p));
    meta.append(price, add);
    body.append(title, desc, meta);
    card.appendChild(body);
    col.appendChild(card);
    grid.appendChild(col);
  });
}
async function addToCart(product) {
  const userId = getCurrentUserId();
  if (!localStorage.getItem('shop.accessToken')) {
    showMessage(
      message,
      'Please log in before adding items to your cart.',
      'warning'
    );
    return;
  }
  if (!userId) {
    showMessage(
      message,
      'You are signed in, but the access token does not contain a readable user ID. Update the API to return the user ID or include it in the JWT claims; the cart endpoint requires userId.',
      'warning'
    );
    return;
  }
  try {
    await apiPost(API_PATHS.cartItems, {
      productId: Number(product.productId),
      quantity: 1
    });
    showMessage(message, 'Product added to cart.', 'success');
    const count = document.getElementById('cartCount');
    if (count) count.textContent = String(Number(count.textContent || 0) + 1);
  } catch (error) {
    showMessage(message, error.message, 'danger');
  }
}
async function initStore() {
  try {
    [products, categories] = await Promise.all([
      apiGet(API_PATHS.products).then(unwrapArray),
      apiGet(API_PATHS.categories)
        .then(unwrapArray)
        .catch(() => [])
    ]);
    categoryFilter.replaceChildren(new Option('All categories', ''));
    categories.forEach(c =>
      categoryFilter.add(
        new Option(c.name || `Category ${c.categoryId}`, c.categoryId)
      )
    );
    renderStore();
    if (!products.length)
      showMessage(message, 'No products are available.', 'info');
  } catch (error) {
    showMessage(
      message,
      `Could not load products: ${error.message}. Check API URL, server status, and CORS settings.`,
      'danger'
    );
  }
}
search.addEventListener('input', renderStore);
categoryFilter.addEventListener('change', renderStore);
initStore();
