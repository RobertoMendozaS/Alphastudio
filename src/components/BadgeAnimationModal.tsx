import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, Animated, Easing, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import type { DynamicBadge } from '../services/aiService';

interface Props {
  visible: boolean;
  badge: DynamicBadge | null;
  onClose: () => void;
}

export default function BadgeAnimationModal({ visible, badge, onClose }: Props) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && badge) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(spinAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0);
      spinAnim.setValue(0);
    }
  }, [visible, badge]);

  if (!visible || !badge) return null;

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <AnimatedBlurView intensity={40} tint="dark" style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={styles.card}>
          <Text style={styles.title}>¡Felicidades por tu insignia!</Text>
          <Text style={styles.subtitle}>Has dominado el tema de {badge.topic}</Text>
          
          <Animated.View style={[styles.badgeContainer, { transform: [{ scale: scaleAnim }, { rotateY: spin }] }]}>
            <View style={[styles.badgeIconWrap, { backgroundColor: badge.color + '20' }]}>
              <Ionicons name={badge.icon as any} size={64} color={badge.color} />
            </View>
          </Animated.View>
          
          <Text style={[styles.badgeName, { color: badge.color }]}>{badge.name}</Text>
          <Text style={styles.badgeDesc}>{badge.desc}</Text>

          <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </AnimatedBlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#0f0b1f',
    borderWidth: 1,
    borderColor: '#3b2c6b',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
  },
  title: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#a78bfa',
    textAlign: 'center',
    marginBottom: 32,
  },
  badgeContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#17122b',
    borderWidth: 2,
    borderColor: '#3b2c6b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 5,
  },
  badgeIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeName: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeDesc: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#ffffff',
  },
});
