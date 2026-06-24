import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './src/services/supabaseClient';
import { useAuthStore } from './src/store/authStore';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold, Outfit_900Black } from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';
import type { Session } from '@supabase/supabase-js';
import type { RootStackParamList } from './src/types/navigation';
import type { Roadmap } from './src/types/roadmap';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RoadmapScreen from './src/screens/RoadmapScreen';
import AppTabs from './src/navigation/AppTabs';
import { ToastProvider } from './src/components/ToastProvider';
import OnboardingModal from './src/components/OnboardingModal';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator<RootStackParamList>();

const demoRoadmap: Roadmap = {
  title: 'Ruta Demo: React Native',
  description:
    'Ruta temporal para probar nodos checkeables, barra de progreso y flechas entre pasos.',
  nodes: [
    {
      id: 'node-1',
      data: {
        label: 'Fundamentos',
        description: 'Aprende componentes básicos como View, Text, Button y estilos.',
        isCompleted: false,
        resources: [
          {
            id: 'resource-1',
            title: 'Documentación React Native',
            url: 'https://reactnative.dev/docs/getting-started',
            type: 'article',
          },
        ],
      },
    },
    {
      id: 'node-2',
      data: {
        label: 'Navegación',
        description: 'Configura pantallas, stacks y navegación entre vistas.',
        isCompleted: false,
        resources: [
          {
            id: 'resource-2',
            title: 'React Navigation',
            url: 'https://reactnavigation.org/docs/getting-started',
            type: 'article',
          },
        ],
      },
    },
    {
      id: 'node-3',
      data: {
        label: 'Estado global',
        description: 'Usa Zustand o Context para manejar datos compartidos.',
        isCompleted: false,
        resources: [
          {
            id: 'resource-3',
            title: 'Zustand',
            url: 'https://zustand-demo.pmnd.rs/',
            type: 'article',
          },
        ],
      },
    },
  ],
  edges: [],
};

export default function App() {
  const { session, setSession, initializing, initializeAuth } = useAuthStore();
  const [demoMode, setDemoMode] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
  });

  useEffect(() => {
    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [initializeAuth, setSession]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (initializing || (!fontsLoaded && !fontError)) {
    return null;
  }

  return (
    <ToastProvider>
      <NavigationContainer>
        <Stack.Navigator>
          {session ? (
            <>
              <Stack.Screen
                name="AppTabs"
                component={AppTabs}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="History"
                component={HistoryScreen}
                options={{
                  title: 'Historial',
                  headerTintColor: '#0f172a',
                  headerStyle: { backgroundColor: '#ffffff' },
                  headerShadowVisible: false,
                }}
              />
              <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                  title: 'Perfil',
                  headerTintColor: '#0f172a',
                  headerStyle: { backgroundColor: '#ffffff' },
                  headerShadowVisible: false,
                }}
              />
              <Stack.Screen
                name="Roadmap"
                component={RoadmapScreen}
                options={{
                  title: 'Mi Ruta',
                  headerTintColor: '#0f172a',
                  headerStyle: { backgroundColor: '#ffffff' },
                  headerShadowVisible: false,
                }}
              />
            </>
          ) : demoMode ? (
            <Stack.Screen
              name="Roadmap"
              component={RoadmapScreen}
              initialParams={{ roadmap: demoRoadmap }}
              options={{
                title: 'Demo Roadmap',
                headerTintColor: '#0f172a',
                headerStyle: { backgroundColor: '#ffffff' },
                headerShadowVisible: false,
              }}
            />
          ) : (
            <Stack.Screen name="Login" options={{ headerShown: false }}>
              {() => <LoginScreen onDemoLogin={() => setDemoMode(true)} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {fontsLoaded && <OnboardingModal />}
    </ToastProvider>
  );
}
