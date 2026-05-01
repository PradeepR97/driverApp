import { api, expectHttp200, getApiErrorMessage } from "./client";
import { isApiFailure } from "./types";
export async function postOtpRequest(payload) {
    try {
        const res = await api.post("/auth/otp/request", payload, {
            skipAuth: true,
        });
        expectHttp200(res);
        const { data } = res;
        if (isApiFailure(data)) {
            throw new Error(data.message ?? "Could not send OTP");
        }
        return data.data ?? {};
    }
    catch (e) {
        throw new Error(getApiErrorMessage(e));
    }
}
export async function postOtpVerify(payload) {
    try {
        const res = await api.post("/auth/otp/verify", payload, {
            skipAuth: true,
        });
        expectHttp200(res);
        const { data } = res;
        if (isApiFailure(data)) {
            throw new Error(data.message ?? "Invalid OTP");
        }
        return data.data;
    }
    catch (e) {
        throw new Error(getApiErrorMessage(e));
    }
}
/** Normalize input to exactly 10 digits (Indian mobile). */
export function normalizePhoneDigits(input) {
    const digits = input.replace(/\D/g, "");
    if (digits.length >= 10) {
        return digits.slice(-10);
    }
    return digits;
}
export function formatPhoneForDisplay(countryCode, phone10) {
    const a = phone10.slice(0, 5);
    const b = phone10.slice(5);
    return `${countryCode} ${a} ${b}`.trim();
}
