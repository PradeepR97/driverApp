import { Colors, Radius, Spacing } from '@/config/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
export function ReasonList({ options, selectedCodes, onToggle, multi = false, mode = 'list' }) {
    const isChips = mode === 'chips';
    return (<View style={isChips ? styles.chipsWrap : styles.wrap}>
      {options.map((item) => {
            const selected = selectedCodes.includes(item.code);
            return (<Pressable key={item.code} style={[
                    isChips ? styles.chip : styles.row,
                    selected ? (isChips ? styles.chipOn : styles.rowOn) : null,
                ]} onPress={() => onToggle(item.code)}>
            {!isChips ? (<View style={[styles.dot, selected ? styles.dotOn : null]}>
                {multi && selected ? (<Ionicons name="checkmark" size={14} color={Colors.white}/>) : null}
              </View>) : null}
            <Text style={[
                    isChips ? styles.chipLabel : styles.label,
                    selected ? (isChips ? styles.chipLabelOn : styles.labelOn) : null,
                ]}>{item.displayName}</Text>
          </Pressable>);
        })}
    </View>);
}
const styles = StyleSheet.create({
    wrap: { gap: Spacing.sm },
    chipsWrap: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
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
    chip: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.surfaceElevated,
    },
    chipOn: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
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
    chipLabel: { fontSize: 14, color: Colors.text, fontWeight: '500' },
    chipLabelOn: { color: Colors.primaryDark, fontWeight: '700' },
});
