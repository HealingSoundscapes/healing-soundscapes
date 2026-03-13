import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface SeekBarProps {
  progress: number;
  duration: number;
  onSeek: (seconds: number) => void;
  trackColor?: string;
  fillColor?: string;
  thumbColor?: string;
  height?: number;
}

export default function SeekBar({
  progress,
  duration,
  onSeek,
  trackColor = 'rgba(255,255,255,0.08)',
  fillColor = '#6BA4D4',
  thumbColor = '#FFFFFF',
  height = 6,
}: SeekBarProps) {
  const barWidth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const thumbScale = useRef(new Animated.Value(1)).current;

  const clamp = (val: number, min: number, max: number) =>
    Math.min(Math.max(val, min), max);

  const getSecondsFromX = useCallback(
    (x: number) => {
      if (barWidth.current <= 0 || duration <= 0) return 0;
      const ratio = clamp(x / barWidth.current, 0, 1);
      return ratio * duration;
    },
    [duration],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDragging(true);
        const x = evt.nativeEvent.locationX;
        const p = barWidth.current > 0 ? clamp(x / barWidth.current, 0, 1) : 0;
        setDragProgress(p);
        Animated.spring(thumbScale, {
          toValue: 1.6,
          useNativeDriver: true,
          speed: 40,
          bounciness: 8,
        }).start();
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        const p = barWidth.current > 0 ? clamp(x / barWidth.current, 0, 1) : 0;
        setDragProgress(p);
      },
      onPanResponderRelease: (evt) => {
        const x = evt.nativeEvent.locationX;
        const seconds = getSecondsFromX(x);
        onSeek(seconds);
        setIsDragging(false);
        Animated.spring(thumbScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 30,
        }).start();
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        Animated.spring(thumbScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 30,
        }).start();
      },
    }),
  ).current;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    barWidth.current = e.nativeEvent.layout.width;
  }, []);

  const displayProgress = isDragging ? dragProgress : (duration > 0 ? progress : 0);
  const fillPercent = `${clamp(displayProgress * 100, 0, 100)}%`;

  return (
    <View
      style={styles.touchArea}
      onLayout={onLayout}
      {...panResponder.panHandlers}
      testID="seek-bar"
    >
      <View style={[styles.track, { backgroundColor: trackColor, height }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: fillColor,
              width: fillPercent as any,
              height,
            },
          ]}
        />
      </View>
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: thumbColor,
            left: fillPercent as any,
            transform: [{ scale: thumbScale }],
            top: -(12 - height) / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    height: 32,
    justifyContent: 'center' as const,
    position: 'relative' as const,
  },
  track: {
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  fill: {
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute' as const,
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
});
