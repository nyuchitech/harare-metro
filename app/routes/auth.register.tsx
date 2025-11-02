import { Form, Link, useActionData } from "react-router";
import type { Route } from "./+types/auth.register";
import { useState } from "react";
import { UserPlus } from "lucide-react";

export async function loader({ request }: Route.LoaderArgs) {
  // Simple loader to prevent 404 on data fetches
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;
  const displayName = formData.get("displayName") as string;

  try {
    const response = await fetch(
      "https://admin.hararemetro.co.zw/api/auth/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username, displayName }),
      }
    );

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      return { error: error.error || "Registration failed" };
    }

    // Auto-login after registration
    const loginResponse = await fetch(
      "https://admin.hararemetro.co.zw/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );

    if (loginResponse.ok) {
      const data = await loginResponse.json() as { session: { access_token: string } };
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/onboarding",
          "Set-Cookie": `auth_token=${data.session.access_token}; Domain=.hararemetro.co.zw; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
        },
      });
    }

    // If auto-login fails, redirect to login
    return new Response(null, {
      status: 302,
      headers: { Location: "/auth/login" },
    });
  } catch (error) {
    return { error: "Network error. Please try again." };
  }
}

export default function Register() {
  const actionData = useActionData<{ error?: string }>();
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center px-4 py-8">
      {/* Zimbabwe Flag Strip */}
      <div className="fixed top-0 left-0 w-2 h-screen z-50 bg-gradient-to-b from-[hsl(var(--zw-green))] via-[hsl(var(--zw-yellow))] via-40% via-[hsl(var(--zw-red))] via-60% via-[hsl(var(--zw-black))] to-[hsl(var(--zw-white))]" />

      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2">
            Harare <span className="text-[hsl(var(--zw-green))]">Metro</span>
          </h1>
          <p className="text-gray-400">Create your account</p>
        </div>

        {/* Register Form */}
        <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl">
          <Form method="post" onSubmit={() => setLoading(true)}>
            {/* Error Message */}
            {actionData?.error && (
              <div className="mb-6 p-4 bg-[hsl(var(--zw-red))]/10 border border-[hsl(var(--zw-red))]/20 rounded-xl text-[hsl(var(--zw-red))]">
                {actionData.error}
              </div>
            )}

            {/* Username Field */}
            <div className="mb-6">
              <label
                htmlFor="username"
                className="block text-sm font-semibold mb-2"
              >
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  @
                </span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  pattern="[a-zA-Z0-9_-]{3,30}"
                  title="3-30 characters, letters, numbers, underscore, and hyphen only"
                  className="w-full pl-8 pr-4 py-3 bg-black border border-gray-700 rounded-xl focus:border-[hsl(var(--zw-green))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--zw-green))]/20 focus-visible:ring-2 focus-visible:ring-[hsl(var(--zw-green))] focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-colors"
                  placeholder="johndoe"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Optional. Auto-generated from email if not provided.
              </p>
            </div>

            {/* Display Name Field */}
            <div className="mb-6">
              <label
                htmlFor="displayName"
                className="block text-sm font-semibold mb-2"
              >
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-xl focus:border-[hsl(var(--zw-green))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--zw-green))]/20 focus-visible:ring-2 focus-visible:ring-[hsl(var(--zw-green))] focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-colors"
                placeholder="John Doe"
              />
              <p className="text-xs text-gray-500 mt-1">Optional</p>
            </div>

            {/* Email Field */}
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-sm font-semibold mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-xl focus:border-[hsl(var(--zw-green))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--zw-green))]/20 focus-visible:ring-2 focus-visible:ring-[hsl(var(--zw-green))] focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-colors"
                placeholder="you@example.com"
              />
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-semibold mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                minLength={8}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-xl focus:border-[hsl(var(--zw-green))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--zw-green))]/20 focus-visible:ring-2 focus-visible:ring-[hsl(var(--zw-green))] focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-colors"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 8 characters
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
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </>
              )}
            </button>
          </Form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-sm text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-400">
              Already have an account?{" "}
              <Link
                to="/auth/login"
                className="text-[hsl(var(--zw-green))] hover:underline font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
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
