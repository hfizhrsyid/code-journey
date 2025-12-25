import { useAuth } from "@/lib/AuthContext";
import { styles } from "@/styles/reportCard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

interface TopicRecommendation {
    topic_id: number;
    topic_name: string;
    topic_order: number;
    correct: number;
    total: number;
    score: number;
    recommended_difficulty: number;
    is_perfect: boolean;
}

const CircleProgress = ({ percent }: { percent: number }) => {
    const radius = 40;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const progress = circumference - (percent / 100) * circumference;

    return (
        <View style={{ justifyContent: "center", alignItems: "center" }}>
            <Svg width={100} height={100}>
                <Defs>
                    <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#608699" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#9FDFFF" stopOpacity="1" />
                    </LinearGradient>
                </Defs>

                <Circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="#FFFFFF"
                    strokeWidth={strokeWidth}
                    fill="none"
                />

                <Circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="url(#grad)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={progress}
                    strokeLinecap="round"
                    rotation="-90"
                    origin="50,50"
                />
            </Svg>

            <Text
                style={{
                    position: "absolute",
                    color: "#FFFFFF",
                    fontSize: 20,
                    fontWeight: "bold",
                }}
            >
                {percent}%
            </Text>
        </View>
    );
};

const ReportCardPreTest = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [recommendations, setRecommendations] = useState<TopicRecommendation[]>([]);
    const [overallScore, setOverallScore] = useState(0);
    const [totalCorrect, setTotalCorrect] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [startingTopicId, setStartingTopicId] = useState<number | null>(null);
    const [startingTopicName, setStartingTopicName] = useState<string>("");

    useEffect(() => {
        loadResults();
    }, []);

    const loadResults = async () => {
        try {
            setLoading(true);
            const score = parseInt(params.overall_score as string) || 0;
            const correct = parseInt(params.total_correct as string) || 0;
            const total = parseInt(params.total_questions as string) || 0;
            const recs = JSON.parse((params.recommendations as string) || "[]");
            const startingTopic = params.starting_topic_id ? parseInt(params.starting_topic_id as string) : null;
            const perfectTopics = JSON.parse((params.perfect_topics as string) || "[]");
            
            setOverallScore(score);
            setTotalCorrect(correct);
            setTotalQuestions(total);
            setRecommendations(recs);
            setStartingTopicId(startingTopic);
            if (startingTopic) {
                const startTopic = recs.find((r: TopicRecommendation) => r.topic_id === startingTopic);
                setStartingTopicName(startTopic?.topic_name || "");
            }

            await AsyncStorage.setItem("pretest_recommendations", JSON.stringify(recs));
            await AsyncStorage.setItem("pretest_completed", "true");
            await AsyncStorage.setItem("pretest_overall_score", score.toString());
            await AsyncStorage.setItem("pretest_starting_topic_id", startingTopic ? startingTopic.toString() : "");
            await AsyncStorage.setItem("pretest_perfect_topics", JSON.stringify(perfectTopics));
            const topicsToSkip = recs
                .filter((rec: TopicRecommendation) => rec.score >= 80)
                .map((rec: TopicRecommendation) => rec.topic_id);
            await AsyncStorage.setItem("topics_to_skip", JSON.stringify(topicsToSkip));
            
            console.log("📊 Pretest results loaded:", { 
                score, 
                correct, 
                total, 
                recommendations: recs.length,
                topicsToSkip: topicsToSkip.length,
                startingTopic,
                perfectTopics: perfectTopics.length
            });
        } catch (error) {
            console.error("Failed to load pretest results:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1A233A" }}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={{ color: "#fff", marginTop: 10 }}>Loading results...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerRow}>
                <Image
                    source={require("../assets/images/hasil.png")}
                    style={styles.headerImage}
                    resizeMode="contain"
                />
                <Text style={styles.headerTitle}>Good Job!</Text>
            </View>

            <View style={styles.card}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <View>
                        <Text style={styles.name}>{user?.username || "User"}</Text>
                        <Text style={styles.smallText}>Skor      {totalCorrect} / {totalQuestions}</Text>
                        <Text style={styles.smallText}>Akurasi   {overallScore}%</Text>
                    </View>

                    <View style={styles.circleContainer}>
                        <CircleProgress percent={overallScore} />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Hasil Pretest</Text>
                {startingTopicName ? (
                    <View style={{ backgroundColor: "#FFF3CD", padding: 12, borderRadius: 8, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: "#FFA726" }}>
                        <Text style={{ color: "#856404", fontSize: 14, fontWeight: "600" }}>
                            🎯 Kamu akan mulai belajar dari topik:
                        </Text>
                        <Text style={{ color: "#856404", fontSize: 16, fontWeight: "bold", marginTop: 4 }}>
                            {startingTopicName}
                        </Text>
                        <Text style={{ color: "#856404", fontSize: 12, marginTop: 4 }}>
                            Topik-topik sebelumnya sudah dikuasai!
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.descText}>Selamat! Kamu sudah menguasai semua topik pretest!</Text>
                )}
                
                <Text style={styles.sectionTitle}>Detail per Topik</Text>

                {recommendations.map((rec: TopicRecommendation, index) => (
                    <View
                        key={index}
                        style={{
                            backgroundColor: "#2C3E50",
                            padding: 15,
                            borderRadius: 10,
                            marginTop: 12,
                        }}
                    >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold", flex: 1 }}>
                                {rec.topic_name}
                            </Text>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Text style={{ color: "#9FDFFF", fontSize: 14 }}>
                                    {rec.score}%
                                </Text>
                                {rec.is_perfect && (
                                    <Text style={{ color: "#4CAF50", fontSize: 12 }}>✓</Text>
                                )}
                            </View>
                        </View>
                        <Text style={{ color: "#B8C5D6", fontSize: 13 }}>
                            Benar: {rec.correct}/{rec.total}
                        </Text>
                    </View>
                ))}

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.outlineButton}
                        onPress={() => router.push("/testResult")}
                    >
                        <Text style={styles.outlineText}>Hasil Saya</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.outlineButton}
                        onPress={() => router.push("/main/dashboard")}
                    >
                        <Text style={styles.outlineText}>Mulai Belajar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

export default ReportCardPreTest;
