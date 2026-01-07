import { Platform, ToastAndroid } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import api from "../api/api.ts";
import {handleApiError} from "./errorHandler.ts";

export const viewFile = async (
    RecordID: string,
    fileID: string,
    fileName: string,
    mode: 'auto' | 'template' = 'auto'
) => {
    try {
        // 1. Ask backend to generate file and return download URL
        const response = await api.get('/rts/generate-file', {
            params: {
                RecordID,
                fileID,
                mode,
            },
        });

        const fileUrl = response.data?.url;
        const serverFileName = response.data?.filename || fileName;

        if (!fileUrl) {
            throw new Error('File URL not returned by server');
        }

        const prefix = mode === 'template' ? 'TEMPLATE_' : 'AUTO_';
        const finalFileName = `${prefix}${serverFileName}`;

        // 2. ANDROID: Use Download Manager (shows notif, saves to Downloads)
        if (Platform.OS === 'android') {
            const { config, fs } = ReactNativeBlobUtil;

            const downloadPath = `${fs.dirs.DownloadDir}/${finalFileName}`;

            // IMPORTANT: get token for protected download route
            const token = await AsyncStorage.getItem('token');

            await config({
                fileCache: false,
                addAndroidDownloads: {
                    useDownloadManager: true,
                    notification: true,
                    mediaScannable: true,
                    title: finalFileName,
                    description: 'Downloading document',
                    path: downloadPath,
                },
                headers: token
                    ? { Authorization: `Bearer ${token}` }
                    : {},
            }).fetch('GET', fileUrl);

            ToastAndroid.show(
                'File downloaded to Downloads',
                ToastAndroid.SHORT
            );

            return {
                path: downloadPath,
                filename: finalFileName,
            };
        }

        // 3. IOS / fallback: save inside app documents
        const localPath = `${RNFS.DocumentDirectoryPath}/${finalFileName}`;

        const download = RNFS.downloadFile({
            fromUrl: fileUrl,
            toFile: localPath,
        });

        const result = await download.promise;

        if (result.statusCode !== 200) {
            throw new Error(`Download failed with status ${result.statusCode}`);
        }

        const stat = await RNFS.stat(localPath);
        if (!stat.size || stat.size === 0) {
            throw new Error('Downloaded file is empty');
        }

        return {
            path: localPath,
            filename: finalFileName,
        };

    } catch (error) {
        handleApiError(error);
        throw error;
    }
};
