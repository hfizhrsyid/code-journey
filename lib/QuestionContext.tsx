import React, { createContext, ReactNode, useState } from "react";
import { sessionStorage } from "./sessionStorage";

export interface QuestionData {
  question_id: number;
  question_text: string;
  code_template?: string;
  options?: string[];
  question_type: string;
  difficulty: number;
}

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

  const goToNextQuestion = () => {
    if (currentIndex + 1 < questionSet.length) {
      setCurrentIndex(currentIndex + 1);
      return true;
    }
    return false;
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
