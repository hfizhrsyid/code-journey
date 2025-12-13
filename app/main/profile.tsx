import { useAuth } from "@/lib/AuthContext";
import { quizAPI } from "@/lib/api";
import { styles } from "@/styles/profile";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from "react-native";

export default function Profile() {
    const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [stats, setStats] = useState({
        totalAttempts: 0,
        correctAnswers: 0,
        accuracy: 0,
        topicsCompleted: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace("/login");
        } else if (isAuthenticated) {
            loadUserStats();
        }
    }, [isAuthenticated, authLoading]);

    const loadUserStats = async () => {
        try {
            setLoading(true);
            // Get all user attempts across all topics
            const attempts = await quizAPI.getUserAttempts(0); // 0 or undefined for all topics
            
            const totalAttempts = attempts.length;
            const correctAnswers = attempts.filter((a: any) => a.is_correct).length;
            const accuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;
            
            // Count unique topics attempted
            const uniqueTopics = new Set(attempts.map((a: any) => a.question?.topic_id || 0)).size;

            setStats({
                totalAttempts,
                correctAnswers,
                accuracy,
                topicsCompleted: uniqueTopics
            });
        } catch (error) {
            console.error("Failed to load stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        router.replace("/login");
                    }
                }
            ]
        );
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
                <Image
                    source={
                        profileImage
                            ? { uri: profileImage }
                            : require("@/assets/images/profile_pic.jpeg")
                    }
                    style={styles.profile}
                />

                <Pressable style={styles.editIcon} onPress={pickImage}>
                    <MaterialIcons name="edit" size={18} color="#000" />
                </Pressable>
            </View>

            <Text style={styles.username}>
                {user.first_name || user.username}
            </Text>
            <Text style={{ color: "#666", fontSize: 14, marginTop: -5, marginBottom: 20 }}>
                {user.email}
            </Text>

            <View style={styles.progressContainer}>
                <Text style={styles.progressLabel}>Overall Stats</Text>

                <View style={styles.progressBarWrapper}>
                    <View
                        style={[
                            styles.progressBarFill,
                            { width: `${stats.accuracy}%` },
                        ]}
                    />
                    <Text style={styles.progressText}>{stats.accuracy}% Accuracy</Text>
                </View>
            </View>

            <ScrollView
                style={{ flex: 1, width: "100%" }}
                showsVerticalScrollIndicator={false}
            >
                {/* Stats Cards */}
                <View style={{ 
                    flexDirection: "row", 
                    flexWrap: "wrap", 
                    justifyContent: "space-between",
                    marginBottom: 20,
                    paddingHorizontal: 20,
                }}>
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

                {/* Logout Button */}
                <Pressable
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <MaterialIcons name="logout" size={20} color="#fff" />
                    <Text style={styles.textButton}>Logout</Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}
