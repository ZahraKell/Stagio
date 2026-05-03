import axios, { type AxiosRequestConfig, type Method } from "axios";
import api from "./api";

type JsonBody = Record<string, unknown> | unknown[] | string | number | boolean | null;

type FetchLikeInit = {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit | JsonBody;
};

type FetchLikeResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  json: <T = unknown>() => Promise<T>;
  text: () => Promise<string>;
};

const LEGACY_API_PREFIXES = [
  "http://127.0.0.1:8000/api/",
  "http://localhost:8000/api/",
  "https://127.0.0.1:8000/api/",
  "https://localhost:8000/api/",
];

const LEGACY_ROUTE_MAP: Record<string, string> = {
  "company/profile/": "auth/profile/",
  "company/profile/update/": "auth/profile/update/",
  "auth/company/complete/": "auth/company/complete-profile/",
};

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers;
}

function toRelativeApiUrl(url: string): string {
  for (const prefix of LEGACY_API_PREFIXES) {
    if (url.startsWith(prefix)) {
      const relative = url.slice(prefix.length);
      return LEGACY_ROUTE_MAP[relative] ?? relative;
    }
  }

  const withoutHost = url.replace(/^https?:\/\/[^/]+\/api\//, "");
  const withoutApiPrefix = withoutHost.replace(/^\/?api\//, "");
  const relative = withoutApiPrefix.replace(/^\/+/, "");
  return LEGACY_ROUTE_MAP[relative] ?? relative;
}

export async function apiFetch(url: string, init: FetchLikeInit = {}): Promise<FetchLikeResponse> {
  const method = (init.method ?? "GET").toUpperCase() as Method;
  const headers = normalizeHeaders(init.headers);

  let data: unknown = undefined;
  if (init.body !== undefined) {
    if (typeof init.body === "string") {
      try {
        data = JSON.parse(init.body);
      } catch {
        data = init.body;
      }
    } else {
      data = init.body;
    }
  }

  const config: AxiosRequestConfig = {
    url: toRelativeApiUrl(url),
    method,
    headers,
    data,
    validateStatus: () => true,
  };

  const response = await api.request(config);
  const payload = response.data;
  const statusText = response.statusText || "";

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    statusText,
    json: async <T = unknown>() => payload as T,
    text: async () => (typeof payload === "string" ? payload : JSON.stringify(payload ?? "")),
  };
}

export default apiFetch;

