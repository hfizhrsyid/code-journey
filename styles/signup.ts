import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1A233A",
    },

    formContainer: {
        backgroundColor: "#ffffff",
        borderTopLeftRadius: 50,
        borderTopRightRadius: 50,
        padding: 24,
        marginTop: 300,
        height: 760,
        flex: 1,
        position: "relative",
        zIndex: 10,
    },

    welcome: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        color: "#1A233A",
    },

    subtitle: {
        fontSize: 14,
        color: "#1A233A",
        textAlign: "center",
        marginTop: 5,
    },

    inputName: {
        marginTop: 50,
        borderWidth: 1,
        borderColor: "#1A233A",
        borderRadius: 10,
        padding: 14,
        marginBottom: 16,
        color: "#1A233A",
    },

    inputEmail: {
        borderWidth: 1,
        borderColor: "#1A233A",
        borderRadius: 10,
        padding: 14,
        marginBottom: 16,
        color: "#1A233A",
        marginTop: 5,
    },

    passwordWrapper: {
        marginTop: 5,
        position: "relative",
        alignItems: "center",
    },

    confirmPasswordWrapper: {
        marginTop: 21,
        position: "relative",
        alignItems: "center",
    },

    passwordInput: {
        width: "100%",
        paddingRight: 30,
        paddingVertical: 14,
        color: "#1A233A",
        borderWidth: 1,
        borderColor: "#1A233A",
        borderRadius: 10,
        paddingLeft: 15,
    },

    eyeIcon: {
        position: "absolute",
        right: 14,
        top: "50%",
        transform: [{ translateY: -10 }],
    },

    button: {
        marginTop: 40,
        backgroundColor: "#B0C4DE",
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
    },

    buttonText: {
        fontWeight: "600",
        color: "#1A233A",
    },

    login: {
        marginTop: 20,
        flexDirection: "row",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        
    },

    loginText: {
        color: "#a7bad1ff",
        
      },

    loginPress: {
        color: "#1A233A",
        fontWeight: "600",
    },
});