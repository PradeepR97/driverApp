import { Ionicons } from "@expo/vector-icons";
import { Animated, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "@/shared/ui/PrimaryButton";
import { Colors, Spacing } from "@/config/theme";
import { cashPaymentStyles } from "./cashPayment.styles";
import { useCashPayment } from "./useCashPayment";
export default function CashPaymentScreen() {
    const insets = useSafeAreaInsets();
    const { busy, confirmOpen, setConfirmOpen, error, shakeStyle, fareLabel, fareBreakdown, confirmReceived, } = useCashPayment();
    return (<View style={[cashPaymentStyles.screen, { paddingTop: insets.top + Spacing.md }]}>
      <View style={cashPaymentStyles.headerRow}>
        <View style={cashPaymentStyles.headerSideSpacer}/>
        <Text style={cashPaymentStyles.header}>Collect Payment</Text>
        <View style={cashPaymentStyles.headerSideSpacer}/>
      </View>

      <View style={cashPaymentStyles.payableBlock}>
        <Text style={cashPaymentStyles.payableLabel}>Total Payable Amount</Text>
        <Text style={cashPaymentStyles.payableValue}>₹{fareLabel}</Text>
      </View>

      {fareBreakdown.length > 0 ? (<View style={cashPaymentStyles.breakdownCard}>
          <View style={cashPaymentStyles.breakdownHeader}>
            <Text style={cashPaymentStyles.breakdownTitle}>Fare Breakdown</Text>
            <Ionicons name="chevron-up" size={16} color={Colors.textMuted}/>
          </View>
          <View style={cashPaymentStyles.breakdownRows}>
            {fareBreakdown.map((row) => (<View key={row.key} style={cashPaymentStyles.breakdownRow}>
                <Text style={cashPaymentStyles.breakdownKey}>{row.label}</Text>
                <Text style={cashPaymentStyles.breakdownValue}>
                  ₹{row.amount.toLocaleString("en-IN")}
                </Text>
              </View>))}
          </View>
        </View>) : null}

      <Animated.View style={[cashPaymentStyles.card, shakeStyle]}>
        <View style={cashPaymentStyles.iconWrap}>
          <Ionicons name="cash-outline" size={32} color={Colors.primaryDark}/>
        </View>
        <Text style={cashPaymentStyles.amountLabel}>Collect ₹{fareLabel} in Cash</Text>
        <Text style={cashPaymentStyles.sub}>
          Collect payment in cash from the customer and confirm below.
        </Text>
        {error ? <Text style={cashPaymentStyles.error}>{error}</Text> : null}
      </Animated.View>

      <View style={[
            cashPaymentStyles.footer,
            { paddingBottom: insets.bottom + Spacing.md },
        ]}>
        <PrimaryButton title="Cash Collected in Hand" onPress={() => setConfirmOpen(true)} loading={busy} disabled={busy}/>
      </View>

      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <Pressable style={cashPaymentStyles.modalBackdrop} onPress={() => {
            if (!busy)
                setConfirmOpen(false);
        }}>
          <Pressable style={cashPaymentStyles.modalCard} onPress={() => { }}>
            <Text style={cashPaymentStyles.modalTitle}>Confirm Cash Received</Text>
            <Text style={cashPaymentStyles.modalSub}>
              Have you received{" "}
              <Text style={cashPaymentStyles.modalSubStrong}>₹{fareLabel}</Text>{" "}
              from the customer?
            </Text>
            <View style={cashPaymentStyles.modalActions}>
              <PrimaryButton title="No, Go Back" variant="outline" onPress={() => setConfirmOpen(false)} disabled={busy} style={cashPaymentStyles.modalBtnFlex}/>
              <PrimaryButton title="Yes, Received" onPress={() => void confirmReceived()} loading={busy} disabled={busy} style={cashPaymentStyles.confirmBtn}/>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>);
}
