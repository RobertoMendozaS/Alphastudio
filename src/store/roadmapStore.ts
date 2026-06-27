import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Roadmap } from '../types/roadmap';
import type { SurveyResponse } from '../types/survey';
import type { TestResult } from '../types/test';
import { syncTestResult } from '../services/testService';
import type { DynamicBadge } from '../services/aiService';

type RoadmapState = {
  currentRoadmap: Roadmap | null;
  localRoadmaps: Roadmap[];
  recentTopics: string[];
  completedNodes: string[];
  surveyResponses: SurveyResponse[];
  testResults: TestResult[];
  dynamicBadges: DynamicBadge[];

  setCurrentRoadmap: (roadmap: Roadmap) => void;
  loadRecentTopics: () => Promise<void>;
  saveRecentTopic: (topic: string) => Promise<void>;
  toggleNodeCompleted: (nodeId: string) => void;
  saveCurrentRoadmapLocal: () => Promise<void>;
  saveRoadmapToHistory: (roadmap: Roadmap) => Promise<void>;
  removeRoadmapFromHistory: (title: string) => Promise<void>;
  clearRoadmap: () => void;
  loadLocalRoadmaps: () => void;
  saveSurveyResponse: (response: SurveyResponse) => Promise<void>;
  loadSurveyResponses: () => Promise<void>;
  saveTestResult: (result: TestResult) => Promise<void>;
  saveAndSyncTestResult: (result: TestResult, userId: string) => Promise<void>;
  loadTestResults: () => Promise<void>;
  saveDynamicBadge: (badge: DynamicBadge) => Promise<void>;
  loadDynamicBadges: () => Promise<void>;
  clearAllHistory: () => Promise<void>;
  clearRecentTopics: () => Promise<void>;
};

const DEFAULT_TOPICS = ['React Native', 'Machine Learning', 'Diseño UX', 'Python Básico'];

export const useRoadmapStore = create<RoadmapState>((set, get) => ({
  currentRoadmap: null,
  localRoadmaps: [],
  recentTopics: [],
  completedNodes: [],
  surveyResponses: [],
  testResults: [],
  dynamicBadges: [],

  setCurrentRoadmap: (roadmap) =>
    set({
      currentRoadmap: roadmap,
      completedNodes: [],
    }),

  loadRecentTopics: async () => {
    try {
      const stored = await AsyncStorage.getItem('@recent_topics');
      set({
        recentTopics: stored ? JSON.parse(stored) : DEFAULT_TOPICS,
      });
    } catch {
      set({ recentTopics: DEFAULT_TOPICS });
    }
  },

  saveRecentTopic: async (topic) => {
    const cleanTopic = topic.trim();
    if (!cleanTopic) return;

    const currentTopics = get().recentTopics.length > 0 ? get().recentTopics : DEFAULT_TOPICS;
    const newTopics = [cleanTopic, ...currentTopics.filter((item) => item !== cleanTopic)].slice(0, 5);

    await AsyncStorage.setItem('@recent_topics', JSON.stringify(newTopics));
    set({ recentTopics: newTopics });
  },

  toggleNodeCompleted: (nodeId) =>
    set((state) => ({
      completedNodes: state.completedNodes.includes(nodeId)
        ? state.completedNodes.filter((id) => id !== nodeId)
        : [...state.completedNodes, nodeId],
    })),

  saveCurrentRoadmapLocal: async () => {
    const { currentRoadmap, completedNodes } = get();
    if (currentRoadmap) {
      await AsyncStorage.setItem(
        '@current_roadmap',
        JSON.stringify({ roadmap: currentRoadmap, completedNodes }),
      );
    }
  },

  saveRoadmapToHistory: async (roadmap) => {
    try {
      const stored = await AsyncStorage.getItem('@roadmap_history');
      const history = stored ? JSON.parse(stored) : [];
      const updated = [roadmap, ...history.filter((r: Roadmap) => r.title !== roadmap.title)].slice(0, 20);
      await AsyncStorage.setItem('@roadmap_history', JSON.stringify(updated));
      set({ localRoadmaps: updated });
    } catch {
      // Silent fail
    }
  },

  removeRoadmapFromHistory: async (title) => {
    try {
      const stored = await AsyncStorage.getItem('@roadmap_history');
      if (!stored) return;
      const history = JSON.parse(stored);
      const updated = history.filter((r: Roadmap) => r.title !== title);
      await AsyncStorage.setItem('@roadmap_history', JSON.stringify(updated));
      set({ localRoadmaps: updated });
    } catch {
      // Silent fail
    }
  },

  clearRoadmap: () =>
    set({
      currentRoadmap: null,
      completedNodes: [],
    }),

  clearAllHistory: async () => {
    try {
      await AsyncStorage.removeItem('@roadmap_history');
      set({ localRoadmaps: [] });
    } catch {
      // Silent fail
    }
  },

  clearRecentTopics: async () => {
    try {
      await AsyncStorage.removeItem('@recent_topics');
      set({ recentTopics: [] });
    } catch {
      // Silent fail
    }
  },

  saveSurveyResponse: async (response) => {
    try {
      const stored = await AsyncStorage.getItem('@survey_responses');
      const all = stored ? JSON.parse(stored) : [];
      all.push(response);
      await AsyncStorage.setItem('@survey_responses', JSON.stringify(all));
      set({ surveyResponses: all });
    } catch {
      // Silent fail
    }
  },

  loadSurveyResponses: async () => {
    try {
      const stored = await AsyncStorage.getItem('@survey_responses');
      set({ surveyResponses: stored ? JSON.parse(stored) : [] });
    } catch {
      set({ surveyResponses: [] });
    }
  },

  saveTestResult: async (result) => {
    try {
      const stored = await AsyncStorage.getItem('@test_results');
      const all = stored ? JSON.parse(stored) : [];
      all.push(result);
      await AsyncStorage.setItem('@test_results', JSON.stringify(all));
      set({ testResults: all });
    } catch {
      // Silent fail
    }
  },

  saveAndSyncTestResult: async (result, userId) => {
    try {
      const stored = await AsyncStorage.getItem('@test_results');
      const all = stored ? JSON.parse(stored) : [];
      all.push(result);
      await AsyncStorage.setItem('@test_results', JSON.stringify(all));
      set({ testResults: all });
    } catch {
      // Silent fail
    }
    try {
      await syncTestResult(result, userId);
    } catch {
      // Silent fail - se sincronizará después manualmente
    }
  },

  loadTestResults: async () => {
    try {
      const stored = await AsyncStorage.getItem('@test_results');
      set({ testResults: stored ? JSON.parse(stored) : [] });
    } catch {
      set({ testResults: [] });
    }
  },

  loadLocalRoadmaps: async () => {
    try {
      const stored = await AsyncStorage.getItem('@roadmap_history');
      set({ localRoadmaps: stored ? JSON.parse(stored) : [] });
    } catch {
      set({ localRoadmaps: [] });
    }
  },

  saveDynamicBadge: async (badge) => {
    try {
      const stored = await AsyncStorage.getItem('@dynamic_badges');
      const all: DynamicBadge[] = stored ? JSON.parse(stored) : [];
      // Prevent duplicates by checking topic
      if (!all.some(b => b.topic.toLowerCase() === badge.topic.toLowerCase())) {
        all.push(badge);
        await AsyncStorage.setItem('@dynamic_badges', JSON.stringify(all));
        set({ dynamicBadges: all });
      }
    } catch {
      // Silent fail
    }
  },

  loadDynamicBadges: async () => {
    try {
      const stored = await AsyncStorage.getItem('@dynamic_badges');
      set({ dynamicBadges: stored ? JSON.parse(stored) : [] });
    } catch {
      set({ dynamicBadges: [] });
    }
  },
}));
