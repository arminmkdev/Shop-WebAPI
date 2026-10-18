async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('shop.accessToken');
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData) && options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const text = await response.text();

    console.error('API Error:', {
      status: response.status,
      response: text
    });

    if (response.status === 401) {
      throw new Error('Please sign in to continue.');
    }

    if (response.status === 403) {
      throw new Error('You do not have permission to access this resource.');
    }

    let message = `Request failed (${response.status})`;

    try {
      const data = JSON.parse(text);
      message =
        data.message || data.detail || data.title || data.error || message;
    } catch (_) {
      if (text) message = text;
    }

    throw new Error(message);
  }

  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';

  if (
    contentType.includes('application/json') ||
    contentType.includes('text/json')
  ) {
    return response.json();
  }

  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (_) {
    return text;
  }
}

function apiGet(path) {
  return apiRequest(path);
}

function apiPost(path, body) {
  return apiRequest(path, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body)
  });
}

function apiPatch(path, body) {
  return apiRequest(path, {
    method: 'PATCH',
    body: JSON.stringify(body)
  });
}

function apiDelete(path, body) {
  return apiRequest(path, {
    method: 'DELETE',
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
}

function unwrapArray(payload) {
  if (Array.isArray(payload)) return payload;

  return (
    payload?.items ||
    payload?.data ||
    payload?.products ||
    payload?.categories ||
    payload?.orders ||
    []
  );
}

function money(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}
