import { styles } from "@/styles/authHeader";
import { Image, Text, View } from "react-native";

export default function AuthHeader() {
    return (
        <View style={styles.header}>
            <Text style={styles.title}>CodeJourney</Text>
            <Image
                source={require("../assets/images/loginSignup.png")}
                style={styles.logo}
            />
        </View>
    );
}