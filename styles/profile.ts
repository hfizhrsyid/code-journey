import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1A233A",
        alignItems: "center",
    },

    title: {
        color: "#ffffff",
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginTop: 35,
    },

    profileWrapper: {
        marginTop: 60,
        position: "relative",
    },

    profile: {
        width: 110,
        height: 110,
        borderRadius: 110,
    },

    editIcon: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: "#ffffff",
        width: 30,
        height: 30,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        elevation: 4,
        borderWidth: 3,
        borderColor: "#000",
    },

    username: {
        color: "#ffffff",
        fontSize: 20,
        marginTop: 15,
        fontWeight: "bold",
    },

    progressContainer: {
        width: "90%",
        marginTop: 30,
    },

    progressLabel: {
        color: "#ffffff",
        marginBottom: 15,
        fontSize: 15,
    },

    progressBarWrapper: {
        height: 35,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ffffff",
        justifyContent: "center",
        overflow: "hidden",
        paddingRight: 60,
    },

    progressBarFill: {
        height: "80%",
        backgroundColor: "#ffffff",
        borderRadius: 5,
        marginLeft: 4,
    },

    progressText: {
        position: "absolute",
        right: 12,
        color: "#ffffff",
        fontWeight: "bold",
        fontSize: 14,
    },

    badgeContainer: {
        width: "90%",
        marginTop: 30,
        marginBottom: 40,
    },

    badgeLabel: {
        color: "#ffffff",
        fontSize: 15,
        marginBottom: 15,
    },

    badgeScroll: {
        paddingRight: 10,
    },

    badgeItemHorizontal: {
        width: 160,
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 18,
        marginRight: 15,
        alignItems: "center",
    },

    badgeEmpty: {
        color: "#ccc",
        fontSize: 14,
    },

    badgeImage: {
        width: 70,
        height: 80,
        marginBottom: 10,
    },

    badgeName: {
        fontSize: 14,
        fontWeight: "bold",
        textAlign: "center",
    },

    badgeDesc: {
        fontSize: 12,
        textAlign: "center",
        marginTop: 5,
        color: "#555",
    },

    logoutButton: {
        borderRadius: 15,
        padding: 7,
        borderColor: "#ffffff",
        borderWidth: 2,
        paddingHorizontal: 15,
        alignSelf: "flex-end",
        marginRight: 20,        
    },

    textButton: {
        color: "#ffffff",
        fontSize: 15,
    },

});