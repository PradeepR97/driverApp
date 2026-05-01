import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/config/theme";
import { tripHistoryStyles } from "./tripHistory.styles";
import { useTripHistory } from "./useTripHistory";
export default function TripHistoryScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { tab, setTab, trips } = useTripHistory();
    return (<View style={[tripHistoryStyles.screen, { paddingTop: insets.top }]}>
      <View style={tripHistoryStyles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <Ionicons name="chevron-back" size={26} color={Colors.text}/>
        </Pressable>
        <Text style={tripHistoryStyles.headerTitle}>Trip History</Text>
        <View style={tripHistoryStyles.headerRightSpacer}/>
      </View>
      <View style={tripHistoryStyles.hairline}/>

      <View style={tripHistoryStyles.tabs}>
        {[
            { key: "today", label: "Today" },
            { key: "week", label: "This Week" },
            { key: "month", label: "This Month" },
        ].map((t) => (<Pressable key={t.key} onPress={() => setTab(t.key)} style={[tripHistoryStyles.tab, tab === t.key && tripHistoryStyles.tabActive]}>
            <Text style={[
                tripHistoryStyles.tabText,
                tab === t.key && tripHistoryStyles.tabTextActive,
            ]}>
              {t.label}
            </Text>
          </Pressable>))}
      </View>

      <ScrollView contentContainerStyle={tripHistoryStyles.list} showsVerticalScrollIndicator>
        {trips.map((trip, index) => (<Animated.View key={trip.id} entering={FadeInDown.delay(64 * index).duration(300)}>
            <Pressable style={tripHistoryStyles.card}>
              <View style={tripHistoryStyles.cardTop}>
                <View style={tripHistoryStyles.dateRow}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary}/>
                  <Text style={tripHistoryStyles.dateText}>{trip.date}</Text>
                </View>
                <View style={tripHistoryStyles.statusPill}>
                  <Text style={tripHistoryStyles.statusText}>Completed</Text>
                </View>
              </View>
              <View style={tripHistoryStyles.route}>
                <View style={tripHistoryStyles.timeline}>
                  <View style={[tripHistoryStyles.dot, tripHistoryStyles.dotPickup]}/>
                  <View style={tripHistoryStyles.vline}/>
                  <View style={[tripHistoryStyles.dot, tripHistoryStyles.dotDrop]}/>
                </View>
                <View style={tripHistoryStyles.placesColumn}>
                  <Text style={tripHistoryStyles.place}>{trip.pickup}</Text>
                  <Text style={[
                tripHistoryStyles.place,
                tripHistoryStyles.dropPlace,
            ]}>
                    {trip.drop}
                  </Text>
                </View>
              </View>
              <View style={tripHistoryStyles.hairlineCard}/>
              <View style={tripHistoryStyles.cardBottom}>
                <View style={[
                tripHistoryStyles.payPill,
                trip.payment === "online"
                    ? tripHistoryStyles.payOnline
                    : tripHistoryStyles.payCash,
            ]}>
                  <Text style={[
                tripHistoryStyles.payText,
                trip.payment === "cash" && tripHistoryStyles.payTextCash,
            ]}>
                    {trip.payment === "online" ? "Online" : "Cash"}
                  </Text>
                </View>
                <View style={tripHistoryStyles.fareRow}>
                  <Text style={tripHistoryStyles.fare}>₹{trip.fare}</Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted}/>
                </View>
              </View>
            </Pressable>
          </Animated.View>))}
      </ScrollView>
    </View>);
}
