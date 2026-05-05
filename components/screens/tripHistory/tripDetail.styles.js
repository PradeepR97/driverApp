import { StyleSheet } from "react-native";
import { Colors, Radius, Spacing, Type } from "@/config/theme";

export const tripDetailStyles = StyleSheet.create({
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: Spacing.xl,
    },
    scroll: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    orderNum: {
        ...Type.h2,
        marginBottom: Spacing.sm,
    },
    statusPill: {
        alignSelf: "flex-start",
        backgroundColor: Colors.primarySoft,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 6,
        borderRadius: Radius.full,
        marginBottom: Spacing.lg,
    },
    statusPillText: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.primaryDark,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
    },
    sectionValue: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.text,
    },
    sectionValueLarge: {
        fontSize: 22,
        fontWeight: "800",
        color: Colors.text,
    },
    row: {
        flexDirection: "row",
        gap: Spacing.lg,
        marginTop: Spacing.sm,
    },
    rowItem: { flex: 1 },
    errorBox: {
        padding: Spacing.lg,
        alignItems: "center",
    },
    errorText: {
        color: Colors.danger,
        textAlign: "center",
        marginBottom: Spacing.md,
        fontSize: 15,
    },
    retryBtn: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        borderRadius: Radius.lg,
        backgroundColor: Colors.primary,
    },
    retryText: {
        color: Colors.white,
        fontWeight: "700",
        fontSize: 15,
    },
});
