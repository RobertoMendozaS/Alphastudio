import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { supabase } from '../services/supabaseClient';
import { generateRoadmap } from '../services/aiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentTopics, setRecentTopics] = useState<string[]>([]);

  React.useEffect(() => {
    loadRecentTopics();
  }, []);

  const loadRecentTopics = async () => {
    try {
      const stored = await AsyncStorage.getItem('@recent_topics');
      if (stored) {
        setRecentTopics(JSON.parse(stored));
      } else {
        setRecentTopics(['React Native', 'Machine Learning', 'Diseño UX', 'Python Básico']);
      }
    } catch (e) {
      console.error('Error loading topics', e);
    }
  };

  const saveTopic = async (newTopic: string) => {
    try {
      const stored = await AsyncStorage.getItem('@recent_topics');
      let topics: string[] = stored ? JSON.parse(stored) : ['React Native', 'Machine Learning', 'Diseño UX', 'Python Básico'];
      if (!topics.includes(newTopic)) {
        topics = [newTopic, ...topics].slice(0, 5);
        await AsyncStorage.setItem('@recent_topics', JSON.stringify(topics));
        setRecentTopics(topics);
      }
    } catch (e) {
      console.error('Error saving topic', e);
    }
  };

  const handleGenerate = async () => {
    if (!query.trim()) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      Alert.alert('Error', 'Debes iniciar sesión para generar rutas');
      return;
    }

    setLoading(true);
    try {
      const roadmapData = await generateRoadmap(query, session.access_token);
      await saveTopic(query);
      navigation.navigate('Roadmap', { roadmap: roadmapData });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Hubo un error al generar la ruta. Intenta de nuevo.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>AlphaStudio AI</Text>
          <Text style={styles.subtitle}>Tu ruta de aprendizaje inteligente y visual</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-circle-outline" size={36} color="#38bdf8" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="¿Qué quieres aprender hoy? (Ej: React Native)"
        placeholderTextColor="#888"
        value={query}
        onChangeText={setQuery}
      />

      {recentTopics.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Sugerencias:</Text>
          <View style={styles.chipsContainer}>
            {recentTopics.map((topic, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.chip}
                onPress={() => setQuery(topic)}
              >
                <Text style={styles.chipText}>{topic}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleGenerate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Generar Ruta de Aprendizaje</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
  },
  profileBtn: {
    padding: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  input: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  button: {
    backgroundColor: '#38bdf8',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  suggestionsTitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  chipText: {
    color: '#38bdf8',
    fontSize: 13,
  },
});
