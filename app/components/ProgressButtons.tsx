import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STATUS, StatusKey, colors } from '../lib/theme';

const ORDER: StatusKey[] = ['know', 'kinda', 'dont'];

export default function ProgressButtons({ value, onChange }: {
  value?: StatusKey; onChange: (s: StatusKey) => void;
}) {
  return (
    <View style={s.row}>
      {ORDER.map((k) => {
        const cfg = STATUS[k];
        const active = value === k;
        return (
          <Pressable
            key={k}
            onPress={() => onChange(k)}
            style={[s.btn, active ? { backgroundColor: cfg.bg, borderColor: cfg.color } : null]}
          >
            <Ionicons name={cfg.icon as any} size={20} color={active ? cfg.color : colors.muted} />
            <Text style={[s.label, active ? { color: cfg.color, fontWeight: '700' } : null]} numberOfLines={1}>
              {cfg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#FBFCFE' },
  label: { fontSize: 11, color: colors.muted, textAlign: 'center' },
});
