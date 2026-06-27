export const colors = {
  bg: '#F5F7FB',
  card: '#FFFFFF',
  primary: '#2563EB',
  primaryDark: '#1E40AF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  know: '#16A34A',
  knowBg: '#DCFCE7',
  kinda: '#F59E0B',
  kindaBg: '#FEF3C7',
  dont: '#EF4444',
  dontBg: '#FEE2E2',
  white: '#FFFFFF',
};

export const STATUS = {
  know: { label: 'I know this', icon: 'checkmark-circle', color: colors.know, bg: colors.knowBg },
  kinda: { label: 'Kind of', icon: 'help-circle', color: colors.kinda, bg: colors.kindaBg },
  dont: { label: "Don't know yet", icon: 'close-circle', color: colors.dont, bg: colors.dontBg },
} as const;

export type StatusKey = keyof typeof STATUS;

export const shadow = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 2,
};
