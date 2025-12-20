import { styles } from "@/styles/knowledgeLevel";
import { useRouter } from "expo-router";
import Slider from "@react-native-community/slider";
import { useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const materiList = ["Variabel dan Tipe Data", "Operator", "Percabangan", "Perulangan", "Pengurutan", "Pencarian"];

const KnowledgeLevel = () => {
  const router = useRouter();
  const [index, setIndex] = useState<number>(2);

  const currentMateri = useMemo(() => materiList[index] ?? materiList[0], [index]);

  const handleContinue = () => {
    router.push({
      pathname: "/startTest",
      params: {
        level: index.toString(),
        topic: currentMateri,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Your Skills with CodeJourney!</Text>

      <View style={styles.card}>
        <Text style={styles.question}>Berdasarkan pengetahuan yang kamu miliki, pilih materi terakhir yang sudah kamu kuasai.</Text>

        <View style={styles.sliderWrapper}>
          <View style={styles.customTrack} />
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={materiList.length - 1}
            step={1}
            value={index}
            onValueChange={(v) => setIndex(v)}
            minimumTrackTintColor="transparent"
            maximumTrackTintColor="transparent"
            thumbTintColor="#7FB6E9"
          />
          <View style={styles.labelBox}>
            <Text style={styles.sliderLabel}>{currentMateri}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Lanjut</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default KnowledgeLevel;
