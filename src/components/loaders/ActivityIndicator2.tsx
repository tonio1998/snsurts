import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import {theme} from "../../theme";

export default function ActivityIndicator2() {
    const distance = 18;

    const dot0X = useRef(new Animated.Value(0)).current;
    const dot1X = useRef(new Animated.Value(distance)).current;
    const dot2X = useRef(new Animated.Value(distance * 2)).current;

    const dot0S = useRef(new Animated.Value(0.8)).current;
    const dot1S = useRef(new Animated.Value(1)).current;
    const dot2S = useRef(new Animated.Value(0.8)).current;

    const positions = useRef([0, distance, distance * 2]);

    useEffect(() => {
        let stopped = false;

        const animateToTargets = (targets: number[]) =>
            Animated.parallel([
                Animated.timing(dot0X, {
                    toValue: targets[0],
                    duration: 360,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(dot1X, {
                    toValue: targets[1],
                    duration: 360,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(dot2X, {
                    toValue: targets[2],
                    duration: 360,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),

                // Scaling logic (middle dot = largest)
                Animated.timing(dot0S, {
                    toValue: targets[0] === distance ? 1 : 0.75,
                    duration: 360,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(dot1S, {
                    toValue: targets[1] === distance ? 1 : 0.75,
                    duration: 360,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(dot2S, {
                    toValue: targets[2] === distance ? 1 : 0.75,
                    duration: 360,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]);

        const loop = async () => {
            while (!stopped) {
                const nextTargets = [...positions.current.slice(1), positions.current[0]];
                await new Promise((res) => {
                    animateToTargets(nextTargets).start(() => {
                        positions.current = nextTargets;
                        res(null);
                    });
                });
            }
        };

        loop();
        return () => {
            stopped = true;
        };
    }, []);

    return (
        <View style={styles.wrapper}>
            <View style={styles.container}>
                <Animated.View
                    style={[
                        styles.dot,
                        { backgroundColor: theme.colors.light.primary },
                        { transform: [{ translateX: dot0X }, { scale: dot0S }] },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.dot,
                        { backgroundColor: theme.colors.light.secondary },
                        { transform: [{ translateX: dot1X }, { scale: dot1S }] },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.dot,
                        { backgroundColor: theme.colors.light.primary_light },
                        { transform: [{ translateX: dot2X }, { scale: dot2S }] },
                    ]}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
    },
    container: {
        width: 60,
        height: 18,
        justifyContent: 'center',
        alignItems: 'flex-start',
        position: 'relative',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 6,
        position: 'absolute',
        left: 0,
        top: 4,
    },
});
