import { useEffect, useRef, useState } from "react";

const PAGE_SIZE = 30;

export function useCachedList({
                                  cacheKey,
                                  fiscalYear,
                                  fetchFn,
                              }) {
    const cacheRef = useRef<any[] | null>(null);
    const fullDataRef = useRef<any[]>([]);

    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

    const fetchData = async (force = false) => {
        if (cacheRef.current && !force) {
            return cacheRef.current;
        }

        setLoading(true);

        const result = await fetchFn({ fiscalYear });

        cacheRef.current = result;
        fullDataRef.current = result;
        setLastFetchedAt(new Date());

        setLoading(false);
        setRefreshing(false);

        return result;
    };

    const refresh = async () => {
        cacheRef.current = null;
        fullDataRef.current = [];
        setVisibleCount(PAGE_SIZE);
        setRefreshing(true);
        await fetchData(true);
    };

    const loadMore = () => {
        setVisibleCount(prev => prev + PAGE_SIZE);
    };

    useEffect(() => {
        cacheRef.current = null;
        fullDataRef.current = [];
        setVisibleCount(PAGE_SIZE);
        fetchData(true);
    }, [fiscalYear]);

    return {
        fullData: fullDataRef.current,
        visibleCount,
        loadMore,
        hasMore: visibleCount < fullDataRef.current.length,
        loading,
        refreshing,
        refresh,
        lastFetchedAt,
    };
}
