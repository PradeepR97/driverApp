import { Platform } from 'react-native';
import { devLog } from '@/utils/devLog';
const WebSocketCtor = WebSocket;
const MAX_DELAY_MS = 30_000;
const BASE_DELAY_MS = 1_000;
/** Log URL without query (tokens must not appear in logs). */
function wsUrlForLog(url) {
    try {
        const u = new URL(url);
        return `${u.protocol}//${u.host}${u.pathname}`;
    }
    catch {
        return '(invalid url)';
    }
}
/**
 * Native (iOS/Android): `Authorization: Bearer <jwt>` on the handshake (per backend spec).
 * Web: browsers cannot set WS headers — `access_token` query is appended as a fallback for dev.
 */
export function openDriverWebSocket(url, bearerToken) {
    const token = bearerToken.trim();
    if (Platform.OS === 'web') {
        try {
            const u = new URL(url);
            u.searchParams.set('access_token', token);
            return new WebSocket(u.toString());
        }
        catch {
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
export function connectDriverWebSocketWithRetry(options) {
    let ws = null;
    let attempt = 0;
    let reconnectTimer = null;
    let closedManually = false;
    const clearTimer = () => {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
    };
    const scheduleReconnect = () => {
        clearTimer();
        if (closedManually || !options.shouldReconnect())
            return;
        const delay = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt);
        attempt += 1;
        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connectNow();
        }, delay);
    };
    const connectNow = () => {
        if (closedManually || !options.shouldReconnect())
            return;
        const conn = options.getConnection();
        if (!conn) {
            if (__DEV__) {
                devLog.wsWarn('[driver-ws] connect skipped: no connection (missing access token or invalid WS URL — check EXPO_PUBLIC_API_URL / EXPO_PUBLIC_WS_URL)');
            }
            scheduleReconnect();
            return;
        }
        if (__DEV__) {
            devLog.wsOpen(`[driver-ws] connecting ${wsUrlForLog(conn.url)} (attempt ${attempt + 1})`);
        }
        try {
            ws = openDriverWebSocket(conn.url, conn.bearerToken);
        }
        catch (e) {
            if (__DEV__) {
                devLog.wsError('[driver-ws] new WebSocket threw', e);
            }
            options.handlers.onError?.();
            scheduleReconnect();
            return;
        }
        const socket = ws;
        socket.onopen = () => {
            if (__DEV__) {
                devLog.wsOpen(`[driver-ws ✓] open ${wsUrlForLog(conn.url)}`);
            }
            attempt = 0;
            options.handlers.onOpen?.();
            const payload = options.getConnectPayload?.() ?? null;
            if (payload && socket.readyState === WebSocket.OPEN) {
                try {
                    socket.send(payload);
                    if (__DEV__) {
                        let parsed;
                        try { parsed = JSON.parse(payload); } catch { parsed = payload; }
                        devLog.wsBox('magenta', `↑ [WS]  ${parsed?.type ?? 'CONNECT'}`, [
                            { label: 'PAYLOAD', data: parsed?.payload ?? parsed },
                        ]);
                    }
                }
                catch {
                    /* ignore */
                }
            }
        };
        socket.onmessage = (ev) => {
            const raw = typeof ev.data === 'string' ? ev.data : '';
            if (!raw)
                return;
            try {
                const parsed = JSON.parse(raw);
                if (__DEV__) {
                    devLog.wsBox('cyan', `↓ [WS]  ${parsed?.type ?? 'message'}`, [
                        { label: 'PAYLOAD', data: parsed?.payload ?? parsed },
                    ]);
                }
                options.handlers.onMessage?.(parsed, raw);
            }
            catch {
                if (__DEV__) {
                    devLog.wsWarn('[driver-ws ↓] message (raw, unparseable)', raw);
                }
                options.handlers.onMessage?.(raw, raw);
            }
        };
        socket.onerror = () => {
            if (__DEV__) {
                devLog.wsError('[driver-ws] error event (React Native often omits details; watch the following close code)');
            }
            options.handlers.onError?.();
        };
        socket.onclose = (ev) => {
            if (__DEV__) {
                const reason = ev.reason ?? '';
                const label = `[driver-ws] closed  code=${ev.code}${reason ? `  reason=${reason}` : '  (no reason)'}`;
                if (ev.code === 1000 || ev.code === 1001) {
                    devLog.wsWarn(label);
                } else {
                    devLog.wsError(label);
                }
            }
            ws = null;
            options.handlers.onClose?.(ev.code, ev.reason ?? '');
            if (!closedManually && options.shouldReconnect()) {
                scheduleReconnect();
            }
        };
    };
    connectNow();
    const send = (text) => {
        if (!ws || ws.readyState !== WebSocket.OPEN)
            return false;
        try {
            ws.send(text);
            if (__DEV__) {
                let parsed;
                try { parsed = JSON.parse(text); } catch { parsed = text; }
                devLog.wsBox('magenta', `↑ [WS]  ${parsed?.type ?? 'sent'}`, [
                    { label: 'PAYLOAD', data: parsed?.payload ?? parsed },
                ]);
            }
            return true;
        }
        catch {
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
                }
                catch {
                    /* ignore */
                }
                ws = null;
            }
        },
    };
}
