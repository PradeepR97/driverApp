import { PlaceholderDrawerScreen } from "@/shared/drawer/PlaceholderDrawerScreen";
import { useAppLanguage } from "./useAppLanguage";
export default function AppLanguageScreen() {
    const { title, subtitle } = useAppLanguage();
    return <PlaceholderDrawerScreen title={title} subtitle={subtitle}/>;
}
