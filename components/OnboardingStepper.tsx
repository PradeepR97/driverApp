import { Colors, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

type Step = { key: string; label: string };

type Props = {
  steps: Step[];
  currentIndex: number;
};

const CIRCLE = 28;

export function OnboardingStepper({ steps, currentIndex }: Props) {
  return (
    <View style={styles.wrap}>
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const lineDone = i > 0 && currentIndex >= i;

        return (
          <View key={step.key} style={styles.col}>
            <View style={styles.topRow}>
              {i > 0 ? (
                <View style={[styles.lineLeft, lineDone && styles.lineDone]} />
              ) : (
                <View style={styles.lineSpacer} />
              )}
              <View
                style={[
                  styles.circle,
                  done && styles.circleDone,
                  active && !done && styles.circleActive,
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                ) : (
                  <Text style={[styles.num, (active || done) && styles.numOnPrimary]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              {i < steps.length - 1 ? (
                <View
                  style={[styles.lineRight, currentIndex > i && styles.lineDone]}
                />
              ) : (
                <View style={styles.lineSpacer} />
              )}
            </View>
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  col: { flex: 1, alignItems: 'center' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  circleDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  num: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  numOnPrimary: { color: '#fff' },
  label: {
    marginTop: Spacing.xs,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  labelActive: { color: Colors.text, fontWeight: '700' },
  lineLeft: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginRight: 4,
    maxHeight: 2,
  },
  lineRight: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginLeft: 4,
    maxHeight: 2,
  },
  lineDone: { backgroundColor: Colors.primary },
  lineSpacer: { flex: 1 },
});
