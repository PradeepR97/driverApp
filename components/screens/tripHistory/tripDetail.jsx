import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/config/theme";
import { tripHistoryStyles } from "./tripHistory.styles";
import { tripDetailStyles } from "./tripDetail.styles";
import {
    formatDistanceKm,
    formatInr,
    formatPaymentMethod,
    formatTripInstant,
    formatTripStatus,
} from "./tripFormatters";
import { useTripDetail } from "./useTripDetail";

export default function TripDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { orderId } = useLocalSearchParams();
    const orderIdStr = Array.isArray(orderId) ? orderId[0] : orderId;
    const idValid =
        orderIdStr != null &&
        String(orderIdStr).trim() !== "" &&
        Number.isFinite(Number(String(orderIdStr).trim()));
    const { data, isLoading, isError, error, refetch, isFetching } =
        useTripDetail(orderIdStr);
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
                <Text style={tripHistoryStyles.headerTitle}>Trip details</Text>
                <View style={tripHistoryStyles.headerRightSpacer} />
            </View>
            <View style={tripHistoryStyles.hairline} />

            {!idValid ? (
                <View style={tripDetailStyles.errorBox}>
                    <Text style={tripDetailStyles.errorText}>
                        Missing or invalid order.
                    </Text>
                </View>
            ) : null}

            {idValid && isLoading && !data ? (
                <View style={tripDetailStyles.centered}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : null}

            {idValid && isError ? (
                <View style={tripDetailStyles.errorBox}>
                    <Text style={tripDetailStyles.errorText}>
                        {error instanceof Error
                            ? error.message
                            : "Could not load trip."}
                    </Text>
                    <Pressable
                        onPress={() => void refetch()}
                        style={tripDetailStyles.retryBtn}
                        disabled={isFetching}
                    >
                        <Text style={tripDetailStyles.retryText}>Try again</Text>
                    </Pressable>
                </View>
            ) : null}

            {idValid && data ? (
                <ScrollView
                    contentContainerStyle={tripDetailStyles.scroll}
                    showsVerticalScrollIndicator
                >
                    <Text style={tripDetailStyles.orderNum}>{data.orderNumber}</Text>
                    <View style={tripDetailStyles.statusPill}>
                        <Text style={tripDetailStyles.statusPillText}>
                            {formatTripStatus(data.status)}
                        </Text>
                    </View>

                    <Text style={tripDetailStyles.sectionLabel}>When</Text>
                    <Text style={tripDetailStyles.sectionValue}>
                        {data.completedAt
                            ? formatTripInstant(data.completedAt)
                            : "—"}
                    </Text>

                    <Text style={tripDetailStyles.sectionLabel}>Route</Text>
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
                                {data.pickupAddress || "—"}
                            </Text>
                            <Text
                                style={[
                                    tripHistoryStyles.place,
                                    tripHistoryStyles.dropPlace,
                                ]}
                            >
                                {data.dropAddress || "—"}
                            </Text>
                        </View>
                    </View>

                    <View style={tripDetailStyles.row}>
                        <View style={tripDetailStyles.rowItem}>
                            <Text style={tripDetailStyles.sectionLabel}>Fare</Text>
                            <Text style={tripDetailStyles.sectionValueLarge}>
                                {formatInr(data.totalAmount)}
                            </Text>
                        </View>
                        <View style={tripDetailStyles.rowItem}>
                            <Text style={tripDetailStyles.sectionLabel}>
                                Distance
                            </Text>
                            <Text style={tripDetailStyles.sectionValue}>
                                {formatDistanceKm(data.distanceKm)}
                            </Text>
                        </View>
                    </View>

                    <Text style={tripDetailStyles.sectionLabel}>Payment</Text>
                    <Text style={tripDetailStyles.sectionValue}>
                        {formatPaymentMethod(data.paymentMethod)}
                    </Text>
                </ScrollView>
            ) : null}
        </View>
    );
}
