import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FiscalYearContextType = {
    fiscalYear: string;
    setFiscalYear: (year: string) => Promise<void>;
    loading: boolean;
};

const FiscalYearContext = createContext<FiscalYearContextType | undefined>(
    undefined
);

export function FiscalYearProvider({ children }) {
    const [fiscalYear, setFiscalYearState] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const storedYear =
                (await AsyncStorage.getItem('FiscalYear')) ??
                String(new Date().getFullYear());
            setFiscalYearState(storedYear);
            setLoading(false);
        })();
    }, []);

    const setFiscalYear = async (year: string) => {
        await AsyncStorage.setItem('FiscalYear', year);
        setFiscalYearState(year);
    };

    return (
        <FiscalYearContext.Provider
            value={{ fiscalYear, setFiscalYear, loading }}
        >
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
