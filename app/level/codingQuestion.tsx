import { styles } from "@/styles/codeQuestion";
import { Text, View, TouchableOpacity, TextInput, ScrollView, SafeAreaView, ActivityIndicator, Alert } from "react-native";
import { useState, useEffect } from "react";
import { quizAPI, Question } from "@/lib/api";
import { router } from "expo-router";
import { useQuestions } from "@/lib/QuestionContext";

// helper: pastikan options selalu berupa array (toleran terhadap string JSON atau comma-list)
const normalizeQuestion = (q: any) => {
  if (!q) return q;
  try {
    if (q.options && typeof q.options === "string") {
      try {
        q.options = JSON.parse(q.options);
      } catch (e) {
        const s = String(q.options)
          .replace(/^\[|\]$/g, "")
          .replace(/"/g, "");
        q.options = s
          .split(",")
          .map((x: string) => x.trim())
          .filter(Boolean);
      }
    }
  } catch (e) {
    console.warn("normalizeQuestion error:", e);
  }
  return q;
};

export default function CodingQuestion() {
  const { questionSet, setQuestionSet, currentIndex, setCurrentIndex, difficulty } = useQuestions();

  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuestion();
  }, [currentIndex]);

  const loadQuestion = async () => {
    try {
      setLoading(true);
      setError(null);
      setAnswer("");
      setFeedback(null);

      // If we have a question set and the index exists, use it
      if (questionSet.length > 0 && currentIndex < questionSet.length) {
        let currentQuestion = questionSet[currentIndex];
        currentQuestion = normalizeQuestion(currentQuestion);
        console.log("✅ Loaded coding question from context:", currentQuestion);
        setQuestion(currentQuestion as any);
        return;
      }

      // Fallback: request a single coding question from backend and populate context
      try {
        const q = await quizAPI.generateQuestion(difficulty || 2, "coding");
        if (q) {
          const nq = normalizeQuestion(q);
          console.log("✅ Generated single coding question:", nq);
          setQuestionSet([nq]);
          setCurrentIndex(0);
          setQuestion(nq as any);
          return;
        }
      } catch (genErr) {
        console.warn("Fallback single-question generate failed:", genErr);
      }

      // If still not available, create a local mock single question
      console.warn("Using local mock coding question for UI because backend generation failed.");
      const mock = {
        question_id: 9998,
        question_text: "Contoh (mock) soal coding: Tulis program untuk print 'Hello World'",
        code_template: "# Lengkapi kode di bawah ini\nprint()",
        question_type: "coding",
        difficulty: difficulty || 2,
      };
      setQuestionSet([mock]);
      setCurrentIndex(0);
      setQuestion(mock as any);
      return;
    } catch (err: any) {
      console.error("Failed to load question:", err);
      setError(err?.message || "Gagal memuat soal");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!question || !answer.trim()) {
      setFeedback({ correct: false, message: "Silakan masukkan jawaban" });
      return;
    }

    setSubmitting(true);
    try {
      const normalizedToSend = answer.trim().toLowerCase();
      const result = await quizAPI.checkAnswer(question.question_id, normalizedToSend);
      setFeedback({
        correct: result.correct,
        message: result.feedback,
      });
    } catch (error: any) {
      console.error("Error submitting answer:", error);
      setFeedback({
        correct: false,
        message: "Gagal mengirim jawaban",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getQuestionScreenPath = (questionType: string) => {
    if (questionType === "mcq") return "multipleChoicesQuestion";
    if (questionType === "fill") return "completionQuestion";
    if (questionType === "coding") return "codingQuestion";
    return "codingQuestion";
  };

  const handleNextQuestion = async () => {
    // reset per-question UI state
    setFeedback(null);
    setAnswer("");
    setSubmitting(false);

    const nextIndex = currentIndex + 1;

    // Jika ada soal berikutnya dalam questionSet, pindah index dan navigasi bila tipe berbeda
    if (nextIndex < questionSet.length) {
      const nextQ = normalizeQuestion(questionSet[nextIndex]);
      const copy = [...questionSet];
      copy[nextIndex] = nextQ;
      setQuestionSet(copy);
      setCurrentIndex(nextIndex);

      const nextPath = getQuestionScreenPath(nextQ.question_type);
      if (nextPath !== "codingQuestion") {
        router.push(`/level/${nextPath}` as any);
      }
      return;
    }

    // Jika belum ada soal berikutnya, coba generate 1 soal lagi dari backend
    try {
      const nextType = (() => {
        if (questionSet.length > 0) {
          const lastType = questionSet[questionSet.length - 1].question_type;
          if (lastType === "mcq") return "fill";
          if (lastType === "fill") return "coding";
          return "mcq";
        }
        return "mcq";
      })() as "mcq" | "fill" | "coding";

      const newQuestion = await quizAPI.generateQuestion(difficulty || 2, nextType);
      if (newQuestion) {
        const nq = normalizeQuestion(newQuestion);
        const updated = [...questionSet, nq];
        setQuestionSet(updated);
        setCurrentIndex(nextIndex);

        const newPath = getQuestionScreenPath(nq.question_type);
        if (newPath !== "codingQuestion") {
          router.push(`/level/${newPath}` as any);
        }
        return;
      }
    } catch (err) {
      console.warn("Gagal generate soal berikutnya (coding):", err);
    }

    // Jika tidak bisa generate soal lagi, anggap selesai
    Alert.alert("Selesai!", "Anda telah menyelesaikan semua soal.", [{ text: "OK", onPress: () => router.push("/main/dashboard") }]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={{ marginTop: 10, color: "#666" }}>Memuat soal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !question) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 }}>
          <Text style={{ color: "red", marginBottom: 20, textAlign: "center" }}>{error || "Gagal memuat soal"}</Text>
          <TouchableOpacity
            style={{
              paddingHorizontal: 15,
              paddingVertical: 10,
              backgroundColor: "#0066cc",
              borderRadius: 5,
            }}
            onPress={loadQuestion}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>
            Soal {currentIndex + 1}/{Math.max(questionSet.length, 1)}
          </Text>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Coding</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.cardText}>{question.question_text}</Text>
          </View>

          {question.code_template && (
            <View style={styles.card}>
              <Text style={{ fontFamily: "monospace", fontSize: 12, color: "#333" }}>{question.code_template}</Text>
            </View>
          )}

          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              placeholder="Ketikkan Jawabanmu di sini..."
              placeholderTextColor="#999"
              multiline
              textAlignVertical="top"
              value={answer}
              onChangeText={setAnswer}
              editable={!submitting}
            />
          </View>

          {feedback && (
            <View
              style={{
                backgroundColor: feedback.correct ? "#d4edda" : "#f8d7da",
                borderColor: feedback.correct ? "#28a745" : "#dc3545",
                borderWidth: 1,
                borderRadius: 5,
                padding: 15,
                marginVertical: 10,
              }}
            >
              <Text
                style={{
                  color: feedback.correct ? "#155724" : "#721c24",
                  fontSize: 14,
                }}
              >
                {feedback.message}
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.nextButton, submitting && { opacity: 0.5 }]} onPress={handleSubmit} disabled={submitting}>
            <Text style={styles.footerButtonText}>{submitting ? "Checking..." : "Submit"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.nextButton, { marginLeft: 10 }]} onPress={handleNextQuestion} disabled={submitting}>
            <Text style={styles.footerButtonText}>{currentIndex + 1 >= 10 ? "Selesai" : "Selanjutnya"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
