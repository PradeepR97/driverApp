import { PrimaryButton } from "@/shared/ui/PrimaryButton";
import { Colors, Font, Radius, Spacing, Type } from "@/config/theme";
import { getApiBaseUrl, persistApiBaseUrl } from "@/config/apiBaseUrl";
import { useCallback, useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
export function DevBackendUrlModal({ visible, onConfirmed }) {
    const insets = useSafeAreaInsets();
    const [value, setValue] = useState(() => getApiBaseUrl());
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        if (visible) {
            setValue(getApiBaseUrl());
            setError(null);
        }
    }, [visible]);
    const handleConfirm = useCallback(async () => {
        setError(null);
        try {
            setSaving(true);
            await persistApiBaseUrl(value);
            onConfirmed();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Invalid URL");
        }
        finally {
            setSaving(false);
        }
    }, [value, onConfirmed]);
    return (<Modal visible={visible} animationType="fade" transparent={false}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={[
            styles.scrollContent,
            {
                paddingTop: Spacing.lg + insets.top,
                paddingBottom: Spacing.lg + insets.bottom,
            },
        ]} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Backend API URL</Text>
          <Text style={styles.hint}>
            Paste your server base (ngrok, local IP, etc.).{"\n"}
            <Text style={styles.mono}>/api/v1</Text> is added if missing.
          </Text>
          <TextInput value={value} onChangeText={(t) => {
            setValue(t);
            setError(null);
        }} placeholder="https://your-host.example/api/v1" placeholderTextColor={Colors.textMuted} autoCapitalize="none" autoCorrect={false} keyboardType="url" style={styles.input} editable={!saving}/>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton title="Continue" loading={saving} disabled={saving || !value.trim()} onPress={() => void handleConfirm()} style={styles.button}/>
          <Text style={styles.footer}>
            Saved on this device. Override with{" "}
            <Text style={styles.mono}>EXPO_PUBLIC_API_URL</Text> in release
            builds.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>);
}
const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.lg },
    title: {
        ...Type.h1,
        marginBottom: Spacing.sm,
    },
    hint: {
        ...Type.body,
        fontFamily: Font.regular,
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
    },
    mono: { fontFamily: Font.semibold },
    input: {
        ...Type.body,
        fontFamily: Font.regular,
        color: Colors.text,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        minHeight: 48,
    },
    error: {
        ...Type.caption,
        fontFamily: Font.regular,
        color: Colors.danger,
        marginTop: Spacing.sm,
    },
    button: { marginTop: Spacing.lg },
    footer: {
        ...Type.caption,
        fontFamily: Font.regular,
        color: Colors.textMuted,
        marginTop: Spacing.xl,
    },
});
