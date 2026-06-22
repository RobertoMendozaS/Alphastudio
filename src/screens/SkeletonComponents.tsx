import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

export function SkeletonHistoryCard() {
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity: pulse }]}>
      <View style={styles.row}>
        <View style={styles.dot} />
        <View style={styles.body}>
          <View style={styles.line} />
          <View style={[styles.line, { width: '60%' }]} />
        </View>
      </View>
    </Animated.View>
  );
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: any) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyBody}>
        <View style={styles.emptyIcon} />
        <View style={[styles.line, { width: 120, marginBottom: 8 }]} />
        <View style={[styles.line, { width: '70%', height: 10 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0f172a', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1e293b' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1e293b' },
  body: { flex: 1, gap: 8 },
  line: { height: 12, borderRadius: 6, backgroundColor: '#1e293b', width: '80%' },
  empty: { flex: 1 },
  emptyBody: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1e293b' },
});
