import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = "http://127.0.0.1:8000/api/";
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_ROLE_KEY = "user_role";

const api = axios.create({
  baseURL: API_BASE_URL,
});

let refreshPromise: Promise<string | null> | null = null;

function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setStoredAccessToken(access: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
}

function clearStoredAuth(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function requestTokenRefresh(): Promise<string | null> {
  const refresh = getStoredRefreshToken();
  if (!refresh) return null;

  const endpointCandidates = ["auth/token/refresh/", "auth/refresh/"];

  for (const endpoint of endpointCandidates) {
    try {
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, { refresh });
      const nextAccess = response.data?.access as string | undefined;
      if (nextAccess) {
        setStoredAccessToken(nextAccess);
        return nextAccess;
      }
    } catch {
      // Try next endpoint candidate.
    }
  }

  clearStoredAuth();
  return null;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (status === 403) {
      const msg =
        (error.response?.data as { message?: string })?.message ||
        "You do not have permission to perform this action.";
      toast.error(msg);
    }

    if (!originalRequest || status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('auth/login') ||
      originalRequest.url?.includes('auth/register')) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      clearStoredAuth();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    refreshPromise ??= requestTokenRefresh().finally(() => {
      refreshPromise = null;
    });

    const nextAccess = await refreshPromise;
    if (!nextAccess) {
      clearStoredAuth();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${nextAccess}`;
    return api(originalRequest);
  }
);

export default api;
