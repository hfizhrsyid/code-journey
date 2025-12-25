import { sessionStorage } from "@/lib/sessionStorage";
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
import { getPerfectTopics, getStartingLevel, getStartingTopicId } from "@/lib/pretestHelper";
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

  const showAllTopics = !topicId || topicId === 0;

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
  const [loadingTopicId, setLoadingTopicId] = useState<number | null>(null);

  useEffect(() => {
    if (!showAllTopics && topicId) {
      console.log(`🔄 TopicId changed to ${topicId}, resetting levels to initial state`);

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
      setLoadingProgress(true);
    }
  }, [topicId, showAllTopics]);

  const loadAllTopics = async () => {
    try {
      setLoadingProgress(true);
      const data = await quizAPI.getTopics();

      const topicsArray: Topic[] = Array.isArray(data)
        ? (data as Topic[])
        : ((data as any)?.topics as Topic[]) || [];

      const sortedData = topicsArray.sort((a: Topic, b: Topic) => (a.order || 0) - (b.order || 0));
      setTopics(sortedData);
      
      const startingTopicId = await getStartingTopicId();
      const perfectTopics = await getPerfectTopics();

      const startingTopicOrder = startingTopicId
        ? sortedData.find((t) => t.id === startingTopicId)?.order || null
        : null;

      console.log("========== DEBUG PRETEST ==========");
      console.log("📍 Starting Topic ID:", startingTopicId);
      console.log("✅ Perfect Topics:", perfectTopics);
      console.log("📋 Topics from backend:", sortedData.map(t => ({
        id: t.id,
        name: t.name,
        is_locked: t.is_locked,
        completion: t.completion_percentage
      })));
      console.log("===================================");

      const topicLevels: LevelItem[] = sortedData.map((t: Topic, i: number) => {
        let status: LevelStatus;

        console.log(`\n🔍 Topic ${t.id} (${t.name}):`);
        console.log(`  - Backend is_locked: ${t.is_locked}`);
        console.log(`  - Completion: ${t.completion_percentage}%`);
        console.log(`  - In perfectTopics: ${perfectTopics.includes(t.id)}`);
        console.log(`  - Is startingTopic: ${t.id === startingTopicId}`);
        console.log(`  - Fallback startingTopicOrder: ${startingTopicOrder}`);

        const unlockedByPretestOrder = startingTopicOrder
          ? (t.order || 0) <= startingTopicOrder
          : false;

        if (t.completion_percentage === 100) {
          console.log(`  ✓ DECISION: DONE (100% complete)`);
          status = "done";
        }
        else if (unlockedByPretestOrder) {
          console.log(`  ✅ DECISION: OPEN (fallback: order <= startingTopicOrder)`);
          status = "open";
        }
        else if (t.is_locked) {
          console.log(`  🔒 DECISION: LOCKED`);
          status = "locked";
        }
        else {
          console.log(`  ✅ DECISION: OPEN`);
          status = "open";
        }

        return {
          id: t.id,
          title: t.name,
          status,
          imgLeft: imageLeft[i % imageLeft.length],
          imgRight: imageRight[i % imageRight.length],
          imgLeftSize: { width: 110, height: 70 },
          imgRightSize: { width: 90, height: 90 },
        };
      });

      setLevels(topicLevels);
    } catch (error) {
      console.error("❌ Error in loadAllTopics:", error);
    } finally {
      setLoadingProgress(false);
    }
  };

  const loadSavedPosition = async (topicId: number): Promise<number | null> => {
    const savedSession = await sessionStorage.loadPosition(topicId);
    if (savedSession) {
      return savedSession.currentIndex;
    }
    return null;
  };

  const loadUserProgress = async () => {
    if (!isAuthenticated || !topicId) {
      console.log("⚠️ Not authenticated or no topicId");
      setLoadingProgress(false);
      return;
    }
  const currentTopicId = topicId;
    setLoadingTopicId(currentTopicId);

    try {
      setLoadingProgress(true);
      console.log(`📊 Loading progress for topicId: ${currentTopicId}`);

      const attempts = await quizAPI.getUserAttempts(currentTopicId);

      if (currentTopicId !== topicId) {
        console.log(`🚫 TopicId changed during loading (${currentTopicId} → ${topicId}), ignoring old response`);
        setLoadingTopicId(null);
        return;
      }

      console.log(`📊 User attempts loaded for topicId ${currentTopicId}: ${attempts?.length || 0} attempts`);

      if (attempts && attempts.length > 0) {
        const correctAttempts = attempts.filter((a: any) => a.is_correct);
        const correctQuestionIds = new Set(correctAttempts.map((a: any) => a.question_id));
        const completedCount = correctQuestionIds.size;

        console.log(`✅ Completed (correct answers): ${completedCount}`);

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
        console.log(`📭 No attempts for topicId ${currentTopicId}`);

        const perfectTopics = await getPerfectTopics();
        const isPerfectTopic = perfectTopics.includes(currentTopicId);
        
        if (isPerfectTopic) {
          console.log(`✅ Topic ${currentTopicId} is perfect - opening all levels without checkmarks`);
          setLevels((prev) =>
            prev.map((level) => ({
              ...level,
              status: "open" as LevelStatus
            }))
          );
        } else {
          const startingLevel = await getStartingLevel(currentTopicId);
          console.log(`🎯 Pretest starting level for topic ${currentTopicId}: ${startingLevel}`);
          
          setLevels((prev) =>
            prev.map((level, idx) => {
              const levelNum = idx + 1;
              if (levelNum < startingLevel) {
                return { ...level, status: "done" as LevelStatus };
              } else if (levelNum === startingLevel) {
                return { ...level, status: "open" as LevelStatus };
              } else {
                return { ...level, status: "locked" as LevelStatus };
              }
            })
          );
        }
      }
    } catch (error) {
      console.error(`Failed to load progress for topicId ${topicId}:`, error);

      if (currentTopicId === topicId) {
        setLevels((prev) =>
          prev.map((level, idx) => ({
            ...level,
            status: idx === 0 ? ("open" as LevelStatus) : ("locked" as LevelStatus),
          }))
        );
      }
    } finally {
      if (currentTopicId === topicId) {
        setLoadingProgress(false);
      }
      setLoadingTopicId(null);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (showAllTopics) {
        loadAllTopics();
      } else {
        loadUserProgress();
      }
    }, [showAllTopics])
  );

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
      if (node.status === "locked") {
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
        setTopic(selectedTopic.name);
        setTopicId(selectedTopic.id);
        setDifficulty(2);

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

    if (node.status === "locked") {
      Alert.alert("Terkunci", "Selesaikan level sebelumnya terlebih dahulu");
      return;
    }

    if (questionSet.length === 0) {
      setLoading(true);
      try {
        let questions: any[] = [];

        try {
          questions = await quizAPI.getQuestions(topicId, difficulty);
          console.log(
            `📦 Setting questionSet: ${questions.length} questions`,
            questions.map((q) => q.question_id)
          );

          const savedIndex = await sessionStorage.loadPosition(topicId);
          let indexToUse = savedIndex?.currentIndex ?? 0;

          if (indexToUse >= questions.length) {
            console.warn(`⚠️ Saved index ${indexToUse} melebihi questions length ${questions.length}, reset ke 0`);
            indexToUse = 0;
          }

          console.log(`📂 Using index: ${indexToUse + 1}/${questions.length}`);

          setQuestionSet(questions);
          setCurrentIndex(indexToUse);

          setTimeout(() => {
            const safeIndex = Math.min(indexToUse, questions.length - 1);
            if (safeIndex >= 0 && questions[safeIndex]) {
              const screenPath = getQuestionScreenPath(questions[safeIndex].question_type);
              router.push(`/level/${screenPath}`);
            } else {
              console.error("❌ No valid question found at index", safeIndex);
              Alert.alert("Error", "Gagal memuat soal");
            }
          }, 100);
        } catch (dbError) {
          console.warn("⚠️ Database questions not available, trying AI generation:", dbError);

          try {
            questions = await quizAPI.generateQuestionSet(topic, difficulty);
            console.log("✅ Generated questions using AI:", questions.length);

            setQuestionSet(questions);
            setCurrentIndex(0);

            setTimeout(() => {
              if (questions.length > 0 && questions[0]) {
                const screenPath = getQuestionScreenPath(questions[0].question_type);
                router.push(`/level/${screenPath}`);
              }
            }, 100);
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
