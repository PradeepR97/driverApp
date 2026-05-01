import { View } from "react-native";
import { collectPaymentStyles } from "./collectPayment.styles";
import { useCollectPayment } from "./useCollectPayment";
export default function PaymentScreen() {
    useCollectPayment();
    return <View style={collectPaymentStyles.screen}/>;
}
