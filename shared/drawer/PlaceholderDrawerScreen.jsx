import { Colors, Spacing } from '@/config/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export function PlaceholderDrawerScreen({ title, subtitle }) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    return (<View style={[styles.screen, { paddingTop: insets.top + Spacing.sm }]}>
      <Pressable style={styles.backRow} onPress={() => router.back()} accessibilityRole="button">
        <Ionicons name="chevron-back" size={26} color={Colors.text}/>
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>
        {subtitle ?? 'This is a placeholder screen. Connect your API or UI here.'}
      </Text>
    </View>);
}
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.md },
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: Spacing.lg,
        alignSelf: 'flex-start',
    },
    backText: { fontSize: 16, fontWeight: '600', color: Colors.text },
    title: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
    sub: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
});
