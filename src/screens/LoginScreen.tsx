import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Animated, Easing,
  KeyboardAvoidingView, Platform, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { signIn } from '../services/authService';

// ─────────────────────────────
// Logo Alpha animado
// ─────────────────────────────
function AlphaLogo() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 1800,
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true
        }),
      ])
    ).start();
  }, []);

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
          marginBottom: 18
        }}
      >
        <Text style={{ color: '#fff', fontSize: 34, fontWeight: '900' }}>α</Text>
      </LinearGradient>
    </Animated.View>
  );
}

// ─────────────────────────────
// Screen
// ─────────────────────────────
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
    ]).start();
  }, []);

  const handleAuth = async () => {
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Fondo Alpha */}
      <LinearGradient
        colors={['#020617', '#0f172a', '#0c1a2e']}
       
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.wrapper}
      >
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Logo */}
          <View style={{ alignItems: 'center' }}>
            <AlphaLogo />
            <Text style={styles.title}>ALPHA</Text>
            <Text style={styles.subtitle}>
              Inicia sesión para continuar
            </Text>
          </View>

          {/* Inputs */}
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={18} color="#475569" />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#334155"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
          </View>

          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={18} color="#475569" />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#334155"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />
          </View>

          {/* Botón */}
          <TouchableOpacity
            style={styles.btnWrap}
            onPress={handleAuth}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#06b6d4', '#6366f1']}
              style={styles.btn}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.btnText}>Iniciar sesión</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color="#fff"
                    style={{ marginLeft: 8 }}
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footer}>
            Alpha AI • Learning System
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────
// Styles Alpha
// ─────────────────────────────
const styles = {
  container: {
    flex: 1,
  },


  

  wrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },

  card: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 18,
    padding: 22,
  },

  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 6,
    marginTop: 8,
  },

  subtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 6,
    marginBottom: 20,
  },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c1a2e',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    color: '#e2e8f0',
    fontSize: 13,
  },

  btnWrap: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },

  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13.5,
  },

  footer: {
    textAlign: 'center',
    marginTop: 18,
    color: '#475569',
    fontSize: 11,
  },
} as const;