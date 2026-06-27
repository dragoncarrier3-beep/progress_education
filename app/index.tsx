import React from 'react';
import { View } from 'react-native';
import { useAuth } from './lib/auth';
import { Loading } from './components/ui';
import Login from './components/Login';
import Grades from './components/Grades';
import { colors } from './lib/theme';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }}><Loading label="Loading StudyTrack…" /></View>;
  }
  if (!user) return <Login />;
  return <Grades />;
}
