import React, { createContext, useState, ReactNode } from "react";

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
  difficulty: number;
  setDifficulty: (difficulty: number) => void;
  goToNextQuestion: () => boolean;
  reset: () => void;
}

export const QuestionContext = createContext<QuestionContextType | undefined>(undefined);

export function QuestionProvider({ children }: { children: ReactNode }) {
  const [questionSet, setQuestionSet] = useState<QuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState(2);

  const goToNextQuestion = () => {
    if (currentIndex + 1 < questionSet.length) {
      setCurrentIndex(currentIndex + 1);
      return true;
    }
    return false;
  };

  const reset = () => {
    setQuestionSet([]);
    setCurrentIndex(0);
    setTopic("");
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
        difficulty,
        setDifficulty,
        goToNextQuestion,
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
