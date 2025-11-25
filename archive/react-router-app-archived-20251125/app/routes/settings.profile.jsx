import { Form, useActionData, useLoaderData, redirect, Link } from "react-router";

import { useState } from "react";
import { User, AtSign, FileText, Image, ArrowLeft, Check, AlertCircle } from "lucide-react";

interface Profile {
  username: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

export async function loader({ request }) {
  // Check if user is authenticated
  const cookies = request.headers.get("Cookie") || "";
  const tokenMatch = cookies.match(/auth_token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;

  if (!token) {
    return redirect("/auth/login");
  }

  // Fetch user profile
  try {
    const response = await fetch(
      "https://admin.hararemetro.co.zw/api/user/me/profile",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return redirect("/auth/login");
    }

    const profile = await response.json() as Profile;
    return { profile, token };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return redirect("/auth/login");
  }
}

export async function action({ request }) {
  const cookies = request.headers.get("Cookie") || "";
  const tokenMatch = cookies.match(/auth_token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;

  if (!token) {
    return { error: "Not authenticated" };
  }

  const formData = await request.formData();
  const updateType = formData.get("updateType");

  try {
    if (updateType === "username") {
      const username = formData.get("username");

      // Validate username format
      if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
        return {
          error: "Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens",
        };
      }

      const response = await fetch(
        "https://admin.hararemetro.co.zw/api/user/me/username",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { success: true, message: "Username updated successfully", newUsername: data.username };
      }

      const error = await response.json();
      return { error: error.error || "Failed to update username" };
    }

    if (updateType === "profile") {
      const displayName = formData.get("displayName");
      const bio = formData.get("bio");
      const avatarUrl = formData.get("avatarUrl");

      const response = await fetch(
        "https://admin.hararemetro.co.zw/api/user/me/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
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
        return { success: true, message: "Profile updated successfully" };
      }

      const error = await response.json();
      return { error: error.error || "Failed to update profile" };
    }

    return { error: "Invalid update type" };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { error: "Network error. Please try again." };
  }
}

export default function ProfileSettings() {
  const { profile } = useLoaderData();
  const actionData = useActionData();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  // Guard: profile should always be defined (loader redirects otherwise)
  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Zimbabwe Flag Strip */}
      <div className="fixed top-0 left-0 w-2 h-screen z-50 bg-gradient-to-b from-[hsl(var(--zw-green))] via-[hsl(var(--zw-yellow))] via-40% via-[hsl(var(--zw-red))] via-60% via-[hsl(var(--zw-black))] to-[hsl(var(--zw-white))]" />

      {/* Header */}
      <header className="sticky top-0 bg-black/80 backdrop-blur-lg border-b border-gray-800 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            to={`/@${profile.username}`}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-serif font-bold">Profile Settings</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success/Error Messages */}
        {actionData?.success && (
          <div className="mb-6 p-4 bg-[hsl(var(--zw-green))]/10 border border-[hsl(var(--zw-green))]/20 rounded-xl flex items-center gap-3">
            <Check className="w-5 h-5 text-[hsl(var(--zw-green))]" />
            <p className="text-[hsl(var(--zw-green))]">{actionData.message}</p>
          </div>
        )}

        {actionData?.error && (
          <div className="mb-6 p-4 bg-[hsl(var(--zw-red))]/10 border border-[hsl(var(--zw-red))]/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[hsl(var(--zw-red))]" />
            <p className="text-[hsl(var(--zw-red))]">{actionData.error}</p>
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-900 rounded-xl p-1">
          <button
            onClick={() => setActiveSection("profile")}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeSection === "profile"
                ? "bg-[hsl(var(--zw-green))] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Profile Info
          </button>
          <button
            onClick={() => setActiveSection("username")}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeSection === "username"
                ? "bg-[hsl(var(--zw-green))] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Username
          </button>
        </div>

        {/* Profile Info Section */}
        {activeSection === "profile" && (
          <div className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-2xl font-serif font-bold mb-6">Update Profile Information</h2>

            <Form method="post" onSubmit={() => setLoading(true)}>
              <input type="hidden" name="updateType" value="profile" />

              {/* Display Name */}
              <div className="mb-6">
                <label htmlFor="displayName" className="block text-sm font-semibold mb-2">
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    defaultValue={profile.displayName || ""}
                    className="w-full pl-12 pr-4 py-3 bg-black border border-gray-700 rounded-xl focus:border-[hsl(var(--zw-green))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--zw-green))]/20 focus-visible:ring-2 focus-visible:ring-[hsl(var(--zw-green))] focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-colors"
                    placeholder="Your Name"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Your display name appears on your profile and with your activity
                </p>
              </div>

              {/* Bio */}
              <div className="mb-6">
                <label htmlFor="bio" className="block text-sm font-semibold mb-2">
                  Bio
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    defaultValue={profile.bio || ""}
                    maxLength={160}
                    className="w-full pl-12 pr-4 py-3 bg-black border border-gray-700 rounded-xl focus:border-[hsl(var(--zw-green))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--zw-green))]/20 focus-visible:ring-2 focus-visible:ring-[hsl(var(--zw-green))] focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-colors resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum 160 characters
                </p>
              </div>

              {/* Avatar URL */}
              <div className="mb-6">
                <label htmlFor="avatarUrl" className="block text-sm font-semibold mb-2">
                  Avatar URL
                </label>
                <div className="relative">
                  <Image className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="url"
                    id="avatarUrl"
                    name="avatarUrl"
                    defaultValue={profile.avatarUrl || ""}
                    className="w-full pl-12 pr-4 py-3 bg-black border border-gray-700 rounded-xl focus:border-[hsl(var(--zw-green))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--zw-green))]/20 focus-visible:ring-2 focus-visible:ring-[hsl(var(--zw-green))] focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-colors"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Provide a URL to an image for your profile picture
                </p>
              </div>

              {/* Preview */}
              {profile.avatarUrl && (
                <div className="mb-6 p-4 bg-black rounded-xl border border-gray-800">
                  <p className="text-sm text-gray-400 mb-2">Current Avatar:</p>
                  <div className="flex items-center gap-4">
                    <img
                      src={profile.avatarUrl}
                      alt="Avatar preview"
                      className="w-16 h-16 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || profile.username)}&background=00A651&color=fff&size=128`;
                      }}
                    />
                    <div>
                      <p className="font-semibold">{profile.displayName || profile.username}</p>
                      <p className="text-sm text-gray-400">@{profile.username}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[hsl(var(--zw-green))] hover:bg-[hsl(var(--zw-green))]/80 rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--zw-green))] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving changes...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Save Profile
                  </>
                )}
              </button>
            </Form>
          </div>
        )}

        {/* Username Section */}
        {activeSection === "username" && (
          <div className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-2xl font-serif font-bold mb-2">Change Username</h2>
            <p className="text-gray-400 text-sm mb-6">
              Your username is used in your profile URL: @{profile.username}
            </p>

            <div className="mb-6 p-4 bg-[hsl(var(--zw-yellow))]/10 border border-[hsl(var(--zw-yellow))]/20 rounded-xl">
              <p className="text-[hsl(var(--zw-yellow))] text-sm">
                <strong>Warning:</strong> Changing your username will update your profile URL.
                Old links to your profile may no longer work.
              </p>
            </div>

            <Form method="post" onSubmit={() => setLoading(true)}>
              <input type="hidden" name="updateType" value="username" />

              {/* Current Username */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-500">
                  Current Username
                </label>
                <div className="px-4 py-3 bg-black border border-gray-800 rounded-xl text-gray-400">
                  @{profile.username}
                </div>
              </div>

              {/* New Username */}
              <div className="mb-6">
                <label htmlFor="username" className="block text-sm font-semibold mb-2">
                  New Username
                </label>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    required
                    pattern="[a-zA-Z0-9_-]{3,30}"
                    title="3-30 characters, letters, numbers, underscore, and hyphen only"
                    className="w-full pl-12 pr-4 py-3 bg-black border border-gray-700 rounded-xl focus:border-[hsl(var(--zw-green))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--zw-green))]/20 focus-visible:ring-2 focus-visible:ring-[hsl(var(--zw-green))] focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-colors"
                    placeholder="new_username"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  3-30 characters. Letters, numbers, underscores, and hyphens only.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[hsl(var(--zw-green))] hover:bg-[hsl(var(--zw-green))]/80 rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--zw-green))] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating username...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Update Username
                  </>
                )}
              </button>
            </Form>
          </div>
        )}

        {/* Additional Settings */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
