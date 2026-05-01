import React from 'react';
import { Keyboard, Pressable, StyleSheet } from 'react-native';
/** Tap outside focused inputs to dismiss the keyboard (wraps the root navigator). */
export function KeyboardDismissView({ children }) {
    return (<Pressable style={styles.container} onPress={Keyboard.dismiss} accessible={false}>
      {children}
    </Pressable>);
}
const styles = StyleSheet.create({
    container: { flex: 1 },
});
