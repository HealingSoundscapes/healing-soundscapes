import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
// @ts-ignore - expo-audio types may not resolve in all environments
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import createContextHook from '@nkzw/create-context-hook';
import { AudioTrack, PlaybackMode, SessionConfig } from '@/types/audio';
import { soundscapes } from '@/mocks/soundLibrary';

export const [AudioProvider, useAudio] = createContextHook(() => {
  const playerRef = useRef<any>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [mode, setMode] = useState<PlaybackMode>('idle');
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [sessionPhase, setSessionPhase] = useState<'binaural' | 'soundscape' | 'complete'>('binaural');
  const [isLoading, setIsLoading] = useState(false);
  const ambientPlaylistRef = useRef<AudioTrack[]>([]);
  const isAmbientShuffleRef = useRef(false);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
        });
        console.log('[Audio] Audio mode configured');
      } catch (err) {
        console.log('[Audio] Error setting audio mode:', err);
      }
    };
    void setupAudio();

    return () => {
      if (playerRef.current) {
        playerRef.current.release();
        playerRef.current = null;
      }
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, []);

  const releasePlayer = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.release();
      } catch (e) {
        console.log('[Audio] Error releasing player:', e);
      }
      playerRef.current = null;
    }
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  }, []);

  const trackDurationRef = useRef<number>(0);

  const playNextAmbientRef = useRef<(() => void) | null>(null);

  const pickNextAmbientTrack = useCallback((currentId: string): AudioTrack => {
    const available = ambientPlaylistRef.current.filter(t => t.id !== currentId);
    if (available.length === 0) {
      return ambientPlaylistRef.current[Math.floor(Math.random() * ambientPlaylistRef.current.length)];
    }
    return available[Math.floor(Math.random() * available.length)];
  }, []);

  const startStatusPolling = useCallback((player: ReturnType<typeof createAudioPlayer>) => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }
    sessionTimerRef.current = setInterval(() => {
      try {
        if (player) {
          const playerDuration = player.duration ?? 0;
          const effectiveDuration = playerDuration > 0 ? playerDuration : trackDurationRef.current;
          const playerTime = player.currentTime ?? 0;
          const clampedTime = effectiveDuration > 0 ? Math.min(playerTime, effectiveDuration) : playerTime;

          setCurrentTime(clampedTime);
          if (effectiveDuration > 0) {
            setDuration(effectiveDuration);
          }
          setIsPlaying(player.playing ?? false);

          if (
            isAmbientShuffleRef.current &&
            effectiveDuration > 0 &&
            clampedTime >= effectiveDuration - 0.5 &&
            !(player.playing ?? false)
          ) {
            console.log('[Audio] Track ended, playing next ambient track');
            if (playNextAmbientRef.current) {
              playNextAmbientRef.current();
            }
          }
        }
      } catch {
        // player may have been released
      }
    }, 500);
  }, []);

  const loadAndPlay = useCallback(
    async (track: AudioTrack, loop: boolean = false) => {
      console.log('[Audio] Loading track:', track.title, 'loop:', loop);
      setIsLoading(true);

      releasePlayer();

      try {
        const player = createAudioPlayer({ uri: track.audioUrl });
        playerRef.current = player;
        player.loop = loop;

        setCurrentTrack(track);
        setCurrentTime(0);
        trackDurationRef.current = track.durationSeconds;
        setDuration(track.durationSeconds);

        startStatusPolling(player);

        setTimeout(() => {
          try {
            if (playerRef.current === player && player.isLoaded) {
              player.play();
              setIsPlaying(true);
            } else if (playerRef.current === player) {
              setTimeout(() => {
                try {
                  if (playerRef.current === player) {
                    player.play();
                    setIsPlaying(true);
                  }
                } catch (e) {
                  console.log('[Audio] Delayed play error:', e);
                }
              }, 1500);
            }
          } catch (e) {
            console.log('[Audio] Play error:', e);
          }
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.log('[Audio] Load error:', err);
        setIsLoading(false);
      }
    },
    [releasePlayer, startStatusPolling],
  );

  const playAmbient = useCallback(
    (track: AudioTrack) => {
      console.log('[Audio] Starting ambient shuffle mode:', track.title);
      setMode('ambient');
      setSessionConfig(null);
      setSessionPhase('binaural');

      const unlockedSoundscapes = soundscapes.filter(s => s.isFree);
      ambientPlaylistRef.current = unlockedSoundscapes.length > 0 ? unlockedSoundscapes : [track];
      isAmbientShuffleRef.current = ambientPlaylistRef.current.length > 1;

      void loadAndPlay(track, ambientPlaylistRef.current.length <= 1);
    },
    [loadAndPlay],
  );

  const playNextAmbient = useCallback(() => {
    if (!isAmbientShuffleRef.current) return;
    const current = currentTrack;
    if (!current) return;
    const next = pickNextAmbientTrack(current.id);
    console.log('[Audio] Shuffle next:', next.title);
    setCurrentTrack(next);
    setCurrentTime(0);
    trackDurationRef.current = next.durationSeconds;
    setDuration(next.durationSeconds);

    releasePlayer();
    try {
      const player = createAudioPlayer({ uri: next.audioUrl });
      playerRef.current = player;
      player.loop = false;
      startStatusPolling(player);
      setTimeout(() => {
        try {
          if (playerRef.current === player && player.isLoaded) {
            player.play();
            setIsPlaying(true);
          } else if (playerRef.current === player) {
            setTimeout(() => {
              try {
                if (playerRef.current === player) {
                  player.play();
                  setIsPlaying(true);
                }
              } catch (e) {
                console.log('[Audio] Delayed shuffle play error:', e);
              }
            }, 1500);
          }
        } catch (e) {
          console.log('[Audio] Shuffle play error:', e);
        }
      }, 800);
    } catch (err) {
      console.log('[Audio] Shuffle load error:', err);
    }
  }, [currentTrack, pickNextAmbientTrack, releasePlayer, startStatusPolling]);

  useEffect(() => {
    playNextAmbientRef.current = playNextAmbient;
  }, [playNextAmbient]);

  const startSession = useCallback(
    (config: SessionConfig) => {
      console.log('[Audio] Starting session - Binaural:', config.binauralBeat.title, '→ Soundscape:', config.soundscape.title);
      setMode('session');
      setSessionConfig(config);
      setSessionPhase('binaural');
      void loadAndPlay(config.binauralBeat, false);
    },
    [loadAndPlay],
  );

  const transitionToSoundscape = useCallback(() => {
    if (!sessionConfig) return;
    console.log('[Audio] Transitioning to soundscape:', sessionConfig.soundscape.title);
    setSessionPhase('soundscape');
    void loadAndPlay(sessionConfig.soundscape, false);
  }, [sessionConfig, loadAndPlay]);

  const togglePlayPause = useCallback(() => {
    if (!playerRef.current) return;
    try {
      if (playerRef.current.playing) {
        playerRef.current.pause();
        setIsPlaying(false);
        console.log('[Audio] Paused');
      } else {
        playerRef.current.play();
        setIsPlaying(true);
        console.log('[Audio] Resumed');
      }
    } catch (e) {
      console.log('[Audio] Toggle error:', e);
    }
  }, []);

  const stop = useCallback(() => {
    console.log('[Audio] Stopping playback');
    isAmbientShuffleRef.current = false;
    ambientPlaylistRef.current = [];
    releasePlayer();
    setMode('idle');
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setSessionConfig(null);
    setSessionPhase('binaural');
  }, [releasePlayer]);

  const seekTo = useCallback(async (seconds: number) => {
    if (!playerRef.current) return;
    try {
      await playerRef.current.seekTo(seconds);
      setCurrentTime(seconds);
    } catch (e) {
      console.log('[Audio] Seek error:', e);
    }
  }, []);

  return useMemo(() => ({
    mode,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    sessionConfig,
    sessionPhase,
    isLoading,
    playAmbient,
    startSession,
    transitionToSoundscape,
    togglePlayPause,
    stop,
    seekTo,
  }), [mode, currentTrack, isPlaying, currentTime, duration, sessionConfig, sessionPhase, isLoading, playAmbient, startSession, transitionToSoundscape, togglePlayPause, stop, seekTo]);
});
