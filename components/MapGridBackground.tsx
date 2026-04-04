import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

type Props = {
  /** Large chevron for navigation-style map placeholder */
  showChevron?: boolean;
  /** Small center dot for home offline map */
  showCenterPulse?: boolean;
};

export function MapGridBackground({ showChevron = true, showCenterPulse }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.grid} pointerEvents="none" />
      {showCenterPulse ? (
        <View style={styles.pulseWrap}>
          <View style={styles.pulseOuter} />
          <View style={styles.pulseInner} />
        </View>
      ) : null}
      {showChevron ? (
        <Ionicons name="navigate" size={120} color={Colors.primaryMuted} style={styles.chevron} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
    backgroundColor: '#F3F4F6',
    borderWidth: 0,
  },
  chevron: { transform: [{ rotate: '45deg' }], position: 'absolute' },
  pulseWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16,185,129,0.2)',
  },
  pulseInner: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
  },
});
