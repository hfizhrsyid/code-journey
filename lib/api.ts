import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosInstance } from "axios";

const getAPIBaseURL = () => {
  const baseURL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
  return `${baseURL}/api/`;
};

const API_BASE_URL = getAPIBaseURL();
const FALLBACK_API_URL = "http://192.168.1.12:8000/api/";

export interface Question {
  question_id: number;
  question_text: string;
  code_template?: string;
  options?: string[];
  question_type: string;
  difficulty: number;
}

export interface CheckAnswerResponse {
  correct: boolean;
  feedback: string;
  correct_answer: string;
  explanation?: string;
  saved?: boolean;
  authenticated?: boolean;
  newly_unlocked_badges?: Array<{
    badge_id: number;
    badge_name: string;
    badge_type: string;
    icon: string;
    topic_name?: string;
  }>;
}

class QuizAPI {
  private client: AxiosInstance;
  private useFallback = false;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptor();
    this.setupFallbackInterceptor();
  }

  private setupInterceptor() {
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const token = await AsyncStorage.getItem("authToken");
          if (token) {
            config.headers.Authorization = `Token ${token}`;
            console.log("✅ Auth token added to request");
          }
        } catch (error) {
          console.error("Error loading token for request:", error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  private setupFallbackInterceptor() {
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Jika request gagal dan belum coba fallback, coba dengan IP
        if (!this.useFallback && error.config && (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND" || error.message === "Network Error" || !error.response)) {
          console.log("🔄 localhost gagal, mencoba IP fallback...");
          this.useFallback = true;

          // Switch ke fallback URL
          this.client.defaults.baseURL = FALLBACK_API_URL;

          // Retry request
          error.config.baseURL = FALLBACK_API_URL;
          return this.client(error.config);
        }

        throw error;
      }
    );
  }

  async setToken(token: string | null) {
    if (token) {
      await AsyncStorage.setItem("authToken", token);
      console.log("✅ Token saved to AsyncStorage");
    } else {
      await AsyncStorage.removeItem("authToken");
      console.log("✅ Token removed from AsyncStorage");
    }
  }

  async generateQuestion(difficulty: number, questionType: "mcq" | "fill" | "coding"): Promise<Question> {
    try {
      const response = await this.client.post("generate-question/", {
        difficulty,
        question_type: questionType,
      });

      if (response.data.success) {
        const data = { ...response.data };
        if (data.options && typeof data.options === "string") {
          try {
            data.options = JSON.parse(data.options);
          } catch {
            const s = data.options.replace(/^\[|\]$/g, "").replace(/"/g, "");
            data.options = s
              .split(",")
              .map((x: string) => x.trim())
              .filter(Boolean);
          }
        }
        return data;
      }
      throw new Error(response.data.error || "Failed to generate question");
    } catch (error) {
      console.error("Error generating question:", error);
      throw error;
    }
  }

  async generateQuestionSet(topic: string, difficulty: number) {
    try {
      const response = await this.client.post("generate-question-set/", {
        topic,
        difficulty,
        count: 10,
        mcq_count: 5,
      });
      return response.data.questions || [];
    } catch (error) {
      console.error("Error generating question set:", error);
      throw error;
    }
  }

  async checkAnswer(questionId: number, answer: string): Promise<CheckAnswerResponse> {
    try {
      const response = await this.client.post("check-answer/", {
        question_id: questionId,
        answer,
      });

      return {
        correct: response.data.correct || false,
        feedback: response.data.feedback || "",
        correct_answer: response.data.correct_answer || "",
        explanation: response.data.explanation || "",
      };
    } catch (error) {
      console.error("Error checking answer:", error);
      throw error;
    }
  }

  async getQuestion(questionId: number): Promise<Question> {
    try {
      const response = await this.client.get(`question/${questionId}/`);
      return response.data;
    } catch (error) {
      console.error("Error fetching question:", error);
      throw error;
    }
  }

  async getTopics() {
    try {
      const response = await this.client.get("topics/");
      return response.data.topics || [];
    } catch (error) {
      console.error("Error fetching topics:", error);
      throw error;
    }
  }

  async getQuestions(topicIdOrName: string | number, difficulty?: number) {
    try {
      const params: any = {};

      if (typeof topicIdOrName === "number") {
        params.topic_id = topicIdOrName;
      } else {
        params.topic = topicIdOrName;
      }

      if (difficulty) params.difficulty = difficulty;

      const response = await this.client.get("questions/", { params });
      return response.data.questions || [];
    } catch (error) {
      console.error("Error fetching questions:", error);
      throw error;
    }
  }

  async submitAnswer(questionId: number, answer: string): Promise<CheckAnswerResponse> {
    try {
      const response = await this.client.post("questions/submit/", {
        question_id: questionId,
        answer,
      });
      return {
        correct: response.data.correct || false,
        feedback: response.data.feedback || "",
        correct_answer: response.data.correct_answer || "",
        explanation: response.data.explanation || "",
        saved: response.data.saved,
        authenticated: response.data.authenticated,
        newly_unlocked_badges: response.data.newly_unlocked_badges || [],
      };
    } catch (error) {
      console.error("Error submitting answer:", error);
      throw error;
    }
  }

  async runCode(questionId: number, code: string) {
    try {
      const response = await this.client.post("questions/run/", {
        question_id: questionId,
        code,
      });
      return {
        passed: response.data.passed || 0,
        failed: response.data.failed || 0,
        total: response.data.total || 0,
        all_passed: response.data.all_passed || false,
        test_results: response.data.test_results || [],
      };
    } catch (error) {
      console.error("Error running code:", error);
      throw error;
    }
  }

  async getUserAttempts(topicId: number) {
    try {
      const response = await this.client.get("questions/attempts/", {
        params: { topic_id: topicId },
      });
      return response.data.attempts || [];
    } catch (error) {
      console.error("Error fetching attempts:", error);
      throw error;
    }
  }

  async getUserBadges() {
    try {
      const response = await this.client.get("user/badges/");
      return response.data || { earned: [], progress: {}, total_earned: 0 };
    } catch (error) {
      console.error("Error fetching user badges:", error);
      return { earned: [], progress: {}, total_earned: 0 };
    }
  }

  async getAllBadges() {
    try {
      const response = await this.client.get("badges/");
      return response.data.badges || [];
    } catch (error) {
      console.error("Error fetching all badges:", error);
      return [];
    }
  }

  setBaseURL(url: string): void {
    this.client.defaults.baseURL = url;
  }
}

export function validateQuestion(question: any): { valid: boolean; error?: string } {
  if (!question) {
    return { valid: false, error: "Soal tidak ditemukan" };
  }

  if (!question.question_text || typeof question.question_text !== "string" || question.question_text.trim() === "") {
    return { valid: false, error: "Teks soal kosong" };
  }

  if (!question.question_type || !["mcq", "fill", "coding"].includes(question.question_type)) {
    return { valid: false, error: "Tipe soal tidak valid" };
  }

  if (question.question_type === "mcq") {
    if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
      return { valid: false, error: "Soal MCQ harus memiliki minimal 2 pilihan" };
    }
  }

  if (question.question_type === "coding") {
    if (!question.code_template || typeof question.code_template !== "string") {
      return { valid: false, error: "Template kode tidak ditemukan" };
    }
  }

  return { valid: true };
}

export const quizAPI = new QuizAPI();
