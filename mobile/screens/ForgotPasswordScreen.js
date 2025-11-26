import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Surface, HelperText } from 'react-native-paper';
import { mukokoTheme } from '../theme';
import { Mail, Key } from 'lucide-react-native';

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState('request'); // 'request' or 'reset'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRequestReset = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        'https://admin.hararemetro.co.zw/api/auth/forgot-password',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      if (response.ok) {
        setSuccess(true);
        setStep('reset');
      } else {
        setError('Failed to send reset code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code || !newPassword) {
      setError('Please enter both the code and new password');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        'https://admin.hararemetro.co.zw/api/auth/reset-password',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code, newPassword }),
        }
      );

      if (response.ok) {
        // Navigate to login with success message
        navigation.navigate('Login', { resetSuccess: true });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Invalid or expired code');
      }
    } catch (err) {
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
            {step === 'request' ? 'Forgot your password?' : 'Reset your password'}
          </Text>
        </View>

        {/* Form Card */}
        <Surface style={styles.card} elevation={2}>
          {step === 'request' ? (
            // Step 1: Request Reset Code
            <>
              {/* Success Message */}
              {success && (
                <Surface style={styles.successBanner} elevation={0}>
                  <Text style={styles.successText}>
                    Check your email for the reset code!
                  </Text>
                </Surface>
              )}

              {/* Error Message */}
              {error && !success && (
                <Surface style={styles.errorBanner} elevation={0}>
                  <Text style={styles.errorText}>{error}</Text>
                </Surface>
              )}

              <Text variant="bodyMedium" style={styles.helperText}>
                Enter your email address and we'll send you a 6-digit reset code.
                The code expires in 15 minutes.
              </Text>

              {/* Email Field */}
              <TextInput
                mode="outlined"
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                left={<TextInput.Icon icon={() => <Mail size={20} color={mukokoTheme.colors.onSurfaceVariant} />} />}
                style={styles.input}
                outlineColor={mukokoTheme.colors.outline}
                activeOutlineColor={mukokoTheme.colors.primary}
                error={!!error && !success}
              />

              {/* Submit Button */}
              <Button
                mode="contained"
                onPress={handleRequestReset}
                loading={loading}
                disabled={loading || !email}
                style={styles.button}
                contentStyle={styles.buttonContent}
                icon={() => <Mail size={20} color={mukokoTheme.colors.onPrimary} />}
              >
                {loading ? 'Sending code...' : 'Send Reset Code'}
              </Button>
            </>
          ) : (
            // Step 2: Enter Code and New Password
            <>
              {/* Error Message */}
              {error && (
                <Surface style={styles.errorBanner} elevation={0}>
                  <Text style={styles.errorText}>{error}</Text>
                </Surface>
              )}

              <Text variant="bodyMedium" style={styles.helperText}>
                Enter the 6-digit code sent to{' '}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>

              {/* Reset Code Field */}
              <TextInput
                mode="outlined"
                label="Reset Code"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                style={[styles.input, styles.codeInput]}
                outlineColor={mukokoTheme.colors.outline}
                activeOutlineColor={mukokoTheme.colors.primary}
                error={!!error}
              />

              {/* New Password Field */}
              <TextInput
                mode="outlined"
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
                left={<TextInput.Icon icon={() => <Key size={20} color={mukokoTheme.colors.onSurfaceVariant} />} />}
                style={styles.input}
                outlineColor={mukokoTheme.colors.outline}
                activeOutlineColor={mukokoTheme.colors.primary}
                error={!!error}
              />
              <HelperText type="info">
                Minimum 8 characters
              </HelperText>

              {/* Submit Button */}
              <Button
                mode="contained"
                onPress={handleResetPassword}
                loading={loading}
                disabled={loading || !code || !newPassword}
                style={styles.button}
                contentStyle={styles.buttonContent}
                icon={() => <Key size={20} color={mukokoTheme.colors.onPrimary} />}
              >
                {loading ? 'Resetting password...' : 'Reset Password'}
              </Button>
            </>
          )}

          {/* Back to Login */}
          <Button
            mode="text"
            onPress={() => navigation.navigate('Auth')}
            style={styles.linkButton}
          >
            Back to Login
          </Button>
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
  helperText: {
    marginBottom: mukokoTheme.spacing.lg,
    color: mukokoTheme.colors.onSurfaceVariant,
  },
  emailHighlight: {
    fontWeight: '600',
    color: mukokoTheme.colors.onSurface,
  },
  input: {
    marginBottom: mukokoTheme.spacing.md,
    backgroundColor: mukokoTheme.colors.surface,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
  },
  button: {
    marginTop: mukokoTheme.spacing.md,
  },
  buttonContent: {
    paddingVertical: mukokoTheme.spacing.sm,
  },
  linkButton: {
    marginTop: mukokoTheme.spacing.lg,
  },
  homeButton: {
    marginTop: mukokoTheme.spacing.lg,
    alignSelf: 'center',
  },
});
