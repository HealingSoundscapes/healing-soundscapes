import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground } from 'react-native';
import { Image } from 'expo-image';
import {
  Waves,
  Music,
  Play,
  ChevronRight,
  ArrowRight,
  Pause,
  Square,
  Sparkles,
  Clock,
  Zap,
  Target,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { binauralBeats, soundscapes, curatedSessions } from '@/mocks/soundLibrary';
import { useAudio } from '@/providers/AudioProvider';
import SeekBar from '@/components/SeekBar';
import { usePurchases } from '@/providers/PurchaseProvider';
import { AudioTrack, SessionConfig, CuratedSession } from '@/types/audio';
import { useTheme } from '@/providers/ThemeProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type SessionStep = 'setup' | 'active';
type SessionTab = 'curated' | 'custom';

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#4A9EE5',
  intermediate: '#E0A85C',
  advanced: '#E06B5A',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function SessionScreen() {
  const [step, setStep] = useState<SessionStep>('setup');
  const [tab, setTab] = useState<SessionTab>('curated');
  const [selectedBeat, setSelectedBeat] = useState<AudioTrack | null>(null);
  const [selectedScape, setSelectedScape] = useState<AudioTrack | null>(null);
  const [selectedCurated, setSelectedCurated] = useState<CuratedSession | null>(null);
  const [binauralMinutes] = useState(10);
  const [scapeMinutes] = useState(20);

  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  const { mode, isPlaying, currentTime, duration, sessionPhase, startSession, transitionToSoundscape, togglePlayPause, stop, sessionConfig, seekTo } = useAudio();
  const { isTrackUnlocked } = usePurchases();
  const { colors, isDark } = useTheme();

  const breathAnim = useRef(new Animated.Value(0.3)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(tabIndicatorAnim, {
      toValue: tab === 'curated' ? 0 : 1,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [tab, tabIndicatorAnim]);

  useEffect(() => {
    if (mode === 'session' && isPlaying) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
          Animated.timing(breathAnim, { toValue: 0.3, duration: 3000, useNativeDriver: true }),
        ]),
      );
      anim.start();
      return () => anim.stop();
    }
    breathAnim.setValue(0.3);
  }, [mode, isPlaying, breathAnim]);

  const availableScapes = useMemo(
    () => soundscapes.filter((s) => isTrackUnlocked(s.id, s.isFree)),
    [isTrackUnlocked],
  );

  const resolvedCurated = useMemo(() => {
    if (!selectedCurated) return null;
    const beat = binauralBeats.find((b) => b.id === selectedCurated.binauralBeatId);
    const scape = soundscapes.find((s) => s.id === selectedCurated.soundscapeId);
    if (!beat || !scape) return null;
    return { beat, scape };
  }, [selectedCurated]);

  const isCuratedAvailable = useMemo(() => {
    if (!selectedCurated || !resolvedCurated) return false;
    return isTrackUnlocked(resolvedCurated.scape.id, resolvedCurated.scape.isFree);
  }, [selectedCurated, resolvedCurated, isTrackUnlocked]);

  const handleStartCurated = useCallback(() => {
    if (!selectedCurated || !resolvedCurated || !isCuratedAvailable) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const config: SessionConfig = {
      binauralBeat: resolvedCurated.beat,
      soundscape: resolvedCurated.scape,
      binauralDurationMinutes: selectedCurated.binauralDurationMinutes,
      soundscapeDurationMinutes: selectedCurated.soundscapeDurationMinutes,
    };
    startSession(config);
    setStep('active');
    console.log('[Session] Started curated:', selectedCurated.title);
  }, [selectedCurated, resolvedCurated, isCuratedAvailable, startSession]);

  const handleStart = useCallback(() => {
    if (!selectedBeat || !selectedScape) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const config: SessionConfig = {
      binauralBeat: selectedBeat,
      soundscape: selectedScape,
      binauralDurationMinutes: binauralMinutes,
      soundscapeDurationMinutes: scapeMinutes,
    };
    startSession(config);
    setStep('active');
    console.log('[Session] Started custom:', config.binauralBeat.title, '→', config.soundscape.title);
  }, [selectedBeat, selectedScape, binauralMinutes, scapeMinutes, startSession]);

  const handleTransition = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    transitionToSoundscape();
  }, [transitionToSoundscape]);

  const handleStop = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    stop();
    setStep('setup');
  }, [stop]);

  const progress = duration > 0 ? currentTime / duration : 0;

  if (step === 'active' && mode === 'session') {
    const activeArtwork = sessionPhase === 'binaural' ? sessionConfig?.binauralBeat.artworkUrl : sessionConfig?.soundscape.artworkUrl;
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <LinearGradient
          colors={sessionPhase === 'binaural' ? colors.sessionGradientBinaural : colors.sessionGradientSoundscape}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.activeContent, { paddingTop: insets.top + 16 }]}>
          <View style={styles.phaseHeader}>
            <Text style={[styles.phaseLabel, { color: colors.accent }]}>
              {sessionPhase === 'binaural' ? 'BINAURAL PHASE' : 'SOUNDSCAPE PHASE'}
            </Text>
            <Text style={[styles.phaseTitle, { color: isDark ? 'rgba(255,255,255,0.9)' : colors.text }]}>
              {sessionPhase === 'binaural' ? sessionConfig?.binauralBeat.title : sessionConfig?.soundscape.title}
            </Text>
          </View>

          <View style={styles.visualCenter}>
            <Animated.View style={[styles.breathCircleOuter, { backgroundColor: colors.accentGlow, borderColor: 'rgba(74, 158, 229, 0.2)', opacity: breathAnim }]}>
              {activeArtwork ? (
                <Image source={{ uri: activeArtwork }} style={styles.breathArtwork} contentFit="cover" />
              ) : (
                <View style={styles.breathCircleInner}>
                  <Text style={[styles.timerText, { color: isDark ? 'rgba(255,255,255,0.85)' : colors.text }]}>{formatTime(currentTime)}</Text>
                  <Text style={[styles.timerSub, { color: isDark ? 'rgba(255,255,255,0.4)' : colors.textMuted }]}>/ {formatTime(duration)}</Text>
                </View>
              )}
            </Animated.View>
            {activeArtwork && (
              <View style={styles.timerOverlay}>
                <Text style={[styles.timerTextDark, { color: isDark ? 'rgba(255,255,255,0.9)' : colors.text }]}>{formatTime(currentTime)}</Text>
                <Text style={[styles.timerSubDark, { color: isDark ? 'rgba(255,255,255,0.45)' : colors.textMuted }]}>/ {formatTime(duration)}</Text>
              </View>
            )}
          </View>

          <View style={styles.progressWrap}>
            <SeekBar
              progress={progress}
              duration={duration}
              onSeek={(seconds) => void seekTo(seconds)}
              trackColor={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,60,120,0.08)'}
              fillColor={colors.accent}
              thumbColor={isDark ? '#FFFFFF' : '#FFFFFF'}
              height={4}
            />
            <View style={styles.progressLabels}>
              <Text style={[styles.progressLabel, { color: isDark ? 'rgba(255,255,255,0.4)' : colors.textMuted }]}>{formatTime(currentTime)}</Text>
              <Text style={[styles.progressLabel, { color: isDark ? 'rgba(255,255,255,0.4)' : colors.textMuted }]}>{formatTime(duration)}</Text>
            </View>
          </View>

          <View style={styles.activeControls}>
            <Pressable onPress={togglePlayPause} style={[styles.mainControl, { backgroundColor: colors.accentGlowStrong, borderColor: 'rgba(74, 158, 229, 0.35)' }]}>
              {isPlaying ? (
                <Pause size={26} color={isDark ? '#FFFFFF' : colors.text} />
              ) : (
                <Play size={26} color={isDark ? '#FFFFFF' : colors.text} fill={isDark ? '#FFFFFF' : colors.text} />
              )}
            </Pressable>
          </View>

          <View style={styles.activeBottomRow}>
            {sessionPhase === 'binaural' && (
              <Pressable onPress={handleTransition} style={[styles.transitionBtn, { backgroundColor: colors.accentGlow, borderColor: 'rgba(74, 158, 229, 0.15)' }]}>
                <Text style={[styles.transitionText, { color: colors.accent }]}>Skip to Soundscape</Text>
                <ArrowRight size={14} color={colors.accent} />
              </Pressable>
            )}
            <Pressable onPress={handleStop} style={[styles.stopBtn, { backgroundColor: colors.dangerSoft }]}>
              <Square size={12} color={colors.danger} fill={colors.danger} />
              <Text style={[styles.stopText, { color: colors.danger }]}>End Session</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const tabTranslateX = tabIndicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (SCREEN_WIDTH - 48) / 2],
  });

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
        <View style={styles.setupHeader}>
          <Text style={[styles.setupTitle, { color: colors.text }]}>Sessions</Text>
          <Text style={[styles.setupSub, { color: colors.textSecondary }]}>
            Choose a curated experience or design your own.
          </Text>
        </View>

        <View style={styles.segmentWrap}>
          <View style={[styles.segmentTrack, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Animated.View
              style={[
                styles.segmentIndicator,
                { backgroundColor: colors.accent, transform: [{ translateX: tabTranslateX }] },
              ]}
            />
            <Pressable
              style={styles.segmentBtn}
              onPress={() => {
                void Haptics.selectionAsync();
                setTab('curated');
              }}
              testID="tab-curated"
            >
              <Sparkles size={14} color={tab === 'curated' ? '#FFFFFF' : colors.textMuted} />
              <Text style={[styles.segmentText, { color: colors.textMuted }, tab === 'curated' && styles.segmentTextActive]}>
                Curated
              </Text>
            </Pressable>
            <Pressable
              style={styles.segmentBtn}
              onPress={() => {
                void Haptics.selectionAsync();
                setTab('custom');
              }}
              testID="tab-custom"
            >
              <Target size={14} color={tab === 'custom' ? '#FFFFFF' : colors.textMuted} />
              <Text style={[styles.segmentText, { color: colors.textMuted }, tab === 'custom' && styles.segmentTextActive]}>
                Custom
              </Text>
            </Pressable>
          </View>
        </View>

        {tab === 'curated' ? (
          <View style={styles.curatedContainer}>
            {curatedSessions.map((session) => {
              const beat = binauralBeats.find((b) => b.id === session.binauralBeatId);
              const scape = soundscapes.find((s) => s.id === session.soundscapeId);
              const isSelected = selectedCurated?.id === session.id;
              const isLocked = scape ? !isTrackUnlocked(scape.id, scape.isFree) : false;
              const totalMinutes = session.binauralDurationMinutes + session.soundscapeDurationMinutes;

              return (
                <Pressable
                  key={session.id}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedCurated(isSelected ? null : session);
                  }}
                  style={[styles.curatedCard, { backgroundColor: colors.bgCard, borderColor: colors.border }, isSelected && styles.curatedCardSelected]}
                  testID={`curated-${session.id}`}
                >
                  <LinearGradient
                    colors={[session.gradient[0], session.gradient[1]]}
                    style={styles.curatedGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.curatedCardHeader}>
                      <View style={styles.curatedBadgeRow}>
                        <View style={[styles.difficultyBadge, { backgroundColor: `${DIFFICULTY_COLORS[session.difficulty]}20` }]}>
                          <View style={[styles.difficultyDot, { backgroundColor: DIFFICULTY_COLORS[session.difficulty] }]} />
                          <Text style={[styles.difficultyText, { color: DIFFICULTY_COLORS[session.difficulty] }]}>
                            {DIFFICULTY_LABELS[session.difficulty]}
                          </Text>
                        </View>
                        {isLocked && (
                          <View style={[styles.lockedBadge, { backgroundColor: colors.dangerSoft }]}>
                            <Text style={[styles.lockedText, { color: colors.danger }]}>Locked</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.curatedTitle}>{session.title}</Text>
                      <Text style={styles.curatedSubtitle}>{session.subtitle}</Text>
                    </View>

                    <View style={styles.curatedMeta}>
                      <View style={styles.curatedMetaItem}>
                        <Clock size={12} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.curatedMetaText}>{totalMinutes} min</Text>
                      </View>
                      <View style={styles.curatedMetaItem}>
                        <Zap size={12} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.curatedMetaText}>{session.intention}</Text>
                      </View>
                    </View>
                  </LinearGradient>

                  {isSelected && (
                    <View style={[styles.curatedExpandedContent, { backgroundColor: colors.bgCard }]}>
                      <Text style={[styles.curatedDescription, { color: colors.textSecondary }]}>{session.description}</Text>

                      <View style={styles.curatedFlow}>
                        <View style={[styles.curatedFlowItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                          {beat?.artworkUrl ? (
                            <Image source={{ uri: beat.artworkUrl }} style={styles.curatedFlowArtwork} contentFit="cover" />
                          ) : (
                            <View style={[styles.curatedFlowIcon, { backgroundColor: colors.accentGlow }]}>
                              <Waves size={14} color={colors.accent} />
                            </View>
                          )}
                          <View style={styles.curatedFlowDetails}>
                            <Text style={[styles.curatedFlowTitle, { color: colors.text }]}>{beat?.title ?? 'Unknown'}</Text>
                            <Text style={[styles.curatedFlowSub, { color: colors.textSecondary }]}>
                              {beat?.brainwaveState} · {session.binauralDurationMinutes} min
                            </Text>
                          </View>
                        </View>

                        <View style={styles.flowConnector}>
                          <View style={[styles.flowLine, { backgroundColor: colors.border }]} />
                          <ChevronRight size={12} color={colors.textMuted} />
                          <View style={[styles.flowLine, { backgroundColor: colors.border }]} />
                        </View>

                        <View style={[styles.curatedFlowItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                          {scape?.artworkUrl ? (
                            <Image source={{ uri: scape.artworkUrl }} style={styles.curatedFlowArtwork} contentFit="cover" />
                          ) : (
                            <View style={[styles.curatedFlowIcon, { backgroundColor: colors.goldSoft }]}>
                              <Music size={14} color={colors.gold} />
                            </View>
                          )}
                          <View style={styles.curatedFlowDetails}>
                            <Text style={[styles.curatedFlowTitle, { color: colors.text }]}>{scape?.title ?? 'Unknown'}</Text>
                            <Text style={[styles.curatedFlowSub, { color: colors.textSecondary }]}>
                              Immersion · {session.soundscapeDurationMinutes} min
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Pressable
                        onPress={handleStartCurated}
                        style={[styles.curatedStartBtn, { backgroundColor: colors.accent }, isLocked && [styles.curatedStartBtnDisabled, { backgroundColor: colors.surface }]]}
                        disabled={isLocked}
                        testID={`start-curated-${session.id}`}
                      >
                        <Play size={18} color={isLocked ? colors.textMuted : '#FFFFFF'} fill={isLocked ? colors.textMuted : '#FFFFFF'} />
                        <Text style={[styles.curatedStartText, isLocked && { color: colors.textMuted }]}>
                          {isLocked ? 'Unlock Soundscape First' : 'Begin Session'}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <>
            <View style={styles.stepCard}>
              <View style={[styles.stepNum, { backgroundColor: colors.accentGlow }]}><Text style={[styles.stepNumText, { color: colors.accent }]}>1</Text></View>
              <Text style={[styles.stepLabel, { color: colors.text }]}>Choose Binaural Beat</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {binauralBeats.slice(0, 8).map((beat) => (
                <Pressable
                  key={beat.id}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedBeat(beat);
                  }}
                  style={[
                    styles.selectCard,
                    { backgroundColor: colors.bgCard, borderColor: colors.border },
                    selectedBeat?.id === beat.id && [styles.selectCardActive, { borderColor: colors.accent, backgroundColor: colors.accentGlow }],
                  ]}
                >
                  {beat.artworkUrl ? (
                    <Image source={{ uri: beat.artworkUrl }} style={styles.selectArtwork} contentFit="cover" />
                  ) : (
                    <LinearGradient colors={[beat.gradient[0], beat.gradient[1]]} style={styles.selectGradient}>
                      <Waves size={18} color="#FFFFFF" />
                    </LinearGradient>
                  )}
                  <Text style={[styles.selectTitle, { color: colors.text }]} numberOfLines={1}>{beat.title}</Text>
                  <Text style={[styles.selectMeta, { color: colors.textSecondary }]}>{beat.durationLabel}</Text>
                  {beat.brainwaveState && (
                    <Text style={[styles.selectFreq, { color: colors.accent }]} numberOfLines={1}>{beat.brainwaveState}</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.stepCard}>
              <View style={[styles.stepNum, { backgroundColor: colors.accentGlow }]}><Text style={[styles.stepNumText, { color: colors.accent }]}>2</Text></View>
              <Text style={[styles.stepLabel, { color: colors.text }]}>Choose Soundscape</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {availableScapes.map((scape) => (
                <Pressable
                  key={scape.id}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedScape(scape);
                  }}
                  style={[
                    styles.selectCard,
                    { backgroundColor: colors.bgCard, borderColor: colors.border },
                    selectedScape?.id === scape.id && [styles.selectCardActive, { borderColor: colors.accent, backgroundColor: colors.accentGlow }],
                  ]}
                >
                  {scape.artworkUrl ? (
                    <Image source={{ uri: scape.artworkUrl }} style={styles.selectArtwork} contentFit="cover" />
                  ) : (
                    <LinearGradient colors={[scape.gradient[0], scape.gradient[1]]} style={styles.selectGradient}>
                      <Music size={18} color="#FFFFFF" />
                    </LinearGradient>
                  )}
                  <Text style={[styles.selectTitle, { color: colors.text }]} numberOfLines={1}>{scape.title}</Text>
                  <Text style={[styles.selectMeta, { color: colors.textSecondary }]}>{scape.durationLabel}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {selectedBeat && selectedScape && (
              <View style={[styles.summaryCard, { backgroundColor: colors.bgCard, borderColor: 'rgba(74, 158, 229, 0.15)' }]}>
                <Text style={[styles.summaryTitle, { color: colors.text }]}>Session Summary</Text>
                <View style={styles.summaryRow}>
                  <Waves size={14} color={colors.accent} />
                  <Text style={[styles.summaryText, { color: colors.text }]}>{selectedBeat.title}</Text>
                  <ChevronRight size={14} color={colors.textMuted} />
                  <Music size={14} color={colors.gold} />
                  <Text style={[styles.summaryText, { color: colors.text }]}>{selectedScape.title}</Text>
                </View>

                <Pressable
                  onPress={handleStart}
                  style={[styles.startBtn, { backgroundColor: colors.accent }]}
                  testID="start-session-btn"
                >
                  <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.startText}>Begin Session</Text>
                </Pressable>
              </View>
            )}
          </>
        )}

        {mode === 'session' && step === 'setup' && (
          <Pressable onPress={() => setStep('active')} style={[styles.resumeBtn, { backgroundColor: colors.accentGlow, borderColor: 'rgba(74, 158, 229, 0.12)' }]}>
            <Text style={[styles.resumeText, { color: colors.accent }]}>Resume Active Session</Text>
            <ArrowRight size={16} color={colors.accent} />
          </Pressable>
        )}
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
  activeContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  setupHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 6,
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
  },
  setupSub: {
    fontSize: 14,
    lineHeight: 20,
  },
  segmentWrap: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  segmentTrack: {
    flexDirection: 'row' as const,
    borderRadius: 14,
    padding: 3,
    position: 'relative' as const,
    borderWidth: 1,
  },
  segmentIndicator: {
    position: 'absolute' as const,
    top: 3,
    left: 3,
    width: '50%' as any,
    height: '100%',
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 10,
    gap: 6,
    zIndex: 1,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  curatedContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 8,
  },
  curatedCard: {
    borderRadius: 20,
    overflow: 'hidden' as const,
    borderWidth: 1,
  },
  curatedCardSelected: {
    borderColor: 'rgba(74, 158, 229, 0.3)',
  },
  curatedGradient: {
    padding: 18,
    gap: 12,
  },
  curatedCardHeader: {
    gap: 6,
  },
  curatedBadgeRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 2,
  },
  difficultyBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  difficultyDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  lockedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  lockedText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  curatedTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700' as const,
  },
  curatedSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 18,
  },
  curatedMeta: {
    flexDirection: 'row' as const,
    gap: 16,
  },
  curatedMetaItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
  },
  curatedMetaText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500' as const,
  },
  curatedExpandedContent: {
    padding: 18,
    paddingTop: 0,
    gap: 16,
  },
  curatedDescription: {
    fontSize: 13,
    lineHeight: 20,
    paddingTop: 16,
  },
  curatedFlow: {
    gap: 4,
  },
  curatedFlowItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  curatedFlowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  curatedFlowArtwork: {
    width: 36,
    height: 36,
    borderRadius: 12,
  },
  curatedFlowDetails: {
    flex: 1,
    gap: 2,
  },
  curatedFlowTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  curatedFlowSub: {
    fontSize: 11,
  },
  flowConnector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 2,
  },
  flowLine: {
    height: 1,
    width: 20,
  },
  curatedStartBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    height: 50,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 3,
  },
  curatedStartBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  curatedStartText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700' as const,
  },
  stepCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  stepNumText: {
    fontSize: 14,
    fontWeight: '800' as const,
  },
  stepLabel: {
    fontSize: 17,
    fontWeight: '700' as const,
  },
  horizontalList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  selectCard: {
    width: 130,
    borderRadius: 18,
    padding: 12,
    borderWidth: 2,
    gap: 6,
  },
  selectCardActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  selectArtwork: {
    width: 48,
    height: 48,
    borderRadius: 14,
  },
  selectGradient: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  selectTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  selectMeta: {
    fontSize: 11,
  },
  selectFreq: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    gap: 14,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  summaryRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  startBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    height: 54,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 3,
  },
  startText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800' as const,
  },
  phaseHeader: {
    alignItems: 'center' as const,
    gap: 4,
    paddingTop: 8,
  },
  phaseLabel: {
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 2.5,
  },
  phaseTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  visualCenter: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  breathCircleOuter: {
    width: 170,
    height: 170,
    borderRadius: 85,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    overflow: 'hidden' as const,
  },
  breathArtwork: {
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  breathCircleInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 2,
  },
  timerOverlay: {
    alignItems: 'center' as const,
    marginTop: 10,
  },
  timerText: {
    fontSize: 30,
    fontWeight: '200' as const,
    letterSpacing: 2,
  },
  timerTextDark: {
    fontSize: 28,
    fontWeight: '200' as const,
    letterSpacing: 2,
  },
  timerSub: {
    fontSize: 13,
  },
  timerSubDark: {
    fontSize: 12,
  },
  progressWrap: {
    width: '100%',
    gap: 5,
  },
  progressLabels: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  progressLabel: {
    fontSize: 11,
  },
  activeControls: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 24,
  },
  mainControl: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
  },
  activeBottomRow: {
    alignItems: 'center' as const,
    gap: 10,
  },
  transitionBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  transitionText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  stopBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  stopText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  resumeBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  resumeText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
