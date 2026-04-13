import { Colors, Shadows, Spacing } from '@/constants/theme';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

export function FareSummaryCard({ title = 'Fare breakdown', subtitle, children }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    ...Shadows.floatSm,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  sub: {
    marginTop: Spacing.xs,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  body: {
    marginTop: Spacing.md,
  },
});
