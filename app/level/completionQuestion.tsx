import { Question, quizAPI } from "@/lib/api";
import { styles } from "@/styles/completionQuestion";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useQuestions } from "../../lib/QuestionContext";

export default function CompletionQuestion() {
  const params = useLocalSearchParams();
  const { questionSet, setQuestionSet, currentIndex, setCurrentIndex, difficulty, topic, topicId } = useQuestions();
  const effectiveTopicId = params.topicId ? parseInt(params.topicId as string) : topicId;

  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<"correct" | "wrong" | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [explanation, setExplanation] = useState<string>("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadQuestion = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setAnswer("");
      setExplanation("");
      setFeedbackStatus(null);
      setFeedback("");
      // Determine which question index to use
      const targetIndex = params.questionIndex ? parseInt(params.questionIndex as string) : currentIndex;

      if (questionSet.length === 0 || targetIndex >= questionSet.length) {
        setError("Soal tidak ditemukan");
        return;
      }

      let currentQuestion = questionSet[targetIndex];
      currentQuestion = normalizeQuestion(currentQuestion);
      console.log("✅ Loaded question from context:", currentQuestion);
      console.log("📋 Question options:", currentQuestion.options);
      setQuestion(currentQuestion);
      setCurrentIndex(targetIndex); // Update context index to match
    } catch (error: any) {
      console.error("Failed to load question:", error);
      setError(error.message || "Gagal memuat soal");
    } finally {
      setLoading(false);
    }
  }, [questionSet, currentIndex]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const handleSubmit = async () => {
    if (!question || !answer.trim()) {
      setFeedback("Silakan masukkan jawaban");
      setFeedbackStatus("wrong");
      return;
    }

    setSubmitting(true);
    try {
      const normalizedToSend = answer.trim().toLowerCase();
      const questionId = question.id || question.question_id;
      const result = await quizAPI.submitAnswer(questionId, normalizedToSend);

      if (result.correct) {
        setFeedback(result.feedback || "Benar! Periksa formatting dan detail kecil jika perlu.");
        setFeedbackStatus("correct");
        setExplanation(result.explanation || "");
      } else {
        setFeedback(result.feedback || "Coba cek kembali format jawaban dan konsep dasarnya.");
        setFeedbackStatus("wrong");
        setExplanation(result.explanation || "");
      }
    } catch (error: any) {
      console.error("Error submitting answer:", error);
      setFeedbackStatus("wrong");
      setFeedback("Gagal mengirim jawaban");
    } finally {
      setSubmitting(false);
    }
  };

  const getQuestionScreenPath = (questionType: string) => {
    if (questionType === "mcq") return "multipleChoicesQuestion";
    if (questionType === "fill") return "completionQuestion";
    if (questionType === "coding") return "codingQuestion";
    return "completionQuestion";
  };

  const handleNextQuestion = async () => {
    // reset any per-question UI state
    setFeedbackStatus(null);
    setExplanation("");
    setFeedback("");
    setSubmitting(false);

    const nextIndex = currentIndex + 1;

    if (nextIndex < questionSet.length) {
      const nextQ = normalizeQuestion(questionSet[nextIndex]);
      const copy = [...questionSet];
      copy[nextIndex] = nextQ;
      setQuestionSet(copy);
      setCurrentIndex(nextIndex);

      const nextPath = getQuestionScreenPath(nextQ.question_type);
      if (nextPath !== "completionQuestion") {
        router.push(`/level/${nextPath}` as any);
      } else {
        // Same type - update local state
        setQuestion(nextQ);
        setUserAnswer("");
      }
      return;
    }

    // No more questions - navigate to results
    console.log("✅ All questions completed, navigating to results...");

    // Navigate to results screen
    router.push({
      pathname: "/main/topicResults",
      params: { 
        topicId: effectiveTopicId.toString(),
        topicName: topic
      }
    } as any);
  };

  const emojiWrongSource = require("../../assets/images/emoji-wrong-answer.png");
  const emojiCorrectSource = require("../../assets/images/emoji-correct-answer.png");

  // helper to coerce options into an array
  const normalizeQuestion = (q: any) => {
    if (!q) return q;
    try {
      if (q.options && typeof q.options === "string") {
        try {
          q.options = JSON.parse(q.options);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={{ marginTop: 10, color: "#666" }}>Memuat soal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !question) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 }}>
          <Text style={{ color: "#ff0000", fontSize: 16, textAlign: "center", marginBottom: 20 }}>{error || "Gagal memuat soal"}</Text>
          <TouchableOpacity
            style={{
              paddingHorizontal: 20,
              paddingVertical: 12,
              backgroundColor: "#0066cc",
              borderRadius: 8,
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
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Soal {currentIndex + 1}/10</Text>
          <TouchableOpacity style={styles.rulesButton}>
            <Text style={styles.rulesButtonText}>Isi Kosong</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.questionText}>{question.question_text}</Text>

          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{question.code_template || ""}</Text>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ketikkan Jawabanmu di sini"
            placeholderTextColor="#8898AA"
            value={answer}
            onChangeText={setAnswer}
            editable={!submitting}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            blurOnSubmit={false}
            returnKeyType="default"
          />
        </View>
      </ScrollView>

      <View style={styles.submitButtonContainer}>
        <TouchableOpacity style={[styles.submitButton, submitting && { opacity: 0.5 }]} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitText}>{submitting ? "Memeriksa..." : "Submit"}</Text>
        </TouchableOpacity>
      </View>

      {/* Feedback Modal - Wrong */}
      <Modal transparent visible={feedbackStatus === "wrong"} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalPositionWrapper}>
            <Image source={emojiWrongSource} style={styles.modalEmojiImage} />
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeLabel}
                onPress={() => {
                  setFeedbackStatus(null);
                  setAnswer("");
                }}
              >
                <Text style={styles.closeIcon}>✕</Text>
                <Text style={styles.closeText}>Tutup</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Jawaban kamu kurang tepat!</Text>

              <ScrollView style={{ maxHeight: 300 }}>
                <Text style={styles.modalSubtitle}>{feedback || "Coba cek lagi konsep dasarnya."}</Text>

                {explanation && (
                  <View style={{ marginTop: 10, padding: 12, backgroundColor: "#e8f4f8", borderRadius: 8 }}>
                    <Text style={{ fontWeight: "bold", color: "#333", marginBottom: 5 }}>Penjelasan:</Text>
                    <Text style={{ color: "#555", fontSize: 13, lineHeight: 18 }}>{explanation}</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Feedback Modal - Correct */}
      <Modal transparent visible={feedbackStatus === "correct"} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalPositionWrapper}>
            <Image source={emojiCorrectSource} style={styles.modalEmojiImage} />
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeLabel}
                onPress={() => {
                  setFeedbackStatus(null);
                  setAnswer("");
                }}
              >
                <Text style={styles.closeIcon}>✕</Text>
                <Text style={styles.closeText}>Tutup</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Sempurna! 🎉</Text>
              <Text style={styles.modalSubtitle}>{feedback}</Text>

              {explanation && (
                <View style={{ marginTop: 10, padding: 12, backgroundColor: "#e8f4f8", borderRadius: 8 }}>
                  <Text style={{ fontWeight: "bold", color: "#333", marginBottom: 5 }}>Penjelasan:</Text>
                  <Text style={{ color: "#555", fontSize: 13, lineHeight: 18 }}>{explanation}</Text>
                </View>
              )}

              <View style={styles.nextButtonRow}>
                <TouchableOpacity 
                  style={[styles.nextButton, { backgroundColor: '#6c757d', marginRight: 8, flex: 1 }]} 
                  onPress={() => router.back()}
                >
                  <Text style={styles.nextButtonText}>Kembali ke Path</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.nextButton, { flex: 1 }]} 
                  onPress={handleNextQuestion}
                >
                  <Text style={styles.nextButtonText}>{currentIndex + 1 >= 10 ? "Selesai" : "Level Selanjutnya"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>    </Modal>
    </SafeAreaView>
  );
}

