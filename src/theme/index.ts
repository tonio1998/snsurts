const colors = {
    light: {
        background: '#F9FAFB',           // soft off-white, easier on the eyes than pure white
        surface: '#E5EAF2',              // calm and clean surface tone
        text: '#111827',                 // deep slate for better readability
        inputBackground: '#FFFFFF',     // keep form fields clean and bright
        border: '#D1D5DB',              // soft border tone (not too harsh)

        primary: '#166534',             // strong forest green (trust + action)
        primary_soft: '#D1FAE5',        // soft green tint for subtle elements

        secondary: '#2563EB',           // vibrant but professional blue
        secondary_soft: '#DBEAFE',      // gentle blue for light accents

        success: '#10B981',             // emerald green (for "Approved", "Completed")
        success_soft: '#D1FAE5',        // soft success background

        danger: '#DC2626',              // red-600 for errors
        danger_soft: '#FECACA',         // red-200 for background highlights

        warning: '#F59E0B',             // amber warning
        warning_soft: '#FEF3C7',        // subtle warning bg

        info: '#0EA5E9',                // cyan-500 (informational)
        info_soft: '#E0F2FE',           // cyan-100 background

        muted: '#F3F4F6',               // light gray for less important areas
        muted_soft: '#E5E7EB',          // slightly darker muted tone

        card: '#FFFFFF'                 // cards should stay clean and pop on soft bg
    },
    dark: {
        background: '#000000',
        surface: '#1C1C1C',
        text: '#FFFFFF',
        inputBackground: '#222222',
        border: '#444444',
        primary: '#4CAF50',
        secondary: '#FFB74D',
        success: '#30D158',
        danger: '#FF453A',
        warning: '#FF9F0A',
        info: '#64D2FF',
        muted: '#888888',
    },
    text: {
        default: '#1C1C1E',
        muted: '#C5C5C5',
        placeholder: '#A0A0A0',
        link: '#0265E1',
    },
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

export const font = {
    regular: 'MazzardSoftH-Regular',
    medium: 'Poppins-Medium',
    semiBold: 'MazzardSoftH-SemiBold',
    bold: 'Poppins-Bold',
    italic: 'Poppins-Italic',
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
    radius,
    elevation,
    opacity, FLOATING_NAV_HEIGHT, PADDING_TOP
    
};
