import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://localhost:3001", "localhost", "127.0.0.1", "http://127.0.0.1:3001"],
};

export default nextConfig;
