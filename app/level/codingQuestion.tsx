import { Question, quizAPI, validateQuestion } from "@/lib/api";
import { styles } from "@/styles/codeQuestion";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, Alert } from "react-native";
import { useQuestions } from "../../lib/QuestionContext";
import { useFocusEffect } from "@react-navigation/native";
import React from "react";

// helper: pastikan options selalu berupa array dan bawa metadata topik
const normalizeQuestion = (q: any, fallbackTopicId?: number, fallbackTopicName?: string) => {
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

    // ensure topic metadata is preserved for newly generated questions
    if (!q.topic_id && typeof fallbackTopicId !== "undefined") q.topic_id = fallbackTopicId;
    if (!q.topic_name && q.topic) q.topic_name = q.topic;
    if (!q.topic_name && fallbackTopicName) q.topic_name = fallbackTopicName;
  } catch (e) {
    console.warn("normalizeQuestion error:", e);
  }
  return q;
};

export default function CodingQuestion() {
  const params = useLocalSearchParams();

  const { questionSet, setQuestionSet, currentIndex, setCurrentIndex, difficulty, topic, topicId, savePosition } = useQuestions();

  // ✅ READ questionIndex dari params jika ada (user klik node lama)
  const paramQuestionIndex = params.questionIndex ? parseInt(params.questionIndex as string) : null;

  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<"correct" | "wrong" | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRetried, setAutoRetried] = useState(false);
  const [prevTopicId, setPrevTopicId] = useState<number | null>(null);
  const [hasAppliedParamIndex, setHasAppliedParamIndex] = useState(false);
  const MAX_QUESTIONS = 10;

  const loadQuestion = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setAnswer("");
      setFeedbackStatus(null);
      setFeedbackMessage("");
      setTestResults([]);

      // ✅ GUNAKAN paramQuestionIndex jika ada (user klik node lama)
      // Jika tidak ada, gunakan currentIndex (normal flow)
      const indexToUse = !hasAppliedParamIndex && paramQuestionIndex !== null ? paramQuestionIndex : currentIndex;

      console.log(`📖 [Coding] Loading question: index=${indexToUse}, fromParam=${paramQuestionIndex !== null}`);

      const safeIndex = questionSet.length > 0 ? Math.min(Math.max(indexToUse, 0), questionSet.length - 1) : 0;

      // ✅ ALWAYS sync currentIndex with the index we're using
      // This ensures context state matches the actual question being displayed
      if (safeIndex !== currentIndex) {
        setCurrentIndex(safeIndex);
      }
      if (!hasAppliedParamIndex && paramQuestionIndex !== null) {
        setHasAppliedParamIndex(true);
      }

      const hydrateFromServer = async () => {
        try {
          const fetched = await quizAPI.getQuestions(topicId || topic, difficulty || 2);
          if (fetched && fetched.length > 0) {
            const normalized = fetched.map((q: any) => normalizeQuestion(q, topicId, topic));
            const nextSafe = Math.min(Math.max(safeIndex, 0), normalized.length - 1);
            setQuestionSet(normalized);
            setCurrentIndex(nextSafe);
            setQuestion(normalized[nextSafe] as any);
            return true;
          }
        } catch (fetchErr) {
          console.warn("Hydrate coding from server failed:", fetchErr);
        }
        return false;
      };

      // If we have a question set and the index exists, use it
      if (questionSet.length > 0 && safeIndex < questionSet.length) {
        let currentQuestion = questionSet[safeIndex];
        currentQuestion = normalizeQuestion(currentQuestion, topicId, topic);

        // Validate question
        const validation = validateQuestion(currentQuestion);
        if (!validation.valid) {
          setError(validation.error || "Soal tidak valid");
          return;
        }

        console.log("✅ Loaded coding question from context:", currentQuestion);
        setQuestion(currentQuestion as any);
        return;
      }

      // Try to hydrate from server before generating
      const hydrated = await hydrateFromServer();
      if (hydrated) return;

      // Fallback: request a single coding question from backend and populate context
      try {
        const q = await quizAPI.generateQuestion(difficulty || 2, "coding", { id: topicId, name: topic });
        if (q) {
          const nq = normalizeQuestion(q, topicId, topic);

          // Validate generated question
          const validation = validateQuestion(nq);
          if (!validation.valid) {
            setError(validation.error || "Soal yang dihasilkan tidak valid");
            return;
          }

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
  }, [questionSet, paramQuestionIndex, currentIndex, difficulty, topicId, topic, setQuestionSet, setCurrentIndex, hasAppliedParamIndex]);

  // Load question on component mount
  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  // Trigger loadQuestion ketika screen fokus untuk memastikan data selalu fresh
  useFocusEffect(
    React.useCallback(() => {
      loadQuestion();
    }, [loadQuestion])
  );

  // Auto-retry sekali ketika error muncul
  useEffect(() => {
    if (!loading && error && !autoRetried) {
      setAutoRetried(true);
      loadQuestion();
    }
  }, [loading, error, autoRetried, loadQuestion]);

  // ✅ RESET STATE HANYA KETIKA TOPIC BENAR-BENAR BERUBAH
  useEffect(() => {
    if (prevTopicId !== null && topicId !== prevTopicId) {
      console.log(`🔄 Topic changed from ${prevTopicId} to ${topicId}, resetting state`);
      setQuestion(null);
      setAnswer("");
      setFeedbackStatus(null);
      setFeedbackMessage("");
      setTestResults([]);
      setError(null);
      setAutoRetried(false);
    }
    setPrevTopicId(topicId);
  }, [topicId, prevTopicId]);

  const handleSubmit = async () => {
    if (!question || !answer.trim()) {
      setFeedbackMessage("Silakan masukkan jawaban");
      setFeedbackStatus("wrong");
      return;
    }

    setSubmitting(true);
    setTestResults([]);
    try {
      // Try to run code with test cases first
      try {
        const result = await quizAPI.runCode(question.question_id, answer);
        setTestResults(result.test_results);
        setFeedbackMessage(`${result.passed}/${result.total} test cases passed`);
        setFeedbackStatus(result.all_passed ? "correct" : "wrong");
      } catch (runError: any) {
        // If runCode fails (e.g., no test cases), fall back to simple submit
        console.log("No test cases, using simple submit:", runError);
        const result = await quizAPI.submitAnswer(question.question_id, answer.trim().toLowerCase());

        if (result.newly_unlocked_badges && result.newly_unlocked_badges.length > 0) {
          const badgeNames = result.newly_unlocked_badges.map((b) => b.badge_name).join("\n");
          Alert.alert("🏆 Badge Baru!", `Selamat! Anda mendapatkan badge:\n\n${badgeNames}`, [{ text: "OK" }]);
        }

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

    // ✅ CEK APAKAH SUDAH MENCAPAI LIMIT 10 SOAL
    if (nextIndex >= MAX_QUESTIONS) {
      console.log(`✅ Sudah mencapai ${MAX_QUESTIONS} soal, navigasi ke reportCard`);
      router.push({
        pathname: "/reportCard",
        params: {
          topicId: topicId.toString(),
          topicName: topic,
        },
      } as any);
      return;
    }

    // Jika ada soal berikutnya dalam questionSet, pindah index dan navigasi bila tipe berbeda
    if (nextIndex < questionSet.length) {
      const nextQ = normalizeQuestion(questionSet[nextIndex], topicId, topic);
      const copy = [...questionSet];
      copy[nextIndex] = nextQ;
      setQuestionSet(copy);
      setCurrentIndex(nextIndex);
      setQuestion(nextQ as any);

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

      const newQuestion = await quizAPI.generateQuestion(difficulty || 2, nextType, { id: topicId, name: topic });
      if (newQuestion) {
        const nq = normalizeQuestion(newQuestion, topicId, topic);
        const updated = [...questionSet, nq];
        setQuestionSet(updated);
        setCurrentIndex(nextIndex);
        setQuestion(nq as any);

        const newPath = getQuestionScreenPath(nq.question_type);
        if (newPath !== "codingQuestion") {
          router.push(`/level/${newPath}` as any);
        }
        return;
      }
    } catch (err) {
      console.warn("Gagal generate soal berikutnya (coding):", err);
    }

    // Jika tidak ada soal baru yang bisa diambil, anggap selesai
    router.push({
      pathname: "/reportCard",
      params: {
        topicId: topicId.toString(),
        topicName: topic,
      },
    } as any);
  };

  // ✅ SIMPAN POSISI SAAT KELUAR SCREEN
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // Ini dipanggil saat screen kehilangan focus (user keluar)
        savePosition();
      };
    }, [topicId, currentIndex, topic, difficulty, savePosition])
  );

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

  const emojiWrongSource = require("../../assets/images/emoji-wrong-answer.png");
  const emojiCorrectSource = require("../../assets/images/emoji-correct-answer.png");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerText}>
              Soal {currentIndex + 1}/{questionSet.length}
            </Text>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Coding</Text>
            </TouchableOpacity>
          </View>

          {/* Question Card */}
          <View style={styles.card}>
            <Text style={styles.cardText}>{question.question_text}</Text>

            {/* Code Template - Read Only Reference */}
            {question.code_template && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.sectionLabel}>Template Kode</Text>
                <View style={styles.codeBlock}>
                  <Text
                    style={{
                      fontFamily: "monospace",
                      fontSize: 15,
                      color: "#1f2937",
                      lineHeight: 22,
                    }}
                  >
                    {question.code_template}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Code Input Area */}
          <View style={styles.inputCard}>
            <Text style={styles.sectionLabel}>Solusi Anda</Text>
            <TextInput
              style={styles.textInput}
              placeholder="# Tulis solusi Python lengkap Anda di sini...\nprint('Hello, World!')"
              placeholderTextColor="#9ca3af"
              value={answer}
              onChangeText={setAnswer}
              multiline
              numberOfLines={8}
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
                <Text style={styles.modalSubtitle}>{feedbackMessage || "Coba cek lagi kode Anda."}</Text>

                {/* Test Results Display in Modal */}
                {testResults.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ fontWeight: "600", marginBottom: 8, color: "#374151" }}>Hasil Test:</Text>
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
                        {result.input && <Text style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>Input: {result.input}</Text>}
                        <Text style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>Expected: {result.expected}</Text>
                        <Text style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>Got: {result.actual || "(no output)"}</Text>
                        {result.error && <Text style={{ fontSize: 10, color: "#991b1b", marginTop: 4, fontFamily: "monospace" }}>Error: {result.error}</Text>}
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
              <Text style={styles.modalSubtitle}>{feedbackMessage}</Text>

              {/* Test Results Display in Modal */}
              {testResults.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontWeight: "600", marginBottom: 8, color: "#374151" }}>Hasil Test:</Text>
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
                      {result.input && <Text style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>Input: {result.input}</Text>}
                      <Text style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>Expected: {result.expected}</Text>
                      <Text style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>Got: {result.actual || "(no output)"}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.nextButtonRow}>
                <TouchableOpacity style={styles.nextButton} onPress={handleNextQuestion}>
                  <Text style={styles.nextButtonText}>Selanjutnya</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
