import { quizAPI } from "@/lib/api";
import { styles } from "@/styles/multipleChoicesQuestion";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useQuestions } from "../../lib/QuestionContext";

export default function MultipleChoicesQuestion() {
  const { questionSet, setQuestionSet, currentIndex, setCurrentIndex, difficulty, goToNextQuestion } = useQuestions();

  const [question, setQuestion] = useState<any | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerStatus, setAnswerStatus] = useState<"correct" | "wrong" | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [checking, setChecking] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>("");
  const [explanation, setExplanation] = useState<string>("");
  const [correctAnswerInfo, setCorrectAnswerInfo] = useState<{ option: string; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadQuestion = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSelectedAnswer(null);
      setAnswerStatus(null);
      setFeedback("");
      setExplanation("");
      setCorrectAnswerInfo(null);

      // If we have a question set and the index exists, use it
      if (questionSet.length > 0 && currentIndex < questionSet.length) {
        let currentQuestion = questionSet[currentIndex];
        currentQuestion = normalizeQuestion(currentQuestion);
        console.log("✅ Loaded question from context:", currentQuestion);
        console.log("📋 Question options:", currentQuestion.options);
        setQuestion(currentQuestion);
        return;
      }

      // Fallback: request a single MCQ from backend and populate context
      try {
        const q = await quizAPI.generateQuestion(difficulty || 2, "mcq");
        if (q) {
          const nq = normalizeQuestion(q);
          console.log("✅ Generated single MCQ:", nq);
          setQuestionSet([nq]);
          setCurrentIndex(0);
          setQuestion(nq);
          return;
        }
      } catch (genErr) {
        console.warn("Fallback single-question generate failed:", genErr);
      }

      // If still not available, create a local mock single question so UI can continue
      console.warn("Using local mock MCQ for UI because backend generation failed.");
      const mock = {
        question_id: 9999,
        question_text: "Contoh (mock) soal pilihan ganda: Apa hasil dari print(1+1)?",
        code_template: "",
        options: ["1", "2", "3", "4"],
        question_type: "mcq",
        difficulty: difficulty || 2,
      };
      console.log("✅ Using mock MCQ:", mock);
      setQuestionSet([mock]);
      setCurrentIndex(0);
      setQuestion(mock);
      return;
    } catch (err: any) {
      console.error("Failed to load question:", err);
      setError(err?.message || "Gagal memuat soal");
    } finally {
      setLoading(false);
    }
  }, [questionSet, currentIndex, difficulty, setQuestionSet, setCurrentIndex]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const handleSelectAnswer = async (optionId: string) => {
    if (selectedAnswer || !question || checking) return;
    setSelectedAnswer(optionId);
    setChecking(true);

    try {
      const result = await quizAPI.checkAnswer(question.question_id, optionId);
      setAnswerStatus(result.correct ? "correct" : "wrong");
      setFeedback(result.feedback || "");
      setExplanation(result.explanation || "");

      if (!result.correct && question.options && question.answer_key) {
        try {
          const answerKey = String(question.answer_key).toUpperCase().trim();
          const correctIndex = answerKey.charCodeAt(0) - 65;

          if (correctIndex >= 0 && correctIndex < question.options.length) {
            setCorrectAnswerInfo({
              option: answerKey,
              text: question.options[correctIndex],
            });
          }
        } catch (e) {
          console.warn("Error extracting correct answer:", e);
        }
      }
    } catch (err: any) {
      console.error("Error checking answer:", err);
      setAnswerStatus("wrong");
      setFeedback("Gagal memeriksa jawaban: " + (err?.message || "Unknown error"));
    } finally {
      setChecking(false);
    }
  };

  const getQuestionScreenPath = (questionType: string) => {
    if (questionType === "mcq") return "multipleChoicesQuestion";
    if (questionType === "fill") return "completionQuestion";
    if (questionType === "coding") return "codingQuestion";
    return "multipleChoicesQuestion";
  };

  const handleNextQuestion = async () => {
    setAnswerStatus(null);
    setSelectedAnswer(null);

    const nextIndex = currentIndex + 1;
    console.log("handleNextQuestion: currentIndex=", currentIndex, "nextIndex=", nextIndex, "questionSet.length=", questionSet.length);

    // Jika ada soal berikutnya dalam questionSet, pindah index dan navigasi bila tipe berbeda
    if (nextIndex < questionSet.length) {
      const nextQ = normalizeQuestion(questionSet[nextIndex]);
      console.log("Advancing to existing question at index", nextIndex, nextQ);
      const copy = [...questionSet];
      copy[nextIndex] = nextQ;
      setQuestionSet(copy);
      // set local question immediately to avoid relying on batched state updates
      setQuestion(nextQ);
      setCurrentIndex(nextIndex);

      const nextPath = getQuestionScreenPath(nextQ.question_type);
      if (nextPath !== "multipleChoicesQuestion") {
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
        // set local question immediately to avoid waiting for context propagation
        setQuestion(nq);
        setCurrentIndex(nextIndex);

        const newPath = getQuestionScreenPath(nq.question_type);
        if (newPath !== "multipleChoicesQuestion") {
          router.push(`/level/${newPath}` as any);
        }
        return;
      }
    } catch (err) {
      console.warn("Gagal generate soal berikutnya:", err);
    }

    // Jika tidak bisa generate soal lagi, anggap selesai
    Alert.alert("Selesai!", "Anda telah menyelesaikan semua soal.", [{ text: "OK", onPress: () => router.push("/main/dashboard") }]);
  };

  const emojiWrongSource = require("../../assets/images/emoji-wrong-answer.png");
  const emojiCorrectSource = require("../../assets/images/emoji-correct-answer.png");

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
          <TouchableOpacity style={{ paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#0066cc", borderRadius: 8 }} onPress={loadQuestion}>
            <Text style={{ color: "white", fontWeight: "bold" }}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const options: any[] = Array.isArray(question.options) ? question.options : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Soal {currentIndex + 1}/{Math.max(questionSet.length, 1)}
          </Text>
          <TouchableOpacity style={styles.rulesButton}>
            <Text style={styles.rulesButtonText}>Pilihan Ganda</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.questionCard}>
          {question.code_template && (
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>{question.code_template}</Text>
            </View>
          )}
          <Text style={styles.questionText}>{question.question_text}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {options.map((opt, idx) => {
            const optionId = String.fromCharCode(65 + idx);
            const optionText = typeof opt === "string" ? opt : opt.value ?? String(opt);
            const isSelected = selectedAnswer === optionId;

            let buttonStyle: any = styles.optionButton;
            let textStyle: any = styles.optionText;

            if (selectedAnswer) {
              if (answerStatus === "correct" && isSelected) {
                buttonStyle = [buttonStyle, styles.correct];
                textStyle = [textStyle, styles.whiteText];
              } else if (answerStatus === "wrong" && isSelected) {
                buttonStyle = [buttonStyle, styles.wrong];
                textStyle = [textStyle, styles.whiteText];
              }
            } else if (isSelected) {
              buttonStyle = [buttonStyle, styles.selected];
              textStyle = [textStyle, styles.selectedText];
            }

            return (
              <TouchableOpacity key={optionId} style={buttonStyle} disabled={selectedAnswer !== null || checking} onPress={() => handleSelectAnswer(optionId)}>
                <Text style={textStyle}>{`${optionId}. ${optionText}`}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Feedback Modal - Wrong */}
      <Modal transparent visible={answerStatus === "wrong"} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalPositionWrapper}>
            <Image source={emojiWrongSource} style={styles.modalEmojiImage} />
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeLabel}
                onPress={() => {
                  setAnswerStatus(null);
                  setSelectedAnswer(null);
                }}
              >
                <Text style={styles.closeIcon}>✕</Text>
                <Text style={styles.closeText}>Tutup</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Jawaban Anda Salah!</Text>

              <ScrollView style={{ maxHeight: 300 }}>
                <Text style={styles.modalSubtitle}>{feedback || "Coba cek lagi konsep dasarnya."}</Text>

                {correctAnswerInfo && (
                  <View style={{ marginTop: 15, padding: 12, backgroundColor: "#f0f0f0", borderRadius: 8 }}>
                    <Text style={{ fontWeight: "bold", color: "#333", marginBottom: 5 }}>Jawaban yang benar:</Text>
                    <Text style={{ color: "#28a745", fontSize: 14 }}>
                      {correctAnswerInfo.option}. {correctAnswerInfo.text}
                    </Text>
                  </View>
                )}

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
      <Modal transparent visible={answerStatus === "correct"} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalPositionWrapper}>
            <Image source={emojiCorrectSource} style={styles.modalEmojiImage} />
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeLabel}
                onPress={() => {
                  setAnswerStatus(null);
                  setSelectedAnswer(null);
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
                <TouchableOpacity style={styles.nextButton} onPress={handleNextQuestion}>
                  <Text style={styles.nextButtonText}>{currentIndex + 1 >= 10 ? "Selesai" : "Selanjutnya"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
