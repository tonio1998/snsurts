import AsyncStorage from '@react-native-async-storage/async-storage';

const getTrackingCacheKey = (userId: number | string, transactionId: number | string) => ({
    DATA: `tracking_history_${userId}_${transactionId}`,
    DATE: `tracking_history_date_${userId}_${transactionId}`,
});

export const loadTrackingHistoryFromCache = async (
    userId: number | string,
    transactionId: number | string
) => {
    try {
        const { DATA, DATE } = getTrackingCacheKey(userId, transactionId);

        const rawData = await AsyncStorage.getItem(DATA);
        const rawDate = await AsyncStorage.getItem(DATE);

        if (!rawData) return null;

        return JSON.parse(rawData);
    } catch {
        return null;
    }
};

export const saveTrackingHistoryToCache = async (
    userId: number | string,
    transactionId: number | string,
    data: any[]
) => {
    try {
        const { DATA, DATE } = getTrackingCacheKey(userId, transactionId);

        await AsyncStorage.setItem(DATA, JSON.stringify(data));
        await AsyncStorage.setItem(DATE, new Date().toISOString());

        return new Date();
    } catch {
        return null;
    }
};
