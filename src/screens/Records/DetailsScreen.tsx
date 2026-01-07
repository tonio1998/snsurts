import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    Platform,
    KeyboardAvoidingView,
    RefreshControl,
    StatusBar,
    Animated,
    TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { globalStyles as gstyle } from '../../theme/styles';
import { theme } from '../../theme';

import { useTracking } from '../../context/TrackingContext';
import { useAuth } from '../../context/AuthContext';
import { getTrackingHistory } from '../../api/modules/logsApi';
import { handleApiError } from '../../utils/errorHandler';
import { formatDate } from '../../utils/dateFormatter';
import LeafletMap, { MapPoint } from '../../components/maps/LeafletMap';

const MAP_MAX_HEIGHT = 300;
const MAP_MIN_HEIGHT = 100;

export default function DetailsScreen() {
    const navigation = useNavigation();
    const { record } = useTracking();
    const { user } = useAuth();

    const TransactionID = record?.id;

    const [timeline, setTimeline] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const scrollY = useRef(new Animated.Value(0)).current;

    const canEdit = record?.created_by === user?.id;

    const fetchTimeline = useCallback(async () => {
        if (!TransactionID || !user?.id) return;

        setLoading(true);
        try {
            const res = await getTrackingHistory({ TransactionID, page: 1 });
            setTimeline(res.current?.data || []);
        } catch (e) {
            handleApiError(e, 'Unable to load tracking history');
        } finally {
            setLoading(false);
        }
    }, [TransactionID, user?.id]);


    useEffect(() => {
        fetchTimeline();
    }, [fetchTimeline]);

    const trailPoints: MapPoint[] = timeline
        .filter(i => i.Latitude && i.Longitude && i.Latitude !== '0')
        .map(i => ({
            latitude: Number(i.Latitude),
            longitude: Number(i.Longitude),
            label: i.TrailStatus ?? formatDate(i.created_at),
        }));

    const isExternal = record?.type === 0;
    const isUnit = record?.TransactBy === 1;

    const mapHeight = scrollY.interpolate({
        inputRange: [0, MAP_MAX_HEIGHT - MAP_MIN_HEIGHT],
        outputRange: [MAP_MAX_HEIGHT, MAP_MIN_HEIGHT],
        extrapolate: 'clamp',
    });

    const statusColor = (status?: string) => {
        switch (status) {
            case 'Incoming':
                return '#198754';
            case 'Outgoing':
                return '#0d6efd';
            case 'Return':
                return '#fd7e14';
            case 'Done':
                return '#6f42c1';
            default:
                return '#6c757d';
        }
    };

    return (
        <>
            <StatusBar backgroundColor={theme.colors.light.primary} />

            <SafeAreaView style={[gstyle.safeArea, { paddingTop: 0 }]}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <Animated.ScrollView
                        contentContainerStyle={{ paddingTop: MAP_MAX_HEIGHT }}
                        refreshControl={
                            <RefreshControl refreshing={loading} onRefresh={fetchTimeline} />
                        }
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: false }
                        )}
                        scrollEventThrottle={16}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.card}>
                            <View style={styles.sectionRow}>
                                <Text style={styles.section}>Document Information</Text>

                                {canEdit && record?.tab == 'records' && (
                                    <TouchableOpacity
                                        style={styles.editBtn}
                                        onPress={() =>
                                            navigation.navigate('AddRecord', {
                                                info: record,
                                            })
                                        }
                                    >
                                        <Icon name="create-outline" size={18} color="#fff" />
                                        <Text style={styles.editText}>Edit</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <Info label="Document Type" value={record?.tab} />
                            <Info label="Description" value={record?.Description} />
                            <Info label="QR Code" value={record?.QRCODE} />
                            {record?.QRCODE !== '' && (
                                <Info label="Connect QR" value={record?.ConnectQR} />
                            )}
                            <Info label="Document Origin" value={isExternal ? 'External' : 'Internal'} />
                            <Info label="Submitted As" value={isUnit ? 'Unit' : 'Personal'} />
                            <Info
                                label="Trail Status"
                                value={record?.TrailStatus}
                                color={statusColor(record?.TrailStatus)}
                            />
                        </View>

                        {isExternal && (
                            <View style={styles.card}>
                                <Text style={styles.section}>External Document Details</Text>

                                <Info label="Origin" value={record?.Origin} />
                                <Info
                                    label="Date & Time Received"
                                    value={
                                        record?.DateTimeReceived
                                            ? formatDate(record?.DateTimeReceived)
                                            : '—'
                                    }
                                />
                                <Info label="Transaction Type" value={record?.TransactionType} />
                                <Info label="Priority" value={record?.Priority} />
                            </View>
                        )}

                        <View style={styles.card}>
                            <Text style={styles.section}>System Dates</Text>

                            <Info label="Created At" value={formatDate(record?.created_at)} />
                            <Info label="Last Updated" value={formatDate(record?.updated_at)} />
                            <Info
                                label="Deadline"
                                value={record?.Deadline ? formatDate(record?.Deadline) : '—'}
                            />
                        </View>

                        <Animated.View style={[styles.mapContainer, { height: mapHeight }]}>
                            <LeafletMap
                                points={trailPoints}
                                showPolyline
                                autoFit
                                height="100%"
                                loading={loading}
                                error={!trailPoints.length ? 'No location data available' : null}
                            />
                        </Animated.View>
                    </Animated.ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
}

function Info({ label, value, color }: { label: string; value?: any; color?: string }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.label}>{label}</Text>
            <Text style={[styles.value, color ? { color } : null]}>
                {value ?? '—'}
            </Text>
        </View>
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
        borderRadius: 18,
        padding: 16,
        marginHorizontal: 10,
        marginBottom: 16,
    },
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    section: {
        fontSize: 14,
        fontWeight: '700',
        color: '#444',
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.colors.light.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    editText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    infoRow: {
        marginBottom: 8,
    },
    label: {
        fontSize: 12,
        color: '#777',
    },
    value: {
        fontSize: 14,
        fontWeight: '500',
        color: '#222',
    },
});
