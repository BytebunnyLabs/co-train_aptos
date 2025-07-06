const isProd = process.env.NODE_ENV === "production";
const isVercel = process.env.VERCEL === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for Vercel deployment
  // output: "export", 
  reactStrictMode: false,
  transpilePackages: ["wallet-adapter-react", "wallet-adapter-plugin"],
  // Remove assetPrefix and basePath for Vercel deployment
  // assetPrefix: isProd ? "/aptos-wallet-adapter" : "",
  // basePath: isProd ? "/aptos-wallet-adapter" : "",
  webpack: (config) => {
    config.resolve.fallback = { "@solana/web3.js": false };
    return config;
  },
  // Add Vercel-specific optimizations
  images: {
    unoptimized: false,
  },
  // Disable static optimization for error pages
  experimental: {
    optimizeCss: false,
  },
  serverExternalPackages: ['@aptos-labs/wallet-adapter-react'],
  eslint: {
    // Temporarily ignore ESLint errors during builds
    ignoreDuringBuilds: true,
  },
  // Force dynamic rendering
  trailingSlash: false,
};

export default nextConfig;
