import AsyncStorage from "@react-native-async-storage/async-storage";

const getCacheKeys = (fiscalYear: string | number) => ({
    DATA: `records_cache_${fiscalYear}`,
    DATE: `records_cache_date_${fiscalYear}`,
});

export const saveRecordsToCache = async (
    fiscalYear: string | number,
    data: any[]
) => {
    const { DATA, DATE } = getCacheKeys(fiscalYear);
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

export const loadRecordsFromCache = async (
    fiscalYear: string | number
) => {
    const { DATA, DATE } = getCacheKeys(fiscalYear);

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
