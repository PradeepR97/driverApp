import { Colors, Spacing } from "@/config/theme";
import { PrimaryButton } from "@/shared/ui/PrimaryButton";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVerificationPending } from "./useVerificationPending";
import { verificationPendingStyles } from "./verificationPending.styles";
export default function VerificationInProgressScreen() {
  const insets = useSafeAreaInsets();
  const [showRejectionPopup, setShowRejectionPopup] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const closeRejectionModal = useCallback(
    () => setShowRejectionPopup(false),
    [],
  );
  const {
    t,
    steps,
    rejection,
    contactSupport,
    goToOwnerDetails,
    demoSkip,
    logoutNow,
  } = useVerificationPending({ onBeforeLogoutNavigate: closeRejectionModal });
  const closeLogoutConfirm = useCallback(() => setShowLogoutConfirm(false), []);
  const onConfirmLogout = useCallback(() => {
    setShowLogoutConfirm(false);
    void logoutNow();
  }, [logoutNow]);
  const lastRejectionKeyRef = useRef("");
  useEffect(() => {
    if (!rejection) {
      lastRejectionKeyRef.current = "";
      setShowRejectionPopup(false);
      return;
    }
    const nextKey = `${rejection.reason ?? ""}|${rejection.redirectTo ?? ""}`;
    if (lastRejectionKeyRef.current !== nextKey) {
      lastRejectionKeyRef.current = nextKey;
      setShowRejectionPopup(true);
    }
  }, [rejection]);
  const rejectionReason =
    rejection?.reason ||
    rejection?.redirectTo ||
    "Your Application is rejected. Please update your owner details and submit again.";
  const missingDocuments = useMemo(() => {
    const reason = rejectionReason.toLowerCase();
    const docs = [];
    if (reason.includes("aadhaar") || reason.includes("adhar")) {
      docs.push("Owner Aadhaar Card");
    }
    if (reason.includes("pan")) {
      docs.push("Owner PAN Card");
    }
    if (reason.includes("selfie") || reason.includes("photo")) {
      docs.push("Owner Photo");
    }
    return docs.length > 0 ? docs : ["Owner Aadhaar Card"];
  }, [rejectionReason]);
  const verificationDisplayId = useMemo(
    () => rejection?.verificationId || "VF-20260501-4821",
    [rejection],
  );
  return (
    <View
      style={[
        verificationPendingStyles.screen,
        {
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.lg,
        },
      ]}
    >
      <View style={verificationPendingStyles.hero}>
        <View style={verificationPendingStyles.clockCircle}>
          <Ionicons name="time-outline" size={56} color={Colors.primary} />
          <View style={verificationPendingStyles.badge}>
            <Ionicons name="checkmark" size={14} color={Colors.white} />
          </View>
        </View>
        <Text style={verificationPendingStyles.title}>
          {t("verification.title")}
        </Text>
        <Text style={verificationPendingStyles.sub}>
          {t("verification.subtitle")}{" "}
          <Text style={verificationPendingStyles.subBold}>
            {t("verification.duration")}
          </Text>
        </Text>
      </View>

      <View style={verificationPendingStyles.card}>
        <Text style={verificationPendingStyles.cardTitle}>
          {t("verification.whats_next")}
        </Text>
        {steps.map((line, i) => (
          <View key={String(i)} style={verificationPendingStyles.stepRow}>
            <View style={verificationPendingStyles.stepNum}>
              <Text style={verificationPendingStyles.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={verificationPendingStyles.stepText}>{line}</Text>
          </View>
        ))}
      </View>

      <View style={verificationPendingStyles.spacer} />

      <Pressable
        style={({ pressed }) => [
          verificationPendingStyles.supportBtn,
          pressed && verificationPendingStyles.supportBtnPressed,
        ]}
        onPress={contactSupport}
      >
        <Ionicons name="call-outline" size={20} color={Colors.text} />
        <Text style={verificationPendingStyles.supportText}>
          {t("common.contact_support")}
        </Text>
      </Pressable>
      <Pressable onPress={demoSkip}>
        <Text style={verificationPendingStyles.demo}>
          {t("verification.demo_skip")}
        </Text>
      </Pressable>
      <Modal
        visible={showRejectionPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectionPopup(false)}
      >
        <View style={verificationPendingStyles.modalOverlay}>
          <View style={verificationPendingStyles.rejectionPopupCard}>
            <View style={verificationPendingStyles.rejectionPopupIconWrap}>
              <Ionicons name="alert-circle-outline" size={24} color={Colors.danger} />
            </View>
            <Text style={verificationPendingStyles.rejectionPopupEyebrow}>
              ACTION REQUIRED
            </Text>
            <Text style={verificationPendingStyles.rejectionPopupTitle}>
              Application Rejected
            </Text>
            <Text style={verificationPendingStyles.modalReason}>
              {rejectionReason}
            </Text>
            <View style={verificationPendingStyles.missingDocCard}>
              <Text style={verificationPendingStyles.missingDocTitle}>
                MISSING DOCUMENTS
              </Text>
              {missingDocuments.map((doc) => (
                <View key={doc} style={verificationPendingStyles.missingDocRow}>
                  <Ionicons
                    name="document-text-outline"
                    size={16}
                    color={Colors.danger}
                  />
                  <Text style={verificationPendingStyles.missingDocText}>{doc}</Text>
                </View>
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={goToOwnerDetails}
              style={({ pressed }) => [
                verificationPendingStyles.reuploadBtn,
                pressed && verificationPendingStyles.reuploadBtnPressed,
              ]}
            >
              <Ionicons name="cloud-upload-outline" size={16} color={Colors.white} />
              <Text style={verificationPendingStyles.reuploadBtnText}>
                Re-upload Documents
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={contactSupport}
              style={verificationPendingStyles.secondaryActionBtn}
            >
              <Ionicons name="chatbubble-outline" size={18} color={Colors.textSecondary} />
              <Text style={verificationPendingStyles.secondaryActionText}>
                Contact Support
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setShowLogoutConfirm(true)}
              style={verificationPendingStyles.modalLogoutTextBtn}
            >
              <Text style={verificationPendingStyles.modalLogoutText}>Log Out</Text>
            </Pressable>
            <Text style={verificationPendingStyles.rejectionPopupFooterText}>
              Verification ID : #{verificationDisplayId}
            </Text>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={closeLogoutConfirm}
      >
        <View style={verificationPendingStyles.modalOverlay}>
          <View style={verificationPendingStyles.logoutConfirmCard}>
            <Text style={verificationPendingStyles.logoutConfirmTitle}>
              Log Out
            </Text>
            <Text style={verificationPendingStyles.logoutConfirmMessage}>
              Are you sure you want to log out?
            </Text>
            <View style={verificationPendingStyles.logoutConfirmActions}>
              <PrimaryButton
                title="No, Stay Logged In"
                variant="outline"
                onPress={closeLogoutConfirm}
                style={verificationPendingStyles.logoutConfirmNoBtn}
              />
              <PrimaryButton
                title="Yes, Log Out"
                onPress={onConfirmLogout}
                style={verificationPendingStyles.logoutConfirmYesBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
