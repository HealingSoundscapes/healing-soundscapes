import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Play, Lock, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { AudioTrack } from '@/types/audio';
import { useTheme } from '@/providers/ThemeProvider';

interface TrackCardProps {
  track: AudioTrack;
  isUnlocked: boolean;
  onPlay: () => void;
  onPurchase?: () => void;
  compact?: boolean;
}

export default React.memo(function TrackCard({ track, isUnlocked, onPlay, onPurchase, compact }: TrackCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { colors } = useTheme();

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  };

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isUnlocked) {
      onPlay();
    } else if (onPurchase) {
      onPurchase();
    }
  };

  if (compact) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}>
          <View style={[styles.compactCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            {track.artworkUrl ? (
              <Image source={{ uri: track.artworkUrl }} style={styles.compactArtwork} contentFit="cover" />
            ) : (
              <View style={[styles.compactArtworkPlaceholder, { backgroundColor: track.gradient[0] }]} />
            )}
            <View style={styles.compactInfo}>
              <Text style={[styles.compactTitle, { color: colors.text }]} numberOfLines={1}>{track.title}</Text>
              <Text style={[styles.compactSub, { color: colors.textSecondary }]} numberOfLines={1}>{track.subtitle}</Text>
            </View>
            <View style={styles.compactRight}>
              {track.brainwaveState && (
                <Text style={[styles.compactBrain, { color: colors.accent }]} numberOfLines={1}>{track.brainwaveState}</Text>
              )}
              <Text style={[styles.compactDuration, { color: colors.textMuted }]}>{track.durationLabel}</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}>
        <View style={[styles.cardOuter, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.cardRow}>
            {track.artworkUrl ? (
              <Image source={{ uri: track.artworkUrl }} style={styles.artworkSquare} contentFit="cover" />
            ) : (
              <View style={[styles.artworkSquare, { backgroundColor: track.gradient[0] }]} />
            )}

            <View style={styles.cardContent}>
              <View style={styles.cardContentTop}>
                <View style={[styles.categoryChip, { backgroundColor: colors.accentGlow }]}>
                  <Text style={[styles.categoryChipText, { color: colors.accent }]}>
                    {track.category === 'binaural' ? 'Binaural Beat' : 'Soundscape'}
                  </Text>
                </View>
                <View style={styles.durationChip}>
                  <Clock size={10} color={colors.textMuted} />
                  <Text style={[styles.durationChipText, { color: colors.textMuted }]}>{track.durationLabel}</Text>
                </View>
              </View>

              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{track.title}</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={2}>{track.subtitle}</Text>

              {track.frequencyRange && (
                <Text style={[styles.freqText, { color: colors.accent }]}>{track.frequencyRange} · {track.brainwaveState}</Text>
              )}

              <View style={styles.cardActions}>
                {isUnlocked ? (
                  <View style={[styles.playBtn, { backgroundColor: colors.accent }]}>
                    <Play size={13} color="#FFFFFF" fill="#FFFFFF" />
                    <Text style={styles.playText}>Play</Text>
                  </View>
                ) : (
                  <View style={[styles.lockRow, { backgroundColor: colors.goldSoft }]}>
                    <Lock size={12} color={colors.gold} />
                    <Text style={[styles.lockText, { color: colors.gold }]}>{track.price} · Unlock</Text>
                  </View>
                )}
                {!track.isFree && !isUnlocked && (
                  <Text style={[styles.previewHint, { color: colors.textMuted }]}>Preview available</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  cardOuter: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artworkSquare: {
    width: 100,
    height: 100,
    borderRadius: 14,
    margin: 10,
  },
  cardContent: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 14,
    paddingLeft: 4,
    gap: 4,
    justifyContent: 'center',
  },
  cardContentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  durationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  durationChipText: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    lineHeight: 20,
  },
  cardSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  freqText: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  playText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  lockText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  previewHint: {
    fontSize: 11,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
  },
  compactArtwork: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  compactArtworkPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  compactInfo: {
    flex: 1,
    gap: 2,
  },
  compactTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  compactSub: {
    fontSize: 12,
  },
  compactRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  compactBrain: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  compactDuration: {
    fontSize: 11,
  },
});
