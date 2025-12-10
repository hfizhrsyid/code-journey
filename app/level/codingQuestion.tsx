import { styles } from "@/styles/codeQuestion";
import { Text, View, TouchableOpacity, TextInput, ScrollView, SafeAreaView, StyleSheet } from "react-native";
import { useState } from "react";

interface TestResult {
  id: number;
  name: string;
  input: any[];
  expected: number;
  actual: number;
  passed: boolean;
  details: string;
}

function countInts(items: any[]): number {
  let count = 0;
  for (const item of items) {
    if (typeof item === "number" && Number.isInteger(item) && typeof item !== "boolean") {
      count++;
    }
  }
  return count;
}

export default function CodingQuestion() {
  const [answer, setAnswer] = useState("");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);

  const runTestCases = () => {
    const cases = [
      { id: 1, name: "Testcase 1", input: [1, "2", 3, true, 4, -5], expected: 3, actualSimulated: 4, passedSimulated: false },
      { id: 2, name: "Testcase 2", input: ["hello", 100, 50.5, 0, false, 99], expected: 3 },
      { id: 3, name: "Testcase 3", input: [1, 2, "3", false], expected: 2 },
    ];

    const results: TestResult[] = cases.map((testCase) => {
      const actual = testCase.actualSimulated !== undefined ? testCase.actualSimulated : countInts(testCase.input);
      const passed = testCase.passedSimulated !== undefined ? testCase.passedSimulated : actual === testCase.expected;

      const details = `Input: [${testCase.input.map((i) => (typeof i === "string" ? `"${i}"` : String(i))).join(", ")}]\n` + `Expected: ${testCase.expected}\n` + `Actual: ${actual}`;

      return { ...testCase, actual, passed, details };
    });

    setTestResults(results);
    if (results.length > 0) {
      setSelectedTestId(results[0].id);
    }
  };

  const handleRun = () => {
    runTestCases();
  };

  const TestcaseStatus = ({ id, name, passed, isSelected, onPress }: { id: number; name: string; passed: boolean; isSelected: boolean; onPress: (id: number) => void }) => (
    <TouchableOpacity
      style={[
        styles.statusPill,
        {
          backgroundColor: isSelected ? "#303B4C" : "#2A3440",
          marginRight: id === testResults.length ? 0 : 1,
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

  const getTestcaseDetailOutput = () => {
    const selectedResult = testResults.find((r) => r.id === selectedTestId);

    if (!selectedResult) {
      return 'Silakan klik "Run" untuk melihat hasil testcase.';
    }

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
        <View style={styles.header}>
          <Text style={styles.headerText}>Soal 6</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => {}}>
            <Text style={styles.primaryButtonText}>Perulangan</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Tulislah program Python untuk menampilkan semua bilangan ganjil dari 1 sampai 15 menggunakan for loop.
            </Text>
            
          </View>

          <View style={styles.inputCard}>
            <TextInput style={styles.textInput} placeholder="Ketikkan Jawabanmu di sini..." placeholderTextColor="#999" multiline textAlignVertical="top" value={answer} onChangeText={setAnswer} />
          </View>

          <View style={styles.statusContainerWrapper}>
            {testResults.length > 0 ? (
              <View style={styles.statusContainer}>
                {testResults.map((result) => (
                  <TestcaseStatus key={result.id} id={result.id} name={result.name} passed={result.passed} isSelected={selectedTestId === result.id} onPress={setSelectedTestId} />
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.outputCard}>
            <ScrollView>
              <Text style={styles.outputText}>{getTestcaseDetailOutput()}</Text>
            </ScrollView>
          </View>
        </ScrollView>

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