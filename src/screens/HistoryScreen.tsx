import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, StatusBar,
  Animated, Easing, Platform, TextInput,
  RefreshControl,
} from 'react-native';
import { supabase } from '../services/supabaseClient';
import {
  getRoadmapHistory, getRoadmapById, deleteRoadmap,
  rowToRoadmap, RoadmapSummary,
} from '../services/roadmapService';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SkeletonHistoryCard, EmptyState } from './SkeletonComponents';
import { useAuthStore } from '../store/authStore';
import { useRoadmapStore } from '../store/roadmapStore';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'History'>,
  NativeStackScreenProps<RootStackParamList>
>;

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

function RoadmapCard({
  item,
  onOpen,
  onDelete,
  index,
  isDemoMode = false,
}: {
  item: RoadmapSummary;
  onOpen: () => void;
  onDelete: () => void;
  index: number;
  isDemoMode?: boolean;
}) {
  const entryAnim = useRef(new Animated.Value(0)).current;
  const slideX = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entryAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(slideX, {
        toValue: 0,
        duration: 280,
        delay: index * 60,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: entryAnim, transform: [{ translateX: slideX }] }}>
      <TouchableOpacity
        style={styles.card}
        onPress={onOpen}
        activeOpacity={0.82}
      >
        <View style={styles.cardIcon}>
          <Ionicons name="map-outline" size={18} color="#06b6d4" />
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          {item.description && (
            <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          )}
          <View style={styles.cardMeta}>
            <Ionicons name="time-outline" size={11} color="#334155" />
            <Text style={styles.cardDate}>
              {isDemoMode ? 'Guardado local' : relativeDate(item.created_at)}
            </Text>
          </View>
        </View>

        {!isDemoMode && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HistoryScreen({ navigation }: Props) {
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [filtered, setFiltered] = useState<RoadmapSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const isDemo = useAuthStore((state) => state.isDemo);
  const { localRoadmaps, loadLocalRoadmaps, setCurrentRoadmap } = useRoadmapStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(22)).current;

  const loadHistory = useCallback(async (silent = false) => {
    if (isDemo) {
      await loadLocalRoadmaps();
      const data = useRoadmapStore.getState().localRoadmaps;
      if (!silent) setLoading(true);
      setRoadmaps(data);
      setFiltered(data);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    if (!silent) setLoading(true);
    try {
      const data = await getRoadmapHistory(session.user.id);
      setRoadmaps(data);
      setFiltered(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isDemo, loadLocalRoadmaps]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => loadHistory());

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    return unsubscribe;
  }, [navigation, loadHistory]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(roadmaps);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(roadmaps.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    ));
  }, [search, roadmaps]);

  const handleOpen = async (roadmapId: string) => {
    if (isDemo) {
      const roadmap = localRoadmaps.find(r => r.id === roadmapId);
      if (roadmap) {
        setCurrentRoadmap(roadmap);
        navigation.navigate('Roadmap', { roadmap });
      }
      return;
    }

    try {
      const row = await getRoadmapById(roadmapId);
      if (!row) {
        Alert.alert('Ruta no encontrada', 'Esta ruta ya no existe.');
        loadHistory(true);
        return;
      }
      const roadmap = rowToRoadmap(row);
      setCurrentRoadmap(roadmap);
      navigation.navigate('Roadmap', { roadmap });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDelete = (roadmapId: string, title: string) => {
    if (isDemo) {
      Alert.alert('No disponible', 'Eliminar rutas no está disponible en modo demo.');
      return;
    }

    Alert.alert(
      'Eliminar ruta',
      `¿Eliminar "${title}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRoadmap(roadmapId);
              loadHistory(true);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHistory(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#020617', '#0f172a', '#0c1a2e']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color="#475569" />
        </TouchableOpacity>

        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeTxt}>Historial</Text>
          {!loading && roadmaps.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countTxt}>{roadmaps.length}</Text>
            </View>
          )}
        </View>

        <View style={styles.avatar}>
          <Ionicons name="time-outline" size={16} color="#fff" />
        </View>
      </View>

      {!loading && roadmaps.length > 0 && (
        <View style={styles.searchWrap}>
          <View style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}>
            <Ionicons name="search-outline" size={15} color={searchFocused ? '#06b6d4' : '#334155'} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar rutas…"
              placeholderTextColor="#1e293b"
              value={search}
              onChangeText={setSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={15} color="#334155" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {loading ? (
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.list}>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonHistoryCard key={i} />
            ))}
          </View>
        </Animated.View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          {search.trim() ? (
            <EmptyState
              icon="search-outline"
              title="Sin resultados"
              subtitle={`No encontramos rutas que coincidan con "${search}".`}
              actionLabel="Limpiar búsqueda"
              onAction={() => setSearch('')}
            />
          ) : (
            <EmptyState
              icon="map-outline"
              title="Sin rutas guardadas"
              subtitle="Genera tu primera ruta de aprendizaje y aparecerá aquí."
              actionLabel="Crear mi primera ruta"
              onAction={() => navigation.goBack()}
            />
          )}
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <FlatList
            data={filtered}
            keyExtractor={(item, index) => item.id || `local-${index}`}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#06b6d4"
                colors={['#06b6d4']}
              />
            }
            renderItem={({ item, index }) => (
              <RoadmapCard
                item={item}
                index={index}
                isDemoMode={isDemo}
                onOpen={() => handleOpen(item.id)}
                onDelete={() => handleDelete(item.id, item.title)}
              />
            )}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingBottom: 12,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#06b6d4' },
  badgeTxt: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },

  countBadge: {
    backgroundColor: '#06b6d4',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#06b6d4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchBoxFocused: {
    borderColor: '#06b6d4',
  },
  searchInput: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 13,
    padding: 0,
  },

  emptyContainer: { flex: 1 },

  list: { padding: 16 },

  card: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    gap: 12,
  },

  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0c1a2e',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardBody: { flex: 1 },

  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 3,
  },

  cardDesc: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 5,
    lineHeight: 17,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardDate: {
    fontSize: 11,
    color: '#334155',
  },

  deleteBtn: {
    padding: 6,
  },
});
