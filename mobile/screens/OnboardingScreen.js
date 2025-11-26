import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, TextInput, Button, Surface, Chip, Icon } from 'react-native-paper';
import { mukokoTheme } from '../theme';
import { categories as categoriesAPI } from '../api/client';

const { width } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [error, setError] = useState('');

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const result = await categoriesAPI.getAll();
      if (result.data && result.data.categories) {
        setCategories(result.data.categories);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    }
  };

  const checkUsername = async (value) => {
    if (!value || value.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(value)) {
      setUsernameError('Only letters, numbers, and underscores allowed');
      return false;
    }

    setCheckingUsername(true);
    try {
      // Note: check-username endpoint not in centralized client yet
      // TODO: Add to API client if backend supports it
      const response = await fetch(
        `https://mukoko-news-backend.nyuchi.workers.dev/api/auth/check-username?username=${encodeURIComponent(value)}`
      );
      const data = await response.json();

      if (!data.available) {
        setUsernameError(data.error || 'Username is already taken');
        return false;
      }

      setUsernameError('');
      return true;
    } catch (err) {
      setUsernameError('Error checking username');
      return false;
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value) => {
    setUsername(value);
    if (value.length >= 3) {
      checkUsername(value);
    } else if (value.length > 0) {
      setUsernameError('Username must be at least 3 characters');
    } else {
      setUsernameError('');
    }
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleContinue = async () => {
    if (step === 1) {
      if (!username || username.length < 3) {
        setUsernameError('Username must be at least 3 characters');
        return;
      }

      const isAvailable = await checkUsername(username);
      if (!isAvailable) {
        return;
      }

      setStep(2);
    } else {
      if (selectedCategories.length < 3) {
        setError('Please select at least 3 topics');
        return;
      }

      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

      if (!token) {
        setError('Not authenticated');
        return;
      }

      // Update username
      const usernameResponse = await fetch(
        'https://admin.hararemetro.co.zw/api/user/me/profile',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username }),
        }
      );

      if (!usernameResponse.ok) {
        const errorData = await usernameResponse.json();
        setError(errorData.error || 'Failed to update username');
        return;
      }

      // Update category interests
      for (const categoryId of selectedCategories) {
        await fetch(
          'https://admin.hararemetro.co.zw/api/user/me/category-interest',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              categoryId,
              initialScore: 10,
            }),
          }
        );
      }

      // Navigate to home
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
    } catch (err) {
      setError('Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainApp' }],
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, step >= 1 && styles.progressBarActive]} />
          <View style={[styles.progressBar, step >= 2 && styles.progressBarActive]} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon source="sparkles" size={32} color={mukokoTheme.colors.primary} />
          </View>
          <Text variant="headlineLarge" style={styles.title}>
            Welcome to Harare <Text style={styles.titleAccent}>Metro</Text>
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {step === 1 ? "Let's personalize your experience" : "Choose topics you care about"}
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <Surface style={styles.errorBanner} elevation={0}>
            <Text style={styles.errorText}>{error}</Text>
          </Surface>
        )}

        {/* Step 1: Username */}
        {step === 1 && (
          <Surface style={styles.card} elevation={2}>
            <View style={styles.stepHeader}>
              <Icon source="account" size={48} color={mukokoTheme.colors.primary} />
              <Text variant="titleLarge" style={styles.stepTitle}>
                Choose Your Username
              </Text>
              <Text variant="bodyMedium" style={styles.stepSubtitle}>
                This is how others will see you on Harare Metro
              </Text>
            </View>

            <TextInput
              mode="outlined"
              label="Username"
              value={username}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
              style={styles.input}
              outlineColor={usernameError ? mukokoTheme.colors.error : mukokoTheme.colors.outline}
              activeOutlineColor={usernameError ? mukokoTheme.colors.error : mukokoTheme.colors.primary}
              error={!!usernameError}
              right={
                checkingUsername ? (
                  <TextInput.Icon icon="loading" />
                ) : (
                  username.length >= 3 && !usernameError && (
                    <TextInput.Icon
                      icon={() => <Icon source="check" size={20} color={mukokoTheme.colors.success} />}
                    />
                  )
                )
              }
            />
            {usernameError ? (
              <Text style={styles.helperTextError}>{usernameError}</Text>
            ) : (
              <Text style={styles.helperText}>
                Letters, numbers, and underscores only. Minimum 3 characters.
              </Text>
            )}

            <Button
              mode="contained"
              onPress={handleContinue}
              disabled={!username || username.length < 3 || !!usernameError || checkingUsername}
              style={styles.button}
              contentStyle={styles.buttonContent}
              icon={() => <Icon source="arrow-right" size={20} color={mukokoTheme.colors.onPrimary} />}
            >
              {checkingUsername ? 'Checking...' : 'Continue'}
            </Button>
          </Surface>
        )}

        {/* Step 2: Category Interests */}
        {step === 2 && (
          <Surface style={styles.card} elevation={2}>
            <View style={styles.stepHeader}>
              <Text variant="titleLarge" style={styles.stepTitle}>
                Select Your Interests
              </Text>
              <Text variant="bodyMedium" style={styles.stepSubtitle}>
                Choose at least 3 topics you'd like to follow (you can change these later)
              </Text>
            </View>

            {/* Category Grid */}
            <View style={styles.categoryGrid}>
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => toggleCategory(category.id)}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipSelected,
                    ]}
                  >
                    <Text style={styles.categoryEmoji}>{category.emoji || '📰'}</Text>
                    <Text
                      style={[
                        styles.categoryName,
                        isSelected && styles.categoryNameSelected,
                      ]}
                    >
                      {category.name}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkmark}>
                        <Icon source="check" size={16} color={mukokoTheme.colors.onPrimary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selection Counter */}
            <Text style={styles.selectionCounter}>
              {selectedCategories.length === 0 && 'Select at least 3 topics'}
              {selectedCategories.length > 0 && selectedCategories.length < 3 &&
                `${selectedCategories.length} selected • ${3 - selectedCategories.length} more needed`}
              {selectedCategories.length >= 3 &&
                `${selectedCategories.length} topics selected`}
            </Text>

            {/* Navigation Buttons */}
            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={() => setStep(1)}
                style={[styles.button, styles.buttonHalf]}
                contentStyle={styles.buttonContent}
              >
                Back
              </Button>
              <Button
                mode="contained"
                onPress={handleContinue}
                disabled={selectedCategories.length < 3 || loading}
                loading={loading}
                style={[styles.button, styles.buttonHalf]}
                contentStyle={styles.buttonContent}
                icon={() => <Icon source="arrow-right" size={20} color={mukokoTheme.colors.onPrimary} />}
              >
                {loading ? 'Setting up...' : 'Get Started'}
              </Button>
            </View>
          </Surface>
        )}

        {/* Skip Option */}
        <Button
          mode="text"
          onPress={handleSkip}
          style={styles.skipButton}
        >
          Skip for now
        </Button>
      </ScrollView>
    </View>
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: mukokoTheme.spacing.sm,
    marginBottom: mukokoTheme.spacing.xl,
  },
  progressBar: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: mukokoTheme.colors.surfaceVariant,
  },
  progressBarActive: {
    backgroundColor: mukokoTheme.colors.primary,
  },
  header: {
    marginBottom: mukokoTheme.spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${mukokoTheme.colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: mukokoTheme.spacing.md,
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
    textAlign: 'center',
  },
  card: {
    padding: mukokoTheme.spacing.xl,
    borderRadius: mukokoTheme.roundness * 2,
    backgroundColor: mukokoTheme.colors.surface,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: mukokoTheme.spacing.lg,
  },
  stepTitle: {
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
    textAlign: 'center',
    marginTop: mukokoTheme.spacing.md,
    marginBottom: mukokoTheme.spacing.sm,
  },
  stepSubtitle: {
    textAlign: 'center',
    color: mukokoTheme.colors.onSurfaceVariant,
  },
  input: {
    marginBottom: mukokoTheme.spacing.xs,
    backgroundColor: mukokoTheme.colors.surface,
  },
  helperText: {
    fontSize: 12,
    color: mukokoTheme.colors.onSurfaceVariant,
    marginBottom: mukokoTheme.spacing.lg,
  },
  helperTextError: {
    fontSize: 12,
    color: mukokoTheme.colors.error,
    marginBottom: mukokoTheme.spacing.lg,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mukokoTheme.spacing.sm,
    marginBottom: mukokoTheme.spacing.lg,
    maxHeight: 400,
  },
  categoryChip: {
    width: (width - mukokoTheme.spacing.lg * 2 - mukokoTheme.spacing.xl * 2 - mukokoTheme.spacing.sm) / 2,
    padding: mukokoTheme.spacing.md,
    borderRadius: mukokoTheme.roundness,
    borderWidth: 2,
    borderColor: mukokoTheme.colors.outline,
    backgroundColor: mukokoTheme.colors.background,
    alignItems: 'center',
  },
  categoryChipSelected: {
    borderColor: mukokoTheme.colors.primary,
    backgroundColor: `${mukokoTheme.colors.primary}15`,
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: mukokoTheme.spacing.xs,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: mukokoTheme.colors.onSurface,
  },
  categoryNameSelected: {
    color: mukokoTheme.colors.primary,
  },
  checkmark: {
    position: 'absolute',
    top: mukokoTheme.spacing.xs,
    right: mukokoTheme.spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: mukokoTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCounter: {
    textAlign: 'center',
    color: mukokoTheme.colors.onSurfaceVariant,
    marginBottom: mukokoTheme.spacing.lg,
  },
  button: {
    marginTop: mukokoTheme.spacing.md,
  },
  buttonContent: {
    paddingVertical: mukokoTheme.spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: mukokoTheme.spacing.sm,
  },
  buttonHalf: {
    flex: 1,
  },
  skipButton: {
    marginTop: mukokoTheme.spacing.lg,
    alignSelf: 'center',
  },
});
