import { styles } from "@/styles/codeQuestion";
import { Text, View, TouchableOpacity, TextInput, ScrollView, SafeAreaView, StyleSheet } from "react-native";
import { useState } from "react";

// --- Tipe Data untuk Hasil Testcase ---
interface TestResult {
  id: number;
  name: string;
  input: any[];
  expected: number;
  actual: number;
  passed: boolean;
  details: string;
}

// 🎯 FUNGSI SIMULASI PYTHON (count_ints)
function countInts(items: any[]): number {
  let count = 0;
  for (const item of items) {
    // Cek 1: Tipe harus 'number'.
    // Cek 2: Harus integer (Number.isInteger).
    // Cek 3: Bukan boolean (sesuai permintaan soal).
    if (typeof item === "number" && Number.isInteger(item) && typeof item !== "boolean") {
      count++;
    }
  }
  return count;
}
// --- AKHIR SIMULASI LOGIKA ---

export default function CodingQuestion() {
  const [answer, setAnswer] = useState("");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);

  const runTestCases = () => {
    // --- DEFINISI TESTCASES ---
    const cases = [
      // Skenario 1: Fail (sesuai screenshot Anda, 4 != 3)
      { id: 1, name: "Testcase 1", input: [1, "2", 3, true, 4, -5], expected: 3, actualSimulated: 4, passedSimulated: false },
      // Skenario 2: Pass
      { id: 2, name: "Testcase 2", input: ["hello", 100, 50.5, 0, false, 99], expected: 3 },
      // Skenario 3: Pass
      { id: 3, name: "Testcase 3", input: [1, 2, "3", false], expected: 2 },
    ];

    const results: TestResult[] = cases.map((testCase) => {
      const actual = testCase.actualSimulated !== undefined ? testCase.actualSimulated : countInts(testCase.input);
      const passed = testCase.passedSimulated !== undefined ? testCase.passedSimulated : actual === testCase.expected;

      const details = `Input: [${testCase.input.map((i) => (typeof i === "string" ? `"${i}"` : String(i))).join(", ")}]\n` + `Expected: ${testCase.expected}\n` + `Actual: ${actual}`;

      return { ...testCase, actual, passed, details };
    });

    setTestResults(results);
    // Otomatis memilih Testcase 1
    if (results.length > 0) {
      setSelectedTestId(results[0].id);
    }
  };

  const handleRun = () => {
    runTestCases();
  };

  // --- Komponen Tab Status Testcase ---
  const TestcaseStatus = ({ id, name, passed, isSelected, onPress }: { id: number; name: string; passed: boolean; isSelected: boolean; onPress: (id: number) => void }) => (
    <TouchableOpacity
      style={[
        styles.statusPill,
        {
          // Tetap menggunakan warna gelap untuk tab
          backgroundColor: isSelected ? "#303B4C" : "#2A3440",
          marginRight: id === testResults.length ? 0 : 1,

          // Tambahkan border horizontal di bawah tab yang TIDAK dipilih
          // agar tab terlihat terangkat dari latar belakang gelap utama (opsional)
          borderBottomColor: isSelected ? "transparent" : "#2A3440",
          borderBottomWidth: isSelected ? 0 : 1,
        },
      ]}
      onPress={() => onPress(id)}
    >
      <Text style={styles.statusText}>{name}</Text>
      <Text style={[styles.icon, { color: passed ? "#28A745" : "#DC3545" }]}>{passed ? "✔" : "✘"}</Text>
    </TouchableOpacity>
  );

  // --- Fungsi untuk Mendapatkan Output Detail Testcase yang Terpilih ---
  const getTestcaseDetailOutput = () => {
    const selectedResult = testResults.find((r) => r.id === selectedTestId);

    if (!selectedResult) {
      return 'Silakan klik "Run" untuk melihat hasil testcase.';
    }

    // Format output disesuaikan agar mirip dengan screenshot
    const statusText = selectedResult.passed ? "[PASS]" : "[FAIL]";

    return (
      `${statusText} ${selectedResult.name}:\n` +
      `Input: ${selectedResult.input.map((i) => (typeof i === "string" ? `"${i}"` : String(i))).join(", ")}\n` +
      `Expected: ${selectedResult.expected}\n` +
      `Actual: ${selectedResult.actual}`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* --- Header (Soal 6) --- */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Soal 6</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => {}}>
            <Text style={styles.primaryButtonText}>Perulangan</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* --- Card Soal --- */}
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Tulislah program Python untuk menampilkan semua bilangan ganjil dari 1 sampai 15 menggunakan for loop.
            </Text>
            
          </View>

          {/* --- Input Jawaban --- */}
          <View style={styles.inputCard}>
            <TextInput style={styles.textInput} placeholder="Ketikkan Jawabanmu di sini..." placeholderTextColor="#999" multiline textAlignVertical="top" value={answer} onChangeText={setAnswer} />
          </View>

          {/* --- Area Status Testcase (Header Tab) --- */}
          <View style={styles.statusContainerWrapper}>
            {testResults.length > 0 ? (
              <View style={styles.statusContainer}>
                {testResults.map((result) => (
                  <TestcaseStatus key={result.id} id={result.id} name={result.name} passed={result.passed} isSelected={selectedTestId === result.id} onPress={setSelectedTestId} />
                ))}
              </View>
            ) : null}
          </View>

          {/* --- Kotak Output Detail Testcase (Konten Tab) --- */}
          <View style={styles.outputCard}>
            <ScrollView>
              <Text style={styles.outputText}>{getTestcaseDetailOutput()}</Text>
            </ScrollView>
          </View>
        </ScrollView>

        {/* --- Footer/Tombol Aksi --- */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.runButton} onPress={handleRun}>
            <Text style={styles.footerButtonText}>Run</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextButton} onPress={() => console.log("Submit pressed")}>
            <Text style={styles.footerButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}


