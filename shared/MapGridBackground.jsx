import { Colors } from '@/config/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
export function MapGridBackground({ showChevron = true, showCenterPulse }) {
    const cols = Array.from({ length: 18 }, (_, i) => i);
    const rows = Array.from({ length: 32 }, (_, i) => i);
    return (<View style={styles.container}>
      <View style={[styles.gridLayer, { flexDirection: 'row' }]} pointerEvents="none">
        {cols.map((i) => (<View key={`c-${i}`} style={[styles.gridCellCol, i < cols.length - 1 ? styles.gridCellColBorder : null]}/>))}
      </View>
      <View style={[styles.gridLayer, { flexDirection: 'column' }]} pointerEvents="none">
        {rows.map((i) => (<View key={`r-${i}`} style={[styles.gridCellRow, i < rows.length - 1 ? styles.gridCellRowBorder : null]}/>))}
      </View>
      {showCenterPulse ? (<View style={styles.pulseWrap}>
          <View style={styles.pulseOuter}/>
          <View style={styles.pulseInner}/>
        </View>) : null}
      {showChevron ? (<Ionicons name="navigate" size={120} color={Colors.primaryMuted} style={styles.chevron}/>) : null}
    </View>);
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridLayer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },
    gridCellCol: { flex: 1 },
    gridCellColBorder: {
        borderRightWidth: StyleSheet.hairlineWidth,
        borderRightColor: 'rgba(15, 23, 42, 0.055)',
    },
    gridCellRow: { flex: 1 },
    gridCellRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(15, 23, 42, 0.055)',
    },
    chevron: { transform: [{ rotate: '45deg' }], position: 'absolute', opacity: 0.45 },
    pulseWrap: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulseOuter: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(31,168,123,0.18)',
    },
    pulseInner: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: Colors.primary,
    },
});
