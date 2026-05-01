import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View, } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FormErrorText } from "@/shared/ui/FormErrorText";
import { PrimaryButton } from "@/shared/ui/PrimaryButton";
import { Colors, Spacing } from "@/config/theme";
import { orderFareStyles } from "./orderFare.styles";
import { useOrderFare } from "./useOrderFare";
export default function OrderFareScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { trip, loading, error, fare, showCash, showUpi, breakdownRows, loadFare } = useOrderFare();
    if (!trip)
        return null;
    return (<View style={[orderFareStyles.screen, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={orderFareStyles.headerRow}>
        <View style={orderFareStyles.headerSideSpacer}/>
        <Text style={orderFareStyles.headerTitle}>Trip Summary</Text>
        <View style={orderFareStyles.headerSideSpacer}/>
      </View>

      {loading ? (<View style={orderFareStyles.centered}>
          <ActivityIndicator size="large" color={Colors.primary}/>
          <Text style={orderFareStyles.loadingText}>Loading fare…</Text>
        </View>) : fare ? (<ScrollView contentContainerStyle={[
                orderFareStyles.scroll,
                { paddingBottom: insets.bottom + Spacing.xl },
            ]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={orderFareStyles.payableBlock}>
            <Text style={orderFareStyles.payableLabel}>Total Payable Amount</Text>
            <Text style={orderFareStyles.payableValue}>
              ₹{fare.totalPayableAmount.toLocaleString("en-IN")}
            </Text>
          </View>

          <View style={orderFareStyles.breakdownCard}>
            <View style={orderFareStyles.breakdownHeader}>
              <Text style={orderFareStyles.breakdownTitle}>Fare Breakdown</Text>
              <Ionicons name="chevron-up" size={16} color={Colors.textMuted}/>
            </View>
            <View style={orderFareStyles.breakdownRows}>
              {breakdownRows.map((row) => (<View key={row.key} style={orderFareStyles.breakdownRow}>
                  <Text style={orderFareStyles.breakdownKey}>{row.label}</Text>
                  <Text style={[
                    orderFareStyles.breakdownValue,
                    row.isHighlighted ? orderFareStyles.breakdownValueStrong : null,
                ]}>
                    ₹{row.amount.toLocaleString("en-IN")}
                  </Text>
                </View>))}
            </View>
          </View>

          <Text style={orderFareStyles.sectionLabel}>Select Payment Method</Text>
          <View style={orderFareStyles.payStack}>
            {showCash ? (<Pressable style={orderFareStyles.paymentCard} onPress={() => router.push("/cashPaymentScreen")}>
                <View style={orderFareStyles.paymentIconWrap}>
                  <Ionicons name="cash-outline" size={20} color={Colors.primary}/>
                </View>
                <View style={orderFareStyles.paymentTextColumn}>
                  <Text style={orderFareStyles.paymentTitle}>Cash Payment</Text>
                  <Text style={orderFareStyles.paymentSub}>Collect cash from customer</Text>
                </View>
              </Pressable>) : null}
            {showUpi ? (<Pressable style={orderFareStyles.paymentCard} onPress={() => router.push("/upiPaymentScreen")}>
                <View style={orderFareStyles.paymentIconWrap}>
                  <Ionicons name="phone-portrait-outline" size={20} color={Colors.primary}/>
                </View>
                <View style={orderFareStyles.paymentTextColumn}>
                  <Text style={orderFareStyles.paymentTitle}>Online Payment (UPI)</Text>
                  <Text style={orderFareStyles.paymentSub}>Show QR code to customer</Text>
                </View>
              </Pressable>) : null}
            {!showCash && !showUpi ? (<Text style={orderFareStyles.noMethods}>
                No Cash or UPI payment options are enabled for this order.
              </Text>) : null}
          </View>

          <FormErrorText error={error}/>
        </ScrollView>) : (<View style={orderFareStyles.errorBlock}>
          <FormErrorText error={error}/>
          <PrimaryButton title="Retry" onPress={() => void loadFare()} style={orderFareStyles.retryBtn}/>
        </View>)}
    </View>);
}
