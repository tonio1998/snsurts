import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CustomHeader from '../../components/layout/CustomHeader';
import { theme } from '../../theme';
import { CText } from '../../components/common/CText';
import {globalStyles} from "../../theme/styles.ts";
import BackHeader from "../../components/layout/BackHeader.tsx";

export default function ScanQRDetailsScreen() {
    const navigation = useNavigation();

    const [selected, setSelected] = useState<0 | 1 | 2 | 3>(0); // 0: INCOMING, 1: OUTGOING, etc.
    const [courier, setCourier] = useState('');
    const [destination, setDestination] = useState('');
    const [forField, setForField] = useState('');
    const [remarks, setRemarks] = useState('');

    const handleSubmit = () => {
        console.log({
            actionType: ['INCOMING', 'OUTGOING', 'RETURN', 'TERMINAL'][selected],
            courier,
            destination,
            forField,
            remarks,
        });
        // Add your actual submission logic here (API call, etc.)
        navigation.goBack(); // or show a confirmation screen
    };

    return (
        <SafeAreaView style={globalStyles.safeArea}>
            <BackHeader title={'Document Action'} />
            <ScrollView contentContainerStyle={styles.formWrapper}>
                <CText fontStyle="B" fontSize={16} style={styles.sectionTitle}>
                    Action Type
                </CText>
                <View style={styles.radioGroup}>
                    {['INCOMING', 'OUTGOING', 'RETURN', 'TERMINAL'].map((item, index) => (
                        <TouchableOpacity
                            key={item}
                            style={selected === index ? styles.radioSelected : styles.radio}
                            onPress={() => setSelected(index as 0 | 1 | 2 | 3)}
                        >
                            <Text style={selected === index ? styles.radioTextSelected : styles.radioText}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Your Tracking Unit Selection</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: '#f0f0f0' }]}
                    value="College of Engineering and Information Technology"
                    editable={false}
                />

                <Text style={styles.label}>Courier</Text>
                <TextInput
                    style={styles.input}
                    value={courier}
                    onChangeText={setCourier}
                    placeholder="Enter Courier Name"
                />

                <Text style={styles.label}>Destination</Text>
                <TextInput
                    style={styles.input}
                    value={destination}
                    onChangeText={setDestination}
                    placeholder="Enter Destination"
                />

                <Text style={styles.label}>For</Text>
                <TextInput
                    style={styles.input}
                    value={forField}
                    onChangeText={setForField}
                    placeholder="e.g., FOR SIGNATURE"
                />
                <Text style={styles.helperText}>
                    Provide a direct action only. Do not mention persons or offices. Use the comment section
                    for extra info.
                </Text>

                <Text style={styles.label}>Other Comment/Remarks</Text>
                <TextInput
                    style={[styles.input, { height: 80 }]}
                    multiline
                    numberOfLines={4}
                    value={remarks}
                    onChangeText={setRemarks}
                    placeholder="Any additional remarks..."
                />
            </ScrollView>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitText}>➤ Submit</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    formWrapper: {
        padding: 16,
    },
    sectionTitle: {
        marginBottom: 10,
    },
    radioGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    radio: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderRadius: 20,
        borderColor: '#ccc',
        marginBottom: 10,
    },
    radioSelected: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderRadius: 20,
        borderColor: theme.colors.light.success,
        backgroundColor: '#E8F5E9',
        marginBottom: 10,
    },
    radioText: {
        color: '#444',
    },
    radioTextSelected: {
        color: theme.colors.light.success,
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
        padding: Platform.OS === 'ios' ? 12 : 8,
        marginBottom: 8,
        backgroundColor: '#fff',
    },
    helperText: {
        fontSize: 11,
        color: '#777',
        marginBottom: 10,
    },
    submitBtn: {
        backgroundColor: '#4CAF50',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        margin: 15
    },
    submitText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

