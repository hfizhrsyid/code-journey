import React, { createContext, ReactNode, useEffect, useState } from "react";
import { sessionStorage } from "./sessionStorage";

export interface QuestionData {
  question_id: number;
  question_text: string;
  code_template?: string;
  options?: string[];
  question_type: string;
  difficulty: number;
  topic_id?: number;
  topic_name?: string;
}

type Mode = "learning" | "pretest";

interface PretestAnswer {
  topicId: number;
  topicName: string;
  questionId: number;
  correct: boolean;
}

interface PretestTopicMeta {
  id: number;
  name: string;
  order?: number;
}

type PretestPending = Record<number, QuestionData[]>;

interface QuestionContextType {
  questionSet: QuestionData[];
  setQuestionSet: (questions: QuestionData[]) => void;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  topic: string;
  setTopic: (topic: string) => void;
  topicId: number;
  setTopicId: (id: number) => void;
  difficulty: number;
  setDifficulty: (difficulty: number) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
  pretestAnswers: PretestAnswer[];
  pretestTopics: PretestTopicMeta[];
  recordPretestAnswer: (answer: PretestAnswer) => void;
  resetPretest: () => void;
  setPretestTopics: (topics: PretestTopicMeta[]) => void;
  getWeakestPretestTopic: () => PretestTopicMeta | null;
  getNextPretestTopic: (topicId: number) => PretestTopicMeta | null;
  setPretestPending: (pending: PretestPending) => void;
  popPretestQuestion: (topicId: number) => QuestionData | null;
  clearPretestTopic: (topicId: number) => void;
  goToNextQuestion: () => boolean;
  savePosition: () => Promise<void>;
  loadSavedPosition: (topicId: number) => Promise<number | null>;
  reset: () => void;
}

export const QuestionContext = createContext<QuestionContextType | undefined>(undefined);

export function QuestionProvider({ children }: { children: ReactNode }) {
  const [questionSet, setQuestionSet] = useState<QuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [topic, setTopic] = useState("");
  const [topicId, setTopicId] = useState(0);
  const [difficulty, setDifficulty] = useState(2);
  const [mode, setMode] = useState<Mode>("learning");
  const [pretestAnswers, setPretestAnswers] = useState<PretestAnswer[]>([]);
  const [pretestTopics, setPretestTopics] = useState<PretestTopicMeta[]>([]);
  const [pretestPending, setPretestPending] = useState<PretestPending>({});

  // Reset state in-memory ketika topik berubah supaya tidak pakai soal/topik lama
  useEffect(() => {
    setQuestionSet([]);
    setCurrentIndex(0);
  }, [topicId]);

  const goToNextQuestion = () => {
    if (currentIndex + 1 < questionSet.length) {
      setCurrentIndex(currentIndex + 1);
      return true;
    }
    return false;
  };

  const recordPretestAnswer = (answer: PretestAnswer) => {
    setPretestAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== answer.questionId);
      return [...filtered, answer];
    });
  };

  const popPretestQuestion = (topicId: number): QuestionData | null => {
    let next: QuestionData | null = null;
    setPretestPending((prev) => {
      const list = prev[topicId] || [];
      if (list.length === 0) return prev;
      next = list[0];
      const updated = { ...prev, [topicId]: list.slice(1) };
      return updated;
    });
    return next;
  };

  const clearPretestTopic = (topicId: number) => {
    setPretestPending((prev) => {
      if (!prev[topicId]) return prev;
      const updated = { ...prev };
      updated[topicId] = [];
      return updated;
    });
  };

  const resetPretest = () => {
    setMode("learning");
    setPretestAnswers([]);
    setPretestTopics([]);
    setPretestPending({});
  };

  const getWeakestPretestTopic = (): PretestTopicMeta | null => {
    if (pretestTopics.length === 0) return null;

    const scoreMap = new Map<number, { topic: PretestTopicMeta; correct: number; wrong: number }>();

    pretestTopics.forEach((t) => {
      scoreMap.set(t.id, { topic: t, correct: 0, wrong: 0 });
    });

    pretestAnswers.forEach((a) => {
      const current = scoreMap.get(a.topicId) || { topic: { id: a.topicId, name: a.topicName }, correct: 0, wrong: 0 };
      if (a.correct) {
        current.correct += 1;
      } else {
        current.wrong += 1;
      }
      scoreMap.set(a.topicId, current);
    });

    const ranked = Array.from(scoreMap.values()).sort((a, b) => {
      if (b.wrong !== a.wrong) return b.wrong - a.wrong;
      const orderA = a.topic.order ?? 999;
      const orderB = b.topic.order ?? 999;
      return orderA - orderB;
    });

    return ranked[0]?.topic || null;
  };

  const getNextPretestTopic = (topicId: number): PretestTopicMeta | null => {
    if (pretestTopics.length === 0) return null;

    const sorted = [...pretestTopics].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    const idx = sorted.findIndex((t) => t.id === topicId);
    if (idx === -1) return null;
    return sorted[idx + 1] || null;
  };

  /**
   * Simpan posisi saat ini ke AsyncStorage
   */
  const savePosition = async () => {
    if (topicId > 0) {
      await sessionStorage.savePosition(topicId, currentIndex, topic, difficulty);
    }
  };

  /**
   * Muat posisi terakhir dari AsyncStorage
   */
  const loadSavedPosition = async (topicId: number): Promise<number | null> => {
    const savedSession = await sessionStorage.loadPosition(topicId);
    if (savedSession) {
      setCurrentIndex(savedSession.currentIndex);
      return savedSession.currentIndex;
    }
    return null;
  };

  const reset = () => {
    setQuestionSet([]);
    setCurrentIndex(0);
    setTopic("");
    setTopicId(0);
    setDifficulty(2);
    resetPretest();
  };

  return (
    <QuestionContext.Provider
      value={{
        questionSet,
        setQuestionSet,
        currentIndex,
        setCurrentIndex,
        topic,
        setTopic,
        topicId,
        setTopicId,
        difficulty,
        setDifficulty,
        mode,
        setMode,
        pretestAnswers,
        pretestTopics,
        recordPretestAnswer,
        resetPretest,
        setPretestTopics,
        getWeakestPretestTopic,
        getNextPretestTopic,
        setPretestPending,
        popPretestQuestion,
        clearPretestTopic,
        goToNextQuestion,
        savePosition,
        loadSavedPosition,
        reset,
      }}
    >
      {children}
    </QuestionContext.Provider>
  );
}

export function useQuestions() {
  const context = React.useContext(QuestionContext);
  if (!context) {
    throw new Error("useQuestions must be used within QuestionProvider");
  }
  return context;
}
