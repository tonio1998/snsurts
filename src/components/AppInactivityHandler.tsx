
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus, TouchableWithoutFeedback } from "react-native";
import { CommonActions } from "@react-navigation/native";
import {navigationRef} from "../utils/navigation.ts";

const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes

let logoutTimer: NodeJS.Timeout | null = null;

export const resetInactivityTimer = () => {
    if (logoutTimer) clearTimeout(logoutTimer);
    logoutTimer = setTimeout(() => {
        navigationRef.current?.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: "Login" }],
            })
        );
    }, INACTIVITY_LIMIT);
};

export function InactivityProvider({ children }: { children: React.ReactNode }) {
    const appState = useRef<AppStateStatus>(AppState.currentState);

    useEffect(() => {
        resetInactivityTimer();

        const subscription = AppState.addEventListener("change", (nextAppState) => {
            if (appState.current.match(/inactive|background/) && nextAppState === "active") {
                resetInactivityTimer();
            }
            appState.current = nextAppState;
        });

        return () => subscription.remove();
    }, []);

    return (
        <TouchableWithoutFeedback onPress={resetInactivityTimer}>
            {children}
        </TouchableWithoutFeedback>
    );
}
