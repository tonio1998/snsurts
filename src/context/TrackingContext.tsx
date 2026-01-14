import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NetworkContext } from './NetworkContext';
import { useAuth } from './AuthContext';
import { useFiscalYear } from './FiscalYearContext';
import { addToLogs } from '../api/modules/logsApi';
import { handleApiError } from '../utils/errorHandler';
import {
    loadRecordsFromCache,
    saveRecordToCache,
} from '../services/cache/recordsCache';

type TrackingContextType = {
    record: any;
    logs: any;
    loading: boolean;
    lastUpdated: Date | null;
    initialized: boolean;
    refresh: () => Promise<void>;
};

const TrackingContext = createContext<TrackingContextType | null>(null);

export const TrackingProvider = ({ children, qr_code }) => {
    const { user } = useAuth();
    const { fiscalYear } = useFiscalYear();
    const network = useContext(NetworkContext);

    const [record, setRecord] = useState<any>(null);
    const [logs, setLogs] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [initialized, setInitialized] = useState(false);

    const isFetchingRef = useRef(false);

    const storeRecentScan = async (qr: string) => {
        if (!user?.id) return;

        const key = `recentScan_${user.id}`;
        try {
            const existing = await AsyncStorage.getItem(key);
            const parsed = existing ? JSON.parse(existing) : [];
            const list = Array.isArray(parsed)
                ? parsed.filter(code => code !== qr)
                : [];
            list.unshift(qr);
            await AsyncStorage.setItem(key, JSON.stringify(list.slice(0, 10)));
        } catch {}
    };

    const loadFromLocal = async () => {
        if (!user?.id || !qr_code) return false;

        const { data, date } = await loadRecordsFromCache(
            user.id,
            fiscalYear
        );

        if (!Array.isArray(data)) return false;

        const found = data.find(r => r.QRCODE === qr_code);
        if (!found) return false;

        setRecord(found);
        setLogs(found.logs ?? null);
        setLastUpdated(date);

        return true;
    };

    const fetchFromApi = async () => {
        if (!network?.isOnline || !qr_code || !user?.id) return;
        if (isFetchingRef.current) return;

        try {
            isFetchingRef.current = true;
            setLoading(true);

            const response = await addToLogs(qr_code);
            if (!response) return;

            setRecord(response.record);
            setLogs(response.logs);

            await storeRecentScan(qr_code);
            await saveRecordToCache(
                user.id,
                fiscalYear,
                response.record
            );

            setLastUpdated(new Date());
        } catch (err) {
            handleApiError(err, 'Failed to refresh logs');
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    };

    useEffect(() => {
        if (!qr_code || !user?.id) return;

        let mounted = true;

        const init = async () => {
            await loadFromLocal();
            if (mounted) setInitialized(true);
        };

        init();

        return () => {
            mounted = false;
        };
    }, [qr_code, fiscalYear, user?.id]);

    return (
        <TrackingContext.Provider
            value={{
                record,
                logs,
                loading,
                lastUpdated,
                initialized,
                refresh: fetchFromApi,
            }}
        >
            {children}
        </TrackingContext.Provider>
    );
};

export const useTracking = () => {
    const ctx = useContext(TrackingContext);
    if (!ctx) {
        throw new Error('useTracking must be used within TrackingProvider');
    }
    return ctx;
};
