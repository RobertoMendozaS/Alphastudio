import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
        {icon ? (
          <Ionicons name={icon} size={48} color="#334155" />
        ) : (
          <View style={styles.emptyIcon} />
        )}
        {title && <Text style={styles.emptyTitle}>{title}</Text>}
        {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
        {actionLabel && onAction && (
          <TouchableOpacity style={styles.emptyAction} onPress={onAction} activeOpacity={0.8}>
            <Text style={styles.emptyActionText}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
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
  emptyBody: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1e293b' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#e2e8f0', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, paddingHorizontal: 40 },
  emptyAction: { marginTop: 8, backgroundColor: '#06b6d4', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyActionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
