import { Stack } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { AuthProvider } from "./lib/auth";
import { SyncProvider } from "./lib/offline";
import { Boundary } from "./components/ui";
import SyncIndicator from "./components/SyncIndicator";
import { isDemoMode } from "./lib/config";
import { colors } from "./lib/theme";

if (typeof globalThis.fetch === 'undefined') {
  // @ts-ignore
  globalThis.fetch = fetch;
}

export default function RootLayout() {
  return (
    <Boundary>
      <AuthProvider>
        <SyncProvider>
          <View style={{ flex: 1, backgroundColor: '#F5F7FB' }}>
            {isDemoMode && (
              <View style={demoStyles.bar}>
                <Text style={demoStyles.text}>Demo mode — sign up works offline · data saved in your browser</Text>
              </View>
            )}
            <SyncIndicator />
            <View style={{ flex: 1 }}>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F5F7FB' } }} />
            </View>
          </View>
        </SyncProvider>
      </AuthProvider>
    </Boundary>
  );
}

const demoStyles = StyleSheet.create({
  bar: { backgroundColor: colors.primaryDark, paddingVertical: 6, paddingHorizontal: 14, alignItems: 'center' },
  text: { color: colors.white, fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
