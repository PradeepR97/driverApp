import { PlaceholderDrawerScreen } from "@/shared/drawer/PlaceholderDrawerScreen";
import { useMyEarnings } from "./useMyEarnings";
export default function MyEarningsScreen() {
    useMyEarnings();
    return <PlaceholderDrawerScreen title="My Earnings"/>;
}
