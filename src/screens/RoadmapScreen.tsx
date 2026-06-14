import React, { useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Linking, Share,
  Animated, Easing, StatusBar, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { RoadmapNode, Resource } from '../types/roadmap';

type Props = NativeStackScreenProps<RootStackParamList, 'Roadmap'>;

export default function RoadmapScreen({ route }: Props) {
  const { roadmap } = route.params;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const openLink = (url: string) => {
    Linking.openURL(url).catch(console.error);
  };

  const handleShare = async () => {
    const message =
      `🚀 ${roadmap.title}\n\n` +
      `${roadmap.description}\n\n` +
      roadmap.nodes
        .map((n: RoadmapNode, i: number) => `${i + 1}. ${n.data.label}`)
        .join('\n') +
      `\n\nGenerado con Alpha AI`;

    await Share.share({
      message,
      title: roadmap.title,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background Alpha */}
      <LinearGradient
        colors={['#020617', '#0f172a', '#0c1a2e']}
        style={StyleSheet.absoluteFill}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <Ionicons
          name="arrow-back"
          size={24}
          color="#475569"
        />

        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeTxt}>Roadmap</Text>
        </View>

        <TouchableOpacity
          onPress={handleShare}
          style={styles.shareBtn}
        >
          <Ionicons name="share-social-outline" size={18} color="#06b6d4" />
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.title}>{roadmap.title}</Text>
        <Text style={styles.desc}>{roadmap.description}</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.timeline}>
            <View style={styles.line} />

            {roadmap.nodes.map((node: RoadmapNode, index: number) => (
              <View key={node.id} style={styles.nodeRow}>
                {/* DOT */}
                <View style={styles.dotWrap}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: node.data.isCompleted
                          ? '#22c55e'
                          : '#06b6d4',
                      },
                    ]}
                  />
                  <Text style={styles.step}>{index + 1}</Text>
                </View>

                {/* CARD */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>
                    {node.data.label}
                  </Text>

                  <Text style={styles.cardDesc}>
                    {node.data.description}
                  </Text>

                  {/* RESOURCES */}
                  <View style={styles.resources}>
                    {node.data.resources.map((res: Resource, i: number) => (
                      <TouchableOpacity
                        key={res.id ?? `r-${i}`}
                        onPress={() => openLink(res.url)}
                        style={styles.resource}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="link-outline"
                          size={14}
                          color="#06b6d4"
                        />
                        <Text style={styles.resourceText} numberOfLines={1}>
                          {res.title}
                        </Text>
                        <Ionicons
                          name="open-outline"
                          size={14}
                          color="#475569"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────
// STYLE ALPHA
// ─────────────────────────────
const styles = {
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingBottom: 10,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
  },

  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#06b6d4',
  },

  badgeTxt: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },

  shareBtn: {
    padding: 8,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },

  desc: {
    color: '#64748b',
    fontSize: 12.5,
    marginBottom: 18,
  },

  timeline: {
    position: 'relative',
    paddingLeft: 6,
    paddingBottom: 40,
  },

  line: {
    position: 'absolute',
    left: 14,
    top: 10,
    bottom: 10,
    width: 2,
    backgroundColor: '#1e293b',
  },

  nodeRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },

  dotWrap: {
    width: 30,
    alignItems: 'center',
    marginRight: 10,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  step: {
    fontSize: 10,
    color: '#475569',
    marginTop: 4,
  },

  card: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
  },

  cardTitle: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },

  cardDesc: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 10,
  },

  resources: {
    gap: 6,
  },

  resource: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c1a2e',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 8,
  },

  resourceText: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 12,
  },
} as const;
