import { styles } from "@/styles/testResult";
import { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

const TestResult = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const question = [
        {
            question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
            answer: "Lorem ipsum dolor sit amet",
            correct: true,
            explanation: "Penjelasan jawabanmu benar",
        },
        {
            question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
            answer: "Lorem ipsum dolor sit amet",
            correct: false,
            explanation: "Jawabanmu salah karena ...",
        },
        {
            question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
            answer: "Lorem ipsum dolor sit amet",
            correct: true,
            explanation: "Penjelasan jawabanmu benar",
        },
        {
            question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
            answer: "Lorem ipsum dolor sit amet",
            correct: false,
            explanation: "Jawabanmu salah karena ...",
        },
    ];

    const toggleCard = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.hasil}>Hasil Saya</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 200 }}>
                {question.map((q, index) => {
                    const isOpen = openIndex === index;

                    return (
                        <TouchableOpacity
                            key={index}
                            activeOpacity={0.8}
                            onPress={() => toggleCard(index)}
                            style={[
                                styles.card,
                                isOpen && styles.activeCard,
                            ]}
                        >
                            {/* SOAL */}
                            <Text
                                style={[
                                    styles.cardText,
                                    isOpen && styles.activeCardText
                                ]}
                            >
                                {q.question}
                            </Text>

                            {/* GARIS PEMBATAS */}
                            <View style={styles.divider} />

                            {/* JAWABAN */}
                            <View style={styles.answerRow}>
                                <Text
                                    style={[
                                        styles.answerText,
                                        isOpen && styles.activeAnswerText
                                    ]}
                                >
                                    {q.answer}
                                </Text>

                                <Text
                                    style={[
                                        styles.statusIcon,
                                        {
                                            color: q.correct
                                                ? (isOpen ? "#0c7520ff" : "#53E071")
                                                : "#FF4A4A"
                                        }
                                    ]}
                                >
                                    {q.correct ? "✔" : "✘"}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* BOTTOM SHEET UNTUK BENAR & SALAH */}
            {openIndex !== null && (
                <View style={styles.bottomSheet}>
                    <Image
                        source={require('../assets/images/lampu.png')}
                        style={styles.cornerImage}
                    />

                    <Text style={styles.exTitle}>
                        {question[openIndex].correct
                            ? "Kenapa kamu benar?"
                            : "Kenapa kamu salah?"}
                    </Text>

                    <Text style={styles.exText}>
                        {question[openIndex].explanation}
                    </Text>
                </View>
            )}
        </View>
    );
};

export default TestResult;
