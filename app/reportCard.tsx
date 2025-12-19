import { useAuth } from "@/lib/AuthContext";
import { quizAPI } from "@/lib/api";
import { styles } from "@/styles/reportCardMateri";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";

const CircleProgress = ({ percent }: { percent: number }) => {
  const radius = 40;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (percent / 100) * circumference;

  return (
    <View style={{ justifyContent: "center", alignItems: "center", position: "relative" }}>
      <Svg width={120} height={120} viewBox="0 0 120 120">
        {/* Definisi gradasi */}
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#608699" stopOpacity="1" />
            <Stop offset="100%" stopColor="#9FDFFF" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Background circle */}
        <Circle cx="60" cy="60" r={radius} stroke="#E0E0E0" strokeWidth={strokeWidth} fill="none" />

        {/* Progress gradasi */}
        <Circle
          cx="60"
          cy="60"
          r={radius}
          stroke="url(#grad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          rotation="-90"
          origin="60,60"
        />

        {/* Angka persentase */}
        <SvgText x="60" y="70" textAnchor="middle" fontSize="32" fontWeight="bold" fill="#286292">
          {percent}%
        </SvgText>
      </Svg>
    </View>
  );
};

const ReportCard = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const topicId = parseInt(params.topicId as string) || 0;
  const topicName = (params.topicName as string) || "Topic";

  const [loading, setLoading] = useState(true);
  const [nextTopic, setNextTopic] = useState<any>(null);
  const [stats, setStats] = useState({
    correctAnswers: 0,
    totalQuestions: 0,
    percentage: 0,
  });

  useEffect(() => {
    loadStats();
    loadNextTopic();
  }, [topicId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const attempts = await quizAPI.getUserAttempts(topicId);

      // Get unique questions attempted
      const uniqueQuestions = new Set(attempts.map((a: any) => a.question_id));
      const totalQuestions = uniqueQuestions.size;

      // Count correct answers (latest attempt per question)
      const correctCount = Array.from(uniqueQuestions).filter((qId) => {
        const questionAttempts = attempts.filter((a: any) => a.question_id === qId);
        const latest = questionAttempts[questionAttempts.length - 1];
        return latest?.is_correct;
      }).length;

      const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

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

  const loadNextTopic = async () => {
    try {
      // Ambil semua topik dan cari yang berikutnya
      const topics = await quizAPI.getTopics();
      const currentIndex = topics.findIndex((t: any) => t.id === topicId);

      if (currentIndex !== -1 && currentIndex < topics.length - 1) {
        setNextTopic(topics[currentIndex + 1]);
      }
    } catch (error) {
      console.error("Failed to load next topic:", error);
    }
  };

  const handleNextLevel = () => {
    console.log("🔄 Next topic:", nextTopic);

    if (nextTopic) {
      const pathname = "/main/pathPage";
      const params = {
        id: nextTopic.id.toString(),
        topic: nextTopic.name,
        difficulty: "2",
      };

      console.log(`📍 Navigating to ${pathname}`, params);

      // Coba push dulu
      try {
        router.push({
          pathname,
          params,
        } as any);
      } catch (error) {
        console.error("❌ Navigation error:", error);
        // Fallback ke dashboard
        router.replace("/main/dashboard");
      }
    } else {
      console.log("✅ No more topics, back to dashboard");
      router.replace("/main/dashboard");
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
      {/* HEADER - Good Job! */}
      <View style={styles.headerRow}>
        <Image source={require("../assets/images/hasil.png")} style={styles.headerImage} resizeMode="contain" />
        <Text style={styles.headerTitle}>Good Job!</Text>
      </View>

      {/* MAIN CARD */}
      <View style={styles.card}>
        {/* SECTION 1: Mingyuuuu - Accuracy */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Mingyuuuu</Text>
          <View style={styles.accuracyRow}>
            <View style={styles.accuracyLeft}>
              <Text style={styles.labelSmall}>Akurasi</Text>
              <Text style={styles.percentageText}>{stats.percentage}%</Text>
              <Text style={styles.labelSmall}>Waktu</Text>
              <Text style={styles.timeText}>5 hari</Text>
            </View>

            <View style={styles.circleContainer}>
              <CircleProgress percent={stats.percentage} />
            </View>
          </View>
        </View>

        {/* DIVIDER */}
        <View style={styles.divider} />

        {/* SECTION 2: Hasil - Menampilkan materi berikutnya */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hasil</Text>
          <Text style={styles.resultMessage}>Hore! Kamu telah menyelesaikan materi ini. Saatnya lanjut ke materi</Text>

          {nextTopic ? (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{nextTopic.name}</Text>
            </View>
          ) : (
            <Text style={styles.resultMessage}>✅ Kamu telah menyelesaikan semua materi!</Text>
          )}
        </View>

        {/* DIVIDER */}
        <View style={styles.divider} />

        {/* SECTION 3: Rekapitulasi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rekapitulasi</Text>
          <Text style={styles.recapText}>
            Kamu belajar 30% lebih cepat (cepat/lambat) dibanding waktu materi {topicName}. Di materi ini, kamu berhasil kerja hingga tunggal level 5 kali. Terus Semangat!
          </Text>
        </View>

        {/* BUTTON */}
        <TouchableOpacity style={styles.nextLevelButton} onPress={handleNextLevel}>
          <Text style={styles.nextLevelText}>{nextTopic ? "Level Selanjutnya" : "Kembali ke Dashboard"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ReportCard;
