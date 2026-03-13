import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground } from 'react-native';
import { Image } from 'expo-image';
import { Waves, Music, MoonStar, Pause, Play, Square } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { binauralBeats, soundscapes } from '@/mocks/soundLibrary';
import { useAudio } from '@/providers/AudioProvider';
import SeekBar from '@/components/SeekBar';
import { usePurchases } from '@/providers/PurchaseProvider';
import TrackCard from '@/components/TrackCard';
import { useTheme } from '@/providers/ThemeProvider';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type Tab = 'binaural' | 'soundscape';

export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('binaural');
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );
  const { mode, currentTrack, isPlaying, currentTime, duration, playAmbient, togglePlayPause, stop, seekTo } = useAudio();
  const { isTrackUnlocked, purchaseTrack } = usePurchases();
  const { colors, isDark } = useTheme();

  const tracks = useMemo(
    () => (activeTab === 'binaural' ? binauralBeats : soundscapes),
    [activeTab],
  );

  const handlePlay = useCallback(
    (track: typeof tracks[0]) => {
      console.log('[Library] Playing track:', track.title);
      playAmbient(track);
    },
    [playAmbient],
  );

  const handlePurchase = useCallback(
    (track: typeof tracks[0]) => {
      purchaseTrack(track.id, track.title, track.price ?? '$0.99');
    },
    [purchaseTrack],
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {isDark ? (
        <>
          <ImageBackground
            source={require('@/assets/images/sky-background.jpg')}
            style={{ position: 'absolute', top: -200, left: 0, right: 0, bottom: 0 }}
            resizeMode="cover"
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlayBg }]} />
        </>
      ) : (
        <>
          <ImageBackground
            source={require('@/assets/images/water-ripples-light.png')}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(232, 244, 250, 0.55)' }]} />
        </>
      )}
      <ScrollView ref={scrollRef} contentContainerStyle={[styles.content, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Your Library</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            {binauralBeats.length} binaural beats · {soundscapes.length} soundscapes
          </Text>
        </View>

        <View style={[styles.tabRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            onPress={() => setActiveTab('binaural')}
            style={[styles.tab, activeTab === 'binaural' && [styles.tabActive, { backgroundColor: colors.accent }]]}
            testID="tab-binaural"
          >
            <Waves size={16} color={activeTab === 'binaural' ? '#FFFFFF' : colors.textMuted} />
            <Text style={[styles.tabText, { color: colors.textMuted }, activeTab === 'binaural' && styles.tabTextActive]}>
              Binaural Beats
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('soundscape')}
            style={[styles.tab, activeTab === 'soundscape' && [styles.tabActive, { backgroundColor: colors.accent }]]}
            testID="tab-soundscape"
          >
            <Music size={16} color={activeTab === 'soundscape' ? '#FFFFFF' : colors.textMuted} />
            <Text style={[styles.tabText, { color: colors.textMuted }, activeTab === 'soundscape' && styles.tabTextActive]}>
              Soundscapes
            </Text>
          </Pressable>
        </View>

        {mode === 'ambient' && currentTrack && (
          <View style={styles.nowPlaying}>
            <LinearGradient
              colors={[currentTrack.gradient[0], currentTrack.gradient[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nowPlayingGradient}
            >
              <View style={styles.nowPlayingRow}>
                {currentTrack.artworkUrl ? (
                  <Image source={{ uri: currentTrack.artworkUrl }} style={styles.nowPlayingArtwork} contentFit="cover" />
                ) : (
                  <View style={[styles.nowPlayingArtwork, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
                )}
                <View style={styles.nowPlayingInfo}>
                  <Text style={styles.nowPlayingLabel}>NOW PLAYING</Text>
                  <Text style={styles.nowPlayingTitle} numberOfLines={1}>{currentTrack.title}</Text>
                  <Text style={styles.nowPlayingSub} numberOfLines={1}>{currentTrack.subtitle} · Shuffle</Text>
                  <Text style={styles.nowPlayingTime}>{formatTime(currentTime)}</Text>
                </View>
              </View>
              <SeekBar
                progress={duration > 0 ? currentTime / duration : 0}
                duration={duration}
                onSeek={(seconds) => void seekTo(seconds)}
                trackColor="rgba(255,255,255,0.15)"
                fillColor="rgba(255,255,255,0.7)"
                thumbColor="#FFFFFF"
                height={3}
              />
              <View style={styles.nowPlayingControls}>
                <Pressable onPress={togglePlayPause} style={styles.npControlBtn}>
                  {isPlaying ? (
                    <Pause size={22} color="#FFFFFF" />
                  ) : (
                    <Play size={22} color="#FFFFFF" fill="#FFFFFF" />
                  )}
                </Pressable>
                <Pressable onPress={stop} style={[styles.npStopBtn, { backgroundColor: colors.dangerSoft }]}>
                  <Square size={12} color={colors.danger} fill={colors.danger} />
                  <Text style={[styles.npStopText, { color: colors.danger }]}>Stop</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        )}

        {activeTab === 'binaural' && (
          <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
            Binaural beats guide your brainwaves into deeper states. Tap any to preview.
          </Text>
        )}
        {activeTab === 'soundscape' && (
          <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
            Immersive soundscapes for meditation, sleep, or ambient listening.
          </Text>
        )}

        <View style={styles.trackList}>
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              isUnlocked={isTrackUnlocked(track.id, track.isFree)}
              onPlay={() => handlePlay(track)}
              onPurchase={() => handlePurchase(track)}
              compact={false}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },

  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
  },
  heroSub: {
    fontSize: 14,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tabActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  sectionHint: {
    fontSize: 13,
    lineHeight: 19,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
  },
  trackList: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
  },
  nowPlaying: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  },
  nowPlayingGradient: {
    padding: 16,
    gap: 12,
  },
  nowPlayingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nowPlayingArtwork: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  nowPlayingInfo: {
    flex: 1,
    gap: 2,
  },
  nowPlayingLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  nowPlayingTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  nowPlayingSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
  },
  nowPlayingTime: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
  nowPlayingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  npControlBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  npStopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  npStopText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
