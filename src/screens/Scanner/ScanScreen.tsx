import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
    Animated,
    PermissionsAndroid,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Vibration,
} from 'react-native';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera } from 'react-native-camera-kit';
import Icon from 'react-native-vector-icons/Ionicons';

import { NetworkContext } from '../../context/NetworkContext';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../components/CAlert';
import { theme } from '../../theme';
import { CText } from '../../components/common/CText';

const SCAN_SIZE = 260;
const CORNER = 26;
const STROKE = 4;

export default function ScanScreen() {
    const { user } = useAuth();
    const network = useContext(NetworkContext);
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { showAlert } = useAlert();

    const cameraRef = useRef<Camera | null>(null);
    const scannedRef = useRef(false);
    const scanLineAnim = useRef(new Animated.Value(0)).current;

    const [hasPermission, setHasPermission] = useState(false);
    const [torch, setTorch] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [recentScan, setRecentScan] = useState<string[]>([]);

    useEffect(() => {
        const req = async () => {
            if (Platform.OS === 'android') {
                const g = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA
                );
                setHasPermission(g === PermissionsAndroid.RESULTS.GRANTED);
            } else {
                setHasPermission(true);
            }
        };
        req();
    }, []);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, {
                    toValue: SCAN_SIZE,
                    duration: 1600,
                    useNativeDriver: true,
                }),
                Animated.timing(scanLineAnim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        const unsub = NetInfo.addEventListener(s =>
            setIsOnline(!!s.isConnected && !!s.isInternetReachable)
        );
        return unsub;
    }, []);

    const loadRecent = async () => {
        const key = `recentScan_${user?.id}`;
        const stored = await AsyncStorage.getItem(key);
        setRecentScan(stored ? JSON.parse(stored) : []);
    };

    useFocusEffect(
        useCallback(() => {
            loadRecent();
            scannedRef.current = false;
        }, [])
    );

    const onReadCode = (event: any) => {
        if (scannedRef.current) return;
        const { codeStringValue } = event.nativeEvent;
        if (!codeStringValue) return;

        scannedRef.current = true;
        Vibration.vibrate(60);

        if (!network?.isOnline) {
            showAlert('Offline', 'Connect to the internet to continue.');
            scannedRef.current = false;
            return;
        }

        const [qr_code] = codeStringValue.split('@');

        // const qr_code = codeStringValue;

        console.log('qr_code', qr_code);

        setTimeout(() => {
            navigation.navigate('ScanQRDetails', { qr_code });
            scannedRef.current = false;
        }, 120);
    };

    if (!hasPermission) {
        return (
            <View style={styles.center}>
                <Text>Camera permission required</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.root}>
            {isFocused && (
                <Camera
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    scanBarcode
                    onReadCode={onReadCode}
                    torchMode={torch ? 'on' : 'off'}
                    showFrame={false}
                />
            )}

            <View style={styles.overlay}>
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => setTorch(v => !v)}>
                        <Icon
                            name={torch ? 'flash' : 'flash-off'}
                            size={24}
                            color="#fff"
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.scanBox}>
                    <Corner tl />
                    <Corner tr />
                    <Corner bl />
                    <Corner br />

                    <Animated.View
                        style={[
                            styles.scanLine,
                            { transform: [{ translateY: scanLineAnim }] },
                        ]}
                    />
                </View>

                <CText fontSize={14} style={styles.instruction}>
                    Place QR code inside the frame
                </CText>

                {!isOnline && (
                    <CText fontSize={12} style={styles.offline}>
                        Offline Mode
                    </CText>
                )}
            </View>

            {recentScan.length > 0 && (
                <View style={styles.bottomHint}>
                    <CText fontSize={12} color="#666">
                        Recent scan available
                    </CText>
                </View>
            )}
        </SafeAreaView>
    );
}

function Corner({ tl, tr, bl, br }: any) {
    return (
        <View
            style={[
                styles.corner,
                tl && { top: 0, left: 0, borderLeftWidth: STROKE, borderTopWidth: STROKE },
                tr && { top: 0, right: 0, borderRightWidth: STROKE, borderTopWidth: STROKE },
                bl && { bottom: 0, left: 0, borderLeftWidth: STROKE, borderBottomWidth: STROKE },
                br && { bottom: 0, right: 0, borderRightWidth: STROKE, borderBottomWidth: STROKE },
            ]}
        />
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        paddingTop: 50,
    },

    topBar: {
        width: '100%',
        paddingHorizontal: 16,
        paddingTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    scanBox: {
        width: SCAN_SIZE,
        height: SCAN_SIZE,
        marginTop: 120,
        position: 'relative',
    },

    scanLine: {
        position: 'absolute',
        width: '100%',
        height: 2,
        backgroundColor: theme.colors.light.primary,
        shadowColor: theme.colors.light.primary,
        shadowOpacity: 0.9,
        shadowRadius: 6,
        elevation: 6,
    },

    instruction: {
        marginTop: 24,
        color: '#fff',
        opacity: 0.9,
    },

    offline: {
        marginTop: 6,
        color: '#ffb020',
    },

    bottomHint: {
        position: 'absolute',
        bottom: 28,
        alignSelf: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },

    corner: {
        position: 'absolute',
        width: CORNER,
        height: CORNER,
        borderColor: theme.colors.light.primary,
    },
});
