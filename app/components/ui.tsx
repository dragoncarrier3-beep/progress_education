import React from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../lib/theme';

export function Loading({ label }: { label?: string }) {
  return (
    <View style={s.center}>
      <ActivityIndicator color={colors.primary} size="large" />
      {label ? <Text style={s.mutedText}>{label}</Text> : null}
    </View>
  );
}

export function Skeleton({ height = 70, count = 4 }: { height?: number; count?: number }) {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[s.skel, { height }]} />
      ))}
    </View>
  );
}

export function EmptyState({ icon = 'cube-outline', title, subtitle, onRetry, retryLabel }: {
  icon?: any; title: string; subtitle?: string; onRetry?: () => void; retryLabel?: string;
}) {
  return (
    <View style={s.center}>
      <View style={s.emptyIcon}>
        <Ionicons name={icon} size={40} color={colors.primary} />
      </View>
      <Text style={s.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={s.mutedText}>{subtitle}</Text> : null}
      {onRetry ? (
        <Pressable style={s.retryBtn} onPress={onRetry}>
          <Ionicons name="refresh" size={18} color={colors.white} />
          <Text style={s.retryText}>{retryLabel || 'Try again'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Card({ children, style, onPress }: any) {
  const Comp: any = onPress ? Pressable : View;
  return <Comp onPress={onPress} style={[s.card, shadow, style]}>{children}</Comp>;
}

// Error boundary so the app NEVER shows a red crash screen
export class Boundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(_e: any) { /* swallow */ }
  render() {
    if (this.state.hasError) {
      return (
        <View style={[s.center, { flex: 1, backgroundColor: colors.bg }]}>
          <Ionicons name="construct-outline" size={44} color={colors.primary} />
          <Text style={s.emptyTitle}>Something hiccuped</Text>
          <Text style={s.mutedText}>Please go back and try again.</Text>
          <Pressable style={s.retryBtn} onPress={() => this.setState({ hasError: false })}>
            <Text style={s.retryText}>Reload</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children as any;
  }
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  mutedText: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  skel: { backgroundColor: '#E8EDF5', borderRadius: 14 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EAF1FE', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  retryBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  retryText: { color: colors.white, fontWeight: '700' },
});
