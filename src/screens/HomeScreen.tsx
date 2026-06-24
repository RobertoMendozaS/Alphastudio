import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, Easing, ActivityIndicator, Platform, StatusBar, Alert,
} from 'react-native';
import { supabase } from '../services/supabaseClient';
import { generateRoadmap } from '../services/aiService';
import { Ionicons } from '@expo/vector-icons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../types/navigation';
import { useRoadmapStore } from '../store/roadmapStore';
import { LinearGradient } from 'expo-linear-gradient';
import AlphaLogo from '../components/AlphaLogo';
import { SkeletonHistoryCard } from '../screens/SkeletonComponents';
import SurveyModal from '../components/SurveyModal';
import TestModal from '../components/TestModal';
import { generateTestQuestions } from '../services/aiService';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const SUGGESTIONS = [
  'Python desde cero',
  'JavaScript avanzado',
  'Machine Learning',
  'React Native',
  'Inglés básico',
];

export default function HomeScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showPreTest, setShowPreTest] = useState(false);
  const [preTestQuestions, setPreTestQuestions] = useState<any[]>([]);
  const [pendingRoadmap, setPendingRoadmap] = useState<any>(null);
  const { recentTopics, setCurrentRoadmap } = useRoadmapStore();
  const { loadRecentTopics, saveRecentTopic, saveRoadmapToHistory, saveSurveyResponse, saveTestResult } = useRoadmapStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadRecentTopics();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGenerate = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        Alert.alert('Sesión expirada', 'Inicia sesión nuevamente.');
        return;
      }
      const roadmapData = await generateRoadmap(query, session.access_token);
      await saveRecentTopic(query);
      await saveRoadmapToHistory(roadmapData);
      setCurrentRoadmap(roadmapData);
      setPendingRoadmap(roadmapData);
      setShowSurvey(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Ocurrió un error al generar la ruta.');
    } finally {
      setLoading(false);
    }
  };

  const handleSurveySubmit = async (response: any) => {
    await saveSurveyResponse(response);
    setShowSurvey(false);
    const questions = await generateTestQuestions(query);
    setPreTestQuestions(questions);
    setShowPreTest(true);
  };

  const handleSurveySkip = () => {
    setShowSurvey(false);
    const navigateToRoadmap = async () => {
      const questions = await generateTestQuestions(query);
      setPreTestQuestions(questions);
      setShowPreTest(true);
    };
    navigateToRoadmap();
  };

  const handlePreTestSubmit = async (result: any) => {
    await saveTestResult(result);
    setShowPreTest(false);
    if (pendingRoadmap) {
      navigation.navigate('Roadmap', { roadmap: pendingRoadmap });
      setPendingRoadmap(null);
    }
  };

  const handlePreTestSkip = () => {
    setShowPreTest(false);
    if (pendingRoadmap) {
      navigation.navigate('Roadmap', { roadmap: pendingRoadmap });
      setPendingRoadmap(null);
    }
  };

  const selectTopic = (topic: string) => {
    setQuery(topic);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#020617', '#0f172a', '#0c1a2e']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.headerSection}>
          <AlphaLogo />
          <Text style={styles.title}>AlphaStudio AI</Text>
          <Text style={styles.subtitle}>Tu ruta de aprendizaje inteligente y visual</Text>
        </View>

        <View style={styles.inputSection}>
          <TextInput
            style={styles.input}
            placeholder="¿Qué quieres aprender hoy?"
            placeholderTextColor="#475569"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleGenerate}
            returnKeyType="go"
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.generateBtn, !query.trim() && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={loading || !query.trim()}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.generateBtnInner}>
                <Ionicons name="sparkles" size={18} color="#fff" />
                <Text style={styles.generateBtnText}>Generar ruta</Text>
              </View>
            )}
          </TouchableOpacity>

          {loading && (
            <View style={styles.skeletonContainer}>
              <SkeletonHistoryCard />
              <SkeletonHistoryCard />
              <SkeletonHistoryCard />
            </View>
          )}
        </View>

        {!loading && recentTopics.length > 0 && (
          <View style={styles.topicsSection}>
            <Text style={styles.topicsTitle}>Temas recientes</Text>
            <View style={styles.chipsContainer}>
              {recentTopics.map((topic, index) => (
                <TouchableOpacity
                  key={`${topic}-${index}`}
                  style={styles.chip}
                  onPress={() => selectTopic(topic)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="time-outline" size={14} color="#94a3b8" />
                  <Text style={styles.chipText}>{topic}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {!loading && (
          <View style={styles.topicsSection}>
            <Text style={styles.topicsTitle}>Sugerencias</Text>
            <View style={styles.chipsContainer}>
              {SUGGESTIONS.map((topic, index) => (
                <TouchableOpacity
                  key={`suggestion-${index}`}
                  style={styles.chip}
                  onPress={() => selectTopic(topic)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="bulb-outline" size={14} color="#94a3b8" />
                  <Text style={styles.chipText}>{topic}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </Animated.View>
      <SurveyModal
        visible={showSurvey}
        topic={query}
        onSubmit={handleSurveySubmit}
        onSkip={handleSurveySkip}
      />
      <TestModal
        visible={showPreTest}
        title={query}
        questions={preTestQuestions}
        onSubmit={handlePreTestSubmit}
        onSkip={handlePreTestSkip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 48,
  },
  headerSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#e2e8f0',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  generateBtn: {
    backgroundColor: '#06b6d4',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBtnDisabled: {
    opacity: 0.5,
  },
  generateBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  topicsSection: {
    flex: 1,
  },
  topicsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '500',
  },
  skeletonContainer: {
    paddingTop: 20,
  },
});
