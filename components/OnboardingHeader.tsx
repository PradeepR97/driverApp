import { Colors, Spacing, Type } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

type Props = {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  onHelp?: () => void;
};

export function OnboardingHeader({ title, showBack = true, onBack, onHelp }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={() => (onBack ? onBack() : router.back())}
            style={styles.iconBtn}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
        <Text style={styles.title}>{title}</Text>
        {onHelp ? (
          <Pressable
            accessibilityRole="button"
            onPress={onHelp}
            style={styles.help}
            hitSlop={12}
          >
            <Ionicons name="help-circle-outline" size={26} color={Colors.textSecondary} />
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>
      <View style={styles.hairline} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: Colors.background },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    ...Type.h2,
    fontSize: 17,
  },
  iconBtn: { width: 40, alignItems: 'flex-start' },
  iconPlaceholder: { width: 40 },
  help: { width: 40, alignItems: 'flex-end' },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
});
