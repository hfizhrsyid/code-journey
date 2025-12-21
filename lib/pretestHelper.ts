import AsyncStorage from "@react-native-async-storage/async-storage";

export interface PretestRecommendation {
  topic_id: number;
  topic_name: string;
  correct: number;
  total: number;
  score: number;
  recommended_difficulty: number;
}

/**
 * Check if user has completed pretest
 */
export async function isPretestCompleted(): Promise<boolean> {
  try {
    const completed = await AsyncStorage.getItem("pretest_completed");
    return completed === "true";
  } catch {
    return false;
  }
}

/**
 * Check if user has prior experience
 */
export async function hasPriorExperience(): Promise<boolean> {
  try {
    const hasExperience = await AsyncStorage.getItem("has_prior_experience");
    return hasExperience === "true";
  } catch {
    return false;
  }
}

/**
 * Get pretest recommendations for all topics
 */
export async function getPretestRecommendations(): Promise<PretestRecommendation[]> {
  try {
    const data = await AsyncStorage.getItem("pretest_recommendations");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Get recommended difficulty for a specific topic based on pretest results
 * Returns null if no recommendation exists
 */
export async function getRecommendedDifficulty(topicId: number): Promise<number | null> {
  try {
    const recommendations = await getPretestRecommendations();
    const rec = recommendations.find((r) => r.topic_id === topicId);
    return rec ? rec.recommended_difficulty : null;
  } catch {
    return null;
  }
}

/**
 * Check if a topic should be skipped (user scored >= 80% on pretest)
 */
export async function shouldSkipTopic(topicId: number): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem("topics_to_skip");
    if (!data) return false;
    const topicsToSkip: number[] = JSON.parse(data);
    return topicsToSkip.includes(topicId);
  } catch {
    return false;
  }
}

/**
 * Get overall pretest score
 */
export async function getPretestScore(): Promise<number> {
  try {
    const score = await AsyncStorage.getItem("pretest_overall_score");
    return score ? parseInt(score, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Clear all pretest data (useful for retaking pretest)
 */
export async function clearPretestData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      "pretest_completed",
      "pretest_recommendations",
      "pretest_overall_score",
      "topics_to_skip",
      "has_prior_experience",
    ]);
  } catch (error) {
    console.error("Failed to clear pretest data:", error);
  }
}

/**
 * Get topic IDs that user can skip
 */
export async function getSkippableTopics(): Promise<number[]> {
  try {
    const data = await AsyncStorage.getItem("topics_to_skip");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
