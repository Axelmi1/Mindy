import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Slot } from 'expo-router';
import { View } from 'react-native';
import { ProgressBar } from './components/ProgressBar';

export default function OnboardingLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0D1117' }}>
      <StatusBar style="light" />
      <ProgressBar />
      <Slot />
    </View>
  );
}
