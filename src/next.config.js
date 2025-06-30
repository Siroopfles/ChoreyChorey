/** @type {import('next').NextConfig} */
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  importScripts: ["/firebase-messaging-sw.js"],
  // Manifest properties for PWA
  name: "Chorey",
  short_name: "Chorey",
  description: "Het Gecentraliseerde Leefomgeving & Taakbeheer Intelligentie Systeem",
  start_url: "/dashboard",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#3b82f6",
  icons: [
    {
      src: "/icons/icon-192x192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/icons/icon-512x512.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
  share_target: {
    action: "/dashboard?addTask=true",
    method: "GET",
    params: {
      title: "title",
      text: "text",
      url: "url",
    },
  },
});

const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = withPWA(nextConfig);
