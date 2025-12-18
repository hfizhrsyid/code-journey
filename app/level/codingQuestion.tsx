import { Question, quizAPI } from "@/lib/api";
import { styles } from "@/styles/codeQuestion";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useQuestions } from "../../lib/QuestionContext";

// helper: pastikan options selalu berupa array (toleran terhadap string JSON atau comma-list)
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

export default function CodingQuestion() {
  const params = useLocalSearchParams();
  const { questionSet, setQuestionSet, currentIndex, setCurrentIndex, difficulty, topic, topicId } = useQuestions();
  const effectiveTopicId = params.topicId ? parseInt(params.topicId as string) : topicId;

  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<"correct" | "wrong" | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestion = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setAnswer("");
      setFeedbackStatus(null);
      setFeedbackMessage("");
      setTestResults([]);

      // Determine which question index to use - params take priority
      const targetIndex = params.questionIndex ? parseInt(params.questionIndex as string) : currentIndex;
      console.log("🎯 CodingQuestion targetIndex:", targetIndex, "from params:", params.questionIndex, "currentIndex:", currentIndex);

      // If we have a question set and the index exists, use it
      if (questionSet.length > 0 && targetIndex >= 0 && targetIndex < questionSet.length) {
        let currentQuestion = questionSet[targetIndex];
        currentQuestion = normalizeQuestion(currentQuestion);
        console.log("✅ Loaded coding question at index", targetIndex, "ID:", currentQuestion.id || currentQuestion.question_id);
        setQuestion(currentQuestion as any);
        setCurrentIndex(targetIndex); // Update context index to match
        return;
      }

      // No questions in context - redirect to pathPage
      console.warn("⚠️ No questions in context (length:", questionSet.length, "), redirecting to pathPage...");
      router.replace("/main/pathPage" as any);
      return;

    } catch (err: any) {
      console.error("Failed to load question:", err);
      setError(err?.message || "Gagal memuat soal");
    } finally {
      setLoading(false);
    }
  }, [questionSet, currentIndex, params.questionIndex]);

  // Load question on component mount
  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const handleSubmit = async () => {
    if (!question || !answer.trim()) {
      setFeedbackMessage("Silakan masukkan jawaban");
      setFeedbackStatus("wrong");
      return;
    }

    setSubmitting(true);
    setTestResults([]);
    try {
      const questionId = question.id || question.question_id;
      console.log("📤 Submitting code for question ID:", questionId);
      
      // Try to run code with test cases first
      try {
        const result = await quizAPI.runCode(questionId, answer);
        setTestResults(result.test_results);
        setFeedbackMessage(`${result.passed}/${result.total} test cases passed`);
        setFeedbackStatus(result.all_passed ? "correct" : "wrong");
      } catch (runError: any) {
        // If runCode fails (e.g., no test cases), fall back to simple submit
        console.log("No test cases, using simple submit:", runError);
        const result = await quizAPI.submitAnswer(questionId, answer.trim().toLowerCase());
        setFeedbackMessage(result.feedback);
        setFeedbackStatus(result.correct ? "correct" : "wrong");
      }
    } catch (error: any) {
      console.error("Error submitting answer:", error);
      setFeedbackMessage("Gagal mengirim jawaban");
      setFeedbackStatus("wrong");
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
    setFeedbackStatus(null);
    setFeedbackMessage("");
    setTestResults([]);
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
      } else {
        // Same type - update local state
        setQuestion(nextQ);
        setAnswer(nextQ.code_template || "");
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
          {/* Question Card */}
          <View style={styles.card}>
            <Text style={styles.cardText}>{question.question_text}</Text>
            
            {/* Code Template - Read Only Reference */}
            {question.code_template && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.sectionLabel}>Template Kode</Text>
                <View style={styles.codeBlock}>
                  <Text style={{ 
                    fontFamily: "monospace", 
                    fontSize: 13, 
                    color: "#1f2937",
                    lineHeight: 20
                  }}>
                    {question.code_template}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Code Input Area */}
          <View style={styles.inputCard}>
            <Text style={styles.sectionLabel}>Solusi Anda</Text>
            <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
              {question.question_text.toLowerCase().includes("apa yang") || 
               question.question_text.toLowerCase().includes("output") || 
               question.question_text.toLowerCase().includes("dicetak") 
                ? "Tip: Jika pertanyaan meminta output/hasil cetak, tulis jawabannya langsung (contoh: 1 2 3 4 5)"
                : "Tulis kode Python lengkap untuk menyelesaikan soal ini"}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={
                question.question_text.toLowerCase().includes("apa yang") || 
                question.question_text.toLowerCase().includes("output") || 
                question.question_text.toLowerCase().includes("dicetak")
                  ? "Contoh: 5\\n4\\n3\\n2\\n1\\natau\\n5 4 3 2 1"
                  : "# Tulis solusi Python lengkap Anda di sini...\\nprint('Hello, World!')"
              }
              placeholderTextColor="#9ca3af"
              value={answer}
              onChangeText={setAnswer}
              multiline
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
            />
          </View>
        </ScrollView>

        <View style={styles.submitButtonContainer}>
          <TouchableOpacity style={[styles.submitButton, submitting && { opacity: 0.5 }]} onPress={handleSubmit} disabled={submitting}>
            <Text style={styles.submitText}>{submitting ? "Memeriksa..." : "Submit"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Feedback Modal - Wrong */}
      <Modal transparent visible={feedbackStatus === "wrong"} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalPositionWrapper}>
            <Image source={require("../../assets/images/emoji-wrong-answer.png")} style={styles.modalEmojiImage} />
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
                <Text style={styles.modalSubtitle}>{feedbackMessage || "Coba cek lagi kode Anda."}</Text>

                {/* Test Results Display in Modal */}
                {testResults.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ fontWeight: "600", marginBottom: 8, color: "#374151" }}>
                      Hasil Test:
                    </Text>
                    {testResults.map((result, index) => (
                      <View
                        key={index}
                        style={{
                          backgroundColor: result.passed ? "#d1fae5" : "#fee2e2",
                          borderLeftColor: result.passed ? "#10b981" : "#ef4444",
                          borderLeftWidth: 4,
                          borderRadius: 8,
                          padding: 10,
                          marginBottom: 6,
                        }}
                      >
                        <Text style={{ fontWeight: "600", marginBottom: 4, color: result.passed ? "#065f46" : "#991b1b", fontSize: 12 }}>
                          {result.passed ? "✓" : "✗"} Test Case {result.test_num}
                        </Text>
                        {result.input && (
                          <Text style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>
                            Input: {result.input}
                          </Text>
                        )}
                        <Text style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>
                          Expected: {result.expected}
                        </Text>
                        <Text style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>
                          Got: {result.actual || "(no output)"}
                        </Text>
                        {result.error && (
                          <Text style={{ fontSize: 10, color: "#991b1b", marginTop: 4, fontFamily: "monospace" }}>
                            Error: {result.error}
                          </Text>
                        )}
                      </View>
                    ))}
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
            <Image source={require("../../assets/images/emoji-correct-answer.png")} style={styles.modalEmojiImage} />
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
              <Text style={styles.modalSubtitle}>{feedbackMessage}</Text>

              {/* Test Results Display in Modal */}
              {testResults.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontWeight: "600", marginBottom: 8, color: "#374151" }}>
                    Hasil Test:
                  </Text>
                  {testResults.map((result, index) => (
                    <View
                      key={index}
                      style={{
                        backgroundColor: result.passed ? "#d1fae5" : "#fee2e2",
                        borderLeftColor: result.passed ? "#10b981" : "#ef4444",
                        borderLeftWidth: 4,
                        borderRadius: 8,
                        padding: 10,
                        marginBottom: 6,
                      }}
                    >
                      <Text style={{ fontWeight: "600", marginBottom: 4, color: result.passed ? "#065f46" : "#991b1b", fontSize: 12 }}>
                        {result.passed ? "✓" : "✗"} Test Case {result.test_num}
                      </Text>
                      {result.input && (
                        <Text style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>
                          Input: {result.input}
                        </Text>
                      )}
                      <Text style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>
                        Expected: {result.expected}
                      </Text>
                      <Text style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>
                        Got: {result.actual || "(no output)"}
                      </Text>
                    </View>
                  ))}
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
        </View>
      </Modal>
    </SafeAreaView>
  );
}
