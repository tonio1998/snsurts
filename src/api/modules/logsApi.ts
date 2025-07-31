import api from '../api.ts';

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

export const getRecords = async ({ page = 1, search = '' }) => {
	const response = await api.get('/rts', {
		params: { page, search }
	});
	return response.data;
};


export const addRecord = async (data) => {
	const response = await api.post('/rts/add', data);
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