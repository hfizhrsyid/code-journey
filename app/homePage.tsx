import { styles } from "@/styles/homePage";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

const homePage = () => {
    const handleYes = async () => {
        await AsyncStorage.setItem('has_prior_experience', 'true');
        router.push('/startTest');
    };

    const handleNo = async () => {
        await AsyncStorage.setItem('has_prior_experience', 'false');
        await AsyncStorage.setItem('pretest_completed', 'false');
        router.push('/main/dashboard');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Test Your Skills with CodeJourney!</Text>
            
            <View style={styles.card}>
                <Text style={styles.question}>Apakah sebelumnya pernah belajar Algoritma dan Pemrograman?</Text>

                <TouchableOpacity style={styles.button} onPress={handleYes}>
                    <Text style={styles.buttonText}>Ya</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={handleNo}>
                    <Text style={styles.buttonText}>Tidak</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default homePage;