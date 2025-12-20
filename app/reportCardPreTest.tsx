import { useAuth } from "@/lib/AuthContext";
import { quizAPI } from "@/lib/api";
import { sessionStorage } from "@/lib/sessionStorage";
import { styles } from "@/styles/reportCard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

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

    const topicId = parseInt(params.topicId as string) || 0; // tested topic
    const topicName = (params.topicName as string) || "Topic";
    const targetTopicId = parseInt(params.targetTopicId as string) || topicId;
    const targetTopicName = (params.targetTopicName as string) || topicName;

    const [loading, setLoading] = useState(true);
    const [unlocking, setUnlocking] = useState(false);
    const [stats, setStats] = useState({
        correctAnswers: 0,
        totalQuestions: 0,
        percentage: 0,
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const attempts = await quizAPI.getUserAttempts(topicId);

            // Get unique questions attempted
            const uniqueQuestions = new Set(attempts.map((a: any) => a.question_id));
            const totalQuestions = uniqueQuestions.size;

            // Count correct answers (latest attempt per question)
            const correctCount = Array.from(uniqueQuestions).filter(qId => {
                const questionAttempts = attempts.filter((a: any) => a.question_id === qId);
                const latest = questionAttempts[questionAttempts.length - 1];
                return latest?.is_correct;
            }).length;

            const percentage = totalQuestions > 0
                ? Math.round((correctCount / totalQuestions) * 100)
                : 0;

            setStats({
                correctAnswers: correctCount,
                totalQuestions,
                percentage,
            });
        } catch (error) {
            console.error("Failed to load stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartLearning = async () => {
        setUnlocking(true);
        try {
            await sessionStorage.clearPosition(targetTopicId);
            await sessionStorage.savePretestCap(targetTopicId);
            await quizAPI.unlockTopicsUpTo(targetTopicId);
            router.replace({
                pathname: "/main/pathPage",
                params: {
                    id: targetTopicId.toString(),
                    topic: targetTopicName,
                    difficulty: "2",
                    unlockCapId: targetTopicId.toString(),
                    resetProgress: "1",
                },
            } as any);
        } catch (err) {
            console.error("Failed to unlock topics:", err);
            router.replace("/main/dashboard");
        } finally {
            setUnlocking(false);
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
                        <Text style={styles.smallText}>Skor      {stats.correctAnswers} / {stats.totalQuestions}</Text>
                        <Text style={styles.smallText}>Waktu   N/A</Text>
                    </View>

                    {/* Circle Progress */}
                    <View style={styles.circleContainer}>
                        <CircleProgress percent={stats.percentage} />
                    </View>
                </View>

                {/* HASIL */}
                <Text style={styles.sectionTitle}>Hasil</Text>
                <Text style={styles.descText}>Petualangan belajarmu dimulai dari materi</Text>

                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{targetTopicName}</Text>
                </View>

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
                        onPress={handleStartLearning}
                        disabled={unlocking}
                    >
                        <Text style={styles.outlineText}>{unlocking ? "Membuka..." : "Mulai Belajar"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

export default ReportCardPreTest;
