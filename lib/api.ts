import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from "axios";

// For different platforms:
// 1. Chrome browser (Expo web): "http://localhost:8000/api/"
// 2. Android emulator: "http://10.0.2.2:8000/api/"  
// 3. Physical device: "http://192.168.1.12:8000/api/"
// 4. iOS simulator: "http://localhost:8000/api/"
const API_BASE_URL = "http://localhost:8000/api/";

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
  explanation?: string; // tambah ini
}

class QuizAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add token to requests if available
    this.loadToken();
  }

  private async loadToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        this.client.defaults.headers.common['Authorization'] = `Token ${token}`;
      }
    } catch (error) {
      console.error('Error loading token in API client:', error);
    }
  }

  async setToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Token ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  /**
   * Generate a new question from AI
   */
  async generateQuestion(difficulty: number, questionType: "mcq" | "fill" | "coding"): Promise<Question> {
    try {
      const response = await this.client.post("generate-question/", {
        difficulty,
        question_type: questionType,
      });

      if (response.data.success) {
        // Defensive normalization: ensure `options` is an array when present
        const data = { ...response.data };
        if (data.options && typeof data.options === "string") {
          try {
            data.options = JSON.parse(data.options);
          } catch {
            // Try a forgiving split if API returned a simple comma list
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

  /**
   * Generate a set of 10 questions for a topic
   */
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

  /**
   * Check user answer
   */
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
        explanation: response.data.explanation || "", // tambah ini
      };
    } catch (error) {
      console.error("Error checking answer:", error);
      throw error;
    }
  }

  /**
   * Get a specific question by ID
   */
  async getQuestion(questionId: number): Promise<Question> {
    try {
      const response = await this.client.get(`question/${questionId}/`);
      return response.data;
    } catch (error) {
      console.error("Error fetching question:", error);
      throw error;
    }
  }

  /**
   * Get all topics
   */
  async getTopics() {
    try {
      const response = await this.client.get("topics/");
      return response.data.topics || [];
    } catch (error) {
      console.error("Error fetching topics:", error);
      throw error;
    }
  }

  /**
   * Get questions for a topic
   */
  async getQuestions(topic: string, difficulty?: number) {
    try {
      const params: any = { topic };
      if (difficulty) params.difficulty = difficulty;
      const response = await this.client.get("questions/", { params });
      return response.data.questions || [];
    } catch (error) {
      console.error("Error fetching questions:", error);
      throw error;
    }
  }

  /**
   * Submit answer (replaces old checkAnswer)
   */
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
      };
    } catch (error) {
      console.error("Error submitting answer:", error);
      throw error;
    }
  }

  /**
   * Get user's attempts for a topic
   */
  async getUserAttempts(topicId: number) {
    try {
      const response = await this.client.get("questions/attempts/", {
        params: { topic_id: topicId }
      });
      return response.data.attempts || [];
    } catch (error) {
      console.error("Error fetching attempts:", error);
      throw error;
    }
  }

  /**
   * Set custom base URL (useful for testing different servers)
   */
  setBaseURL(url: string): void {
    this.client.defaults.baseURL = url;
  }
}

// Export singleton instance
export const quizAPI = new QuizAPI();
