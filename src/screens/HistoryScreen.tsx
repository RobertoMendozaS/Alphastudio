import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { supabase } from '../services/supabaseClient';
import { getRoadmapHistory, getRoadmapById, deleteRoadmap, rowToRoadmap, RoadmapSummary } from '../services/roadmapService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

export default function HistoryScreen({ navigation }: Props) {
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [loading, setLoading] = useState(true);

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
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  if (roadmaps.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="book-outline" size={64} color="#334155" />
        <Text style={styles.emptyTitle}>Sin rutas guardadas</Text>
        <Text style={styles.emptySubtitle}>Las rutas que generes aparecerán aquí</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={roadmaps}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleOpen(item.id)}>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              {item.description ? (
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              ) : null}
              <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', padding: 20 },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#94a3b8', marginBottom: 6, lineHeight: 18 },
  cardDate: { fontSize: 12, color: '#64748b' },
  deleteBtn: { padding: 8, marginLeft: 8 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#475569', marginTop: 8, textAlign: 'center' },
});
