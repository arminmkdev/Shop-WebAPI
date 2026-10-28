export function readTokenRoles(token = localStorage.getItem('shop.accessToken')) {
  try {
    if (!token || token.split('.').length < 2) return [];
    const payload = JSON.parse(
      decodeURIComponent(
        escape(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      )
    );
    const roleKeys = [
      'role',
      'roles',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
    ];
    return roleKeys
      .flatMap(key =>
        payload[key] == null
          ? []
          : Array.isArray(payload[key])
          ? payload[key]
          : [payload[key]]
      )
      .map(String);
  } catch {
    return [];
  }
}

export function rolesFromUser(user) {
  const values = [
    user?.role,
    user?.roles,
    user?.roleName,
    user?.claims
  ].flatMap(v => (v == null ? [] : Array.isArray(v) ? v : [v]));
  return values
    .map(v =>
      typeof v === 'string' ? v : v?.value || v?.role || v?.name || ''
    )
    .filter(Boolean)
    .map(String);
}

export function isAdminUser(user) {
  return [
    ...readTokenRoles(),
    ...rolesFromUser(user),
    ...(localStorage.getItem('shop.role')
      ? [localStorage.getItem('shop.role')]
      : [])
  ].some(role => role.toLowerCase() === 'admin');
}

export function notifyAuthChanged() {
  window.dispatchEvent(new Event('shop-auth-changed'));
}