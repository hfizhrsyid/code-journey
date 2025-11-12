import BottomNav from "@/components/bottomNav";
import { styles } from "@/styles/dashboard";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FlatList, Text, View } from "react-native";
import { RootStackParamList } from "./navigator";

const data = Array.from({ length:20 }, (_, i) => ({
  id: i.toString(),
  title: `Nama Materi ${i + 1}`,
}));

type DashboardScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

const Dashboard: React.FC<DashboardScreenProps> = ({ navigation }) => {
  return(
    <View style={styles.container}>
      <Text style={styles.brand}>CodeJourney</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
          </View>
        )}
      />

      <View style={styles.bottomNav}>
        <BottomNav navigation={navigation} current="Dashboard" />
      </View>
    </View>
  );
};

export default Dashboard;