import { styles } from "@/styles/profile";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

/* =====================
   PROGRESS
===================== */

const MATERIALS = [
    "variabel_tipe_data",
    "operator",
    "percabangan",
    "perulangan",
    "pengurutan",
    "pencarian",
] as const;

type MaterialKey = typeof MATERIALS[number];
const LEVEL_PER_MATERIAL = 10;
const TOTAL_LEVEL = MATERIALS.length * LEVEL_PER_MATERIAL;

/* =====================
   DUMMY DATA (NANTI API)
===================== */
type UserProgress = {
    materials: Record<MaterialKey, number>;
};

const initialProgress: UserProgress = {
    materials: {
        variabel_tipe_data: 10,
        operator: 10,
        percabangan: 10,
        perulangan: 10,
        pengurutan: 10,
        pencarian: 10,
    },
};

const calculateProgress = (progress: UserProgress) => {
    const completedLevels = Object.values(progress.materials)
        .reduce((total, value) => total + value, 0);

    return Math.round((completedLevels / TOTAL_LEVEL) * 100);
};

/* =====================
   BADGE
===================== */
const BADGES = [
    {
        key: "variabel_tipe_data" as MaterialKey,
        title: "Variable Master",
        desc: "Kamu resmi menguasai fondasi pemrograman!",
        on: require("@/assets/images/badges/badge-1.png"),
    },
    {
        key: "operator" as MaterialKey,
        title: "Operator Pro",
        desc: "Logika dan perhitungan sudah jadi temanmu!",
        on: require("@/assets/images/badges/badge-2.png"),
    },
    {
        key: "percabangan" as MaterialKey,
        title: "Decision Maker",
        desc: "Kamu sudah mahir membuat keputusan dalam program!",
        on: require("@/assets/images/badges/badge-3.png"),
    },
    {
        key: "perulangan" as MaterialKey,
        title: "Loop Hero",
        desc: "Kamu sudah menguasai seni pengulangan!",
        on: require("@/assets/images/badges/badge-4.png"),
    },
    {
        key: "pengurutan" as MaterialKey,
        title: "Sorting Expert",
        desc: "Kamu sudah paham cara menyusun data seperti pro!",
        on: require("@/assets/images/badges/badge-5.png"),
    },
    {
        key: "pencarian" as MaterialKey,
        title: "Search Master",
        desc: "Kamu seperti detektif data! Cepat, tepat, dan jeli!",
        on: require("@/assets/images/badges/badge-6.png"),
    },
];

export default function Profile() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const pickImage = async () => {
        let permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            alert("Izin diperlukan untuk mengakses galeri!");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], 
            quality: 1,
        });

      if (!result.canceled) {
          setSelectedImage(result.assets[0].uri);
      }
  };

    // Progress
    const [userProgress, setUserProgress] =
        useState<UserProgress>(initialProgress);
    const progress = calculateProgress(userProgress);

    /* =====================
      SIMULASI LEVEL SELESAI
      (HAPUS NANTI)
    ===================== */
    const completeLevel = (material: MaterialKey) => {
        setUserProgress(prev => ({
            ...prev,
            materials: {
                ...prev.materials,
                [material]: Math.min(
                    prev.materials[material] + 1,
                    LEVEL_PER_MATERIAL
                ),
            },
        }));
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>CodeJourney</Text>

            <View style={styles.profileWrapper}>
                <Image
                source={
                    selectedImage
                    ? { uri: selectedImage }
                    : require("@/assets/images/profile_pic.jpeg")
                }
                style={styles.profile}
                />

                <Pressable style={styles.editIcon} onPress={pickImage}>
                    <MaterialIcons name="edit" size={18} color="#000" />
                </Pressable>
            </View>

            <Text style={styles.username}>Mingyuuuu</Text>

            <View style={styles.progressContainer}>
                <Text style={styles.progressLabel}>Progress</Text>

                <View style={styles.progressBarWrapper}>
                    <View style={[styles.progressBarFill, { width: `${progress}%` },]}/>
                    <Text style={styles.progressText}>{progress}%</Text>
                </View>
            </View>

            <View style={styles.badgeContainer}>
                <Text style={styles.badgeLabel}>My Badge</Text>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.badgeScroll}
                >
                    {BADGES.filter(
                        badge =>
                            userProgress.materials[badge.key] === LEVEL_PER_MATERIAL
                    ).map(badge => (
                        <View key={badge.key} style={styles.badgeItemHorizontal}>
                            <Image
                                source={badge.on}
                                style={styles.badgeImage}
                            />
                            <Text style={styles.badgeName}>{badge.title}</Text>
                            <Text style={styles.badgeDesc}>{badge.desc}</Text>
                        </View>
                    ))}

                    {BADGES.filter(
                        badge =>
                            userProgress.materials[badge.key] === LEVEL_PER_MATERIAL
                    ).length === 0 && (
                        <Text style={styles.badgeEmpty}>
                            Kamu belum memiliki badge, ayo selesaikan seluruh level untuk mendapatkan badge!
                        </Text>
                    )}
                </ScrollView>
            </View>
            
            <Pressable style={styles.logoutButton} onPress={() => router.replace("/login")}>
                <Text style={styles.textButton}>Logout</Text>
            </Pressable>
        </View>
    );
}
