import {NetworkContext} from "../../context/NetworkContext.tsx";
import {useContext, useEffect, useRef, useState} from "react";
import {useIsFocused, useNavigation} from "@react-navigation/native";
import {useAlert} from "../../components/CAlert.tsx";
import {
    Alert,
    Animated, Image,
    PermissionsAndroid,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    ToastAndroid,
    Vibration,
    View
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {getCurrentLocation} from "../../services/locationService.ts";
import {FILE_BASE_URL} from "../../../env.ts";
import {registerSyncHandler} from "../../utils/sqlite/syncManager";
import CustomHeader from "../../components/layout/CustomHeader.tsx";
import {theme} from "../../theme";
import CButton from "../../components/buttons/CButton.tsx";
import { CText } from "../../components/common/CText.tsx";
import {Camera} from "react-native-camera-kit";
import {formatDate} from "../../utils/dateFormatter";
import {globalStyles} from "../../theme/styles.ts";
import { handleApiError } from "../../utils/errorHandler.ts";
import { addToLogs } from "../../api/modules/logsApi.ts";

export default function ScanScreen() {
    const network = useContext(NetworkContext);
    const navigation = useNavigation();
    const [hasPermission, setHasPermission] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [cameraType, setCameraType] = useState(false);
    const [continuousScan, setContinuousScan] = useState(false);
    const [userScanned, setuserScanned] = useState();
    const cameraRef = useRef(null);
    const scannedRef = useRef(false);
    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const [selected, setSelected] = useState<0 | 1 | null>(1);
    const { showAlert } = useAlert();
    const [offlineCount, setOfflineCount] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [isOnline, setIsOnline] = useState(false);
    const animatedProgress = useRef(new Animated.Value(0)).current;
    const isFocused = useIsFocused();
    const [location, setLocation] = useState({ latitude: null, longitude: null });
    const SCAN_BOX_SIZE = 300;
    const [imageUri, setImageUri] = useState();

    useEffect(() => {
        const animation = Animated.timing(animatedProgress, {
            toValue: syncProgress,
            duration: 300,
            useNativeDriver: false,
        });

        animation.start();

        return () => animation.stop();
    }, [syncProgress]);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, {
                    toValue: SCAN_BOX_SIZE,
                    duration: 2000,
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



    const isConnectedNow = (state) => state.isConnected && state.isInternetReachable;



    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(async state => {
            const connected = isConnectedNow(state);
            setIsOnline(connected);

            const logs = await AsyncStorage.getItem('offline_logs');
            const parsed = JSON.parse(logs || '[]');
            setOfflineCount(parsed.length);

            if (connected && parsed.length > 0) {
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const currentLocation = await getCurrentLocation();
                setLocation(currentLocation);
            } catch (error) {
                console.warn('Failed to get location:', error.message);
                setLocation({ latitude: null, longitude: null }); // fallback
            }
        };

        fetchLocation();
    }, []);

    const onBarcodeRead = async (event) => {
        if (!continuousScan && scannedRef.current) return;

        scannedRef.current = true;
        setScanned(true);

        const { codeStringValue } = event.nativeEvent;
        if (!codeStringValue) return;

        const [qr_code, name = "Unknown"] = codeStringValue.split('@') ?? [];

        console.log('QR Code:', qr_code);

        Vibration.vibrate(100);

        try {
            if (network?.isOnline) {
                const response = await addToLogs(qr_code);
                if (response) {
                    navigation.navigate('ScanQRDetails', { response });
                }
            } else {
                console.log('Offline mode - QR scan skipped or cached.');
            }
        } catch (error) {
            handleApiError(error, 'QR (stored offline)');
        } finally {
            if (!continuousScan) {
                setTimeout(() => {
                    scannedRef.current = false;
                    setScanned(false);
                }, 2000); // gives a cooldown before next scan
            }
        }
    };


    const handleManualSync = async () => {
        setSyncing(true);
        setSyncProgress(0);

        await syncOfflineLogs((percent) => {
            setSyncProgress(percent);
        });

        setSyncing(false);
        setOfflineCount(0);
        // showAlert('success', 'Sync Complete', 'All offline scans uploaded.');
    };

    registerSyncHandler(handleManualSync);

    useEffect(() => {
        const requestPermission = async () => {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    setHasPermission(true);
                } else {
                    Alert.alert('Permission denied');
                }
            } else {
                setHasPermission(true);
            }
        };

        requestPermission();
    }, []);

    useEffect(() => {
        startScanAnimation();
    }, []);

    const startScanAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, {
                    toValue: SCAN_BOX_SIZE,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(scanLineAnim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    useEffect(() => {
        if (isFocused) {
            scannedRef.current = false;
            setScanned(false);
        }
    }, [isFocused]);

    useEffect(() => {
        const checkOfflineLogs = async () => {
            const logs = await AsyncStorage.getItem('offline_logs');
        };

        checkOfflineLogs();
    }, []);

    if (!hasPermission) {
        return (
            <View style={styles.center}>
                <Text>Requesting camera permission...</Text>
            </View>
        );
    }

    return (
        <>
            <CustomHeader />
                <SafeAreaView style={[styles.container, {marginTop: 50}]}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    >
                        <View style={[styles.container]}>
                            {userScanned && (
                                <View style={{ marginTop: 15 }}>
                                    <CText fontStyle={'SB'} fontSize={18} style={styles.lrn}>Recent Log</CText>
                                    <View style={[globalStyles.cardRow, styles.card]}>
                                        <Image
                                            source={{ uri: imageUri }}
                                            style={styles.photo}
                                        />
                                        <View style={styles.info}>
                                            <CText fontStyle={'B'} fontSize={18} numberOfLines={1} ellipsizeMode="middle" style={styles.name}>{userScanned?.Name}</CText>
                                            <CText fontStyle={'SB'} fontSize={15} style={styles.lrn}>{formatDate(userScanned?.scannedAt)}</CText>
                                            <CText
                                                fontStyle={'SB'}
                                                fontSize={15}
                                                style={[
                                                    styles.status,
                                                    { color: userScanned?.Mode === 1 ? 'green' : 'red' }
                                                ]}
                                            >
                                                Status: {userScanned?.Mode === 1 ? 'IN' : 'OUT'}
                                            </CText>

                                        </View>
                                    </View>
                                </View>
                            )}
                            {isFocused && (
                                <View style={styles.cameraContainer}>
                                    <Camera
                                        ref={cameraRef}
                                        cameraType={cameraType ? 'front' : 'back'}
                                        style={styles.camera}
                                        scanBarcode={true}
                                        onReadCode={onBarcodeRead}
                                        showFrame={false}
                                    />
                                    <Animated.View
                                        style={[
                                            styles.scanLine,
                                            {
                                                transform: [{ translateY: scanLineAnim }],
                                            },
                                        ]}
                                    />
                                </View>
                            )}

                            <View style={styles.topSection}>
                                <View style={styles.control}>
                                    <View style={styles.controlItem}>
                                        <CButton
                                            title={selected === 1 ? 'IN' : 'OUT'}
                                            type={selected === 1 ? 'success' : 'danger'}
                                            style={{ padding: 10, paddingHorizontal: 20 }}
                                            textStyle={{ color: theme.colors.light.card }}
                                            onPress={() => setSelected(prev => (prev === 1 ? 0 : 1))}
                                        />
                                        <CText fontSize={12} style={styles.controlLabel}>Mode</CText>
                                    </View>

                                    <View style={styles.controlItem}>
                                        <CButton
                                            icon={continuousScan ? 'repeat' : 'scan'}
                                            type="muted"
                                            style={{ padding: 10 }}
                                            textStyle={{ color: theme.colors.light.primary }}
                                            onPress={() => setContinuousScan(prev => !prev)}
                                        />
                                        <CText fontSize={12} style={styles.controlLabel}>
                                            {continuousScan ? 'Continuous' : 'Single'}
                                        </CText>
                                    </View>

                                    <View style={styles.controlItem}>
                                        <CButton
                                            icon={cameraType ? 'camera-outline' : 'camera-reverse'}
                                            type="muted"
                                            style={{ padding: 10 }}
                                            textStyle={{ color: theme.colors.light.primary }}
                                            onPress={() => setCameraType(prev => !prev)}
                                        />
                                        <CText fontSize={12} style={styles.controlLabel}>
                                            Camera ({cameraType ? 'front' : 'back'})
                                        </CText>
                                    </View>

                                    {isOnline && offlineCount > 0 && (
                                        <View style={{ marginTop: 10, alignItems: 'center' }}>
                                            <CButton
                                                title={`Sync Online (${offlineCount})`}
                                                type="info"
                                                onPress={handleManualSync}
                                                style={{ padding: 10, paddingHorizontal: 20 }}
                                                textStyle={{ color: '#fff' }}
                                            />
                                            {syncing && (
                                                <View style={{
                                                    width: 200,
                                                    height: 8,
                                                    backgroundColor: '#eee',
                                                    borderRadius: 5,
                                                    marginTop: 10,
                                                    overflow: 'hidden'
                                                }}>
                                                    <Animated.View style={{
                                                        width: animatedProgress.interpolate({
                                                            inputRange: [0, 100],
                                                            outputRange: ['0%', '100%'],
                                                        }),
                                                        height: '100%',
                                                        backgroundColor: theme.colors.light.primary,
                                                    }} />
                                                </View>
                                            )}

                                        </View>
                                    )}

                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f9f9f9',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topSection: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10
    },
    control: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 20,
        padding: 10,
        borderRadius: 10,
    },
    controlItem: {
        alignItems: 'center',
        marginHorizontal: 8,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    controlLabel: {
        marginTop: 4,
        color: '#444',
        fontSize: 12,
    },
    cameraContainer: {
        width: 300,
        height: 300,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 3,
        borderColor: 'limegreen',
        backgroundColor: '#000',
        marginTop: 10,
        shadowColor: 'limegreen',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    camera: {
        width: '100%',
        height: '100%',
    },
    scanLine: {
        position: 'absolute',
        width: '90%',
        left: '5%',
        height: 4,
        backgroundColor: 'lime',
        borderRadius: 2,
        shadowColor: 'lime',
        shadowOpacity: 0.9,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
        elevation: 10,
        zIndex: 99,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
        marginTop: 10,
        elevation: 2,
    },
    photo: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#eee',
    },
    info: {
        marginLeft: 14,
        flex: 1,
    },
    name: {
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#222',
    },
    lrn: {
        color: '#666',
        marginBottom: 2,
    },
    status: {
        fontWeight: 'bold',
        marginTop: 4,
        color: '#444',
    },
    qrButton: {
        padding: 8,
        paddingHorizontal: 16,
        borderRadius: 50,
        marginRight: 10
    },
    controlBtn: {
        backgroundColor: '#fff',
        marginTop: 50,
        padding: 5,
        paddingHorizontal: 10,
        borderRadius: 50,
        flexDirection: 'row',
    }
});


