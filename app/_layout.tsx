import { Stack } from "expo-router";
import { QuestionProvider } from "@/lib/QuestionContext";

export default function RootLayout() {
  return (
    <QuestionProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </QuestionProvider>
  );
}
