import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  ActivityIndicator, Alert,
  StatusBar, Animated, Easing, Platform,
  Modal, TextInput, ScrollView, StyleSheet,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { useRoadmapStore } from '../store/roadmapStore';
import { performCheckIn, getStreak, updateProfile } from '../services/authService';

type Props = BottomTabScreenProps<MainTabParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { user, isDemo, logout } = useAuthStore();
  const currentRoadmap = useRoadmapStore((state) => state.currentRoadmap);
  const surveyResponses = useRoadmapStore((state) => state.surveyResponses);
  const loadSurveyResponses = useRoadmapStore((state) => state.loadSurveyResponses);
  const [streak, setStreak] = useState(0);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [surveyModalVisible, setSurveyModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const completedNodes = currentRoadmap?.nodes.filter((node) => node.data.isCompleted).length ?? 0;
  const totalNodes = currentRoadmap?.nodes.length ?? 0;
  const progressPercent = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;
  const userEmail = user?.email ?? 'Usuario sin correo';

  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getStreak(user.id);
      setStreak(data.streak);
      setCheckedInToday(data.checkedInToday);
    } catch {
      setStreak(0);
      setCheckedInToday(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
  }, [navigation, loadProfile, fadeAnim, slideAnim]);

  const handleOpenEdit = () => {
    setEditDisplayName(user?.email ?? '');
    setEditAvatarUrl('');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setEditSaving(true);
    try {
      await updateProfile(user.id, {
        display_name: editDisplayName,
        avatar_url: editAvatarUrl || undefined,
      });
      Alert.alert('Perfil actualizado', 'Los cambios se guardaron correctamente.');
      setEditModalVisible(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar perfil';
      Alert.alert('Error', message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleCheckIn = async () => {
    if (!user) return;
    setCheckingIn(true);
    try {
      const success = await performCheckIn(user.id);
      if (success) {
        const { streak: newStreak } = await getStreak(user.id);
        setStreak(newStreak);
        setCheckedInToday(true);
        Alert.alert(
          '🔥 Check-in completado',
          `Llevas ${newStreak} día${newStreak !== 1 ? 's' : ''} consecutivo${newStreak !== 1 ? 's' : ''}.`
        );
      } else {
        Alert.alert('Ya hiciste check-in hoy', 'Vuelve mañana.');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Ocurrió un error inesperado';
      Alert.alert('Error', message);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleViewSurveyData = () => {
    loadSurveyResponses();
    setSurveyModalVisible(true);
  };

  const handleLogout = async () => {
    const executeLogout = async () => {
      try {
        await logout();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error al cerrar sesión';
        if (Platform.OS === 'web') {
          window.alert(message);
        } else {
          Alert.alert('Error', message);
        }
      }
    };
    if (Platform.OS === 'web') {
      const confirm = window.confirm('¿Estás seguro de que quieres cerrar sesión?');
      if (confirm) await executeLogout();
      return;
    }
    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: executeLogout },
    ]);
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
      <LinearGradient colors={['#020617', '#0f172a', '#0c1a2e']} style={StyleSheet.absoluteFill} />
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
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.userCard}>
          <LinearGradient colors={['#06b6d4', '#6366f1']} style={styles.avatar}>
            <Ionicons name="person" size={28} color="#fff" />
          </LinearGradient>
          <View style={styles.emailRow}>
            <Text style={styles.email}>{userEmail}</Text>
            <TouchableOpacity onPress={handleOpenEdit} activeOpacity={0.7}>
              <Ionicons name="pencil" size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sub}>Usuario Alpha AI</Text>
          {isDemo ? <Text style={styles.demoBadge}>Modo demo sin Supabase</Text> : null}
        </View>
        {currentRoadmap ? (
          <View style={styles.progressCard}>
            <Ionicons name="analytics-outline" size={32} color="#38bdf8" />
            <Text style={styles.progressCount}>{progressPercent}%</Text>
            <Text style={styles.progressLabel}>progreso de la ruta actual</Text>
            <Text style={styles.progressDetail}>
              {completedNodes} de {totalNodes} módulos completados
            </Text>
          </View>
        ) : null}
        <View style={styles.streakCard}>
          <Ionicons name="flame" size={28} color="#f97316" />
          <Text style={styles.streakCount}>{streak}</Text>
          <Text style={styles.streakLabel}>
            día{streak !== 1 ? 's' : ''} consecutivo{streak !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            style={[styles.checkBtn, checkedInToday && styles.checkBtnDone]}
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
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('History')}
          activeOpacity={0.8}
        >
          <Ionicons name="time-outline" size={20} color="#94a3b8" />
          <Text style={styles.menuText}>Historial de rutas</Text>
          <Ionicons name="chevron-forward" size={18} color="#475569" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleViewSurveyData}
          activeOpacity={0.8}
        >
          <Ionicons name="clipboard-outline" size={20} color="#94a3b8" />
          <Text style={styles.menuText}>Datos de encuestas</Text>
          <View style={styles.surveyBadge}>
            <Text style={styles.surveyBadgeText}>{surveyResponses.length}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.logout}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
        </ScrollView>
      </Animated.View>
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar perfil</Text>
            <Text style={styles.modalLabel}>Nombre</Text>
            <View style={styles.modalInputBox}>
              <TextInput
                style={styles.modalInput}
                placeholder="Tu nombre"
                placeholderTextColor="#334155"
                value={editDisplayName}
                onChangeText={setEditDisplayName}
              />
            </View>
            <Text style={styles.modalLabel}>Avatar URL (opcional)</Text>
            <View style={styles.modalInputBox}>
              <TextInput
                style={styles.modalInput}
                placeholder="https://ejemplo.com/avatar.jpg"
                placeholderTextColor="#334155"
                value={editAvatarUrl}
                onChangeText={setEditAvatarUrl}
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity style={styles.modalBtnWrap} onPress={handleSaveProfile} activeOpacity={0.85} disabled={editSaving}>
              <LinearGradient colors={['#06b6d4', '#6366f1']} style={styles.modalBtn}>
                {editSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalBtnText}>Guardar</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditModalVisible(false)} activeOpacity={0.8} disabled={editSaving}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={surveyModalVisible} transparent animationType="fade" onRequestClose={() => setSurveyModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Datos de encuestas</Text>
            <Text style={styles.modalLabel}>{surveyResponses.length} respuestas recopiladas</Text>
            {surveyResponses.length === 0 ? (
              <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center', marginVertical: 20 }}>
                Aún no hay respuestas. Las encuestas aparecen al generar una ruta.
              </Text>
            ) : (
              <View style={{ maxHeight: 300 }}>
                {surveyResponses.slice().reverse().map((r, i) => (
                  <View key={i} style={{ backgroundColor: '#0c1a2e', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1e293b' }}>
                    <Text style={{ color: '#e2e8f0', fontSize: 13, fontWeight: '700', marginBottom: 4 }}>{r.topic}</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 11 }}>Nivel: {r.knowledgeLevel} | Tiempo: {r.timeCommitment} | Objetivo: {r.mainGoal}</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 11 }}>Experiencia: {'★'.repeat(r.experience)}{'☆'.repeat(5 - r.experience)}</Text>
                    <Text style={{ color: '#475569', fontSize: 10, marginTop: 4 }}>{new Date(r.timestamp).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setSurveyModalVisible(false)} activeOpacity={0.8}>
              <Text style={styles.modalCancelText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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

  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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

  demoBadge: {
    marginTop: 8,
    color: '#38bdf8',
    fontSize: 13,
  },

  progressCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  progressCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginTop: 4,
  },

  progressLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },

  progressDetail: {
    fontSize: 13,
    color: '#64748b',
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

  surveyBadge: {
    backgroundColor: '#06b6d4',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  surveyBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },

  modalCard: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 18,
    padding: 22,
  },

  modalTitle: {
    color: '#e2e8f0',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },

  modalLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 6,
  },

  modalInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c1a2e',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },

  modalInput: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 13,
  },

  modalBtnWrap: {
    marginTop: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },

  modalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },

  modalBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13.5,
  },

  modalCancelBtn: {
    marginTop: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },

  modalCancelText: {
    color: '#e2e8f0',
    fontWeight: '600',
    fontSize: 13.5,
  },
} as const;
