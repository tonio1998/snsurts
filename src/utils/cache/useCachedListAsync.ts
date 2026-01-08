import { useEffect, useRef, useState } from "react";
import {
    loadRecordsFromCache,
    saveRecordsToCache,
} from "./recordsCache";

const PAGE_SIZE = 30;

export function useCachedListAsync({
                                       fiscalYear,
                                       fetchFn,
                                   }) {
    const fullDataRef = useRef<any[]>([]);

    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

    const loadData = async (force = false) => {
        setLoading(true);

        if (!force) {
            const { data, date } = await loadRecordsFromCache(fiscalYear);
            if (data) {
                fullDataRef.current = data;
                setLastFetchedAt(date);
                setLoading(false);
                return;
            }
        }

        const fresh = await fetchFn({ fiscalYear });
        fullDataRef.current = fresh;
        setLastFetchedAt(await saveRecordsToCache(fiscalYear, fresh));

        setLoading(false);
        setRefreshing(false);
    };

    const refresh = async () => {
        setRefreshing(true);
        setVisibleCount(PAGE_SIZE);
        await loadData(true);
    };

    const loadMore = () => {
        setVisibleCount(prev => prev + PAGE_SIZE);
    };

    useEffect(() => {
        fullDataRef.current = [];
        setVisibleCount(PAGE_SIZE);
        loadData();
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
