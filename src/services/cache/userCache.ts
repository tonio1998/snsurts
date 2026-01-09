import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "USER_DETAILS_";

export const getUserCacheKey = (id: number) => `${PREFIX}${id}`;

export const loadUserFromCache = async (id: number) => {
    const key = getUserCacheKey(id);
    const cached = await AsyncStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
};

export const saveUserToCache = async (id: number, data: any) => {
    const key = getUserCacheKey(id);
    await AsyncStorage.setItem(key, JSON.stringify(data));
};

export const clearUserCache = async (id: number) => {
    const key = getUserCacheKey(id);
    await AsyncStorage.removeItem(key);
};
