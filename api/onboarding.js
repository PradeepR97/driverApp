import { ONBOARDING_DRIVER_PATH, ONBOARDING_OWNER_PATH, ONBOARDING_VEHICLE_PATH, } from '@/config/appConfig';
import { api, expectHttp200, getApiErrorMessage } from './client';
import { isApiFailure } from './types';
async function postEnvelope(path, body) {
    try {
        const res = await api.post(path, body);
        expectHttp200(res);
        const { data } = res;
        if (isApiFailure(data)) {
            throw new Error(data.message ?? 'Request failed');
        }
    }
    catch (e) {
        throw new Error(getApiErrorMessage(e));
    }
}
export async function postOnboardingOwner(body) {
    await postEnvelope(ONBOARDING_OWNER_PATH, body);
}
export async function postOnboardingVehicle(body) {
    await postEnvelope(ONBOARDING_VEHICLE_PATH, body);
}
export async function postOnboardingDriver(body) {
    await postEnvelope(ONBOARDING_DRIVER_PATH, body);
}
export async function getOnboardingOwner() {
    try {
        const res = await api.get(ONBOARDING_OWNER_PATH);
        expectHttp200(res);
        const { data } = res;
        if (isApiFailure(data)) {
            throw new Error(data.message ?? 'Could not load owner onboarding');
        }
        return data.data ?? {};
    }
    catch (e) {
        throw new Error(getApiErrorMessage(e));
    }
}
export async function getOnboardingVehicle() {
    try {
        const res = await api.get(ONBOARDING_VEHICLE_PATH);
        expectHttp200(res);
        const { data } = res;
        if (isApiFailure(data)) {
            throw new Error(data.message ?? 'Could not load vehicle onboarding');
        }
        return data.data ?? {};
    }
    catch (e) {
        throw new Error(getApiErrorMessage(e));
    }
}
