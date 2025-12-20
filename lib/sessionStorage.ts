import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SessionData {
  topicId: number;
  currentIndex: number;
  topic: string;
  difficulty: number;
  lastUpdated: number;
}

const SESSION_KEY = "question_session";
const PRETEST_CAP_KEY = "pretest_cap_topic";

export const sessionStorage = {
  /**
   * Simpan posisi saat ini untuk topik tertentu
   */
  async savePosition(topicId: number, currentIndex: number, topic: string, difficulty: number) {
    try {
      const session: SessionData = {
        topicId,
        currentIndex,
        topic,
        difficulty,
        lastUpdated: Date.now(),
      };
      await AsyncStorage.setItem(`${SESSION_KEY}_${topicId}`, JSON.stringify(session));
      console.log(`💾 Position saved for topic ${topicId}: level ${currentIndex + 1}`);
    } catch (error) {
      console.error("Error saving position:", error);
    }
  },

  /**
   * Muat posisi terakhir untuk topik tertentu
   */
  async loadPosition(topicId: number): Promise<SessionData | null> {
    try {
      const data = await AsyncStorage.getItem(`${SESSION_KEY}_${topicId}`);
      if (data) {
        const session = JSON.parse(data) as SessionData;
        console.log(`📂 Position loaded for topic ${topicId}: level ${session.currentIndex + 1}`);
        return session;
      }
      return null;
    } catch (error) {
      console.error("Error loading position:", error);
      return null;
    }
  },

  /**
   * Hapus posisi untuk topik tertentu (saat soal selesai)
   */
  async clearPosition(topicId: number) {
    try {
      await AsyncStorage.removeItem(`${SESSION_KEY}_${topicId}`);
      console.log(`🗑️ Position cleared for topic ${topicId}`);
    } catch (error) {
      console.error("Error clearing position:", error);
    }
  },

  /**
   * Hapus semua posisi (saat reset)
   */
  async clearAll() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const sessionKeys = keys.filter((k) => k.startsWith(SESSION_KEY));
      await AsyncStorage.multiRemove(sessionKeys);
      console.log(`🗑️ All positions cleared`);
    } catch (error) {
      console.error("Error clearing all positions:", error);
    }
  },

  async savePretestCap(topicId: number) {
    try {
      await AsyncStorage.setItem(PRETEST_CAP_KEY, String(topicId));
      console.log(`💾 Pretest cap saved for topic ${topicId}`);
    } catch (error) {
      console.error("Error saving pretest cap:", error);
    }
  },

  async loadPretestCap(): Promise<number | null> {
    try {
      const raw = await AsyncStorage.getItem(PRETEST_CAP_KEY);
      const parsed = raw ? parseInt(raw) : NaN;
      return Number.isFinite(parsed) ? parsed : null;
    } catch (error) {
      console.error("Error loading pretest cap:", error);
      return null;
    }
  },

  async clearPretestCap() {
    try {
      await AsyncStorage.removeItem(PRETEST_CAP_KEY);
      console.log("🗑️ Pretest cap cleared");
    } catch (error) {
      console.error("Error clearing pretest cap:", error);
    }
  },
};
