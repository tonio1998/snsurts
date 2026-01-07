import React, { useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    Text,
    ActivityIndicator,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { theme } from "../../theme";
import {isTablet} from "../../utils/responsive";

interface LoadingProps {
    loading: boolean;
    timeout?: number;
    onTimeout?: (errorMessage: string) => void;
    text?: string;
}

const Loading: React.FC<LoadingProps> = ({
                                             loading,
                                             timeout = 20000,
                                             onTimeout,
                                             text = "Loading..."
                                         }) => {
    const slideAnim = useRef(new Animated.Value(-60)).current;

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (loading) {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 55,
                useNativeDriver: true,
            }).start();

            timeoutRef.current = setTimeout(() => {
                NetInfo.fetch().then(state => {
                    const message = !state.isConnected
                        ? 'No internet connection.'
                        : 'Server is not responding.';
                    onTimeout?.(message);
                });
            }, timeout);
        } else {
            Animated.timing(slideAnim, {
                toValue: -60,
                duration: 200,
                useNativeDriver: true,
            }).start();

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [loading]);

    if (!loading) return null;

    return (
        <Animated.View style={[styles.container]}>
            <ActivityIndicator size="large" color={theme.colors.light.primary} />
            <Text style={styles.text}>{text}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: '50%',
        padding: 18,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 999,
        borderRadius: 4,
        alignSelf: 'center',
        maxWidth: '87%',
        width: isTablet() ? '20%' : '100%',
    },
    text: {
        marginLeft: 8,
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
});


export default Loading;
