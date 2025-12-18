import { quizAPI } from "@/lib/api";
import { styles } from "@/styles/multipleChoicesQuestion";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useQuestions } from "../../lib/QuestionContext";

export default function MultipleChoicesQuestion() {
  const params = useLocalSearchParams();
  const { questionSet, setQuestionSet, currentIndex, setCurrentIndex, difficulty, topic, topicId } = useQuestions();
  
  // Get topicId from params or context
  const effectiveTopicId = params.topicId ? parseInt(params.topicId as string) : topicId;

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

      console.log("🔍 loadQuestion called");
      console.log("📦 questionSet.length:", questionSet.length);
      console.log("📍 currentIndex:", currentIndex);
      console.log("🎯 questionIndex from params:", params.questionIndex);
      console.log("🎯 topicId from context:", topicId);
      console.log("🎯 topicId from params:", params.topicId);
      console.log("🎯 effectiveTopicId:", effectiveTopicId);

      // Determine which question index to use
      const targetIndex = params.questionIndex ? parseInt(params.questionIndex as string) : currentIndex;
      console.log("🎯 Using targetIndex:", targetIndex);

      // If questionSet is empty, fetch from API
      if (questionSet.length === 0 && effectiveTopicId) {
        console.log("📡 QuestionSet empty, fetching from API for topic:", effectiveTopicId);
        try {
          const questions = await quizAPI.getProgressiveQuestions(effectiveTopicId);
          console.log("✅ Fetched", questions.length, "questions from API");
          setQuestionSet(questions);
          setCurrentIndex(targetIndex);
          
          if (questions.length > targetIndex) {
            const targetQ = normalizeQuestion(questions[targetIndex]);
            setQuestion(targetQ);
          }
          return;
        } catch (fetchError) {
          console.error("Failed to fetch questions:", fetchError);
          setError("Failed to load questions");
          return;
        }
      }

      // If we have a question set and the index exists, use it
      if (questionSet.length > 0 && targetIndex < questionSet.length) {
        let currentQuestion = questionSet[targetIndex];
        currentQuestion = normalizeQuestion(currentQuestion);
        console.log("✅ Loaded question from context:", currentQuestion);
        console.log("📋 Question options:", currentQuestion.options);
        setQuestion(currentQuestion);
        setCurrentIndex(targetIndex); // Update context index to match
        return;
      }

      // No questions and no topicId - redirect to pathPage
      console.warn("⚠️ No questions and no way to fetch, redirecting to pathPage...");
      router.replace("/main/pathPage" as any);
      return;
    } catch (err: any) {
      console.error("Failed to load question:", err);
      setError(err?.message || "Gagal memuat soal");
    } finally {
      setLoading(false);
    }
  }, [questionSet, currentIndex, difficulty, setQuestionSet, setCurrentIndex, effectiveTopicId]);

  useEffect(() => {
    loadQuestion();
  }, []); // Only run once on mount

  const handleSelectAnswer = async (optionId: string) => {
    if (selectedAnswer || !question || checking) return;
    setSelectedAnswer(optionId);
    setChecking(true);

    try {
      console.log("📤 Submitting answer for question:", question);
      console.log("📤 Question ID:", question.id || question.question_id);
      const questionId = question.id || question.question_id;
      const result = await quizAPI.submitAnswer(questionId, optionId);
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
      console.error("Error submitting answer:", err);
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

    // Jika ada soal berikutnya dalam questionSet, pindah index dan navigasi
    if (nextIndex < questionSet.length) {
      const nextQ = normalizeQuestion(questionSet[nextIndex]);
      console.log("Advancing to existing question at index", nextIndex, nextQ);
      
      // Update context for all question types
      setCurrentIndex(nextIndex);
      const copy = [...questionSet];
      copy[nextIndex] = nextQ;
      setQuestionSet(copy);

      const nextPath = getQuestionScreenPath(nextQ.question_type);
      
      // If different question type, navigate
      if (nextPath !== "multipleChoicesQuestion") {
        router.push(`/level/${nextPath}` as any);
      } else {
        // Same type - update local state to show next question
        setQuestion(nextQ);
        setSelectedAnswer(null);
        setAnswerStatus(null);
        setFeedback("");
        setExplanation("");
        setCorrectAnswerInfo(null);
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

