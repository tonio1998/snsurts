import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    ScrollView,
    Vibration,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { globalStyles } from '../../theme/styles.ts';
import SmartSelectPicker from '../../components/pickers/SmartSelectPicker.tsx';
import api from '../../api/api.ts';
import { theme } from '../../theme';
import { handleApiError } from '../../utils/errorHandler.ts';
import { useTracking } from '../../context/TrackingContext.tsx';
import { useDeviceLocation } from '../../hooks/useDeviceLocation.ts';
import {useSafeAreaInsets} from "react-native-safe-area-context";

export default function ScanQRDetailsScreen() {
    const navigation = useNavigation();
    const { record, logs } = useTracking();

    const TransactionID = record?.id;
    const insets = useSafeAreaInsets();

    const { location } = useDeviceLocation(true);

    const [selected, setSelected] = useState<0 | 1 | 2 | 3>(1);
    const [courier, setCourier] = useState('');
    const [destination, setDestination] = useState('');
    const [forField, setForField] = useState('');
    const [remarks, setRemarks] = useState('');
    const [selectedAssignment, setSelectedAssignment] = useState('');
    const [loading, setLoading] = useState(false);
    const [waited, setWaited] = useState(false);
    const [forQuery, setForQuery] = useState('appropriate action');
    const [showForSuggestions, setShowForSuggestions] = useState(false);

    const forSuggestions = [
        'appropriate action',
        'coding/deposit/preparation of receipt',
        'comment/reaction/response',
        'compliance/implementation',
        'dissemination of information',
        'draft of reply',
        'endorsement/recommendation',
        'follow-up',
        'investigation/verification and report',
        'notation and return/file',
        'notification/reply to party',
        'study and report to',
        'translation',
        'your information',
    ];

    const filteredForSuggestions = forSuggestions.filter(item =>
        item.toLowerCase().includes(forQuery.toLowerCase())
    );

    useEffect(() => {
        const t = setTimeout(() => setWaited(true), 800);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (logs?.courier) setCourier(String(logs.courier));
    }, [logs]);

    const handleSubmit = async () => {
        if (!TransactionID) {
            return Alert.alert('Error', 'Missing transaction reference.');
        }

        const isOutgoing = selected === 1;
        const isReturn = selected === 2;

        if (!selectedAssignment) {
            return Alert.alert('Error', 'Assignment is required.');
        }

        if ((isOutgoing || isReturn) && (!courier || !destination)) {
            return Alert.alert('Error', 'Courier and Destination are required.');
        }

        setLoading(true);

        try {
            const payload = {
                TransactionID,
                action_type: ['Incoming', 'Outgoing', 'Return', 'Done'][selected],
                courier_id: courier || null,
                destination_unit_id: destination || null,
                for_action: forField || 'appropriate action',
                remarks: remarks || null,
                assignment_id: selectedAssignment,
                coordinates_lat: location?.latitude ?? 0,
                coordinates_lng: location?.longitude ?? 0,
            };

            await api.post('/rts/log/add', payload);

            Vibration.vibrate(500);
            navigation.navigate('History' as never);
        } catch (error) {
            handleApiError(error, 'log submission');
            Alert.alert('Submission Failed', 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    if (!TransactionID && waited) {
        return (
            <SafeAreaView style={globalStyles.safeArea}>
                <View style={styles.centered}>
                    <Text style={{ color: theme.colors.light.danger }}>
                        Invalid transaction. Please scan again.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[globalStyles.safeArea, {paddingTop: insets.top}]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 160 }}
                >
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Action Type</Text>

                        <View style={styles.segment}>
                            {['Incoming', 'Outgoing', 'Return', 'Terminal'].map(
                                (item, index) => (
                                    <TouchableOpacity
                                        key={item}
                                        style={[
                                            styles.segmentItem,
                                            selected === index && styles.segmentActive,
                                        ]}
                                        onPress={() => setSelected(index as any)}
                                    >
                                        <Text
                                            style={[
                                                styles.segmentText,
                                                selected === index &&
                                                styles.segmentTextActive,
                                            ]}
                                        >
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                )
                            )}
                        </View>

                        <Text style={styles.label}>Your Tracking Unit</Text>
                        <SmartSelectPicker
                            value={selectedAssignment}
                            onValueChange={setSelectedAssignment}
                            apiUrl="/rts/user/assignment"
                            labelKey="unit.UnitName"
                            valueKey="unit.UnitID"
                            placeholder="Select Assignment"
                        />

                        {(selected === 1 || selected === 2) && (
                            <>
                                <Text style={styles.label}>Courier</Text>
                                <SmartSelectPicker
                                    value={courier}
                                    onValueChange={setCourier}
                                    apiUrl="/rts/user"
                                    labelKey="name"
                                    valueKey="id"
                                    placeholder="Select Courier"
                                />

                                <Text style={styles.label}>Destination</Text>
                                <SmartSelectPicker
                                    value={destination}
                                    onValueChange={setDestination}
                                    apiUrl="/rts/units"
                                    labelKey="UnitName"
                                    valueKey="UnitID"
                                    placeholder="Select Destination"
                                />
                            </>
                        )}

                        {selected === 1 && (
                            <>
                                <Text style={styles.label}>For</Text>
                                <View style={{ position: 'relative' }}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. endorsement, follow-up"
                                        placeholderTextColor="#999"
                                        value={forQuery}
                                        onChangeText={(text) => {
                                            setForQuery(text);
                                            setForField(text);
                                            setShowForSuggestions(true);
                                        }}
                                        onFocus={() => setShowForSuggestions(true)}
                                    />

                                    {showForSuggestions &&
                                        filteredForSuggestions.length > 0 && (
                                            <View style={styles.suggestionBox}>
                                                {filteredForSuggestions.map(item => (
                                                    <TouchableOpacity
                                                        key={item}
                                                        style={styles.suggestionItem}
                                                        onPress={() => {
                                                            setForQuery(item);
                                                            setForField(item);
                                                            setShowForSuggestions(false);
                                                        }}
                                                    >
                                                        <Text style={styles.suggestionText}>
                                                            {item}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                </View>
                            </>
                        )}

                        <Text style={styles.label}>Remarks</Text>
                        <TextInput
                            style={[styles.input, { height: 100 }]}
                            multiline
                            value={remarks}
                            onChangeText={setRemarks}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitText}>Submit</Text>
                )}
            </TouchableOpacity>
        </SafeAreaView>
    );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 18,
        marginTop: 12,
        // elevation: 4,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },

    segment: {
        flexDirection: 'row',
        backgroundColor: '#f3f6f4',
        borderRadius: 14,
        padding: 6,
        marginBottom: 18,
    },

    segmentItem: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        margin: 2,
    },

    segmentActive: {
        backgroundColor: theme.colors.light.primary,
    },

    segmentText: {
        fontWeight: '600',
        color: '#666',
    },

    segmentTextActive: {
        color: '#fff',
    },

    label: {
        marginTop: 14,
        marginBottom: 6,
        fontWeight: '600',
    },

    input: {
        borderWidth: 1,
        borderColor: '#e1e1e1',
        borderRadius: 14,
        padding: 14,
        backgroundColor: '#fff',
        fontSize: 15,
    },

    suggestionBox: {
        position: 'absolute',
        top: 56,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        maxHeight: 180,
        zIndex: 20,
        elevation: 6,
    },

    suggestionItem: {
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },

    suggestionText: {
        fontSize: 14,
        color: '#333',
    },

    submitBtn: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: theme.colors.light.primary,
        alignItems: 'center',
        elevation: 6,
    },

    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
