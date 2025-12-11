import { useState } from "react";
import { styles } from "@/styles/completionQuestion";
import { Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

export default function CompletionQuestion() {
  const [answer, setAnswer] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<"correct" | "wrong" | null>(null);

  const question = {
    title: "Soal 3",
    description: "Lengkapi bagian kosong agar program\nmenampilkan angka 2, 4, 6, 8, 10:",
    code: `for i in range(___, ___, ___):\n    print(i)`,
    correctAnswer: "range(2, 11, 2)",
  };

  const handleSubmit = () => {
    const normalizedAnswer = answer.replace(/\s/g, "");
    const normalizedCorrect = question.correctAnswer.replace(/\s/g, "");

    if (normalizedAnswer === normalizedCorrect) {
      setFeedbackStatus("correct");
    } else {
      setFeedbackStatus("wrong");
    }
  };

  const emojiWrongSource = require("../../assets/images/emoji-wrong-answer.png");
  const emojiCorrectSource = require("../../assets/images/emoji-correct-answer.png");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>{question.title}</Text>
          <TouchableOpacity style={styles.rulesButton}>
            <Text style={styles.rulesButtonText}>Perulangan</Text>
          </TouchableOpacity>
        </View>

        {/* Question Card */}
        <View style={styles.card}>
          <Text style={styles.questionText}>{question.description}</Text>

          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{question.code}</Text>
          </View>
        </View>

        {/* Input Answer */}
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="Ketikkan Jawabanmu di sini" placeholderTextColor="#8898AA" value={answer} onChangeText={setAnswer} />
        </View>
      </ScrollView>

      {/* Submit Button - Fixed at bottom right */}
      <View style={styles.submitButtonContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit</Text>
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
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Jawaban kamu kurang tepat!</Text>
              <Text style={styles.modalSubtitle}>Coba pikirkan kembali tentang parameter range(start, stop, step). Berapa nilai yang diperlukan untuk menghasilkan 2, 4, 6, 8, 10?</Text>
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
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Jawaban Benar!</Text>
              <Text style={styles.modalSubtitle}>Hebat! range(2, 11, 2) menghasilkan 2, 4, 6, 8, 10 :)</Text>

              <View style={styles.nextButtonRow}>
                <TouchableOpacity style={styles.nextButton} onPress={() => {
                  setFeedbackStatus(null);
                  
                  router.push('/level/codingQuestion');}}>
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

