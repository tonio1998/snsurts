import AsyncStorage from "@react-native-async-storage/async-storage";
import {API_BASE_URL, APP_ID} from '../../env.ts';
import axios from 'axios';
import { handleApiError } from "../utils/errorHandler.ts";
import {ToastAndroid} from "react-native";

type ApiCallLog = {
	method?: string;
	url?: string;
	count: number;
	timestamps: string[];
};

const apiCallRegistry: Record<string, ApiCallLog> = {};

const REQUEST_WINDOW_MS = 1500;

const requestLock: Record<
	string,
	{
		lastTime: number;
		inFlight: boolean;
	}
> = {};


const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
		"ngrok-skip-browser-warning": "true",
		"X-App-ID": APP_ID,
	},
});

export const setAuthToken = async (token: string | null) => {
	if (token) {
		api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
		await AsyncStorage.setItem("mobile", token);
	} else {
		delete api.defaults.headers.common["Authorization"];
		await AsyncStorage.removeItem("mobile");
	}
};

api.interceptors.request.use(
	async (config) => {
		const token = await AsyncStorage.getItem("mobile");
		if (token) config.headers.Authorization = `Bearer ${token}`;

		const method = config.method?.toUpperCase();
		const url = config.url;
		const key = `${method} ${url}`;
		const now = Date.now();

		if (!requestLock[key]) {
			requestLock[key] = {
				lastTime: 0,
				inFlight: false,
			};
		}

		const lock = requestLock[key];

		if (lock.inFlight && now - lock.lastTime < REQUEST_WINDOW_MS) {
			ToastAndroid.show(
				'Fetching data, please wait.',
				ToastAndroid.SHORT
			);
			return Promise.reject({
				isDuplicate: true,
				message: 'Duplicate request blocked.',
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
			};
		}

		apiCallRegistry[key].count += 1;
		apiCallRegistry[key].timestamps.push(new Date().toISOString());

		console.log('[API LOG]', apiCallRegistry[key]);
		console.trace(`[API TRACE] ${key}`);

		return config;
	},
	(error) => Promise.reject(error)
);


export const getAllApiCalls = () => {
	return apiCallRegistry;
};

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		try {
			const userData = await AsyncStorage.getItem("user");
			const user = userData ? JSON.parse(userData) : null;

			const isAdmin = user?.role === 'admin';

			if (isAdmin) {
				handleApiError(error, 'Axios Interceptor');
			}
		} catch (e) {
			// fallback logging if something goes wrong
			console.warn('Error parsing user role for logging:', e);
		}

		if (error.response?.status === 401) {
			await AsyncStorage.removeItem("mobile");
			// optional: navigate to login or show alert
		}

		return Promise.reject(error);
	}
);


export default api;
