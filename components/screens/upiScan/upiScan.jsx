import { Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UpiQrDisplay } from "@/shared/payment/UpiQrDisplay";
import { PrimaryButton } from "@/shared/ui/PrimaryButton";
import { Spacing } from "@/config/theme";
import { upiScanStyles } from "./upiScan.styles";
import { useUpiScan } from "./useUpiScan";
export default function UpiPaymentScreen() {
    const insets = useSafeAreaInsets();
    const { busy, error, shakeStyle, fareLabel, upiQr, simulateSuccess } = useUpiScan();
    return (<View style={[upiScanStyles.screen, { paddingTop: insets.top + Spacing.md }]}>
      <View style={upiScanStyles.headerRow}>
        <View style={upiScanStyles.headerSideSpacer}/>
        <Text style={upiScanStyles.header}>UPI Payment</Text>
        <View style={upiScanStyles.headerSideSpacer}/>
      </View>

      <Animated.View style={[upiScanStyles.card, shakeStyle]}>
        <Text style={upiScanStyles.amountLabel}>Amount</Text>
        <Text style={upiScanStyles.amount}>₹{fareLabel}</Text>
        {upiQr ? null : <Text style={upiScanStyles.devTag}>Demo placeholder QR</Text>}
        <View style={upiScanStyles.qrBox}>
          <UpiQrDisplay payload={upiQr}/>
        </View>
        <Text style={upiScanStyles.sub}>
          Ask customer to scan this QR. Use simulate button for development flow.
        </Text>
        {error ? <Text style={upiScanStyles.error}>{error}</Text> : null}
      </Animated.View>

      <View style={[upiScanStyles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <PrimaryButton title="Simulate Payment Success" onPress={() => void simulateSuccess()} loading={busy} disabled={busy}/>
      </View>
    </View>);
}
