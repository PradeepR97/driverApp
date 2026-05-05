import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/config/theme";
import { tripHistoryStyles } from "./tripHistory.styles";
import {
    formatInr,
    formatTripInstant,
    formatTripStatus,
} from "./tripFormatters";
import { useTripHistory } from "./useTripHistory";

const TABS = [
    { key: "today", label: "Today" },
    { key: "thisWeek", label: "This Week" },
    { key: "thisMonth", label: "This Month" },
];

export default function TripHistoryScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {
        filter,
        setFilter,
        trips,
        isLoading,
        isFetching,
        isError,
        errorMessage,
        refetch,
    } = useTripHistory();
    const showInitialSpinner = isLoading && trips.length === 0;
    return (
        <View style={[tripHistoryStyles.screen, { paddingTop: insets.top }]}>
            <View style={tripHistoryStyles.header}>
                <Pressable
                    onPress={() => router.back()}
                    hitSlop={12}
                    accessibilityRole="button"
                >
                    <Ionicons name="chevron-back" size={26} color={Colors.text} />
                </Pressable>
                <Text style={tripHistoryStyles.headerTitle}>Trip History</Text>
                <View style={tripHistoryStyles.headerRightSpacer} />
            </View>
            <View style={tripHistoryStyles.hairline} />

            <View style={tripHistoryStyles.tabs}>
                {TABS.map((t) => (
                    <Pressable
                        key={t.key}
                        onPress={() => setFilter(t.key)}
                        style={[
                            tripHistoryStyles.tab,
                            filter === t.key && tripHistoryStyles.tabActive,
                        ]}
                    >
                        <Text
                            style={[
                                tripHistoryStyles.tabText,
                                filter === t.key && tripHistoryStyles.tabTextActive,
                            ]}
                        >
                            {t.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {showInitialSpinner ? (
                <View style={tripHistoryStyles.loaderWrap}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : null}

            {isError && !showInitialSpinner ? (
                <View style={tripHistoryStyles.errorWrap}>
                    <Text style={tripHistoryStyles.errorText}>
                        {errorMessage ?? "Could not load trips."}
                    </Text>
                    <Pressable
                        onPress={() => void refetch()}
                        style={tripHistoryStyles.retryBtn}
                        disabled={isFetching}
                    >
                        <Text style={tripHistoryStyles.retryBtnText}>Retry</Text>
                    </Pressable>
                </View>
            ) : null}

            {!isError && !showInitialSpinner && trips.length === 0 ? (
                <View style={tripHistoryStyles.emptyWrap}>
                    <Ionicons
                        name="document-text-outline"
                        size={48}
                        color={Colors.textMuted}
                    />
                    <Text style={tripHistoryStyles.emptyTitle}>No trips yet</Text>
                    <Text style={tripHistoryStyles.emptySubtitle}>
                        Trips in this period will appear here.
                    </Text>
                </View>
            ) : null}

            {!showInitialSpinner && trips.length > 0 ? (
                <ScrollView
                    contentContainerStyle={tripHistoryStyles.list}
                    showsVerticalScrollIndicator
                    refreshControl={
                        <RefreshControl
                            refreshing={isFetching && !isLoading}
                            onRefresh={() => void refetch()}
                            tintColor={Colors.primary}
                        />
                    }
                >
                    {trips.map((trip, index) => (
                        <Animated.View
                            key={trip.id}
                            entering={FadeInDown.delay(64 * index).duration(300)}
                        >
                            <Pressable
                                style={tripHistoryStyles.card}
                                onPress={() =>
                                    router.push({
                                        pathname: "/tripDetailScreen",
                                        params: {
                                            orderId: String(trip.id),
                                        },
                                    })
                                }
                            >
                                <View style={tripHistoryStyles.cardTop}>
                                    <View style={tripHistoryStyles.dateRow}>
                                        <Ionicons
                                            name="calendar-outline"
                                            size={16}
                                            color={Colors.textSecondary}
                                        />
                                        <Text style={tripHistoryStyles.dateText}>
                                            {trip.completedAt
                                                ? formatTripInstant(trip.completedAt)
                                                : "In progress"}
                                        </Text>
                                    </View>
                                    <View style={tripHistoryStyles.statusPill}>
                                        <Text style={tripHistoryStyles.statusText}>
                                            {formatTripStatus(trip.status)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={tripHistoryStyles.route}>
                                    <View style={tripHistoryStyles.timeline}>
                                        <View
                                            style={[
                                                tripHistoryStyles.dot,
                                                tripHistoryStyles.dotPickup,
                                            ]}
                                        />
                                        <View style={tripHistoryStyles.vline} />
                                        <View
                                            style={[
                                                tripHistoryStyles.dot,
                                                tripHistoryStyles.dotDrop,
                                            ]}
                                        />
                                    </View>
                                    <View style={tripHistoryStyles.placesColumn}>
                                        <Text style={tripHistoryStyles.place}>
                                            {trip.pickupAddress || "—"}
                                        </Text>
                                        <Text
                                            style={[
                                                tripHistoryStyles.place,
                                                tripHistoryStyles.dropPlace,
                                            ]}
                                        >
                                            {trip.dropAddress || "—"}
                                        </Text>
                                    </View>
                                </View>
                                <View style={tripHistoryStyles.hairlineCard} />
                                <View style={tripHistoryStyles.cardBottom}>
                                    <Text
                                        style={tripHistoryStyles.orderRef}
                                        numberOfLines={1}
                                    >
                                        {trip.orderNumber || `#${trip.id}`}
                                    </Text>
                                    <View style={tripHistoryStyles.fareRow}>
                                        <Text style={tripHistoryStyles.fare}>
                                            {formatInr(trip.totalAmount)}
                                        </Text>
                                        <Ionicons
                                            name="chevron-forward"
                                            size={18}
                                            color={Colors.textMuted}
                                        />
                                    </View>
                                </View>
                            </Pressable>
                        </Animated.View>
                    ))}
                </ScrollView>
            ) : null}
        </View>
    );
}
