import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AlphaLogo from './AlphaLogo';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Bienvenido a AlphaStudio AI',
    description: 'La primera plataforma que genera rutas de aprendizaje personalizadas con Inteligencia Artificial.',
    icon: 'planet',
  },
  {
    id: '2',
    title: 'Aprende a tu Ritmo',
    description: 'Dinos qué quieres aprender, tu nivel actual y cuánto tiempo tienes. Nosotros armamos el plan.',
    icon: 'rocket',
  },
  {
    id: '3',
    title: 'Sube de Nivel',
    description: 'Completa recursos, mantén tu racha de aprendizaje y domina cualquier tecnología.',
    icon: 'flash',
  },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('@has_launched');
      if (!hasLaunched) {
        setVisible(true);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
      }
    } catch (e) {
      console.log('Error checking first launch', e);
    }
  };

  const handleNext = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await AsyncStorage.setItem('@has_launched', 'true');
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    } catch (e) {
      console.log(e);
      setVisible(false);
    }
  };

  if (!visible) return null;

  const currentSlide = SLIDES[currentIndex];

  const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

  return (
    <Modal visible={visible} transparent animationType="none">
      <AnimatedBlurView intensity={70} tint="dark" style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View 
          style={[
            styles.card, 
            { 
              transform: [
                { translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) },
                { scale: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }
              ] 
            }
          ]}
        >
          <View style={styles.glowTop} />
          
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#8b5cf6', '#0ea5e9']}
              style={styles.iconGradient}
            >
              <Ionicons name={currentSlide.icon as any} size={40} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={styles.title}>{currentSlide.title}</Text>
          <Text style={styles.description}>{currentSlide.description}</Text>

          <View style={styles.pagination}>
            {SLIDES.map((_, idx) => (
              <View 
                key={idx} 
                style={[
                  styles.dot, 
                  idx === currentIndex && styles.dotActive
                ]} 
              />
            ))}
          </View>

          <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={handleNext}>
            <LinearGradient
              colors={['#8b5cf6', '#0ea5e9']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {currentIndex === SLIDES.length - 1 ? 'Comenzar' : 'Siguiente'}
              </Text>
              <Ionicons 
                name={currentIndex === SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'} 
                size={20} 
                color="#fff" 
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </AnimatedBlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: width > 400 ? 400 : '100%',
    backgroundColor: '#0f0b1f',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3b2c6b',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#8b5cf6',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 24,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  iconGradient: {
    flex: 1,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 24,
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: '#a78bfa',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b2c6b',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#0ea5e9',
  },
  button: {
    width: '100%',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  buttonText: {
    fontFamily: 'Outfit_700Bold',
    color: '#ffffff',
    fontSize: 16,
  },
});
