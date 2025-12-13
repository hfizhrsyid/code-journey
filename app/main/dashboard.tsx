import { quizAPI } from "@/lib/api";
import { styles } from "@/styles/dashboard";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";

interface Materi {
  id: number;
  name: string;
  description?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [topics, setTopics] = useState<Materi[]>([]);
  const [completion, setCompletion] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      setLoading(true);
      const data = await quizAPI.getTopics();
      setTopics(data);
      
      // Calculate completion % for each topic
      const completionMap: Record<number, number> = {};
      for (const topic of data) {
        try {
          const attempts = await quizAPI.getUserAttempts(topic.id);
          const correct = attempts.filter((a: any) => a.is_correct).length;
          completionMap[topic.id] = attempts.length > 0 ? Math.round((correct / attempts.length) * 100) : 0;
        } catch (e) {
          completionMap[topic.id] = 0;
        }
      }
      setCompletion(completionMap);
    } catch (error) {
      console.error("Failed to load topics:", error);
    } finally {
      setLoading(false);
    }
  };

  const goToPath = (item: Materi) => {
    router.push({ 
      pathname: "./pathPage", 
      params: { 
        id: item.id.toString(),
        topic: item.name,
        difficulty: "2"
      } 
    } as any);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>CodeJourney</Text>

      <FlatList
        showsVerticalScrollIndicator={false}
        data={topics}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => goToPath(item)}
            style={styles.card}
            activeOpacity={0.75}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {completion[item.id] === 100 && (
                <FontAwesome name="check-circle" size={24} color="green" />
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}