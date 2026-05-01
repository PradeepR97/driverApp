import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { postUserLanguage } from "@/api/app";
import { formatPhoneForDisplay, normalizePhoneDigits, postOtpRequest, postOtpVerify, } from "@/api/auth";
import { extractAccessToken } from "@/api/token";
import { setAccessToken } from "@/lib/auth-session";
import { AUTH_USER_TYPE, DEFAULT_COUNTRY_CODE, OTP_DIGIT_COUNT } from "@/config/appConfig";
import { getStoredLanguageCode } from "@/lib/language-storage";
import { syncAndRouteFromAppState } from "@/lib/navigation/sync-app-state";
import { setStoredPhoneNumber } from "@/lib/storage/driver-session-storage";
export function useVerifyOtp() {
    const router = useRouter();
    const { t } = useTranslation();
    const params = useLocalSearchParams();
    const phone10 = typeof params.phone === "string" ? normalizePhoneDigits(params.phone) : "";
    const countryCode = typeof params.countryCode === "string"
        ? params.countryCode
        : DEFAULT_COUNTRY_CODE;
    const [values, setValues] = useState(() => Array.from({ length: OTP_DIGIT_COUNT }, () => ""));
    const [cooldown, setCooldown] = useState(() => 30);
    const [busy, setBusy] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState(null);
    const [info, setInfo] = useState(null);
    const verifyAttempted = useRef(null);
    const [otpShake, setOtpShake] = useState(0);
    useEffect(() => {
        if (phone10.length !== 10) {
            router.replace("/requestOtpScreen");
        }
    }, [phone10, router]);
    const cooldownActive = cooldown > 0;
    useEffect(() => {
        if (!cooldownActive)
            return;
        const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
        return () => clearInterval(id);
    }, [cooldownActive]);
    const verifyAndContinue = useCallback(async (code) => {
        if (phone10.length !== 10)
            return;
        setBusy(true);
        try {
            const data = await postOtpVerify({
                userType: AUTH_USER_TYPE,
                countryCode,
                phoneNumber: phone10,
                otp: code,
            });
            const token = extractAccessToken(data);
            if (!token) {
                verifyAttempted.current = null;
                setError(t("errors.no_session_token"));
                setOtpShake((n) => n + 1);
                return;
            }
            await setAccessToken(token);
            await setStoredPhoneNumber(phone10);
            const langCode = await getStoredLanguageCode();
            if (langCode) {
                try {
                    await postUserLanguage(langCode);
                }
                catch (err) {
                    if (__DEV__) {
                        console.warn("[api] language sync failed (continuing to app state):", err);
                    }
                }
            }
            try {
                await syncAndRouteFromAppState(router);
            }
            catch {
                router.replace("/onboarding/onboardingOwnerScreen");
            }
        }
        catch (e) {
            verifyAttempted.current = null;
            const msg = e instanceof Error && e.message.trim().length > 0
                ? e.message
                : t("errors.invalid_otp");
            setError(msg);
            setOtpShake((n) => n + 1);
        }
        finally {
            setBusy(false);
        }
    }, [countryCode, phone10, router, t]);
    const maybeAutoVerify = useCallback((nextValues) => {
        const joined = nextValues.join("");
        if (joined.length === OTP_DIGIT_COUNT &&
            verifyAttempted.current !== joined) {
            verifyAttempted.current = joined;
            void verifyAndContinue(joined);
        }
    }, [verifyAndContinue]);
    const onOtpChange = (next) => {
        if (busy)
            return;
        if (error)
            setError(null);
        if (info)
            setInfo(null);
        setValues(next);
        maybeAutoVerify(next);
    };
    const onResend = async () => {
        if (phone10.length !== 10 || cooldown > 0 || resending)
            return;
        setResending(true);
        try {
            const res = await postOtpRequest({
                userType: AUTH_USER_TYPE,
                countryCode,
                phoneNumber: phone10,
            });
            setCooldown(30);
            setValues(Array.from({ length: OTP_DIGIT_COUNT }, () => ""));
            verifyAttempted.current = null;
            setError(null);
            setInfo(res.message ?? "OTP sent successfully");
        }
        catch (e) {
            setInfo(null);
            const msg = e instanceof Error && e.message.trim().length > 0
                ? e.message
                : t("errors.try_again_later");
            setError(msg);
            setOtpShake((n) => n + 1);
        }
        finally {
            setResending(false);
        }
    };
    const displayPhone = formatPhoneForDisplay(countryCode, phone10);
    return {
        router,
        t,
        phone10,
        values,
        cooldown,
        busy,
        resending,
        error,
        info,
        otpShake,
        displayPhone,
        onOtpChange,
        onResend,
    };
}
