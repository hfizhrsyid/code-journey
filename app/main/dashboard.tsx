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

// Simple circular progress dengan background circle
const CircularProgressDisplay = ({ percentage }: { percentage: number }) => {
  const size = 70;
  const borderWidth = 5;
  const radius = (size - borderWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center", position: "relative" }}>
      {/* Background circle */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: borderWidth,
          borderColor: "#e0e0e0",
          justifyContent: "center",
          alignItems: "center",
          position: "absolute",
        }}
      />
      {/* Progress circle - menggunakan borderColor sebagai progress indicator */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: borderWidth,
          borderColor: "#4CAF50",
          justifyContent: "center",
          alignItems: "center",
          borderTopColor: "#e0e0e0",
          borderRightColor: "#e0e0e0",
          borderBottomColor: percentage > 50 ? "#4CAF50" : "#e0e0e0",
          transform: [{ rotate: `${(percentage / 100) * 360}deg` }],
        }}
      />
      {/* Text di tengah */}
      <Text style={{ fontSize: 14, fontWeight: "bold", color: "#333", position: "absolute" }}>
        {percentage}%
      </Text>
    </View>
  );
};

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
      Alert.alert("Topic Locked", `Complete the previous topic to unlock "${item.name}". You need to get at least 80% correct answers.`, [{ text: "OK" }]);
      return;
    }

    router.push({
      pathname: "./pathPage",
      params: {
        id: item.id.toString(),
        topic: item.name,
        difficulty: "2",
      },
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
            style={[styles.card, item.is_locked && { opacity: 0.5, backgroundColor: "#e0e0e0" }]}
            activeOpacity={0.75}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Text style={[styles.cardTitle, item.is_locked && { color: "#666" }]}>{item.name}</Text>
                  {item.is_locked && <FontAwesome name="lock" size={18} color="#666" />}
                </View>
              </View>

              {/* Right side - Progress indicator atau Report Card */}
              {item.completion_percentage > 0 && item.completion_percentage < 100 && !item.is_locked && (
                <CircularProgressDisplay percentage={item.completion_percentage} />
              )}

              {item.completion_percentage === 100 && !item.is_locked && (
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingRight: 10 }}
                  onPress={() => {
                    router.push({
                      pathname: "/reportCard",
                      params: {
                        topicId: item.id.toString(),
                        topicName: item.name,
                      },
                    } as any);
                  }}
                >
                  <FontAwesome name="check-circle" size={24} color="#4CAF50" />
                  <Text style={{ color: "#007bff", fontSize: 12, fontWeight: "600" }}>Report</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}