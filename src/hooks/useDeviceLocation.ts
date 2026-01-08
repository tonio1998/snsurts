import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface DeviceLocation {
    latitude: number;
    longitude: number;
    accuracy?: number;
}

const LOCATION_TIMEOUT = 5000;

export function useDeviceLocation(autoFetch = true) {
    const [location, setLocation] = useState<DeviceLocation | null>(null);
    const [loading, setLoading] = useState(false);
    const [granted, setGranted] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    const watchIdRef = useRef<number | null>(null);
    const resolvedRef = useRef(false);

    const clearWatcher = useCallback(() => {
        if (watchIdRef.current !== null) {
            Geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    }, []);

    const requestPermission = useCallback(async () => {
        if (Platform.OS !== 'android') {
            setGranted(true);
            return true;
        }

        try {
            const result = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            ]);

            const allowed =
                result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
                PermissionsAndroid.RESULTS.GRANTED ||
                result[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
                PermissionsAndroid.RESULTS.GRANTED;

            setGranted(allowed);

            if (!allowed) {
                setError('Location permission denied');
            }

            return allowed;
        } catch {
            setGranted(false);
            setError('Permission request failed');
            return false;
        }
    }, []);

    const resolve = useCallback(
        (pos: Geolocation.GeoPosition) => {
            if (resolvedRef.current) return;

            resolvedRef.current = true;

            setLocation({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
            });

            setLoading(false);
            clearWatcher();
        },
        [clearWatcher]
    );

    const onError = useCallback(
        (err: any) => {
            if (resolvedRef.current) return;

            setError(err?.message || 'Unable to acquire location');
            setLoading(false);
            clearWatcher();
        },
        [clearWatcher]
    );

    const fetchLocation = useCallback(async () => {
        clearWatcher();
        resolvedRef.current = false;
        setLoading(true);
        setError(null);

        const ok = await requestPermission();
        if (!ok) {
            setLoading(false);
            return;
        }

        Geolocation.getCurrentPosition(resolve, onError, {
            enableHighAccuracy: false,
            timeout: LOCATION_TIMEOUT,
            maximumAge: 5 * 60 * 1000,
        });

        watchIdRef.current = Geolocation.watchPosition(resolve, onError, {
            enableHighAccuracy: true,
            distanceFilter: 0,
            interval: 2000,
            fastestInterval: 1000,
        });

        setTimeout(() => {
            if (!resolvedRef.current) {
                onError({});
            }
        }, LOCATION_TIMEOUT);
    }, [clearWatcher, onError, requestPermission, resolve]);

    useEffect(() => {
        if (autoFetch) {
            fetchLocation();
        }

        return () => {
            clearWatcher();
        };
    }, [autoFetch, fetchLocation, clearWatcher]);

    return {
        location,
        loading,
        granted,
        error,
        retry: fetchLocation,
    };
}
