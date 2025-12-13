import { styles } from "@/styles/pathPage";
import { FontAwesome } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

import { quizAPI } from "@/lib/api";
import { useQuestions } from "../../lib/QuestionContext";

import { radius, SCREEN_W, spacing, timeline } from "@/app/main/constants";

type LevelStatus = "done" | "open" | "locked";

interface LevelItem {
  id: number;
  title: string;
  status: LevelStatus;
  imgLeft: any;
  imgRight: any;
  imgLeftSize?: { width: number; height: number };
  imgRightSize?: { width: number; height: number };
}

const imageLeft = [
  require("../../assets/images/path/imgLeft1.png"),
  require("../../assets/images/path/imgLeft2.png"),
  require("../../assets/images/path/imgLeft3.png"),
  require("../../assets/images/path/imgLeft4.png"),
  require("../../assets/images/path/imgLeft5.png"),
];

const imageRight = [
  require("../../assets/images/path/imgRight1.png"),
  require("../../assets/images/path/imgRight2.png"),
  require("../../assets/images/path/imgRight3.png"),
  require("../../assets/images/path/imgRight4.png"),
  require("../../assets/images/path/imgRight5.png"),
];

const CONTENT_TOP = 80;
const CARD_H = 100;

export default function PathPage() {
  const params = useLocalSearchParams();
  const topic = (params.topic as string) || "Unknown";
  const difficulty = parseInt(params.difficulty as string) || 2;

  const { questionSet, setQuestionSet, setCurrentIndex } = useQuestions();

  const initialLevels: LevelItem[] = Array.from({ length: 10 }).map((_, i) => ({
    id: i + 1,
    title: `Soal ${i + 1}`,
    status: i === 0 ? "open" : "locked",
    imgLeft: imageLeft[i % imageLeft.length],
    imgRight: imageRight[i % imageRight.length],
    imgLeftSize: { width: 110, height: 70 },
    imgRightSize: { width: 90, height: 90 },
  }));

  const [levels, setLevels] = useState(initialLevels);
  const [loading, setLoading] = useState(false);

  const totalHeight = useMemo(() => spacing * levels.length + 100 + CONTENT_TOP, [levels.length]);

  const makePath = (index: number) => {
    const startY = index * spacing + CONTENT_TOP;
    const endY = (index + 1) * spacing + CONTENT_TOP;

    const nodeX = timeline + (index % 2 === 0 ? -70 : 70);
    const nextNodeX = timeline + ((index + 1) % 2 === 0 ? -70 : 70);

    const offsetBase = 120;
    const dir = index % 2 === 0 ? 1 : -1;
    const offsetX = dir * offsetBase;

    const controlY1 = startY + (endY - startY) * 0.2;
    const controlY2 = startY + (endY - startY) * 0.8;

    const controlX1 = timeline + offsetX;
    const controlX2 = timeline + offsetX;

    return `M ${nodeX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${nextNodeX} ${endY}`;
  };

  const getQuestionScreenPath = (questionType: string) => {
    switch (questionType) {
      case "mcq":
        return "multipleChoicesQuestion";
      case "fill":
        return "completionQuestion";
      case "coding":
        return "codingQuestion";
      default:
        return "multipleChoicesQuestion";
    }
  };

  // Fallback: generate soal satu per satu jika endpoint set belum ada
  const generateQuestionSetFallback = async (): Promise<any[]> => {
    const questions = [];
    const questionTypes = ["mcq", "mcq", "mcq", "mcq", "mcq", "fill", "fill", "coding", "coding", "fill"];

    for (let i = 0; i < questionTypes.length; i++) {
      try {
        const q = await quizAPI.generateQuestion(difficulty, questionTypes[i] as any);
        questions.push(q);
      } catch (error) {
        console.error(`Failed to generate question ${i + 1}:`, error);
      }
    }

    return questions;
  };

  const handlePress = async (node: LevelItem) => {
    if (node.status === "locked") {
      Alert.alert("Terkunci", "Selesaikan level sebelumnya terlebih dahulu");
      return;
    }

    // Jika level pertama dan belum ada question set, generate soal
    if (node.id === 1 && questionSet.length === 0) {
      setLoading(true);
      try {
        let questions: any[] = [];

        // Coba gunakan endpoint baru dulu
        try {
          questions = await quizAPI.generateQuestionSet(topic, difficulty);
          console.log("Generated question set via API:", questions.length);
        } catch (apiError) {
          console.warn("generateQuestionSet endpoint tidak tersedia, gunakan fallback:", apiError);
          // Fallback: generate satu per satu
          questions = await generateQuestionSetFallback();
        }

        if (questions && questions.length > 0) {
          setQuestionSet(questions);
          setCurrentIndex(0);

          const screenPath = getQuestionScreenPath(questions[0].question_type);
          router.push(`/level/${screenPath}` as any);
        } else {
          // --- NEW: fallback local mock questions so UI won't break ---
          console.warn("No questions generated from backend, creating local mock questions for flow testing.");
          const mockQuestions = Array.from({ length: 10 }).map((_, i) => {
            // distribute types: first 5 mcq, rest mix
            const qtype = i < 5 ? "mcq" : i % 2 === 0 ? "fill" : "coding";
            return {
              question_id: 1000 + i,
              question_text: `Mock soal ${i + 1} (${qtype}) untuk topik ${topic}`,
              code_template: qtype !== "mcq" ? `# contoh kode untuk soal ${i + 1}` : undefined,
              options: qtype === "mcq" ? ["Opsi A", "Opsi B", "Opsi C", "Opsi D"] : undefined,
              question_type: qtype,
              difficulty,
            };
          });

          setQuestionSet(mockQuestions);
          setCurrentIndex(0);
          const screenPath = getQuestionScreenPath(mockQuestions[0].question_type);
          router.push(`/level/${screenPath}` as any);
        }
      } catch (error) {
        console.error("Error generating question set:", error);
        Alert.alert("Error", "Gagal membuat set soal. Coba lagi.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Jika level sudah ada soal, langsung navigasi
    if (node.id <= questionSet.length) {
      const q = questionSet[node.id - 1];
      setCurrentIndex(node.id - 1);
      const screenPath = getQuestionScreenPath(q.question_type);

      console.log("Navigating to question", node.id, "path:", screenPath);
      router.push(`/level/${screenPath}` as any);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={{ marginTop: 10, color: "#666" }}>Membuat soal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flex: 1, position: "relative" }}>
        <Text style={styles.header}>CodeJourney - {topic}</Text>
        <Text style={{ paddingHorizontal: 16, marginBottom: 8, color: "#666" }}>
          Difficulty: {difficulty} | Soal: {questionSet.length}/10
        </Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            height: totalHeight,
            paddingTop: CONTENT_TOP - 75,
            paddingBottom: 160,
          }}
        >
          <Svg width={SCREEN_W} height={totalHeight} style={{ position: "absolute", top: 0 }}>
            {levels.map((_, i) => {
              if (i === levels.length - 1) return null;

              return <Path key={`path-${i}`} d={makePath(i)} stroke="#93b7cf" strokeWidth={4} fill="none" strokeLinecap="round" strokeDasharray="12 10" />;
            })}

            {levels.map((_, i) => {
              const cy = i * spacing + CONTENT_TOP;

              return <Circle key={`circle-${i}`} cx={timeline} cy={cy} r={radius + 4} fill="transparent" />;
            })}
          </Svg>

          {levels.map((node, idx) => {
            const imageOnRight = idx % 2 === 0;
            const baseImageTop = spacing / 2 - CARD_H / 2;
            const extraOffset = imageOnRight && idx === 0 ? -1 : 0;
            const imageTop = baseImageTop + extraOffset;

            return (
              <View key={node.id} style={[styles.row, { height: spacing, position: "relative" }]}>
                <View
                  style={[
                    styles.side,
                    !imageOnRight && styles.imgSide,
                    {
                      position: "absolute",
                      top: imageTop - 28,
                      left: 0,
                      width: 138,
                      height: CARD_H,
                      zIndex: 2,
                    },
                  ]}
                >
                  {!imageOnRight ? (
                    <View style={[styles.cardImage, { height: CARD_H }]}>
                      <Image source={node.imgLeft} style={styles.imgLeft} resizeMode="contain" />
                    </View>
                  ) : null}
                </View>

                <View
                  style={[
                    styles.side,
                    imageOnRight && styles.imgSide,
                    {
                      position: "absolute",
                      top: imageOnRight ? (idx === 0 ? imageTop : imageTop - 30) : undefined,
                      right: 0,
                      width: 140,
                      height: CARD_H,
                      zIndex: 2,
                    },
                  ]}
                >
                  {imageOnRight ? (
                    <View style={[styles.cardImage, { height: CARD_H }]}>
                      <Image source={node.imgRight} style={styles.imgRight} resizeMode="contain" />
                    </View>
                  ) : null}
                </View>

                <View style={styles.side}></View>

                <TouchableOpacity
                  onPress={() => handlePress(node)}
                  activeOpacity={1}
                  style={{
                    position: "absolute",
                    left: timeline + (idx % 2 === 0 ? -70 : 70) - radius,
                    top: spacing / 2 - radius,
                    zIndex: 3,
                  }}
                >
                  <View style={[styles.node, node.status === "done" && styles.nodeDone, node.status === "locked" && styles.nodeLocked]}>
                    {node.status === "done" ? (
                      <FontAwesome name="check" size={23} color="#286292" />
                    ) : node.status === "locked" ? (
                      <FontAwesome name="lock" size={23} color="#286292" />
                    ) : (
                      <Text style={styles.nodeNumber}>{node.id}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
