import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    define: {
      "process.env": env,
    },
    plugins: [
      react(),
      tsconfigPaths(),
      svgr(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        devOptions: {
          enabled: false,
        },
        includeAssets: [
          "logo/main-logo.svg",
          "pwa/icon-192.png",
          "pwa/icon-512.png",
          "pwa/icon-maskable-192.png",
          "pwa/icon-maskable-512.png",
          "pwa/apple-touch-icon-152.png",
          "pwa/apple-touch-icon-167.png",
          "pwa/apple-touch-icon-180.png",
        ],
        manifest: {
          id: "/",
          name: "Worldwide Word Ministries",
          short_name: "Worldwide Word Ministries",
          description: "WWM church management portal.",
          start_url: "/",
          scope: "/",
          display: "standalone",
          display_override: ["standalone", "minimal-ui", "browser"],
          orientation: "portrait-primary",
          background_color: "#FFFFFF",
          theme_color: "#080D2D",
          prefer_related_applications: false,
          icons: [
            {
              src: "/pwa/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa/icon-maskable-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "/pwa/icon-maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          importScripts: ["pwa-push-worker.js"],
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallbackDenylist: [/^\/api\//],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: ({ request }) =>
                request.destination === "style" ||
                request.destination === "script" ||
                request.destination === "worker",
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "app-assets",
              },
            },
            {
              urlPattern: ({ request }) => request.destination === "image",
              handler: "CacheFirst",
              options: {
                cacheName: "app-images",
                expiration: {
                  maxEntries: 120,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
          ],
        },
      }),
    ],
  };
});
