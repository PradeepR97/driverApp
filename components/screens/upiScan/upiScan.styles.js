import { StyleSheet } from "react-native";
import { Colors, Radius, Shadows, Spacing, Type } from "@/config/theme";
export const upiScanStyles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.lg,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: Spacing.lg,
    },
    headerSideSpacer: { width: 24 },
    header: { ...Type.h2 },
    card: {
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surfaceElevated,
        padding: Spacing.lg,
        alignItems: "center",
        ...Shadows.floatSm,
    },
    amountLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: "600" },
    amount: {
        fontSize: 38,
        fontWeight: "800",
        color: Colors.primary,
        marginTop: Spacing.sm,
    },
    devTag: {
        marginTop: Spacing.sm,
        color: Colors.warning,
        fontWeight: "700",
        fontSize: 12,
    },
    qrBox: {
        marginTop: Spacing.md,
        padding: Spacing.md,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
    },
    sub: {
        marginTop: Spacing.md,
        textAlign: "center",
        color: Colors.textSecondary,
        fontSize: 14,
        lineHeight: 20,
    },
    error: {
        marginTop: Spacing.sm,
        color: Colors.danger,
        fontSize: 13,
        fontWeight: "600",
        textAlign: "center",
    },
    footer: { marginTop: "auto" },
});
