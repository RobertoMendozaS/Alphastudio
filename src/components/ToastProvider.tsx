import React, { createContext, useContext, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Haptic feedback
    if (Platform.OS !== 'web') {
      if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const id = Math.random().toString();
    setToast({ id, message, type });

    // Entrance
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: Platform.OS === 'ios' ? 60 : 40,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Exit after 3.5s
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 350,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToast((current) => {
          if (current?.id === id) return null;
          return current;
        });
      });
    }, 3500);
  };

  const getIconName = () => {
    if (toast?.type === 'success') return 'checkmark-circle';
    if (toast?.type === 'error') return 'close-circle';
    return 'information-circle';
  };

  const getIconColor = () => {
    if (toast?.type === 'success') return '#10b981';
    if (toast?.type === 'error') return '#ef4444';
    return '#8b5cf6';
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim,
            },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={['#17122b', '#0f0b1f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.toastCard}
          >
            <View style={[styles.iconBox, { backgroundColor: `${getIconColor()}15` }]}>
              <Ionicons name={getIconName()} size={24} color={getIconColor()} />
            </View>
            <Text style={styles.message}>{toast.message}</Text>
          </LinearGradient>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingRight: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3b2c6b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    color: '#f8fafc',
    fontFamily: 'Outfit_400Regular', fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    flexShrink: 1,
  },
});
