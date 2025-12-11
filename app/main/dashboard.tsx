import { styles } from "@/styles/dashboard";
import { useRouter } from "expo-router";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

const materi = [
  "Variabel dan Tipe Data",
  "Operator",
  "Percabangan",
  "Perulangan",
  "Pengurutan",
  "Pencarian",
]

interface Materi{
  id: number;
  title: string;
}

const data: Materi[] = Array.from({length: materi.length}).map((_, i) => ({
  id: i,
  title: materi[i],
}));

export default function Dashboard() {
  const router = useRouter();

  const goToPath = (item: Materi) => {
    router.push({ pathname: "./pathPage", params: { id: item.id.toString() } } as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>CodeJourney</Text>

      <FlatList
        showsVerticalScrollIndicator={false}
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => goToPath(item)}
            style={styles.card}
            activeOpacity={0.75}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}