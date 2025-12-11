import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1A233A",
    },

    header: {
        width: "100%",
        paddingVertical: 15,
        marginTop: 15,
        alignItems: "center",
    },

    hasil: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "bold",
    },

    card: {
        backgroundColor: "#286292",
        marginHorizontal: 20,
        marginTop: 20,
        padding: 18,
        borderRadius: 20,
    },

    activeCard: {
        backgroundColor: "#B0C4DE",
    },

    cardText: {
        color: "#FFFFFF",
        fontSize: 15,
        marginBottom: 15,
    },

    activeCardText: {
        color: "#1A233A",
    },

    divider: {
        width: "100%",
        borderBottomWidth: 1.5,
        borderColor: "#FFFFFF",
        opacity: 0.6,
        marginVertical: 10,
    },

    answerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    answerText: {
        color: "#B0C4DE",
        fontSize: 14,
        opacity: 0.7,
    },

    activeAnswerText: {
        color: "#1A233A",
        opacity: 1,
    },

    statusIcon: {
        fontSize: 22,
        fontWeight: "bold",
    },

    bottomSheet: {
        position: "absolute",
        bottom: 0,
        width: "90%",
        height: "20%",
        backgroundColor: "#B0C4DE",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        alignSelf: "center",
        padding: 20,
        paddingBottom: 30,
        zIndex: 999,
        elevation: 10,
    },

    cornerImage:{
        width: 60,
        height: 60,
        position: "absolute",
        top: -25,
        right: -20,
    },

    exTitle: {
        color: "#1A233A",
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 10,
    },

    exText: {
        color: "#1A233A",
        fontSize: 14,
        lineHeight: 20,
    },
});
