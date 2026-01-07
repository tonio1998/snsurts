import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../../theme';

const currentColors = theme.colors['light'];

interface CTextProps extends TextProps {
    fontSize?: number;
    fontStyle?: 'R' | 'B' | 'SB' | 'L';
    gradient?: boolean;
    pop?: boolean;
    gradientColors?: string[];              // NEW
}

export const CText = ({
                          fontSize = 13,
                          fontStyle = 'L',
                          gradient = false,
                                    pop = false,
                          gradientColors = [theme.colors.light.primary, theme.colors.light.primary_dark],
                          style,
                          ...props
                      }: CTextProps) => {

    let fontFamily: string;
    let fontFamilyPop: string;

    switch (fontStyle) {
        case 'B':
            fontFamily = theme.font.bold;
            break;
        case 'SB':
            fontFamily = theme.font.semiBold;
            break;
        case 'R':
            fontFamily = theme.font.regular;
            break;
        case 'L':
        default:
            fontFamily = theme.font.regular;
            break;
    }

    switch (fontStyle) {
        case 'B':
            fontFamilyPop = theme.fontPoppins.bold;
            break;
        case 'SB':
            fontFamilyPop = theme.fontPoppins.semiBold;
            break;
        case 'R':
            fontFamilyPop = theme.fontPoppins.regular;
            break;
        case 'L':
        default:
            fontFamilyPop = theme.fontPoppins.regular;
            break;
    }

    if(pop){
        fontFamily = fontFamilyPop;
    }

    const textStyle: TextStyle = {
        fontFamily,
        fontSize,
        color: gradient ? undefined : currentColors.text, // remove color if gradient
    };

    if (!gradient) {
        return <Text {...props} style={[textStyle, style]} allowFontScaling={false} />;
    }

    return (
        <MaskedView maskElement={
            <Text {...props} style={[textStyle, style]} allowFontScaling={false} />
        }>
            <LinearGradient colors={gradientColors}>
                <Text
                    {...props}
                    style={[textStyle, style, { opacity: .3 }]}
                    allowFontScaling={false}
                />
            </LinearGradient>
        </MaskedView>
    );
};
