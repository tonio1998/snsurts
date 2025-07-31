import React, { useCallback, useContext, useState } from 'react';
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
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import { CText } from '../../components/common/CText';
import BackHeader from '../../components/layout/BackHeader.tsx';
import { globalStyles } from '../../theme/styles.ts';
import { theme } from '../../theme';

import { useTracking } from '../../context/TrackingContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import {
    fetchRecordAttachments,
    uploadRecordAttachment,
} from '../../api/modules/logsApi.ts';
import { handleApiError } from '../../utils/errorHandler.ts';
import { SubmissionModal } from '../../components/SubmissionModal.tsx';
import { NetworkContext } from '../../context/NetworkContext.tsx';
import { useLoading } from '../../context/LoadingContext.tsx';
import { useAlert } from '../../components/CAlert.tsx';
import { viewFile } from '../../utils/viewFile.ts';
import { pick } from '@react-native-documents/picker';

export default function AttachmentScreen() {
    const navigation = useNavigation();
    const { record } = useTracking();
    const { user } = useAuth();
    const RecordID = record?.id;

    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [link, setLink] = useState('');

    const { showAlert } = useAlert();

    const loadAttachments = async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const res = await fetchRecordAttachments({ RecordID });
            setSubmissions(res);
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
            const result = await pick({ type: ['application/pdf'] });
            if (!result.length) return;

            const file = result[0];
            if (file.size > 10 * 1024 * 1024) {
                Alert.alert('File too large', 'Max size is 10MB');
                return;
            }

            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                type: file.type,
                name: file.name,
            });
            formData.append('RecordID', RecordID);

            setUploading(true);
            const response = await uploadRecordAttachment(formData);
            await loadAttachments();
            setUploading(false);

            ToastAndroid.show(
                response?.success ? 'File uploaded successfully.' : (response?.message || 'Server rejected the file.'),
                ToastAndroid.SHORT
            );
        } catch (error) {
            setUploading(false);
            handleApiError(error, 'Upload');
        } finally {
            setModalVisible(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.submissionCard}
            key={item.id}
            onPress={() => viewFile(item.location, item.filename)}
        >
            <Icon name="document-outline" size={22} color="#555" />
            <View style={{ marginLeft: 12, flex: 1 }}>
                <CText fontSize={16} fontStyle="SB" numberOfLines={1} style={{ color: '#000' }}>
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
                    <ActivityIndicator size="large" color={theme.colors.light.card} />
                ) : (
                    <FlatList
                        data={submissions}
                        keyExtractor={(item, index) => `${item.id}-${index}`}
                        contentContainerStyle={{ padding: 12 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={() => loadAttachments(true)} />
                        }
                        renderItem={renderItem}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No attachments uploaded.</Text>
                            </View>
                        }
                    />
                )}

                <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
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
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
});
