import api from "./api";

export type UserRole = "student" | "company" | "admin" | "administration";

type JwtPayload = {
  role?: UserRole;
  user_role?: UserRole;
  exp?: number;
};

type LoginResponse = {
  access: string;
  refresh: string;
  role?: UserRole;
  user_role?: UserRole;
  company_status?: "approved" | "pending_approval" | "rejected";
};

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_ROLE_KEY = "user_role";
const COMPANY_STATUS_KEY = "company_status";

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
  localStorage.removeItem(COMPANY_STATUS_KEY);
}

export function getCompanyStatus(): string | null {
  return localStorage.getItem(COMPANY_STATUS_KEY);
}

export function getUserRole(): UserRole | null {
  const storedRole = localStorage.getItem(USER_ROLE_KEY) as UserRole | null;
  if (storedRole) return storedRole;

  const access = getAccessToken();
  if (!access) return null;

  const payload = decodeJwtPayload(access);
  const tokenRole = payload?.role ?? payload?.user_role ?? null;

  if (tokenRole) {
    localStorage.setItem(USER_ROLE_KEY, tokenRole);
  }

  return tokenRole;
}

export async function login(email: string, password: string): Promise<UserRole | null> {
  let data: LoginResponse;

  try {
    const res = await api.post<LoginResponse>("auth/login/", { email, password });
    data = res.data;
  } catch {
    // Backward compatibility for backends still expecting "username".
    const res = await api.post<LoginResponse>("auth/login/", { username: email, password });
    data = res.data;
  }

  setTokens(data.access, data.refresh);

  const role = data.role ?? data.user_role ?? getUserRole();
  if (role) localStorage.setItem(USER_ROLE_KEY, role);
  if (role === "company" && data.company_status) {
    localStorage.setItem(COMPANY_STATUS_KEY, data.company_status);
  }

  return role ?? null;
}

export async function logout(): Promise<void> {
  const refresh = getRefreshToken();
  try {
    if (refresh) {
      await api.post("auth/logout/", { refresh });
    }
  } catch {
    // Always clear local auth state even if backend logout fails.
  } finally {
    clearTokens();
  }
}
