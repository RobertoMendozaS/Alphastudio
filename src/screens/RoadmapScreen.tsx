import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Share,
  Alert,
  Animated,
  Easing,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { RoadmapNode, Resource } from '../types/roadmap';
import { useRoadmapStore } from '../store/roadmapStore';
import { EmptyState } from '../screens/SkeletonComponents';
import TestModal from '../components/TestModal';
import { generateTestQuestions } from '../services/aiService';

type Props = NativeStackScreenProps<RootStackParamList, 'Roadmap'>;

export default function RoadmapScreen({ route }: Props) {
  const routeRoadmap = route.params.roadmap;
  const { currentRoadmap, setCurrentRoadmap, completedNodes, toggleNodeCompleted, saveCurrentRoadmapLocal, saveRoadmapToHistory, saveTestResult, testResults } = useRoadmapStore();
  const roadmap = currentRoadmap ?? routeRoadmap;

  const [showPostTest, setShowPostTest] = useState(false);
  const [postTestQuestions, setPostTestQuestions] = useState<any[]>([]);
  const postTestTriggered = useRef(false);

  useEffect(() => {
    setCurrentRoadmap(routeRoadmap);
  }, [routeRoadmap, setCurrentRoadmap]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const totalNodes = roadmap.nodes.length;
  const completedCount = completedNodes.length;
  const progressPercent =
    totalNodes > 0 ? Math.round((completedCount / totalNodes) * 100) : 0;
  const allCompleted = completedCount > 0 && completedCount === totalNodes;

  useEffect(() => {
    if (allCompleted && !postTestTriggered.current) {
      postTestTriggered.current = true;
      const loadTest = async () => {
        const questions = await generateTestQuestions(roadmap.title.replace('Ruta para aprender ', ''));
        setPostTestQuestions(questions);
        setShowPostTest(true);
      };
      loadTest();
    }
  }, [allCompleted, roadmap.title]);

  useEffect(() => {
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
  }, [fadeAnim, slideAnim]);

  const openLink = (url: string) => {
    Linking.openURL(url).catch(console.error);
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
  };

  const handlePostTestSubmit = async (result: any) => {
    const postResult = { ...result, type: 'post' as const };
    await saveTestResult(postResult);
    setShowPostTest(false);
    const preTest = testResults.find((r: any) => r.topic === result.topic && r.type === 'pre');
    if (preTest) {
      const prePct = Math.round((preTest.score / preTest.total) * 100);
      const postPct = Math.round((result.score / result.total) * 100);
      const diff = postPct - prePct;
      Alert.alert(
        '¡Ruta completada!',
        `Resultados:\nPre‑test: ${prePct}%\nPost‑test: ${postPct}%\nMejora: ${diff > 0 ? '+' : ''}${diff}%${diff > 0 ? ' 🎉' : ''}`
      );
    } else {
      Alert.alert('Ruta completada', `Post‑test: ${result.score}/${result.total} (${Math.round((result.score / result.total) * 100)}%)`);
    }
  };

  const handlePostTestSkip = () => {
    setShowPostTest(false);
  };

  const handleSaveLocal = async () => {
    await saveRoadmapToHistory(roadmap);
    await saveCurrentRoadmapLocal();
    Alert.alert('Ruta guardada', 'La ruta se guardó en tu historial.');
  };

  const handleShare = async () => {
    const message =
      `🚀 ${roadmap.title}\n\n` +
      `${roadmap.description}\n\n` +
      roadmap.nodes
        .map((n: RoadmapNode, i: number) => `${i + 1}. ${n.data.label}`)
        .join('\n') +
      `\n\nProgreso: ${completedCount}/${totalNodes} completados (${progressPercent}%)` +
      `\n\nGenerado con Alpha AI`;

    await Share.share({
      message,
      title: roadmap.title,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#020617', '#0f172a', '#0c1a2e']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="#475569" />

        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeTxt}>Roadmap</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleSaveLocal} style={styles.shareBtn}>
            <Ionicons name="save-outline" size={18} color="#06b6d4" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <Ionicons name="share-social-outline" size={18} color="#06b6d4" />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.title}>{roadmap.title}</Text>
        <Text style={styles.desc}>{roadmap.description}</Text>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>Progreso de la ruta</Text>
              <Text style={styles.progressSubLabel}>
                {completedCount} de {totalNodes} nodos completados
              </Text>
            </View>

            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercent}%`,
                },
              ]}
            />
          </View>
        </View>

        {roadmap.nodes.length === 0 ? (
          <EmptyState
            icon="map-outline"
            title="Ruta vacía"
            subtitle="Esta ruta no tiene nodos de aprendizaje. Vuelve a generarla."
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.timeline}>
              <View style={styles.line} />

              {roadmap.nodes.map((node: RoadmapNode, index: number) => {
                const isCompleted = completedNodes.includes(node.id);
                const isLastNode = index === roadmap.nodes.length - 1;

                return (
                  <View key={node.id} style={styles.nodeBlock}>
                    <View style={styles.nodeRow}>
                      <View style={styles.dotWrap}>
                        <TouchableOpacity
                          onPress={() => toggleNodeCompleted(node.id)}
                          activeOpacity={0.8}
                          style={[
                            styles.checkCircle,
                            isCompleted && styles.checkCircleCompleted,
                          ]}
                        >
                          {isCompleted ? (
                            <Ionicons name="checkmark" size={15} color="#020617" />
                          ) : (
                            <Text style={styles.step}>{index + 1}</Text>
                          )}
                        </TouchableOpacity>
                      </View>

                      <View
                        style={[
                          styles.card,
                          isCompleted && styles.cardCompleted,
                        ]}
                      >
                        <View style={styles.cardHeader}>
                          <View style={styles.cardTitleWrap}>
                            <Text
                              style={[
                                styles.cardTitle,
                                isCompleted && styles.cardTitleCompleted,
                              ]}
                            >
                              {node.data.label}
                            </Text>

                            <Text style={styles.cardStatus}>
                              {isCompleted ? 'Completado' : 'Pendiente'}
                            </Text>
                          </View>

                          <TouchableOpacity
                            onPress={() => toggleNodeCompleted(node.id)}
                            style={[
                              styles.checkButton,
                              isCompleted && styles.checkButtonCompleted,
                            ]}
                          >
                            <Ionicons
                              name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                              size={18}
                              color={isCompleted ? '#22c55e' : '#64748b'}
                            />
                            <Text
                              style={[
                                styles.checkButtonText,
                                isCompleted && styles.checkButtonTextCompleted,
                              ]}
                            >
                              {isCompleted ? 'Listo' : 'Marcar'}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <Text
                          style={[
                            styles.cardDesc,
                            isCompleted && styles.cardDescCompleted,
                          ]}
                        >
                          {node.data.description}
                        </Text>

                        <View style={styles.resources}>
                          {node.data.resources.map((res: Resource, i: number) => (
                            <TouchableOpacity
                              key={res.id ?? `r-${i}`}
                              onPress={() => openLink(res.url)}
                              style={styles.resource}
                              activeOpacity={0.8}
                            >
                              <Ionicons
                                name={getIconName(res.type) as any}
                                size={14}
                                color={getColorType(res.type)}
                              />
                              <Text style={styles.resourceText} numberOfLines={1}>
                                {res.title}
                              </Text>
                              <Ionicons
                                name="open-outline"
                                size={14}
                                color="#475569"
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>

                    {!isLastNode && (
                      <View style={styles.edgeRow}>
                        <View style={styles.edgeSpacer} />
                        <View style={styles.edgeBox}>
                          <View
                            style={[
                              styles.edgeLine,
                              isCompleted && styles.edgeLineCompleted,
                            ]}
                          />
                          <Ionicons
                            name="arrow-down"
                            size={16}
                            color={isCompleted ? '#22c55e' : '#334155'}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </Animated.View>
      <TestModal
        visible={showPostTest}
        title={roadmap.title.replace('Ruta para aprender ', '')}
        questions={postTestQuestions}
        onSubmit={handlePostTestSubmit}
        onSkip={handlePostTestSkip}
      />
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

  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  shareBtn: {
    padding: 8,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },

  desc: {
    color: '#64748b',
    fontSize: 12.5,
    marginBottom: 18,
  },

  progressCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  progressLabel: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },

  progressSubLabel: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },

  progressPercent: {
    color: '#22c55e',
    fontSize: 20,
    fontWeight: '800',
  },

  progressTrack: {
    height: 9,
    backgroundColor: '#1e293b',
    borderRadius: 999,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 999,
  },

  timeline: {
    position: 'relative',
    paddingLeft: 6,
    paddingBottom: 40,
  },

  line: {
    position: 'absolute',
    left: 20,
    top: 10,
    bottom: 10,
    width: 2,
    backgroundColor: '#1e293b',
  },

  nodeBlock: {
    marginBottom: 4,
  },

  nodeRow: {
    flexDirection: 'row',
  },

  dotWrap: {
    width: 40,
    alignItems: 'center',
    marginRight: 10,
  },

  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#06b6d4',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  checkCircleCompleted: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },

  step: {
    fontSize: 10,
    color: '#06b6d4',
    fontWeight: '800',
  },

  card: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
  },

  cardCompleted: {
    borderColor: '#14532d',
    backgroundColor: '#0b1f18',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },

  cardTitleWrap: {
    flex: 1,
  },

  cardTitle: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '700',
  },

  cardTitleCompleted: {
    color: '#bbf7d0',
  },

  cardStatus: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },

  cardDesc: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 17,
  },

  cardDescCompleted: {
    color: '#86efac',
  },

  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  checkButtonCompleted: {
    backgroundColor: '#052e16',
    borderColor: '#14532d',
  },

  checkButtonText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },

  checkButtonTextCompleted: {
    color: '#22c55e',
  },

  resources: {
    gap: 6,
  },

  resource: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c1a2e',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 8,
  },

  resourceText: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 12,
  },

  edgeRow: {
    flexDirection: 'row',
    minHeight: 30,
  },

  edgeSpacer: {
    width: 40,
    marginRight: 10,
  },

  edgeBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },

  edgeLine: {
    width: 2,
    height: 14,
    backgroundColor: '#334155',
    marginBottom: 2,
  },

  edgeLineCompleted: {
    backgroundColor: '#22c55e',
  },
});
