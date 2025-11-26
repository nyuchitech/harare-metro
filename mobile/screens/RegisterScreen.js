import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Surface, Divider, HelperText, Icon } from 'react-native-paper';
import { mukokoTheme } from '../theme';
import { auth } from '../api/client';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (username && !/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
      setError('Username must be 3-30 characters (letters, numbers, underscore, hyphen only)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use centralized auth service (auto-login included)
      const result = await auth.signUp(email, password, displayName);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Navigate to onboarding
      navigation.reset({
        index: 0,
        routes: [{ name: 'Onboarding' }],
      });
    } catch (err) {
      console.error('[RegisterScreen] Error:', err);
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
            Create your account
          </Text>
        </View>

        {/* Form Card */}
        <Surface style={styles.card} elevation={2}>
          {/* Error Message */}
          {error && (
            <Surface style={styles.errorBanner} elevation={0}>
              <Text style={styles.errorText}>{error}</Text>
            </Surface>
          )}

          {/* Username Field */}
          <TextInput
            mode="outlined"
            label="Username (optional)"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoComplete="username"
            left={<TextInput.Affix text="@" />}
            style={styles.input}
            outlineColor={mukokoTheme.colors.outline}
            activeOutlineColor={mukokoTheme.colors.primary}
          />
          <HelperText type="info">
            Optional. Auto-generated from email if not provided.
          </HelperText>

          {/* Display Name Field */}
          <TextInput
            mode="outlined"
            label="Display Name (optional)"
            value={displayName}
            onChangeText={setDisplayName}
            autoComplete="name"
            style={styles.input}
            outlineColor={mukokoTheme.colors.outline}
            activeOutlineColor={mukokoTheme.colors.primary}
          />
          <HelperText type="info">
            Optional
          </HelperText>

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
          <HelperText type="info">
            Minimum 8 characters
          </HelperText>

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading || !email || !password}
            style={styles.button}
            contentStyle={styles.buttonContent}
            icon={() => <Icon source="account-plus" size={20} color={mukokoTheme.colors.onPrimary} />}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Text variant="bodySmall" style={styles.dividerText}>or</Text>
            <Divider style={styles.divider} />
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text variant="bodyMedium" style={styles.loginText}>
              Already have an account?{' '}
            </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              labelStyle={styles.loginButtonLabel}
              compact
            >
              Sign in
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
    marginBottom: mukokoTheme.spacing.xs,
    backgroundColor: mukokoTheme.colors.surface,
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
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    color: mukokoTheme.colors.onSurfaceVariant,
  },
  loginButtonLabel: {
    color: mukokoTheme.colors.primary,
    fontWeight: '600',
  },
  homeButton: {
    marginTop: mukokoTheme.spacing.lg,
    alignSelf: 'center',
  },
});
