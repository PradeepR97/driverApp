import { useTranslation } from "react-i18next";
export function useAppLanguage() {
    const { t } = useTranslation();
    return {
        title: t("drawer.language_title"),
        subtitle: t("drawer.language_subtitle"),
    };
}
