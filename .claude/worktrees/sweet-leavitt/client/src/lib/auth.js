export const saveAuth = (token, user) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('crewup_token', token);
  localStorage.setItem('crewup_user', JSON.stringify(user));
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const u = localStorage.getItem('crewup_user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('crewup_token');
};

export const clearAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('crewup_token');
  localStorage.removeItem('crewup_user');
};

export const isAuthenticated = () => {
  return !!getToken();
};
