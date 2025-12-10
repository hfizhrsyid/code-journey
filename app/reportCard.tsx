import { styles } from "@/styles/reportCard";
import { useRouter } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

const CircleProgress = ({ percent }: { percent: number }) => {
  const radius = 40;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (percent / 100) * circumference;

  return (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
        <Svg width={100} height={100}>
            {/* Definisi gradasi */}
            <Defs>
            <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#608699" stopOpacity="1" />
                <Stop offset="100%" stopColor="#9FDFFF" stopOpacity="1" />
            </LinearGradient>
            </Defs>

            {/* Background putih */}
            <Circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#FFFFFF"
                strokeWidth={strokeWidth}
                fill="none"
            />

            {/* Progress gradasi */}
            <Circle
                cx="50"
                cy="50"
                r={radius}
                stroke="url(#grad)"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={progress}
                strokeLinecap="round"
                rotation="-90"
                origin="50,50"
            />
        </Svg>

            {/* Persentase */}
            <Text
                style={{
                position: "absolute",
                color: "#FFFFFF",
                fontSize: 20,
                fontWeight: "bold",
                }}
            >
                {percent}%
            </Text>
        </View>
    );
    };

    const ReportCard = () => {
    const router = useRouter();

    return (
        <ScrollView style={styles.container}>
            {/* HEADER */}
            <View style={styles.headerRow}>
                <Image
                source={require("../assets/images/hasil.png")}
                style={styles.headerImage}
                resizeMode="contain"
                />
                <Text style={styles.headerTitle}>Good Job!</Text>
            </View>

            {/* CARD */}
            <View style={styles.card}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    {/* Informasi kiri */}
                    <View>
                        <Text style={styles.name}>Mingyuuuu</Text>
                        <Text style={styles.smallText}>Skor      8 / 10</Text>
                        <Text style={styles.smallText}>Waktu   5 min 20 detik</Text>
                    </View>

                    {/* Circle Progress */}
                    <View style={styles.circleContainer}>
                        <CircleProgress percent={80} />
                    </View>
                </View>

                {/* HASIL */}
                <Text style={styles.sectionTitle}>Hasil</Text>
                <Text style={styles.descText}>Petualangan belajarmu dimulai dari materi</Text>

                <View style={styles.badge}>
                    <Text style={styles.badgeText}>Percabangan</Text>
                </View>

                {/* MATERI */}
                <Text style={styles.sectionTitle}>Materi</Text>

                <View style={styles.progressRow}>
                    <Text style={styles.progressText}>Variabel dan Tipe Data</Text>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBar, { width: "90%" }]} /></View>
                    <Text style={styles.progressValue}>90%</Text>
                </View>

                <View style={styles.progressRow}>
                    <Text style={styles.progressText}>Operator</Text>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBar, { width: "85%" }]} /></View>
                    <Text style={styles.progressValue}>85%</Text>
                </View>

                <View style={styles.progressRow}>
                    <Text style={styles.progressText}>Percabangan</Text>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBar, { width: "70%" }]} /></View>
                    <Text style={styles.progressValue}>70%</Text>
                </View>

                {/* BUTTON */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.outlineButton}
                        onPress={() => router.push("/testResult")}
                    >
                        <Text style={styles.outlineText}>Hasil Saya</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.outlineButton}>
                        <Text style={styles.outlineText}>Mulai Belajar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

export default ReportCard;
