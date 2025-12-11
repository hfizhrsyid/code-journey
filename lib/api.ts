import axios, { AxiosInstance } from "axios";

// Change this to your backend URL
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
        return response.data;
      }
      throw new Error(response.data.error || "Failed to generate question");
    } catch (error) {
      console.error("Error generating question:", error);
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
   * Set custom base URL (useful for testing different servers)
   */
  setBaseURL(url: string): void {
    this.client.defaults.baseURL = url;
  }
}

// Export singleton instance
export const quizAPI = new QuizAPI();
