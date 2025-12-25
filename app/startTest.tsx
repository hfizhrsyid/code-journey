import { styles } from "@/styles/startTest";
import { router } from 'expo-router';
import { Image, Text, TouchableOpacity, View } from 'react-native';

const Test = () => {
    const handleStart = () => {
        router.push('/pretestQuestion');
    };

    return(
        <View style={styles.container}>
            <Text style={styles.title}>Test Your Skills with CodeJourney!</Text>

            <Image
                source={require('../assets/images/test.png')}
                style={styles.image}
                resizeMode="contain"
            />

            <TouchableOpacity style={styles.button} onPress={handleStart}>
                <Text style={styles.buttonText}>Mulai</Text>
            </TouchableOpacity>
        </View>
    )
}

export default Test;