import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Pause, Play, Square } from 'lucide-react-native';
import { useAudio } from '@/providers/AudioProvider';
import { useTheme } from '@/providers/ThemeProvider';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default React.memo(function PlayerBar() {
  const { mode, currentTrack, isPlaying, currentTime, duration, sessionPhase, togglePlayPause, stop } = useAudio();
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isPlaying) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ]),
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlaying, pulseAnim]);

  if (mode === 'idle' || !currentTrack) return null;

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.playerBarBg, borderTopColor: colors.playerBarBorder }]}>
      <View style={[styles.progressBar, { width: `${progress * 100}%`, backgroundColor: colors.accent } as any]} />
      <View style={styles.content}>
        <Animated.View style={{ opacity: pulseAnim }}>
          {currentTrack.artworkUrl ? (
            <Image source={{ uri: currentTrack.artworkUrl }} style={styles.artwork} contentFit="cover" />
          ) : (
            <View style={[styles.artwork, { backgroundColor: currentTrack.gradient[0] }]} />
          )}
        </Animated.View>
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {mode === 'session' ? `Session · ${sessionPhase === 'binaural' ? 'Binaural Phase' : 'Soundscape Phase'}` : 'Ambient'}
            {' · '}{formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </View>
        <View style={styles.controls}>
          <Pressable onPress={togglePlayPause} style={styles.controlBtn} hitSlop={12}>
            {isPlaying ? <Pause size={20} color={colors.text} /> : <Play size={20} color={colors.text} fill={colors.text} />}
          </Pressable>
          <Pressable onPress={stop} style={styles.controlBtn} hitSlop={12}>
            <Square size={16} color={colors.textMuted} fill={colors.textMuted} />
          </Pressable>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  progressBar: {
    height: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  artwork: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    fontSize: 11,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  controlBtn: {
    padding: 4,
  },
});
