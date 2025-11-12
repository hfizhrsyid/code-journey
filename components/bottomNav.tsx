import { RootStackParamList } from "@/app/navigator";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image, TouchableOpacity, View } from "react-native";
import { styles } from '../styles/bottomNav';

type BottomNavProps<T extends keyof RootStackParamList> = {
  navigation: NativeStackNavigationProp<RootStackParamList, T>;
  current: T;
}

const BottomNav = <T extends keyof RootStackParamList>({ navigation, current }: BottomNavProps<T>) => {
  return(
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate('Path')}>
        <Image
          source={require('../assets/images/path.png')}
          style={styles.imagePath} 
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
        <View style={styles.homeButton}>
          <Image
            source={require('../assets/images/dashboard.png')}
            style={styles.imageDashboard} 
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
        <Image
          source={require('../assets/images/profile.png')}
          style={styles.imageProfile} 
        />
      </TouchableOpacity>
    </View>
  );
};

export default BottomNav;