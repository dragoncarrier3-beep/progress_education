import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../lib/theme';

export default function Header({ title, subtitle, back = false, right }: {
  title: string; subtitle?: string; back?: boolean; right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <View style={s.wrap}>
      <View style={s.row}>
        {back ? (
          <Pressable hitSlop={10} onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.white} />
          </Pressable>
        ) : <View style={{ width: 36 }} />}
        <View style={{ flex: 1 }}>
          <Text style={s.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={s.sub} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        <View style={{ minWidth: 36, alignItems: 'flex-end' }}>{right}</View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { backgroundColor: colors.primary, paddingTop: Platform.OS === 'web' ? 18 : 52, paddingBottom: 16, paddingHorizontal: 14, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.white, fontSize: 20, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
});
