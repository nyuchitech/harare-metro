import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("search", "routes/search.tsx"),
  route("bytes", "routes/bytes.tsx"),

  // Auth routes
  route("auth/login", "routes/auth.login.tsx"),
  route("auth/register", "routes/auth.register.tsx"),
  route("auth/forgot-password", "routes/auth.forgot-password.tsx"),

  // Onboarding route
  route("onboarding", "routes/onboarding.tsx"),

  // Settings routes
  route("settings/profile", "routes/settings.profile.tsx"),

  // User profile route
  route("@/:username", "routes/@.$username.tsx"),

  // Article route (must be last to avoid conflicts)
  route(":source/:slug", "routes/$source.$slug.tsx"),
] satisfies RouteConfig;
