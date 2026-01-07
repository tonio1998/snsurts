import {
    SafeAreaView,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    View,
    Text,
    FlatList,
    RefreshControl,
    Platform,
    ActivityIndicator,
} from "react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "react-native-vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";

import { globalStyles } from "../../theme/styles";
import CustomHomeHeader from "../../components/layout/CustomHomeHeader";
import { theme } from "../../theme";
import { CText } from "../../components/common/CText";
import { formatDate } from "../../utils/dateFormatter";
import { useCachedList } from "../../utils/cache/useCachedList";
import { useFiscalYear } from "../../context/FiscalYearContext";
import { getRecords } from "../../api/modules/logsApi";
import IosBottomSheet from "../../components/modals/IosBottomSheet";

export default function RecordsScreen({ navigation }) {
    const { fiscalYear } = useFiscalYear();

    const [search, setSearch] = useState("");
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [linkedFilter, setLinkedFilter] = useState<null | boolean>(null);
    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [toDate, setToDate] = useState<Date | null>(null);
    const [dateType, setDateType] = useState<"from" | "to" | null>(null);

    const {
        fullData,
        visibleCount,
        loadMore,
        hasMore,
        loading,
        refreshing,
        refresh,
        lastFetchedAt,
    } = useCachedList({
        cacheKey: "records_cache",
        fiscalYear,
        fetchFn: getRecords,
    });

    useEffect(() => {
        setSearch("");
        setLinkedFilter(null);
        setFromDate(null);
        setToDate(null);
    }, [fiscalYear]);

    const filteredRecords = useMemo(() => {
        let data = [...fullData];

        if (search.trim()) {
            const k = search.toLowerCase();
            data = data.filter(item =>
                item.Description?.toLowerCase().includes(k) ||
                item.QRCODE?.toLowerCase().includes(k) ||
                item.ConnectQR?.toLowerCase().includes(k)
            );
        }

        if (linkedFilter !== null) {
            data = data.filter(item =>
                linkedFilter
                    ? item.ConnectQR && item.ConnectQR !== "0"
                    : !item.ConnectQR || item.ConnectQR === "0"
            );
        }

        if (fromDate) {
            data = data.filter(
                item => new Date(item.created_at) >= fromDate
            );
        }

        if (toDate) {
            data = data.filter(
                item => new Date(item.created_at) <= toDate
            );
        }

        return data;
    }, [fullData, search, linkedFilter, fromDate, toDate]);

    const visibleRecords = useMemo(() => {
        return filteredRecords.slice(0, visibleCount);
    }, [filteredRecords, visibleCount]);

    const renderItem = useCallback(({ item }) => (
        <TouchableOpacity
            activeOpacity={0.9}
            style={styles.card}
            onPress={() =>
                navigation.navigate("ScanQRDetails", {
                    qr_code: item.QRCODE,
                })
            }
        >
            <CText fontStyle="SB" style={styles.title}>
                {item.Description}
            </CText>

            <CText style={styles.qr}>
                QR: {item.QRCODE}
            </CText>

            <View style={styles.footer}>
                <CText style={styles.date}>
                    {formatDate(item.created_at)}
                </CText>

                {item.ConnectQR && item.ConnectQR !== "0" && (
                    <View style={styles.badge}>
                        <Icon name="link" size={12} color="#fff" />
                        <Text style={styles.badgeText}>Linked</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    ), [navigation]);

    return (
        <SafeAreaView style={globalStyles.safeArea}>
            <CustomHomeHeader />

            <View style={styles.container}>
                <View style={styles.searchBox}>
                    <Icon name="search" size={18} color="#8E8E93" />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search records"
                        style={styles.searchInput}
                        placeholderTextColor="#8E8E93"
                    />
                    <TouchableOpacity onPress={() => setShowAdvanced(true)}>
                        <Icon name="options-outline" size={20} color="#8E8E93" />
                    </TouchableOpacity>
                </View>

                {lastFetchedAt && (
                    <CText style={styles.lastUpdated}>
                        Last updated: {formatDate(lastFetchedAt)}
                    </CText>
                )}

                {loading && fullData.length === 0 ? (
                    <View style={styles.initialLoader}>
                        <ActivityIndicator size="large" color={theme.colors.light.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={visibleRecords}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingBottom: 120 }}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={refresh}
                            />
                        }
                        onEndReached={() => {
                            if (hasMore && !loading) {
                                loadMore();
                            }
                        }}
                        onEndReachedThreshold={0.3}
                        ListEmptyComponent={
                            !loading && (
                                <View style={styles.empty}>
                                    <Icon
                                        name="document-text-outline"
                                        size={42}
                                        color="#ccc"
                                    />
                                    <Text style={styles.emptyText}>
                                        No records found
                                    </Text>
                                </View>
                            )
                        }
                    />
                )}
            </View>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate("AddRecord")}
            >
                <Icon name="add" size={26} color="#fff" />
            </TouchableOpacity>

            <IosBottomSheet
                visible={showAdvanced}
                title="Filter Records"
                onClose={() => setShowAdvanced(false)}
            >
                <CText style={styles.sectionLabel}>Linked QR</CText>

                <View style={styles.segment}>
                    {[{ label: "All", value: null }, { label: "Linked", value: true }, { label: "Unlinked", value: false }].map(opt => (
                        <TouchableOpacity
                            key={String(opt.value)}
                            style={[
                                styles.segmentItem,
                                linkedFilter === opt.value && styles.segmentActive,
                            ]}
                            onPress={() => setLinkedFilter(opt.value)}
                        >
                            <CText>{opt.label}</CText>
                        </TouchableOpacity>
                    ))}
                </View>

                <CText style={styles.sectionLabel}>Date Range</CText>

                <View style={styles.dateRow}>
                    <TouchableOpacity
                        style={styles.dateBox}
                        onPress={() => setDateType("from")}
                    >
                        <CText>
                            {fromDate ? formatDate(fromDate, 'date') : "From"}
                        </CText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.dateBox}
                        onPress={() => setDateType("to")}
                    >
                        <CText>
                            {toDate ? formatDate(toDate, 'date') : "To"}
                        </CText>
                    </TouchableOpacity>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.resetBtn}
                        onPress={() => {
                            setLinkedFilter(null);
                            setFromDate(null);
                            setToDate(null);
                        }}
                    >
                        <CText>Reset</CText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.applyBtn}
                        onPress={() => setShowAdvanced(false)}
                    >
                        <CText style={{ color: "#fff" }}>Apply</CText>
                    </TouchableOpacity>
                </View>
            </IosBottomSheet>

            {dateType && (
                <DateTimePicker
                    value={new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(_, date) => {
                        if (dateType === "from") setFromDate(date || null);
                        if (dateType === "to") setToDate(date || null);
                        setDateType(null);
                    }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 14, paddingTop: 10 },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.light.card,
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 46,
        marginBottom: 14,
    },
    searchInput: { flex: 1, marginHorizontal: 10, fontSize: 15, color: "#000" },
    card: {
        backgroundColor: theme.colors.light.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    title: { fontSize: 15, marginBottom: 4 },
    qr: { fontSize: 12, color: "#666" },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 12,
    },
    date: { fontSize: 11, color: "#999" },
    badge: {
        flexDirection: "row",
        backgroundColor: theme.colors.light.primary,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignItems: "center",
        gap: 4,
    },
    badgeText: { color: "#fff", fontSize: 11 },
    fab: {
        position: "absolute",
        right: 18,
        bottom: 18,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.light.primary,
        justifyContent: "center",
        alignItems: "center",
        elevation: 6,
    },
    empty: { alignItems: "center", marginTop: 60 },
    emptyText: { marginTop: 10, color: "#999" },
    initialLoader: { flex: 1, justifyContent: "center", alignItems: "center" },
    sectionLabel: { fontSize: 13, color: "#888", marginBottom: 8 },
    segment: {
        flexDirection: "row",
        backgroundColor: "#F2F2F7",
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    segmentItem: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
    segmentActive: { backgroundColor: "#fff", elevation: 2 },
    dateRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
    dateBox: {
        flex: 1,
        backgroundColor: "#F2F2F7",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    actionRow: { flexDirection: "row", gap: 12 },
    resetBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: "#F2F2F7",
        alignItems: "center",
    },
    applyBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: theme.colors.light.primary,
        alignItems: "center",
    },
    lastUpdated: {
        fontSize: 11,
        color: "#8E8E93",
        marginBottom: 8,
        marginLeft: 4,
    },
});
