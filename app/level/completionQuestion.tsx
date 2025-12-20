import { Question, quizAPI, validateQuestion } from "@/lib/api";
import { styles } from "@/styles/completionQuestion";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useQuestions } from "../../lib/QuestionContext";
import { useFocusEffect } from "@react-navigation/native";
import React from "react";

export default function CompletionQuestion() {
  const params = useLocalSearchParams();

  const {
    questionSet,
    setQuestionSet,
    currentIndex,
    setCurrentIndex,
    difficulty,
    topic,
    topicId,
    savePosition,
    mode,
    recordPretestAnswer,
    pretestAnswers,
    getWeakestPretestTopic,
    getNextPretestTopic,
    popPretestQuestion,
    clearPretestTopic,
  } = useQuestions();

  // ✅ READ questionIndex dari params jika ada (user klik node lama)
  const paramQuestionIndex = params.questionIndex ? parseInt(params.questionIndex as string) : null;

  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<"correct" | "wrong" | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [explanation, setExplanation] = useState<string>("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [autoRetried, setAutoRetried] = useState(false);
  const [prevTopicId, setPrevTopicId] = useState<number | null>(null);
  const [hasAppliedParamIndex, setHasAppliedParamIndex] = useState(false);

  const PRETEST_MAX_QUESTIONS = 3;
  const PRETEST_TARGET_CORRECT = 2;
  const PRETEST_TARGET_WRONG = 2;
  const REVEAL_DELAY_MS = 650;
  const MAX_QUESTIONS = 10;
  const totalQuestions = mode === "pretest" ? Math.min(questionSet.length, PRETEST_MAX_QUESTIONS) : Math.max(questionSet.length, 10);

  const finishPretest = (target?: { id: number; name: string }) => {
    const fallback = getWeakestPretestTopic();
    const destId = target?.id ?? fallback?.id ?? topicId;
    const destName = target?.name ?? fallback?.name ?? topic;

    router.push({
      pathname: "/reportCardPreTest",
      params: {
        topicId: destId.toString(),
        topicName: destName,
        targetTopicId: destId.toString(),
        targetTopicName: destName,
      },
    } as any);
  };

  const resolvePretestTarget = (answers: { correct: boolean }[], testedTopicId: number, testedTopicName: string) => {
    const totalAnswered = answers.length;
    const allCorrect = totalAnswered >= PRETEST_MAX_QUESTIONS && answers.every((a) => a.correct);

    if (allCorrect) {
      const next = getNextPretestTopic(testedTopicId);
      if (next) return next;
    }

    return getWeakestPretestTopic() ?? { id: testedTopicId, name: testedTopicName };
  };

  const loadQuestion = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setAnswer("");
      setExplanation("");
      setFeedbackStatus(null);
      setFeedback("");

      // Helper: try to fetch questions from server if context is empty or index invalid
      const hydrateFromServer = async () => {
        try {
          const fetched = await quizAPI.getQuestions(topicId || topic, difficulty || 2);
          if (fetched && fetched.length > 0) {
            const normalized = fetched.map((q: any) => normalizeQuestion(q));
            const safeIndex = Math.min(Math.max(currentIndex, 0), normalized.length - 1);
            setQuestionSet(normalized);
            setCurrentIndex(safeIndex);
            setQuestion(normalized[safeIndex]);
            return true;
          }
        } catch (fetchErr) {
          console.warn("Hydrate from server failed (completion):", fetchErr);
        }
        return false;
      };

      if (questionSet.length === 0 || currentIndex >= questionSet.length) {
        // coba ambil antrean pretest (jika ada)
        const pending = mode === "pretest" ? popPretestQuestion(topicId) : null;
        if (pending) {
          const nq = normalizeQuestion(pending);
          setQuestionSet([nq]);
          setCurrentIndex(0);
          setQuestion(nq);
          setLoading(false);
          return;
        }

        // coba muat ulang dari server (gunakan topik saat ini)
        const hydrated = await hydrateFromServer();
        if (hydrated) {
          setLoading(false);
          return;
        }

        // fallback generate 1 soal baru supaya user tidak perlu klik "Coba Lagi"
        try {
          const q = await quizAPI.generateQuestion(difficulty || 2, "fill", { id: topicId, name: topic });
          if (q) {
            const nq = normalizeQuestion(q);

            const validation = validateQuestion(nq);
            if (!validation.valid) {
              setError(validation.error || "Soal yang dihasilkan tidak valid");
              return;
            }

            setQuestionSet([nq]);
            setCurrentIndex(0);
            setQuestion(nq);
            return;
          }
        } catch (genErr) {
          console.warn("Fallback generate fill question failed:", genErr);
        }

        // terakhir, tampilkan error agar UI tetap merespons
        setError("Soal tidak ditemukan");
        return;
      }

      const indexToUse = !hasAppliedParamIndex && paramQuestionIndex !== null ? paramQuestionIndex : currentIndex;
      console.log(`📖 [Completion] Loading question: index=${indexToUse}, fromParam=${paramQuestionIndex !== null}`);

      const safeIndex = questionSet.length > 0 ? Math.min(Math.max(indexToUse, 0), questionSet.length - 1) : 0;

      // ✅ ALWAYS sync currentIndex with the index we're using
      // This ensures context state matches the actual question being displayed
      if (safeIndex !== currentIndex) {
        setCurrentIndex(safeIndex);
      }
      if (!hasAppliedParamIndex && paramQuestionIndex !== null) {
        setHasAppliedParamIndex(true);
      }

      let currentQuestion = questionSet[safeIndex];
      console.log(`📋 Loading Q${safeIndex}: ID=${currentQuestion?.question_id}, Topic=${topic || "N/A"}`);
      currentQuestion = normalizeQuestion(currentQuestion);

      // Validate question
      const validation = validateQuestion(currentQuestion);
      if (!validation.valid) {
        setError(validation.error || "Soal tidak valid");
        return;
      }

      console.log("✅ Loaded question from context:", currentQuestion);
      console.log("📋 Question options:", currentQuestion.options);
      setQuestion(currentQuestion);
    } catch (error: any) {
      console.error("Failed to load question:", error);
      setError(error.message || "Gagal memuat soal");
    } finally {
      setLoading(false);
    }
  }, [questionSet, paramQuestionIndex, currentIndex, mode, difficulty, topicId, topic, setQuestionSet, setCurrentIndex, recordPretestAnswer, hasAppliedParamIndex]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  // Trigger loadQuestion ketika screen fokus untuk memastikan data selalu fresh
  useFocusEffect(
    React.useCallback(() => {
      loadQuestion();
    }, [loadQuestion])
  );

  // Auto-retry sekali bila terjadi error untuk menghindari klik manual
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
      setFeedback("");
      setExplanation("");
      setError(null);
      setAutoRetried(false);
    }
    setPrevTopicId(topicId);
  }, [topicId, prevTopicId]);

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

      if (mode === "pretest") {
        const topicKey = topicId;
        const nextAnswer = {
          topicId: topicKey,
          topicName: topic,
          questionId: question.question_id,
          correct: !!result.correct,
        };

        const mergedAnswers = [...pretestAnswers.filter((a) => a.questionId !== nextAnswer.questionId), nextAnswer];

        recordPretestAnswer(nextAnswer);

        const wrong = mergedAnswers.filter((a) => !a.correct).length;
        const correctCount = mergedAnswers.filter((a) => a.correct).length;
        const answered = mergedAnswers.length;

        const shouldEndEarly = wrong >= PRETEST_TARGET_WRONG || correctCount >= PRETEST_TARGET_CORRECT;
        const reachedCap = answered >= PRETEST_MAX_QUESTIONS;

        const target = resolvePretestTarget(mergedAnswers, topicKey, topic);

        setTimeout(() => {
          if (shouldEndEarly || reachedCap) {
            finishPretest(target);
          } else {
            handleNextQuestion();
          }
        }, REVEAL_DELAY_MS);
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

    // ✅ CEK APAKAH SUDAH MENCAPAI LIMIT 10 SOAL (hanya untuk learning mode)
    if (mode !== "pretest" && nextIndex >= MAX_QUESTIONS) {
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

    if (nextIndex < questionSet.length) {
      console.log(`📋 Loading dari questionSet[${nextIndex}]`);
      const nextQ = normalizeQuestion(questionSet[nextIndex]);
      const copy = [...questionSet];
      copy[nextIndex] = nextQ;
      setQuestionSet(copy);
      setQuestion(nextQ as any);
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

      const newQuestion = await quizAPI.generateQuestion(difficulty || 2, nextType, { id: topicId, name: topic });
      if (newQuestion) {
        const nq = normalizeQuestion(newQuestion);
        const updated = [...questionSet, nq];
        setQuestionSet(updated);
        setQuestion(nq as any);
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

    // Jika tidak ada soal baru yang bisa diambil, akhiri sesi
    if (mode === "pretest") {
      finishPretest();
    } else {
      router.push({
        pathname: "/reportCard",
        params: {
          topicId: topicId.toString(),
          topicName: topic,
        },
      } as any);
    }
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

      // carry topic metadata forward for pretest/reporting correctness
      if (!q.topic_id) q.topic_id = topicId;
      if (!q.topic_name && q.topic) q.topic_name = q.topic;
      if (!q.topic_name) q.topic_name = topic;
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
          <Text style={styles.headerText}>
            Soal {currentIndex + 1}/{Math.max(questionSet.length, 1)}
          </Text>
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
      <Modal transparent visible={mode !== "pretest" && feedbackStatus === "wrong"} animationType="fade">
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
      <Modal transparent visible={mode !== "pretest" && feedbackStatus === "correct"} animationType="fade">
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
                  <Text style={styles.nextButtonText}>Selanjutnya</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>{" "}
      </Modal>
    </SafeAreaView>
  );
}
