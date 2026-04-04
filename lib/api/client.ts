import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { getAccessToken } from '@/lib/auth-session';
import { API_BASE_URL } from '@/lib/config';

import type { ApiEnvelope } from './types';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** When true, do not send `Authorization` (e.g. OTP request / verify). */
    skipAuth?: boolean;
  }
  interface InternalAxiosRequestConfig {
    skipAuth?: boolean;
    metadata?: { id: number; startedAt: number };
  }
}

/**
 * Log every request and response (includes JSON serialization of bodies — can noticeably slow the UI in dev).
 * - Default: on in `__DEV__`, unless `EXPO_PUBLIC_API_DEBUG=false`
 * - Release: only if `EXPO_PUBLIC_API_DEBUG=true`
 */
const API_DEBUG_RAW = typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_DEBUG : undefined;
const API_DEBUG =
  API_DEBUG_RAW === 'false' || API_DEBUG_RAW === '0'
    ? false
    : (typeof __DEV__ !== 'undefined' && __DEV__) || API_DEBUG_RAW === 'true';

let requestSeq = 0;

function sanitizeForLog(data: unknown): unknown {
  if (data == null) return data;
  if (typeof data !== 'object') return data;
  const o = { ...(data as Record<string, unknown>) };
  for (const key of ['otp', 'password', 'token', 'accessToken', 'refreshToken', 'authorization']) {
    if (key in o && o[key] != null) o[key] = '***';
  }
  return o;
}

function summarizeForLog(data: unknown, maxLen = 900): unknown {
  if (data == null) return data;
  try {
    const s = typeof data === 'string' ? data : JSON.stringify(data);
    if (s.length <= maxLen) return data;
    return `${s.slice(0, maxLen)}… (${s.length} chars total)`;
  } catch {
    return '[unserializable]';
  }
}

function buildFullUrl(config: InternalAxiosRequestConfig): string {
  const base = (config.baseURL ?? '').replace(/\/$/, '');
  const path = config.url ?? '';
  if (path.startsWith('http')) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const id = ++requestSeq;
  config.metadata = { id, startedAt: Date.now() };

  if (!config.skipAuth) {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  if (API_DEBUG) {
    const fullUrl = buildFullUrl(config);
    console.log(`[API → #${id}] ${(config.method ?? 'GET').toUpperCase()} ${fullUrl}`, {
      skipAuth: !!config.skipAuth,
      params: config.params,
      body: config.data !== undefined ? sanitizeForLog(config.data) : undefined,
    });
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (API_DEBUG) {
      const meta = response.config.metadata;
      const ms = meta ? Date.now() - meta.startedAt : 0;
      console.log(
        `[API ← #${meta?.id ?? '?'}] ${response.status} ${(response.config.method ?? '').toUpperCase()} ${buildFullUrl(response.config)} (${ms}ms)`,
        { data: summarizeForLog(response.data) },
      );
    }
    return response;
  },
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    if (API_DEBUG) {
      const cfg = error.config;
      const meta = cfg?.metadata;
      const ms = meta && cfg ? Date.now() - meta.startedAt : 0;
      const fullUrl = cfg ? buildFullUrl(cfg) : error.config?.url ?? '(unknown url)';
      console.warn(
        `[API × #${meta?.id ?? '?'}] ${(cfg?.method ?? '?').toUpperCase()} ${fullUrl} (${ms}ms)`,
        {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          responseBody: summarizeForLog(error.response?.data),
        },
      );
    }
    return Promise.reject(error);
  },
);

/**
 * Human-readable message for any API failure (envelope, HTTP status, timeout, network).
 */
export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<ApiEnvelope<unknown>>;

    if (ax.code === 'ECONNABORTED' || /timeout/i.test(ax.message)) {
      return 'Request timed out. Please try again.';
    }

    if (!ax.response) {
      return 'Unable to reach the server. Check your connection and try again.';
    }

    const body = ax.response.data;
    if (body && typeof body === 'object' && 'message' in body && body.message != null) {
      return String((body as { message?: string }).message);
    }

    const status = ax.response.status;
    if (status >= 500) {
      return 'Server error. Please try again later.';
    }
    if (status === 401) {
      return 'Session expired. Please sign in again.';
    }
    if (status === 403) {
      return 'You do not have permission for this action.';
    }
    if (status === 404) {
      return 'Resource not found.';
    }

    if (ax.message) {
      return ax.message;
    }
  }

  if (err instanceof Error) {
    return err.message;
  }

  return 'Something went wrong. Please try again.';
}

/** True when there is no HTTP response (offline, DNS, refused connection). */
export function isApiNetworkError(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false;
  const ax = err as AxiosError;
  return !ax.response && (!!ax.code || ax.message === 'Network Error');
}
