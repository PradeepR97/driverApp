import { useEffect, useRef } from 'react';

import { getAccessToken } from '@/lib/auth-session';
import {
  buildDriverWebSocketConnection,
  DRIVER_LOCATION_PUSH_INTERVAL_MS,
  formatWsConnectMessage,
} from '@/lib/config';
import { useDriverStore } from '@/lib/driver-store';
import {
  formatDriverLocationWebSocketMessage,
  getDriverCoordsForLocationPing,
} from '@/lib/location/driver-coords';
import { parseDriverWsMessage } from '@/lib/realtime/driver-ws-incoming';
import {
  connectDriverWebSocketWithRetry,
  type DriverWebSocketController,
} from '@/lib/realtime/driver-websocket';

/**
 * `/ws/driver/location`: Bearer JWT on handshake (native), LOCATION frames on an interval,
 * server pushes NEW_ORDER → `pendingNewOrder` in the driver store.
 */
export function useDriverOnlineWebSocket(isOnline: boolean): void {
  const setDriverSocketStatus = useDriverStore((s) => s.setDriverSocketStatus);
  const isOnlineRef = useRef(isOnline);
  isOnlineRef.current = isOnline;

  useEffect(() => {
    if (!isOnline) {
      setDriverSocketStatus('disconnected');
      return;
    }

    setDriverSocketStatus('connecting');

    let locationTimer: ReturnType<typeof setInterval> | null = null;
    let ctrl: DriverWebSocketController;

    const clearLocationTimer = () => {
      if (locationTimer) {
        clearInterval(locationTimer);
        locationTimer = null;
      }
    };

    /** Prevents overlapping `getCurrentPositionAsync` calls when the interval is shorter than GPS latency. */
    let locationPushInFlight = false;

    const pushLocationOnce = async () => {
      if (locationPushInFlight) return;
      locationPushInFlight = true;
      try {
        const coords = await getDriverCoordsForLocationPing();
        if (!coords) {
          if (__DEV__) {
            console.warn('[driver-ws] location skipped (no permission or GPS error)');
          }
          return;
        }
        const ok = ctrl.send(formatDriverLocationWebSocketMessage(coords));
        if (__DEV__ && ok) {
          console.log('[driver-ws] sent LOCATION', coords.lat, coords.lon);
        }
      } finally {
        locationPushInFlight = false;
      }
    };

    ctrl = connectDriverWebSocketWithRetry({
      shouldReconnect: () => isOnlineRef.current && !!getAccessToken(),
      getConnection: () => {
        const token = getAccessToken();
        return token ? buildDriverWebSocketConnection(token) : null;
      },
      getConnectPayload: () => formatWsConnectMessage(getAccessToken()),
      handlers: {
        onOpen: () => {
          setDriverSocketStatus('connected');
          clearLocationTimer();
          void pushLocationOnce();
          locationTimer = setInterval(() => {
            void pushLocationOnce();
          }, DRIVER_LOCATION_PUSH_INTERVAL_MS);
        },
        onClose: () => {
          clearLocationTimer();
          setDriverSocketStatus(isOnlineRef.current ? 'reconnecting' : 'disconnected');
        },
        onError: () => setDriverSocketStatus('error'),
        onMessage: (data) => {
          const parsed = parseDriverWsMessage(data);
          if (parsed.kind === 'NEW_ORDER') {
            useDriverStore.getState().setPendingNewOrder(parsed.offer);
            return;
          }
          if (parsed.kind === 'ERROR' && __DEV__) {
            console.warn('[driver-ws] ERROR', parsed.message);
          }
          if (parsed.kind === 'ACK' && __DEV__ && parsed.message === 'CONNECTED') {
            console.log('[driver-ws] ACK CONNECTED');
          }
          if (parsed.kind === 'LOCATION_ACK' && __DEV__) {
            console.log('[driver-ws] LOCATION_RECEIVED');
          }
        },
      },
    });

    return () => {
      clearLocationTimer();
      ctrl.close();
      setDriverSocketStatus('disconnected');
    };
  }, [isOnline, setDriverSocketStatus]);
}
