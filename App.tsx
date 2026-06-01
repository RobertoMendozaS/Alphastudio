// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import RoadmapScreen from './src/screens/RoadmapScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Roadmap" 
          component={RoadmapScreen} 
          options={{ title: 'Mi Ruta', headerTintColor: '#38bdf8', headerStyle: { backgroundColor: '#0f172a' } }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
