import BottomNav from "@/components/bottomNav";
import { QuestionProvider } from "@/lib/QuestionContext";
import { Stack } from "expo-router";
import { View } from "react-native";

export default function MainLayout() {
  return (
    <QuestionProvider>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
        <BottomNav />
      </View>
    </QuestionProvider>
  );
}
