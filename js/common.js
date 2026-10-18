function showMessage(element, message, type = 'info') {
  if (!element) return;

  element.className = `alert alert-${type}`;
  element.textContent = message;
  element.classList.remove('d-none');
}

function hideMessage(element) {
  if (!element) return;

  element.classList.add('d-none');
  element.textContent = '';
}

function safeText(value, fallback = '—') {
  return value == null || value === '' ? fallback : String(value);
}

async function getCurrentUserId() {
  try {
    const user = await apiGet('/identity/user');

    if (!user?.id) return '';

    localStorage.setItem('shop.userId', user.id);
    return user.id;
  } catch {
    localStorage.removeItem('shop.userId');
    return '';
  }
}

function showLoggedOutNav(host) {
  host.replaceChildren();

  const login = document.createElement('a');
  login.href = 'login.html';
  login.className = 'btn btn-outline-light btn-sm';
  login.textContent = 'Login';

  const register = document.createElement('a');
  register.href = 'register.html';
  register.className = 'btn btn-primary btn-sm';
  register.textContent = 'Register';

  host.append(login, register);
}

async function updateAuthNav() {
  const host = document.getElementById('authNav');
  if (!host) return;

  const token = localStorage.getItem('shop.accessToken');

  if (!token) {
    localStorage.removeItem('shop.email');
    localStorage.removeItem('shop.userId');
    showLoggedOutNav(host);
    return;
  }

  try {
    const user = await apiGet('/identity/user');

    if (!user?.id) throw new Error('User not found');

    localStorage.setItem('shop.userId', user.id);

    const email = user.email || 'Signed in';

    localStorage.setItem('shop.email', email);
    host.replaceChildren();

    const label = document.createElement('span');
    label.className = 'navbar-text text-light small me-2';
    label.textContent = email;

    const logout = document.createElement('button');
    logout.className = 'btn btn-outline-light btn-sm';
    logout.textContent = 'Logout';

    logout.addEventListener('click', () => {
      [
        'shop.accessToken',
        'shop.refreshToken',
        'shop.email',
        'shop.userId'
      ].forEach(key => localStorage.removeItem(key));

      window.location.href = 'index.html';
    });

    host.append(label, logout);
  } catch {
    [
      'shop.accessToken',
      'shop.refreshToken',
      'shop.email',
      'shop.userId'
    ].forEach(key => localStorage.removeItem(key));

    showLoggedOutNav(host);
  }
}

document.addEventListener('DOMContentLoaded', updateAuthNav);
