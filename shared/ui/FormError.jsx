import { Colors, Spacing } from '@/config/theme';
import { StyleSheet, Text } from 'react-native';
export function FormError({ message, visible }) {
    if (!visible || !message)
        return null;
    return <Text style={styles.error}>{message}</Text>;
}
const styles = StyleSheet.create({
    error: {
        marginTop: Spacing.sm,
        color: Colors.danger,
        fontSize: 13,
        fontWeight: '600',
    },
});
