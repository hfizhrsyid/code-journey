import { clearPretestData } from "@/lib/pretestHelper";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Add this component temporarily to your dashboard or settings
export const DebugPretestReset = () => {
    const handleReset = async () => {
        await clearPretestData();
        alert("Pretest data cleared! You can retake the test now.");
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.button} onPress={handleReset}>
                <Text style={styles.text}>🔄 Reset Pretest Data</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    button: {
        backgroundColor: "#ff4444",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
    },
    text: {
        color: "#fff",
        fontWeight: "bold",
    },
});
