import { PlaceholderDrawerScreen } from "@/shared/drawer/PlaceholderDrawerScreen";
import { useBankDetails } from "./useBankDetails";
export default function BankDetailsScreen() {
    useBankDetails();
    return <PlaceholderDrawerScreen title="Bank Details"/>;
}
