import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TestQuestion, TestResult } from '../types/test';

interface TestModalProps {
  visible: boolean;
  title: string;
  questions: TestQuestion[];
  onSubmit: (result: TestResult) => void;
  onSkip: () => void;
}

export default function TestModal({ visible, title, questions, onSubmit, onSkip }: TestModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  const handleSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (isLast) {
      const correct = answers.filter((a, i) => a === questions[i].correctIndex).length;
      const result: TestResult = {
        topic: title,
        type: 'pre',
        questions,
        answers,
        score: correct,
        total: questions.length,
        timestamp: new Date().toISOString(),
      };
      setShowResult(true);
      return;
    }
    setCurrentIndex(currentIndex + 1);
  };

  const handleFinish = () => {
    const correct = answers.filter((a, i) => a === questions[i].correctIndex).length;
    const result: TestResult = {
      topic: title,
      type: 'pre',
      questions,
      answers,
      score: correct,
      total: questions.length,
      timestamp: new Date().toISOString(),
    };
    onSubmit(result);
    setCurrentIndex(0);
    setAnswers([]);
    setShowResult(false);
  };

  const handleSkip = () => {
    setCurrentIndex(0);
    setAnswers([]);
    setShowResult(false);
    onSkip();
  };

  const correctCount = answers.filter((a, i) => a === questions[i]?.correctIndex).length;
  const percent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  if (showResult) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={testStyles.overlay}>
          <View style={testStyles.card}>
            <Ionicons name="checkmark-circle" size={48} color={percent >= 60 ? '#22c55e' : '#f97316'} />
            <Text style={testStyles.resultTitle}>Test completado</Text>
            <Text style={testStyles.resultScore}>{correctCount}/{questions.length}</Text>
            <Text style={testStyles.resultPercent}>{percent}% de aciertos</Text>
            <View style={testStyles.buttons}>
              <TouchableOpacity style={testStyles.submitBtn} onPress={handleFinish} activeOpacity={0.85}>
                <Text style={testStyles.submitText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if (!question) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={testStyles.overlay}>
        <ScrollView contentContainerStyle={testStyles.container} showsVerticalScrollIndicator={false}>
          <View style={testStyles.card}>
            <View style={testStyles.header}>
              <Text style={testStyles.pill}>
                Pregunta {currentIndex + 1} de {questions.length}
              </Text>
              <TouchableOpacity onPress={handleSkip}>
                <Text style={testStyles.skip}>Saltar</Text>
              </TouchableOpacity>
            </View>

            <Text style={testStyles.question}>{question.question}</Text>

            <View style={testStyles.options}>
              {question.options.map((opt, i) => {
                const selected = answers[currentIndex] === i;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[testStyles.option, selected && testStyles.optionSelected]}
                    onPress={() => handleSelect(i)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={selected ? '#06b6d4' : '#475569'}
                    />
                    <Text style={[testStyles.optionText, selected && testStyles.optionTextSelected]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[testStyles.nextBtn, answers[currentIndex] === undefined && testStyles.nextBtnDisabled]}
              onPress={handleNext}
              disabled={answers[currentIndex] === undefined}
              activeOpacity={0.85}
            >
              <Text style={testStyles.nextText}>
                {isLast ? 'Ver resultado' : 'Siguiente'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const testStyles = StyleSheet.create({
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
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  pill: {
    fontSize: 12,
    fontWeight: '700',
    color: '#06b6d4',
    backgroundColor: '#0c1a2e',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  skip: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  question: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  options: {
    width: '100%',
    gap: 10,
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#0c1a2e',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
  },
  optionSelected: {
    borderColor: '#06b6d4',
  },
  optionText: {
    fontSize: 14,
    color: '#cbd5e1',
    flex: 1,
  },
  optionTextSelected: {
    color: '#06b6d4',
    fontWeight: '600',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#06b6d4',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f1f5f9',
    marginTop: 12,
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 42,
    fontWeight: '800',
    color: '#e2e8f0',
  },
  resultPercent: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 24,
  },
  buttons: {
    width: '100%',
  },
  submitBtn: {
    backgroundColor: '#06b6d4',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
