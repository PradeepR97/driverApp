import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { normalizePhoneDigits, postOtpRequest } from "@/api/auth";
import { AUTH_USER_TYPE, DEFAULT_COUNTRY_CODE } from "@/config/appConfig";
export function useLogin() {
    const router = useRouter();
    const { t } = useTranslation();
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [shakeTrigger, setShakeTrigger] = useState(0);
    const inputRef = useRef(null);
    useEffect(() => {
        if (phone.length === 10) {
            inputRef.current?.blur();
        }
    }, [phone]);
    const onLogin = async () => {
        const digits = normalizePhoneDigits(phone);
        if (digits.length !== 10) {
            setError(t("auth.login.invalid_mobile"));
            setShakeTrigger((n) => n + 1);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await postOtpRequest({
                userType: AUTH_USER_TYPE,
                countryCode: DEFAULT_COUNTRY_CODE,
                phoneNumber: digits,
            });
            const expiresIn = typeof res.expires_in === "number" ? res.expires_in : 300;
            router.push({
                pathname: "/verifyOtpScreen",
                params: {
                    phone: digits,
                    countryCode: DEFAULT_COUNTRY_CODE,
                    expiresIn: String(Math.min(expiresIn, 600)),
                },
            });
        }
        catch (e) {
            const msg = e instanceof Error && e.message.trim().length > 0
                ? e.message
                : t("errors.try_again");
            setError(msg);
            setShakeTrigger((n) => n + 1);
        }
        finally {
            setLoading(false);
        }
    };
    const onChangePhone = (text) => {
        const digits = normalizePhoneDigits(text);
        setPhone(digits);
        if (error)
            setError(null);
    };
    return {
        t,
        router,
        phone,
        loading,
        error,
        shakeTrigger,
        inputRef,
        onLogin,
        onChangePhone,
    };
}
