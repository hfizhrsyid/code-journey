import { useQuestions } from "@/lib/QuestionContext";
import { quizAPI } from "@/lib/api";
import { styles } from "@/styles/startTest";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Text, TouchableOpacity, View } from "react-native";

const PRETEST_MAX_QUESTIONS = 3;

const Test = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const levelIndex = Number.isFinite(parseInt(params.level as string)) ? parseInt(params.level as string) : 0;
  const selectedTopic = (params.topic as string) || undefined;
  const difficultyFromLevel = useMemo(() => {
    const raw = Math.ceil(((levelIndex ?? 0) + 1) / 2);
    return Math.min(3, Math.max(1, raw));
  }, [levelIndex]);

  const { setQuestionSet, setCurrentIndex, setTopic, setTopicId, setDifficulty, setMode, resetPretest, setPretestTopics, setPretestPending } = useQuestions();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getQuestionScreenPath = (questionType: string) => {
    if (questionType === "mcq") return "multipleChoicesQuestion";
    if (questionType === "fill") return "completionQuestion";
    if (questionType === "coding") return "codingQuestion";
    return "multipleChoicesQuestion";
  };

  const buildAdaptivePretest = async () => {
    const topics = await quizAPI.getTopics();
    const sortedTopics = Array.isArray(topics) ? [...topics].sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) : [];

    const filteredTopics = selectedTopic ? sortedTopics.filter((t: any) => (t.name || "").toLowerCase() === selectedTopic.toLowerCase()) : sortedTopics;

    const initialQuestions: any[] = [];
    const pendingMap: Record<number, any[]> = {};
    const topicsMeta: { id: number; name: string; order?: number }[] = [];

    for (const topic of filteredTopics) {
      if (initialQuestions.length >= PRETEST_MAX_QUESTIONS) break;
      try {
        const bank = await quizAPI.getQuestions(topic.id, difficultyFromLevel);
        const mcq = (bank || []).filter((q: any) => q.question_type === "mcq");
        const fill = (bank || []).filter((q: any) => q.question_type === "fill");

        const candidates = [...mcq, ...fill];
        if (candidates.length === 0) continue;

        const normalize = (q: any) => ({
          ...q,
          topic_id: topic.id,
          topic_name: topic.name,
        });

        const slots = PRETEST_MAX_QUESTIONS - initialQuestions.length;
        const picked = candidates.slice(0, slots).map(normalize);
        const pending = candidates.slice(slots).map(normalize);

        initialQuestions.push(...picked);
        pendingMap[topic.id] = pending;
        topicsMeta.push({ id: topic.id, name: topic.name, order: topic.order });
      } catch (err) {
        console.warn(`Gagal memuat soal pre-test untuk ${topic.name}:`, err);
      }
    }

    if (initialQuestions.length === 0) {
      throw new Error("Pre-test belum tersedia. Coba lagi nanti.");
    }

    return { initialQuestions, topicsMeta, pendingMap };
  };

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    resetPretest();

    try {
      const { initialQuestions, topicsMeta, pendingMap } = await buildAdaptivePretest();

      setMode("pretest");
      setTopic("Pre-Test");
      setTopicId(0);
      setDifficulty(difficultyFromLevel);
      setQuestionSet(initialQuestions);
      setPretestTopics(topicsMeta);
      setPretestPending(pendingMap);
      setCurrentIndex(0);

      const firstPath = getQuestionScreenPath(initialQuestions[0].question_type);
      router.push(`/level/${firstPath}` as any);
    } catch (err: any) {
      const message = err?.message || "Gagal menyiapkan pre-test";
      setError(message);
      Alert.alert("Pre-test", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}> Test Your Skills with CodeJourney!</Text>

      <Image source={require("../assets/images/test.png")} style={styles.image} resizeMode="contain" />

      {selectedTopic ? <Text style={{ color: "#dce6f7", marginBottom: 12, fontWeight: "600" }}>Materi dipilih: {selectedTopic}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleStart} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Mulai</Text>}
      </TouchableOpacity>

      {error ? <Text style={{ color: "#ffdddd", marginTop: 12, textAlign: "center" }}>{error}</Text> : null}
    </View>
  );
};

export default Test;
