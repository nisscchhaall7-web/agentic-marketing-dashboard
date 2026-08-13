import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow local IPs and wildcard for localtunnel (loca.lt), localhost.run (lhr.life) and Cloudflare
  allowedDevOrigins: ['192.168.0.150', 'localhost', '127.0.0.1', 'loca.lt', '*.loca.lt', 'lhr.life', '*.lhr.life', 'trycloudflare.com', '*.trycloudflare.com'],
  async rewrites() {
    return [
      {
        // Proxy all API requests to the backend
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*'
      }
    ]
  }
};

export default nextConfig;
