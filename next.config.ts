import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Disable in dev
});

const nextConfig = withPWA({
  reactStrictMode: true,
});

export default nextConfig;
