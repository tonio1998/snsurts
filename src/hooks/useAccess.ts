import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { can, hasAnyRole, hasRole } from '../utils/accessControl';
import { AppState } from 'react-native';

export const useAccess = () => {
    const [roles, setRoles] = useState<string[]>([]);
    const [permissions, setPermissions] = useState<string[]>([]);
    const lastLoadedRef = useRef<string>('');

    const loadAccess = useCallback(async () => {
        const storedRoles =
            JSON.parse((await AsyncStorage.getItem('roles')) || '[]');
        const storedPermissions =
            JSON.parse((await AsyncStorage.getItem('permissions')) || '[]');

        const snapshot = JSON.stringify({
            roles: storedRoles,
            permissions: storedPermissions,
        });

        if (snapshot === lastLoadedRef.current) return;

        lastLoadedRef.current = snapshot;
        setRoles(storedRoles);
        setPermissions(storedPermissions);
    }, []);

    useEffect(() => {
        loadAccess();

        const subscription = AppState.addEventListener('change', state => {
            if (state === 'active') {
                loadAccess();
            }
        });

        return () => subscription.remove();
    }, [loadAccess]);

    const hasRoleCb = useCallback(
        (r: string) => hasRole(roles, r),
        [roles]
    );

    const hasAnyRoleCb = useCallback(
        (r: string[]) => hasAnyRole(roles, r),
        [roles]
    );

    const canCb = useCallback(
        (p: string) => can(permissions, p),
        [permissions]
    );

    return {
        roles,
        permissions,
        hasRole: hasRoleCb,
        hasAnyRole: hasAnyRoleCb,
        can: canCb,
    };
};
