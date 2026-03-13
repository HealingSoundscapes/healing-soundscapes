import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Route Missing' }} />
      <View style={styles.container}>
        <Text style={styles.kicker}>Healing Soundscapes</Text>
        <Text style={styles.title}>That route is not part of this sound library yet.</Text>
        <Text style={styles.body}>
          Head back to the main experience to review the Session flow, Ambient mode, and the launch catalog plan.
        </Text>
        <Text style={styles.caption}>The app currently centers around a curated launch library and future premium drops.</Text>
        <Link href="/" style={styles.link}>
          Return home
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#04101B',
  },
  kicker: {
    color: '#7AE7C7',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  title: {
    color: '#F6FAFF',
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    color: '#A9C0D8',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 12,
  },
  caption: {
    color: '#7D95AD',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  link: {
    color: '#F4C37D',
    fontSize: 16,
    fontWeight: '700',
  },
});
