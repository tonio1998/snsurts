import {
    StyleSheet,
    View,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import Icon from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "../../theme";
import { CText } from "../../components/common/CText";
import { useAuth } from "../../context/AuthContext";
import UnauthorizedView from "../../components/UnauthorizedView";
import { useAccess } from "../../hooks/useAccess";
import { formatDate } from "../../utils/dateFormatter";
import {
    loadChatFromCache,
    saveChatToCache,
    appendChatMessage,
    ChatMessage,
    getChatMessages,
} from "../../services/cache/chatCache";
import api from "../../api/api";
import BackHeader from "../../components/layout/BackHeader.tsx";

export default function ChatRoom({ route }) {
    const item = route.params;
    const { user } = useAuth();
    const { hasRole } = useAccess();
    const insets = useSafeAreaInsets();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        const init = async () => {
            const cached = await loadChatFromCache(user.id, item?.id);

            if (cached.length) {
                setMessages(cached);
            }
            fetchFromServer();
        };
        init();
    }, []);

    const fetchFromServer = async () => {
        try {
            const response = await getChatMessages(item?.id);
            const serverMessages: ChatMessage[] = response || [];
            if (serverMessages.length) {
                setMessages(serverMessages);
                await saveChatToCache(
                    user.id,
                    item?.id,
                    serverMessages
                );
            }
        } catch {}
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchFromServer();
        setRefreshing(false);
    };

    const sendMessage = async () => {
        if (!message.trim()) return;

        const temp: ChatMessage = {
            id: `local-${Date.now()}`,
            sender_id: user.id,
            receiver_id: item?.id,
            message,
            is_read: 0,
            created_at: new Date().toISOString(),
            pending: true,
        };

        setMessages(prev => [...prev, temp]);
        await appendChatMessage(user.id, item?.id, temp);
        setMessage("");

        flatListRef.current?.scrollToEnd({ animated: true });

        try {
            const response = await api.post("/messages", {
                receiver_id: item?.id,
                message,
            });

            const saved: ChatMessage = response.data;
            const updated = [
                ...messages.filter(m => m.id !== temp.id),
                saved,
            ];
            setMessages(updated);
            await saveChatToCache(
                user.id,
                item?.id,
                updated
            );
        } catch {}
    };

    const renderItem = ({ item: msg }) => {
        const isMe = msg.sender_id === user.id;

        return (
            <View
                style={[
                    styles.row,
                    isMe ? styles.alignRight : styles.alignLeft,
                ]}
            >
                <View
                    style={[
                        styles.bubble,
                        isMe
                            ? styles.myBubble
                            : styles.otherBubble,
                        msg.pending && styles.pending,
                    ]}
                >
                    <CText
                        style={[
                            styles.text,
                            isMe && styles.myText,
                        ]}
                    >
                        {msg.message}
                    </CText>
                </View>

                <CText
                    style={[
                        styles.time,
                        isMe
                            ? styles.timeRight
                            : styles.timeLeft,
                    ]}
                >
                    {formatDate(msg.created_at)}
                </CText>
            </View>
        );
    };

    if (hasRole("STUD")) {
        return <UnauthorizedView />;
    }

    return (
        <>
            <BackHeader title={item?.item?.name} />
            <KeyboardAvoidingView
                style={{ flex: 1, backgroundColor: "#F6F6F8" }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={0}
            >
                <View style={{ flex: 1 }}>
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={item => String(item.id)}
                        renderItem={renderItem}
                        keyboardShouldPersistTaps="handled"
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                            />
                        }
                        contentContainerStyle={{
                            paddingTop: insets.top + 100,
                            paddingHorizontal: 14,
                            paddingBottom: 12,
                        }}
                        onContentSizeChange={() =>
                            flatListRef.current?.scrollToEnd({
                                animated: true,
                            })
                        }
                    />

                    <View
                        style={[
                            styles.inputBar,
                            { paddingBottom: insets.bottom || 10 },
                        ]}
                    >
                        <TextInput
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Message"
                            placeholderTextColor="#8E8E93"
                            style={styles.input}
                            multiline
                        />

                        <TouchableOpacity
                            activeOpacity={0.85}
                            disabled={!message.trim()}
                            onPress={sendMessage}
                            style={[
                                styles.sendBtn,
                                !message.trim() &&
                                styles.sendDisabled,
                            ]}
                        >
                            <Icon name="send" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    row: {
        marginBottom: 14,
        maxWidth: "100%",
    },

    alignLeft: {
        alignItems: "flex-start",
    },

    alignRight: {
        alignItems: "flex-end",
    },

    bubble: {
        maxWidth: "78%",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },

    myBubble: {
        backgroundColor: theme.colors.light.primary,
        borderTopRightRadius: 6,
    },

    otherBubble: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 6,
    },

    pending: {
        opacity: 0.6,
    },

    text: {
        fontSize: 14,
        color: "#111",
        lineHeight: 18,
    },

    myText: {
        color: "#fff",
    },

    time: {
        fontSize: 10,
        color: "#8E8E93",
        marginTop: 4,
    },

    timeLeft: {
        marginLeft: 6,
    },

    timeRight: {
        marginRight: 6,
    },

    inputBar: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 12,
        paddingTop: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "#E5E5EA",
        backgroundColor: "#fff",
    },

    input: {
        flex: 1,
        minHeight: 42,
        maxHeight: 120,
        backgroundColor: "#F2F2F7",
        borderRadius: 22,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: "#000",
    },

    sendBtn: {
        marginLeft: 8,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.light.primary,
        justifyContent: "center",
        alignItems: "center",
    },

    sendDisabled: {
        opacity: 0.45,
    },
});
