import React, { useState } from "react";
import {
    SafeAreaView,
    TextInput,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Platform,
    Alert,
    KeyboardAvoidingView,
} from "react-native";
import { CText } from "../../components/common/CText";
import { theme } from "../../theme";
import BackHeader from "../../components/layout/BackHeader.tsx";
import { globalStyles } from "../../theme/styles.ts";
import Icon from "react-native-vector-icons/Ionicons";
import SmartSelectPicker from "../../components/pickers/SmartSelectPicker.tsx";
import DateTimePicker from "@react-native-community/datetimepicker";
import {addRecord, updateRecord} from "../../api/modules/logsApi.ts";
import { handleApiError } from "../../utils/errorHandler.ts";
import {useAlert} from "../../components/CAlert.tsx";

export default function AddDocumentScreen({ route, navigation }) {
    const info = route?.params?.info ?? null;

    const [loading, setLoading] = useState(false);
    const { showAlert } = useAlert();

    const [type, setType] = useState(info?.type?.toString() ?? "1");
    const [connectQR, setConnectQR] = useState(info?.ConnectQR ?? "");
    const [TransactBy, setTransactBy] = useState(info?.TransactBy?.toString() ?? "1");
    const [AssetUnitID, setAssetUnitID] = useState(info?.UnitID ?? "");
    const [Origin, setOrigin] = useState(info?.Origin ?? "");
    const [DateTimeReceived, setDateTimeReceived] = useState(
        info?.DateTimeReceived ? new Date(info.DateTimeReceived) : null
    );
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [TransactionType, setTransactionType] = useState(info?.TransactionType ?? "");
    const [Priority, setPriority] = useState(info?.Priority?.toString() ?? "1");
    const [Description, setDescription] = useState(info?.Description ?? "");
    const [remark, setRemark] = useState(info?.remark ?? "");

    const isExternal = type === "0";
    const isUnit = TransactBy === "1";

    const handleDateChange = (_, selectedDate) => {
        if (!selectedDate) {
            setShowDatePicker(false);
            return;
        }

        const updated = new Date(DateTimeReceived || new Date());
        updated.setFullYear(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate()
        );

        setDateTimeReceived(updated);
        setShowDatePicker(false);
        setShowTimePicker(true);
    };

    const handleTimeChange = (_, selectedTime) => {
        if (selectedTime) {
            const updated = new Date(DateTimeReceived || new Date());
            updated.setHours(selectedTime.getHours());
            updated.setMinutes(selectedTime.getMinutes());
            setDateTimeReceived(updated);
        }
        setShowTimePicker(false);
    };

    const handleSubmit = async () => {
        const errors: string[] = [];

        if (!type) errors.push("Please select a document type.");
        if (!Description.trim()) errors.push("Please provide a description.");
        if (isExternal && !DateTimeReceived) errors.push("Please provide a date and time.");
        if (isExternal && !TransactionType) errors.push("Please select a transaction type.");
        if (isExternal && !Priority) errors.push("Please select a priority.");
        if (!TransactBy) errors.push("Please select a transactor.");
        if (isUnit && !AssetUnitID) errors.push("Please select a unit.");

        if (errors.length) {
            Alert.alert(errors.join("\n"));
            return;
        }

        const formData = {
            connectQR,
            type,
            TransactBy,
            AssetUnitID,
            Origin,
            DateTimeReceived: DateTimeReceived?.toISOString() || null,
            TransactionType,
            Priority,
            Description,
            remark,
        };

        try {
            setLoading(true);

            let response;

            if (info?.id) {
                response = await updateRecord(info.id, formData);
            } else {
                console.log("formData: ", formData)
                response = await addRecord(formData);
            }

            if(info?.id){
                navigation.goBack();
            }else{
                navigation.navigate("ScanQRDetails", {
                    qr_code: response.data.QRCODE,
                });
            }
        } catch (e) {
            const message =
                e?.response?.data?.message ||
                e?.message ||
                'Something went wrong during Google login.';

            showAlert('error', 'Error', message);
            handleApiError(e, "Failed to submit document");
        } finally {
            setLoading(false);
        }
    };


    const handleScanQR = () => {
        navigation.navigate("ScannerValidator", {
            onScanComplete: (qr) => setConnectQR(qr),
        });
    };

    return (
        <SafeAreaView style={globalStyles.safeArea}>
            <BackHeader title={info ? "Update Document" : "New Document"} />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Input Old QR to connect"
                            value={connectQR}
                            onChangeText={setConnectQR}
                            keyboardType="numeric"
                            placeholderTextColor="#9CA3AF"
                        />
                        <TouchableOpacity
                            onPress={handleScanQR}
                            style={{
                                marginLeft: 10,
                                padding: 8,
                                backgroundColor: "#fff",
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: theme.colors.light.primary,
                                transform: [{ translateY: -5 }],
                            }}
                        >
                            <Icon name="qr-code" size={24} color={theme.colors.light.primary} />
                        </TouchableOpacity>
                    </View>

                    <CText style={styles.label}>Document Origin</CText>
                    <View style={styles.radioRow}>
                        <RadioBtn label="Internal" value="1" selected={type} onSelect={setType} />
                        <RadioBtn label="External" value="0" selected={type} onSelect={setType} />
                    </View>

                    <CText style={styles.label}>Submit As</CText>
                    <View style={styles.radioRow}>
                        <RadioBtn label="Personal" value="0" selected={TransactBy} onSelect={setTransactBy} />
                        <RadioBtn label="Unit" value="1" selected={TransactBy} onSelect={setTransactBy} />
                    </View>

                    {isUnit && (
                        <>
                            <CText style={styles.label}>Tracking Unit</CText>
                            <SmartSelectPicker
                                key={AssetUnitID}
                                value={AssetUnitID}
                                onValueChange={(val) => setAssetUnitID(String(val))}
                                apiUrl="/rts/user/assignment"
                                labelKey="unit.UnitName"
                                valueKey="unit.UnitID"
                                placeholder="Select Unit"
                            />

                        </>
                    )}

                    {isExternal && (
                        <View style={styles.section}>
                            <CText style={styles.sectionHeader}>External Document Details</CText>

                            <CText style={styles.label}>Origin</CText>
                            <TextInput
                                style={styles.input}
                                placeholder="XYZ Company"
                                placeholderTextColor="#9CA3AF"
                                value={Origin}
                                onChangeText={setOrigin}
                            />

                            <CText style={styles.label}>Date & Time Received</CText>
                            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                                <CText>
                                    {DateTimeReceived
                                        ? DateTimeReceived.toLocaleString()
                                        : "Set Date & Time"}
                                </CText>
                            </TouchableOpacity>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={DateTimeReceived || new Date()}
                                    mode="date"
                                    onChange={handleDateChange}
                                />
                            )}

                            {showTimePicker && (
                                <DateTimePicker
                                    value={DateTimeReceived || new Date()}
                                    mode="time"
                                    onChange={handleTimeChange}
                                />
                            )}

                            <CText style={styles.label}>Transaction Type</CText>
                            <SmartSelectPicker
                                value={TransactionType}
                                onValueChange={setTransactionType}
                                items={[
                                    { label: "Single (3 days)", value: "Single" },
                                    { label: "Complex (7 days)", value: "Complex" },
                                    { label: "Highly Technical (20 days)", value: "Highly Technical" },
                                    { label: "N/A", value: "N/A" },
                                ]}
                                placeholder="Select Assignment"
                            />

                            <CText style={styles.label}>Priority (1-6)</CText>
                            <TextInput
                                style={styles.input}
                                value={Priority}
                                onChangeText={setPriority}
                                keyboardType="numeric"
                            />
                        </View>
                    )}

                    <CText style={styles.label}>Document Description</CText>
                    <TextInput
                        style={[styles.input, { height: 100, textAlignVertical: "top" }]}
                        value={Description}
                        onChangeText={setDescription}
                        multiline
                    />

                    <CText style={styles.label}>Remark</CText>
                    <TextInput
                        style={styles.input}
                        value={remark}
                        onChangeText={setRemark}
                        placeholderTextColor="#9CA3AF"
                    />

                    <TouchableOpacity
                        style={[styles.submitBtn, loading && { backgroundColor: "#888" }]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <CText fontStyle="SB" style={styles.submitText}>
                                Submit
                            </CText>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const RadioBtn = ({ label, value, selected, onSelect }) => (
    <TouchableOpacity
        style={[
            styles.radioBtn,
            selected === value && { backgroundColor: theme.colors.light.primary },
        ]}
        onPress={() => onSelect(value)}
    >
        <Text style={{ color: selected === value ? "#fff" : "#000" }}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#f9f9f9",
    },
    label: {
        marginTop: 16,
        marginBottom: 6,
        fontWeight: "600",
        fontSize: 15,
        color: "#333",
    },
    radioRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 10,
    },
    radioBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.light.primary,
        backgroundColor: "#fff",
    },
    section: {
        marginTop: 24,
        padding: 16,
        backgroundColor: "#fff",
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionHeader: {
        fontWeight: "700",
        fontSize: 16,
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === "ios" ? 14 : 10,
        fontSize: 16,
        backgroundColor: "#fff",
        color: "#000",
        marginBottom: 10,
    },
    submitBtn: {
        backgroundColor: theme.colors.light.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        elevation: 3,
    },
    submitText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
});
