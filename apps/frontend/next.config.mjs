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
  // Disable static generation for problematic pages
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Force dynamic rendering
  trailingSlash: false,
  generateStaticParams: false,
};

export default nextConfig;
