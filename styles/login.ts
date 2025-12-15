import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1A233A",
        // fontFamily: "sans-serif",
    },

    formContainer: {
        backgroundColor: "#ffffff",
        borderTopLeftRadius: 50,
        borderTopRightRadius: 50,
        padding: 24,
        marginTop: 300,
        height: 650,
        flex: 1,
        position: "relative",
        zIndex: 10,
        // marginBottom: 0,
    },

    welcome: {
        fontSize: 28,
        fontWeight: "700",
        textAlign: "center",
        color: "#1A233A",
        letterSpacing: -0.5,
    },

    subtitle: {
        fontSize: 15,
        color: "#1A233A",
        textAlign: "center",
        marginTop: 5,
        fontWeight: "400",
        letterSpacing: 0.2,
    },

    input: {
        marginTop: 50,
        borderWidth: 1,
        borderColor: "#1A233A",
        borderRadius: 10,
        padding: 14,
        marginBottom: 16,
        color: "#1A233A",
        fontSize: 15,
        fontWeight: "400",
    },

    passwordWrapper: {
        marginTop: 5,
        // flexDirection: "row",
        position: "relative",
        alignItems: "center",
        // paddingHorizontal: 14,
    },

    passwordInput: {
        // flex: 1,
        width: "100%",
        paddingRight: 30,
        paddingVertical: 14,
        color: "#1A233A",
        borderWidth: 1,
        borderColor: "#1A233A",
        borderRadius: 10,
        paddingLeft: 15,
        fontSize: 15,
        fontWeight: "400",
    },

    eyeIcon: {
        // paddingLeft: 10,
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

    signup: {
        marginTop: 20,
        flexDirection: "row",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        
    },

    signupText: {
        color: "#a7bad1ff",
        
      },

    signupPress: {
        color: "#1A233A",
        fontWeight: "600",
    },
});