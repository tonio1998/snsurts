import React, { useCallback, useEffect, useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    StyleSheet,
    Platform,
    ActivityIndicator,
    KeyboardAvoidingView,
    RefreshControl, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { CText } from '../../components/common/CText';
import BackHeader from '../../components/layout/BackHeader.tsx';

import { globalStyles as gstyle } from '../../theme/styles.ts';
import { theme } from '../../theme';

import { useTracking } from '../../context/TrackingContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { getTrackingHistory } from '../../api/modules/logsApi.ts';
import { handleApiError } from '../../utils/errorHandler.ts';
import {formatDate} from "../../utils/dateFormatter";

export default function HistoryScreen() {
    const navigation = useNavigation();
    const { record } = useTracking();
    const { user } = useAuth();

    const TransactionID = record?.id;
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        if (!user?.id || !TransactionID) return;
        setLoading(true);

        try {
            const res = await getTrackingHistory({ page: 1, TransactionID });
            console.log('res: ', res.current?.data);
            setHistory(res.current?.data || []);
        } catch (err) {
            console.error('Error fetching history:', err);
            handleApiError(err, 'Unable to load tracking history.');
        } finally {
            setLoading(false);
        }
    }, [user?.id, TransactionID]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const getTrailDescription = (status, locationUnit, destinationUnit, name) => {
        switch (status) {
            case 'Incoming': return `Arrived at ${locationUnit}.`;
            case 'Outgoing': return `Sent to ${destinationUnit}.`;
            case 'Return': return `Returned to ${destinationUnit}.`;
            case 'Done': return `Final destination: ${destinationUnit}.`;
            case 'Open': return `Tracking process reopened.`;
            default: return `Created by ${name}.`;
        }
    };

    const renderTrailDetails = (status, courier, user) => {
        if (status === 'Incoming' || status === 'Outgoing') {
            return (
                <View style={styles.detailsRow}>
                    {courier && (
                        <View>
                            <CText style={styles.label}>Courier</CText>
                            <Text style={styles.uppercase}>{courier}</Text>
                        </View>
                    )}
                    {user && (
                        <View>
                            <CText style={styles.label}>
                                {status === 'Incoming' ? 'Received By' : 'Released By'}
                            </CText>
                            <Text style={styles.uppercase}>{user}</Text>
                        </View>
                    )}
                </View>
            );
        }
        return null;
    };

    const renderItem = (item, index) => (
        <View key={item.RecordDetailID || `log-${index}`} style={styles.timelineItem}>
            <View style={styles.iconWrapper}>
                <Icon
                    name={index === 0 ? 'radio-button-on' : 'checkmark-circle'}
                    size={24}
                    color={index === 0 ? theme.colors.light.primary : '#6c757d'}
                />
                {index < history.length - 1 && <View style={styles.verticalLine} />}
            </View>
            <View style={styles.timelineContent}>
                <Text style={styles.date}>{formatDate(item.CreatedAt, 'relative')}</Text>
                <Text style={[styles.status, index === 0 && styles.highlight]}>
                    {getTrailDescription(item.TrailStatus, item.LocationUnit, item.DestinationUnit, item.UserName)}
                </Text>
                {renderTrailDetails(item.TrailStatus, item.CourierName, item.UserName)}
                {item.comments && (
                    <Text style={styles.comment}>🗨️ {item.comments}</Text>
                )}
            </View>
        </View>
    );

    return (
        <>
            <StatusBar backgroundColor="#00A859" barStyle="dark-content" translucent={false} />
            <SafeAreaView style={[gstyle.safeArea, {paddingTop: 50}]}>
                {/*<BackHeader title="History" />*/}
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                >
                    <ScrollView
                        contentContainerStyle={styles.container}
                        refreshControl={
                            <RefreshControl refreshing={loading} onRefresh={fetchHistory} />
                        }
                    >
                        {loading ? (
                            <View style={gstyle.textcenter}>
                                <ActivityIndicator size="large" color={theme.colors.light.primary} />
                                <Text style={styles.loadingText}>Loading history...</Text>
                            </View>
                        ) : history.length ? (
                            history.map(renderItem)
                        ) : (
                            <View style={gstyle.textcenter}>
                                <Text style={styles.noData}>No tracking history available.</Text>
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 100,
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
        marginBottom: 4,
    },
    status: {
        fontSize: 15,
        color: '#333',
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
    uppercase: {
        textTransform: 'uppercase',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    label: {
        fontSize: 12,
        color: '#666',
    },
    noData: {
        fontSize: 16,
        color: '#aaa',
        marginTop: 24,
    },
    loadingText: {
        marginTop: 12,
        color: '#777',
    },
});
