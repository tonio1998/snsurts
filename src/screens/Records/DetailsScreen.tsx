import React, { useRef } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    Platform,
    KeyboardAvoidingView,
    StatusBar,
    Animated,
    TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { globalStyles as gstyle } from '../../theme/styles';
import { theme } from '../../theme';

import { useTracking } from '../../context/TrackingContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/dateFormatter';
import QRCodeScreen from '../../components/QRCodeScreen.tsx';
import {CText} from "../../components/common/CText.tsx";
import LoadingState from "../../components/LoadingState.tsx";

export default function DetailsScreen() {
    const navigation = useNavigation();
    const { record, loading, initialized } = useTracking();
    const { user } = useAuth();

    const scrollY = useRef(new Animated.Value(0)).current;

    const canEdit = record?.created_by === user?.id;
    const isExternal = record?.type === 0;
    const isUnit = record?.TransactBy === 1;

    console.log("record", record);

    const statusColor = (status?: string) => {
        switch (status) {
            case 'Incoming':
                return '#2f9e44';
            case 'Outgoing':
                return '#1c7ed6';
            case 'Return':
                return '#f08c00';
            case 'Done':
                return '#5f3dc4';
            default:
                return '#868e96';
        }
    };

    if (!initialized) {
        return (
            <LoadingState
                backgroundColor={theme.colors.light.primary}
                indicatorColor={theme.colors.light.primary}
                message="Loading..."
            />
        );
    }


    return (
        <>
            <StatusBar backgroundColor={theme.colors.light.primary} />

            <SafeAreaView style={[gstyle.safeArea, { paddingTop: 30 }]}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <Animated.ScrollView
                        contentContainerStyle={styles.container}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: false }
                        )}
                        scrollEventThrottle={16}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.hero}>
                            <QRCodeScreen
                                value={record?.QRCODE}
                                size={140}
                                color="#111"
                                backgroundColor="#fff"
                            />
                            <Text style={styles.heroCode}>{record?.QRCODE}</Text>

                            <View
                                style={[
                                    styles.statusBadge,
                                    { backgroundColor: `${statusColor(record?.TrailStatus)}22` },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.statusText,
                                        { color: statusColor(record?.TrailStatus) },
                                    ]}
                                >
                                    {record?.TrailStatus ?? '—'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Document Information</Text>

                                {canEdit && record?.tab === 'records' && (
                                    <TouchableOpacity
                                        onPress={() =>
                                            navigation.navigate('AddRecord', { info: record })
                                        }
                                    >
                                        <Icon
                                            name="create-outline"
                                            size={18}
                                            color={theme.colors.light.primary}
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>

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
                            {record?.ConnectQR && (
                                <Info label="Connected QR" value={record?.ConnectQR} />
                            )}
                        </View>

                        {isExternal && (
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>External Details</Text>

                                <Info label="Origin" value={record?.Origin} />
                                <Info
                                    label="Received"
                                    value={
                                        record?.DateTimeReceived
                                            ? formatDate(record?.DateTimeReceived)
                                            : '—'
                                    }
                                />
                                <Info
                                    label="Transaction Type"
                                    value={record?.TransactionType}
                                />
                                <Info label="Priority" value={record?.Priority} />
                            </View>
                        )}

                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>System Dates</Text>

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
                    </Animated.ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
}

function Info({ label, value }: { label: string; value?: any }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
                {value ?? '—'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: {
        backgroundColor: '#f5f6f8',
    },

    container: {
        padding: 16,
        paddingBottom: 32,
    },

    hero: {
        alignItems: 'center',
        marginBottom: 20,
    },

    heroCode: {
        marginTop: 10,
        fontSize: 14,
        fontWeight: '600',
        color: '#222',
    },

    statusBadge: {
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },

    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
    },

    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },

    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111',
        marginBottom: 8,
    },

    infoRow: {
        marginBottom: 10,
    },

    infoLabel: {
        fontSize: 11,
        color: '#777',
        marginBottom: 2,
    },

    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111',
    },
});
