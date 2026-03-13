import React, { useRef, useEffect, useCallback } from 'react';
import {
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Waves,
  Headphones,
  Library,
  ChevronRight,
  Sparkles,
  Moon,
  Brain,
  Music,
  BookOpen,
  Sun,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { ThemeColors } from '@/constants/colors';

function FeatureCard({
  icon: Icon,
  iconColor,
  title,
  description,
  onPress,
  gradientColors,
  delay,
  colors,
}: {
  icon: typeof Waves;
  iconColor: string;
  title: string;
  description: string;
  onPress: () => void;
  gradientColors: [string, string];
  delay: number;
  colors: ThemeColors;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  };

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}>
        <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.featureCard, { borderColor: colors.border }]}>
          <View style={[styles.featureIconWrap, { backgroundColor: colors.iconBgAlpha, borderColor: colors.iconBorderAlpha }]}>
            <Icon size={22} color={iconColor} />
          </View>
          <View style={styles.featureContent}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{description}</Text>
          </View>
          <ChevronRight size={18} color={colors.chevronColor} />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

function StepItem({ number, text, delay, colors }: { number: string; text: string; delay: number; colors: ThemeColors }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, delay]);

  return (
    <Animated.View style={[styles.stepRow, { opacity: fadeAnim }]}>
      <View style={[styles.stepNumber, { backgroundColor: colors.accentGlow }]}>
        <Text style={[styles.stepNumberText, { color: colors.accent }]}>{number}</Text>
      </View>
      <Text style={[styles.stepText, { color: colors.textSecondary }]}>{text}</Text>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );
  const logoFade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoFade, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 6 }),
      ]),
      Animated.parallel([
        Animated.timing(titleFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(titleSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();
  }, [logoFade, logoScale, titleFade, titleSlide]);

  const handleLearnPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void Linking.openURL('https://en.wikipedia.org/wiki/Binaural_beats');
  };

  const handleThemeToggle = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTheme();
  };

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

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View style={{ flex: 1 }} />
          <Pressable onPress={handleThemeToggle} style={[styles.themeToggle, { backgroundColor: colors.surface, borderColor: colors.border }]} testID="theme-toggle">
            {isDark ? <Sun size={18} color={colors.gold} /> : <Moon size={18} color={colors.accent} />}
          </Pressable>
        </View>

        <Animated.View style={[styles.heroSection, { opacity: logoFade, transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoContainer}>
            <Image source={require('@/assets/images/icon.png')} style={styles.logoImage} />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: titleFade, transform: [{ translateY: titleSlide }] }}>
          <Text style={[styles.brandName, { color: colors.text }]}>Healing Soundscapes</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>Deep calm through sound</Text>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Sparkles size={14} color={colors.gold} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>How It Works</Text>
        </View>

        <View style={styles.stepsContainer}>
          <View style={[styles.stepsCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <StepItem number="1" text="Browse your Library of binaural beats and soundscapes" delay={400} colors={colors} />
            <StepItem number="2" text="Start a Session — a guided sequence of binaural beats followed by an immersive soundscape" delay={550} colors={colors} />
            <StepItem number="3" text="Use Ambient mode to play any soundscape as continuous background music" delay={700} colors={colors} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Moon size={14} color={colors.accentSoft} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Explore</Text>
        </View>

        <View style={styles.featureList}>
          <FeatureCard
            icon={Library}
            iconColor={colors.accent}
            title="Your Library"
            description="Discover binaural beats & soundscapes"
            onPress={() => router.push('/(tabs)/library')}
            gradientColors={colors.featureGradient1}
            delay={500}
            colors={colors}
          />
          <FeatureCard
            icon={Brain}
            iconColor={isDark ? '#7EB8E0' : '#4A90C8'}
            title="Guided Sessions"
            description="Curated beat + soundscape combos for deep states"
            onPress={() => router.push('/(tabs)/session')}
            gradientColors={colors.featureGradient2}
            delay={600}
            colors={colors}
          />
          <FeatureCard
            icon={Music}
            iconColor={colors.accent}
            title="Ambient Mode"
            description="Continuous soundscapes for focus, sleep, or relaxation"
            onPress={() => router.push('/(tabs)/ambient')}
            gradientColors={colors.featureGradient1}
            delay={700}
            colors={colors}
          />
        </View>

        <View style={[styles.infoInner, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Headphones size={18} color={colors.accent} />
          <Text style={[styles.infoTitle, { color: colors.text }]}>Best with headphones</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Binaural beats require stereo headphones to deliver different frequencies to each ear, creating the entrainment effect.
          </Text>
        </View>

        <Pressable onPress={handleLearnPress} style={[styles.learnLink, { backgroundColor: colors.accentGlow, borderColor: 'rgba(74, 158, 229, 0.12)' }]} testID="learn-link">
          <BookOpen size={16} color={colors.accentSoft} />
          <Text style={[styles.learnText, { color: colors.accentSoft }]}>Learn about Brain Waves & Binaural Beats</Text>
          <ChevronRight size={16} color={colors.accentSoft} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    width: 88,
    height: 88,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  logoInner: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A9EE5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  logoImage: {
    width: 88,
    height: 88,
    borderRadius: 26,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  stepsContainer: {
    marginBottom: 4,
  },
  stepsCard: {
    borderRadius: 20,
    padding: 20,
    gap: 18,
    borderWidth: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 14,
    lineHeight: 21,
    flex: 1,
  },
  featureList: {
    gap: 10,
    marginBottom: 28,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    gap: 14,
    borderWidth: 1,
  },
  featureIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  featureContent: {
    flex: 1,
    gap: 3,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoInner: {
    borderRadius: 20,
    padding: 20,
    gap: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
  learnLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  learnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
