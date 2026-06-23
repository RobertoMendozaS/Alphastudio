import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { signIn, signUp, signInWithGoogle } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import AlphaLogo from '../components/AlphaLogo';

type LoginScreenProps = {
  onDemoLogin?: () => void;
};

export default function LoginScreen({ onDemoLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const loginDemo = useAuthStore((state) => state.loginDemo);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
    setLoading(false);
  };

  const handleDemo = () => {
    if (onDemoLogin) {
      onDemoLogin();
    } else {
      loginDemo();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#020617', '#0f172a', '#0c1a2e']}
        style={styles.background}
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
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={{ alignItems: 'center' }}>
            <AlphaLogo />
            <Text style={styles.title}>ALPHA</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta gratuita'}
            </Text>
          </View>

          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={18} color="#475569" />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#334155"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
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

          <TouchableOpacity
            style={styles.btnWrap}
            onPress={handleAuth}
            activeOpacity={0.85}
            disabled={loading}
          >
            <LinearGradient colors={['#06b6d4', '#6366f1']} style={styles.btn}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.btnText}>
                    {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                  </Text>
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

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
            <Text style={styles.switchText}>
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleAuth} disabled={loading}>
            <Ionicons name="logo-google" size={20} color="#0f172a" style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.demoBtn} onPress={handleDemo} disabled={loading}>
            <Ionicons name="construct-outline" size={20} color="#38bdf8" style={styles.googleIcon} />
            <Text style={styles.demoBtnText}>Entrar en modo demo</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>Alpha AI • Learning System</Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFill,
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
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    color: '#64748b',
    fontSize: 13,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1e293b',
  },
  dividerText: {
    color: '#475569',
    marginHorizontal: 12,
    fontSize: 13,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
    paddingVertical: 14,
    borderRadius: 12,
  },
  googleIcon: {
    marginRight: 8,
  },
  googleButtonText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 13.5,
  },
  demoBtn: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38bdf8',
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  demoBtnText: {
    color: '#38bdf8',
    fontWeight: '700',
    fontSize: 13,
  },
  footer: {
    textAlign: 'center',
    marginTop: 18,
    color: '#475569',
    fontSize: 11,
  },
});
