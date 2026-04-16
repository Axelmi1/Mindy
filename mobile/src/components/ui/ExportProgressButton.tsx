/**
 * ExportProgressButton
 *
 * Pro feature: Download/share a PDF progress report.
 * Shows a paywall hint for Free users.
 * Uses expo-file-system to download + expo-sharing to share.
 */

import React, { useState } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  View,
} from 'react-native';
import {
  documentDirectory,
  createDownloadResumable,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { progressExportApi } from '@/api/client';
import { useUser } from '@/hooks/useUser';
import { Icon } from '@/components/ui/Icon';

interface ExportProgressButtonProps {
  isPro: boolean;
  onUpgradePress?: () => void;
}

type ExportState = 'idle' | 'downloading' | 'sharing' | 'done' | 'error';

export function ExportProgressButton({ isPro, onUpgradePress }: ExportProgressButtonProps) {
  const { userId } = useUser();
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [progress, setProgress] = useState(0);

  const handleExport = async () => {
    if (!isPro) {
      Alert.alert(
        '👑 Pro Feature',
        'PDF export is available for Pro subscribers. Upgrade to unlock your full progress report.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Upgrade to Pro', onPress: onUpgradePress, style: 'default' },
        ],
      );
      return;
    }

    if (!userId) return;

    try {
      setExportState('downloading');
      setProgress(0);

      const url = progressExportApi.getPdfUrl(userId);
      const filename = `mindy-progress-${Date.now()}.pdf`;
      const localUri = `${documentDirectory ?? ''}${filename}`;

      // Download with progress tracking
      const downloadResumable = createDownloadResumable(
        url,
        localUri,
        {},
        (downloadProgress) => {
          const pct =
            downloadProgress.totalBytesExpectedToWrite > 0
              ? downloadProgress.totalBytesWritten /
                downloadProgress.totalBytesExpectedToWrite
              : 0;
          setProgress(pct);
        },
      );

      const result = await downloadResumable.downloadAsync();

      if (!result?.uri) {
        throw new Error('Download failed: no URI returned');
      }

      setExportState('sharing');

      // Share the downloaded PDF
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(result.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Your Mindy Progress Report',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF Downloaded', `Saved to: ${result.uri}`);
      }

      setExportState('done');
      setTimeout(() => setExportState('idle'), 2000);
    } catch (err: any) {
      console.error('[ExportProgressButton] Error:', err);
      setExportState('error');
      Alert.alert(
        'Export Failed',
        err?.message ?? 'Could not generate your progress report. Please try again.',
      );
      setTimeout(() => setExportState('idle'), 2000);
    }
  };

  const isLoading = exportState === 'downloading' || exportState === 'sharing';

  return (
    <Pressable
      style={[
        styles.button,
        !isPro && styles.buttonLocked,
        exportState === 'done' && styles.buttonDone,
        exportState === 'error' && styles.buttonError,
      ]}
      onPress={handleExport}
      disabled={isLoading}
    >
      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#0D1117" />
          <Text style={styles.loadingText}>
            {exportState === 'downloading'
              ? `Generating… ${Math.round(progress * 100)}%`
              : 'Opening share sheet…'}
          </Text>
        </View>
      ) : (
        <View style={styles.row}>
          <Icon
            name={!isPro ? 'lock' : exportState === 'done' ? 'check' : 'download'}
            size={16}
            color="#0D1117"
          />
          <Text style={styles.label}>
            {!isPro
              ? 'Export Progress PDF  👑'
              : exportState === 'done'
              ? 'PDF Ready!'
              : exportState === 'error'
              ? 'Export Failed — Retry'
              : 'Export Progress PDF'}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#39FF14',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLocked: {
    backgroundColor: '#21262D',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  buttonDone: {
    backgroundColor: '#22C55E',
  },
  buttonError: {
    backgroundColor: '#EF4444',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1117',
    fontFamily: 'Inter-Bold',
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D1117',
  },
});
