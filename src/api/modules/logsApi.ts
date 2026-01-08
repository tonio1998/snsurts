import api from '../api.ts';
import AsyncStorage from "@react-native-async-storage/async-storage";

export const addToLogs = async (qrcode) => {
	const response = await api.post('/rts/log/check', {qrcode});
	return response.data;
};

export const getTrackingHistory = async ({ page = 1, TransactionID }) => {
	const response = await api.get('/rts/log/history', {
		params: { page, TransactionID }
	});
	return response.data;
};

export const searchRecords = async (search: string) => {
	const response = await api.post('/rts/search', { q: search });
	return response.data;
};


export const getRecords = async ({
									 fiscalYear,
									 search,
								 }: {
	fiscalYear: number;
	search?: string;
}) => {
	const response = await api.get('/rts', {
		params: {
			FiscalYear: fiscalYear,
			search,
		},
	});

	return response.data.data;
};




export const addRecord = async (data) => {
	const response = await api.post('/rts/add', data);
	return response.data;
};

export const updateRecord = async (id, formData) => {
	console.log("updateRecord", id, formData);

	const response = await api.post('/rts/update', {
		id,
		...formData,
	});

	return response.data;
};


export const fetchRecordAttachments = async ({ RecordID }) => {
	const response = await api.get('/rts/attachment/fetch', {
		params: { RecordID }
	});
	return response.data;
};

export const uploadRecordAttachment = async (formData) => {
	try {
		const response = await api.post('/rts/attachment/upload', formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
		return response.data;
	} catch (error) {
		console.error('API Error:', error);
		throw error;
	}
};

export const getDashData = async ({fiscalYear}) => {
	console.log(":fiscalYear", fiscalYear)
	const response = await api.get('/rts/dashboard/', {
		params: { fiscalYear }
	});
	return response.data;
};