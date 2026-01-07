import React from "react";
import {
    Modal,
    View,
    StyleSheet,
    TouchableWithoutFeedback,
    Platform,
    StatusBar,
} from "react-native";
import { CText } from "../common/CText";

export default function IosBottomSheet({
                                           visible,
                                           title,
                                           onClose,
                                           children,
                                       }) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            statusBarTranslucent
        >
            <StatusBar
                translucent
                backgroundColor="rgba(0,0,0,0.35)"
                barStyle={Platform.OS === "ios" ? "dark-content" : "light-content"}
            />

            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.sheet}>
                            <View style={styles.handle} />

                            {title && (
                                <CText fontStyle="SB" style={styles.title}>
                                    {title}
                                </CText>
                            )}

                            {children}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "flex-end",
    },
    sheet: {
        backgroundColor: "#fff",
        paddingTop: 10,
        paddingHorizontal: 20,
        paddingBottom: 24,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
    },
    handle: {
        width: 42,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#ccc",
        alignSelf: "center",
        marginBottom: 14,
    },
    title: {
        fontSize: 17,
        textAlign: "center",
        marginBottom: 20,
    },
});
