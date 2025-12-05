import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    header: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 300,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1A233A",
        zIndex: 0,
    },
    
    title: {
        color: "#ffffff",
        fontSize: 24,
        fontWeight: "bold",
    },

    logo: {
        width: 167,
        height: 167,
        resizeMode: "contain",
        marginTop: 30,
    },
});