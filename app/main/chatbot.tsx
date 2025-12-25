import { quizAPI } from "@/lib/api";
import { styles } from "@/styles/chatbot";
import { FontAwesome } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Keyboard, Platform, SafeAreaView, Text, TextInput, TouchableOpacity, View } from "react-native";

type ChatMessage = {
  id: string;
  from: "user" | "bot";
  text: string;
};

const isCodingQuestion = (text: string) => {
  const keywords = [
    "code",
    "coding",
    "programming",
    "pemrograman",
    "materi",
    "algoritma",
    "algorithm",
    "python",
    "javascript",
    "java",
    "dart",
    "flutter",
    "react",
    "loop",
    "function",
    "fungsi",
    "variable",
    "variabel",
    "class",
    "oop",
    "struktur data",
    "data structure",
  ];
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
};

export default function ChatbotScreen() {
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      from: "bot",
      text: "Hi! Ajukan pertanyaan seputar coding atau materi belajar. Saya siap membantu!",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const pushMessage = (msg: ChatMessage) => setMessages((prev) => [...prev, msg]);

  const sendMessage = async () => {
    const prompt = input.trim();
    if (!prompt || sending) return;

    setInput("");
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, from: "user", text: prompt };
    pushMessage(userMsg);

    if (!isCodingQuestion(prompt)) {
      pushMessage({
        id: `b-${Date.now()}`,
        from: "bot",
        text: "Chatbot ini fokus pada coding atau materi belajar. Coba tanya tentang algoritma, syntax, atau konsep yang sedang dipelajari.",
      });
      return;
    }

    setSending(true);
    try {
      const res = await quizAPI.askChatbot(prompt);
      const answer = res?.answer?.trim();
      pushMessage({
        id: `b-${Date.now()}`,
        from: "bot",
        text: answer || "Maaf, belum ada jawaban untuk pertanyaan itu.",
      });
    } catch (error) {
      pushMessage({
        id: `b-${Date.now()}`,
        from: "bot",
        text: "Chatbot belum bisa dihubungi sekarang. Coba lagi nanti atau periksa koneksi.",
      });
    } finally {
      setSending(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>AI Chat</Text>
            <Text style={styles.subtitle}>Khusus pertanyaan coding & materi.</Text>
          </View>
          <FontAwesome name="comments" size={28} color="#d9e6ff" />
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.from === "user" ? styles.userBubble : styles.botBubble]}>
              <Text style={[styles.bubbleText, item.from === "user" ? styles.userText : styles.botText]}>{item.text}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        <View style={[styles.inputBar, { marginBottom: keyboardHeight > 0 ? keyboardHeight - 60 : 0 }]}>
          <TextInput 
            style={styles.input} 
            placeholder="Tanya seputar coding atau materi..." 
            placeholderTextColor="#9fb3d9" 
            value={input} 
            onChangeText={setInput} 
            editable={!sending} 
            multiline 
            maxLength={500}
            textAlignVertical="top"
            onFocus={() => requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }))}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={sending}>
            {sending ? <ActivityIndicator color="#0f172a" /> : <FontAwesome name="send" size={18} color="#0f172a" />}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
