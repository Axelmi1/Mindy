import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';

export interface AnswerOption {
  id: string;
  label: string;
  sublabel?: string;
  icon?: string; // emoji
}

interface Props {
  options: AnswerOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function AnswerCards({ options, selectedId, onSelect }: Props) {
  return (
    <View style={styles.list}>
      {options.map((opt) => {
        const selected = opt.id === selectedId;
        return (
          <TouchableOpacity
            key={opt.id}
            activeOpacity={0.8}
            onPress={() => onSelect(opt.id)}
            style={selected ? styles.cardSelected : styles.card}
          >
            {opt.icon ? <Text style={styles.icon}>{opt.icon}</Text> : null}
            <View style={styles.flex1}>
              <Text style={selected ? styles.labelSelected : styles.label}>{opt.label}</Text>
              {opt.sublabel ? <Text style={styles.sublabel}>{opt.sublabel}</Text> : null}
            </View>
            {selected ? <Text style={styles.check}>✓</Text> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const baseCard = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 12,
  padding: 16,
  borderRadius: 12,
  borderWidth: 2,
  backgroundColor: '#161B22',
};

const styles = StyleSheet.create({
  list: { gap: 12 },
  card: { ...baseCard, borderColor: '#30363D' },
  cardSelected: { ...baseCard, borderColor: '#39FF14', backgroundColor: 'rgba(57,255,20,0.08)' },
  icon: { fontSize: 24 },
  flex1: { flex: 1 },
  label: { fontFamily: 'Inter', fontSize: 16, color: '#E6EDF3', fontWeight: '600' },
  labelSelected: { fontFamily: 'Inter', fontSize: 16, color: '#39FF14', fontWeight: '700' },
  sublabel: { fontFamily: 'Inter', fontSize: 13, color: '#8B949E', marginTop: 2 },
  check: { fontFamily: 'Inter', fontSize: 18, color: '#39FF14', fontWeight: '700' },
});
