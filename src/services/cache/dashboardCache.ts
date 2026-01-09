import AsyncStorage from "@react-native-async-storage/async-storage";

const getCacheKeys = (userId: number | string, fiscalYear: string | number) => ({
    DATA: `dashboard_cache_${userId}_${fiscalYear}`,
    DATE: `dashboard_cache_date_${userId}_${fiscalYear}`,
});

export const saveDashboardToCache = async (
    userId: number | string,
    fiscalYear: string | number,
    data: any
) => {
    if (!userId) return null;

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

export const loadDashboardFromCache = async (
    userId: number | string,
    fiscalYear: string | number
) => {
    if (!userId) return { data: null, date: null };

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
