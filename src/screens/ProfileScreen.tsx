import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  ActivityIndicator, Alert,
  StatusBar, Animated, Easing, Platform
} from 'react-native';
import { supabase } from '../services/supabaseClient';
import { signOut, performCheckIn, getStreak } from '../services/authService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

/**
 * Pantalla de Perfil de Usuario.
 * 
 * Muestra la información del usuario (email), su racha actual (streak) y permite
 * realizar un check-in diario para incrementar dicha racha. También proporciona
 * acceso al historial de rutas y permite cerrar sesión.
 *
 * @param {Props} props - Propiedades de navegación de React Navigation.
 */
export default function ProfileScreen({ navigation }: Props) {
  const [userEmail, setUserEmail] = useState('');
  const [streak, setStreak] = useState(0);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  /**
   * Carga los datos iniciales del perfil: sesión actual, email del usuario,
   * y la racha (streak) actual. Verifica también si ya se realizó el check-in hoy.
   * Utiliza useCallback para evitar recrear la función innecesariamente.
   */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const loadProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    setUserEmail(session.user.email ?? '');

    try {
      const { streak, checkedInToday } = await getStreak(session.user.id);
      setStreak(streak);
      setCheckedInToday(checkedInToday);
    } catch {
      setStreak(0);
      setCheckedInToday(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadProfile);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    return unsubscribe;
  }, [navigation, loadProfile]);

  /**
   * Maneja el proceso de check-in diario.
   * Llama a la API para registrar el check-in y actualiza el estado local
   * reflejando la nueva racha si es exitoso, o muestra un mensaje de alerta.
   */
  const handleCheckIn = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    setCheckingIn(true);
    try {
      const success = await performCheckIn(session.user.id);
      if (success) {
        const { streak } = await getStreak(session.user.id);
        setStreak(streak);
        setCheckedInToday(true);
        Alert.alert(
          '🔥 Check-in completado',
          `Llevas ${streak} día${streak !== 1 ? 's' : ''} consecutivo${streak !== 1 ? 's' : ''}.`
        );
      } else {
        Alert.alert('Ya hiciste check-in hoy', 'Vuelve mañana.');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Ocurrió un error inesperado";
      Alert.alert('Error', message);
    } finally {
      setCheckingIn(false);
    }
  };

  /**
   * Maneja el cierre de sesión del usuario.
   * Muestra un cuadro de confirmación (adaptado para web o móvil) y
   * cierra la sesión mediante Supabase Auth.
   */
  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('¿Estás seguro de que quieres cerrar sesión?');
      if (confirm) {
        try {
          await signOut();
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Error al cerrar sesión";
          window.alert(message);
        }
      }
    } else {
      Alert.alert(
        'Cerrar sesión',
        '¿Estás seguro de que quieres cerrar sesión?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Cerrar sesión',
            style: 'destructive',
            onPress: async () => {
              try {
                await signOut();
              } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Error al cerrar sesión";
                Alert.alert('Error', message);
              }
            },
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#06b6d4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Fondo Alpha */}
      <LinearGradient
        colors={['#020617', '#0f172a', '#0c1a2e']}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <Ionicons
          name="arrow-back"
          size={24}
          color="#475569"
          onPress={() => navigation.goBack()}
        />

        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeTxt}>Perfil</Text>
        </View>

        <View style={styles.avatarSmall}>
          <Ionicons name="person" size={16} color="#fff" />
        </View>
      </View>

      {/* CONTENT */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* USER CARD */}
        <View style={styles.userCard}>
          <LinearGradient
            colors={['#06b6d4', '#6366f1']}
            style={styles.avatar}
          >
            <Ionicons name="person" size={28} color="#fff" />
          </LinearGradient>

          <Text style={styles.email}>{userEmail}</Text>
          <Text style={styles.sub}>Usuario Alpha AI</Text>
        </View>

        {/* STREAK CARD */}
        <View style={styles.streakCard}>
          <Ionicons name="flame" size={28} color="#f97316" />

          <Text style={styles.streakCount}>{streak}</Text>
          <Text style={styles.streakLabel}>
            día{streak !== 1 ? 's' : ''} consecutivo{streak !== 1 ? 's' : ''}
          </Text>

          <TouchableOpacity
            style={[
              styles.checkBtn,
              checkedInToday && styles.checkBtnDone
            ]}
            onPress={handleCheckIn}
            disabled={checkingIn || checkedInToday}
            activeOpacity={0.85}
          >
            {checkingIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.checkBtnText}>
                {checkedInToday ? 'Check-in realizado' : 'Hacer check-in'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* MENU */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('History')}
          activeOpacity={0.8}
        >
          <Ionicons name="time-outline" size={20} color="#94a3b8" />
          <Text style={styles.menuText}>Historial de rutas</Text>
          <Ionicons name="chevron-forward" size={18} color="#475569" />
        </TouchableOpacity>

        {/* LOGOUT */}
        <TouchableOpacity
          style={styles.logout}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────
// STYLES ALPHA
// ─────────────────────────────
const styles = {
  container: { flex: 1 },


  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingBottom: 10,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
  },

  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#06b6d4',
  },

  badgeTxt: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },

  avatarSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#06b6d4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    flex: 1,
    padding: 20,
  },

  userCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  email: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },

  sub: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
  },

  streakCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
  },

  streakCount: {
    fontSize: 44,
    fontWeight: '900',
    color: '#f97316',
    marginTop: 6,
  },

  streakLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 12,
  },

  checkBtn: {
    backgroundColor: '#06b6d4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },

  checkBtnDone: {
    backgroundColor: '#1e293b',
  },

  checkBtnText: {
    color: '#fff',
    fontWeight: '700',
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },

  menuText: {
    flex: 1,
    color: '#e2e8f0',
    marginLeft: 12,
    fontSize: 14,
  },

  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#7f1d1d',
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
  },

  logoutText: {
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 8,
  },
} as const;
