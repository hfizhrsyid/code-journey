import { Question, quizAPI, validateQuestion } from "@/lib/api";
import { styles } from "@/styles/completionQuestion";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useQuestions } from "../../lib/QuestionContext";


export default function CompletionQuestion() {
  const { questionSet, setQuestionSet, currentIndex, setCurrentIndex, difficulty, topic, topicId, savePosition } = useQuestions();

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

      if (questionSet.length === 0 || currentIndex >= questionSet.length) {
        setError("Soal tidak ditemukan");
        setLoading(false);
        return;
      }

      let currentQuestion = questionSet[currentIndex];
      console.log(`📋 Loading Q${currentIndex}: ID=${currentQuestion.question_id}, Topic=${topic || "N/A"}`);
      currentQuestion = normalizeQuestion(currentQuestion);

      // Validate question
      const validation = validateQuestion(currentQuestion);
      if (!validation.valid) {
        setError(validation.error || "Soal tidak valid");
        setLoading(false);
        return;
      }

      console.log("✅ Loaded question from context:", currentQuestion);
      console.log("📋 Question options:", currentQuestion.options);
      setQuestion(currentQuestion);
      setLoading(false);
    } catch (error: any) {
      console.error("Failed to load question:", error);
      setError(error.message || "Gagal memuat soal");
      setLoading(false);
    }
  }, [questionSet, currentIndex, topicId]);

  const prevTopicIdRef = useRef(topicId);

  useEffect(() => {
    // Only reset if topicId actually changed (not on initial mount)
    if (prevTopicIdRef.current !== topicId && prevTopicIdRef.current !== 0) {
      console.log(`🔄 TopicId changed from ${prevTopicIdRef.current} to ${topicId}, resetting state`);
      setQuestion(null);
      setAnswer("");
      setFeedbackStatus(null);
      setFeedback("");
      setExplanation("");
      setError(null);
    }
    prevTopicIdRef.current = topicId;
    loadQuestion();
  }, [topicId, loadQuestion]);

  const handleSubmit = async () => {
    if (!question || !answer.trim()) {
      setFeedback("Silakan masukkan jawaban");
      setFeedbackStatus("wrong");
      return;
    }

    setSubmitting(true);
    try {
      const normalizedToSend = answer.trim().toLowerCase();
      const result = await quizAPI.submitAnswer(question.question_id, normalizedToSend);

      if (result.correct) {
        setFeedback(result.feedback || "Benar! Periksa formatting dan detail kecil jika perlu.");
        setFeedbackStatus("correct");
        setExplanation(result.explanation || "");
      } else {
        setFeedback(result.feedback || "Coba cek kembali format jawaban dan konsep dasarnya.");
        setFeedbackStatus("wrong");
        setExplanation(result.explanation || "");
      }

      if (result.newly_unlocked_badges && result.newly_unlocked_badges.length > 0) {
        const badgeNames = result.newly_unlocked_badges.map((b) => b.badge_name).join("\n");
        Alert.alert("🏆 Badge Baru!", `Selamat! Anda mendapatkan badge:\n\n${badgeNames}`, [{ text: "OK" }]);
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
    const nextIndex = currentIndex + 1;
    console.log(`🔄 handleNextQuestion: currentIndex=${currentIndex}, nextIndex=${nextIndex}, questionSet.length=${questionSet.length}`);

    if (nextIndex >= 10) {
      console.log("✅ Selesai 10 soal");
      // Check if we've completed 10 questions - redirect to reportCard
      router.push({
        pathname: "/reportCard",
        params: {
          topicId: topicId.toString(),
          topicName: topic,
        },
      } as any);
      return;
    }

    if (nextIndex < questionSet.length) {
      console.log(`📋 Loading dari questionSet[${nextIndex}]`);
      const nextQ = normalizeQuestion(questionSet[nextIndex]);
      const copy = [...questionSet];
      copy[nextIndex] = nextQ;
      setQuestionSet(copy);
      setCurrentIndex(nextIndex);

      const nextPath = getQuestionScreenPath(nextQ.question_type);
      if (nextPath !== "completionQuestion") {
        router.push(`/level/${nextPath}` as any);
      }
      return;
    }

    console.log("⚠️ nextIndex >= questionSet.length, generating new question!");
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
        if (newPath !== "completionQuestion") {
          router.push(`/level/${newPath}` as any);
        }
        return;
      }
    } catch (err) {
      console.warn("Gagal generate soal berikutnya (completion):", err);
    }

    // Navigate to results screen
    router.push({
      pathname: "/reportCard",
      params: {
        topicId: topicId.toString(),
        topicName: topic,
      },
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
                  style={styles.nextButton}
                  onPress={() => {
                    console.log(`🎯 BEFORE handleNextQuestion: questionSet.length=${questionSet.length}`);
                    handleNextQuestion();
                  }}
                >
                  <Text style={styles.nextButtonText}>{currentIndex + 1 >= 10 ? "Selesai" : "Selanjutnya"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>{" "}
      </Modal>
    </SafeAreaView>
  );
}
