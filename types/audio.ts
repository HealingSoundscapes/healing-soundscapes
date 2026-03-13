export type AudioCategory = 'binaural' | 'soundscape';

export interface AudioTrack {
  id: string;
  title: string;
  subtitle: string;
  category: AudioCategory;
  durationSeconds: number;
  durationLabel: string;
  audioUrl: string;
  artworkUrl?: string;
  previewUrl?: string;
  isFree: boolean;
  price?: string;
  gradient: [string, string];
  icon: string;
  frequencyRange?: string;
  brainwaveState?: string;
}

export interface SessionConfig {
  binauralBeat: AudioTrack;
  soundscape: AudioTrack;
  binauralDurationMinutes: number;
  soundscapeDurationMinutes: number;
}

export interface CuratedSession {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  binauralBeatId: string;
  soundscapeId: string;
  binauralDurationMinutes: number;
  soundscapeDurationMinutes: number;
  gradient: [string, string];
  intention: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export type PlaybackMode = 'idle' | 'session' | 'ambient';

export interface PlaybackState {
  mode: PlaybackMode;
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  sessionConfig: SessionConfig | null;
  sessionPhase: 'binaural' | 'soundscape' | 'complete';
}
