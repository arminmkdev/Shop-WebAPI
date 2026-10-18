SHOP BOOTSTRAP FRONTEND

A lightweight, English-only Bootstrap 5 frontend based on the supplied OpenAPI schema.

PAGES
- index.html: Product listing, search, category filter, add-to-cart action
- login.html: Identity login
- register.html: Identity registration
- cart.html: Cart item quantity updates, remove, clear cart, create order
- orders.html: Order listing and order details
- admin.html: Product CRUD, category list, order list, user API limitations

SETUP
1. Update API_BASE_URL in js/config.js if your API is not running at https://localhost:5001.
2. Serve these files through a local web server; do not rely on opening file:// URLs.
3. Enable CORS in the ASP.NET API for the frontend origin.
4. Make sure the API is running and the HTTPS development certificate is trusted.

IMPORTANT API LIMITATIONS FROM THE SUPPLIED SCHEMA
- Categories expose GET /Categories and GET /Categories/{id} only. Category create/update/delete are not implemented because the schema does not define those endpoints.
- Identity exposes register and login, but there is no endpoint to list or manage users. The Admin > Users tab documents this limitation.
- The login response contains accessToken and refreshToken, but the schema does not provide a userId. Cart item and order commands require userId. Set shop.userId after obtaining it through a suitable API endpoint, or update the backend to return/expose the authenticated user ID. The UI intentionally does not guess a user ID.
- GET /carts has no userId parameter and depends on backend authentication/ownership behavior.
- OrderStatus is an integer enum; this frontend sends 0 when creating an order. Adjust that value to match your backend's enum.
- The supplied schema does not define an order status update endpoint.
- The admin page is only a frontend. Protect admin APIs with server-side authorization; hiding a page or link is not security.
- Tokens are stored in localStorage for this simple demo. For production, consider a secure HttpOnly cookie-based auth design and review XSS risks.
- Product images can be uploaded through POST /products/{id}/image, but an image upload control is not included in this minimal UI.
- Currency display defaults to USD; change money() in js/api.js if needed.

The supplied schema is treated as the source of truth. Endpoint payloads may need minor adjustments to match actual controller validation and authentication behavior.
