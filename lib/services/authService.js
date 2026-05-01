import { api, getApiErrorMessage } from '@/api/client';
import { isApiFailure } from '@/api/types';
import { AUTH_LOGOUT_PATH } from '@/config/appConfig';
/**
 * POST /auth/logout — Bearer token, no body.
 */
export async function logoutUser() {
    try {
        const { data } = await api.post(AUTH_LOGOUT_PATH);
        if (isApiFailure(data)) {
            throw new Error(data.message ?? 'Logout failed');
        }
    }
    catch (e) {
        throw new Error(getApiErrorMessage(e));
    }
}
