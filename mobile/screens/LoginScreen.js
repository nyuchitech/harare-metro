import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Surface, Divider, Icon } from 'react-native-paper';
import { mukokoTheme } from '../theme';
import { auth } from '../api/client';

export default function LoginScreen({ navigation, route }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Check for reset success message
  useEffect(() => {
    if (route.params?.resetSuccess) {
      setResetSuccess(true);
      // Clear the param after showing the message
      setTimeout(() => setResetSuccess(false), 5000);
    }
  }, [route.params?.resetSuccess]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use centralized auth service
      const result = await auth.signIn(email, password);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Navigate to home
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
    } catch (err) {
      console.error('[LoginScreen] Error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="displaySmall" style={styles.title}>
            Harare <Text style={styles.titleAccent}>Metro</Text>
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Sign in to your account
          </Text>
        </View>

        {/* Form Card */}
        <Surface style={styles.card} elevation={2}>
          {/* Reset Success Message */}
          {resetSuccess && (
            <Surface style={styles.successBanner} elevation={0}>
              <Text style={styles.successText}>
                Password reset successful! Please sign in with your new password.
              </Text>
            </Surface>
          )}

          {/* Error Message */}
          {error && (
            <Surface style={styles.errorBanner} elevation={0}>
              <Text style={styles.errorText}>{error}</Text>
            </Surface>
          )}

          {/* Email Field */}
          <TextInput
            mode="outlined"
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
            outlineColor={mukokoTheme.colors.outline}
            activeOutlineColor={mukokoTheme.colors.primary}
            error={!!error}
          />

          {/* Password Field */}
          <TextInput
            mode="outlined"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
            outlineColor={mukokoTheme.colors.outline}
            activeOutlineColor={mukokoTheme.colors.primary}
            error={!!error}
          />

          {/* Forgot Password Link */}
          <Button
            mode="text"
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotButton}
            labelStyle={styles.forgotButtonLabel}
          >
            Forgot Password?
          </Button>

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading || !email || !password}
            style={styles.button}
            contentStyle={styles.buttonContent}
            icon={() => <Icon source="login" size={20} color={mukokoTheme.colors.onPrimary} />}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Text variant="bodySmall" style={styles.dividerText}>or</Text>
            <Divider style={styles.divider} />
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text variant="bodyMedium" style={styles.registerText}>
              Don't have an account?{' '}
            </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Register')}
              labelStyle={styles.registerButtonLabel}
              compact
            >
              Sign up
            </Button>
          </View>
        </Surface>

        {/* Back to Home */}
        <Button
          mode="text"
          onPress={() => navigation.navigate('Home')}
          style={styles.homeButton}
        >
          Back to Home
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mukokoTheme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: mukokoTheme.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: mukokoTheme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
    textAlign: 'center',
    marginBottom: mukokoTheme.spacing.sm,
    color: mukokoTheme.colors.onBackground,
  },
  titleAccent: {
    color: mukokoTheme.colors.primary,
  },
  subtitle: {
    textAlign: 'center',
    color: mukokoTheme.colors.onSurfaceVariant,
  },
  card: {
    padding: mukokoTheme.spacing.xl,
    borderRadius: mukokoTheme.roundness * 2,
    backgroundColor: mukokoTheme.colors.surface,
  },
  successBanner: {
    padding: mukokoTheme.spacing.md,
    marginBottom: mukokoTheme.spacing.lg,
    borderRadius: mukokoTheme.roundness,
    backgroundColor: `${mukokoTheme.colors.success}15`,
    borderWidth: 1,
    borderColor: `${mukokoTheme.colors.success}30`,
  },
  successText: {
    color: mukokoTheme.colors.success,
  },
  errorBanner: {
    padding: mukokoTheme.spacing.md,
    marginBottom: mukokoTheme.spacing.lg,
    borderRadius: mukokoTheme.roundness,
    backgroundColor: `${mukokoTheme.colors.error}15`,
    borderWidth: 1,
    borderColor: `${mukokoTheme.colors.error}30`,
  },
  errorText: {
    color: mukokoTheme.colors.error,
  },
  input: {
    marginBottom: mukokoTheme.spacing.md,
    backgroundColor: mukokoTheme.colors.surface,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: mukokoTheme.spacing.md,
  },
  forgotButtonLabel: {
    color: mukokoTheme.colors.primary,
  },
  button: {
    marginTop: mukokoTheme.spacing.md,
  },
  buttonContent: {
    paddingVertical: mukokoTheme.spacing.sm,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: mukokoTheme.spacing.lg,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: mukokoTheme.spacing.md,
    color: mukokoTheme.colors.onSurfaceVariant,
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerText: {
    color: mukokoTheme.colors.onSurfaceVariant,
  },
  registerButtonLabel: {
    color: mukokoTheme.colors.primary,
    fontWeight: '600',
  },
  homeButton: {
    marginTop: mukokoTheme.spacing.lg,
    alignSelf: 'center',
  },
});
