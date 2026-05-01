import { PlaceholderDrawerScreen } from "@/shared/drawer/PlaceholderDrawerScreen";
import { useSettings } from "./useSettings";
export default function SettingsScreen() {
    useSettings();
    return <PlaceholderDrawerScreen title="Settings"/>;
}
