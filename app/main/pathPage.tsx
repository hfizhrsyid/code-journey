import { styles } from "@/styles/pathPage";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { sessionStorage } from "@/lib/sessionStorage";
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
  const unlockCapId = parseInt(params.unlockCapId as string) || 0;
  const resetProgress = (params.resetProgress as string) === "1" || (params.resetProgress as string) === "true";

  const { isAuthenticated } = useAuth();
  const { questionSet, setQuestionSet, currentIndex, setCurrentIndex, setTopic, setTopicId, setDifficulty } = useQuestions();

  // Determine if we're showing all topics or a specific topic
  const showAllTopics = !topicId || topicId === 0;

  // Store topic info in context
  useEffect(() => {
    if (!showAllTopics) {
      setTopic(topic);
      setTopicId(topicId);
      setDifficulty(difficulty);

      // Pastikan state soal lama dibersihkan saat pindah topik
      setQuestionSet([]);
      setCurrentIndex(0);
    }
  }, [topic, topicId, difficulty, showAllTopics, setTopic, setTopicId, setDifficulty, setQuestionSet, setCurrentIndex]);

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
  const [loadingTopicId, setLoadingTopicId] = useState<number | null>(null);
  const [unlockCapOrder, setUnlockCapOrder] = useState<number | null>(null);

  // TAMBAH: Reset levels ke initial state ketika topicId berubah
  useEffect(() => {
    if (!showAllTopics && topicId) {
      console.log(`🔄 TopicId changed to ${topicId}, resetting levels to initial state`);

      // Reset ke initial levels (hanya level 1 open)
      const newInitialLevels = Array.from({ length: 10 }).map((_, i) => ({
        id: i + 1,
        title: `Soal ${i + 1}`,
        status: (i === 0 ? "open" : "locked") as LevelStatus,
        imgLeft: imageLeft[i % imageLeft.length],
        imgRight: imageRight[i % imageRight.length],
        imgLeftSize: { width: 110, height: 70 },
        imgRightSize: { width: 90, height: 90 },
      }));

      setLevels(newInitialLevels);
      setLoadingProgress(true); // Set loading true saat reset
    }
  }, [topicId, showAllTopics]);

  // Reload progress when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (showAllTopics) {
        loadAllTopics();
      } else {
        if (resetProgress) {
          sessionStorage.clearPosition(topicId);
          setLevels(initialLevels);
          setLoadingProgress(false);
        } else {
          loadUserProgress();
        }
      }
    }, [topicId, isAuthenticated, showAllTopics, resetProgress])
  );

  const loadAllTopics = async () => {
    try {
      setLoadingProgress(true);
      const data = await quizAPI.getTopics();

      // ✅ Ensure data is an array before sorting
      const topicsArray = Array.isArray(data) ? data : [];

      if (topicsArray.length === 0) {
        console.warn("⚠️ No topics returned from API");
        setTopics([]);
        setLevels([]);
        return;
      }

      // ✅ SORT BY ORDER!
      const sortedData = topicsArray.sort((a: Topic, b: Topic) => (a.order || 0) - (b.order || 0));

      // Determine cap id: prefer param, else stored pretest cap
      const storedCapId = unlockCapId ? unlockCapId : await sessionStorage.loadPretestCap();
      const capOrder = storedCapId ? sortedData.find((t) => t.id === storedCapId)?.order ?? null : null;
      setUnlockCapOrder(capOrder ?? null);
      setTopics(sortedData);

      // Create levels based on sorted topics
      const topicLevels: LevelItem[] = sortedData.map((t: Topic, i: number) => {
        if (capOrder !== null) {
          const order = t.order || 0;
          const status: LevelStatus = order < capOrder ? "done" : order === capOrder ? "open" : "locked";
          return {
            id: t.id,
            title: t.name,
            status,
            imgLeft: imageLeft[i % imageLeft.length],
            imgRight: imageRight[i % imageRight.length],
            imgLeftSize: { width: 110, height: 70 },
            imgRightSize: { width: 90, height: 90 },
          };
        }

        return {
          id: t.id,
          title: t.name,
          status: t.is_locked ? "locked" : ((t.completion_percentage === 100 ? "done" : "open") as LevelStatus),
          imgLeft: imageLeft[i % imageLeft.length],
          imgRight: imageRight[i % imageRight.length],
          imgLeftSize: { width: 110, height: 70 },
          imgRightSize: { width: 90, height: 90 },
        };
      });

      setLevels(topicLevels);
    } catch (error) {
      console.error("Failed to load topics:", error);
      Alert.alert("Error", "Failed to load topics. Please try again.");
    } finally {
      setLoadingProgress(false);
    }
  };

  /**
   * Muat posisi terakhir dari AsyncStorage (jangan set state)
   */
  const loadSavedPosition = async (topicId: number): Promise<number | null> => {
    const savedSession = await sessionStorage.loadPosition(topicId);
    if (savedSession) {
      // Hanya return, jangan set state
      return savedSession.currentIndex;
    }
    return null;
  };

  // Jika jumlah soal bisa lebih dari 10, sesuaikan jumlah level
  const loadUserProgress = async () => {
    if (!isAuthenticated || !topicId) {
      console.log("⚠️ Not authenticated or no topicId");
      setLoadingProgress(false);
      return;
    }

    const currentTopicId = topicId; // ✅ Capture current topicId
    setLoadingTopicId(currentTopicId);

    try {
      setLoadingProgress(true);
      console.log(`📊 Loading progress for topicId: ${currentTopicId}`);

      const attempts = await quizAPI.getUserAttempts(currentTopicId);

      // ✅ IGNORE if topicId has changed during loading
      if (currentTopicId !== topicId) {
        console.log(`🚫 TopicId changed during loading (${currentTopicId} → ${topicId}), ignoring old response`);
        setLoadingTopicId(null);
        return;
      }

      console.log(`📊 User attempts loaded for topicId ${currentTopicId}: ${attempts?.length || 0} attempts`);

      if (attempts && attempts.length > 0) {
        // Hitung soal yang sudah dijawab BENAR
        const correctAttempts = attempts.filter((a: any) => a.is_correct);
        const correctQuestionIds = new Set(correctAttempts.map((a: any) => a.question_id));
        const completedCount = correctQuestionIds.size;

        console.log(`✅ Completed (correct answers): ${completedCount}`);

        // Update level status - BATASI completed count ke total levels
        const safeCompletedCount = Math.min(completedCount, 10);

        setLevels((prev) =>
          prev.map((level, idx) => {
            if (idx < safeCompletedCount) {
              return { ...level, status: "done" as LevelStatus };
            } else if (idx === safeCompletedCount) {
              return { ...level, status: "open" as LevelStatus };
            } else {
              return { ...level, status: "locked" as LevelStatus };
            }
          })
        );
      } else {
        // ✅ TOPIK BARU
        console.log(`📭 No attempts for topicId ${currentTopicId}`);
        setLevels((prev) =>
          prev.map((level, idx) => ({
            ...level,
            status: idx === 0 ? ("open" as LevelStatus) : ("locked" as LevelStatus),
          }))
        );
      }
    } catch (error) {
      console.error(`Failed to load progress for topicId ${topicId}:`, error);

      // ✅ Only reset if still loading same topicId
      if (currentTopicId === topicId) {
        setLevels((prev) =>
          prev.map((level, idx) => ({
            ...level,
            status: idx === 0 ? ("open" as LevelStatus) : ("locked" as LevelStatus),
          }))
        );
      }
    } finally {
      // ✅ Only clear if this is still the current loading topicId
      if (currentTopicId === topicId) {
        setLoadingProgress(false);
      }
      setLoadingTopicId(null);
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
    if (showAllTopics) {
      if (unlockCapOrder !== null) {
        const nodeTopic = topics.find((t) => t.id === node.id);
        const nodeOrder = nodeTopic?.order || 0;
        if (nodeOrder > unlockCapOrder) {
          Alert.alert("Topik Terkunci", "Selesaikan pre-test untuk membuka topik berikutnya.");
          return;
        }
      }
      if (node.status === "locked") {
        // ✅ Find by order, not by index
        const nodeTopic = topics.find((t) => t.id === node.id);
        const nodeOrder = nodeTopic?.order || 999;
        const previousTopic = topics.find((t) => t.order === nodeOrder - 1);

        if (previousTopic) {
          Alert.alert("Topik Terkunci", `Selesaikan "${previousTopic.name}" 100% terlebih dahulu.\n\nProgress: ${previousTopic.completion_percentage}%`, [{ text: "OK" }]);
        }
        return;
      }

      const selectedTopic = topics.find((t) => t.id === node.id);
      if (selectedTopic) {
        // ✅ SET CONTEXT BEFORE NAVIGATE!
        setTopic(selectedTopic.name);
        setTopicId(selectedTopic.id);
        setDifficulty(2);

        // THEN navigate
        router.push({
          pathname: "./pathPage",
          params: {
            id: selectedTopic.id.toString(),
            topic: selectedTopic.name,
            difficulty: "2",
          },
        } as any);
      }
      return;
    }

    // Original logic for specific topic
    if (node.status === "locked") {
      Alert.alert("Terkunci", "Selesaikan level sebelumnya terlebih dahulu");
      return;
    }

    // ✅ DETECT if we need to reload:
    // 1. No questions loaded yet
    // 2. User clicked a node earlier than current progress
    const isClickingEarlierNode = (node.id - 1) < currentIndex;  // Compare indices, not node IDs
    const needsReload = questionSet.length === 0 || isClickingEarlierNode;

    if (needsReload) {
      // Reset state before reloading
      setQuestionSet([]);
      setCurrentIndex(0);
      setLoading(true);
      try {
        let questions: any[] = [];

        // Try to load from database first
        try {
          questions = await quizAPI.getQuestions(topicId, difficulty);
          if (!questions || questions.length === 0) {
            console.warn("⚠️ No local questions, generating via AI");
            questions = await quizAPI.generateQuestionSet(topic, difficulty);
          }

          console.log(
            `📦 Setting questionSet: ${questions.length} questions`,
            questions.map((q) => q.question_id)
          );

          if (!questions || questions.length === 0) {
            Alert.alert("Error", "Tidak ada soal untuk topik ini");
            setLoading(false);
            return;
          }

          // Set context with loaded questions
          setQuestionSet(questions);
          
          // ✅ Calculate index but DON'T set currentIndex (component will read from param)
          const nodeIndex = Math.min(node.id - 1, questions.length - 1);

          if (nodeIndex >= 0 && questions[nodeIndex]) {
            const screenPath = getQuestionScreenPath(questions[nodeIndex].question_type);
            router.push({
              pathname: `/level/${screenPath}`,
              params: {
                questionIndex: nodeIndex.toString(),
              },
            } as any);
          } else {
            console.error("❌ No valid question found at node", node.id);
            Alert.alert("Error", "Gagal memuat soal");
            setLoading(false);
            return;
          }
        } catch (dbError) {
          console.warn("⚠️ Database questions not available, trying AI generation:", dbError);

          // Fallback: Generate questions using AI
          try {
            questions = await quizAPI.generateQuestionSet(topic, difficulty);
            console.log("✅ Generated questions using AI:", questions.length);

            setQuestionSet(questions);
            
            const nodeIndex = Math.min(node.id - 1, questions.length - 1);
            if (questions.length > 0 && questions[nodeIndex]) {
              const screenPath = getQuestionScreenPath(questions[nodeIndex].question_type);
              router.push({
                pathname: `/level/${screenPath}`,
                params: {
                  questionIndex: nodeIndex.toString(),
                },
              } as any);
            } else {
              console.error("❌ No valid question at nodeIndex", nodeIndex);
              Alert.alert("Error", "Gagal memuat soal");
              setLoading(false);
            }
          } catch (genError) {
            console.error("❌ AI generation also failed:", genError);
            Alert.alert("No Questions Available", `No questions found for "${topic}" and AI generation failed. Please try again later.`, [{ text: "OK" }]);
            setLoading(false);
            return;
          }
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
      const questionIndex = node.id - 1; // 0-based index
      const q = questionSet[questionIndex];

      // Jangan set currentIndex dulu, biarkan component yang read param
      const screenPath = getQuestionScreenPath(q.question_type);

      console.log(`📍 Navigating to node ${node.id} (index ${questionIndex}), path: ${screenPath}`);

      router.push({
        pathname: `/level/${screenPath}`,
        params: {
          questionIndex: questionIndex.toString(),
        },
      } as any);
    } else {
      Alert.alert("Invalid Level", "This level is not available.");
    }
  };

  const handleNextLevel = () => {
    if (topicId && topic) {
      router.push({
        pathname: "/main/pathPage",
        params: {
          id: topicId.toString(),
          topic: topic,
          difficulty: "2",
        },
      } as any);
    } else {
      // Jika tidak ada topik berikutnya, kembali ke dashboard
      router.push("/main/dashboard");
    }
  };

  if (loading || loadingProgress) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={{ marginTop: 10, color: "#666" }}>{loading ? "Membuat soal..." : "Loading progress..."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flex: 1, position: "relative" }}>
        <Text style={styles.header}>{showAllTopics ? "CodeJourney - Semua Topik" : `CodeJourney - ${topic}`}</Text>

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
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
