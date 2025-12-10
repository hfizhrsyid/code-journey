import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A233A',
        justifyContent: 'center',
        alignItems: 'center',
    },

    card:{
        backgroundColor: '#286292',
        padding: 20,
        borderRadius: 20,
        width: '75%',
        alignItems: 'center',
    },

    title:{
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 30,
        marginBottom: 15,
    },

    question: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
    },

    button:{
        width: '100%',
        borderColor: '#FFFFFF',
        borderWidth: 2,
        borderRadius: 20,
        marginBottom: 15,
        padding: 10,
        alignItems: 'center',
    },

    buttonText:{
        color: '#FFFFFF',
        fontSize: 16,
    },
})