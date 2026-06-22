import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type AppTabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: '#0f172a',
        },
        headerTintColor: '#38bdf8',
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#334155',
        },
        tabBarActiveTintColor: '#38bdf8',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

          if (route.name === 'Home') iconName = 'home-outline';
          if (route.name === 'History') iconName = 'time-outline';
          if (route.name === 'Profile') iconName = 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'Historial' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}
