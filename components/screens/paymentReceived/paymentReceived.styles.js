import { StyleSheet } from "react-native";
import { Colors, Spacing, Type } from "@/config/theme";
export const paymentReceivedStyles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: "center",
        justifyContent: "center",
        padding: Spacing.lg,
    },
    center: { alignItems: "center" },
    title: {
        ...Type.h1,
        marginTop: Spacing.md,
    },
    sub: {
        marginTop: Spacing.sm,
        color: Colors.textSecondary,
        fontSize: 14,
    },
});
