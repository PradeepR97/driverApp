import { api, getApiErrorMessage } from '@/lib/api/client';
import type { ApiEnvelope } from '@/lib/api/types';
import { isApiFailure } from '@/lib/api/types';
import { AUTH_LOGOUT_PATH } from '@/lib/config';

/**
 * POST /auth/logout — Bearer token, no body.
 */
export async function logoutUser(): Promise<void> {
  try {
    const { data } = await api.post<ApiEnvelope<unknown>>(AUTH_LOGOUT_PATH);
    if (isApiFailure(data)) {
      throw new Error(data.message ?? 'Logout failed');
    }
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
