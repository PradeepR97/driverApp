import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { PrimaryButton } from "@/shared/ui/PrimaryButton";
import { Colors, Spacing } from "@/config/theme";
import { permissionsStyles } from "./permissions.styles";
import { usePermissions } from "./usePermissions";
function PermissionCard({ icon, iconBg, title, description, state, }) {
    const statusConfig = state === "granted"
        ? { icon: "checkmark-circle", color: Colors.primary, label: "Granted" }
        : state === "blocked"
            ? { icon: "alert-circle", color: Colors.danger, label: "Blocked" }
            : state === "unavailable"
                ? {
                    icon: "remove-circle",
                    color: Colors.textMuted,
                    label: "Unavailable",
                }
                : { icon: "close-circle", color: Colors.warning, label: "Denied" };
    return (<View style={permissionsStyles.card}>
      <View style={[permissionsStyles.iconCircle, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={permissionsStyles.cardTextColumn}>
        <Text style={permissionsStyles.cardTitle}>{title}</Text>
        <Text style={permissionsStyles.cardDesc}>{description}</Text>
      </View>
      <View style={permissionsStyles.statusWrap}>
        <Ionicons name={statusConfig.icon} size={18} color={statusConfig.color}/>
        <Text style={[permissionsStyles.statusText, { color: statusConfig.color }]}>
          {statusConfig.label}
        </Text>
      </View>
    </View>);
}
export default function PermissionScreen() {
    const insets = useSafeAreaInsets();
    const { t, loading, statusMap, hasBlocked, allGranted, grant, openAppSettings, platformNote, onContinue, } = usePermissions();
    return (<View style={[permissionsStyles.screen, { paddingTop: insets.top + Spacing.xl }]}>
      <ScrollView contentContainerStyle={permissionsStyles.scroll} showsVerticalScrollIndicator={false}>
        <View style={permissionsStyles.lockWrap}>
          <Text style={permissionsStyles.lockEmoji}>🔐</Text>
        </View>
        <Text style={permissionsStyles.title}>{t("permissions.title")}</Text>
        <Text style={permissionsStyles.subtitle}>{t("permissions.subtitle")}</Text>

        <PermissionCard icon={<Ionicons name="location-outline" size={22} color={Colors.primaryDark}/>} iconBg={Colors.primarySoft} title={t("permissions.location_title")} description={t("permissions.location_desc")} state={statusMap.location}/>
        <PermissionCard icon={<Ionicons name="notifications-outline" size={22} color={Colors.orange}/>} iconBg="#FFEDD5" title={t("permissions.notifications_title")} description={t("permissions.notifications_desc")} state={statusMap.notifications}/>
        <PermissionCard icon={<Ionicons name="camera-outline" size={22} color={Colors.accentUpi}/>} iconBg="#DBEAFE" title={t("permissions.camera_title")} description={t("permissions.camera_desc")} state={statusMap.camera}/>

        <Text style={permissionsStyles.footerNote}>{t("permissions.footer_note")}</Text>
        {hasBlocked ? (<Text style={permissionsStyles.settingsHint}>
            Enable blocked permissions from your device settings.
          </Text>) : null}
        <Text style={permissionsStyles.platformNote}>{platformNote}</Text>
      </ScrollView>

      <View style={[permissionsStyles.bottom, { paddingBottom: insets.bottom + Spacing.md }]}>
        <PrimaryButton title={allGranted ? "All permissions granted" : t("permissions.grant")} loading={loading} disabled={allGranted} onPress={grant}/>
        {hasBlocked ? (<PrimaryButton title="Open Settings" variant="outline" style={permissionsStyles.secondaryBtn} onPress={() => void openAppSettings()}/>) : null}
        <PrimaryButton title="Continue" variant="outline" style={permissionsStyles.secondaryBtn} onPress={onContinue}/>
      </View>
    </View>);
}
