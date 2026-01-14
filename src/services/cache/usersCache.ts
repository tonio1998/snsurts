import AsyncStorage from "@react-native-async-storage/async-storage";

const USERS_CACHE_PREFIX = "users_cache";

const getKey = (userId: number) =>
    `${USERS_CACHE_PREFIX}:${userId}`;

export const loadUsersFromCache = async (
    userId: number,
): Promise<{ data: any[] | null; date: Date | null }> => {
    try {
        const key = getKey(userId);
        const raw = await AsyncStorage.getItem(key);

        if (!raw) {
            return { data: null, date: null };
        }

        const parsed = JSON.parse(raw);

        return {
            data: parsed.data ?? null,
            date: parsed.date ? new Date(parsed.date) : null,
        };
    } catch {
        return { data: null, date: null };
    }
};

export const saveUsersToCache = async (
    userId: number,
    users: any[]
): Promise<Date> => {
    const key = getKey(userId);
    const now = new Date();

    await AsyncStorage.setItem(
        key,
        JSON.stringify({
            data: users,
            date: now.toISOString(),
        })
    );

    return now;
};

export const clearUsersCache = async (
    userId: number,
) => {
    const key = getKey(userId);
    await AsyncStorage.removeItem(key);
};
