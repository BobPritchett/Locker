import { resolve } from "path";
import dotenv from "dotenv";
import type { NextConfig } from "next";

dotenv.config({ path: resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@locker/common",
    "@locker/database",
    "@locker/email",
    "@locker/storage",
  ],
  serverExternalPackages: ["re2", "just-bash"],
  turbopack: {
    root: resolve(__dirname, "../.."),
  },
};

export default nextConfig;
