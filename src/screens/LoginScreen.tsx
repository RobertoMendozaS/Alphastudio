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
        colors={['#09090b', '#0f0b1f', '#17122b']}
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
            <Ionicons name="mail-outline" size={18} color="#6b7280" />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#4c3a85"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={18} color="#6b7280" />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#4c3a85"
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
            <LinearGradient colors={['#8b5cf6', '#0ea5e9']} style={styles.btn}>
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
            <Ionicons name="logo-google" size={20} color="#0f0b1f" style={styles.googleIcon} />
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
    backgroundColor: '#0f0b1f',
    borderWidth: 1,
    borderColor: '#3b2c6b',
    borderRadius: 18,
    padding: 22,
  },
  title: {
    color: '#fff',
    fontFamily: 'Outfit_400Regular', fontSize: 22,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 6,
    marginTop: 8,
  },
  subtitle: {
    color: '#94a3b8',
    fontFamily: 'Outfit_400Regular', fontSize: 12,
    marginTop: 6,
    marginBottom: 20,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17122b',
    borderWidth: 1,
    borderColor: '#3b2c6b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: '#f8fafc',
    fontFamily: 'Outfit_400Regular', fontSize: 13,
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
    fontFamily: 'Outfit_700Bold', fontSize: 13.5,
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    color: '#94a3b8',
    fontFamily: 'Outfit_400Regular', fontSize: 13,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#3b2c6b',
  },
  dividerText: {
    color: '#6b7280',
    marginHorizontal: 12,
    fontFamily: 'Outfit_400Regular', fontSize: 13,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 14,
    borderRadius: 12,
  },
  googleIcon: {
    marginRight: 8,
  },
  googleButtonText: {
    color: '#0f0b1f',
    fontFamily: 'Outfit_700Bold', fontSize: 13.5,
  },
  demoBtn: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38bdf8',
    backgroundColor: '#3b2c6b',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  demoBtnText: {
    color: '#38bdf8',
    fontFamily: 'Outfit_700Bold', fontSize: 13,
  },
  footer: {
    textAlign: 'center',
    marginTop: 18,
    color: '#6b7280',
    fontFamily: 'Outfit_400Regular', fontSize: 11,
  },
});
