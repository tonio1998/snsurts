import React, { useCallback, useState } from 'react';
import {
    SafeAreaView,
    FlatList,
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Alert,
    ToastAndroid,
    Modal,
    Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { CText } from '../../components/common/CText';
import BackHeader from '../../components/layout/BackHeader';
import { globalStyles } from '../../theme/styles';
import { theme } from '../../theme';

import { useTracking } from '../../context/TrackingContext';
import { useAuth } from '../../context/AuthContext';
import {
    fetchRecordAttachments,
    uploadRecordAttachment,
} from '../../api/modules/logsApi';
import { handleApiError } from '../../utils/errorHandler';
import { SubmissionModal } from '../../components/SubmissionModal';
import { viewFile } from '../../utils/viewFile';

import {
    pick,
    isCancel,
    types,
} from '@react-native-documents/picker';

export default function AttachmentScreen() {
    const navigation = useNavigation();
    const { record } = useTracking();
    const { user } = useAuth();

    const RecordID = record?.id;

    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [link, setLink] = useState('');

    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [downloadModal, setDownloadModal] = useState(false);

    const loadAttachments = async (isRefresh = false) => {
        isRefresh ? setRefreshing(true) : setLoading(true);
        try {
            const res = await fetchRecordAttachments({ RecordID });
            setSubmissions(res || []);
        } catch (err) {
            handleApiError(err, 'Fetch');
        } finally {
            isRefresh ? setRefreshing(false) : setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadAttachments();
        }, [])
    );

    const handleFileSelect = async () => {
        try {
            const [file] = await pick({
                type: [types.pdf],
                allowMultiSelection: false,
            });

            if (!file) return;

            if (file.size && file.size > 10 * 1024 * 1024) {
                Alert.alert('File too large', 'Maximum file size is 10MB');
                return;
            }

            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                name: file.name,
                type: file.type || 'application/pdf',
            } as any);

            formData.append('RecordID', RecordID);

            setUploading(true);
            const response = await uploadRecordAttachment(formData);
            await loadAttachments();

            if (Platform.OS === 'android') {
                ToastAndroid.show(
                    response?.success
                        ? 'File uploaded successfully.'
                        : response?.message || 'Upload failed.',
                    ToastAndroid.SHORT
                );
            }
        } catch (error) {
            if (!isCancel(error)) {
                handleApiError(error, 'Upload');
            }
        } finally {
            setUploading(false);
            setModalVisible(false);
        }
    };

    const handleOpenFile = (item: any) => {
        setSelectedFile(item);
        setDownloadModal(true);
    };

    const handleDownload = (mode: 'auto' | 'template') => {
        setDownloadModal(false);
        viewFile(
            selectedFile?.RecordID,
            selectedFile?.id,
            selectedFile?.filename,
            mode
        );
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.submissionCard}
            onPress={() => handleOpenFile(item)}
        >
            <Icon name="document-outline" size={22} color="#555" />
            <View style={{ marginLeft: 12, flex: 1 }}>
                <CText
                    fontSize={16}
                    fontStyle="SB"
                    numberOfLines={1}
                    style={{ color: '#000' }}
                >
                    {item.filename}
                </CText>
                {item.size && (
                    <Text style={styles.subText}>Size: {item.size}</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <>
            <BackHeader title="Attachments" />
            <SafeAreaView style={globalStyles.safeArea}>
                {loading ? (
                    <ActivityIndicator size="large" color={theme.colors.light.primary} />
                ) : (
                    <FlatList
                        data={submissions}
                        keyExtractor={(item, index) => `${item.id}-${index}`}
                        contentContainerStyle={{ padding: 12 }}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => loadAttachments(true)}
                            />
                        }
                        renderItem={renderItem}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No attachments uploaded.</Text>
                            </View>
                        }
                    />
                )}

                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setModalVisible(true)}
                >
                    <Icon name="cloud-upload-outline" size={28} color="#fff" />
                </TouchableOpacity>

                <SubmissionModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    link={link}
                    setLink={setLink}
                    onFileSelect={handleFileSelect}
                    uploading={uploading}
                />

                <Modal
                    visible={downloadModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setDownloadModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <CText fontSize={17} fontStyle="SB" style={styles.modalTitle}>
                                Download As
                            </CText>

                            <CText>This feature is currently unavailable.</CText>

                            {/*<TouchableOpacity*/}
                            {/*    style={styles.optionBtn}*/}
                            {/*    onPress={() => handleDownload('auto')}*/}
                            {/*>*/}
                            {/*    <Icon*/}
                            {/*        name="flash-outline"*/}
                            {/*        size={20}*/}
                            {/*        color={theme.colors.light.primary}*/}
                            {/*    />*/}
                            {/*    <CText style={styles.optionText}>*/}
                            {/*        Auto-Generated File*/}
                            {/*    </CText>*/}
                            {/*</TouchableOpacity>*/}

                            {/*<TouchableOpacity*/}
                            {/*    style={styles.optionBtn}*/}
                            {/*    onPress={() => handleDownload('template')}*/}
                            {/*>*/}
                            {/*    <Icon*/}
                            {/*        name="document-text-outline"*/}
                            {/*        size={20}*/}
                            {/*        color={theme.colors.light.primary}*/}
                            {/*    />*/}
                            {/*    <CText style={styles.optionText}>*/}
                            {/*        Own-Template*/}
                            {/*    </CText>*/}
                            {/*</TouchableOpacity>*/}

                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setDownloadModal(false)}
                            >
                                <CText style={{ color: '#666' }}>Cancel</CText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    submissionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        marginBottom: 10,
        backgroundColor: '#fff',
        borderRadius: 10,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
    },
    subText: {
        fontSize: 12,
        color: '#777',
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 160,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        backgroundColor: theme.colors.light.primary,
        borderRadius: 50,
        padding: 16,
        elevation: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
    },
    modalTitle: {
        textAlign: 'center',
        marginBottom: 14,
        color: '#000',
    },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: '#F5F5F5',
        marginBottom: 10,
    },
    optionText: {
        marginLeft: 10,
        fontSize: 15,
        color: '#000',
    },
    cancelBtn: {
        alignItems: 'center',
        paddingVertical: 12,
    },
});
