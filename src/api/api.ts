import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, ToastAndroid } from 'react-native';
import { API_BASE_URL, APP_ID } from '../../env';
import { handleApiError } from '../utils/errorHandler';

type ApiCallLog = {
	method?: string;
	url?: string;
	count: number;
	timestamps: string[];
	appStates: string[];
};

const REQUEST_WINDOW_MS = 1500;

const apiCallRegistry: Record<string, ApiCallLog> = {};

const requestLock: Record<
	string,
	{
		lastTime: number;
		inFlight: boolean;
	}
> = {};

const SESSION_ID = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

let currentAppState: string = AppState.currentState;

AppState.addEventListener('change', state => {
	currentAppState = state;
	console.log('[APP STATE]', state, new Date().toISOString());
});

const getAppState = () => currentAppState;

const persistApiLog = async (key: string, data: ApiCallLog) => {
	try {
		const existing = await AsyncStorage.getItem('API_DEBUG_LOGS');
		const logs = existing ? JSON.parse(existing) : {};
		logs[key] = data;
		await AsyncStorage.setItem('API_DEBUG_LOGS', JSON.stringify(logs));
	} catch (e) {
		console.warn('[API LOG PERSIST ERROR]', e);
	}
};

export const getAllApiCalls = async () => {
	const logs = await AsyncStorage.getItem('API_DEBUG_LOGS');
	return logs ? JSON.parse(logs) : {};
};

export const clearApiLogs = async () => {
	await AsyncStorage.removeItem('API_DEBUG_LOGS');
};

const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
		'ngrok-skip-browser-warning': 'true',
		'X-App-ID': APP_ID,
	},
});

export const setAuthToken = async (token: string | null) => {
	if (token) {
		api.defaults.headers.common.Authorization = `Bearer ${token}`;
		await AsyncStorage.setItem('mobile', token);
	} else {
		delete api.defaults.headers.common.Authorization;
		await AsyncStorage.removeItem('mobile');
	}
};

api.interceptors.request.use(
	async config => {
		const token = await AsyncStorage.getItem('mobile');
		if (token) config.headers.Authorization = `Bearer ${token}`;

		const method = config.method?.toUpperCase();
		const url = config.url;
		const key = `${method} ${url}`;
		const now = Date.now();
		const appState = getAppState();

		config.headers['X-Client-Type'] = 'mobile';
		config.headers['X-Session-ID'] = SESSION_ID;
		config.headers['X-App-State'] = appState;

		if (!requestLock[key]) {
			requestLock[key] = { lastTime: 0, inFlight: false };
		}

		const lock = requestLock[key];

		if (lock.inFlight && now - lock.lastTime < REQUEST_WINDOW_MS) {
			return Promise.reject({
				isDuplicate: true,
				message: 'Duplicate request blocked',
				config,
			});
		}

		lock.inFlight = true;
		lock.lastTime = now;

		if (!apiCallRegistry[key]) {
			apiCallRegistry[key] = {
				method,
				url,
				count: 0,
				timestamps: [],
				appStates: [],
			};
		}

		apiCallRegistry[key].count += 1;
		apiCallRegistry[key].timestamps.push(new Date().toISOString());
		apiCallRegistry[key].appStates.push(appState);

		console.log('[API CALL]', {
			key,
			count: apiCallRegistry[key].count,
			appState,
		});

		console.trace(`[API TRACE] ${key}`);

		if (appState !== 'active') {
			console.warn('[BACKGROUND API CALL]', key);
		}

		await persistApiLog(key, apiCallRegistry[key]);

		return config;
	},
	error => Promise.reject(error)
);

api.interceptors.response.use(
	response => {
		const key = `${response.config.method?.toUpperCase()} ${response.config.url}`;
		if (requestLock[key]) {
			requestLock[key].inFlight = false;
		}
		return response;
	},
	async error => {
		const key = `${error.config?.method?.toUpperCase()} ${error.config?.url}`;
		if (requestLock[key]) {
			requestLock[key].inFlight = false;
		}

		try {
			const userData = await AsyncStorage.getItem('user');
			const user = userData ? JSON.parse(userData) : null;

			if (user?.role === 'SA') {
				handleApiError(error, 'Axios Global Debugger');
			}
		} catch {}

		if (error.response?.status === 401) {
			await AsyncStorage.removeItem('mobile');
		}

		return Promise.reject(error);
	}
);

export default api;
