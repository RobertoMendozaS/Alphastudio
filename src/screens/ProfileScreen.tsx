import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useRoadmapStore } from '../store/roadmapStore';

type Props = BottomTabScreenProps<MainTabParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { user, isDemo, logout } = useAuthStore();
  const currentRoadmap = useRoadmapStore((state) => state.currentRoadmap);

  const completedNodes = currentRoadmap?.nodes.filter((node) => node.data.isCompleted).length ?? 0;
  const totalNodes = currentRoadmap?.nodes.length ?? 0;
  const progressPercent = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;
  const userEmail = user?.email ?? 'Usuario sin correo';

  const handleLogout = async () => {
    const executeLogout = async () => {
      try {
        await logout();
      } catch (error: any) {
        if (Platform.OS === 'web') {
          window.alert(error.message);
        } else {
          Alert.alert('Error', error.message);
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirm = window.confirm('¿Estás seguro de que quieres cerrar sesión?');
      if (confirm) executeLogout();
      return;
    }

    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: executeLogout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#38bdf8" />
        </View>
        <Text style={styles.email}>{userEmail}</Text>
        {isDemo ? <Text style={styles.demoBadge}>Modo demo sin Supabase</Text> : null}
      </View>

      <View style={styles.progressCard}>
        <Ionicons name="analytics-outline" size={32} color="#38bdf8" />
        <Text style={styles.progressCount}>{progressPercent}%</Text>
        <Text style={styles.progressLabel}>progreso de la ruta actual</Text>
        <Text style={styles.progressDetail}>
          {completedNodes} de {totalNodes} módulos completados
        </Text>
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
  demoBadge: { marginTop: 8, color: '#38bdf8', fontSize: 13 },
  progressCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  progressCount: { fontSize: 48, fontWeight: 'bold', color: '#38bdf8', marginTop: 4 },
  progressLabel: { fontSize: 14, color: '#94a3b8', marginBottom: 8 },
  progressDetail: { fontSize: 13, color: '#64748b' },
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
