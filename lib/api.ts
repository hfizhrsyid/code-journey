import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from "axios";

// For different platforms:
// 1. Chrome browser (Expo web): "http://localhost:8000/api/"
// 2. Android emulator: "http://10.0.2.2:8000/api/"  
// 3. Physical device: "http://192.168.1.12:8000/api/"
// 4. iOS simulator: "http://localhost:8000/api/"
const API_BASE_URL = "http://localhost:8000/api/";

export interface Question {
  // Backend sometimes returns `id`, other times `question_id`; keep both to avoid narrowing errors
  id?: number;
  question_id: number;
  question_text: string;
  code_template?: string;
  options?: string[];
  question_type: string;
  difficulty: number;
  answer_key?: string;
  explanation?: string;
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
   * Get questions for a topic (by topic ID or name)
   */
  async getQuestions(topicIdOrName: string | number, difficulty?: number) {
    try {
      const params: any = {};
      
      // If topicIdOrName is a number, use topic_id, otherwise use topic name
      if (typeof topicIdOrName === 'number') {
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

  /**
   * Get questions with progressive difficulty (easy to hard)
   * Returns 10 questions sorted by difficulty for adaptive learning
   */
  async getProgressiveQuestions(topicIdOrName: string | number) {
    console.log("🔍 getProgressiveQuestions called with:", topicIdOrName);
    try {
      const params: any = {};
      
      // If topicIdOrName is a number, use topic_id, otherwise use topic name
      if (typeof topicIdOrName === 'number') {
        params.topic_id = topicIdOrName;
      } else {
        params.topic = topicIdOrName;
      }
      
      // Don't filter by difficulty - get all difficulties
      params.limit = 30; // Get more to ensure we have enough for each difficulty
      
      console.log("📡 Fetching questions with params:", params);
      const response = await this.client.get("questions/", { params });
      let questions = response.data.questions || [];
      console.log(`📦 Received ${questions.length} questions from API`);
      
      // Sort by difficulty (ascending) so questions get progressively harder
      questions.sort((a: any, b: any) => a.difficulty - b.difficulty);
      
      // Take 10 questions with progressive difficulty:
      // - Questions 1-3: difficulty 1 (easy start)
      // - Questions 4-7: difficulty 2 (medium challenge)
      // - Questions 8-10: difficulty 3 (hard finish)
      const progressive: any[] = [];
      const byDifficulty: { [key: number]: any[] } = { 1: [], 2: [], 3: [] };
      
      // Group by difficulty
      questions.forEach((q: any) => {
        if (byDifficulty[q.difficulty]) {
          byDifficulty[q.difficulty].push(q);
        }
      });

      // Shuffle within each difficulty so the same slot isn't always the same question
      [1, 2, 3].forEach((d) => {
        byDifficulty[d] = (byDifficulty[d] || []).sort(() => Math.random() - 0.5);
      });
      
      // Default distribution (admin can adjust backend; frontend mirrors defaults)
      const distribution = [
        { difficulty: 1, count: 3 },
        { difficulty: 2, count: 3 },
        { difficulty: 3, count: 3 },
        { difficulty: 4, count: 3 },
        { difficulty: 5, count: 3 },
      ];
      
      distribution.forEach(({ difficulty, count }) => {
        const available = byDifficulty[difficulty] || [];
        const selected = available.slice(0, count);
        progressive.push(...selected);
      });
      
      const desiredTotal = distribution.reduce((sum, item) => sum + item.count, 0);

      // If we don't have enough, fill with whatever is available
      if (progressive.length < desiredTotal) {
        const remaining = questions.filter(q => !progressive.includes(q));
        progressive.push(...remaining.slice(0, desiredTotal - progressive.length));
      }
      
      const finalQuestions = progressive.slice(0, desiredTotal);
      
      // Log warning if we couldn't get 10 questions
      if (finalQuestions.length < desiredTotal) {
        console.warn(`⚠️ Only ${finalQuestions.length}/${desiredTotal} questions available for progressive mode`);
        console.warn(`Available by difficulty: D1=${byDifficulty[1]?.length || 0}, D2=${byDifficulty[2]?.length || 0}, D3=${byDifficulty[3]?.length || 0}, D4=${byDifficulty[4]?.length || 0}, D5=${byDifficulty[5]?.length || 0}`);
      }
      
      console.log(`✅ Returning ${finalQuestions.length} progressive questions (desired ${desiredTotal})`);
      console.log("📊 Difficulty breakdown:", finalQuestions.map((q, i) => `Q${i+1}:D${q.difficulty}`).join(', '));
      return finalQuestions;
    } catch (error) {
      console.error("Error fetching progressive questions:", error);
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
   * Run code with test cases
   */
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
