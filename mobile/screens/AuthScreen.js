import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  Surface,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../api/client';
import mukokoTheme from '../theme';
import ZimbabweFlagStrip from '../components/ZimbabweFlagStrip';

export default function AuthScreen({ navigation }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    const { data, error: apiError } = await auth.signIn(email, password);

    if (apiError) {
      setError(apiError);
      setLoading(false);
      return;
    }

    if (data?.user) {
      // Navigate to home or dashboard
      console.log('Logged in:', data.user);
      // navigation.navigate('Home');
    }

    setLoading(false);
  };

  const handleRegister = async () => {
    setError('');
    setLoading(true);

    const { data, error: apiError } = await auth.signUp(
      email,
      password,
      displayName
    );

    if (apiError) {
      setError(apiError);
      setLoading(false);
      return;
    }

    if (data?.user) {
      // Auto-login after registration
      await handleLogin();
    }

    setLoading(false);
  };

  const handleSubmit = () => {
    if (mode === 'login') {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Zimbabwe Flag Strip */}
      <ZimbabweFlagStrip />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text variant="displaySmall" style={styles.logo}>
              Mukoko News
            </Text>
            <Text variant="bodyLarge" style={styles.tagline}>
              Zimbabwe's Voice, Your News
            </Text>
          </View>

          {/* Auth Form */}
          <Surface style={styles.formContainer} elevation={2}>
            <View style={styles.formHeader}>
              <Text variant="headlineMedium" style={styles.formTitle}>
                {mode === 'login' ? 'Welcome Back' : 'Join Mukoko News'}
              </Text>
              <Text variant="bodyMedium" style={styles.formSubtitle}>
                {mode === 'login'
                  ? 'Sign in to continue'
                  : 'Create your account'}
              </Text>
            </View>

            {/* Register: Display Name */}
            {mode === 'register' && (
              <TextInput
                label="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="account-outline" />}
                disabled={loading}
              />
            )}

            {/* Email */}
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
              left={<TextInput.Icon icon="email-outline" />}
              disabled={loading}
            />

            {/* Password */}
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete={mode === 'login' ? 'password' : 'new-password'}
              style={styles.input}
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              disabled={loading}
            />

            {/* Error Message */}
            {error ? (
              <HelperText type="error" visible={true} style={styles.errorText}>
                {error}
              </HelperText>
            ) : null}

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <Divider style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <Divider style={styles.divider} />
            </View>

            {/* Toggle Mode */}
            <Button
              mode="text"
              onPress={toggleMode}
              disabled={loading}
              style={styles.toggleButton}
            >
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Button>
          </Surface>

          {/* Footer */}
          <View style={styles.footer}>
            <Text variant="bodySmall" style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy
              Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mukokoTheme.colors.background,
  },
  flagStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 8,
    height: '100%',
    zIndex: 1000,
    backgroundColor: mukokoTheme.colors.zwGreen,
    borderRightWidth: 2,
    borderRightColor: mukokoTheme.colors.zwYellow,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: mukokoTheme.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: mukokoTheme.spacing.xl,
    gap: mukokoTheme.spacing.xs,
  },
  logo: {
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
    color: mukokoTheme.colors.primary,
    textAlign: 'center',
  },
  tagline: {
    color: mukokoTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: mukokoTheme.colors.surface,
    borderRadius: mukokoTheme.roundness,
    padding: mukokoTheme.spacing.lg,
    gap: mukokoTheme.spacing.md,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: mukokoTheme.spacing.md,
    gap: mukokoTheme.spacing.xs,
  },
  formTitle: {
    fontFamily: mukokoTheme.fonts.serif.fontFamily,
    color: mukokoTheme.colors.onSurface,
  },
  formSubtitle: {
    color: mukokoTheme.colors.onSurfaceVariant,
  },
  input: {
    backgroundColor: mukokoTheme.colors.surface,
  },
  errorText: {
    fontSize: 13,
  },
  submitButton: {
    marginTop: mukokoTheme.spacing.sm,
    borderRadius: mukokoTheme.roundness,
  },
  submitButtonContent: {
    paddingVertical: mukokoTheme.spacing.xs,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: mukokoTheme.spacing.md,
    gap: mukokoTheme.spacing.sm,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    color: mukokoTheme.colors.onSurfaceVariant,
    fontSize: 13,
  },
  toggleButton: {
    marginTop: mukokoTheme.spacing.xs,
  },
  footer: {
    marginTop: mukokoTheme.spacing.xl,
    paddingHorizontal: mukokoTheme.spacing.md,
  },
  footerText: {
    color: mukokoTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
});
