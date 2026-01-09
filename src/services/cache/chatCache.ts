import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../api/api.ts";

const PREFIX = "CHAT_MESSAGES_";

export type ChatMessage = {
    id: number | string;
    sender_id: number;
    receiver_id: number;
    message: string;
    is_read: number;
    created_at: string;
    updated_at?: string;
    pending?: boolean;
};

const getChatCacheKey = (userId: number, peerId: number) =>
    `${PREFIX}${userId}_${peerId}`;



export const loadChatFromCache = async (
    userId: number,
    peerId: number
): Promise<ChatMessage[]> => {
    const key = getChatCacheKey(userId, peerId);
    const cached = await AsyncStorage.getItem(key);
    return cached ? JSON.parse(cached) : [];
};

export const saveChatToCache = async (
    userId: number,
    peerId: number,
    messages: ChatMessage[]
) => {
    const key = getChatCacheKey(userId, peerId);
    await AsyncStorage.setItem(key, JSON.stringify(messages));
};

export const appendChatMessage = async (
    userId: number,
    peerId: number,
    message: ChatMessage
) => {
    const key = getChatCacheKey(userId, peerId);
    const cached = await AsyncStorage.getItem(key);
    const existing: ChatMessage[] = cached ? JSON.parse(cached) : [];
    const updated = [...existing, message];
    await AsyncStorage.setItem(key, JSON.stringify(updated));
};

export const replaceChatMessage = async (
    userId: number,
    peerId: number,
    tempId: string,
    newMessage: ChatMessage
) => {
    const key = getChatCacheKey(userId, peerId);
    const cached = await AsyncStorage.getItem(key);
    const existing: ChatMessage[] = cached ? JSON.parse(cached) : [];
    const updated = existing.map(m =>
        m.id === tempId ? newMessage : m
    );
    await AsyncStorage.setItem(key, JSON.stringify(updated));
};

export const markChatAsRead = async (
    userId: number,
    peerId: number
) => {
    const key = getChatCacheKey(userId, peerId);
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return;
    const messages: ChatMessage[] = JSON.parse(cached);
    const updated = messages.map(m => ({
        ...m,
        is_read: 1,
    }));
    await AsyncStorage.setItem(key, JSON.stringify(updated));
};

export const clearChatCache = async (
    userId: number,
    peerId: number
) => {
    const key = getChatCacheKey(userId, peerId);
    await AsyncStorage.removeItem(key);
};


export const getChatMessages = async (peerId: number) => {
    const key = await api.get("/messages", {
        params: {
            receiver_id: peerId,
        },
    });
    return key.data;
};