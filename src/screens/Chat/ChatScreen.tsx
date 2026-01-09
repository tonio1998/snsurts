import {
    SafeAreaView,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    View,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    Image,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import Icon from "react-native-vector-icons/Ionicons";

import { globalStyles } from "../../theme/styles";
import CustomHomeHeader from "../../components/layout/CustomHomeHeader";
import { theme } from "../../theme";
import { CText } from "../../components/common/CText";
import { formatDate } from "../../utils/dateFormatter";
import UnauthorizedView from "../../components/UnauthorizedView";
import { useAccess } from "../../hooks/useAccess";
import { useAuth } from "../../context/AuthContext";

import {
    getChat,
    loadChatListFromCache,
    saveChatListToCache,
} from "../../services/cache/chatListCache";
import { handleApiError } from "../../utils/errorHandler";
import { FILE_BASE_URL } from "../../../env";

export default function ChatScreen({ navigation }) {
    const { user } = useAuth();
    const { hasRole } = useAccess();

    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");

    const loadLocal = async () => {
        const cached = await loadChatListFromCache(user.id);
        if (cached.length) {
            setChats(cached);
            setLoading(false);
        }
    };

    const fetchFromServer = async () => {
        try {
            const response = await getChat();
            const list = Array.isArray(response) ? response : [];
            setChats(list);
            console.log(list);
            await saveChatListToCache(user.id, list);
            setLoading(false);
        } catch (e) {
            handleApiError(e);
        }
    };

    useEffect(() => {
        loadLocal();
        fetchFromServer();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchFromServer();
        setRefreshing(false);
    };

    const filtered = chats.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase())
    );

    const renderItem = useCallback(
        ({ item }) => (
            <TouchableOpacity
                activeOpacity={0.7}
                style={styles.chatRow}
                onPress={() =>
                    navigation.navigate("ChatRoom", {
                        id: item?.user_id,
                        item,
                    })
                }
            >
                <View style={styles.avatarWrap}>
                    <Image
                        source={
                            item.avatar
                                ? {
                                    uri: item.avatar,
                                }
                                : {
                                    uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                        item.name
                                    )}`,
                                }
                        }
                        style={styles.avatar}
                    />

                    {item.unread_count > 0 && (
                        <View style={styles.unreadBadge}>
                            <CText style={styles.unreadText}>
                                {item.unread_count}
                            </CText>
                        </View>
                    )}
                </View>

                <View style={styles.chatBody}>
                    <View style={styles.chatTop}>
                        <CText fontStyle="SB" style={styles.name}>
                            {item.name}
                        </CText>

                        <CText style={styles.time}>
                            {formatDate(item.last_message_at, 'relative')}
                        </CText>
                    </View>

                    <CText
                        numberOfLines={1}
                        style={[
                            styles.preview,
                            item.unread_count > 0 &&
                            styles.previewUnread,
                        ]}
                    >
                        {item.last_message ||
                            "Start a conversation"}
                    </CText>
                </View>
            </TouchableOpacity>
        ),
        [navigation]
    );

    if (hasRole("STUD")) {
        return <UnauthorizedView />;
    }

    return (
        <SafeAreaView style={[globalStyles.safeArea, {paddingTop: 0}]}>
            <View style={styles.container}>
                <View style={styles.searchBox}>
                    <Icon
                        name="search"
                        size={18}
                        color="#8E8E93"
                    />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search"
                        style={styles.searchInput}
                        placeholderTextColor="#8E8E93"
                    />
                </View>

                {loading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator
                            size="large"
                            color={
                                theme.colors.light.primary
                            }
                        />
                    </View>
                ) : (
                    <FlatList
                        data={filtered}
                        keyExtractor={item =>
                            String(item.user_id)
                        }
                        renderItem={renderItem}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Icon
                                    name="chatbubble-ellipses-outline"
                                    size={42}
                                    color="#ccc"
                                />
                                <CText style={styles.emptyText}>
                                    No conversations yet
                                </CText>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 12,
        paddingTop: 51,
        backgroundColor: "#fff",
    },

    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F1F1F5",
        borderRadius: 18,
        paddingHorizontal: 14,
        height: 44,
        marginBottom: 10,
    },

    searchInput: {
        flex: 1,
        marginHorizontal: 10,
        fontSize: 15,
        color: "#000",
    },

    chatRow: {
        flexDirection: "row",
        paddingVertical: 10,
        alignItems: "center",
    },

    avatarWrap: {
        marginRight: 12,
    },

    avatar: {
        width: 50,
        height: 50,
        borderRadius: 28,
        backgroundColor: "#eee",
    },

    unreadBadge: {
        position: "absolute",
        right: -2,
        bottom: -2,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: theme.colors.light.primary,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 5,
        borderWidth: 2,
        borderColor: "#fff",
    },

    unreadText: {
        fontSize: 11,
        color: "#fff",
        fontWeight: "600",
    },

    chatBody: {
        flex: 1,
        paddingBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#E5E5EA",
    },

    chatTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 2,
    },

    name: {
        fontSize: 14,
        color: "#111",
        textTransform: 'uppercase'
    },

    time: {
        fontSize: 11,
        color: "#8E8E93",
    },

    preview: {
        fontSize: 14,
        color: "#6E6E73",
    },

    previewUnread: {
        color: "#000",
        fontWeight: "600",
    },

    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    empty: {
        marginTop: 90,
        alignItems: "center",
    },

    emptyText: {
        marginTop: 12,
        color: "#999",
        fontSize: 14,
    },
});
