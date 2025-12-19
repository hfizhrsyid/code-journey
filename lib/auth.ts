import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosInstance } from "axios";

const API_BASE_URL = `${process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/`;

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
      timeout: 15000, // Naikkan timeout
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.loadToken();
  }

  private async loadToken() {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        this.token = token;
        this.setAuthHeader(token);
      }
    } catch (error) {
      console.error("Error loading token:", error);
    }
  }

  private setAuthHeader(token: string) {
    this.client.defaults.headers.common["Authorization"] = `Token ${token}`;
  }

  private async saveToken(token: string) {
    this.token = token;
    this.setAuthHeader(token);
    await AsyncStorage.setItem("authToken", token);
  }

  async clearToken() {
    this.token = null;
    delete this.client.defaults.headers.common["Authorization"];
    await AsyncStorage.removeItem("authToken");
  }

  getToken(): string | null {
    return this.token;
  }

  async signUp(username: string, email: string, password: string, firstName?: string, lastName?: string): Promise<AuthResponse> {
    try {
      console.log("🔄 Signup to:", API_BASE_URL);
      const response = await this.client.post("signup/", {
        username,
        email,
        password,
        password2: password,
        first_name: firstName || "",
        last_name: lastName || "",
      });

      console.log("✅ Signup success");

      if (response.data.token) {
        await this.saveToken(response.data.token);
      }

      return response.data;
    } catch (error: any) {
      console.error("❌ Signup error:", error.message);
      console.error("Status:", error.response?.status);
      console.error("Data:", error.response?.data);
      throw error.response?.data || { error: error.message };
    }
  }

  async signIn(username: string, password: string): Promise<AuthResponse> {
    try {
      console.log("🔄 Login to:", API_BASE_URL);
      console.log("Username:", username);

      const response = await this.client.post("login/", {
        username,
        password,
      });

      console.log("✅ Login success");

      if (response.data.token) {
        await this.saveToken(response.data.token);
      }

      return response.data;
    } catch (error: any) {
      console.error("❌ Login error:", error.message);
      console.error("Status:", error.response?.status);
      console.error("Data:", error.response?.data);
      console.error("Code:", error.code);
      throw error.response?.data || { error: error.message };
    }
  }

  async getUserProfile(): Promise<User> {
    try {
      const response = await this.client.get("profile/");
      return response.data.user;
    } catch (error: any) {
      throw error.response?.data || { error: error.message };
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.client.post("logout/");
    } catch (error: any) {
      console.error("Logout error:", error);
    } finally {
      await this.clearToken();
    }
  }
}

export default new AuthService();
