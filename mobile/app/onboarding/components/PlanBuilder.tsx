import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props { lines: string[]; }

/** Affiche des lignes "terminal" une par une, façon build. */
export function PlanBuilder({ lines }: Props) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (count >= lines.length) return;
    const id = setTimeout(() => setCount((c) => c + 1), 500);
    return () => clearTimeout(id);
  }, [count, lines.length]);

  return (
    <View style={styles.box}>
      {lines.slice(0, count).map((l, i) => (
        <Text key={i} style={styles.line}>
          <Text style={styles.prompt}>{'> '}</Text>{l}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#0D1117', borderRadius: 12, borderWidth: 1, borderColor: '#30363D',
    padding: 14, gap: 6,
  },
  line: { fontFamily: 'JetBrainsMono', fontSize: 13, color: '#E6EDF3', lineHeight: 20 },
  prompt: { color: '#39FF14' },
});
