import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    Platform,
    ActivityIndicator,
    KeyboardAvoidingView,
    RefreshControl,
    StatusBar,
    Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { CText } from '../../components/common/CText';
import { globalStyles as gstyle } from '../../theme/styles';
import { theme } from '../../theme';

import { useTracking } from '../../context/TrackingContext';
import { useAuth } from '../../context/AuthContext';
import { getTrackingHistory } from '../../api/modules/logsApi';
import { handleApiError } from '../../utils/errorHandler';
import { formatDate } from '../../utils/dateFormatter';
import LeafletMap, { MapPoint } from '../../components/maps/LeafletMap';

import {
    loadTrackingHistoryFromCache,
    saveTrackingHistoryToCache,
} from '../../services/cache/trackingHistoryCache';

const MAP_MAX_HEIGHT = 300;
const MAP_MIN_HEIGHT = 90;

export default function HistoryScreen() {
    const { record } = useTracking();
    const { user } = useAuth();

    const TransactionID = record?.id;

    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const scrollY = useRef(new Animated.Value(0)).current;
    const loadingRef = useRef(false);
    const hasLoadedRef = useRef(false);

    const fetchHistory = useCallback(
        async (force = false) => {
            if (!user?.id || !TransactionID) return;
            if (loadingRef.current) return;

            loadingRef.current = true;
            setLoading(true);

            try {
                if (!force) {
                    const cached = await loadTrackingHistoryFromCache(
                        user.id,
                        TransactionID
                    );
                    if (Array.isArray(cached)) {
                        setHistory(cached);
                        return;
                    }
                }

                const res = await getTrackingHistory({
                    page: 1,
                    TransactionID,
                });

                const data = res?.current ?? [];
                setHistory(data);

                await saveTrackingHistoryToCache(
                    user.id,
                    TransactionID,
                    data
                );
            } catch (err) {
                handleApiError(err, 'Unable to load tracking history.');
            } finally {
                loadingRef.current = false;
                setLoading(false);
            }
        },
        [user?.id, TransactionID]
    );

    useEffect(() => {
        if (hasLoadedRef.current) return;
        hasLoadedRef.current = true;
        fetchHistory(false);
    }, [fetchHistory]);

    const trailPoints: MapPoint[] = useMemo(
        () =>
            history
                .filter(
                    i =>
                        i.Latitude !== '0' &&
                        i.Longitude !== '0' &&
                        i.Latitude &&
                        i.Longitude
                )
                .map(i => ({
                    latitude: Number(i.Latitude),
                    longitude: Number(i.Longitude),
                    label: i.CreatedAt,
                }))
                .sort(
                    (a, b) =>
                        new Date(a.label ?? '').getTime() -
                        new Date(b.label ?? '').getTime()
                ),
        [history]
    );

    const hasTrailPoints = trailPoints.length > 0;

    const mapHeight = scrollY.interpolate({
        inputRange: [0, MAP_MAX_HEIGHT - MAP_MIN_HEIGHT],
        outputRange: [MAP_MAX_HEIGHT, MAP_MIN_HEIGHT],
        extrapolate: 'clamp',
    });

    const mapOpacity = scrollY.interpolate({
        inputRange: [0, 140],
        outputRange: [1, 0.85],
        extrapolate: 'clamp',
    });

    const getTrailDescription = (
        status: string,
        locationUnit?: string,
        destinationUnit?: string,
        name?: string
    ) => {
        switch (status) {
            case 'Incoming':
                return `Arrived at ${locationUnit}.`;
            case 'Outgoing':
                return `Sent to ${destinationUnit}.`;
            case 'Return':
                return `Returned to ${destinationUnit}.`;
            case 'Done':
                return `Final destination: ${destinationUnit}.`;
            case 'Open':
                return `Tracking process reopened.`;
            default:
                return `Created by ${name}.`;
        }
    };

    const renderItem = (item: any, index: number) => (
        <View key={item.RecordDetailID || index} style={styles.timelineItem}>
            <View style={styles.iconWrapper}>
                <Icon
                    name={index === 0 ? 'radio-button-on' : 'checkmark-circle'}
                    size={22}
                    color={
                        index === 0
                            ? theme.colors.light.primary
                            : '#6c757d'
                    }
                />
                {index < history.length - 1 && (
                    <View style={styles.verticalLine} />
                )}
            </View>

            <View style={styles.timelineContent}>
                <Text style={styles.date}>
                    {formatDate(item.CreatedAt)}
                </Text>

                <Text style={[styles.status, index === 0 && styles.highlight]}>
                    {getTrailDescription(
                        item.TrailStatus,
                        item.LocationUnit,
                        item.DestinationUnit,
                        item.UserName
                    )}
                </Text>

                {item.CourierName && (
                    <CText fontStyle="SB" fontSize={14}>
                        Courier: {item.CourierName}
                    </CText>
                )}

                {item.forAction && (
                    <CText fontStyle="SB" fontSize={17}>
                        For: {item.forAction}
                    </CText>
                )}

                {item.comments && (
                    <Text style={styles.comment}>🗨️ {item.comments}</Text>
                )}
            </View>
        </View>
    );

    return (
        <>
            <StatusBar backgroundColor={theme.colors.light.primary} />

            <SafeAreaView style={[gstyle.safeArea, { paddingTop: 0 }]}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <Animated.ScrollView
                        contentContainerStyle={{
                            paddingTop: hasTrailPoints
                                ? MAP_MAX_HEIGHT
                                : 50,
                        }}
                        refreshControl={
                            <RefreshControl
                                refreshing={loading}
                                onRefresh={() => fetchHistory(true)}
                            />
                        }
                        onScroll={Animated.event(
                            [
                                {
                                    nativeEvent: {
                                        contentOffset: { y: scrollY },
                                    },
                                },
                            ],
                            { useNativeDriver: false }
                        )}
                        scrollEventThrottle={16}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.card}>
                            {loading ? (
                                <View style={gstyle.textcenter}>
                                    <ActivityIndicator
                                        size="large"
                                        color={
                                            theme.colors.light.primary
                                        }
                                    />
                                </View>
                            ) : history.length ? (
                                history.map(renderItem)
                            ) : (
                                <Text style={styles.noData}>
                                    No tracking history available.
                                </Text>
                            )}
                        </View>

                        {hasTrailPoints && (
                            <Animated.View
                                style={[
                                    styles.mapContainer,
                                    {
                                        height: mapHeight,
                                        opacity: mapOpacity,
                                    },
                                ]}
                            >
                                <LeafletMap
                                    points={trailPoints}
                                    showPolyline
                                    autoFit
                                    height="100%"
                                    loading={loading}
                                />
                            </Animated.View>
                        )}
                    </Animated.ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    mapContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    card: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 16,
        paddingBottom: 120,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    iconWrapper: {
        width: 30,
        alignItems: 'center',
        marginRight: 12,
    },
    verticalLine: {
        flex: 1,
        width: 2,
        backgroundColor: '#ccc',
        marginTop: 4,
    },
    timelineContent: {
        flex: 1,
    },
    date: {
        fontSize: 12,
        color: '#888',
    },
    status: {
        fontSize: 15,
        fontWeight: '600',
    },
    highlight: {
        color: theme.colors.light.primary,
    },
    comment: {
        marginTop: 6,
        fontSize: 13,
        fontStyle: 'italic',
        color: '#d9534f',
    },
    noData: {
        textAlign: 'center',
        marginTop: 40,
        color: '#aaa',
    },
});
