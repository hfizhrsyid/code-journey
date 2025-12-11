import { styles } from "@/styles/dashboard";
import { useRouter } from "expo-router";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

const data = Array.from({ length: 20 }, (_, i) => ({
  id: (i + 1).toString(),
  title: `Nama Materi ${i + 1}`,
}));

export default function Dashboard() {
  const router = useRouter();

  const goToPath = (item: { id: string; title: string }) => {
    router.push({
      pathname: "/path/[id]",
      params: { id: item.id },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>CodeJourney</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => goToPath(item)} style={styles.card} activeOpacity={0.75}>
            <Text style={styles.cardTitle}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
