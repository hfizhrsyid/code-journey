import { styles } from "@/styles/bottomNav";
import { FontAwesome5 } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { Image, TouchableOpacity, View } from "react-native";

export default function BottomNav() {
  const current = usePathname();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/main/chatbot")}>
        <FontAwesome5 name="robot" size={26} color={current?.startsWith("/main/chatbot") ? "#ffffff" : "#d9e6ff"} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/main/dashboard")}>
        <View style={styles.homeButton}>
          <Image source={require("../assets/images/dashboard.png")} style={styles.imageDashboard} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/main/profile")}>
        <Image source={require("../assets/images/profile.png")} style={styles.imageProfile} />
      </TouchableOpacity>
    </View>
  );
}
