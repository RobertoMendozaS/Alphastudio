// src/screens/HomeScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { generateRoadmap } from '../services/aiService';
import { Roadmap } from '../types/roadmap';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const roadmapData: Roadmap = await generateRoadmap(query);
      navigation.navigate('Roadmap', { roadmap: roadmapData });
    } catch (error) {
      alert('Hubo un error al generar la ruta. Intenta de nuevo.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗺️ AlphaStudio AI</Text>
      <Text style={styles.subtitle}>Tu ruta de aprendizaje inteligente y visual</Text>

      <TextInput
        style={styles.input}
        placeholder="¿Qué quieres aprender hoy? (Ej: React Native)"
        placeholderTextColor="#888"
        value={query}
        onChangeText={setQuery}
      />

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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 40,
    textAlign: 'center',
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
});