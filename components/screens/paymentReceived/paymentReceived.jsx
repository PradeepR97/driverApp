import { Ionicons } from "@expo/vector-icons";
import { Animated, Text, View } from "react-native";
import { Colors } from "@/config/theme";
import { paymentReceivedStyles } from "./paymentReceived.styles";
import { usePaymentReceived } from "./usePaymentReceived";
export default function PaymentReceivedScreen() {
    const { animatedStyle } = usePaymentReceived();
    return (<View style={paymentReceivedStyles.screen}>
      <Animated.View style={[paymentReceivedStyles.center, animatedStyle]}>
        <Ionicons name="checkmark-circle" size={108} color={Colors.accentCash}/>
        <Text style={paymentReceivedStyles.title}>Payment Received</Text>
        <Text style={paymentReceivedStyles.sub}>Redirecting to rating...</Text>
      </Animated.View>
    </View>);
}
