import { AuthProvider } from "@/lib/AuthContext";
import { QuestionProvider } from "@/lib/QuestionContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <AuthProvider>
      <QuestionProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </QuestionProvider>
    </AuthProvider>
  );
}
