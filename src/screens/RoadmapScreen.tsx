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
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { RoadmapNode, Resource } from '../types/roadmap';
import { useRoadmapStore } from '../store/roadmapStore';
import { EmptyState } from '../screens/SkeletonComponents';
import TestModal from '../components/TestModal';
import BadgeAnimationModal from '../components/BadgeAnimationModal';
import { generateTestQuestions, generateDynamicBadge } from '../services/aiService';
import type { DynamicBadge } from '../services/aiService';
import { supabase } from '../services/supabaseClient';

type Props = NativeStackScreenProps<RootStackParamList, 'Roadmap'>;

export default function RoadmapScreen({ route, navigation }: Props) {
  const routeRoadmap = route.params.roadmap;
  const { currentRoadmap, setCurrentRoadmap, completedNodes, toggleNodeCompleted, saveCurrentRoadmapLocal, saveRoadmapToHistory, saveAndSyncTestResult, testResults } = useRoadmapStore();
  const roadmap = currentRoadmap ?? routeRoadmap;

  const [showPostTest, setShowPostTest] = useState(false);
  const [postTestQuestions, setPostTestQuestions] = useState<any[]>([]);
  const [showBadgeAnimation, setShowBadgeAnimation] = useState(false);
  const [earnedBadge, setEarnedBadge] = useState<DynamicBadge | null>(null);
  const [isGeneratingBadge, setIsGeneratingBadge] = useState(false);

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

  // No automatically trigger postTest anymore
  useEffect(() => {
    // Just keeping the effect slot if needed, but removed the auto-trigger logic.
  }, []);

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
      case 'youtube': return '#ef4444';
      case 'course': return '#8b5cf6';
      case 'documentation': return '#3b82f6';
      case 'google': return '#3b82f6';
      default: return '#94a3b8';
    }
  };

  const handlePostTestSubmit = async (result: any) => {
    const postResult = { ...result, type: 'post' as const };
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await saveAndSyncTestResult(postResult, session.user.id);
    } else {
      const { saveTestResult } = useRoadmapStore.getState();
      await saveTestResult(postResult);
    }
    setShowPostTest(false);

    // Give badge ONLY if score is 100%
    if (result.score === result.total && result.total > 0) {
      setIsGeneratingBadge(true);
      try {
        const topic = roadmap.title.replace('Ruta para aprender ', '');
        const badge = await generateDynamicBadge(topic);
        setEarnedBadge(badge);
        setShowBadgeAnimation(true);
      } catch (e) {
        Alert.alert('Error', 'Hubo un problema generando tu insignia.');
      } finally {
        setIsGeneratingBadge(false);
      }
    } else {
      Alert.alert('Casi lo logras', `Obtuviste ${result.score}/${result.total}. Debes responder correctamente todas las preguntas para obtener la insignia.`);
    }
  };

  const handlePostTestSkip = () => {
    setShowPostTest(false);
    Alert.alert('Test omitido', 'Debes completar el test para obtener tu insignia.');
  };

  const handleBadgeAnimationClose = async () => {
    setShowBadgeAnimation(false);
    if (earnedBadge) {
      const { saveDynamicBadge } = useRoadmapStore.getState();
      await saveDynamicBadge(earnedBadge);
    }
    await saveRoadmapToHistory(roadmap);
    await saveCurrentRoadmapLocal();
    setTimeout(() => {
      if (Platform.OS === 'web') {
        document.body.style.pointerEvents = 'auto';
        document.body.removeAttribute('aria-hidden');
        const root = document.getElementById('root');
        if (root) {
          root.style.pointerEvents = 'auto';
          root.removeAttribute('aria-hidden');
        }
      }
      navigation.goBack();
    }, 300);
  };

  const handleClaimBadge = async () => {
    const topic = roadmap.title.replace('Ruta para aprender ', '');
    const questions = await generateTestQuestions(topic);
    setPostTestQuestions(questions);
    setShowPostTest(true);
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
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons
            name="arrow-back"
            size={24}
            color="#0f0b1f"
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.headerTitle}>Mi Ruta</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleSaveLocal} style={styles.shareBtn}>
            <Ionicons name="save-outline" size={20} color="#0ea5e9" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <Ionicons name="share-social-outline" size={20} color="#0ea5e9" />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeTxt}>Roadmap</Text>
        </View>

        <Text style={styles.title}>{roadmap.title}</Text>
        <Text style={styles.desc}>{roadmap.description}</Text>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressTitle}>Progreso de la ruta</Text>
              <Text style={styles.progressSub}>
                {completedCount} de {totalNodes} nodos completados
              </Text>
            </View>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBar}>
            <Animated.View
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
                            <Ionicons name="checkmark" size={15} color="#fff" />
                          ) : (
                            <View style={styles.dotInner} />
                          )}
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => toggleNodeCompleted(node.id)}
                        style={[
                          styles.card,
                          isCompleted && styles.cardCompleted,
                        ]}
                      >
                        <View style={styles.cardHeader}>
                          <Text
                            style={[
                              styles.cardTitle,
                              isCompleted && styles.cardTitleCompleted,
                            ]}
                          >
                            {node.data.label}
                          </Text>
                          {isCompleted && (
                            <View style={styles.completedBadge}>
                              <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                              <Text style={styles.completedBadgeText}>Listo</Text>
                            </View>
                          )}
                        </View>

                        <Text
                          style={[
                            styles.cardDesc,
                            isCompleted && styles.cardDescCompleted,
                          ]}
                        >
                          {node.data.description}
                        </Text>

                        <View style={styles.resourcesSection}>
                          <Text style={styles.resourcesTitle}>Recursos</Text>
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
                                color="#a78bfa"
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </TouchableOpacity>
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
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}

              <View style={styles.badgeClaimSection}>
                <TouchableOpacity
                  style={[
                    styles.badgeClaimBtn,
                    progressPercent === 100 ? styles.badgeClaimBtnActive : styles.badgeClaimBtnDisabled,
                  ]}
                  disabled={progressPercent !== 100 || isGeneratingBadge}
                  onPress={handleClaimBadge}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name={progressPercent === 100 ? "trophy" : "lock-closed"} 
                    size={20} 
                    color={progressPercent === 100 ? "#ffffff" : "#a78bfa"} 
                  />
                  <Text style={[
                    styles.badgeClaimText,
                    progressPercent === 100 ? styles.badgeClaimTextActive : styles.badgeClaimTextDisabled,
                  ]}>
                    {isGeneratingBadge ? 'Generando insignia...' : (progressPercent === 100 ? '¡Reclamar Insignia!' : 'Completa la ruta para tu insignia')}
                  </Text>
                </TouchableOpacity>
              </View>

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
      <BadgeAnimationModal
        visible={showBadgeAnimation}
        badge={earnedBadge}
        onClose={handleBadgeAnimationClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 32, paddingBottom: 10,
  },
  headerTitle: { fontFamily: 'Outfit_400Regular', fontSize: 20, fontFamily: 'Outfit_700Bold', color: '#f8fafc' },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f0b1f',
    borderWidth: 1, borderColor: '#3b2c6b', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5, marginBottom: 16,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8b5cf6', marginRight: 6 },
  badgeTxt: { color: '#a78bfa', fontFamily: 'Outfit_400Regular', fontSize: 11, fontFamily: 'Outfit_600SemiBold' },
  headerActions: { flexDirection: 'row', gap: 8 },
  shareBtn: { padding: 8, backgroundColor: '#0f0b1f', borderRadius: 10, borderWidth: 1, borderColor: '#3b2c6b' },
  content: { flex: 1, paddingHorizontal: 20 },
  title: { color: '#f8fafc', fontFamily: 'Outfit_400Regular', fontSize: 26, fontFamily: 'Outfit_800ExtraBold', marginBottom: 6, letterSpacing: -0.5 },
  desc: { color: '#a78bfa', fontFamily: 'Outfit_400Regular', fontSize: 13, marginBottom: 16, lineHeight: 20 },
  progressCard: {
    backgroundColor: '#0f0b1f', borderWidth: 1, borderColor: '#3b2c6b',
    borderRadius: 16, padding: 16, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 2,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressTitle: { color: '#f8fafc', fontFamily: 'Outfit_400Regular', fontSize: 14, fontFamily: 'Outfit_700Bold' },
  progressSub: { color: '#94a3b8', fontFamily: 'Outfit_400Regular', fontSize: 12, marginTop: 2 },
  progressPercent: { color: '#22c55e', fontFamily: 'Outfit_400Regular', fontSize: 20, fontFamily: 'Outfit_900Black' },
  progressBar: { height: 8, backgroundColor: '#3b2c6b', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 4 },
  timeline: { paddingBottom: 40, paddingLeft: 16 },
  line: { position: 'absolute', left: 16, top: 0, bottom: 0, width: 2, backgroundColor: '#3b2c6b' },
  nodeBlock: { marginBottom: 0 },
  nodeRow: { flexDirection: 'row', alignItems: 'flex-start' },
  dotWrap: { width: 40, alignItems: 'center', marginRight: 10 },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#0f0b1f',
    borderWidth: 2, borderColor: '#3b2c6b',
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  checkCircleCompleted: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  dotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4c3a85' },
  card: {
    flex: 1, backgroundColor: '#0f0b1f', borderWidth: 1, borderColor: '#3b2c6b',
    borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 1,
  },
  cardCompleted: { borderColor: '#14532d', backgroundColor: '#0b1f18' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 },
  cardTitle: { color: '#f8fafc', fontFamily: 'Outfit_400Regular', fontSize: 15, fontFamily: 'Outfit_700Bold', flex: 1 },
  cardTitleCompleted: { color: '#bbf7d0' },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 6 },
  completedBadgeText: { color: '#22c55e', fontFamily: 'Outfit_400Regular', fontSize: 11, fontFamily: 'Outfit_700Bold' },
  cardDesc: { color: '#a78bfa', fontFamily: 'Outfit_400Regular', fontSize: 13, marginBottom: 12, lineHeight: 20 },
  cardDescCompleted: { color: '#86efac' },
  resourcesSection: { borderTopWidth: 1, borderTopColor: '#3b2c6b', paddingTop: 10 },
  resourcesTitle: { color: '#94a3b8', fontFamily: 'Outfit_400Regular', fontSize: 11, fontFamily: 'Outfit_700Bold', marginBottom: 8, textTransform: 'uppercase' },
  resource: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17122b',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#3b2c6b',
  },
  resourceText: {
    color: '#0ea5e9',
    fontFamily: 'Outfit_400Regular', fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    marginLeft: 6,
  },
  edgeSpacer: { width: 40, marginRight: 10 },
  edgeBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  edgeLine: { width: 2, height: 14, backgroundColor: '#3b2c6b', marginBottom: 2 },
  edgeLineCompleted: { backgroundColor: '#22c55e' },
  badgeClaimSection: { marginTop: 40, marginBottom: 20, alignItems: 'center' },
  badgeClaimBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, gap: 8, borderWidth: 1,
  },
  badgeClaimBtnActive: {
    backgroundColor: '#6366f1', borderColor: '#4f46e5',
    shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  badgeClaimBtnDisabled: { backgroundColor: '#0f0b1f', borderColor: '#3b2c6b' },
  badgeClaimText: { fontFamily: 'Outfit_400Regular', fontSize: 14, fontFamily: 'Outfit_700Bold' },
  badgeClaimTextActive: { color: '#ffffff' },
  badgeClaimTextDisabled: { color: '#6b7280' },
});
