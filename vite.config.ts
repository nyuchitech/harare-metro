import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  build: {
    // Disable gzip reporting in CI to prevent hanging
    reportCompressedSize: false,
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress fast-xml-parser dynamic/static import warnings
        // This is intentional: RSSFeedService uses static import (frequent use)
        // NewsSourceManager uses dynamic import (occasional use for better performance)
        if (warning.message?.includes('fast-xml-parser') && warning.message?.includes('dynamically imported')) {
          return;
        }
        warn(warning);
      },
    },
  },
});
