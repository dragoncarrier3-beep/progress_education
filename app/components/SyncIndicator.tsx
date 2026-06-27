import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSync } from '../lib/offline';
import { colors } from '../lib/theme';

export default function SyncIndicator() {
  const { online, syncing, pending } = useSync();
  const [showSaved, setShowSaved] = useState(false);
  const prevPending = useRef(pending);
  const opacity = useRef(new Animated.Value(0)).current;

  // Flash "all saved" briefly when the queue drains to zero
  useEffect(() => {
    if (prevPending.current > 0 && pending === 0 && online) {
      setShowSaved(true);
      const t = setTimeout(() => setShowSaved(false), 2000);
      prevPending.current = pending;
      return () => clearTimeout(t);
    }
    prevPending.current = pending;
  }, [pending, online]);

  const visible = !online || syncing || pending > 0 || showSaved;

  useEffect(() => {
    Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 220, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [visible, opacity]);

  if (!visible) return null;

  let bg = colors.primary;
  let icon: any = 'sync';
  let text = 'Syncing…';
  let spinner = false;

  if (!online) {
    bg = '#475569';
    icon = 'cloud-offline-outline';
    text = pending > 0 ? `Offline · ${pending} change${pending > 1 ? 's' : ''} queued` : 'Offline · changes saved on this device';
  } else if (syncing || pending > 0) {
    bg = colors.primary;
    icon = 'sync';
    spinner = true;
    text = `Syncing ${pending || ''} change${pending === 1 ? '' : 's'}…`.replace('  ', ' ');
  } else if (showSaved) {
    bg = colors.know;
    icon = 'checkmark-circle';
    text = 'All changes saved';
  }

  return (
    <Animated.View style={[s.bar, { backgroundColor: bg, opacity }]}>
      {spinner ? <ActivityIndicator size="small" color={colors.white} /> : <Ionicons name={icon} size={15} color={colors.white} />}
      <Text style={s.text} numberOfLines={1}>{text}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 7, paddingHorizontal: 14 },
  text: { color: colors.white, fontWeight: '700', fontSize: 13 },
});
