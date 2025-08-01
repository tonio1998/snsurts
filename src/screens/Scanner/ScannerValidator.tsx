import {NetworkContext} from "../../context/NetworkContext.tsx";
import {useCallback, useContext, useEffect, useRef, useState} from "react";
import {useFocusEffect, useIsFocused, useNavigation} from "@react-navigation/native";
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
    Vibration, TouchableOpacity
} from "react-native";
import CustomHeader from "../../components/layout/CustomHeader.tsx";
import {Camera} from "react-native-camera-kit";
import {handleApiError} from "../../utils/errorHandler.ts";
import {useAuth} from "../../context/AuthContext.tsx";
import {addToLogs} from "../../api/modules/logsApi.ts";

export default function ScannerValidator({route}) {
    const { user } = useAuth();
    const network = useContext(NetworkContext);
    const navigation = useNavigation();
    const [hasPermission, setHasPermission] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [cameraType, setCameraType] = useState(false);
    const [continuousScan, setContinuousScan] = useState(false);
    const cameraRef = useRef(null);
    const scannedRef = useRef(false);
    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const [syncProgress, setSyncProgress] = useState(0);
    const animatedProgress = useRef(new Animated.Value(0)).current;
    const isFocused = useIsFocused();
    const SCAN_BOX_SIZE = 300;

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
    const onBarcodeRead = async (event) => {
        if (!continuousScan && scannedRef.current) return;

        scannedRef.current = true;
        setScanned(true);

        const {codeStringValue} = event.nativeEvent;
        if (!codeStringValue) return;

        const [qr_code, name = "Unknown"] = codeStringValue.split('@') ?? [];

        Vibration.vibrate(100);

        try {
            const response = await addToLogs(qr_code);
            if (response) {
                const callback = route.params?.onScanComplete;
                if (callback) callback(qr_code);

                navigation.goBack();
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
                </ScrollView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    recentScansSection: {
        // marginHorizontal: 16,
        // marginVertical: 12,
    },
    recentScansTitle: {
        marginBottom: 12,
        color: '#222',
    },
    recentScanCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 14,
        paddingHorizontal: 18,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 1,
    },
    recentScanText: {
        color: '#1e293b',
    },
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
