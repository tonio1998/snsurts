import {
    SafeAreaView,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    View,
    Text,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    Image,
} from "react-native";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import Icon from "react-native-vector-icons/Ionicons";

import { globalStyles } from "../../theme/styles";
import CustomHomeHeader from "../../components/layout/CustomHomeHeader";
import { theme } from "../../theme";
import { CText } from "../../components/common/CText";
import { formatDate } from "../../utils/dateFormatter";
import { useFiscalYear } from "../../context/FiscalYearContext";
import UnauthorizedView from "../../components/UnauthorizedView";
import { useAccess } from "../../hooks/useAccess";
import { useAuth } from "../../context/AuthContext";

import {
    loadUsersFromCache,
    saveUsersToCache,
} from "../../utils/cache/usersCache";
import { handleApiError } from "../../utils/errorHandler";
import {getUsers} from "../../api/modules/userApi.ts";
import {FILE_BASE_URL} from "../../../env.ts";

const PAGE_SIZE = 50;

export default function EmployeeScreen({ navigation }) {
    const { fiscalYear } = useFiscalYear();
    const { user } = useAuth();
    const { hasRole } = useAccess();

    const [users, setUsers] = useState<any[]>([]);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [search, setSearch] = useState("");

    const loadingRef = useRef(false);
    const hasLoadedRef = useRef(false);

    const loadData = useCallback(
        async (force = false) => {
            if (!user?.id || loadingRef.current) return;

            loadingRef.current = true;
            setLoading(true);

            try {
                if (!force) {
                    const { data, date } = await loadUsersFromCache(
                        user.id,
                        fiscalYear
                    );
                    if (Array.isArray(data)) {
                        setUsers(data);
                        setLastUpdated(date);
                        return;
                    }
                }

                const fresh = await getUsers();
                const normalized = Array.isArray(fresh) ? fresh : [];
                setUsers(normalized);


                console.log(normalized)

                const savedAt = await saveUsersToCache(
                    user.id,
                    fiscalYear,
                    normalized
                );
                setLastUpdated(savedAt);
            } catch (err) {
                handleApiError(err);
            } finally {
                loadingRef.current = false;
                setLoading(false);
                setRefreshing(false);
            }
        },
        [user?.id, fiscalYear]
    );

    useEffect(() => {
        if (hasLoadedRef.current) return;
        hasLoadedRef.current = true;

        setSearch("");
        setVisibleCount(PAGE_SIZE);
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        if (loadingRef.current) return;
        setRefreshing(true);
        setVisibleCount(PAGE_SIZE);
        loadData(true);
    };

    const filteredUsers = useMemo(() => {
        let list = [...users];

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                u =>
                    u.name?.toLowerCase().includes(q) ||
                    u.email?.toLowerCase().includes(q)
            );
        }

        return list;
    }, [users, search]);

    const visibleUsers = useMemo(
        () => filteredUsers.slice(0, visibleCount),
        [filteredUsers, visibleCount]
    );

    const renderItem = useCallback(
        ({ item }) => (
            <TouchableOpacity
                activeOpacity={0.9}
                style={styles.card}
                onPress={() =>
                    navigation.navigate("UserDetails", {
                        userId: item.id,
                    })
                }
            >
                <View style={styles.row}>
                    <Image
                        source={
                            item?.avatar
                                ? { uri: `${FILE_BASE_URL}/${item.avatar}`, cache: 'force-cache' }
                                : item?.avatar
                                    ? { uri: item?.avatar, cache: 'force-cache' }
                                    : {
                                        uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                            item?.name || 'User'
                                        )}&background=random`,
                                        cache: 'force-cache'
                                    }
                        }
                        style={styles.avatar}
                    />

                    <View style={{ flex: 1 }}>
                        <CText fontStyle="SB" style={styles.name}>
                            {item.name}
                        </CText>

                        <CText style={styles.email}>
                            {item.email}
                        </CText>
                    </View>
                </View>

            </TouchableOpacity>
        ),
        [navigation]
    );

    if (hasRole("STUD")) {
        return <UnauthorizedView />;
    }

    return (
        <SafeAreaView style={globalStyles.safeArea}>
            <CustomHomeHeader />

            <View style={styles.container}>
                <View style={styles.searchBox}>
                    <Icon name="search" size={18} color="#8E8E93" />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search users"
                        style={styles.searchInput}
                        placeholderTextColor="#8E8E93"
                    />
                </View>

                {lastUpdated && (
                    <CText style={styles.lastUpdated}>
                        Last updated: {formatDate(lastUpdated)}
                    </CText>
                )}

                {loading && users.length === 0 ? (
                    <View style={styles.initialLoader}>
                        <ActivityIndicator
                            size="large"
                            color={theme.colors.light.primary}
                        />
                    </View>
                ) : (
                    <FlatList
                        data={visibleUsers}
                        keyExtractor={item => String(item.id)}
                        renderItem={renderItem}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                            />
                        }
                        onEndReachedThreshold={0.6}
                        contentContainerStyle={{ paddingBottom: 120 }}
                        ListEmptyComponent={
                            !loading && (
                                <View style={styles.empty}>
                                    <Icon
                                        name="people-outline"
                                        size={42}
                                        color="#ccc"
                                    />
                                    <Text style={styles.emptyText}>
                                        No users found
                                    </Text>
                                </View>
                            )
                        }
                    />
                )}
            </View>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate("AddUser")}
            >
                <Icon name="person-add" size={24} color="#fff" />
            </TouchableOpacity>
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
    searchInput: {
        flex: 1,
        marginHorizontal: 10,
        fontSize: 15,
        color: "#000",
    },

    card: {
        backgroundColor: theme.colors.light.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 12 },

    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: "#eee",
    },

    name: { fontSize: 15, textTransform: 'uppercase' },
    email: { fontSize: 12, color: "#666", marginTop: 2 },

    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 14,
    },

    date: { fontSize: 11, color: "#999" },

    badges: { flexDirection: "row", gap: 6 },

    badge: {
        flexDirection: "row",
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignItems: "center",
        gap: 4,
    },
    locked: { backgroundColor: "#E74C3C" },
    verified: { backgroundColor: "#27AE60" },
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

    initialLoader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    lastUpdated: {
        fontSize: 11,
        color: "#8E8E93",
        marginBottom: 8,
        marginLeft: 4,
    },
});
