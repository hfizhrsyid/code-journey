import { quizAPI } from "@/lib/api";
import { styles } from "@/styles/dashboard";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

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
  const size = 60;
  const strokeWidth = 6;
  const clamped = Math.max(0, Math.min(100, Math.round(percentage || 0)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Defs>
          <LinearGradient id="gradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#3fa0e9" />
            <Stop offset="100%" stopColor="#286292" />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#e2e8f0" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradBlue)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <Text style={{ position: "absolute", fontSize: 12, fontWeight: "700", color: "#1f2937" }}>{clamped}%</Text>
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
      
      // Don't mark topics as 100% - let pretest unlock starting levels instead
      const sortedTopics = [...data].sort((a, b) => a.order - b.order);
      
      let allPreviousComplete = true;
      const enrichedTopics = sortedTopics.map((topic: Materi) => {
        // Topic is only unlocked if all previous topics are complete
        const isComplete = topic.completion_percentage >= 100;
        const shouldUnlock = allPreviousComplete;
        
        // Update for next iteration
        if (!isComplete) {
          allPreviousComplete = false;
        }
        
        return {
          ...topic,
          is_locked: !shouldUnlock,
        };
      });
      
      setTopics(enrichedTopics);
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

  const goToChatbot = () => {
    router.push("/main/chatbot");
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
      <View style={styles.header}>
        <Text style={styles.brand}>CodeJourney</Text>
        <TouchableOpacity onPress={goToChatbot} style={styles.chatButton} activeOpacity={0.85}>
          <FontAwesome name="comments" size={16} color="#0f172a" />
          <Text style={styles.chatButtonText}>AI Chat</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        showsVerticalScrollIndicator={false}
        data={topics}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => goToPath(item)} style={[styles.card, item.is_locked && { opacity: 0.5, backgroundColor: "#e0e0e0" }]} activeOpacity={0.75}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Text style={[styles.cardTitle, item.is_locked && { color: "#666" }]}>{item.name}</Text>
                  {item.is_locked && <FontAwesome name="lock" size={18} color="#666" />}
                </View>
              </View>

              {/* Right side - Progress indicator atau Report Card */}
              {item.completion_percentage > 0 && item.completion_percentage < 100 && !item.is_locked && <CircularProgressDisplay percentage={item.completion_percentage} />}

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
