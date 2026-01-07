import React, { useEffect, useRef, useState } from 'react';
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
    Vibration,
    Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { CText } from '../../components/common/CText.tsx';
import { globalStyles } from '../../theme/styles.ts';
import SmartSelectPicker from '../../components/pickers/SmartSelectPicker.tsx';
import api from '../../api/api.ts';
import { theme } from '../../theme';
import { handleApiError } from '../../utils/errorHandler.ts';
import { useTracking } from '../../context/TrackingContext.tsx';
import { useDeviceLocation } from '../../hooks/useDeviceLocation.ts';
import LeafletMap from '../../components/maps/LeafletMap.tsx';

/* ---------------- CONSTANTS ---------------- */

const MAP_MAX_HEIGHT = 260;
const MAP_MIN_HEIGHT = 90;

/* ---------------- SCREEN ---------------- */

export default function ScanQRDetailsScreen() {
    const navigation = useNavigation();
    const { record, logs } = useTracking();

    const TransactionID = record?.id;

    console.log(record);

    const {
        location,
        loading: locating,
        granted: locationGranted,
        error: locationError,
        retry: retryLocation,
    } = useDeviceLocation(true);

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
    const [assignmentList, setAssignmentList] = useState([]);

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


    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const t = setTimeout(() => setWaited(true), 1000);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (logs?.courier) setCourier(String(logs.courier));
    }, [logs]);


    const mapHeight = scrollY.interpolate({
        inputRange: [0, MAP_MAX_HEIGHT - MAP_MIN_HEIGHT],
        outputRange: [MAP_MAX_HEIGHT, MAP_MIN_HEIGHT],
        extrapolate: 'clamp',
    });

    const mapOpacity = scrollY.interpolate({
        inputRange: [0, 140],
        outputRange: [1, 0.85],
        extrapolate: 'clamp',
    });


    const handleSubmit = async () => {
        if (!TransactionID) {
            return Alert.alert('Error', 'Missing transaction reference.');
        }

        // if (!locationGranted) {
        //     return Alert.alert('Location Required', 'Please allow location permission.');
        // }

        // if (!location) {
        //     return Alert.alert(
        //         'Location Not Ready',
        //         locationError || 'Waiting for GPS signal.',
        //         [{ text: 'Retry', onPress: retryLocation }]
        //     );
        // }

        const isOutgoing = selected === 1;
        const isReturn = selected === 2;

        if (!selectedAssignment)
            return Alert.alert('Error', 'Assignment is required.');

        if (isOutgoing && (!courier || !destination))
            return Alert.alert('Error', 'Please complete all Outgoing fields.');

        if (isReturn && (!courier || !destination))
            return Alert.alert('Error', 'Courier and Destination are required.');

        setLoading(true);

        try {
            const payload = {
                TransactionID,
                action_type: ['Incoming', 'Outgoing', 'Return', 'Done'][selected],
                courier_id: courier || null,
                destination_unit_id: destination || null,
                for_action: forField || "appropriate action",
                remarks: remarks || null,
                assignment_id: selectedAssignment,
                coordinates_lat: location?.latitude || 0,
                coordinates_lng: location?.longitude || 0,
            };

            await api.post('/rts/log/add', payload);

            Vibration.vibrate(600);
            // Alert.alert('Success', 'Document logged successfully.');
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

    if (!waited) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={theme.colors.light.primary} />
                <Text>Loading…</Text>
            </View>
        );
    }


    return (
        <SafeAreaView style={globalStyles.safeArea}>
            <Animated.View
                style={[
                    styles.mapContainer,
                    { height: mapHeight, opacity: mapOpacity },
                ]}
            >
                <LeafletMap
                    latitude={location?.latitude}
                    longitude={location?.longitude}
                    loading={locating}
                    error={locationError}
                    height="100%"
                />
            </Animated.View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <Animated.ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingTop: MAP_MAX_HEIGHT - 150 }}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                >
                    <View style={styles.card}>
                        <TouchableOpacity
                            onPress={retryLocation}
                            style={styles.refreshLocation}
                        >
                            <Text style={styles.refreshText}>Refresh location</Text>
                        </TouchableOpacity>

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

                                    {showForSuggestions && filteredForSuggestions.length > 0 && (
                                        <View style={styles.suggestionBox}>
                                            {filteredForSuggestions.map((item) => (
                                                <TouchableOpacity
                                                    key={item}
                                                    style={styles.suggestionItem}
                                                    onPress={() => {
                                                        setForQuery(item);
                                                        setForField(item);
                                                        setShowForSuggestions(false);
                                                    }}
                                                >
                                                    <Text style={styles.suggestionText}>{item}</Text>
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
                </Animated.ScrollView>
            </KeyboardAvoidingView>

            <TouchableOpacity
                style={[
                    styles.submitBtn,
                    // (loading || !location) && { backgroundColor: '#999' },
                ]}
                // disabled={loading || !location}
                onPress={handleSubmit}
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

    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    mapContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 0,
    },

    card: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 16,
        paddingBottom: 150,
        elevation: 8,
    },

    refreshLocation: {
        alignSelf: 'flex-end',
        marginBottom: 10,
    },

    refreshText: {
        color: theme.colors.light.primary,
        fontWeight: '600',
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },

    segment: {
        flexDirection: 'row',
        backgroundColor: theme.colors.light.primary + '10',
        // elevation: 6,
        borderRadius: theme.radius.md,
        padding: 4,
        marginBottom: 16,
    },

    segmentItem: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        margin: 3
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
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 14,
        backgroundColor: '#fafafa',
    },

    submitBtn: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        paddingVertical: 16,
        borderRadius: 14,
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
