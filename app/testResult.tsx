import { getPretestRecommendations, getPretestScore, getSkippableTopics, isPretestCompleted } from "@/lib/pretestHelper";
import { styles } from "@/styles/testResult";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

interface TopicRecommendation {
    topic_id: number;
    topic_name: string;
    correct: number;
    total: number;
    score: number;
    recommended_difficulty: number;
}

const TestResult = () => {
    const [loading, setLoading] = useState(true);
    const [hasPretest, setHasPretest] = useState(false);
    const [recommendations, setRecommendations] = useState<TopicRecommendation[]>([]);
    const [skippableTopics, setSkippableTopics] = useState<number[]>([]);
    const [overallScore, setOverallScore] = useState(0);

    useEffect(() => {
        loadResults();
    }, []);

    const loadResults = async () => {
        try {
            setLoading(true);
            const completed = await isPretestCompleted();
            setHasPretest(completed);

            if (completed) {
                const recs = await getPretestRecommendations();
                const skippable = await getSkippableTopics();
                const score = await getPretestScore();
                
                setRecommendations(recs);
                setSkippableTopics(skippable);
                setOverallScore(score);
            }
        } catch (error) {
            console.error("Failed to load test results:", error);
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

    const getStatusLabel = (topicId: number) => {
        return skippableTopics.includes(topicId) ? "✓ Dikuasai" : "📚 Perlu Belajar";
    };

    const getStatusColor = (topicId: number) => {
        return skippableTopics.includes(topicId) ? "#4CAF50" : "#FFA726";
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color="#0066cc" />
                <Text style={{ color: "#fff", marginTop: 10 }}>Memuat hasil...</Text>
            </View>
        );
    }

    if (!hasPretest) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.hasil}>Hasil Saya</Text>
                </View>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
                    <Text style={{ color: "#fff", fontSize: 16, textAlign: "center" }}>
                        Kamu belum mengambil pretest.{"\n"}Silakan ambil pretest terlebih dahulu.
                    </Text>
                </View>
            </View>
        );
    }

    // Find first topic that needs learning (score < 80%)
    const firstTopicToLearn = recommendations.find(rec => !skippableTopics.includes(rec.topic_id));

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.hasil}>Hasil Pretest Saya</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 200, padding: 20 }}>
                {/* Overall Score Card */}
                <View style={{
                    backgroundColor: "#2C3E50",
                    padding: 20,
                    borderRadius: 15,
                    marginBottom: 20,
                    alignItems: "center"
                }}>
                    <Text style={{ color: "#9FDFFF", fontSize: 16, marginBottom: 10 }}>
                        Skor Keseluruhan
                    </Text>
                    <Text style={{ color: "#fff", fontSize: 48, fontWeight: "bold" }}>
                        {overallScore}%
                    </Text>
                    <Text style={{ color: "#B8C5D6", fontSize: 14, marginTop: 5 }}>
                        {skippableTopics.length} topik dikuasai dari {recommendations.length} topik
                    </Text>
                </View>

                {/* Recommendation: Where to start */}
                {firstTopicToLearn && (
                    <View style={{
                        backgroundColor: "#1A4D7A",
                        padding: 20,
                        borderRadius: 15,
                        marginBottom: 20,
                        borderWidth: 2,
                        borderColor: "#0066cc"
                    }}>
                        <Text style={{ color: "#9FDFFF", fontSize: 14, marginBottom: 5 }}>
                            🎯 Rekomendasi Mulai Belajar:
                        </Text>
                        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 5 }}>
                            {firstTopicToLearn.topic_name}
                        </Text>
                        <Text style={{ color: "#B8C5D6", fontSize: 14 }}>
                            Level: {getDifficultyLabel(firstTopicToLearn.recommended_difficulty)}
                        </Text>
                    </View>
                )}

                {/* Topic Results */}
                <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 15 }}>
                    Hasil Per Topik
                </Text>

                {recommendations.map((rec, index) => {
                    const isSkippable = skippableTopics.includes(rec.topic_id);
                    
                    return (
                        <View
                            key={index}
                            style={{
                                backgroundColor: isSkippable ? "#2C4A3E" : "#2C3E50",
                                padding: 15,
                                borderRadius: 10,
                                marginBottom: 12,
                                borderWidth: isSkippable ? 2 : 0,
                                borderColor: isSkippable ? "#4CAF50" : "transparent"
                            }}
                        >
                            {/* Topic Name & Score */}
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold", flex: 1 }}>
                                    {rec.topic_name}
                                </Text>
                                <Text style={{ 
                                    color: rec.score >= 80 ? "#4CAF50" : rec.score >= 50 ? "#FFA726" : "#EF5350", 
                                    fontSize: 18,
                                    fontWeight: "bold"
                                }}>
                                    {rec.score}%
                                </Text>
                            </View>

                            {/* Details */}
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <View>
                                    <Text style={{ color: "#B8C5D6", fontSize: 13 }}>
                                        Benar: {rec.correct}/{rec.total}
                                    </Text>
                                    <Text style={{ 
                                        color: getStatusColor(rec.topic_id), 
                                        fontSize: 13, 
                                        fontWeight: "600",
                                        marginTop: 4 
                                    }}>
                                        {getStatusLabel(rec.topic_id)}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        backgroundColor: getDifficultyColor(rec.recommended_difficulty),
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        borderRadius: 12,
                                    }}
                                >
                                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                                        {getDifficultyLabel(rec.recommended_difficulty)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    );
                })}

                {/* Legend */}
                <View style={{ 
                    marginTop: 20, 
                    padding: 15, 
                    backgroundColor: "#1A2332",
                    borderRadius: 10 
                }}>
                    <Text style={{ color: "#9FDFFF", fontSize: 14, fontWeight: "bold", marginBottom: 10 }}>
                        Keterangan:
                    </Text>
                    <Text style={{ color: "#B8C5D6", fontSize: 12, marginBottom: 5 }}>
                        • ✓ Dikuasai (≥80%): Kamu bisa skip topik ini
                    </Text>
                    <Text style={{ color: "#B8C5D6", fontSize: 12 }}>
                        • 📚 Perlu Belajar (&lt;80%): Mulai dari level yang direkomendasikan
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default TestResult;
