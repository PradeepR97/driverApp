import { Colors, Spacing } from '@/config/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
export function RatingComponent({ value, onChange, disabled }) {
    return (<View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (<Pressable key={i} onPress={() => onChange(i)} disabled={disabled} hitSlop={8}>
          <Ionicons name={i <= value ? 'star' : 'star-outline'} size={38} color={i <= value ? Colors.star : '#64748B'}/>
        </Pressable>))}
    </View>);
}
const styles = StyleSheet.create({
    stars: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'center' },
});
