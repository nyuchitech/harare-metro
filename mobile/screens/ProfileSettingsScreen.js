import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Surface, SegmentedButtons, Avatar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mukokoTheme } from '../theme';
import { User, AtSign, FileText, Image as ImageIcon, Check, AlertCircle, ArrowLeft } from 'lucide-react-native';

const AUTH_TOKEN_KEY = '@mukoko_auth_token';

export default function ProfileSettingsScreen({ navigation }) {
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Profile form fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Username form field
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

      if (!token) {
        navigation.navigate('Login');
        return;
      }

      const response = await fetch(
        'https://admin.hararemetro.co.zw/api/user/me/profile',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        navigation.navigate('Login');
        return;
      }

      const profileData = await response.json();
      setProfile(profileData);
      setDisplayName(profileData.displayName || profileData.display_name || '');
      setBio(profileData.bio || '');
      setAvatarUrl(profileData.avatarUrl || profileData.avatar_url || '');
    } catch (err) {
      console.error('Error loading profile:', err);
      navigation.navigate('Login');
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(
        'https://admin.hararemetro.co.zw/api/user/me/profile',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            displayName: displayName || undefined,
            bio: bio || undefined,
            avatarUrl: avatarUrl || undefined,
          }),
        }
      );

      if (response.ok) {
        setSuccess('Profile updated successfully');
        await loadProfile();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!newUsername || !/^[a-zA-Z0-9_-]{3,30}$/.test(newUsername)) {
      setError('Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(
        'https://admin.hararemetro.co.zw/api/user/me/username',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username: newUsername }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuccess('Username updated successfully');
        setNewUsername('');
        await loadProfile();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update username');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <Surface style={styles.header} elevation={1}>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          icon={() => <ArrowLeft size={24} color={mukokoTheme.colors.onSurface} />}
          style={styles.backButton}
        >
          Back
        </Button>
        <Text variant="titleLarge" style={styles.headerTitle}>
          Profile Settings
        </Text>
      </Surface>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Success/Error Messages */}
        {success && (
          <Surface style={styles.successBanner} elevation={0}>
            <Check size={20} color={mukokoTheme.colors.success} />
            <Text style={styles.successText}>{success}</Text>
          </Surface>
        )}

        {error && (
          <Surface style={styles.errorBanner} elevation={0}>
            <AlertCircle size={20} color={mukokoTheme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </Surface>
        )}

        {/* Section Tabs */}
        <SegmentedButtons
          value={activeSection}
          onValueChange={setActiveSection}
          buttons={[
            { value: 'profile', label: 'Profile Info' },
            { value: 'username', label: 'Username' },
          ]}
          style={styles.segmentedButtons}
        />

        {/* Profile Info Section */}
        {activeSection === 'profile' && (
          <Surface style={styles.card} elevation={2}>
            <Text variant="headlineSmall" style={styles.sectionTitle}>
              Update Profile Information
            </Text>

            {/* Display Name */}
            <TextInput
              mode="outlined"
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              left={<TextInput.Icon icon={() => <User size={20} color={mukokoTheme.colors.onSurfaceVariant} />} />}
              style={styles.input}
              outlineColor={mukokoTheme.colors.outline}
              activeOutlineColor={mukokoTheme.colors.primary}
            />
            <Text style={styles.helperText}>
              Your display name appears on your profile and with your activity
            </Text>

            {/* Bio */}
            <TextInput
              mode="outlined"
              label="Bio"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              maxLength={160}
              left={<TextInput.Icon icon={() => <FileText size={20} color={mukokoTheme.colors.onSurfaceVariant} />} />}
              style={styles.input}
              outlineColor={mukokoTheme.colors.outline}
              activeOutlineColor={mukokoTheme.colors.primary}
            />
            <Text style={styles.helperText}>
              Maximum 160 characters
            </Text>

            {/* Avatar URL */}
            <TextInput
              mode="outlined"
              label="Avatar URL"
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              keyboardType="url"
              autoCapitalize="none"
              left={<TextInput.Icon icon={() => <ImageIcon size={20} color={mukokoTheme.colors.onSurfaceVariant} />} />}
              style={styles.input}
              outlineColor={mukokoTheme.colors.outline}
              activeOutlineColor={mukokoTheme.colors.primary}
            />
            <Text style={styles.helperText}>
              Provide a URL to an image for your profile picture
            </Text>

            {/* Avatar Preview */}
            {avatarUrl && (
              <Surface style={styles.previewCard} elevation={0}>
                <Text variant="bodySmall" style={styles.previewLabel}>
                  Current Avatar:
                </Text>
                <View style={styles.avatarPreview}>
                  <Avatar.Image
                    size={64}
                    source={{ uri: avatarUrl }}
                    style={styles.avatar}
                  />
                  <View>
                    <Text variant="bodyLarge" style={styles.previewName}>
                      {displayName || profile.username}
                    </Text>
                    <Text variant="bodySmall" style={styles.previewUsername}>
                      @{profile.username}
                    </Text>
                  </View>
                </View>
              </Surface>
            )}

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleUpdateProfile}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              icon={() => <Check size={20} color={mukokoTheme.colors.onPrimary} />}
            >
              {loading ? 'Saving changes...' : 'Save Profile'}
            </Button>
          </Surface>
        )}

        {/* Username Section */}
        {activeSection === 'username' && (
          <Surface style={styles.card} elevation={2}>
            <Text variant="headlineSmall" style={styles.sectionTitle}>
              Change Username
            </Text>
            <Text variant="bodySmall" style={styles.sectionSubtitle}>
              Your username is used in your profile URL: @{profile.username}
            </Text>

            {/* Warning */}
            <Surface style={styles.warningBanner} elevation={0}>
              <Text style={styles.warningText}>
                <Text style={styles.warningTextBold}>Warning:</Text> Changing your username will update your profile URL.
                Old links to your profile may no longer work.
              </Text>
            </Surface>

            {/* Current Username */}
            <Text variant="labelMedium" style={styles.label}>
              Current Username
            </Text>
            <Surface style={styles.currentUsername} elevation={0}>
              <Text style={styles.currentUsernameText}>@{profile.username}</Text>
            </Surface>

            {/* New Username */}
            <TextInput
              mode="outlined"
              label="New Username"
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
              left={<TextInput.Icon icon={() => <AtSign size={20} color={mukokoTheme.colors.onSurfaceVariant} />} />}
              style={styles.input}
              outlineColor={mukokoTheme.colors.outline}
              activeOutlineColor={mukokoTheme.colors.primary}
            />
            <Text style={styles.helperText}>
              3-30 characters. Letters, numbers, underscores, and hyphens only.
            </Text>

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleUpdateUsername}
              loading={loading}
              disabled={loading || !newUsername}
              style={styles.button}
              contentStyle={styles.buttonContent}
              icon={() => <Check size={20} color={mukokoTheme.colors.onPrimary} />}
            >
              {loading ? 'Updating username...' : 'Update Username'}
            </Button>
          </Surface>
        )}

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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mukokoTheme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: mukokoTheme.spacing.md,
    backgroundColor: mukokoTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: mukokoTheme.colors.outline,
  },
  backButton: {
    marginRight: mukokoTheme.spacing.sm,
  },
  headerTitle: {
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
  },
  scrollContent: {
    padding: mukokoTheme.spacing.lg,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mukokoTheme.spacing.sm,
    padding: mukokoTheme.spacing.md,
    marginBottom: mukokoTheme.spacing.lg,
    borderRadius: mukokoTheme.roundness,
    backgroundColor: `${mukokoTheme.colors.success}15`,
    borderWidth: 1,
    borderColor: `${mukokoTheme.colors.success}30`,
  },
  successText: {
    color: mukokoTheme.colors.success,
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mukokoTheme.spacing.sm,
    padding: mukokoTheme.spacing.md,
    marginBottom: mukokoTheme.spacing.lg,
    borderRadius: mukokoTheme.roundness,
    backgroundColor: `${mukokoTheme.colors.error}15`,
    borderWidth: 1,
    borderColor: `${mukokoTheme.colors.error}30`,
  },
  errorText: {
    color: mukokoTheme.colors.error,
    flex: 1,
  },
  segmentedButtons: {
    marginBottom: mukokoTheme.spacing.lg,
  },
  card: {
    padding: mukokoTheme.spacing.lg,
    borderRadius: mukokoTheme.roundness * 2,
    backgroundColor: mukokoTheme.colors.surface,
  },
  sectionTitle: {
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
    marginBottom: mukokoTheme.spacing.md,
  },
  sectionSubtitle: {
    color: mukokoTheme.colors.onSurfaceVariant,
    marginBottom: mukokoTheme.spacing.lg,
  },
  warningBanner: {
    padding: mukokoTheme.spacing.md,
    marginBottom: mukokoTheme.spacing.lg,
    borderRadius: mukokoTheme.roundness,
    backgroundColor: `${mukokoTheme.colors.warning}15`,
    borderWidth: 1,
    borderColor: `${mukokoTheme.colors.warning}30`,
  },
  warningText: {
    color: mukokoTheme.colors.warning,
  },
  warningTextBold: {
    fontWeight: '700',
  },
  label: {
    marginBottom: mukokoTheme.spacing.xs,
    color: mukokoTheme.colors.onSurfaceVariant,
  },
  currentUsername: {
    padding: mukokoTheme.spacing.md,
    marginBottom: mukokoTheme.spacing.lg,
    borderRadius: mukokoTheme.roundness,
    backgroundColor: mukokoTheme.colors.surfaceVariant,
  },
  currentUsernameText: {
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
  previewCard: {
    padding: mukokoTheme.spacing.md,
    marginBottom: mukokoTheme.spacing.lg,
    borderRadius: mukokoTheme.roundness,
    backgroundColor: mukokoTheme.colors.surfaceVariant,
  },
  previewLabel: {
    color: mukokoTheme.colors.onSurfaceVariant,
    marginBottom: mukokoTheme.spacing.sm,
  },
  avatarPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mukokoTheme.spacing.md,
  },
  avatar: {
    backgroundColor: mukokoTheme.colors.primary,
  },
  previewName: {
    fontWeight: '600',
  },
  previewUsername: {
    color: mukokoTheme.colors.onSurfaceVariant,
  },
  button: {
    marginTop: mukokoTheme.spacing.md,
  },
  buttonContent: {
    paddingVertical: mukokoTheme.spacing.sm,
  },
  homeButton: {
    marginTop: mukokoTheme.spacing.lg,
    alignSelf: 'center',
  },
});
