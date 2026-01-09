import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../api/api.ts";

const PREFIX = "CHAT_LIST_";

export type ChatListItem = {
    user_id: number;
    name: string;
    avatar?: string;
    last_message: string;
    last_message_at: string;
    unread_count: number;
};

const getChatListKey = (userId: number) =>
    `${PREFIX}${userId}`;

export const loadChatListFromCache = async (
    userId: number
): Promise<ChatListItem[]> => {
    const key = getChatListKey(userId);
    const cached = await AsyncStorage.getItem(key);
    return cached ? JSON.parse(cached) : [];
};

export const saveChatListToCache = async (
    userId: number,
    list: ChatListItem[]
) => {
    const key = getChatListKey(userId);
    await AsyncStorage.setItem(key, JSON.stringify(list));
};

export const updateChatListItem = async (
    userId: number,
    item: ChatListItem
) => {
    const key = getChatListKey(userId);
    const cached = await AsyncStorage.getItem(key);
    const list: ChatListItem[] = cached ? JSON.parse(cached) : [];

    const index = list.findIndex(
        c => c.user_id === item.user_id
    );

    const updated =
        index >= 0
            ? [
                ...list.slice(0, index),
                item,
                ...list.slice(index + 1),
            ]
            : [item, ...list];

    await AsyncStorage.setItem(
        key,
        JSON.stringify(updated)
    );
};

export const clearChatListCache = async (
    userId: number
) => {
    const key = getChatListKey(userId);
    await AsyncStorage.removeItem(key);
};


export const getChat = async () => {
    const key = await api.get("/chats");
    return key.data;
};