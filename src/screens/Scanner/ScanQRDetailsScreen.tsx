// ✅ Updated: Replaced ScrollView with FlatList to resolve VirtualizedList nesting warning
// ✅ Polish: UI enhancements with spacing, readability, and slight visual upgrades

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
    PermissionsAndroid,
    Vibration,
    FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import { CText } from '../../components/common/CText';
import { globalStyles } from '../../theme/styles.ts';
import BackHeader from '../../components/layout/BackHeader.tsx';
import SmartSelectPicker from '../../components/pickers/SmartSelectPicker.tsx';
import api from '../../api/api.ts';
import { theme } from '../../theme';
import { handleApiError } from '../../utils/errorHandler.ts';
import Autocomplete from 'react-native-autocomplete-input';
import { useTracking } from '../../context/TrackingContext.tsx';

export default function ScanQRDetailsScreen() {
    const navigation = useNavigation();
    const { record, logs } = useTracking();

    const TransactionID = record?.id;

    const [selected, setSelected] = useState<0 | 1 | 2 | 3>(1);
    const [courier, setCourier] = useState('');
    const [destination, setDestination] = useState('');
    const [forField, setForField] = useState('');
    const [remarks, setRemarks] = useState('');
    const [selectedAssignment, setSelectedAssignment] = useState('');
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [assignmentList, setAssignmentList] = useState([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [waited, setWaited] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => setWaited(true), 1000);
        return () => clearTimeout(timeout);
    }, []);

    const getLocation = async () => {
        try {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
            }

            Geolocation.getCurrentPosition(
                (pos) => {
                    setLocation({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                    });
                },
                () => {},
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        } catch {}
    };

    useEffect(() => {
        getLocation();
        if (logs?.courier) setCourier(String(logs.courier));
    }, []);

    const handleSubmit = async () => {
        if (!TransactionID) return Alert.alert('Error', 'Missing transaction reference. Please scan again.');

        const isOutgoing = selected === 1;
        const isReturn = selected === 2;

        if (!selectedAssignment) return Alert.alert('Error', 'Assignment is required.');
        if (isOutgoing && (!courier || !destination || !forField)) return Alert.alert('Error', 'Please fill out all required fields for Outgoing.');
        if (isReturn && (!courier || !destination)) return Alert.alert('Error', 'Courier and Destination are required for Return.');

        setLoading(true);

        try {
            const payload = {
                TransactionID,
                action_type: ['Incoming', 'Outgoing', 'Return', 'Terminal'][selected],
                courier_id: courier || null,
                destination_unit_id: destination || null,
                for_action: forField || null,
                remarks: remarks || null,
                assignment_id: selectedAssignment,
                coordinates_lat: location?.latitude || null,
                coordinates_lng: location?.longitude || null,
            };

            await api.post('/rts/log/add', payload);

            Alert.alert('Success', 'Document logged successfully!', [{ text: 'OK' }]);
            Vibration.vibrate(100);
            navigation.navigate('History');
        } catch (error) {
            console.error('Submission failed:', error);
            handleApiError(error, 'log submission');
            Alert.alert('Submission Failed', 'Something went wrong. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const forSuggestions = [
        'appropriate action',
        'coding/deposit/preparation of receipt',
        'comment/reaction/response',
        'compliance/implementation',
        'dissemimation of information',
        'draft of reply',
        'endorsement/recommendation',
        'follow-up',
        'investigation/verification and report',
        'notation and returen/file',
        'notification/reply to party',
        'study and report to',
        'translation',
        'your information',
    ];

    if (!TransactionID && waited) {
        return (
            <SafeAreaView style={globalStyles.safeArea}>
                <BackHeader title={'Document Action'} />
                <View style={styles.centered}>
                    <Text style={{ color: theme.colors.light.danger, fontSize: 16 }}>Invalid transaction. Please scan again.</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!waited) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={theme.colors.light.primary} />
                <Text>fetching data...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={globalStyles.safeArea}>
            <BackHeader title={'Document Action'} />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
                <FlatList
                    contentContainerStyle={styles.formWrapper}
                    keyboardShouldPersistTaps="handled"
                    ListHeaderComponent={<>
                        <CText fontStyle="B" fontSize={16} style={styles.sectionTitle}>Action Type</CText>
                        <View style={styles.radioGroup}>
                            {['Incoming', 'Outgoing', 'Return', 'Terminal'].map((item, index) => (
                                <TouchableOpacity
                                    key={item}
                                    style={selected === index ? styles.radioSelected : styles.radio}
                                    onPress={() => setSelected(index as 0 | 1 | 2 | 3)}
                                >
                                    <Text style={selected === index ? styles.radioTextSelected : styles.radioText}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Your Tracking Unit Selection</Text>
                        <SmartSelectPicker
                            value={selectedAssignment}
                            onValueChange={setSelectedAssignment}
                            apiUrl="/rts/user/assignment"
                            labelKey="unit.UnitName"
                            valueKey="unit.UnitID"
                            placeholder="Select Assignment"
                            onLoad={(data) => {
                                setAssignmentList(data);
                                if (!selectedAssignment && data.length > 0) setSelectedAssignment(String(data[0].unit.UnitID));
                            }}
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
                                <Autocomplete
                                    data={filteredSuggestions}
                                    value={forField}
                                    onChangeText={(text) => {
                                        setForField(text);
                                        if (text.length > 0) {
                                            const filtered = forSuggestions.filter(item => item.toLowerCase().includes(text.toLowerCase()));
                                            setFilteredSuggestions(filtered);
                                            setShowSuggestions(true);
                                        } else {
                                            setShowSuggestions(false);
                                        }
                                    }}
                                    flatListProps={{
                                        keyboardShouldPersistTaps: 'handled',
                                        keyExtractor: (_, i) => i.toString(),
                                        renderItem: ({ item }) => (
                                            <TouchableOpacity onPress={() => {
                                                setForField(item);
                                                setShowSuggestions(false);
                                            }}>
                                                <Text style={styles.suggestionItem}>{item}</Text>
                                            </TouchableOpacity>
                                        ),
                                    }}
                                    inputContainerStyle={styles.input}
                                    listContainerStyle={{ maxHeight: 200 }}
                                />
                                <Text style={styles.helperText}>
                                    Provide a direct action only. Do not mention persons or offices. Use the comment section for extra info.
                                </Text>
                            </>
                        )}

                        <Text style={styles.label}>Other Comment/Remarks</Text>
                        <TextInput
                            style={[styles.input, { height: 100 }]}
                            multiline
                            numberOfLines={4}
                            value={remarks}
                            onChangeText={setRemarks}
                            placeholder="Any additional remarks..."
                        />

                        {location && (
                            <Text style={styles.helperText}>
                                Coordinates: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                            </Text>
                        )}
                    </>}
                />
            </KeyboardAvoidingView>

            <TouchableOpacity
                style={[styles.submitBtn, loading && { backgroundColor: '#888' }]}
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>➤ Submit</Text>}
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    suggestionItem: {
        padding: 10,
        borderBottomColor: '#eee',
        borderBottomWidth: 1,
        backgroundColor: '#fff',
    },
    formWrapper: {
        padding: 16,
        paddingBottom: 100,
    },
    sectionTitle: {
        marginBottom: 10,
    },
    radioGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    radio: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 10,
        borderColor: theme.colors.light.card,
        backgroundColor: theme.colors.light.card,
    },
    radioSelected: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderRadius: 8,
        borderColor: theme.colors.light.primary,
        backgroundColor: theme.colors.light.primary,
        marginBottom: 10,
    },
    radioText: {
        color: '#444',
    },
    radioTextSelected: {
        color: theme.colors.light.card,
        fontWeight: 'bold',
    },
    label: {
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 4,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        backgroundColor: '#fff',
    },
    helperText: {
        fontSize: 11,
        color: '#777',
        marginBottom: 10,
    },
    submitBtn: {
        backgroundColor: theme.colors.light.primary,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        margin: 15,
    },
    submitText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});