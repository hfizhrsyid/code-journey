import { quizAPI } from "@/lib/api";
import { styles } from "@/styles/dashboard";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from "react-native";

interface Materi {
  id: number;
  name: string;
  description?: string;
  order: number;
  question_count: number;
  completion_percentage: number;
  is_locked: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const [topics, setTopics] = useState<Materi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      setLoading(true);
      const data = await quizAPI.getTopics();
      setTopics(data);
    } catch (error) {
      console.error("Failed to load topics:", error);
    } finally {
      setLoading(false);
    }
  };

  const goToPath = (item: Materi) => {
    if (item.is_locked) {
      Alert.alert(
        "Topic Locked",
        `Complete the previous topic to unlock "${item.name}". You need to get at least 80% correct answers.`,
        [{ text: "OK" }]
      );
      return;
    }

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
            style={[
              styles.card,
              item.is_locked && { opacity: 0.5, backgroundColor: "#e0e0e0" }
            ]}
            activeOpacity={0.75}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Text style={[styles.cardTitle, item.is_locked && { color: "#666" }]}>
                    {item.name}
                  </Text>
                  {item.is_locked && (
                    <FontAwesome name="lock" size={18} color="#666" />
                  )}
                </View>
                {item.completion_percentage > 0 && !item.is_locked && (
                  <Text style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                    Progress: {item.completion_percentage}%
                  </Text>
                )}
              </View>
              {item.completion_percentage === 100 && !item.is_locked && (
                <FontAwesome name="check-circle" size={24} color="green" />
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}