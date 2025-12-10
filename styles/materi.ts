import { StyleSheet } from "react-native";

export const styles = StyleSheet.create ({
    container:{
        flex: 1,
        backgroundColor: '#1A233A',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },

    title:{
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },

    card:{
        backgroundColor: '#286292',
        paddingRight: 20,
        paddingTop: 20,
        paddingLeft: 20,
        paddingBottom: 50,
        borderRadius: 20,
        width: '75%',
        alignItems: 'center',
    },

    question:{
        color: '#FFFFFF',
        fontSize: 14,
        textAlign: 'center',
        marginLeft: 10,
        marginRight: 10,
        marginBottom: 20,
    },

    sliderWrapper: {
        width: '95%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },

    customTrack: {
        position: 'absolute',
        width: '100%',
        height: 20,            // Tebal garis slider 
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
    },

    slider: {
        width: '100%',
        height: 40,
    },

    labelBox: {
        position: "absolute",
        top: 45,
        backgroundColor: "#B0C4DE",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },

    label: {
        color: "#1A233A",
        fontWeight: "bold",
        fontSize: 12,
    },
})