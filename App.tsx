import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './src/services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import type { RootStackParamList } from './src/types/navigation';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RoadmapScreen from './src/screens/RoadmapScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (initializing) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {session && session.user ? (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="History"
              component={HistoryScreen}
              options={{ title: 'Historial', headerTintColor: '#38bdf8', headerStyle: { backgroundColor: '#0f172a' } }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'Perfil', headerTintColor: '#38bdf8', headerStyle: { backgroundColor: '#0f172a' } }}
            />
            <Stack.Screen
              name="Roadmap"
              component={RoadmapScreen}
              options={{ title: 'Mi Ruta', headerTintColor: '#38bdf8', headerStyle: { backgroundColor: '#0f172a' } }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
