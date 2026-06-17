import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert,
  StatusBar, Animated, Easing, Platform
} from 'react-native';
import { supabase } from '../services/supabaseClient';
import {
  getRoadmapHistory,
  getRoadmapById,
  deleteRoadmap,
  rowToRoadmap,
  RoadmapSummary
} from '../services/roadmapService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

export default function HistoryScreen({ navigation }: Props) {
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const loadHistory = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    setLoading(true);
    try {
      const data = await getRoadmapHistory(session.user.id);
      setRoadmaps(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadHistory);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
    ]).start();

    return unsubscribe;
  }, [navigation, loadHistory]);

  const handleOpen = async (roadmapId: string) => {
    try {
      const row = await getRoadmapById(roadmapId);
      if (!row) {
        Alert.alert('Error', 'La ruta ya no existe');
        loadHistory();
        return;
      }
      const roadmap = rowToRoadmap(row);
      navigation.navigate('Roadmap', { roadmap });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDelete = (roadmapId: string, title: string) => {
    Alert.alert(
      'Eliminar ruta',
      `¿Eliminar "${title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRoadmap(roadmapId);
              loadHistory();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Fondo degradado Alpha */}
      <LinearGradient
        colors={['#020617', '#0f172a', '#0c1a2e']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header estilo Home */}
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="#475569" onPress={() => navigation.goBack()} />

        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeTxt}>Historial</Text>
        </View>

        <View style={styles.avatar}>
          <Ionicons name="time-outline" size={16} color="#fff" />
        </View>
      </View>

      {/* CONTENIDO */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#06b6d4" />
        </View>
      ) : roadmaps.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="book-outline" size={64} color="#334155" />
          <Text style={styles.emptyTitle}>Sin rutas guardadas</Text>
          <Text style={styles.emptySubtitle}>
            Las rutas que generes aparecerán aquí
          </Text>
        </View>
      ) : (
        <Animated.View
          style={{
            flex: 1,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          <FlatList
            data={roadmaps}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleOpen(item.id)}
                activeOpacity={0.85}
              >
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>

                  {item.description && (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}

                  <Text style={styles.cardDate}>
                    {formatDate(item.created_at)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item.id, item.title)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </TouchableOpacity>
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
    paddingBottom: 12
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
    paddingVertical: 5
  },

  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#06b6d4'
  },

  badgeTxt: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600'
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#06b6d4',
    alignItems: 'center',
    justifyContent: 'center'
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },

  list: {
    padding: 16
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center'
  },

  cardBody: { flex: 1 },

  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 4
  },

  cardDesc: {
    fontSize: 12.5,
    color: '#94a3b8',
    marginBottom: 6
  },

  cardDate: {
    fontSize: 11,
    color: '#64748b'
  },

  deleteBtn: {
    padding: 8,
    marginLeft: 8
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748b',
    marginTop: 16
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 8,
    textAlign: 'center'
  }
});
