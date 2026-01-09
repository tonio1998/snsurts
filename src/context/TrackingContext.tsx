import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { NetworkContext } from "./NetworkContext";
import { useAuth } from "./AuthContext";
import { useFiscalYear } from "./FiscalYearContext";
import { addToLogs } from "../api/modules/logsApi";
import { handleApiError } from "../utils/errorHandler";
import { loadRecordsFromCache } from "../services/cache/recordsCache";

const TrackingContext = createContext(null);

export const TrackingProvider = ({ children, qr_code }) => {
    const { user } = useAuth();
    const { fiscalYear } = useFiscalYear();
    const network = useContext(NetworkContext);

    const [record, setRecord] = useState(null);
    const [logs, setLogs] = useState(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
            await AsyncStorage.setItem(
                key,
                JSON.stringify(list.slice(0, 10))
            );
        } catch (e) {
            console.error("Error storing recent scan:", e);
        }
    };

    const loadFromLocalRecords = async () => {
        if (!qr_code) return false;

        try {
            const { data, date } = await loadRecordsFromCache(fiscalYear);
            if (!data) return false;

            const found = data.find(
                (r: any) => r.QRCODE === qr_code
            );

            if (!found) return false;

            setRecord(found);
            setLogs(found.logs ?? null);
            setLastUpdated(date);

            return true;
        } catch {
            return false;
        }
    };


    const fetchFromApi = async () => {
        if (!network?.isOnline) return;

        try {
            setLoading(true);

            const response = await addToLogs(qr_code);
            if (!response) return;

            setRecord(response.record);
            setLogs(response.logs);

            await storeRecentScan(qr_code);
        } catch (err) {
            handleApiError(err, "Failed to fetch logs");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if (!qr_code) return;

        const init = async () => {
            await loadFromLocalRecords();
            fetchFromApi();
        };

        init();
    }, [qr_code, fiscalYear, network?.isOnline]);

    return (
        <TrackingContext.Provider
            value={{
                record,
                logs,
                loading,
                lastUpdated,
            }}
        >
            {children}
        </TrackingContext.Provider>
    );
};

export const useTracking = () => useContext(TrackingContext);
