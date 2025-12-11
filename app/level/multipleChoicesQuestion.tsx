import { styles } from "@/styles/multipleChoicesQuestion";
import { useState, useCallback } from "react";
import { Image, Modal, SafeAreaView, ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { quizAPI } from "@/lib/api";
import { useFocusEffect } from "@react-navigation/native";

export default function MultipleChoicesQuestion() {
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

      const difficulty = 2;
      const data = await quizAPI.generateQuestion(difficulty, "mcq");
      setQuestion(data);
    } catch (err: any) {
      console.error("Failed to load question:", err);
      setError(err?.message || "Gagal memuat soal. Pastikan backend berjalan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadQuestion();
      return () => {};
    }, [loadQuestion])
  );

  const handleSelectAnswer = async (optionId: string) => {
    if (selectedAnswer || !question || checking) return;
    setSelectedAnswer(optionId);
    setChecking(true);

    try {
      const result = await quizAPI.checkAnswer(question.question_id, optionId);
      setAnswerStatus(result.correct ? "correct" : "wrong");
      setFeedback(result.feedback || "");
      setExplanation(result.explanation || "");

      // Get correct answer text - dengan validation lebih ketat
      if (!result.correct && question.options && question.answer_key) {
        try {
          const answerKey = String(question.answer_key).toUpperCase().trim();
          const correctIndex = answerKey.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3

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

  const emojiWrongSource = require("../../assets/images/emoji-wrong-answer.png");
  const emojiCorrectSource = require("../../assets/images/emoji-correct-answer.png");

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

          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity style={{ paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#0066cc", borderRadius: 8, marginBottom: 12 }} onPress={loadQuestion}>
              <Text style={{ color: "white", fontWeight: "bold" }}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const options: any[] = Array.isArray(question.options) ? question.options : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Level {question.difficulty ?? "?"}</Text>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity style={[styles.rulesButton, { marginRight: 8 }]} onPress={loadQuestion}>
              <Text style={styles.rulesButtonText}>Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rulesButton}>
              <Text style={styles.rulesButtonText}>Pilihan Ganda</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Question Card */}
        <View style={styles.questionCard}>
          {question.code_template && (
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>{question.code_template}</Text>
            </View>
          )}
          <Text style={styles.questionText}>{question.question_text}</Text>
        </View>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {options.map((opt, idx) => {
            const optionId = String.fromCharCode(65 + idx); // A, B, C, D
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
                <Text style={styles.closeText}>Close</Text>
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
                <Text style={styles.closeText}>Close</Text>
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
                    setAnswerStatus(null);
                    router.push("/level/completionQuestion");
                  }}
                >
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
