import AsyncStorage from "@react-native-async-storage/async-storage";

const getCacheKeys = (userId: number, fiscalYear: string | number) => ({
    DATA: `records_cache_${userId}_${fiscalYear}`,
    DATE: `records_cache_date_${userId}_${fiscalYear}`,
});

export const saveRecordsToCache = async (
    userId: number,
    fiscalYear: string | number,
    data: any[]
) => {
    const { DATA, DATE } = getCacheKeys(userId, fiscalYear);
    const now = new Date();

    try {
        await AsyncStorage.multiSet([
            [DATA, JSON.stringify(data)],
            [DATE, now.toISOString()],
        ]);
        return now;
    } catch {
        return null;
    }
};

export const saveRecordToCache = async (
    userId: number,
    fiscalYear: string | number,
    data: any
) => {
    const { DATA, DATE } = getCacheKeys(userId, fiscalYear);
    const now = new Date();

    try {
        const existing = await AsyncStorage.getItem(DATA);
        const parsed = existing ? JSON.parse(existing) : [];
        const updated = Array.isArray(parsed) ? [...parsed, data] : [data];

        await AsyncStorage.multiSet([
            [DATA, JSON.stringify(updated)],
            [DATE, now.toISOString()],
        ]);

        return now;
    } catch {
        return null;
    }
};

export const loadRecordsFromCache = async (
    userId: number,
    fiscalYear: string | number
) => {
    const { DATA, DATE } = getCacheKeys(userId, fiscalYear);

    try {
        const [[, dataStr], [, dateStr]] = await AsyncStorage.multiGet([
            DATA,
            DATE,
        ]);

        return {
            data: dataStr ? JSON.parse(dataStr) : null,
            date: dateStr ? new Date(dateStr) : null,
        };
    } catch {
        return { data: null, date: null };
    }
};
