import { quizAPI } from "@/lib/api";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TopicResults() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const topicId = parseInt(params.topicId as string);
  const topicName = params.topicName as string || "Topic";
  
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAttempts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await quizAPI.getUserAttempts(topicId);
      console.log("📊 User attempts loaded:", data.length);
      setAttempts(data);
    } catch (error) {
      console.error("Failed to load attempts:", error);
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  // Reload attempts whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAttempts();
    }, [loadAttempts])
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const correct = attempts.filter((a) => a.is_correct).length;
  const total = attempts.length || 1;
  const percentage = Math.round((correct / total) * 100);
  const isComplete = percentage === 100;

  // Calculate unique questions attempted
  const uniqueQuestions = new Set(attempts.map((a) => a.question_id)).size;

  // Calculate average attempts per question
  const avgAttempts = (total / uniqueQuestions).toFixed(1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <FontAwesome 
          name={isComplete ? "trophy" : "star"} 
          size={80} 
          color={isComplete ? "#FFD700" : "#FFA500"}
          style={{ marginBottom: 20 }}
        />

        <Text style={{ fontSize: 28, fontWeight: "bold", marginTop: 20, color: "#333" }}>
          {topicName}
        </Text>

        <Text style={{ fontSize: 48, fontWeight: "bold", marginTop: 30, color: "#007AFF" }}>
          {percentage}%
        </Text>

        <View style={{ 
          backgroundColor: "white", 
          borderRadius: 12, 
          padding: 20, 
          marginTop: 30, 
          width: "100%",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 15 }}>
            <Text style={{ fontSize: 16, color: "#666" }}>Correct Answers</Text>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#27AE60" }}>
              {correct} / {total}
            </Text>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 15 }}>
            <Text style={{ fontSize: 16, color: "#666" }}>Unique Questions</Text>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>
              {uniqueQuestions}
            </Text>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 16, color: "#666" }}>Avg Attempts/Question</Text>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>
              {avgAttempts}
            </Text>
          </View>
        </View>

        {isComplete && (
          <View style={{ 
            backgroundColor: "#E8F5E9", 
            borderRadius: 8, 
            padding: 15, 
            marginTop: 20,
            flexDirection: "row",
            alignItems: "center",
            width: "100%"
          }}>
            <FontAwesome name="check-circle" size={24} color="#27AE60" style={{ marginRight: 10 }} />
            <Text style={{ fontSize: 16, color: "#27AE60", fontWeight: "600", flex: 1 }}>
              Topic Completed! Great job 🎉
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => router.replace("/main/dashboard" as any)}
          style={{
            marginTop: 40,
            backgroundColor: "#007AFF",
            paddingVertical: 14,
            paddingHorizontal: 40,
            borderRadius: 8,
            width: "100%",
          }}
        >
          <Text style={{ 
            color: "white", 
            fontSize: 16, 
            fontWeight: "bold",
            textAlign: "center"
          }}>
            Back to Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 12,
            backgroundColor: "#E8E8E8",
            paddingVertical: 14,
            paddingHorizontal: 40,
            borderRadius: 8,
            width: "100%",
          }}
        >
          <Text style={{ 
            color: "#333", 
            fontSize: 16, 
            fontWeight: "bold",
            textAlign: "center"
          }}>
            Review Answers
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
