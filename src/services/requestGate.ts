const inflight = new Map<string, Promise<any>>();
const completed = new Set<string>();

export const runOnce = <T>(
    key: string,
    fn: () => Promise<T>
): Promise<T> => {
    if (completed.has(key)) {
        return Promise.resolve(undefined as T);
    }

    if (inflight.has(key)) {
        return inflight.get(key) as Promise<T>;
    }

    const promise = fn()
        .then(result => {
            completed.add(key);
            return result;
        })
        .finally(() => {
            inflight.delete(key);
        });

    inflight.set(key, promise);
    return promise;
};

export const resetRequest = (key: string) => {
    completed.delete(key);
};
