import { Colors, Radius, Spacing } from '@/config/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
export function UpiQrDisplay({ payload }) {
    if (!payload?.trim()) {
        return (<View style={styles.placeholder}>
        <Ionicons name="qr-code-outline" size={120} color={Colors.textMuted}/>
        <Text style={styles.placeholderText}>No QR data from server (dev placeholder)</Text>
      </View>);
    }
    const p = payload.trim();
    const isHttp = /^https?:\/\//i.test(p);
    const isData = p.startsWith('data:image');
    if (isHttp || isData) {
        return (<Image source={{ uri: p }} style={styles.image} contentFit="contain" accessibilityLabel="UPI QR code"/>);
    }
    return (<View style={styles.svgWrap}>
      <QRCode value={p} size={200} backgroundColor="#FFFFFF" color="#111827"/>
    </View>);
}
const styles = StyleSheet.create({
    svgWrap: {
        padding: Spacing.md,
        backgroundColor: '#FFFFFF',
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    image: { width: 220, height: 220, borderRadius: Radius.md },
    placeholder: { alignItems: 'center', padding: Spacing.lg },
    placeholderText: {
        marginTop: Spacing.sm,
        textAlign: 'center',
        color: Colors.textSecondary,
        fontSize: 13,
    },
});
