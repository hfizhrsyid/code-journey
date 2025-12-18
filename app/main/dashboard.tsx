import { quizAPI } from "@/lib/api";
import { styles } from "@/styles/dashboard";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from "react-native";

interface Materi {
  id: number;
  name: string;
  description?: string;
  order: number;
  question_count: number;
  completion_percentage: number;
  correct_count?: number;
  total_questions?: number;
  solved_question_ids?: { question_id: number; index: number }[];
  is_locked: boolean;
  unlock_reason?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [topics, setTopics] = useState<Materi[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadTopics();
    }, [])
  );

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
        item.unlock_reason || `Complete the previous topic to unlock "${item.name}" (>=80%).`,
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

      {/* Developer Quick Access - Remove in production */}
      {__DEV__ && (
        <View style={{ padding: 16, backgroundColor: "#fff3cd", borderRadius: 8, margin: 16 }}>
          <Text style={{ fontWeight: "bold", marginBottom: 8 }}>🛠️ Developer Tools</Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <TouchableOpacity
              style={{ backgroundColor: "#007bff", padding: 8, borderRadius: 4 }}
              onPress={() => router.push("/level/multipleChoicesQuestion")}
            >
              <Text style={{ color: "white", fontSize: 12 }}>MCQ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: "#28a745", padding: 8, borderRadius: 4 }}
              onPress={() => router.push("/level/completionQuestion")}
            >
              <Text style={{ color: "white", fontSize: 12 }}>Fill</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: "#ffc107", padding: 8, borderRadius: 4 }}
              onPress={() => router.push("/level/codingQuestion")}
            >
              <Text style={{ color: "white", fontSize: 12 }}>Coding</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
                {!item.is_locked && (
                  <Text style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                    Progress: {item.completion_percentage}%
                    {item.total_questions ? ` • ${item.correct_count || 0}/${item.total_questions}` : ""}
                  </Text>
                )}
                {item.is_locked && item.unlock_reason && (
                  <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                    {item.unlock_reason}
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