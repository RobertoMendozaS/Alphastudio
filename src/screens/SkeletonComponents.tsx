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
    <Animated.View style={[styles.skeletonCard, { opacity: pulse }]}>
      <View style={styles.skeletonIcon} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={styles.skeletonLineShort} />
        <View style={styles.skeletonLineLong} />
      </View>
    </Animated.View>
  );
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: any) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        {icon ? (
          <Ionicons name={icon} size={32} color="#a78bfa" />
        ) : (
          <Ionicons name="folder-open-outline" size={32} color="#a78bfa" />
        )}
      </View>
      {title && <Text style={styles.emptyTitle}>{title}</Text>}
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.emptyBtn} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.emptyBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: '#0f0b1f',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3b2c6b',
    alignItems: 'center',
    gap: 12,
  },
  skeletonIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#3b2c6b',
  },
  skeletonLineShort: {
    height: 12,
    width: '60%',
    backgroundColor: '#3b2c6b',
    borderRadius: 6,
    marginBottom: 6,
  },
  skeletonLineLong: {
    height: 10,
    width: '90%',
    backgroundColor: '#3b2c6b',
    borderRadius: 5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#17122b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3b2c6b',
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Outfit_400Regular', fontSize: 13,
    color: '#a78bfa',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
});
