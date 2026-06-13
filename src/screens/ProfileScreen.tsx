import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { supabase } from '../services/supabaseClient';
import { signOut, performCheckIn, getStreak } from '../services/authService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const [userEmail, setUserEmail] = useState('');
  const [streak, setStreak] = useState(0);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  const loadProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    setUserEmail(session.user.email ?? '');

    try {
      const currentStreak = await getStreak(session.user.id);
      setStreak(currentStreak);
      setCheckedInToday(currentStreak > 0);
    } catch {
      setStreak(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadProfile);
    return unsubscribe;
  }, [navigation, loadProfile]);

  const handleCheckIn = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    setCheckingIn(true);
    try {
      const success = await performCheckIn(session.user.id);
      if (success) {
        const newStreak = await getStreak(session.user.id);
        setStreak(newStreak);
        setCheckedInToday(true);
        Alert.alert('¡Check-in completado!', `Llevas ${newStreak} día${newStreak !== 1 ? 's' : ''} consecutivo${newStreak !== 1 ? 's' : ''}.`);
      } else {
        Alert.alert('Ya hiciste check-in hoy', 'Vuelve mañana para mantener tu racha.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleLogout = () => {
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
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#38bdf8" />
        </View>
        <Text style={styles.email}>{userEmail}</Text>
      </View>

      <View style={styles.streakCard}>
        <Ionicons name="flame" size={32} color="#f97316" />
        <Text style={styles.streakCount}>{streak}</Text>
        <Text style={styles.streakLabel}>día{streak !== 1 ? 's' : ''} consecutivo{streak !== 1 ? 's' : ''}</Text>

        <TouchableOpacity
          style={[styles.checkInBtn, checkedInToday && styles.checkInBtnDone]}
          onPress={handleCheckIn}
          disabled={checkingIn || checkedInToday}
        >
          {checkingIn ? (
            <ActivityIndicator color="#0f172a" />
          ) : (
            <Text style={styles.checkInBtnText}>
              {checkedInToday ? 'Check-in realizado' : 'Hacer check-in diario'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('History')}>
          <Ionicons name="time-outline" size={22} color="#94a3b8" />
          <Text style={styles.menuText}>Historial de rutas</Text>
          <Ionicons name="chevron-forward" size={18} color="#475569" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  center: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#334155',
  },
  email: { fontSize: 16, color: '#fff', fontWeight: '500' },
  streakCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  streakCount: { fontSize: 48, fontWeight: 'bold', color: '#f97316', marginTop: 4 },
  streakLabel: { fontSize: 14, color: '#94a3b8', marginBottom: 16 },
  checkInBtn: {
    backgroundColor: '#38bdf8',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  checkInBtnDone: { backgroundColor: '#334155' },
  checkInBtnText: { color: '#0f172a', fontSize: 16, fontWeight: 'bold' },
  menu: { marginBottom: 24 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  menuText: { flex: 1, color: '#e2e8f0', fontSize: 16, marginLeft: 12 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7f1d1d',
    backgroundColor: '#1e293b',
  },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});
