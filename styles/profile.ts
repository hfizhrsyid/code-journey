import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1A233A",
        alignItems: "center",
    },

    title: {
        color: "#ffffff",
        fontSize: 26,
        fontWeight: "700",
        textAlign: "center",
        marginTop: 45,
        letterSpacing: -0.5,
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
        fontSize: 22,
        marginTop: 15,
        fontWeight: "700",
        letterSpacing: -0.3,
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

    statCard: {
        backgroundColor: "#2A3551",
        borderRadius: 12,
        padding: 20,
        width: "48%",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#3A4561",
    },

    statNumber: {
        color: "#ffffff",
        fontSize: 32,
        fontWeight: "bold",
    },

    statLabel: {
        color: "#A0A8B8",
        fontSize: 13,
        marginTop: 5,
        textAlign: "center",
    },

    logoutButton: {
        backgroundColor: "#DC3545",
        borderRadius: 15,
        padding: 15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 20,
        marginBottom: 30,
        gap: 8,
        zIndex: 10,
    },

    textButton: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "600",
    },

});