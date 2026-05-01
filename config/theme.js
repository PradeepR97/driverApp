import { Colors } from '@/theme/colors';
export { Colors };
export const Font = {
    regular: 'NotoSans_400Regular',
    semibold: 'NotoSans_600SemiBold',
    bold: 'NotoSans_700Bold',
    extrabold: 'NotoSans_800ExtraBold',
};
export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
};
export const Radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
};
/** Soft elevation — reference uses layered, non-harsh depth */
export const Shadows = {
    floatSm: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    floatMd: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
    },
    floatLg: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
    },
    sheetTop: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 12,
    },
};
export const Type = {
    h1: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: 0.35,
        color: Colors.text,
        fontFamily: Font.extrabold,
    },
    h2: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.2,
        color: Colors.text,
        fontFamily: Font.extrabold,
    },
    body: {
        fontSize: 15,
        fontWeight: '400',
        color: Colors.textSecondary,
        fontFamily: Font.regular,
    },
    caption: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.textSecondary,
        fontFamily: Font.regular,
    },
    button: { fontSize: 16, fontWeight: '700', fontFamily: Font.bold },
};
