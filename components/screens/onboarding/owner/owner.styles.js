import { StyleSheet } from "react-native";
import { Colors, Radius, Shadows, Spacing } from "@/config/theme";

export const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.background },
    scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
    fieldLabel: { fontSize: 14, fontWeight: "600", color: Colors.text },
    req: { color: Colors.danger },
    input: {
        marginTop: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radius.lg,
        paddingHorizontal: Spacing.md,
        minHeight: 52,
        fontSize: 16,
        color: Colors.text,
        backgroundColor: Colors.surfaceElevated,
    },
    inputError: {
        borderColor: Colors.border,
    },
    uploadCard: {
        marginTop: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radius.lg,
        padding: Spacing.md + 2,
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        backgroundColor: Colors.surfaceElevated,
        ...Shadows.floatSm,
    },
    uploadError: {
        borderColor: Colors.border,
    },
    uploadDone: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primarySoft,
    },
    checkCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    uploadTitle: { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.text },
    fileName: { fontSize: 12, color: Colors.primary, marginTop: 2 },
    uploadBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
    uploadBtnText: { color: Colors.link, fontWeight: "700" },
    footer: {
        padding: Spacing.lg,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
    },
});
