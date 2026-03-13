# Healing Soundscapes manual edits

Apply these inside the `/app` project folder.

## components/TrackCard.tsx

1. Change:
```tsx
import { Play, Lock, Clock } from 'lucide-react-native';
```

to:
```tsx
import { Play, Clock } from 'lucide-react-native';
```

2. Replace the entire `handlePress` function with:
```tsx
  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPlay();
  };
```

3. Replace this block:
```tsx
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
```

with:
```tsx
              <View style={styles.cardActions}>
                <View style={[styles.playBtn, { backgroundColor: colors.accent }]}>
                  <Play size={13} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.playText}>Play</Text>
                </View>
              </View>
```

4. Delete these style blocks entirely:
```tsx
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
```

## app/(tabs)/library/index.tsx

1. Replace:
```tsx
  const { isTrackUnlocked, purchaseTrack } = usePurchases();
```

with:
```tsx
  const { isTrackUnlocked } = usePurchases();
```

2. Delete the entire `handlePurchase` callback.

3. In `TrackCard`, replace:
```tsx
              onPurchase={() => handlePurchase(track)}
```

with:
```tsx
              onPurchase={undefined}
```

## app/(tabs)/ambient/index.tsx

1. Change:
```tsx
  Pause,
  Play,
  Square,
  Lock,
  Volume2,
```

to:
```tsx
  Pause,
  Play,
  Square,
  Volume2,
```

2. Replace the `AmbientTrackRow` props from:
```tsx
function AmbientTrackRow({ track, isActive, isUnlocked, onPlay, onPurchase, colors }: {
  track: AudioTrack;
  isActive: boolean;
  isUnlocked: boolean;
  onPlay: () => void;
  onPurchase: () => void;
  colors: ThemeColors;
}) {
```

with:
```tsx
function AmbientTrackRow({ track, isActive, onPlay, colors }: {
  track: AudioTrack;
  isActive: boolean;
  onPlay: () => void;
  colors: ThemeColors;
}) {
```

3. Replace the `onPress` block with:
```tsx
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPlay();
        }}
```

4. Replace:
```tsx
                {isUnlocked ? (
                  <Volume2 size={18} color={colors.textSecondary} />
                ) : (
                  <Lock size={16} color={colors.gold} />
                )}
```

with:
```tsx
                <Volume2 size={18} color={colors.textSecondary} />
```

5. Replace:
```tsx
              {!isUnlocked ? (
                <View style={[styles.priceBadge, { backgroundColor: colors.goldSoft }]}>
                  <Text style={[styles.priceText, { color: colors.gold }]}>{track.price}</Text>
                </View>
              ) : (
                <Play size={20} color={colors.accent} fill={colors.accent} />
              )}
```

with:
```tsx
              <Play size={20} color={colors.accent} fill={colors.accent} />
```

6. Replace:
```tsx
  const { isTrackUnlocked, purchaseTrack } = usePurchases();
```

with:
```tsx
  usePurchases();
```

7. Delete the entire `handlePurchase` callback.

8. In the row rendering block, replace:
```tsx
              isUnlocked={isTrackUnlocked(track.id, track.isFree)}
              onPlay={() => handlePlay(track)}
              onPurchase={() => handlePurchase(track)}
```

with:
```tsx
              onPlay={() => handlePlay(track)}
```

9. Delete these style blocks entirely:
```tsx
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
  },
```

## app/(tabs)/session/index.tsx

1. Replace:
```tsx
  const { isTrackUnlocked } = usePurchases();
```

with:
```tsx
  usePurchases();
```

2. Replace:
```tsx
  const availableSoundscapes = useMemo(
    () => soundscapes.filter((s) => isTrackUnlocked(s.id, s.isFree)),
    [isTrackUnlocked],
  );
```

with:
```tsx
  const availableSoundscapes = useMemo(
    () => soundscapes,
    [],
  );
```

3. Replace the entire `isCuratedUnlocked` block with:
```tsx
  const isCuratedUnlocked = useMemo(() => true, []);
```

4. In the curated card mapping, replace:
```tsx
              const isLocked = scape ? !isTrackUnlocked(scape.id, scape.isFree) : false;
```

with:
```tsx
              const isLocked = false;
```

5. Delete the `Locked` badge block entirely.

6. Replace the start button with:
```tsx
                      <Pressable
                        onPress={handleStartCurated}
                        style={[styles.curatedStartBtn, { backgroundColor: colors.accent }]}
                        testID={`start-curated-${session.id}`}
                      >
                        <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                        <Text style={styles.curatedStartText}>
                          Begin Session
                        </Text>
                      </Pressable>
```

## providers/AudioProvider.tsx

Replace:
```tsx
      const unlockedSoundscapes = soundscapes.filter(s => s.isFree);
```

with:
```tsx
      const unlockedSoundscapes = soundscapes;
```

## mocks/soundLibrary.ts

Use these search-and-replace updates:

1.
```ts
subtitle: '528 Hz · Transformation & miracles',
```
becomes
```ts
subtitle: '528 Hz · Transformation & renewal',
```

2.
```ts
subtitle: '417 Hz · Earth\'s healing rhythm',
```
becomes
```ts
subtitle: '417 Hz · Earth-inspired grounding rhythm',
```

3.
```ts
subtitle: '528 Hz healing frequency soundscape',
```
becomes
```ts
subtitle: '528 Hz restorative soundscape',
```

4.
```ts
description: 'Gently transition from an alert state into calm alpha waves at 528 Hz, then immerse in the healing soundscape. Perfect for stress relief and restoration.',
```
becomes
```ts
description: 'Gently transition from an alert state into calm alpha waves at 528 Hz, then immerse in the restorative soundscape. Designed to support relaxation and gentle restoration.',
```

5.
```ts
title: 'Divine Healing',
```
becomes
```ts
title: 'Divine Renewal',
```

6.
```ts
description: 'Combine the liberating power of 396 Hz divine alpha with the 528 Hz healing soundscape. A powerful combination for releasing and restoring.',
```
becomes
```ts
description: 'Combine the liberating power of 396 Hz divine alpha with the 528 Hz restorative soundscape. A deeply calming combination for release and renewal.',
```

7.
```ts
intention: 'Release & Heal',
```
becomes
```ts
intention: 'Release & Renew',
```
