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
    View,
    Vibration
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {getCurrentLocation} from "../../services/locationService.ts";
import {FILE_BASE_URL} from "../../../env.ts";
import {registerSyncHandler} from "../../utils/sqlite/syncManager";
import CustomHeader from "../../components/layout/CustomHeader.tsx";
import {theme} from "../../theme";
import CButton from "../../components/buttons/CButton.tsx";
import {CText} from "../../components/common/CText.tsx";
import {Camera} from "react-native-camera-kit";
import {formatDate} from "../../utils/dateFormatter";
import {globalStyles} from "../../theme/styles.ts";
import {handleApiError} from "../../utils/errorHandler.ts";
import {addToLogs} from "../../api/modules/logsApi.ts";

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
    const {showAlert} = useAlert();
    const [offlineCount, setOfflineCount] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [isOnline, setIsOnline] = useState(false);
    const animatedProgress = useRef(new Animated.Value(0)).current;
    const isFocused = useIsFocused();
    const [location, setLocation] = useState({latitude: null, longitude: null});
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
                setLocation({latitude: null, longitude: null});
            }
        };
        fetchLocation();
    }, []);

    const onBarcodeRead = async (event) => {
        if (!continuousScan && scannedRef.current) return;

        scannedRef.current = true;
        setScanned(true);

        const {codeStringValue} = event.nativeEvent;
        if (!codeStringValue) return;

        const [qr_code, name = "Unknown"] = codeStringValue.split('@') ?? [];

        Vibration.vibrate(100);

        try {
            if (network?.isOnline) {
                const response = await addToLogs(qr_code);
                if (response) {
                    navigation.navigate('ScanQRDetails', {response});
                }
            }
        } catch (error) {
            handleApiError(error, 'QR (stored offline)');
        } finally {
            if (!continuousScan) {
                setTimeout(() => {
                    scannedRef.current = false;
                    setScanned(false);
                }, 2000);
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
        if (isFocused) {
            scannedRef.current = false;
            setScanned(false);
        }
    }, [isFocused]);

    if (!hasPermission) {
        return (
            <View style={styles.center}>
                <Text>Requesting camera permission...</Text>
            </View>
        );
    }

    return (
        <>
            <CustomHeader/>
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={{paddingBottom: 100}} showsVerticalScrollIndicator={false}>
                    {isFocused && (
                        <View style={styles.cameraWrapper}>
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
                                            transform: [{translateY: scanLineAnim}],
                                        },
                                    ]}
                                />
                            </View>
                        </View>
                    )}

                    <View style={styles.control}>
                        {isOnline && offlineCount > 0 && (
                            <>
                                <CButton
                                    title={`Sync Online (${offlineCount})`}
                                    type="info"
                                    onPress={handleManualSync}
                                    style={{padding: 10, paddingHorizontal: 20}}
                                    textStyle={{color: '#fff'}}
                                />
                                {syncing && (
                                    <View style={styles.progressBarBackground}>
                                        <Animated.View
                                            style={{
                                                width: animatedProgress.interpolate({
                                                    inputRange: [0, 100],
                                                    outputRange: ['0%', '100%'],
                                                }),
                                                height: '100%',
                                                backgroundColor: theme.colors.light.primary,
                                            }}
                                        />
                                    </View>
                                )}
                            </>
                        )}
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
    cameraWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        marginBottom: 20,
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
        shadowColor: 'limegreen',
        shadowOffset: {width: 0, height: 0},
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
        shadowOffset: {width: 0, height: 0},
        elevation: 10,
        zIndex: 99,
    },
    control: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        padding: 10,
    },
    progressBarBackground: {
        width: 200,
        height: 8,
        backgroundColor: '#eee',
        borderRadius: 5,
        marginTop: 10,
        overflow: 'hidden',
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: {width: 0, height: 3},
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
});
