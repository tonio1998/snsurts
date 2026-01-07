import React from 'react';
import { View, StyleSheet, Dimensions, ViewStyle, StyleProp } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {theme} from "../theme";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = {
    children?: React.ReactNode;
    height?: number;
    heightPercent?: number;
    style?: StyleProp<ViewStyle>;
    greenHex?: string;
    yellowHex?: string;
};

export default function CanvaHeaderBackground({
                                                  children,
                                                  height,
                                                  heightPercent = 0.50,
                                                  style,
                                                  greenHex = '#004D1A',
                                                  yellowHex = '#FFD04C',
                                              }: Props) {
    const headerHeight =
        typeof height === 'number'
            ? height
            : Math.round(Math.max(180, SCREEN_HEIGHT * heightPercent));

    // const lightGreen = 'rgba(0, 77, 26, 0.4)';
    // const lightYellow = 'rgba(255, 208, 76, 0.35)';
    // const whiteTint = 'rgba(255,255,255,0.8)';


    const lightGreen = theme.colors.light.primary + '88';
    const lightYellow = theme.colors.light.primary_light + '77';
    const whiteTint = theme.colors.light.primary_light + '88';

    return (
        <View style={[styles.wrapper, style]}>
            <View style={[styles.headerArea, { height: headerHeight }]}>
                <LinearGradient
                    colors={[whiteTint, lightYellow, lightGreen]}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                />

                <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,1)']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.bottomFade}
                />
            </View>

            <View style={styles.contentContainer}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: '#ffffff', // make sure underlying area is pure white
    },
    headerArea: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        overflow: 'hidden',
    },
    bottomFade: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '60%',
    },
    contentContainer: {
        flex: 1,
    },
});
