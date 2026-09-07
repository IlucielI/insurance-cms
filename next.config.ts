import type { NextConfig } from "next";
import { execSync } from "child_process";

const resolveGitHash = (): string => {
  if (process.env.GIT_HASH) {
    return process.env.GIT_HASH;
  }
  try {
    return (
      execSync("git rev-parse --short HEAD", {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim() || "dev"
    );
  } catch {
    return "dev";
  }
};

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    GIT_HASH: resolveGitHash(),
    NEXT_PUBLIC_GIT_HASH: resolveGitHash(),
  },
  async rewrites() {
    const coreApiUrl =
      process.env.CORE_API_INTERNAL_URL?.trim() ||
      process.env.CORE_API_URL?.trim() ||
      process.env.NEXT_PUBLIC_CORE_API_URL?.trim();

    if (!coreApiUrl) {
      return [];
    }

    return [
      {
        source: "/api/v1/:path*",
        destination: `${coreApiUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
