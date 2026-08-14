const API_BASE = import.meta.env.VITE_API_URL || '';

export const getStoredTokens = () => {
  try {
    const accessToken = localStorage.getItem('kpyrios_access_token');
    const refreshToken = localStorage.getItem('kpyrios_refresh_token');
    return { accessToken, refreshToken };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
};

export const setStoredTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('kpyrios_access_token', accessToken);
  localStorage.setItem('kpyrios_refresh_token', refreshToken);
};

export const clearStoredTokens = () => {
  localStorage.removeItem('kpyrios_access_token');
  localStorage.removeItem('kpyrios_refresh_token');
  localStorage.removeItem('kpyrios_user');
};

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { accessToken } = getStoredTokens();
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(endpoint: string) => apiClient<T>(`/api/v1${endpoint}`),
  post: <T>(endpoint: string, body?: unknown) =>
    apiClient<T>(`/api/v1${endpoint}`, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body?: unknown) =>
    apiClient<T>(`/api/v1${endpoint}`, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string) =>
    apiClient<T>(`/api/v1${endpoint}`, {
      method: 'DELETE',
    }),
};
