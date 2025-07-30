import api from '../api.ts';

export const addToLogs = async (qrcode) => {
	const response = await api.post('/rts/log/check', {qrcode});
	return response.data;
};