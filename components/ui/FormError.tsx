import { Colors, Spacing } from '@/constants/theme';
import { StyleSheet, Text } from 'react-native';

type Props = {
  message?: string | null;
  visible?: boolean;
};

export function FormError({ message, visible }: Props) {
  if (!visible || !message) return null;
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

