import { createContext, useContext, useEffect, useState } from "react";
import { NetworkContext } from "./NetworkContext.tsx";
import {addToLogs} from "../api/modules/logsApi.ts";
import {handleApiError} from "../utils/errorHandler.ts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useAuth} from "./AuthContext.tsx";

const TrackingContext = createContext(null);

export const TrackingProvider = ({ children, qr_code }) => {
    const { user } = useAuth();
    const [record, setRecord] = useState(null);
    const [logs, setLogs] = useState(null);
    const [loading, setLoading] = useState(false);
    const network = useContext(NetworkContext);

    const storeRecentScan = async (qr_code) => {
        const key = 'recentScan' + user?.id;

        try {
            const existing = await AsyncStorage.getItem(key);
            let scanList;

            try {
                const parsed = existing ? JSON.parse(existing) : [];
                scanList = Array.isArray(parsed) ? parsed : [];
            } catch (parseError) {
                console.warn("Corrupted AsyncStorage data. Resetting.");
                scanList = [];
            }

            scanList = scanList.filter(code => code !== qr_code);

            scanList.unshift(qr_code);

            scanList = scanList.slice(0, 10);

            await AsyncStorage.setItem(key, JSON.stringify(scanList));
        } catch (e) {
            console.error("Error storing recent scan:", e);
        }
    };



    useEffect(() => {
        const fetchLogs = async () => {
            if (!network?.isOnline) return;
            try {
                setLoading(true);
                const response = await addToLogs(qr_code);
                if (!response) return;

                await storeRecentScan(qr_code)

                setRecord(response.record);
                setLogs(response.logs);
            } catch (err) {
                console.error('Error fetching logs:', err);
                handleApiError(err, 'Failed to fetch logs');
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [qr_code, network]);


    return (
        <TrackingContext.Provider value={{ record, logs, loading }}>
            {children}
        </TrackingContext.Provider>
    );
};

export const useTracking = () => useContext(TrackingContext);
