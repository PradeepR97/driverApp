import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  pickup: string;
  drop: string;
  distanceKm?: number;
  fare?: number;
  customerName?: string;
  onCall?: () => void;
};

export function LocationCard({
  pickup,
  drop,
  distanceKm,
  fare,
  customerName,
  onCall,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.dotPickup} />
        <Text style={styles.locText} numberOfLines={2}>
          {pickup}
        </Text>
      </View>
      <View style={styles.dotted} />
      <View style={styles.row}>
        <View style={styles.dotDrop} />
        <Text style={styles.locText} numberOfLines={2}>
          {drop}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaItem}>{distanceKm != null ? `${distanceKm.toFixed(1)} km` : '-- km'}</Text>
        <Text style={styles.metaItem}>{fare != null ? `₹${Math.round(fare)}` : '₹--'}</Text>
        <View style={styles.customerWrap}>
          <Text style={styles.metaItem}>{customerName || 'Customer'}</Text>
          {onCall ? (
            <Pressable onPress={onCall} hitSlop={8} style={styles.callBtn}>
              <Ionicons name="call" size={14} color={Colors.white} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    ...Shadows.floatSm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dotPickup: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
  },
  dotDrop: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
  },
  dotted: {
    borderLeftWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    height: 18,
    marginLeft: 4,
    marginVertical: 4,
  },
  locText: { flex: 1, color: Colors.text, fontWeight: '700', fontSize: 14 },
  metaRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  metaItem: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  customerWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  callBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
