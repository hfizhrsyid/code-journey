import { useAuth } from "@/lib/AuthContext";
import { styles } from "@/styles/splashScreen";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

export default function Splash() {
  const { isAuthenticated, isLoading } = useAuth();
  const progress = new Animated.Value(0);
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 3500,
      useNativeDriver: false,
    }).start(() => {
      if (!isLoading) {
        if (isAuthenticated) {
          router.replace("/main/dashboard");
        } else {
          router.replace("/login");
        }
      }
    });

    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslate, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isAuthenticated, isLoading]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("../assets/images/splash2.png")}
        style={[
          styles.logo,
          {
            opacity: logoOpacity,
            transform: [{ translateY: logoTranslate }],
          },
        ]}
      />

      <View style={styles.loadingContainer}>
        <Animated.View style={[styles.loadingBar, { width }]} />
      </View>

      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

