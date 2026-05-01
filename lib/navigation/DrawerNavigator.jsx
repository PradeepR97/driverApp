import { Colors } from '@/config/theme';
/**
 * Shared options for the driver dashboard drawer (`app/(drawer)/_layout.tsx`).
 * Uses `@react-navigation/drawer` via Expo Router.
 */
export const drawerScreenOptions = {
    headerShown: false,
    drawerType: 'front',
    drawerPosition: 'left',
    overlayColor: 'rgba(0,0,0,0.45)',
    swipeEnabled: true,
    swipeEdgeWidth: 56,
    drawerStyle: {
        width: '86%',
        maxWidth: 340,
        backgroundColor: Colors.background,
    },
};
