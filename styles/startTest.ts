import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: '#1A233A',
        justifyContent: 'center',
        alignItems: 'center',
    },

    title:{
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 22,
    },

    image:{
         width: 220,
        height: 220,
        marginBottom: 40,
    },

    button:{
        width: '25%',
        borderColor: '#FFFFFF',
        borderWidth: 2,
        borderRadius: 20,
        marginBottom: 10,
        alignItems: 'center',
        padding: 10,
    },

    buttonText:{
        color: '#FFFFFF',
        fontSize: 1,
    },
})