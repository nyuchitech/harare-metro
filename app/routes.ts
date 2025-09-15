import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("search", "routes/search.tsx"),
  route("bytes", "routes/bytes.tsx"),
  route(":source/:slug", "routes/$source.$slug.tsx"),
] satisfies RouteConfig;
