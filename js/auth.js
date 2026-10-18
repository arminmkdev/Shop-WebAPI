const messageBox = document.getElementById('formMessage');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

if (registerForm) {
  registerForm.addEventListener('submit', async event => {
    event.preventDefault();
    hideMessage(messageBox);
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    try {
      await apiPost(API_PATHS.register, { email, password });
      showMessage(
        messageBox,
        'Account created. You can now log in.',
        'success'
      );
      registerForm.reset();
    } catch (error) {
      showMessage(messageBox, error.message, 'danger');
    }
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    hideMessage(messageBox);
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    try {
      const result = await apiPost(API_PATHS.login, { email, password });
      if (result?.accessToken)
        localStorage.setItem('shop.accessToken', result.accessToken);
      if (result?.refreshToken)
        localStorage.setItem('shop.refreshToken', result.refreshToken);
      localStorage.setItem('shop.email', email);
      showMessage(messageBox, 'Login successful.', 'success');
      setTimeout(() => (window.location.href = 'index.html'), 600);
    } catch (error) {
      showMessage(messageBox, error.message, 'danger');
    }
  });
}
