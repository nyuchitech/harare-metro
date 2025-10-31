import { Form, Link, useActionData } from "react-router";
import type { Route } from "./+types/auth.forgot-password";
import { useState } from "react";
import { Mail, Key } from "lucide-react";

export async function loader() {
  // Simple loader to prevent 404 on data fetches
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const step = formData.get("step") as string;

  if (step === "request") {
    const email = formData.get("email") as string;

    try {
      const response = await fetch(
        "https://admin.hararemetro.co.zw/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      if (response.ok) {
        return { success: true, step: "reset", email };
      }

      return { error: "Failed to send reset code" };
    } catch (error) {
      return { error: "Network error. Please try again." };
    }
  }

  if (step === "reset") {
    const email = formData.get("email") as string;
    const code = formData.get("code") as string;
    const newPassword = formData.get("newPassword") as string;

    try {
      const response = await fetch(
        "https://admin.hararemetro.co.zw/api/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code, newPassword }),
        }
      );

      if (response.ok) {
        return new Response(null, {
          status: 302,
          headers: { Location: "/auth/login?reset=success" },
        });
      }

      const error = await response.json();
      return { error: error.error || "Invalid or expired code", step: "reset", email };
    } catch (error) {
      return { error: "Network error. Please try again.", step: "reset" };
    }
  }

  return { error: "Invalid request" };
}

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>();
  const [loading, setLoading] = useState(false);
  const isResetStep = actionData?.step === "reset";

  return (
    <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center px-4">
      {/* Zimbabwe Flag Strip */}
      <div className="fixed top-0 left-0 w-2 h-screen z-50 bg-gradient-to-b from-[hsl(var(--zw-green))] via-[hsl(var(--zw-yellow))] via-40% via-[hsl(var(--zw-red))] via-60% via-[hsl(var(--zw-black))] to-[hsl(var(--zw-white))]" />

      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2">
            Harare <span className="text-[hsl(var(--zw-green))]">Metro</span>
          </h1>
          <p className="text-gray-400">
            {isResetStep ? "Reset your password" : "Forgot your password?"}
          </p>
        </div>

        {/* Form */}
        <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl">
          {!isResetStep ? (
            /* Step 1: Request Reset Code */
            <Form method="post" onSubmit={() => setLoading(true)}>
              <input type="hidden" name="step" value="request" />

              {/* Success Message */}
              {actionData?.success && (
                <div className="mb-6 p-4 bg-[hsl(var(--zw-green))]/10 border border-[hsl(var(--zw-green))]/20 rounded-xl text-[hsl(var(--zw-green))]">
                  Check your email for the reset code!
                </div>
              )}

              {/* Error Message */}
              {actionData?.error && !actionData.success && (
                <div className="mb-6 p-4 bg-[hsl(var(--zw-red))]/10 border border-[hsl(var(--zw-red))]/20 rounded-xl text-[hsl(var(--zw-red))]">
                  {actionData.error}
                </div>
              )}

              <p className="text-gray-400 text-sm mb-6">
                Enter your email address and we'll send you a 6-digit reset code.
                The code expires in 15 minutes.
              </p>

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
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-xl focus:border-[hsl(var(--zw-green))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--zw-green))]/20 transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[hsl(var(--zw-green))] hover:bg-[hsl(var(--zw-green))]/80 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending code...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Send Reset Code
                  </>
                )}
              </button>
            </Form>
          ) : (
            /* Step 2: Enter Code and New Password */
            <Form method="post" onSubmit={() => setLoading(true)}>
              <input type="hidden" name="step" value="reset" />
              <input type="hidden" name="email" value={actionData.email} />

              {/* Error Message */}
              {actionData?.error && (
                <div className="mb-6 p-4 bg-[hsl(var(--zw-red))]/10 border border-[hsl(var(--zw-red))]/20 rounded-xl text-[hsl(var(--zw-red))]">
                  {actionData.error}
                </div>
              )}

              <p className="text-gray-400 text-sm mb-6">
                Enter the 6-digit code sent to{" "}
                <span className="font-semibold text-white">{actionData.email}</span>
              </p>

              {/* Reset Code Field */}
              <div className="mb-6">
                <label htmlFor="code" className="block text-sm font-semibold mb-2">
                  Reset Code
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  required
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-xl focus:border-[hsl(var(--zw-green))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--zw-green))]/20 transition-colors text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              </div>

              {/* New Password Field */}
              <div className="mb-6">
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-semibold mb-2"
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-xl focus:border-[hsl(var(--zw-green))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--zw-green))]/20 transition-colors"
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
                className="w-full py-3 bg-[hsl(var(--zw-green))] hover:bg-[hsl(var(--zw-green))]/80 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Resetting password...
                  </>
                ) : (
                  <>
                    <Key className="w-5 h-5" />
                    Reset Password
                  </>
                )}
              </button>
            </Form>
          )}

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              to="/auth/login"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Login
            </Link>
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
