import { Spacing } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';

const ACCENT = '#2563EB';

type Props = {
  label: string;
  amount: number;
  isHighlighted?: boolean;
};

export function FareItemRow({ label, amount, isHighlighted }: Props) {
  const formatted = `₹${Number.isFinite(amount) ? amount.toLocaleString('en-IN') : '0'}`;
  return (
    <View style={[styles.row, isHighlighted ? styles.rowHighlight : null]}>
      <Text
        style={[styles.label, isHighlighted ? styles.labelHighlight : null]}
        numberOfLines={2}
      >
        {label}
      </Text>
      <Text style={[styles.value, isHighlighted ? styles.valueHighlight : null]}>{formatted}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  rowHighlight: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(37, 99, 235, 0.25)',
    marginTop: Spacing.xs,
    paddingTop: Spacing.md,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  labelHighlight: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  valueHighlight: {
    fontSize: 18,
    fontWeight: '800',
    color: ACCENT,
  },
});
