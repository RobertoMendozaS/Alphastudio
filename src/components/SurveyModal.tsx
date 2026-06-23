import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SurveyResponse } from '../types/survey';

interface SurveyModalProps {
  visible: boolean;
  topic: string;
  onSubmit: (response: SurveyResponse) => void;
  onSkip: () => void;
}

const LEVELS = [
  { value: 'principiante' as const, label: 'Principiante', icon: 'seedling' },
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

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={surveyStyles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange(star)} activeOpacity={0.7}>
          <Ionicons
            name={star <= value ? 'star' : 'star-outline'}
            size={32}
            color={star <= value ? '#f97316' : '#334155'}
          />
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

  const canSubmit = knowledgeLevel && timeCommitment && mainGoal && experience > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      topic,
      knowledgeLevel,
      timeCommitment,
      mainGoal,
      experience: experience as SurveyResponse['experience'],
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={surveyStyles.overlay}>
        <ScrollView contentContainerStyle={surveyStyles.container} showsVerticalScrollIndicator={false}>
          <View style={surveyStyles.card}>
            <View style={surveyStyles.header}>
              <Ionicons name="clipboard-outline" size={28} color="#06b6d4" />
              <Text style={surveyStyles.title}>Encuesta rápida</Text>
            </View>
            <Text style={surveyStyles.subtitle}>
              Ayúdanos a mejorar respondiendo esta breve encuesta sobre "{topic}"
            </Text>

            <Text style={surveyStyles.label}>¿Cuál es tu nivel actual?</Text>
            <View style={surveyStyles.optionsRow}>
              {LEVELS.map((l) => (
                <TouchableOpacity
                  key={l.value}
                  style={[surveyStyles.option, knowledgeLevel === l.value && surveyStyles.optionActive]}
                  onPress={() => setKnowledgeLevel(l.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={l.icon as any} size={20} color={knowledgeLevel === l.value ? '#06b6d4' : '#64748b'} />
                  <Text style={[surveyStyles.optionText, knowledgeLevel === l.value && surveyStyles.optionTextActive]}>
                    {l.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={surveyStyles.label}>¿Cuánto tiempo planeas dedicar?</Text>
            {TIMES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[surveyStyles.rowOption, timeCommitment === t.value && surveyStyles.rowOptionActive]}
                onPress={() => setTimeCommitment(t.value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={timeCommitment === t.value ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={timeCommitment === t.value ? '#06b6d4' : '#475569'}
                />
                <Text style={[surveyStyles.rowText, timeCommitment === t.value && surveyStyles.rowTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={surveyStyles.label}>¿Cuál es tu objetivo principal?</Text>
            {GOALS.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[surveyStyles.rowOption, mainGoal === g.value && surveyStyles.rowOptionActive]}
                onPress={() => setMainGoal(g.value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={mainGoal === g.value ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={mainGoal === g.value ? '#06b6d4' : '#475569'}
                />
                <Text style={[surveyStyles.rowText, mainGoal === g.value && surveyStyles.rowTextActive]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={surveyStyles.label}>Califica tu experiencia (1 = mínimo, 5 = máximo)</Text>
            <StarRating value={experience} onChange={setExperience} />

            <View style={surveyStyles.buttons}>
              <TouchableOpacity style={surveyStyles.skipBtn} onPress={onSkip} activeOpacity={0.8}>
                <Text style={surveyStyles.skipText}>Saltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[surveyStyles.submitBtn, !canSubmit && surveyStyles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit}
                activeOpacity={0.85}
              >
                <Text style={surveyStyles.submitText}>Enviar encuesta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const surveyStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 18,
    padding: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f1f5f9',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 22,
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 10,
    marginTop: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#0c1a2e',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    gap: 6,
  },
  optionActive: {
    borderColor: '#06b6d4',
    backgroundColor: '#0f172a',
  },
  optionText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#06b6d4',
  },
  rowOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#0c1a2e',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 8,
  },
  rowOptionActive: {
    borderColor: '#06b6d4',
  },
  rowText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  rowTextActive: {
    color: '#06b6d4',
    fontWeight: '600',
  },
  stars: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  skipText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#06b6d4',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
