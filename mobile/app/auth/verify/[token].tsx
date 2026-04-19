import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { MindyMascot } from '@/components/mindy';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

type Status = 'loading' | 'success' | 'expired' | 'error';

export default function VerifyScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [status, setStatus] = useState<Status>('loading');
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    (async () => {
      try {
        const resp = await fetch(`${API_URL}/auth/verify/${token}`);
        if (resp.ok) {
          setStatus('success');
          setTimeout(() => router.replace('/(tabs)'), 1500);
        } else if (resp.status === 410) {
          setStatus('expired');
          setMsg('This link has expired. Request a new one from settings.');
        } else if (resp.status === 404) {
          setStatus('expired');
          setMsg('This link is invalid or was already used.');
        } else {
          setStatus('error');
          setMsg('Something went wrong. Try again later.');
        }
      } catch {
        setStatus('error');
        setMsg('Could not reach the server. Check your connection.');
      }
    })();
  }, [token]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        {status === 'loading' && (
          <>
            <MindyMascot mood="thinking" size={120} />
            <ActivityIndicator color="#39FF14" style={{ marginTop: 16 }} />
            <Text style={styles.caption}>Verifying your link...</Text>
          </>
        )}
        {status === 'success' && (
          <>
            <MindyMascot mood="hype" size={120} />
            <Icon name="check" size={40} color="#39FF14" />
            <Text style={styles.title}>Email verified!</Text>
            <Text style={styles.caption}>Taking you to the app...</Text>
          </>
        )}
        {(status === 'expired' || status === 'error') && (
          <>
            <MindyMascot mood="roast" size={120} />
            <Text style={styles.title}>Link problem</Text>
            <Text style={styles.caption}>{msg}</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1117' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  title: { fontFamily: 'Inter', fontSize: 24, fontWeight: '700', color: '#E6EDF3', marginTop: 12 },
  caption: { fontFamily: 'Inter', fontSize: 14, color: '#8B949E', textAlign: 'center' },
});
