import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "RECORD_ATTACHMENTS_";

const getKey = (recordId: number) =>
    `${PREFIX}${recordId}`;

export const loadAttachmentsFromCache = async (
    recordId: number
) => {
    const cached = await AsyncStorage.getItem(getKey(recordId));
    return cached ? JSON.parse(cached) : [];
};

export const saveAttachmentsToCache = async (
    recordId: number,
    data: any[]
) => {
    await AsyncStorage.setItem(
        getKey(recordId),
        JSON.stringify(data)
    );
};

export const clearAttachmentsCache = async (
    recordId: number
) => {
    await AsyncStorage.removeItem(getKey(recordId));
};
