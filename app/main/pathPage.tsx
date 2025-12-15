import { styles } from "@/styles/pathPage";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

import { quizAPI } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
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

interface Topic {
  id: number;
  name: string;
  description?: string;
  order: number;
  question_count: number;
  completion_percentage: number;
  is_locked: boolean;
}

export default function PathPage() {
  const params = useLocalSearchParams();
  const topic = (params.topic as string) || "";
  const topicId = parseInt(params.id as string) || 0;
  const difficulty = parseInt(params.difficulty as string) || 2;

  const { isAuthenticated } = useAuth();
  const { questionSet, setQuestionSet, setCurrentIndex, setTopic, setTopicId, setDifficulty } = useQuestions();

  // Determine if we're showing all topics or a specific topic
  const showAllTopics = !topicId || topicId === 0;

  // Store topic info in context
  useEffect(() => {
    if (!showAllTopics) {
      setTopic(topic);
      setTopicId(topicId);
      setDifficulty(difficulty);
    }
  }, [topic, topicId, difficulty, showAllTopics, setTopic, setTopicId, setDifficulty]);

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
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);

  // Reload progress when screen comes into focus (e.g., after completing questions)
  useFocusEffect(
    React.useCallback(() => {
      if (showAllTopics) {
        loadAllTopics();
      } else {
        loadUserProgress();
      }
    }, [topicId, isAuthenticated, showAllTopics])
  );

  const loadAllTopics = async () => {
    try {
      setLoadingProgress(true);
      const data = await quizAPI.getTopics();
      setTopics(data);
      
      // Create levels based on topics
      const topicLevels: LevelItem[] = data.map((t: Topic, i: number) => ({
        id: t.id,
        title: t.name,
        status: t.is_locked ? "locked" : (t.completion_percentage === 100 ? "done" : "open") as LevelStatus,
        imgLeft: imageLeft[i % imageLeft.length],
        imgRight: imageRight[i % imageRight.length],
        imgLeftSize: { width: 110, height: 70 },
        imgRightSize: { width: 90, height: 90 },
      }));
      
      setLevels(topicLevels);
    } catch (error) {
      console.error("Failed to load topics:", error);
    } finally {
      setLoadingProgress(false);
    }
  };

  const loadUserProgress = async () => {
    if (!isAuthenticated || !topicId) {
      setLoadingProgress(false);
      return;
    }

    try {
      setLoadingProgress(true);
      const attempts = await quizAPI.getUserAttempts(topicId);
      
      console.log("📊 User attempts loaded:", attempts?.length || 0);
      
      if (attempts && attempts.length > 0) {
        // Get unique questions answered correctly
        const correctQuestionIds = new Set(
          attempts.filter((a: any) => a.is_correct).map((a: any) => a.question_id)
        );

        // Get all unique questions attempted (both correct and incorrect)
        const attemptedQuestionIds = new Set(
          attempts.map((a: any) => a.question_id)
        );

        const completedCount = correctQuestionIds.size;
        const attemptedCount = attemptedQuestionIds.size;

        console.log(`✅ Completed: ${completedCount}, 📝 Attempted: ${attemptedCount}`);

        // Update level status based on progress
        // - Levels with correctly answered questions = "done"
        // - Next level after completed ones = "open" 
        // - Future levels = "locked"
        setLevels(prev => prev.map((level, idx) => {
          if (idx < completedCount) {
            // Questions already answered correctly
            return { ...level, status: "done" as LevelStatus };
          } else if (idx === completedCount || (idx === 0 && completedCount === 0)) {
            // Next available question, or first question if none completed
            return { ...level, status: "open" as LevelStatus };
          } else {
            // Future questions
            return { ...level, status: "locked" as LevelStatus };
          }
        }));
      } else {
        // No attempts yet - only first level is open
        console.log("📭 No attempts found, starting fresh");
        setLevels(prev => prev.map((level, idx) => ({
          ...level,
          status: idx === 0 ? "open" : "locked" as LevelStatus
        })));
      }
    } catch (error) {
      console.error("Failed to load progress:", error);
    } finally {
      setLoadingProgress(false);
    }
  };

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

  const handlePress = async (node: LevelItem) => {
    // If showing all topics, navigate to specific topic path
    if (showAllTopics) {
      if (node.status === "locked") {
        Alert.alert("Terkunci", "Selesaikan topik sebelumnya untuk membuka topik ini");
        return;
      }
      
      const selectedTopic = topics.find(t => t.id === node.id);
      if (selectedTopic) {
        router.push({
          pathname: "./pathPage",
          params: {
            id: selectedTopic.id.toString(),
            topic: selectedTopic.name,
            difficulty: "2"
          }
        } as any);
      }
      return;
    }

    // Original logic for specific topic
    if (node.status === "locked") {
      Alert.alert("Terkunci", "Selesaikan level sebelumnya terlebih dahulu");
      return;
    }

    // Load questions from database if not already loaded
    if (questionSet.length === 0) {
      setLoading(true);
      try {
        let questions: any[] = [];

        // Use database-first API - no AI generation fallback
        try {
          questions = await quizAPI.getQuestions(topicId, difficulty);
          console.log("✅ Loaded questions from database:", questions.length);
        } catch (apiError) {
          console.warn("⚠️ Database questions not available:", apiError);
          // Show alert to inform user
          Alert.alert(
            "No Questions Available",
            `No questions found for "${topic}". Please ask the admin to generate questions for this topic.`,
            [{ text: "OK" }]
          );
          setLoading(false);
          return;
        }

        if (questions && questions.length > 0) {
          setQuestionSet(questions);
          // Navigate to the clicked level (not always level 0)
          const targetIndex = Math.min(node.id - 1, questions.length - 1);
          setCurrentIndex(targetIndex);

          const screenPath = getQuestionScreenPath(questions[targetIndex].question_type);
          router.push(`/level/${screenPath}` as any);
        } else {
          Alert.alert(
            "No Questions",
            "No questions available for this topic yet.",
            [{ text: "OK" }]
          );
        }
      } catch (error) {
        console.error("Error loading questions:", error);
        Alert.alert("Error", "Failed to load questions. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // If questions already loaded, navigate to the selected level
    if (node.id <= questionSet.length) {
      const q = questionSet[node.id - 1];
      setCurrentIndex(node.id - 1);
      const screenPath = getQuestionScreenPath(q.question_type);

      console.log("Navigating to question", node.id, "path:", screenPath);
      router.push(`/level/${screenPath}` as any);
    } else {
      Alert.alert("Invalid Level", "This level is not available.");
    }
  };

  if (loading || loadingProgress) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={{ marginTop: 10, color: "#666" }}>
            {loading ? "Membuat soal..." : "Loading progress..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flex: 1, position: "relative" }}>
        <Text style={styles.header}>
          {showAllTopics ? "CodeJourney - Semua Topik" : `CodeJourney - ${topic}`}
        </Text>
        {!showAllTopics && (
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <Text style={{ color: "#d9eefc", fontSize: 14, fontWeight: "500" }}>
              Difficulty: {difficulty} | Soal: {questionSet.length}/10
            </Text>
            {isAuthenticated && (
              <Text style={{ color: "#4CAF50", fontSize: 12, marginTop: 4 }}>
                ✓ Progress saved to your account
              </Text>
            )}
            {!isAuthenticated && (
              <Text style={{ color: "#FF9800", fontSize: 12, marginTop: 4 }}>
                ⚠ Login to save progress
              </Text>
            )}
          </View>
        )}
        {showAllTopics && (
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <Text style={{ color: "#d9eefc", fontSize: 14, fontWeight: "500" }}>
              Pilih topik untuk memulai belajar
            </Text>
            {isAuthenticated && (
              <Text style={{ color: "#4CAF50", fontSize: 12, marginTop: 4 }}>
                ✓ Progress Anda tersimpan
              </Text>
            )}
          </View>
        )}

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
                      <Text style={styles.nodeNumber}>{showAllTopics ? idx + 1 : node.id}</Text>
                    )}
                  </View>
                  {/* Show caption below node */}
                  <View style={{ position: "absolute", top: radius * 2 + 8, width: 120, left: -48 }}>
                    <Text style={[styles.caption, { textAlign: "center" }]}>
                      {showAllTopics ? node.title : `Soal ${node.id}`}
                    </Text>
                    {showAllTopics && !node.status === "locked" as any && topics.find(t => t.id === node.id)?.completion_percentage > 0 && (
                      <Text style={[styles.caption, { textAlign: "center", fontSize: 11, color: "#4CAF50" }]}>
                        {topics.find(t => t.id === node.id)?.completion_percentage}%
                      </Text>
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
