import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './src/services/supabaseClient';
import { useAuthStore } from './src/store/authStore';
import type { RootStackParamList } from './src/types/navigation';

import LoginScreen from './src/screens/LoginScreen';
import RoadmapScreen from './src/screens/RoadmapScreen';
import AppTabs from './src/navigation/AppTabs';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const { user, initializing, initializeAuth, setSession } = useAuthStore();

  useEffect(() => {
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [initializeAuth, setSession]);

  if (initializing) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen
              name="AppTabs"
              component={AppTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Roadmap"
              component={RoadmapScreen}
              options={{
                title: 'Mi Ruta',
                headerTintColor: '#38bdf8',
                headerStyle: { backgroundColor: '#0f172a' },
              }}
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
