import { useQuestions } from "@/lib/QuestionContext";
import { styles } from "@/styles/materi";
import Slider from "@react-native-community/slider";
import { router } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const Materi = () => {
  const [value, setValue] = useState(2);
  const { setTopic, setDifficulty, reset } = useQuestions();

  const materiList = ["Variabel dan Tipe Data", "Operator", "Percabangan", "Perulangan", "Pengurutan", "Pencarian"];

  const currentMateri = materiList[value];

  const handleStart = () => {
    reset();

    const calculatedDifficulty = Math.ceil((value + 1) / 2);
    setTopic(currentMateri);
    setDifficulty(calculatedDifficulty);

    router.push({
      pathname: "/main/pathPage",
      params: { topic: currentMateri, difficulty: calculatedDifficulty },
    } as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Your Skills with CodeJourney!</Text>

      <View style={styles.card}>
        <Text style={styles.question}>Berdasarkan pengetahuan yang kamu miliki, sampai mana kamu menguasai Algoritma dan Pemrograman?</Text>

        <View style={styles.sliderWrapper}>
          <View style={styles.customTrack} />

          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={materiList.length - 1}
            step={1}
            value={value}
            onValueChange={(v) => setValue(v)}
            minimumTrackTintColor="transparent"
            maximumTrackTintColor="transparent"
            thumbTintColor="#B0C4DE"
          />

          <View style={styles.labelBox}>
            <Text style={styles.label}>{currentMateri}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={{
            marginTop: 60,
            paddingHorizontal: 20,
            paddingVertical: 8,
            backgroundColor: "#0066cc",
            borderRadius: 8,
            alignItems: "center",
          }}
          onPress={handleStart}
        >
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Mulai</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Materi;
