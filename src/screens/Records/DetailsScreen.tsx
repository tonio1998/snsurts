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
import QRCode from 'react-native-qrcode-svg';

import {globalStyles, globalStyles as gstyle} from '../../theme/styles';
import { theme } from '../../theme';

import { useTracking } from '../../context/TrackingContext';
import { useAuth } from '../../context/AuthContext';
import { getTrackingHistory } from '../../api/modules/logsApi';
import { handleApiError } from '../../utils/errorHandler';
import { formatDate } from '../../utils/dateFormatter';
import QRCodeScreen from "../../components/QRCodeScreen.tsx";

const MAP_MAX_HEIGHT = 300;
const MAP_MIN_HEIGHT = 100;

export default function DetailsScreen() {
    const navigation = useNavigation();
    const { record } = useTracking();
    const { user } = useAuth();

    const TransactionID = record?.id;
    const scrollY = useRef(new Animated.Value(0)).current;

    const [timeline, setTimeline] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const canEdit = record?.created_by === user?.id;
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
                        contentContainerStyle={{ paddingTop: 50 }}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: false }
                        )}
                        scrollEventThrottle={16}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={globalStyles.card}>
                            <View style={styles.sectionRow}>
                                <Text style={styles.section}>Document Information</Text>

                                {canEdit && record?.tab === 'records' && (
                                    <TouchableOpacity
                                        style={styles.editBtn}
                                        onPress={() =>
                                            navigation.navigate('AddRecord', { info: record })
                                        }
                                    >
                                        <Icon name="create-outline" size={14} color="#fff" />
                                        <Text style={styles.editText}>Edit</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.infoGroup}>
                                <Info label="Document Type" value={record?.tab} />
                                <Info label="Description" value={record?.Description} />
                                <Info
                                    label="Document Origin"
                                    value={isExternal ? 'External' : 'Internal'}
                                />
                                <Info
                                    label="Submitted As"
                                    value={isUnit ? 'Unit' : 'Personal'}
                                />
                                {record?.QRCODE !== '' && (
                                    <Info label="Connect QR" value={record?.ConnectQR} />
                                )}
                            </View>

                            <View style={styles.statusContainer}>
                                <Info
                                    label="Trail Status"
                                    value={record?.TrailStatus}
                                    color={statusColor(record?.TrailStatus)}
                                />
                            </View>
                        </View>

                        {isExternal && (
                            <View style={globalStyles.card}>
                                <Text style={styles.section}>External Document Details</Text>

                                <View style={styles.infoGroup}>
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
                            </View>
                        )}

                        <View style={globalStyles.card}>
                            <Text style={styles.section}>System Dates</Text>

                            <View style={styles.infoGroup}>
                                <Info label="Created At" value={formatDate(record?.created_at)} />
                                <Info label="Last Updated" value={formatDate(record?.updated_at)} />
                                <Info
                                    label="Deadline"
                                    value={
                                        record?.Deadline
                                            ? formatDate(record?.Deadline)
                                            : '—'
                                    }
                                />
                            </View>
                        </View>

                        <View style={styles.qrContainer}>
                            <QRCodeScreen
                                value={record?.QRCODE}
                                size={200}
                                color={theme.colors.light.text}
                                backgroundColor="#FFFFFF"
                                quietZone={10}
                            />

                            <Text style={styles.qrLabel}>QR Code</Text>
                            <Text style={styles.qrValue}>{record?.QRCODE}</Text>
                        </View>

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
            <Text
                style={[
                    styles.value,
                    color ? { color, fontWeight: '700' } : null,
                ]}
                numberOfLines={2}
            >
                {value ?? '—'}
            </Text>
        </View>
    );
}

/* STYLES */
const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginHorizontal: 12,
        marginBottom: 16,
        elevation: 2,
    },

    qrContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },

    qrLabel: {
        marginTop: 10,
        fontSize: 12,
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    qrValue: {
        marginTop: 4,
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },

    sectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },

    section: {
        fontSize: 15,
        fontWeight: '700',
        color: '#222',
        marginBottom: 8,
    },

    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.light.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },

    editText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },

    infoGroup: {
        marginTop: 8,
    },

    infoRow: {
        marginBottom: 12,
    },

    label: {
        fontSize: 12,
        color: '#777',
        marginBottom: 2,
    },

    value: {
        fontSize: 14,
        fontWeight: '500',
        color: '#222',
        lineHeight: 20,
    },

    statusContainer: {
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
});
