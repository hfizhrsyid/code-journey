import { styles } from "@/styles/dashboard";
import { FlatList, Text, View } from "react-native";

const data = Array.from({ length: 20 }, (_, i) => ({
  id: i.toString(),
  title: `Nama Materi ${i + 1}`,
}));

export default function Dashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>CodeJourney</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
          </View>
        )}
      />
    </View>
  );
}
