import { router } from "expo-router";
import { useEffect } from "react";

export default function Index() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/main/dashboard");
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return null;
}