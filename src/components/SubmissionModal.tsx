import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface Props {
    visible: boolean;
    onClose: () => void;
    onFileSelect: () => void;
    uploading: boolean;
}

export const SubmissionModal = ({
                                    visible,
                                    onClose,
                                    onFileSelect,
                                    uploading,
                                }: Props) => {
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Choose Submission Type</Text>

                    <TouchableOpacity
                        style={styles.optionBtn}
                        onPress={onFileSelect}
                        disabled={uploading}
                    >
                        <Icon name="document-text-outline" size={22} color="#333" />
                        <Text style={styles.optionText}>
                            Upload PDF File
                        </Text>

                        {uploading && (
                            <ActivityIndicator
                                size="small"
                                color="#333"
                                style={{ marginLeft: 'auto' }}
                            />
                        )}
                    </TouchableOpacity>

                    <Text style={styles.helperText}>
                        Accepted format: PDF only
                    </Text>

                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={uploading}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};
const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f2f2f2',
        padding: 14,
        borderRadius: 12,
    },
    optionText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#333',
    },
    helperText: {
        marginTop: 8,
        fontSize: 12,
        color: '#777',
    },
    cancelBtn: {
        marginTop: 22,
        alignItems: 'center',
    },
    cancelText: {
        color: '#d32f2f',
        fontSize: 14,
        fontWeight: '500',
    },
});
