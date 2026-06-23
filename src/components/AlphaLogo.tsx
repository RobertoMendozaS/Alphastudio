import React, { useRef, useEffect } from 'react';
import { Animated, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AlphaLogo() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <LinearGradient
        colors={['#06b6d4', '#6366f1']}
        style={{
          width: 82,
          height: 82,
          borderRadius: 41,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 18,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 34, fontWeight: '900' }}>α</Text>
      </LinearGradient>
    </Animated.View>
  );
}
