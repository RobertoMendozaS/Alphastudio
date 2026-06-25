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
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../store/authStore';
import { useRoadmapStore } from '../store/roadmapStore';
import { supabase } from '../services/supabaseClient';
import { performCheckIn, getStreak, updateProfile } from '../services/authService';
import { getTestStats, syncTestResult } from '../services/testService';
import { useToast } from '../components/ToastProvider';

const BADGES = [
  { id: 'first_step', name: 'Primer Paso', icon: 'footsteps', color: '#10b981', desc: 'Completa tu primer tema' },
  { id: 'streak_3', name: 'Constancia', icon: 'flame', color: '#f97316', desc: 'Racha de 3 días' },
  { id: 'scholar', name: 'Erudito', icon: 'school', color: '#8b5cf6', desc: 'Completa una ruta al 100%' },
  { id: 'explorer', name: 'Explorador', icon: 'compass', color: '#0ea5e9', desc: 'Genera tu primera ruta' },
];

type Props = BottomTabScreenProps<MainTabParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { user, isDemo, logout } = useAuthStore();
  const toast = useToast();
  const currentRoadmap = useRoadmapStore((state) => state.currentRoadmap);
  const completedNodesArray = useRoadmapStore((state) => state.completedNodes);
  const localRoadmaps = useRoadmapStore((state) => state.localRoadmaps);
  const surveyResponses = useRoadmapStore((state) => state.surveyResponses);
  const loadSurveyResponses = useRoadmapStore((state) => state.loadSurveyResponses);
  const testResults = useRoadmapStore((state) => state.testResults);
  const loadTestResults = useRoadmapStore((state) => state.loadTestResults);
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

  const completedNodes = completedNodesArray.length;
  const totalNodes = currentRoadmap?.nodes.length ?? 0;
  const progressPercent = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;
  const userEmail = user?.email ?? 'Usuario sin correo';

  const unlockedBadges = {
    first_step: completedNodes > 0,
    streak_3: streak >= 3,
    scholar: progressPercent === 100 && totalNodes > 0,
    explorer: currentRoadmap !== null || localRoadmaps.length > 0,
  };

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
      toast.showToast('Los cambios se guardaron correctamente.', 'success');
      setEditModalVisible(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al actualizar perfil';
      toast.showToast(message, 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const handleCheckIn = async () => {
    if (!user) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setCheckingIn(true);
    try {
      const success = await performCheckIn(user.id);
      if (success) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        const { streak: newStreak } = await getStreak(user.id);
        setStreak(newStreak);
        setCheckedInToday(true);
        toast.showToast(
          `¡Check-in completado! Llevas ${newStreak} día${newStreak !== 1 ? 's' : ''} consecutivo${newStreak !== 1 ? 's' : ''}.`,
          'success'
        );
      } else {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        toast.showToast('Ya hiciste check-in hoy. Vuelve mañana.', 'info');
      }
    } catch (error: unknown) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      const message = error instanceof Error ? error.message : 'Ocurrió un error inesperado';
      toast.showToast(message, 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleViewSurveyData = () => {
    loadSurveyResponses();
    setSurveyModalVisible(true);
  };

  const [testModalVisible, setTestModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  const handleViewStats = async () => {
    try {
      const data = await getTestStats();
      setStats(data);
    } catch {
      setStats(null);
    }
    setStatsModalVisible(true);
  };

  const handleSyncNow = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      Alert.alert('Sin sesión', 'Inicia sesión para sincronizar datos.');
      return;
    }
    setSyncing(true);
    let synced = 0;
    for (const r of testResults) {
      try {
        await syncTestResult(r, session.user.id);
        synced++;
      } catch {
        // skip already synced
      }
    }
    setSyncing(false);
    Alert.alert('Sincronización completa', `${synced} tests subidos a la nube.`);
  };

  const handleViewTestData = () => {
    loadTestResults();
    setTestModalVisible(true);
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
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="#0f0b1f" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Perfil</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Ionicons name="person" size={32} color="#0ea5e9" />
          </View>
          <Text style={styles.userName}>{userEmail.split('@')[0]}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={12} color="#0ea5e9" />
            <Text style={styles.badgeText}>Usuario Alpha AI</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconWrap}><Ionicons name="analytics" size={18} color="#0ea5e9" /></View>
            <Text style={styles.statValue}>{progressPercent}%</Text>
            <Text style={styles.statLabel}>Progreso</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconWrap}><Ionicons name="flame" size={18} color="#f97316" /></View>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Racha</Text>
          </View>
        </View>

        <View style={[styles.streakCard, { marginHorizontal: 20, marginBottom: 32 }]}>
          <Ionicons name="flame" size={48} color={checkedInToday ? "#f97316" : "#475569"} />
          <Text style={[styles.streakCount, !checkedInToday && { color: '#475569' }]}>{streak}</Text>
          <Text style={styles.streakLabel}>Días consecutivos de aprendizaje</Text>
          
          <TouchableOpacity 
            style={[styles.checkBtn, checkedInToday && styles.checkBtnDone]}
            onPress={handleCheckIn}
            disabled={checkingIn || checkedInToday}
          >
            {checkingIn ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[styles.checkBtnText, checkedInToday && { color: '#a78bfa' }]}>
                {checkedInToday ? '✓ Check-in de hoy completado' : '🔥 Hacer Check-in Diario'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.badgesSection}>
          <Text style={styles.badgesSectionTitle}>Tus Insignias</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesScroll}>
            {BADGES.map((b) => {
              const isUnlocked = unlockedBadges[b.id as keyof typeof unlockedBadges];
              return (
                <View key={b.id} style={[styles.badgeCard, !isUnlocked && styles.badgeCardLocked]}>
                  <View style={[styles.badgeIconWrap, isUnlocked ? { backgroundColor: b.color + '20' } : {}]}>
                    <Ionicons name={b.icon as any} size={28} color={isUnlocked ? b.color : '#e2e8f0'} />
                  </View>
                  <Text style={[styles.badgeName, !isUnlocked && { color: '#a78bfa' }]}>{b.name}</Text>
                  <Text style={styles.badgeDesc} numberOfLines={2}>{b.desc}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
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
            style={styles.menuItem}
            onPress={handleViewStats}
            activeOpacity={0.8}
          >
            <Ionicons name="bar-chart-outline" size={20} color="#94a3b8" />
            <Text style={styles.menuText}>Estadísticas de tests</Text>
            <Ionicons name="chevron-forward" size={18} color="#475569" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSyncNow}
            activeOpacity={0.8}
            disabled={syncing}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#94a3b8" />
            <Text style={styles.menuText}>{syncing ? 'Sincronizando...' : 'Sincronizar datos'}</Text>
            {syncing && <ActivityIndicator size="small" color="#06b6d4" />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleViewTestData}
            activeOpacity={0.8}
          >
            <Ionicons name="checkbox-outline" size={20} color="#94a3b8" />
            <Text style={styles.menuText}>Resultados de tests</Text>
            <View style={styles.surveyBadge}>
              <Text style={styles.surveyBadgeText}>{testResults.length}</Text>
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
        </View>
      </Animated.View>

      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar perfil</Text>
            <Text style={styles.modalLabel}>Nombre</Text>
            <View style={styles.modalInputBox}>
              <TextInput style={styles.modalInput} placeholder="Tu nombre" value={editDisplayName} onChangeText={setEditDisplayName} />
            </View>
            <TouchableOpacity style={styles.modalBtnWrap} onPress={handleSaveProfile} disabled={editSaving}>
              <Text style={styles.modalBtnText}>{editSaving ? 'Guardando...' : 'Guardar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditModalVisible(false)}><Text style={styles.modalCancelText}>Cancelar</Text></TouchableOpacity>
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

      <Modal visible={statsModalVisible} transparent animationType="fade" onRequestClose={() => setStatsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Estadísticas de tests</Text>
            {!stats ? (
              <ActivityIndicator color="#06b6d4" style={{ marginVertical: 30 }} />
            ) : (
              <>
                <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                  Datos agregados de todos los usuarios
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: '#e2e8f0' }}>{stats.total}</Text>
                    <Text style={{ fontSize: 11, color: '#64748b' }}>Tests</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: '#06b6d4' }}>{stats.preAvg}%</Text>
                    <Text style={{ fontSize: 11, color: '#64748b' }}>Pre‑test</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: '#22c55e' }}>{stats.postAvg}%</Text>
                    <Text style={{ fontSize: 11, color: '#64748b' }}>Post‑test</Text>
                  </View>
                </View>
                {stats.improvement !== 0 && (
                  <View style={{ backgroundColor: '#0c1a2e', borderRadius: 12, padding: 14, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' }}>
                    <Text style={{ fontSize: 14, color: '#94a3b8' }}>Mejora promedio</Text>
                    <Text style={{ fontSize: 32, fontWeight: '800', color: stats.improvement > 0 ? '#22c55e' : '#ef4444' }}>
                      {stats.improvement > 0 ? '+' : ''}{stats.improvement}%
                    </Text>
                  </View>
                )}
                {stats.byTopic.length > 0 && (
                  <View style={{ maxHeight: 150 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#e2e8f0', marginBottom: 8 }}>Por tema</Text>
                    {stats.byTopic.map((t: any, i: number) => (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0c1a2e', borderRadius: 8, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: '#1e293b' }}>
                        <Text style={{ color: '#e2e8f0', fontSize: 12, flex: 1 }}>{t.topic}</Text>
                        <Text style={{ color: '#06b6d4', fontSize: 12, fontWeight: '600' }}>Pre {Math.round(t.pre)}%</Text>
                        <Text style={{ color: '#22c55e', fontSize: 12, fontWeight: '600', marginLeft: 8 }}>Post {Math.round(t.post)}%</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setStatsModalVisible(false)} activeOpacity={0.8}>
              <Text style={styles.modalCancelText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={testModalVisible} transparent animationType="fade" onRequestClose={() => setTestModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Resultados de tests</Text>
            <Text style={styles.modalLabel}>{testResults.length} tests realizados</Text>
            {testResults.length === 0 ? (
              <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center', marginVertical: 20 }}>
                Aún no hay tests. Aparecen al generar y completar rutas.
              </Text>
            ) : (
              <View style={{ maxHeight: 300 }}>
                {testResults.slice().reverse().map((r: any, i: number) => {
                  const preTest = testResults.find((t: any) => t.topic === r.topic && t.type === 'pre');
                  const postTest = testResults.find((t: any) => t.topic === r.topic && t.type === 'post');
                  return (
                    <View key={i} style={{ backgroundColor: '#0c1a2e', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1e293b' }}>
                      <Text style={{ color: '#e2e8f0', fontSize: 13, fontWeight: '700', marginBottom: 4 }}>{r.topic}</Text>
                      <Text style={{ color: '#94a3b8', fontSize: 11 }}>
                        {r.type === 'pre' ? '📝 Pre‑test' : '✅ Post‑test'}: {r.score}/{r.total} ({Math.round((r.score / r.total) * 100)}%)
                      </Text>
                      {r.type === 'post' && preTest && (
                        <Text style={{ color: '#22c55e', fontSize: 11, marginTop: 2 }}>
                          Mejora: +{Math.round((r.score / r.total) * 100 - (preTest.score / preTest.total) * 100)}%
                        </Text>
                      )}
                      <Text style={{ color: '#475569', fontSize: 10, marginTop: 4 }}>
                        {new Date(r.timestamp).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setTestModalVisible(false)} activeOpacity={0.8}>
              <Text style={styles.modalCancelText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  scrollContent: { paddingBottom: 40 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Outfit_400Regular', fontSize: 24,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#0f0b1f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b2c6b',
  },
  profileCard: {
    alignItems: 'center',
    marginHorizontal: 20,
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#0f0b1f',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3b2c6b',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#17122b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#0f0b1f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  userName: {
    fontFamily: 'Outfit_400Regular', fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: 'Outfit_400Regular', fontSize: 14,
    color: '#a78bfa',
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#17122b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3b2c6b',
  },
  badgeText: {
    fontFamily: 'Outfit_400Regular', fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    color: '#0ea5e9',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0f0b1f',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3b2c6b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#17122b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3b2c6b',
  },
  statValue: {
    fontFamily: 'Outfit_400Regular', fontSize: 22,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#f8fafc',
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'Outfit_400Regular', fontSize: 12,
    color: '#a78bfa',
    fontFamily: 'Outfit_500Medium',
  },
  badgesSection: {
    marginBottom: 32,
  },
  badgesSectionTitle: {
    fontFamily: 'Outfit_400Regular', fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: '#f8fafc',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  badgesScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  badgeCard: {
    width: 110,
    backgroundColor: '#0f0b1f',
    borderWidth: 1,
    borderColor: '#3b2c6b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeCardLocked: {
    backgroundColor: '#09090b',
    borderColor: '#0f0b1f',
    shadowOpacity: 0,
    elevation: 0,
  },
  badgeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b2c6b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  badgeName: {
    fontFamily: 'Outfit_400Regular', fontSize: 13,
    fontFamily: 'Outfit_700Bold',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDesc: {
    fontFamily: 'Outfit_400Regular', fontSize: 10,
    color: '#a78bfa',
    textAlign: 'center',
    lineHeight: 14,
  },
  streakCard: {
    backgroundColor: '#0f0b1f',
    borderWidth: 1,
    borderColor: '#3b2c6b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
  },
  streakCount: {
    fontFamily: 'Outfit_400Regular', fontSize: 44,
    fontFamily: 'Outfit_900Black',
    color: '#f97316',
    marginTop: 6,
  },
  streakLabel: {
    color: '#a78bfa',
    fontFamily: 'Outfit_400Regular', fontSize: 12,
    marginBottom: 12,
  },
  checkBtn: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  checkBtnDone: {
    backgroundColor: '#3b2c6b',
  },
  checkBtnText: {
    color: '#fff',
    fontFamily: 'Outfit_700Bold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0b1f',
    borderWidth: 1,
    borderColor: '#3b2c6b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  menuText: {
    flex: 1,
    color: '#f8fafc',
    marginLeft: 12,
    fontFamily: 'Outfit_400Regular', fontSize: 14,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0b1f',
    borderWidth: 1,
    borderColor: '#7f1d1d',
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
  },
  logoutText: {
    color: '#ef4444',
    fontFamily: 'Outfit_600SemiBold',
    marginLeft: 8,
  },
  surveyBadge: {
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  surveyBadgeText: {
    color: '#fff',
    fontFamily: 'Outfit_400Regular', fontSize: 11,
    fontFamily: 'Outfit_700Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#0f0b1f',
    borderWidth: 1,
    borderColor: '#3b2c6b',
    borderRadius: 18,
    padding: 22,
  },
  modalTitle: {
    color: '#f8fafc',
    fontFamily: 'Outfit_400Regular', fontSize: 17,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLabel: {
    color: '#a78bfa',
    fontFamily: 'Outfit_400Regular', fontSize: 12,
    marginBottom: 6,
  },
  modalInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17122b',
    borderWidth: 1,
    borderColor: '#3b2c6b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  modalInput: {
    flex: 1,
    color: '#f8fafc',
    fontFamily: 'Outfit_400Regular', fontSize: 13,
  },
  modalBtnWrap: {
    marginTop: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0ea5e9',
  },
  modalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  modalBtnText: {
    color: '#fff',
    fontFamily: 'Outfit_700Bold', fontSize: 13.5,
    textAlign: 'center',
    paddingVertical: 14,
  },
  modalCancelBtn: {
    marginTop: 10,
    backgroundColor: '#17122b',
    borderWidth: 1,
    borderColor: '#3b2c6b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#a78bfa',
    fontFamily: 'Outfit_600SemiBold', fontSize: 13.5,
  },
});
