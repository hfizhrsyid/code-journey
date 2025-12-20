import { styles } from "@/styles/homePage";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

const HomePage = () => {
  const router = useRouter();

  const handleYes = () => {
    // User pernah belajar: minta level pengetahuan lalu lanjut ke pre-test
    router.push("/knowledgeLevel");
  };

  const handleNo = () => {
    // User belum pernah belajar: langsung mulai dari materi pertama di dashboard
    router.replace("/main/dashboard");
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
  );
};

export default HomePage;
