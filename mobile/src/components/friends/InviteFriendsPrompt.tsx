import React from 'react';
import { View, Text, Pressable, StyleSheet, Share, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/components/ui/Icon';
import { MindyMascot } from '@/components/mindy';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

interface Props {
  visible: boolean;
  referralCode: string;
  userId: string;
  onDismiss: () => void;
}

export function InviteFriendsPrompt({ visible, referralCode, userId, onDismiss }: Props) {
  const markSeen = async () => {
    try {
      await fetch(`${API_URL}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasSeenInvitePrompt: true }),
      });
    } catch (err) {
      console.warn('Failed to mark invite prompt seen:', err);
    }
    onDismiss();
  };

  const share = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `🧠 Je viens de commencer à apprendre sur MINDY. Rejoins-moi avec le code ${referralCode} → mindy://invite/${referralCode}`,
        title: 'Rejoins-moi sur Mindy',
      });
    } finally {
      await markSeen();
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={markSeen}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.mascot}><MindyMascot mood="hype" size={100} /></View>
          <Text style={styles.title}>Première leçon terminée !</Text>
          <Text style={styles.subtitle}>Invite un ami et gagnez tous les deux des XP bonus.</Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Ton code de parrainage</Text>
            <Text style={styles.code}>{referralCode}</Text>
          </View>

          <Pressable style={styles.primary} onPress={share}>
            <Icon name="share" size={18} color="#0D1117" />
            <Text style={styles.primaryText}>Inviter des amis</Text>
          </Pressable>
          <Pressable style={styles.ghost} onPress={markSeen}>
            <Text style={styles.ghostText}>Plus tard</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#161B22', borderRadius: 20, padding: 24, borderWidth: 2, borderColor: 'rgba(57,255,20,0.4)', gap: 14, alignItems: 'center' },
  mascot: { marginBottom: 8 },
  title: { fontFamily: 'Inter', fontSize: 24, fontWeight: '700', color: '#E6EDF3', textAlign: 'center' },
  subtitle: { fontFamily: 'Inter', fontSize: 14, color: '#8B949E', textAlign: 'center', paddingHorizontal: 12 },
  codeBox: { backgroundColor: '#0D1117', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: '#39FF14', alignItems: 'center', gap: 4 },
  codeLabel: { fontFamily: 'Inter', fontSize: 11, color: '#8B949E' },
  code: { fontFamily: 'JetBrainsMono', fontSize: 22, fontWeight: '700', color: '#39FF14', letterSpacing: 3 },
  primary: { flexDirection: 'row', gap: 10, backgroundColor: '#39FF14', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center', width: '100%' },
  primaryText: { fontFamily: 'Inter', fontSize: 15, fontWeight: '700', color: '#0D1117' },
  ghost: { paddingVertical: 8 },
  ghostText: { fontFamily: 'Inter', fontSize: 13, color: '#8B949E' },
});
