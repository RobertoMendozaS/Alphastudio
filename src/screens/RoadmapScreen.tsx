import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Share, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { RoadmapNode, Resource } from '../types/roadmap';
import { Ionicons } from '@expo/vector-icons';
import { useRoadmapStore } from '../store/roadmapStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Roadmap'>;

export default function RoadmapScreen({ route }: Props) {
  const routeRoadmap = route.params.roadmap;
  const { currentRoadmap, setCurrentRoadmap, toggleNodeCompleted, saveCurrentRoadmapLocal } = useRoadmapStore();
  const roadmap = currentRoadmap ?? routeRoadmap;

  useEffect(() => {
    setCurrentRoadmap(routeRoadmap);
  }, [routeRoadmap, setCurrentRoadmap]);

  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("No se pudo abrir el enlace:", err));
  };

  const getIconName = (type: string) => {
    switch (type) {
      case 'youtube': return 'logo-youtube';
      case 'course': return 'school';
      case 'documentation': return 'book';
      case 'google': return 'logo-google';
      default: return 'globe';
    }
  };

  const getColorType = (type: string) => {
    switch (type) {
      case 'youtube': return '#FF0000';
      case 'course': return '#A855F7';
      case 'documentation': return '#3B82F6';
      case 'google': return '#4285F4';
      default: return '#6B7280';
    }
  }

  const handleSaveLocal = async () => {
    await saveCurrentRoadmapLocal();
    Alert.alert('Ruta guardada', 'La ruta se guardó localmente en este dispositivo.');
  };

  const handleShare = async () => {
    try {
      const message = `¡Mira esta ruta de aprendizaje: ${roadmap.title}!\n\n${roadmap.description}\n\nTemas:\n${roadmap.nodes.map((n: RoadmapNode, i: number) => `${i + 1}. ${n.data.label}`).join('\n')}\n\n¡Generado con AlphaStudio AI!`;
      await Share.share({
        message,
        title: roadmap.title,
      });
    } catch (error: any) {
      console.error(error.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.roadmapTitle}>{roadmap.title}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleSaveLocal} style={styles.shareBtn}>
            <Ionicons name="save-outline" size={24} color="#38bdf8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <Ionicons name="share-social-outline" size={24} color="#38bdf8" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.roadmapDesc}>{roadmap.description}</Text>

      <View style={styles.pathContainer}>
        <View style={styles.verticalLine} />

        {roadmap.nodes.map((node: RoadmapNode, index: number) => (
          <View key={node.id} style={styles.nodeRow}>
            <View style={styles.dotContainer}>
              <View style={[styles.dot, { backgroundColor: node.data.isCompleted ? '#22c55e' : '#38bdf8' }]} />
              <Text style={styles.stepNumber}>{index + 1}</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{node.data.label}</Text>
                <TouchableOpacity
                  style={[styles.completeBtn, node.data.isCompleted && styles.completeBtnDone]}
                  onPress={() => toggleNodeCompleted(node.id)}
                >
                  <Ionicons
                    name={node.data.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={node.data.isCompleted ? '#22c55e' : '#94a3b8'}
                  />
                  <Text style={[styles.completeText, node.data.isCompleted && styles.completeTextDone]}>
                    {node.data.isCompleted ? 'Completado' : 'Marcar'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardDesc}>{node.data.description}</Text>

              <View style={styles.resourcesContainer}>
                <Text style={styles.resourcesTitle}>Recursos:</Text>
                {node.data.resources.map((res: Resource, i: number) => (
                  <TouchableOpacity key={res.id ?? `res-${i}`} style={styles.resourceButton} onPress={() => openLink(res.url)}>
                    <Ionicons name={getIconName(res.type) as any} size={16} color={getColorType(res.type)} />
                    <Text style={styles.resourceText}>{res.title}</Text>
                    <Ionicons name="open-outline" size={14} color="#94a3b8" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  contentContainer: { padding: 20, paddingBottom: 50 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  roadmapTitle: { flex: 1, fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerActions: { flexDirection: 'row', gap: 8, marginLeft: 10 },
  shareBtn: { padding: 8, backgroundColor: '#1e293b', borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  roadmapDesc: { fontSize: 14, color: '#94a3b8', marginBottom: 30 },
  pathContainer: { marginLeft: 10 },
  verticalLine: { position: 'absolute', left: 15, top: 10, bottom: 10, width: 2, backgroundColor: '#334155' },
  nodeRow: { flexDirection: 'row', marginBottom: 30, alignItems: 'flex-start' },
  dotContainer: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1e293b', borderWidth: 2, borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  stepNumber: { position: 'absolute', fontSize: 10, fontWeight: 'bold', color: '#fff' },
  card: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginLeft: 15, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 10 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#fff' },
  completeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#0f172a' },
  completeBtnDone: { backgroundColor: '#052e16' },
  completeText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  completeTextDone: { color: '#22c55e' },
  cardDesc: { fontSize: 13, color: '#94a3b8', marginBottom: 12, lineHeight: 18 },
  resourcesContainer: { borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 10 },
  resourcesTitle: { color: '#64748b', fontSize: 12, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
  resourceButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, backgroundColor: '#0f172a', borderRadius: 8, paddingHorizontal: 10, marginBottom: 6 },
  resourceText: { flex: 1, color: '#e2e8f0', fontSize: 13, marginLeft: 8 },
});
