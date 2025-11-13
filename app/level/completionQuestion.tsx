import BottomNav from "@/components/bottomNav";
import { styles } from "@/styles/dashboard";
import { Text, View } from "react-native";

const MultipleChoice = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.brand}> 
                CodeJourney
            </Text>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>A. Example 1</Text>
            </View>
            <BottomNav/>
        </View>
    )
}

export default MultipleChoice;