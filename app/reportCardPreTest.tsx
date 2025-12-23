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
    correct: number;
    total: number;
    score: number;
    recommended_difficulty: number;
}

const CircleProgress = ({ percent }: { percent: number }) => {
    const radius = 40;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const progress = circumference - (percent / 100) * circumference;

    return (
        <View style={{ justifyContent: "center", alignItems: "center" }}>
            <Svg width={100} height={100}>
                {/* Definisi gradasi */}
                <Defs>
                    <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#608699" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#9FDFFF" stopOpacity="1" />
                    </LinearGradient>
                </Defs>

                {/* Background putih */}
                <Circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="#FFFFFF"
                    strokeWidth={strokeWidth}
                    fill="none"
                />

                {/* Progress gradasi */}
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

            {/* Persentase */}
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

    useEffect(() => {
        loadResults();
    }, []);

    const loadResults = async () => {
        try {
            setLoading(true);
            
            // Get results from navigation params
            const score = parseInt(params.overall_score as string) || 0;
            const correct = parseInt(params.total_correct as string) || 0;
            const total = parseInt(params.total_questions as string) || 0;
            const recs = JSON.parse((params.recommendations as string) || "[]");
            
            setOverallScore(score);
            setTotalCorrect(correct);
            setTotalQuestions(total);
            setRecommendations(recs);

            // Save recommendations to AsyncStorage for later use
            await AsyncStorage.setItem("pretest_recommendations", JSON.stringify(recs));
            await AsyncStorage.setItem("pretest_completed", "true");
            await AsyncStorage.setItem("pretest_overall_score", score.toString());
            
            // Mark topics as skippable if user scored high enough (>=80%)
            const topicsToSkip = recs
                .filter((rec: TopicRecommendation) => rec.score >= 80)
                .map((rec: TopicRecommendation) => rec.topic_id);
            await AsyncStorage.setItem("topics_to_skip", JSON.stringify(topicsToSkip));
            
            console.log("📊 Pretest results loaded:", { 
                score, 
                correct, 
                total, 
                recommendations: recs.length,
                topicsToSkip: topicsToSkip.length 
            });
        } catch (error) {
            console.error("Failed to load pretest results:", error);
        } finally {
            setLoading(false);
        }
    };

    const getDifficultyLabel = (difficulty: number) => {
        switch (difficulty) {
            case 1: return "Mudah";
            case 2: return "Sedang";
            case 3: return "Sulit";
            default: return "Sedang";
        }
    };

    const getDifficultyColor = (difficulty: number) => {
        switch (difficulty) {
            case 1: return "#4CAF50"; // Green
            case 2: return "#FFA726"; // Orange
            case 3: return "#EF5350"; // Red
            default: return "#FFA726";
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
            {/* HEADER */}
            <View style={styles.headerRow}>
                <Image
                    source={require("../assets/images/hasil.png")}
                    style={styles.headerImage}
                    resizeMode="contain"
                />
                <Text style={styles.headerTitle}>Good Job!</Text>
            </View>

            {/* CARD */}
            <View style={styles.card}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    {/* Informasi kiri */}
                    <View>
                        <Text style={styles.name}>{user?.username || "User"}</Text>
                        <Text style={styles.smallText}>Skor      {totalCorrect} / {totalQuestions}</Text>
                        <Text style={styles.smallText}>Akurasi   {overallScore}%</Text>
                    </View>

                    {/* Circle Progress */}
                    <View style={styles.circleContainer}>
                        <CircleProgress percent={overallScore} />
                    </View>
                </View>

                {/* HASIL */}
                <Text style={styles.sectionTitle}>Rekomendasi Pembelajaran</Text>
                <Text style={styles.descText}>Berdasarkan hasil pretest, ini rekomendasi topik untuk kamu:</Text>

                {/* Topic Recommendations */}
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
                            <Text style={{ color: "#9FDFFF", fontSize: 14 }}>
                                {rec.score}%
                            </Text>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={{ color: "#B8C5D6", fontSize: 13 }}>
                                Benar: {rec.correct}/{rec.total}
                            </Text>
                            <View
                                style={{
                                    backgroundColor: getDifficultyColor(rec.recommended_difficulty),
                                    paddingHorizontal: 12,
                                    paddingVertical: 4,
                                    borderRadius: 12,
                                }}
                            >
                                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                                    Mulai dari: {getDifficultyLabel(rec.recommended_difficulty)}
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}

                {/* BUTTON */}
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
