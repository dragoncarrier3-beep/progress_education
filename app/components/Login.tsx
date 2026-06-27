import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { colors, shadow } from '../lib/theme';

export default function Login() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<'in' | 'up' | 'reset'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok?: boolean } | null>(null);

  const validate = () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return 'Enter a valid email.';
    if (mode !== 'reset' && password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const submit = async () => {
    setMsg(null);
    const v = validate();
    if (v) { setMsg({ text: v }); return; }
    setBusy(true);
    try {
      if (mode === 'reset') {
        const r = await resetPassword(email);
        setMsg(r.error ? { text: r.error } : { text: 'Reset link sent. Check your inbox.', ok: true });
      } else if (mode === 'in') {
        const r = await signIn(email, password);
        if (r.error) setMsg({ text: r.error });
      } else {
        const r = await signUp(email, password);
        if (r.error) setMsg({ text: r.error });
        else setMsg({ text: 'Account created! You can now sign in.', ok: true });
      }
    } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.logoWrap}>
          <View style={s.logo}><Ionicons name="school" size={34} color={colors.white} /></View>
          <Text style={s.brand}>StudyTrack</Text>
          <Text style={s.tag}>Gymnasium Learning Progress System</Text>
        </View>

        <View style={[s.card, shadow]}>
          <Text style={s.cardTitle}>
            {mode === 'in' ? 'Welcome back' : mode === 'up' ? 'Create account' : 'Reset password'}
          </Text>

          <View style={s.field}>
            <Ionicons name="mail-outline" size={18} color={colors.muted} />
            <TextInput
              placeholder="Email" placeholderTextColor={colors.muted} value={email}
              onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
              style={s.input}
            />
          </View>

          {mode !== 'reset' && (
            <View style={s.field}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.muted} />
              <TextInput
                placeholder="Password" placeholderTextColor={colors.muted} value={password}
                onChangeText={setPassword} secureTextEntry style={s.input}
              />
            </View>
          )}

          {msg ? (
            <View style={[s.msg, { backgroundColor: msg.ok ? colors.knowBg : colors.dontBg }]}>
              <Ionicons name={msg.ok ? 'checkmark-circle' : 'alert-circle'} size={16} color={msg.ok ? colors.know : colors.dont} />
              <Text style={[s.msgText, { color: msg.ok ? colors.know : colors.dont }]}>{msg.text}</Text>
            </View>
          ) : null}

          <Pressable style={[s.primaryBtn, busy && { opacity: 0.6 }]} disabled={busy} onPress={submit}>
            <Text style={s.primaryText}>
              {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : mode === 'up' ? 'Sign up' : 'Send reset link'}
            </Text>
          </Pressable>

          <View style={s.links}>
            {mode === 'in' ? (
              <>
                <Pressable onPress={() => { setMode('reset'); setMsg(null); }}><Text style={s.link}>Forgot password?</Text></Pressable>
                <Pressable onPress={() => { setMode('up'); setMsg(null); }}><Text style={s.link}>Create account</Text></Pressable>
              </>
            ) : (
              <Pressable onPress={() => { setMode('in'); setMsg(null); }}><Text style={s.link}>Back to sign in</Text></Pressable>
            )}
          </View>
        </View>

        <Text style={s.hint}>Tip: sign up with any email + 6+ char password. Demo runs fully in your browser.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.bg },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 72, height: 72, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow },
  brand: { fontSize: 28, fontWeight: '900', color: colors.text, marginTop: 14 },
  tag: { fontSize: 13, color: colors.muted, marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 22 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 18 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, marginBottom: 12, backgroundColor: '#FBFCFE' },
  input: { flex: 1, paddingVertical: 14, color: colors.text, fontSize: 15, outlineStyle: 'none' as any },
  msg: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 10, borderRadius: 10, marginBottom: 12 },
  msgText: { flex: 1, fontSize: 13, fontWeight: '600' },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  primaryText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  links: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  link: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  hint: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 18 },
});
