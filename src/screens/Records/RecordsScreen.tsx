import {
    SafeAreaView,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    View,
    Text, FlatList, RefreshControl,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { globalStyles } from "../../theme/styles.ts";
import CustomHeader from "../../components/layout/CustomHeader.tsx";
import { getRecords } from "../../api/modules/logsApi.ts";
import { ShimmerList } from "../../components/loaders/ShimmerList.tsx";
import Icon from "react-native-vector-icons/Ionicons";
import { theme } from "../../theme";
import { CText } from "../../components/common/CText.tsx";
import { formatDate } from "../../utils/dateFormatter";
import CButton from "../../components/buttons/CButton.tsx";
import { handleApiError } from "../../utils/errorHandler.ts";
import { useAuth } from "../../context/AuthContext.tsx";

export default function RecordsScreen({ navigation }) {
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const debounceTimeout = useRef(null);

    const fetch = async (pageNumber = 1, filters = {}) => {
        setLoading(true);
        try {
            const filter = {
                page: pageNumber,
                ...(filters.search !== undefined
                    ? { search: filters.search }
                    : searchQuery
                        ? { search: searchQuery }
                        : {}),
            };

            const res = await getRecords(filter);
            const List = res.data ?? [];
            const totalPages = res?.last_page ?? 1;

            setRecords(prev => (pageNumber === 1 ? List : [...prev, ...List]));
            setPage(pageNumber);
            setHasMore(pageNumber < totalPages);
        } catch (err) {
            console.error("🔥 Failed to fetch records:", err);
            handleApiError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetch(1);
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetch(1);
        setRefreshing(false);
    };

    const handleSearchTextChange = (text) => {
        setSearchQuery(text);
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            fetch(1, { search: text });
        }, 500);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        fetch(1);
    };

    const handleLoadMore = () => {
        if (hasMore && !loading) {
            fetch(page + 1);
        }
    };

    const renderItem = useCallback(({ item }) => {
        const qr_code = item.QRCODE;
        const connectedQR = item.ConnectQR;
        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ScanQRDetails', { qr_code })}
            >
                <CText fontStyle="SB" fontSize={14} style={styles.courseText} numberOfLines={2}>
                    {item.Description}
                </CText>
                <CText fontStyle="SB" fontSize={15} style={styles.sectionText}>
                    {item.QRCODE}
                </CText>

                <View style={styles.metaInfo}>
                    {item.location && (
                        <View>
                            <CText fontSize={12} style={styles.label}>Location</CText>
                            <CText fontSize={12} fontStyle="SB" style={[styles.value, {width: 200}]} numberOfLines={1}>
                                {item.location.UnitName}
                            </CText>
                        </View>
                    )}
                    {item.courier && (
                        <View>
                            <CText fontSize={12} style={styles.label}>Courier</CText>
                            <CText fontSize={12} fontStyle="SB" style={styles.value}>
                                {item.courier.name}
                            </CText>
                        </View>
                    )}
                </View>

                <View style={styles.metaBottom}>
                    <CText fontSize={12} style={styles.dateText}>
                        Created: {formatDate(item?.created_at, 'relative')}
                    </CText>

                    {connectedQR && connectedQR !== '0' && (
                        <CButton
                            title={connectedQR}
                            type="success"
                            icon="qr-code"
                            style={{ borderRadius: 8, padding: 5 }}
                            onPress={() => navigation.navigate('ScanQRDetails', { qr_code: connectedQR })}
                        />
                    )}
                </View>
            </TouchableOpacity>
        );
    }, [navigation]);

    return (
        <SafeAreaView style={globalStyles.safeArea}>
            <CustomHeader />
            <View style={styles.container}>
                <View style={styles.searchWrapper}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search records..."
                        placeholderTextColor="#666"
                        value={searchQuery}
                        onChangeText={handleSearchTextChange}
                        returnKeyType="search"
                    />
                    {searchQuery && (
                        <TouchableOpacity onPress={handleClearSearch} style={styles.clearBtn}>
                            <Icon name="close-circle" size={22} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>

                <FlatList
                    data={records}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                    onEndReachedThreshold={0.5}
                    onEndReached={handleLoadMore}
                    ListEmptyComponent={
                        !loading && (
                            <View style={{ paddingVertical: 30 }}>
                                <Text style={styles.emptyText}>No records found.</Text>
                            </View>
                        )
                    }
                />
            </View>

            <View style={styles.fab}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('AddRecord')}>
                    <Icon name="add" size={28} color="#fff" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        right: 18,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.light.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        zIndex: 999,
    },
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    searchWrapper: {
        position: 'relative',
        marginBottom: 15,
    },
    searchInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 18,
        fontSize: 16,
        color: '#000',
    },
    clearBtn: {
        position: 'absolute',
        right: 15,
        top: '50%',
        transform: [{ translateY: -11 }],
    },
    card: {
        backgroundColor: theme.colors.light.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: theme.colors.light.primary + '22',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
    },
    courseText: {
        textTransform: 'uppercase',
    },
    sectionText: {
        textTransform: 'uppercase',
        marginTop: 3,
    },
    metaInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    label: {
        color: '#777',
    },
    value: {
        color: '#333',
    },
    metaBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    dateText: {
        color: '#777',
        fontSize: 12,
    },
    emptyText: {
        textAlign: 'center',
        color: '#888',
        fontSize: 16,
    },
});
