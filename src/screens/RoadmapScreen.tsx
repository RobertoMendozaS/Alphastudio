import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { RoadmapNode, Resource } from '../types/roadmap';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Roadmap'>;

export default function RoadmapScreen({ route }: Props) {
  const { roadmap } = route.params;

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.roadmapTitle}>{roadmap.title}</Text>
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
              <Text style={styles.cardTitle}>{node.data.label}</Text>
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
  roadmapTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8, textAlign: 'center' },
  roadmapDesc: { fontSize: 14, color: '#94a3b8', marginBottom: 30, textAlign: 'center' },
  pathContainer: { marginLeft: 10 },
  verticalLine: { position: 'absolute', left: 15, top: 10, bottom: 10, width: 2, backgroundColor: '#334155' },
  nodeRow: { flexDirection: 'row', marginBottom: 30, alignItems: 'flex-start' },
  dotContainer: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1e293b', borderWidth: 2, borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  stepNumber: { position: 'absolute', fontSize: 10, fontWeight: 'bold', color: '#fff' },
  card: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginLeft: 15, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  cardDesc: { fontSize: 13, color: '#94a3b8', marginBottom: 12, lineHeight: 18 },
  resourcesContainer: { borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 10 },
  resourcesTitle: { color: '#64748b', fontSize: 12, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
  resourceButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, backgroundColor: '#0f172a', borderRadius: 8, paddingHorizontal: 10, marginBottom: 6 },
  resourceText: { flex: 1, color: '#e2e8f0', fontSize: 13, marginLeft: 8 },
});
