import { Question, quizAPI } from "@/lib/api";
import { styles } from "@/styles/completionQuestion";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const PretestQuestion = () => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, string>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [currentTopicId, setCurrentTopicId] = useState<number | null>(null);
  const [questionsPerTopic, setQuestionsPerTopic] = useState<number>(2); // 2 soal per topik

  const emojiCorrectSource = require("../assets/images/emoji-correct-answer.png");

  useEffect(() => {
    loadPretestQuestions();
  }, []);

  const loadPretestQuestions = async () => {
    try {
      setLoading(true);
      const pretestQuestions = await quizAPI.getPretestQuestions();
      
      if (pretestQuestions.length === 0) {
        Alert.alert("Error", "Tidak ada soal pretest yang tersedia");
        router.back();
        return;
      }

      setQuestions(pretestQuestions);
      // Set current topic ID from first question
      if (pretestQuestions[0]?.topic_id) {
        setCurrentTopicId(pretestQuestions[0].topic_id);
      }
    } catch (error) {
      console.error("Failed to load pretest:", error);
      Alert.alert("Error", "Gagal memuat soal pretest");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (answer: string) => {
    if (!currentQuestion) return;
    
    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.question_id, answer);
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    // Check if current question is answered
    if (!currentQuestion) return;
    
    const currentAnswer = answers.get(currentQuestion.question_id);
    if (!currentAnswer || currentAnswer.trim() === "") {
      Alert.alert("Peringatan", "Silakan jawab pertanyaan terlebih dahulu");
      return;
    }

    // Show success modal before moving to next
    setShowAnswerModal(true);
  };

  const moveToNextQuestion = () => {
    setShowAnswerModal(false);
    
    // Check jika sudah 2 soal dari topik yang sama dijawab
    const currentTopic = currentQuestion?.topic_id;
    const answeredInCurrentTopic = questions
      .slice(0, currentIndex + 1)
      .filter(q => q.topic_id === currentTopic && answers.has(q.question_id))
      .length;
    
    // Jika sudah 2 soal, cek apakah keduanya benar
    if (answeredInCurrentTopic >= 2) {
      const topicQuestions = questions
        .slice(0, currentIndex + 1)
        .filter(q => q.topic_id === currentTopic);
      
      // Check if any answer is wrong - jika ada yang salah, stop pretest
      const hasWrongAnswer = topicQuestions.some(q => {
        const userAnswer = answers.get(q.question_id);
        // Note: Kita tidak tahu jawabannya benar/salah di frontend
        // Jadi kita tetap lanjut ke soal berikutnya sampai semua topic dikumpulkan
        // Backend akan handle logika mana topik pertama yang salah
        return false; // Continue for now
      });
    }
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      // Update current topic ID
      if (questions[currentIndex + 1]?.topic_id) {
        setCurrentTopicId(questions[currentIndex + 1].topic_id);
      }
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions answered
    const unanswered = questions.filter(q => !answers.has(q.question_id));
    if (unanswered.length > 0) {
      Alert.alert(
        "Peringatan",
        `Masih ada ${unanswered.length} soal yang belum dijawab. Lanjutkan submit?`,
        [
          { text: "Batal", style: "cancel" },
          { text: "Submit", onPress: submitPretest },
        ]
      );
    } else {
      submitPretest();
    }
  };

  const submitPretest = async () => {
    try {
      setSubmitting(true);
      
      const answersArray = questions.map(q => ({
        question_id: q.question_id,
        user_answer: answers.get(q.question_id) || "",
      }));

      const result = await quizAPI.submitPretest(answersArray);
      
      // Navigate to result page with data
      router.push({
        pathname: "/reportCardPreTest",
        params: {
          overall_score: result.overall_score.toString(),
          total_correct: result.total_correct.toString(),
          total_questions: result.total_questions.toString(),
          recommendations: JSON.stringify(result.topic_recommendations),
          starting_topic_id: result.starting_topic_id ? result.starting_topic_id.toString() : "",
          perfect_topics: JSON.stringify(result.perfect_topics),
        },
      } as any);
    } catch (error) {
      console.error("Failed to submit pretest:", error);
      Alert.alert("Error", "Gagal mengirim hasil pretest");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={{ marginTop: 10, color: "#666" }}>Memuat soal pretest...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#ff0000", fontSize: 16 }}>Tidak ada soal</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentAnswer = answers.get(currentQuestion.question_id) || "";

  // Determine question type label
  const questionTypeLabel = currentQuestion.question_type === "mcq" 
    ? "Pilihan Ganda" 
    : currentQuestion.question_type === "coding" 
    ? "Coding" 
    : "Isi Kosong";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerText}>
            Soal {currentIndex + 1}/{questions.length}
          </Text>
          <TouchableOpacity style={styles.rulesButton}>
            <Text style={styles.rulesButtonText}>{questionTypeLabel}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.questionText}>{currentQuestion.question_text}</Text>

          {currentQuestion.code_template && (
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>{currentQuestion.code_template}</Text>
            </View>
          )}
        </View>

        {/* MCQ Options */}
        {currentQuestion.question_type === "mcq" && currentQuestion.options && (
          <View style={{ paddingHorizontal: 20, gap: 12, marginTop: 20 }}>
            {currentQuestion.options.map((option, index) => {
              const optionLetter = option.split(".")[0];
              const isSelected = currentAnswer === optionLetter;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={{
                    backgroundColor: isSelected ? "#E3F2FD" : "#F5F5F5",
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: isSelected ? "#0066cc" : "transparent",
                  }}
                  onPress={() => handleAnswer(optionLetter)}
                >
                  <Text style={{
                    color: isSelected ? "#0066cc" : "#333",
                    fontSize: 15,
                    fontWeight: isSelected ? "600" : "normal",
                  }}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Fill/Coding Input */}
        {(currentQuestion.question_type === "fill" || currentQuestion.question_type === "coding") && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ketikkan jawabanmu di sini"
              placeholderTextColor="#8898AA"
              value={currentAnswer}
              onChangeText={handleAnswer}
              multiline
              numberOfLines={currentQuestion.question_type === "coding" ? 10 : 4}
              textAlignVertical="top"
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.submitButtonContainer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && { opacity: 0.5 }]}
          onPress={handleNext}
          disabled={submitting}
        >
          <Text style={styles.submitText}>
            {currentIndex === questions.length - 1 ? "Selesai" : "Selanjutnya"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Answer Confirmation Modal */}
      <Modal transparent visible={showAnswerModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalPositionWrapper}>
            <Image source={emojiCorrectSource} style={styles.modalEmojiImage} />
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeLabel}
                onPress={() => setShowAnswerModal(false)}
              >
                <Text style={styles.closeIcon}>✕</Text>
                <Text style={styles.closeText}>Tutup</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Jawaban Tersimpan! ✓</Text>
              <Text style={styles.modalSubtitle}>
                {currentIndex === questions.length - 1 
                  ? "Ini adalah pertanyaan terakhir. Klik tombol untuk menyelesaikan pretest."
                  : "Jawaban kamu sudah tersimpan. Lanjut ke pertanyaan berikutnya?"}
              </Text>

              <View style={styles.nextButtonRow}>
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={moveToNextQuestion}
                >
                  <Text style={styles.nextButtonText}>
                    {currentIndex === questions.length - 1 ? "Selesai" : "Lanjut"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Progress Bar */}
      <View style={{ height: 6, backgroundColor: "#E0E0E0" }}>
        <View
          style={{
            height: "100%",
            backgroundColor: "#0066cc",
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export default PretestQuestion;
