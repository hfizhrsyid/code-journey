import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from "axios";

// For Chrome browser (Expo web), use localhost
const API_BASE_URL = "http://localhost:8000/api/auth/";

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

class AuthService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Load token from storage on init
    this.loadToken();
  }

  private async loadToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        this.token = token;
        this.setAuthHeader(token);
      }
    } catch (error) {
      console.error('Error loading token:', error);
    }
  }

  private setAuthHeader(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Token ${token}`;
  }

  private async saveToken(token: string) {
    this.token = token;
    this.setAuthHeader(token);
    await AsyncStorage.setItem('authToken', token);
  }

  async clearToken() {
    this.token = null;
    delete this.client.defaults.headers.common['Authorization'];
    await AsyncStorage.removeItem('authToken');
  }

  getToken(): string | null {
    return this.token;
  }

  /**
   * Sign up a new user
   */
  async signUp(
    username: string,
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<AuthResponse> {
    try {
      console.log("🔄 Signing up with:", { username, email });
      const response = await this.client.post("signup/", {
        username,
        email,
        password,
        password2: password,
        first_name: firstName || "",
        last_name: lastName || "",
      });

      console.log("✅ Signup response:", response.data);
      
      // Save token
      if (response.data.token) {
        await this.saveToken(response.data.token);
      }
      
      return response.data;
    } catch (error: any) {
      console.error("❌ Signup error:", error);
      console.error("Response status:", error.response?.status);
      console.error("Response data:", error.response?.data);
      console.error("Error message:", error.message);
      
      // Try to extract a meaningful error message
      const errorData = error.response?.data;
      if (typeof errorData === 'object') {
        console.error("Full error object:", JSON.stringify(errorData, null, 2));
      }
      
      throw errorData || { error: error.message || "Signup failed" };
    }
  }

  /**
   * Sign in with username and password
   */
  async signIn(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.client.post("login/", {
        username,
        password,
      });

      // Save token
      if (response.data.token) {
        await this.saveToken(response.data.token);
      }

      return response.data;
    } catch (error: any) {
      console.error("Login error details:", error.response?.data || error.message);
      throw error.response?.data || { error: "Login failed" };
    }
  }

  /**
   * Get current user profile (requires authentication)
   */
  async getUserProfile(): Promise<User> {
    try {
      const response = await this.client.get("profile/");
      return response.data.user;
    } catch (error: any) {
      throw error.response?.data || { error: "Failed to fetch profile" };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      await this.client.post("logout/");
    } catch (error: any) {
      console.error("Logout error:", error);
    } finally {
      // Always clear token on logout
      await this.clearToken();
    }
  }
}

export default new AuthService();
