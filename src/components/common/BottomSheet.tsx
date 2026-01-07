import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';

const WINDOW_HEIGHT = Dimensions.get('window').height;

type BottomSheetProps = {
    visible: boolean;
    onClose: () => void;
    children?: React.ReactNode;
    title?: string;
    heightPercent?: number; // 0..1 (default 0.72)
    showHandle?: boolean;
    closeOnBackdropPress?: boolean;
};

const BottomSheet: React.FC<BottomSheetProps> = ({
                                                     visible,
                                                     onClose,
                                                     children,
                                                     title,
                                                     heightPercent = 0.72,
                                                     showHandle = true,
                                                     closeOnBackdropPress = true,
                                                 }) => {
    const anim = useRef(new Animated.Value(0)).current; // 0 hidden, 1 visible

    useEffect(() => {
        if (visible) {
            Animated.timing(anim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(anim, {
                toValue: 0,
                duration: 220,
                useNativeDriver: true,
            }).start();
        }
    }, [visible, anim]);

    const backdropOpacity = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.45],
        extrapolate: 'clamp',
    });

    const sheetTranslateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [WINDOW_HEIGHT, WINDOW_HEIGHT * (1 - heightPercent)],
        extrapolate: 'clamp',
    });

    const containerPointerEvents = visible ? 'auto' : 'none';

    return (
        <View style={styles.container} pointerEvents={containerPointerEvents}>
            <TouchableWithoutFeedback onPress={closeOnBackdropPress ? onClose : undefined}>
                <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
            </TouchableWithoutFeedback>

            <Animated.View
                pointerEvents={visible ? 'auto' : 'none'}
                style={[
                    styles.sheet,
                    {
                        height: WINDOW_HEIGHT * heightPercent,
                        transform: [{ translateY: sheetTranslateY }],
                    },
                ]}
            >
                <TouchableOpacity onPress={onClose} style={styles.iosCloseTint}>
                    <Icon name="close" size={22} color="#004D1A" />
                </TouchableOpacity>


                {title ? (
                    <View style={styles.titleRow}>
                        <Text style={styles.titleText}>{title}</Text>
                    </View>
                ) : null}

                <View style={styles.content}>
                    {children}
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    titleRow: {
        paddingHorizontal: 20,
        paddingTop: 6,
        paddingBottom: 10,
        alignItems: "center",
    },

    titleText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#222",
        textAlign: "center",
    },
    iosCloseTint: {
        position: "absolute",
        right: 14,
        top: -14,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#E8F5EA",
        alignItems: "center",
        justifyContent: "center",

        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },

    sheetHeaderRow: {
        paddingTop: 10,
        paddingBottom: 4,
        alignItems: "center",
        justifyContent: "center",
    },
    iosCloseInline: {
        position: "absolute",
        right: 12,
        top: 6,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#EFEFEF",
        alignItems: "center",
        justifyContent: "center",
    },


    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
    },
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
        paddingTop: 8,
        paddingHorizontal: 12,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -3 },
    },
    sheetHandleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    sheetHandle: {
        width: 36,
        height: 4,
        borderRadius: 4,
        backgroundColor: '#E6E6E6',
    },
    sheetClose: {
        position: 'absolute',
        right: 8,
        top: -2,
        padding: 8,
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },

});

export default BottomSheet;
