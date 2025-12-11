import { styles } from "@/styles/materi";
import Slider from "@react-native-community/slider";
import { useState } from "react";
import { Text, View } from "react-native";

const Materi = () => {
  const [value, setValue] = useState(2);

  const materiList = [
    "Variabel dan Tipe Data",
    "Operator",
    "Percabangan",
    "Perulangan",
    "Pengurutan",
    "Pencarian",
  ];

  const currentMateri = materiList[value];

  return (
    <View style={styles.container}>
        <Text style={styles.title}>Test Your Skills with CodeJourney!</Text>

        <View style={styles.card}>
            <Text style={styles.question}>
            Berdasarkan pengetahuan yang kamu miliki, sampai mana kamu menguasai
            Algoritma dan Pemrograman?
            </Text>

            <View style={styles.sliderWrapper}>
            {/* Garis slider custom */}
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

            {/* Label tetap di tengah */}
            <View style={styles.labelBox}>
                <Text style={styles.label}>{currentMateri}</Text>
            </View>
            </View>
        </View>
    </View>
  );
};

export default Materi;
