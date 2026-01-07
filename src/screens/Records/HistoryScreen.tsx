import React, { useCallback, useEffect, useRef, useState } from 'react';
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

import { CText } from '../../components/common/CText.tsx';
import { globalStyles as gstyle } from '../../theme/styles.ts';
import { theme } from '../../theme';

import { useTracking } from '../../context/TrackingContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { getTrackingHistory } from '../../api/modules/logsApi.ts';
import { handleApiError } from '../../utils/errorHandler.ts';
import { formatDate } from '../../utils/dateFormatter';
import LeafletMap, { MapPoint } from '../../components/maps/LeafletMap.tsx';


const MAP_MAX_HEIGHT = 300;
const MAP_MIN_HEIGHT = 90;


export default function HistoryScreen() {
    const { record } = useTracking();
    const { user } = useAuth();

    const TransactionID = record?.id;

    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const scrollY = useRef(new Animated.Value(0)).current;


    const fetchHistory = useCallback(async () => {
        if (!user?.id || !TransactionID) return;

        setLoading(true);
        try {
            const res = await getTrackingHistory({ page: 1, TransactionID });
            setHistory(res.current?.data || []);
        } catch (err) {
            handleApiError(err, 'Unable to load tracking history.');
        } finally {
            setLoading(false);
        }
    }, [user?.id, TransactionID]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);


    const trailPoints: MapPoint[] = history
        .filter(i => i.Latitude !== "0" && i.Longitude !== "0")
        .map(i => ({
            latitude: Number(i.Latitude),
            longitude: Number(i.Longitude),
            label: i.created_at,
        }))
        .sort(
            (a, b) =>
                new Date(a.label ?? '').getTime() -
                new Date(b.label ?? '').getTime()
        );


    useEffect(() => {
        console.log("trailPoints", history);
    }, [trailPoints]);


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
                    color={index === 0 ? theme.colors.light.primary : '#6c757d'}
                />
                {index < history.length - 1 && <View style={styles.verticalLine} />}
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
                    <CText fontStyle="SB" fontSize={14} style={styles.forAction}>
                        Courier: {item.CourierName}
                    </CText>
                )}

                {item.forAction && (
                    <CText fontStyle="SB" fontSize={17} style={styles.forAction}>
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

            <SafeAreaView style={[gstyle.safeArea, {paddingTop: 0}]}>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <Animated.ScrollView
                        contentContainerStyle={{
                            paddingTop: MAP_MAX_HEIGHT,
                        }}
                        refreshControl={
                            <RefreshControl
                                refreshing={loading}
                                onRefresh={fetchHistory}
                            />
                        }
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
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
                                        color={theme.colors.light.primary}
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

                        <Animated.View
                            style={[
                                styles.mapContainer,
                                { height: mapHeight, opacity: mapOpacity },
                            ]}
                        >
                            <LeafletMap
                                points={trailPoints}
                                showPolyline
                                autoFit
                                height="100%"
                                loading={loading}
                                error={
                                    !trailPoints.length
                                        ? 'No valid location data'
                                        : null
                                }
                            />
                        </Animated.View>
                    </Animated.ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
}

/* ---------------- STYLES ---------------- */

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
        // elevation: 8,
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
