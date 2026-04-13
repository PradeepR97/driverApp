import { Colors, Radius, Spacing } from '@/constants/theme';
import type { MetaOptionItem } from '@/lib/api/meta';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  options: MetaOptionItem[];
  selectedCodes: string[];
  onToggle: (code: string) => void;
  multi?: boolean;
};

export function ReasonList({ options, selectedCodes, onToggle, multi = false }: Props) {
  return (
    <View style={styles.wrap}>
      {options.map((item) => {
        const selected = selectedCodes.includes(item.code);
        return (
          <Pressable
            key={item.code}
            style={[styles.row, selected ? styles.rowOn : null]}
            onPress={() => onToggle(item.code)}
          >
            <View style={[styles.dot, selected ? styles.dotOn : null]}>
              {multi && selected ? (
                <Ionicons name="checkmark" size={14} color={Colors.white} />
              ) : null}
            </View>
            <Text style={[styles.label, selected ? styles.labelOn : null]}>{item.displayName}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
  },
  rowOn: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  label: { fontSize: 14, color: Colors.text },
  labelOn: { color: Colors.primaryDark, fontWeight: '700' },
});
