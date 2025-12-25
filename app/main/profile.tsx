import { BadgeCard, BadgeItem } from "@/components/BadgeCard";
import { useAuth } from "@/lib/AuthContext";
import { quizAPI } from "@/lib/api";
import { styles } from "@/styles/profile";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function Profile() {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    correctAnswers: 0,
    accuracy: 0,
    topicsCompleted: 0,
  });
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [earnedBadgesCount, setEarnedBadgesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && !authLoading) {
        loadUserData();
      }
    }, [isAuthenticated, authLoading])
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, authLoading]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadUserStats(), loadUserBadges()]);
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await quizAPI.getUserAttempts(0);

      const attempts = Array.isArray(response) ? response : response.attempts || [];

      const totalAttempts = attempts.length;
      const correctAnswers = attempts.filter((a: any) => a.is_correct).length;
      const accuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;

      const uniqueTopics = new Set(attempts.map((a: any) => a.question?.topic_id || a.topic_id).filter((topicId: any) => topicId && topicId > 0)).size;

      console.log("📊 Stats Debug:", {
        totalAttempts,
        correctAnswers,
        accuracy,
        uniqueTopics,
        fullResponse: response,
        sampleAttempts: attempts.slice(0, 2),
      });

      setStats({
        totalAttempts,
        correctAnswers,
        accuracy,
        topicsCompleted: uniqueTopics || 0,
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
      setStats({
        totalAttempts: 0,
        correctAnswers: 0,
        accuracy: 0,
        topicsCompleted: 0,
      });
    }
  };

  const loadUserBadges = async () => {
    try {
      const earnedResponse = await quizAPI.getUserBadges();
      const allBadgesResponse = await quizAPI.getAllBadges();

      const earnedBadgesMap = new Map((earnedResponse.earned || []).map((b: any) => [b.id, b]));

      const formattedBadges: BadgeItem[] = (allBadgesResponse || [])
        .filter((badge: any) => badge.badge_type === "topic_100")
        .map((badge: any) => {
          const earnedBadge = earnedBadgesMap.get(badge.id) as any;
          return {
            id: badge.id,
            name: badge.name,
            description: badge.description,
            icon: badge.icon || "badge-1.png",
            earned_at: earnedBadge?.earned_at,
            is_earned: !!earnedBadge,
          };
        });

      const sortedBadges = formattedBadges.sort((a, b) => {
        if (a.is_earned && b.is_earned) {
          if (a.earned_at && b.earned_at) {
            return new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime();
          }
          return 0;
        }
        if (!a.is_earned && !b.is_earned) {
          return 0;
        }
        return a.is_earned ? -1 : 1;
      });

      setBadges(sortedBadges);
      setEarnedBadgesCount(sortedBadges.filter((b) => b.is_earned).length);
    } catch (error) {
      console.error("Failed to load badges:", error);
      setBadges([]);
      setEarnedBadgesCount(0);
    }
  };

  const handleLogout = async () => {
    console.log("Logout button pressed");
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      Alert.alert("Error", "Failed to logout");
    }
  };

  const pickImage = async () => {
    let permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Permission to access gallery is required!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  if (authLoading || loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CodeJourney</Text>

      <View style={styles.profileWrapper}>
        <Image source={profileImage ? { uri: profileImage } : require("@/assets/images/profile_pic.jpeg")} style={styles.profile} />

        <Pressable style={styles.editIcon} onPress={pickImage}>
          <MaterialIcons name="edit" size={18} color="#000" />
        </Pressable>
      </View>

      <Text style={styles.username}>{user.first_name || user.username}</Text>
      <Text style={{ color: "#666", fontSize: 14, marginTop: -5, marginBottom: 20 }}>{user.email}</Text>

      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>Overall Stats</Text>

        <View style={styles.progressBarWrapper}>
          <View style={[styles.progressBarFill, { width: `${stats.accuracy}%` }]} />
          <Text style={styles.progressText}>{stats.accuracy}% Accuracy</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1, width: "100%" }} contentContainerStyle={{ paddingBottom: 50, flexGrow: 1, paddingTop: 10 }} showsVerticalScrollIndicator={false}>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            marginBottom: 20,
            paddingHorizontal: 20,
          }}
        >
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalAttempts}</Text>
            <Text style={styles.statLabel}>Total Attempts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.correctAnswers}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={[styles.statCard, { width: "100%", marginTop: 10 }]}>
            <Text style={styles.statNumber}>{stats.topicsCompleted}</Text>
            <Text style={styles.statLabel}>Topics Attempted</Text>
          </View>
        </View>

        {badges.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <Text style={[styles.progressLabel, { marginBottom: 15 }]}>
              My Badges ({earnedBadgesCount}/{badges.length})
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              {badges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text style={styles.textButton}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
