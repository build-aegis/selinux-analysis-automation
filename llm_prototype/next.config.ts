import type { NextConfig } from "next";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEO4J_URI: process.env.NEO4J_URI,
    NEO4J_USER: process.env.NEO4J_USER,
    NEO4J_PASSWORD: process.env.NEO4J_PASSWORD,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
};

console.log("Next.js Config - Environment variables loaded:");
console.log("NEO4J_URI:", process.env.NEO4J_URI || 'not set');

export default nextConfig;