// BLUE AND VIOLET
// primary: '#3E13DA',
//         primary_soft: '#5314E4',
//         secondary: '#921BFD',
//         secondary_soft: '#02801C',

// DARK BLUE AND VIOLET
// primary: '#3E13DA',
//         primary_soft: '#5314E4',
//         secondary: '#921BFD',
//         secondary_soft: '#02801C',

// SNSU GREEN
// primary: '#006400',
//     secondary: '#228B22',

// BLUE
// primary: '#0951C7',
//     secondary: '#2366C7',

// primary: '#007848',
//     primary_dark: '#0a3300',
//     primary_light: '#ade254',
//     button: '#005431',
//     secondary: '#f29c00',

// primary: '#7c40ff',
//     primary_dark: '#773DFF',
//     primary_light: '#9A70FF',
//     button: '#005431',
//     secondary: '#7209B7',


// PURPLE
// primary: '#7c40ff',
//     primary_dark: '#773DFF',
//     primary_light: '#9A70FF',
//     button: '#7800cf',
//     secondary: '#7209B7',
const colors = {
    light: {
        // --- Backgrounds & Surfaces (Retained) ---
        background: '#EBEDEB',
        surface: '#F9FAFB',
        card: '#FFFFFF',
        muted: '#E5E7EB',
        muted_soft: '#F1F5F9',

        // --- Text & Borders ---
        text: '#1A1A1A',
        text_secondary: '#6B7280',
        border: '#E5E7EB',
        inputBackground: '#FFFFFF',

        // --- Brand Colors (Darker Green based on Logo) ---
        primary: '#228B22',
        primary_dark: '#0a3300',
        primary_light: '#ade254',
        button: '#005431',
        secondary: '#f29c00',

        // PURPLE
        // primary: '#7c40ff',
        // primary_dark: '#633CD0',
        // primary_light: '#9A70FF',
        // button: '#7800cf',
        // secondary: '#7209B7',

        // FOODPANDA PINK
        // primary: '#D70F64',        // Foodpanda Pink (brand primary)
        // primary_dark: '#B50D54',   // Darker pink for headers / pressed states
        // primary_light: '#F06292',  // Softer pink for highlights / backgrounds
        // button: '#D70F64',         // Strong CTA (same as primary, Foodpanda-style)
        // secondary: '#8E004D',      // Deep berry for contrast / secondary actions


        // TEAL GREEN
        // primary: '#0F766E',        // Teal Green – main brand / trust
        // primary_dark: '#115E59',   // Headers, app bar
        // primary_light: '#5EEAD4',  // Cards, highlights
        // button: '#0F766E',         // Primary actions
        // secondary: '#1E3A8A',      // Navy Blue – authority / secondary actions



        // --- Status Colors (Based on Logo/Standard Meanings) ---
        success: '#22C55E',
        success_soft: '#DCFCE7',

        danger: '#CC4747',         // 🔥 Red/Orange (Logo Flame)
        danger_soft: '#FEE2E2',

        warning: '#FACC15',        // 🟡 Bright Gold/Yellow (Logo Rays)
        warning_soft: '#FEF3C7',

        info: '#3A7BFC',
        info_soft: '#DBEAFE',

        // --- Accents ---
        link: '#005431',           // Dark link color
        highlight: '#FACC15',
    },

    dark: {
        // --- Backgrounds & Surfaces ---
        background: '#121212',
        surface: '#1E1E1E',
        card: '#242424',
        muted: '#3A3A3A',
        muted_soft: '#2C2C2C',

        // --- Text & Borders ---
        text: '#F0F0F0',
        text_secondary: '#B0B0B0',
        border: '#3A3A3A',
        inputBackground: '#1E1E1E',

        // --- Brand Colors (Darker Green based on Logo - Adjusted for Dark Mode Contrast) ---
        primary: '#009756',        // 🟢 Bright enough deep green for contrast
        primary_dark: '#007A46',
        primary_light: '#A8F0C6',
        button: '#007A46',
        secondary: '#FFEB3B',      // 🌟 Brighter Gold/Yellow

        // --- Status Colors ---
        success: '#66BB6A',
        success_soft: '#1B5E20',
        danger: '#FF6F6F',
        danger_soft: '#B71C1C',
        warning: '#FFD740',
        warning_soft: '#F57F17',
        info: '#42A5F5',
        info_soft: '#0D47A1',

        // --- Accents ---
        link: '#80DEEA',
        highlight: '#FFD740',
    }
};

const spacing = {
    none: 0,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
};

const fontSizes = {
    xxs: 8,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 40,
};

// export const font = {
//     regular: 'Poppins-Regular',
//     medium: 'Poppins-Medium',
//     semiBold: 'Poppins-SemiBold',
//     bold: 'Poppins-Bold',
//     italic: 'Poppins-Italic',
// };

// export const font = {
//     regular: 'MazzardSoftH-Regular',
//     medium: 'Poppins-Medium',
//     semiBold: 'MazzardSoftH-SemiBold',
//     bold: 'Poppins-Bold',
//     italic: 'Poppins-Italic',
// };

// export const font = {
//     regular: 'Roboto-Regular',
//     medium: 'Roboto-Medium',
//     semiBold: 'Roboto-SemiBold',
//     bold: 'Roboto-Bold',
//     italic: 'Roboto-Italic',
//     light: 'Roboto-Light',
//     thin: 'Roboto-Thin',
//     black: 'Roboto-Black',
// };

// export const font = {
//     regular: 'Montserrat-Regular',
//     medium: 'Montserrat-Medium',
//     semiBold: 'Montserrat-SemiBold',
//     bold: 'Montserrat-Bold',
//     italic: 'Montserrat-Italic',
//     light: 'Montserrat-Light',
//     thin: 'Montserrat-Thin',
//     black: 'Montserrat-Black',
// };
export const font = {
    thin: 'Inter_28pt-Thin',
    extraLight: 'Inter_28pt-ExtraLight',
    light: 'Inter_28pt-Light',
    regular: 'Inter_28pt-Regular',
    medium: 'Inter_28pt-Medium',
    semiBold: 'Inter_28pt-SemiBold',
    bold: 'Inter_28pt-Bold',
    extraBold: 'Inter_28pt-ExtraBold',
    black: 'Inter_28pt-Black',
};


export const fontPoppins = {
    regular: 'Poppins-Regular',
    medium: 'Poppins-Medium',
    semiBold: 'Poppins-SemiBold',
    bold: 'Poppins-Bold',
    italic: 'Poppins-Italic',
    light: 'Poppins-Light',
    thin: 'Poppins-Thin',
    black: 'Poppins-Black',
};



export const FontFamily = 'MazzardSoftH-SemiBold';
export const FontFamilyNormal = 'MazzardSoftH-Regular';

export const radius = {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 14,
    xl: 16,
    xxl: 18,
    xxxl: 22,
    xxxxl: 30,
    full: 9999,
};

export const elevation = {
    none: 0,
    sm: 2,
    md: 5,
    lg: 10,
    xl: 20,
};

export const opacity = {
    disabled: 0.4,
    semi: 0.6,
    hover: 0.8,
    full: 1,
};

const FLOATING_NAV_HEIGHT = 90;
const PADDING_TOP = 20;

export const theme = {
    colors,
    spacing,
    fontSizes,
    font,
    fontPoppins,
    radius,
    elevation,
    opacity, FLOATING_NAV_HEIGHT, PADDING_TOP

};
