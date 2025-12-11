import { styles } from "@/styles/startTest";
import { Image, Text, TouchableOpacity, View } from 'react-native';

const Test = () => {
    return(
        <View style ={styles.container}>
            <Text style={styles.title}> Test Your Skills with CodeJourney!</Text>

            <Image
                source={require('../assets/images/test.png')}
                style={styles.image}
                resizeMode="contain"
            />

            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Mulai</Text>
            </TouchableOpacity>
        </View>
    )
}

export default Test;