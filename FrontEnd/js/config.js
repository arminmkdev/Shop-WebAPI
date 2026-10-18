// Update this URL to match your running ASP.NET API.
const API_BASE_URL = 'https://localhost:5001';

// The API schema does not define user list or category write endpoints.
const API_PATHS = {
  register: '/identity/register',
  login: '/identity/login',
  products: '/products',
  categories: '/Categories',
  cart: '/carts',
  cartItems: '/cartItems',
  orders: '/orders'
};
