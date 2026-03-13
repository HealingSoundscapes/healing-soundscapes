import React, { useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground } from 'react-native';
import { Image } from 'expo-image';
import {
  Pause,
  Play,
  Square,
  Lock,
  Volume2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { soundscapes } from '@/mocks/soundLibrary';
import { useAudio } from '@/providers/AudioProvider';
import SeekBar from '@/components/SeekBar';
import { usePurchases } from '@/providers/PurchaseProvider';
import { AudioTrack } from '@/types/audio';
import { useTheme } from '@/providers/ThemeProvider';
import { ThemeColors } from '@/constants/colors';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function AmbientTrackRow({ track, isActive, isUnlocked, onPlay, onPurchase, colors }: {
  track: AudioTrack;
  isActive: boolean;
  isUnlocked: boolean;
  onPlay: () => void;
  onPurchase: () => void;
  colors: ThemeColors;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [isActive, glowAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start()}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (isUnlocked) onPlay();
          else onPurchase();
        }}
      >
        {isActive ? (
          <LinearGradient
            colors={[track.gradient[0], track.gradient[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.ambientRow, styles.ambientRowActive]}
          >
            {track.artworkUrl ? (
              <Animated.View style={{ opacity: Animated.add(0.7, Animated.multiply(glowAnim, 0.3)) }}>
                <Image source={{ uri: track.artworkUrl }} style={styles.ambientArtwork} contentFit="cover" />
              </Animated.View>
            ) : (
              <View style={[styles.ambientIcon, styles.ambientIconActive]}>
                <Animated.View style={{ opacity: Animated.add(0.5, Animated.multiply(glowAnim, 0.5)) }}>
                  <Volume2 size={20} color="#FFFFFF" />
                </Animated.View>
              </View>
            )}
            <View style={styles.ambientInfo}>
              <Text style={[styles.ambientTitle, styles.ambientTitleActive]}>{track.title}</Text>
              <Text style={styles.ambientSubActive}>{track.subtitle}</Text>
            </View>
            <View style={styles.ambientRight}>
              <View style={styles.playingBadgeActive}>
                <Text style={styles.playingTextActive}>Playing</Text>
              </View>
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.ambientRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            {track.artworkUrl ? (
              <Image source={{ uri: track.artworkUrl }} style={styles.ambientArtwork} contentFit="cover" />
            ) : (
              <View style={[styles.ambientIcon, { backgroundColor: colors.surface }]}>
                {isUnlocked ? (
                  <Volume2 size={18} color={colors.textSecondary} />
                ) : (
                  <Lock size={16} color={colors.gold} />
                )}
              </View>
            )}
            <View style={styles.ambientInfo}>
              <Text style={[styles.ambientTitle, { color: colors.text }]}>{track.title}</Text>
              <Text style={[styles.ambientSub, { color: colors.textSecondary }]}>{track.subtitle}</Text>
            </View>
            <View style={styles.ambientRight}>
              {!isUnlocked ? (
                <View style={[styles.priceBadge, { backgroundColor: colors.goldSoft }]}>
                  <Text style={[styles.priceText, { color: colors.gold }]}>{track.price}</Text>
                </View>
              ) : (
                <Play size={20} color={colors.accent} fill={colors.accent} />
              )}
            </View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function AmbientScreen() {
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

  const isAmbientMode = mode === 'ambient';
  const activeTrackId = isAmbientMode ? currentTrack?.id : null;

  const handlePlay = useCallback(
    (track: AudioTrack) => {
      if (activeTrackId === track.id) {
        togglePlayPause();
      } else {
        playAmbient(track);
      }
    },
    [activeTrackId, playAmbient, togglePlayPause],
  );

  const handlePurchase = useCallback(
    (track: AudioTrack) => {
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Ambient Mode</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Choose a soundscape to start. All available soundscapes play randomly, one after the other.
          </Text>
        </View>

        {isAmbientMode && currentTrack && (
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
                <Pressable
                  onPress={togglePlayPause}
                  style={styles.npControlBtn}
                >
                  {isPlaying ? (
                    <Pause size={24} color="#FFFFFF" />
                  ) : (
                    <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
                  )}
                </Pressable>
                <Pressable onPress={stop} style={[styles.npStopBtn, { backgroundColor: colors.dangerSoft }]}>
                  <Square size={14} color={colors.danger} fill={colors.danger} />
                  <Text style={[styles.npStopText, { color: colors.danger }]}>Stop</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        )}

        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: colors.text }]}>Available Soundscapes</Text>
        </View>

        <View style={styles.trackList}>
          {soundscapes.map((track) => (
            <AmbientTrackRow
              key={track.id}
              track={track}
              isActive={activeTrackId === track.id}
              isUnlocked={isTrackUnlocked(track.id, track.isFree)}
              onPlay={() => handlePlay(track)}
              onPurchase={() => handlePurchase(track)}
              colors={colors}
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
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 14,
    lineHeight: 20,
  },
  nowPlaying: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 5,
  },
  nowPlayingGradient: {
    padding: 18,
    gap: 14,
  },
  nowPlayingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  nowPlayingArtwork: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  nowPlayingInfo: {
    flex: 1,
    gap: 3,
  },
  nowPlayingLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  nowPlayingTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  nowPlayingTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  nowPlayingSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
  },
  nowPlayingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  npControlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  npStopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  npStopText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listHeader: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  trackList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  ambientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  ambientRowActive: {
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 3,
  },
  ambientArtwork: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  ambientIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientIconActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  ambientInfo: {
    flex: 1,
    gap: 2,
  },
  ambientTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  ambientTitleActive: {
    color: '#FFFFFF',
  },
  ambientSub: {
    fontSize: 12,
  },
  ambientSubActive: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
  },
  ambientRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  playingBadgeActive: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  playingTextActive: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
