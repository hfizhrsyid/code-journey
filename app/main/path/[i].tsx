import { useLocalSearchParams } from "expo-router";

export default function PathRoute() {
  const { id } = useLocalSearchParams();
  // return <PathPage initialId={Number(id)} />;
}
