import { Colors, Radius, Shadows, Spacing } from "@/constants/theme";
import { performLogout } from "@/lib/auth/performLogout";
import { useDriverStore } from "@/lib/driver-store";
import { Ionicons } from "@expo/vector-icons";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { type Href, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MenuItem } from "./MenuItem";

const APP_VERSION =
  Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { navigation } = props;
  const todayTrips = useDriverStore((s) => s.todayTrips);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutInFlight = useRef(false);

  const driverName = "Rajesh Kumar";
  const driverPhone = "+91 98765 43210";
  const rating = 4.8;
  const tripCount = todayTrips;

  const push = (href: string) => {
    router.push(href as Href);
  };

  const closeAnd = (fn: () => void) => {
    navigation.closeDrawer();
    requestAnimationFrame(fn);
  };

  const onLogout = () => {
    if (logoutInFlight.current || isLoggingOut) return;
    Alert.alert("Log out", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => {
          void (async () => {
            if (logoutInFlight.current) return;
            logoutInFlight.current = true;
            setIsLoggingOut(true);
            try {
              await performLogout({
                router,
                onBeforeNavigate: () => navigation.closeDrawer(),
                alertOnApiFailure: true,
              });
            } finally {
              logoutInFlight.current = false;
              setIsLoggingOut(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.sm }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.profile}>
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: "https://i.pravatar.cc/120?img=12" }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.name}>{driverName}</Text>
          <View style={styles.phoneRow}>
            <Ionicons
              name="call-outline"
              size={16}
              color={Colors.textSecondary}
            />
            <Text style={styles.phone}>{driverPhone}</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="star" size={18} color={Colors.star} />
              <Text style={styles.statVal}>{rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Ionicons
                name="car-outline"
                size={18}
                color={Colors.primaryDark}
              />
              <Text style={styles.statVal}>{tripCount}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
          </View>
        </View>

        <View style={styles.menu}>
          <MenuItem
            title="My Earnings"
            icon="wallet-outline"
            onPress={() => closeAnd(() => push("/my-earnings"))}
          />
          <MenuItem
            title="Trip History"
            icon="time-outline"
            onPress={() => closeAnd(() => push("/trip-history"))}
          />
          <MenuItem
            title="Bank Details"
            icon="card-outline"
            onPress={() => closeAnd(() => push("/bank-details"))}
          />
          <MenuItem
            title="Language"
            icon="language-outline"
            onPress={() => closeAnd(() => push("/app-language"))}
          />
          <MenuItem
            title="Settings"
            icon="settings-outline"
            onPress={() => closeAnd(() => push("/settings"))}
          />
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}
      >
        <Pressable
          style={[styles.logoutBtn, isLoggingOut && styles.logoutBtnDisabled]}
          onPress={onLogout}
          disabled={isLoggingOut}
          accessibilityRole="button"
          accessibilityState={{ disabled: isLoggingOut }}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={22} color="#fff" />
              <Text style={styles.logoutText}>Log out</Text>
            </>
          )}
        </Pressable>
        <Text style={styles.version}>Version {APP_VERSION}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg },
  profile: {
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.md,
  },
  avatarWrap: { alignSelf: "center", marginBottom: Spacing.md },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: Colors.primarySoft,
  },
  onlineDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: Spacing.xs,
  },
  phone: { fontSize: 15, color: Colors.textSecondary, fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    ...Shadows.floatSm,
  },
  stat: { alignItems: "center", minWidth: 72 },
  statVal: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
    marginTop: 4,
  },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  menu: { gap: 4 },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.danger,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xxl,
    minHeight: 52,
    ...Shadows.floatSm,
  },
  logoutBtnDisabled: { opacity: 0.75 },
  logoutText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  version: {
    textAlign: "center",
    marginTop: Spacing.md,
    fontSize: 12,
    color: Colors.textMuted,
  },
});
