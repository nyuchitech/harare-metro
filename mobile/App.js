import React from 'react';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { paperTheme, paperThemeDark } from './theme';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? paperThemeDark : paperTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <AppNavigator />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
