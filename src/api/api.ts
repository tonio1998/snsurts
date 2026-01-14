import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { API_BASE_URL, APP_ID } from '../../env';
import { handleApiError } from '../utils/errorHandler';

type RateBucket = {
	count: number;
	windowStart: number;
};

const rateLimiter: Record<string, RateBucket> = {};
const inFlightRequests = new Set<string>();

const MAX_REQUESTS = 60;
const WINDOW_MS = 60 * 1000;

const SESSION_ID = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

let currentAppState: string = AppState.currentState;

AppState.addEventListener('change', state => {
	currentAppState = state;
});

const getAppState = () => currentAppState;

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
		const key = `${SESSION_ID}:${method} ${url}`;
		const now = Date.now();
		const appState = getAppState();

		config.headers['X-Client-Type'] = 'mobile';
		config.headers['X-Session-ID'] = SESSION_ID;
		config.headers['X-App-State'] = appState;

		if (!rateLimiter[SESSION_ID]) {
			rateLimiter[SESSION_ID] = {
				count: 0,
				windowStart: now,
			};
		}

		const bucket = rateLimiter[SESSION_ID];

		if (now - bucket.windowStart >= WINDOW_MS) {
			bucket.count = 0;
			bucket.windowStart = now;
		}

		if (bucket.count >= MAX_REQUESTS) {
			return Promise.reject({
				isRateLimited: true,
				message: 'Rate limit exceeded (60 requests per minute)',
			});
		}

		if (inFlightRequests.has(key)) {
			return Promise.reject({
				isDuplicate: true,
			});
		}

		inFlightRequests.add(key);
		bucket.count += 1;

		return config;
	},
	error => Promise.reject(error)
);

api.interceptors.response.use(
	response => {
		const key = `${SESSION_ID}:${response.config.method?.toUpperCase()} ${response.config.url}`;
		inFlightRequests.delete(key);
		return response;
	},
	async error => {
		const key = `${SESSION_ID}:${error.config?.method?.toUpperCase()} ${error.config?.url}`;
		inFlightRequests.delete(key);

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
