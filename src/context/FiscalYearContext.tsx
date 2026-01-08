import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FiscalYearContextType = {
    fiscalYear: string;
    setFiscalYear: (year: string) => Promise<void>;
    loading: boolean;
};

const FiscalYearContext = createContext<FiscalYearContextType | undefined>(
    undefined
);

export function FiscalYearProvider({ children }: { children: React.ReactNode }) {
    const [fiscalYear, setFiscalYearState] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let mounted = true;

        (async () => {
            const storedYear =
                (await AsyncStorage.getItem('FiscalYear')) ??
                String(new Date().getFullYear());

            if (mounted) {
                setFiscalYearState(storedYear);
                setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    const setFiscalYear = useCallback(async (year: string) => {
        await AsyncStorage.setItem('FiscalYear', year);
        setFiscalYearState(year);
    }, []);

    const value = useMemo(
        () => ({
            fiscalYear,
            setFiscalYear,
            loading,
        }),
        [fiscalYear, loading]
    );

    return (
        <FiscalYearContext.Provider value={value}>
            {children}
        </FiscalYearContext.Provider>
    );
}

export function useFiscalYear() {
    const context = useContext(FiscalYearContext);
    if (!context) {
        throw new Error('useFiscalYear must be used inside FiscalYearProvider');
    }
    return context;
}
