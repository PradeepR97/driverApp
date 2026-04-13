import { Platform } from 'react-native';

/** RN adds `options.headers` on the handshake; DOM lib typings omit it. */
type ReactNativeWebSocket = new (
  url: string,
  protocols?: string | string[] | null,
  options?: { headers?: Record<string, string> },
) => WebSocket;

const WebSocketCtor = WebSocket as unknown as ReactNativeWebSocket;

export type DriverWebSocketHandlers = {
  onOpen?: () => void;
  onClose?: (code: number, reason: string) => void;
  onError?: () => void;
  /** Parsed JSON when possible; otherwise the raw string. */
  onMessage?: (data: unknown, raw: string) => void;
};

export type DriverWebSocketController = {
  close: () => void;
  /** Returns false if the socket is not open. */
  send: (text: string) => boolean;
};

const MAX_DELAY_MS = 30_000;
const BASE_DELAY_MS = 1_000;

/** Log URL without query (tokens must not appear in logs). */
function wsUrlForLog(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return '(invalid url)';
  }
}

/**
 * Native (iOS/Android): `Authorization: Bearer <jwt>` on the handshake (per backend spec).
 * Web: browsers cannot set WS headers — `access_token` query is appended as a fallback for dev.
 */
export function openDriverWebSocket(url: string, bearerToken: string): WebSocket {
  const token = bearerToken.trim();
  if (Platform.OS === 'web') {
    try {
      const u = new URL(url);
      u.searchParams.set('access_token', token);
      return new WebSocket(u.toString());
    } catch {
      return new WebSocket(url);
    }
  }
  return new WebSocketCtor(url, undefined, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Maintains a WebSocket while `shouldReconnect()` stays true (e.g. driver online + has token).
 */
export function connectDriverWebSocketWithRetry(options: {
  shouldReconnect: () => boolean;
  getConnection: () => { url: string; bearerToken: string } | null;
  /** Rare: optional first text frame after open (not used for `/ws/driver/location` per spec). */
  getConnectPayload?: () => string | null;
  handlers: DriverWebSocketHandlers;
}): DriverWebSocketController {
  let ws: WebSocket | null = null;
  let attempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closedManually = false;

  const clearTimer = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = () => {
    clearTimer();
    if (closedManually || !options.shouldReconnect()) return;
    const delay = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt);
    attempt += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connectNow();
    }, delay);
  };

  const connectNow = () => {
    if (closedManually || !options.shouldReconnect()) return;
    const conn = options.getConnection();
    if (!conn) {
      if (__DEV__) {
        console.warn(
          '[driver-ws] connect skipped: no connection (missing access token or invalid WS URL — check EXPO_PUBLIC_API_URL / EXPO_PUBLIC_WS_URL)',
        );
      }
      scheduleReconnect();
      return;
    }

    if (__DEV__) {
      console.log('[driver-ws] connecting', wsUrlForLog(conn.url), `(attempt ${attempt + 1})`);
    }

    try {
      ws = openDriverWebSocket(conn.url, conn.bearerToken);
    } catch (e) {
      if (__DEV__) {
        console.warn('[driver-ws] new WebSocket threw', e);
      }
      options.handlers.onError?.();
      scheduleReconnect();
      return;
    }

    const socket = ws;

    socket.onopen = () => {
      if (__DEV__) {
        console.log('[driver-ws] open', wsUrlForLog(conn.url));
      }
      attempt = 0;
      options.handlers.onOpen?.();
      const payload = options.getConnectPayload?.() ?? null;
      if (payload && socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(payload);
        } catch {
          /* ignore */
        }
      }
    };

    socket.onmessage = (ev) => {
      const raw = typeof ev.data === 'string' ? ev.data : '';
      if (!raw) return;
      try {
        options.handlers.onMessage?.(JSON.parse(raw), raw);
      } catch {
        options.handlers.onMessage?.(raw, raw);
      }
    };

    socket.onerror = () => {
      if (__DEV__) {
        console.warn(
          '[driver-ws] error event (React Native often omits details; watch the following close code)',
        );
      }
      options.handlers.onError?.();
    };

    socket.onclose = (ev) => {
      if (__DEV__) {
        const reason = ev.reason ?? '';
        console.warn(
          '[driver-ws] closed',
          'code=',
          ev.code,
          reason ? `reason=${reason}` : '(no reason)',
          '— see https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code',
        );
      }
      ws = null;
      options.handlers.onClose?.(ev.code, ev.reason ?? '');
      if (!closedManually && options.shouldReconnect()) {
        scheduleReconnect();
      }
    };
  };

  connectNow();

  const send = (text: string): boolean => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(text);
      return true;
    } catch {
      return false;
    }
  };

  return {
    send,
    close: () => {
      closedManually = true;
      clearTimer();
      if (ws) {
        try {
          ws.onclose = null;
          ws.close();
        } catch {
          /* ignore */
        }
        ws = null;
      }
    },
  };
}
