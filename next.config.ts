
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
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
    ],
  },
  // Make environment variables available to the server-side code
  env: {
    REDIRECT_URL: process.env.REDIRECT_URL,
    STATS_PASSWORD: process.env.STATS_PASSWORD,
    NOTIFICATION_EMAIL: process.env.NOTIFICATION_EMAIL,
    GMAIL_EMAIL: process.env.GMAIL_EMAIL,
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
  }
};

export default nextConfig;
