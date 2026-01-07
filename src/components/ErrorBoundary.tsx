import React from "react";
import { View, Text, StyleSheet } from "react-native";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorId: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, errorId: `err_${Date.now()}` };
    }

    componentDidCatch(error, errorInfo) {
        console.log("Error caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>There is something wrong.</Text>
                    <Text style={styles.text}>
                        Contact the ICT office and give this code:
                    </Text>
                    <Text style={styles.code}>{this.state.errorId}</Text>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fafafa",
        padding: 20,
    },
    title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
    text: { fontSize: 16, color: "#555" },
    code: { marginTop: 12, fontSize: 16, fontWeight: "600", color: "#333" },
});

export default ErrorBoundary;
