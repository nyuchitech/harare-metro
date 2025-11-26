import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.jsx"),
  route("search", "routes/search.jsx"),
  route("bytes", "routes/bytes.jsx"),

  // Auth routes
  route("auth/login", "routes/auth.login.jsx"),
  route("auth/register", "routes/auth.register.jsx"),
  route("auth/forgot-password", "routes/auth.forgot-password.jsx"),

  // Onboarding route
  route("onboarding", "routes/onboarding.jsx"),

  // Settings routes
  route("settings/profile", "routes/settings.profile.jsx"),

  // User profile routes
  route("@/:username", "routes/@.$username.jsx"),
  route(":username", "routes/$username.jsx"),

  // Article route (must be last to avoid conflicts)
  route(":source/:slug", "routes/$source.$slug.jsx"),
];
