import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, Animated, Easing, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import type { SurveyResponse } from '../types/survey';

interface SurveyModalProps {
  visible: boolean;
  topic: string;
  onSubmit: (response: SurveyResponse) => void;
  onSkip: () => void;
}

const LEVELS = [
  { value: 'principiante' as const, label: 'Principiante', icon: 'leaf-outline' },
  { value: 'intermedio' as const, label: 'Intermedio', icon: 'leaf' },
  { value: 'avanzado' as const, label: 'Avanzado', icon: 'flame' },
];

const TIMES = [
  { value: 'menos_1_semana' as const, label: 'Menos de 1 semana' },
  { value: '1_2_semanas' as const, label: '1–2 semanas' },
  { value: '1_mes' as const, label: '1 mes' },
  { value: 'mas_1_mes' as const, label: 'Más de 1 mes' },
];

const GOALS = [
  { value: 'aprender_cero' as const, label: 'Aprender desde cero' },
  { value: 'profundizar' as const, label: 'Profundizar conocimientos' },
  { value: 'certificacion' as const, label: 'Preparación para certificación' },
  { value: 'proyecto' as const, label: 'Realizar un proyecto' },
];

import * as Haptics from 'expo-haptics';

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const scaleAnims = useRef([1, 2, 3, 4, 5].map(() => new Animated.Value(1))).current;

  const handlePress = (star: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onChange(star);
    // Animar la estrella seleccionada
    Animated.sequence([
      Animated.timing(scaleAnims[star - 1], {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[star - 1], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={surveyStyles.stars}>
      {[1, 2, 3, 4, 5].map((star, idx) => (
        <TouchableOpacity key={star} onPress={() => handlePress(star)} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ scale: scaleAnims[idx] }] }}>
            <Ionicons
              name={star <= value ? 'star' : 'star-outline'}
              size={36}
              color={star <= value ? '#f97316' : '#4c3a85'}
            />
          </Animated.View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function SurveyModal({ visible, topic, onSubmit, onSkip }: SurveyModalProps) {
  const [knowledgeLevel, setKnowledgeLevel] = useState<SurveyResponse['knowledgeLevel'] | null>(null);
  const [timeCommitment, setTimeCommitment] = useState<SurveyResponse['timeCommitment'] | null>(null);
  const [mainGoal, setMainGoal] = useState<SurveyResponse['mainGoal'] | null>(null);
  const [experience, setExperience] = useState<number>(0);

  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset state on open
      setKnowledgeLevel(null);
      setTimeCommitment(null);
      setMainGoal(null);
      setExperience(0);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  const canSubmit = knowledgeLevel && timeCommitment && mainGoal && experience > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onSubmit({
      topic,
      knowledgeLevel,
      timeCommitment,
      mainGoal,
      experience: experience as SurveyResponse['experience'],
      timestamp: new Date().toISOString(),
    });
  };

  if (!visible) return null;

  const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onSkip}>
      <AnimatedBlurView 
        intensity={40} 
        tint="dark" 
        style={[surveyStyles.overlay, { opacity: fadeAnim }]}
      >
        <Animated.View style={{ flex: 1, transform: [{ translateY: slideAnim }] }}>
          <ScrollView contentContainerStyle={surveyStyles.container} showsVerticalScrollIndicator={false}>
            <View style={surveyStyles.card}>
              <View style={surveyStyles.glowTop} />
              
              <View style={surveyStyles.header}>
                <View style={surveyStyles.iconContainer}>
                  <Ionicons name="sparkles" size={24} color="#8b5cf6" />
                </View>
                <Text style={surveyStyles.title}>Plan Personalizado</Text>
              </View>
              
              <Text style={surveyStyles.subtitle}>
                Ajustaremos la ruta de aprendizaje sobre <Text style={{ color: '#f8fafc', fontFamily: 'Outfit_700Bold' }}>{topic}</Text> a tu medida.
              </Text>

              {/* SECTION: NIVEL */}
              <Text style={surveyStyles.label}>1. ¿Cuál es tu nivel actual?</Text>
              <View style={surveyStyles.optionsRow}>
                {LEVELS.map((l) => {
                  const isActive = knowledgeLevel === l.value;
                  return (
                    <TouchableOpacity
                      key={l.value}
                      style={[surveyStyles.option, isActive && surveyStyles.optionActive]}
                      onPress={() => setKnowledgeLevel(l.value)}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={l.icon as any} 
                        size={22} 
                        color={isActive ? '#8b5cf6' : '#94a3b8'} 
                      />
                      <Text style={[surveyStyles.optionText, isActive && surveyStyles.optionTextActive]}>
                        {l.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* SECTION: TIEMPO */}
              <Text style={surveyStyles.label}>2. ¿Cuánto tiempo planeas dedicar?</Text>
              <View style={surveyStyles.gridContainer}>
                {TIMES.map((t) => {
                  const isActive = timeCommitment === t.value;
                  return (
                    <TouchableOpacity
                      key={t.value}
                      style={[surveyStyles.gridOption, isActive && surveyStyles.gridOptionActive]}
                      onPress={() => setTimeCommitment(t.value)}
                      activeOpacity={0.7}
                    >
                      <View style={[surveyStyles.radio, isActive && surveyStyles.radioActive]}>
                        {isActive && <View style={surveyStyles.radioInner} />}
                      </View>
                      <Text style={[surveyStyles.gridText, isActive && surveyStyles.gridTextActive]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* SECTION: OBJETIVO */}
              <Text style={surveyStyles.label}>3. ¿Cuál es tu objetivo principal?</Text>
              {GOALS.map((g) => {
                const isActive = mainGoal === g.value;
                return (
                  <TouchableOpacity
                    key={g.value}
                    style={[surveyStyles.rowOption, isActive && surveyStyles.rowOptionActive]}
                    onPress={() => setMainGoal(g.value)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isActive ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={isActive ? '#8b5cf6' : '#6b7280'}
                    />
                    <Text style={[surveyStyles.rowText, isActive && surveyStyles.rowTextActive]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* SECTION: EXPERIENCIA */}
              <Text style={surveyStyles.label}>4. Califica tu experiencia general con la tecnología</Text>
              <StarRating value={experience} onChange={setExperience} />

              {/* BUTTONS */}
              <View style={surveyStyles.buttons}>
                <TouchableOpacity style={surveyStyles.skipBtn} onPress={onSkip} activeOpacity={0.8}>
                  <Text style={surveyStyles.skipText}>Omitir</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ flex: 2 }}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={canSubmit ? ['#8b5cf6', '#0ea5e9'] : ['#3b2c6b', '#3b2c6b']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={surveyStyles.submitGradient}
                  >
                    <Text style={[surveyStyles.submitText, !canSubmit && { color: '#94a3b8' }]}>
                      Generar Ruta
                    </Text>
                    {canSubmit && <Ionicons name="arrow-forward" size={18} color="#fff" />}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </Animated.View>
      </AnimatedBlurView>
    </Modal>
  );
}

const surveyStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.85)', // bg-deep con opacidad
    justifyContent: 'center',
    padding: 16,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  card: {
    backgroundColor: '#0f0b1f',
    borderWidth: 1,
    borderColor: '#3b2c6b',
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  glowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#8b5cf6',
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Outfit_400Regular', fontSize: 22,
    fontFamily: 'Outfit_800ExtraBold',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Outfit_400Regular', fontSize: 14,
    color: '#a78bfa',
    marginBottom: 28,
    lineHeight: 20,
  },
  label: {
    fontFamily: 'Outfit_400Regular', fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    color: '#f8fafc',
    marginBottom: 12,
    marginTop: 8,
  },
  
  // Options Row
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: '#17122b',
    borderWidth: 1,
    borderColor: '#3b2c6b',
    borderRadius: 16,
    gap: 8,
  },
  optionActive: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  optionText: {
    fontFamily: 'Outfit_400Regular', fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'Outfit_600SemiBold',
  },
  optionTextActive: {
    color: '#8b5cf6',
  },

  // Grid options (Tiempo)
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  gridOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#17122b',
    borderWidth: 1,
    borderColor: '#3b2c6b',
    borderRadius: 14,
    gap: 10,
  },
  gridOptionActive: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: '#8b5cf6',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8b5cf6',
  },
  gridText: {
    fontFamily: 'Outfit_400Regular', fontSize: 13,
    color: '#a78bfa',
    flex: 1,
  },
  gridTextActive: {
    color: '#f8fafc',
    fontFamily: 'Outfit_600SemiBold',
  },

  // Row options (Objetivos)
  rowOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#17122b',
    borderWidth: 1,
    borderColor: '#3b2c6b',
    borderRadius: 14,
    marginBottom: 10,
  },
  rowOptionActive: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  rowText: {
    fontFamily: 'Outfit_400Regular', fontSize: 14,
    color: '#a78bfa',
  },
  rowTextActive: {
    color: '#f8fafc',
    fontFamily: 'Outfit_600SemiBold',
  },

  // Stars
  stars: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 32,
    marginTop: 8,
  },

  // Buttons
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#3b2c6b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    color: '#e2e8f0',
    fontFamily: 'Outfit_400Regular', fontSize: 15,
    fontFamily: 'Outfit_700Bold',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  submitText: {
    color: '#ffffff',
    fontFamily: 'Outfit_400Regular', fontSize: 15,
    fontFamily: 'Outfit_700Bold',
  },
});
