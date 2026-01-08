import React, {
    createContext,
    useEffect,
    useState,
    useContext,
    useCallback,
    useMemo,
    useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userAccessUpdate } from '../api/modules/userApi';
import { useAuth } from './AuthContext';

type AccessContextType = {
    roles: string[];
    permissions: string[];
    can: (perm: string) => boolean;
    hasRole: (role: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
};

const AccessContext = createContext<AccessContextType | undefined>(undefined);

export const AccessProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();

    const [roles, setRoles] = useState<string[]>([]);
    const [permissions, setPermissions] = useState<string[]>([]);

    const lastSnapshotRef = useRef<string>('');

    const syncAccess = useCallback(async () => {
        if (!user?.id) return;

        const data = await userAccessUpdate(user.id);

        const snapshot = JSON.stringify({
            roles: data.roles || [],
            permissions: data.permissions || [],
        });

        // ⛔ Prevent unnecessary updates
        if (snapshot === lastSnapshotRef.current) return;

        lastSnapshotRef.current = snapshot;

        setRoles(data.roles || []);
        setPermissions(data.permissions || []);

        await AsyncStorage.multiSet([
            ['roles', JSON.stringify(data.roles || [])],
            ['permissions', JSON.stringify(data.permissions || [])],
        ]);
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;

        // Load cached data immediately
        (async () => {
            const storedRoles =
                JSON.parse((await AsyncStorage.getItem('roles')) || '[]');
            const storedPermissions =
                JSON.parse((await AsyncStorage.getItem('permissions')) || '[]');

            lastSnapshotRef.current = JSON.stringify({
                roles: storedRoles,
                permissions: storedPermissions,
            });

            setRoles(storedRoles);
            setPermissions(storedPermissions);
        })();

        // Fetch once from server
        syncAccess();

        console.log(roles)
    }, [user?.id, syncAccess]);

    const can = useCallback(
        (perm: string) => permissions.includes(perm),
        [permissions]
    );

    const hasRole = useCallback(
        (role: string) => roles.includes(role),
        [roles]
    );

    const hasAnyRole = useCallback(
        (roleList: string[]) => roleList.some(r => roles.includes(r)),
        [roles]
    );


    const value = useMemo(
        () => ({
            roles,
            permissions,
            can,
            hasRole,
            hasAnyRole,
        }),
        [roles, permissions, can, hasRole, hasAnyRole]
    );

    return (
        <AccessContext.Provider value={value}>
            {children}
        </AccessContext.Provider>
    );
};

export const useAccess = () => {
    const ctx = useContext(AccessContext);
    if (!ctx) {
        throw new Error('useAccess must be used inside AccessProvider');
    }
    return ctx;
};
