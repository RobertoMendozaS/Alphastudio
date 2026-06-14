import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated, StatusBar, FlatList,
  Easing, Dimensions, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Defs, LinearGradient as SvgGrad, Stop,
  Circle, Path,
} from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// ─────────────────────────────────────────────
// Logo animado: Símbolo Alfa (α)
// ─────────────────────────────────────────────
const LOGO_SIZE = 180;
// Ruta ajustada para la forma de alfa minúscula
const ALPHA_PATH = "M 35,65 C 35,35 60,35 60,65 C 60,85 30,85 30,65 C 30,40 70,40 75,70";
const TOTAL_LEN = 250;

function AlphaLogoAnimated() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = () => {
      anim.setValue(0);
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(anim, { toValue: 1, duration: 2000, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: false }),
        Animated.delay(1000),
        Animated.timing(anim, { toValue: 2, duration: 1000, easing: Easing.in(Easing.cubic), useNativeDriver: false }),
      ]).start(loop);
    };
    loop();
  }, []);

  const dashOffset = anim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [TOTAL_LEN, 0, -TOTAL_LEN],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={LOGO_SIZE} height={LOGO_SIZE} viewBox="0 0 100 100">
        <Defs>
          <SvgGrad id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#06b6d4" />
            <Stop offset="50%" stopColor="#818cf8" />
            <Stop offset="100%" stopColor="#06b6d4" />
          </SvgGrad>
        </Defs>
        <Circle cx="50" cy="50" r="47" fill="#0c1a2e" stroke="#1e293b" strokeWidth="1" />
        <AnimatedPath
          d={ALPHA_PATH}
          fill="none"
          stroke="url(#lg1)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${TOTAL_LEN}`}
          strokeDashoffset={dashOffset}
        />
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────
// Pantalla Principal
// ─────────────────────────────────────────────
function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.chip} activeOpacity={0.7}>
      <Text style={styles.chipText}>{label}</Text>
    </TouchableOpacity>
  );
}

const RECENT = ['TypeScript', 'APIs REST', 'Node.js', 'Figma'];
const SUGGEST = ['React Native', 'Machine Learning', 'UI/UX', 'Python'];

export default function HomeScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, delay: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, delay: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#020617', '#0f172a', '#0c1a2e']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Ionicons name="menu-outline" size={26} color="#475569" />
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeTxt}>Alpha AI</Text>
        </View>
        <TouchableOpacity>
          <LinearGradient colors={['#06b6d4', '#818cf8']} style={styles.avatar}>
            <Ionicons name="person" size={17} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.layout}>
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>Recientes</Text>
          <FlatList
            data={RECENT}
            keyExtractor={i => i}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.histItem}>
                <View style={styles.histDot} />
                <Text style={styles.histTxt} numberOfLines={1}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <View style={styles.divider} />
          <TouchableOpacity style={styles.newBtn}>
            <Ionicons name="add-circle-outline" size={18} color="#06b6d4" />
            <Text style={styles.newTxt}>Nuevo</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.center, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoSection}>
            <AlphaLogoAnimated />
            <Text style={styles.logoName}>ALPHA</Text>
            <Text style={styles.logoSub}>Tu tutor de aprendizaje con IA</Text>
          </View>

          <View style={[styles.inputBox, focused && styles.inputBoxFocused]}>
            <Ionicons name="search-outline" size={17} color={focused ? '#06b6d4' : '#475569'} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="¿Qué quieres aprender hoy?"
              placeholderTextColor="#334155"
              value={query}
              onChangeText={setQuery}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </View>

          <View style={styles.chips}>
            {SUGGEST.map(s => <Chip key={s} label={s} onPress={() => setQuery(s)} />)}
          </View>

          <TouchableOpacity style={styles.ctaWrap} activeOpacity={0.86}>
            <LinearGradient colors={['#06b6d4', '#6366f1']} style={styles.cta}>
              <Text style={styles.ctaTxt}>Generar Ruta de Aprendizaje</Text>
              <Ionicons name="sparkles" size={15} color="#fff" style={{ marginLeft: 7 }} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 32, paddingBottom: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  badgeTxt: { color: '#94a3b8', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  layout: { flex: 1, flexDirection: 'row', paddingHorizontal: 14 },
  sidebar: { width: 76, paddingTop: 8, paddingRight: 12, borderRightWidth: 1, borderColor: '#1e293b' },
  sidebarTitle: { color: '#334155', fontSize: 8.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 14 },
  histItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 5 },
  histDot: { width: 3.5, height: 3.5, borderRadius: 2, backgroundColor: '#334155' },
  histTxt: { color: '#475569', fontSize: 10.5, flex: 1 },
  divider: { height: 1, backgroundColor: '#1e293b', marginVertical: 12 },
  newBtn: { alignItems: 'center', gap: 4 },
  newTxt: { color: '#06b6d4', fontSize: 9.5, fontWeight: '600' },
  center: { flex: 1, paddingLeft: 18, justifyContent: 'center' },
  logoSection: { alignItems: 'center', marginBottom: 28 },
  logoName: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 10, marginTop: 10 },
  logoSub: { color: '#475569', fontSize: 10.5, marginTop: 4, letterSpacing: 0.3 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', paddingHorizontal: 14, paddingVertical: 13, marginBottom: 11 },
  inputBoxFocused: { borderColor: '#06b6d4', backgroundColor: '#0c1a2e' },
  input: { flex: 1, color: '#e2e8f0', fontSize: 13, padding: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 18 },
  chip: { backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5, borderWidth: 1, borderColor: '#334155' },
  chipText: { color: '#64748b', fontSize: 10.5, fontWeight: '500' },
  ctaWrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 24 },
  cta: { paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  ctaTxt: { color: '#fff', fontWeight: '700', fontSize: 13.5, letterSpacing: 0.2 },
});