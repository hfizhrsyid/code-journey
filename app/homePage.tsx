import { styles } from "@/styles/homePage";
import { Text, TouchableOpacity, View } from 'react-native';

const homePage = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Test Your Skills with CodeJourney!</Text>
            
            <View style={styles.card}>
                <Text style={styles.question}>Apakah sebelumnya pernah belajar Algoritma dan Pemrograman?</Text>

                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Ya</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Tidak</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default homePage;