import { Colors, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

type Props = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function RatingComponent({ value, onChange, disabled }: Props) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable key={i} onPress={() => onChange(i)} disabled={disabled} hitSlop={8}>
          <Ionicons
            name={i <= value ? 'star' : 'star-outline'}
            size={36}
            color={i <= value ? Colors.star : Colors.border}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stars: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
});
