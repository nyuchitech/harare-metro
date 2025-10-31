import { Form, Link, useActionData, useNavigate, redirect } from "react-router";
import { useState } from "react";
import { LogIn } from "lucide-react";

export async function loader() {
  // Simple loader to prevent 404 on data fetches
  return null;
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const response = await fetch(
      "https://admin.hararemetro.co.zw/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      return { error: error.error || "Login failed" };
    }

    const data = await response.json() as { session: { access_token: string }; user: any };

    // Set cookie and redirect
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
        "Set-Cookie": `auth_token=${data.session.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
      },
    });
  } catch (error) {
    return { error: "Network error. Please try again." };
  }
}

export default function Login() {
  const actionData = useActionData<{ error?: string }>();
  const [loading, setLoading] = useState(false);

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
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl">
          <Form method="post" onSubmit={() => setLoading(true)}>
            {/* Error Message */}
            {actionData?.error && (
              <div className="mb-6 p-4 bg-[hsl(var(--zw-red))]/10 border border-[hsl(var(--zw-red))]/20 rounded-xl text-[hsl(var(--zw-red))]">
                {actionData.error}
              </div>
            )}

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

            {/* Password Field */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-semibold">
                  Password
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-[hsl(var(--zw-green))] hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-xl focus:border-[hsl(var(--zw-green))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--zw-green))]/20 transition-colors"
                placeholder="••••••••"
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
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
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

          {/* Register Link */}
          <div className="text-center">
            <p className="text-gray-400">
              Don't have an account?{" "}
              <Link
                to="/auth/register"
                className="text-[hsl(var(--zw-green))] hover:underline font-semibold"
              >
                Sign up
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
