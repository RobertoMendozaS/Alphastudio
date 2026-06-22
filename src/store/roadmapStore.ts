import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Roadmap } from '../types/roadmap';

type RoadmapState = {
  currentRoadmap: Roadmap | null;
  recentTopics: string[];
  completedNodes: string[];

  setCurrentRoadmap: (roadmap: Roadmap) => void;
  loadRecentTopics: () => Promise<void>;
  saveRecentTopic: (topic: string) => Promise<void>;
  toggleNodeCompleted: (nodeId: string) => void;
  saveCurrentRoadmapLocal: () => Promise<void>;
  clearRoadmap: () => void;
};

const DEFAULT_TOPICS = ['React Native', 'Machine Learning', 'Diseño UX', 'Python Básico'];

export const useRoadmapStore = create<RoadmapState>((set, get) => ({
  currentRoadmap: null,
  recentTopics: [],
  completedNodes: [],

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

  clearRoadmap: () =>
    set({
      currentRoadmap: null,
      completedNodes: [],
    }),
}));
