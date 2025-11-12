import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Dashboard from './dashboard';

export type RootStackParamList = {
  Dashboard: undefined;
  Profile: undefined;
  Path: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigator() {
  return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Dashboard" component={Dashboard}/>
      </Stack.Navigator>
  );
}