/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['i.ytimg.com', 'img.youtube.com', 'via.placeholder.com', 'cdn.discordapp.com'],
  },
  generateBuildId: async () => {
    return 'aurora-stable-build';
  },
  async rewrites() {
    const backendUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_SOCKET_URL || 'http://backend:3001';
    
    return [
      {
        source: '/socket.io',
        destination: `${backendUrl}/socket.io`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${backendUrl}/socket.io/:path*`,
      },
      {
        source: '/api/user-guilds/:path*',
        destination: `${backendUrl}/api/user-guilds/:path*`,
      },
      {
        source: '/api/auth/session/:path*',
        destination: `${backendUrl}/api/auth/session/:path*`,
      },
      {
        source: '/api/auth/session',
        destination: `${backendUrl}/api/auth/session`,
      },
      {
        source: '/api/playlists/:path*',
        destination: `${backendUrl}/api/playlists/:path*`,
      },
      {
        source: '/api/liked-songs/:path*',
        destination: `${backendUrl}/api/liked-songs/:path*`,
      },
      {
        source: '/api/proxy-image/:path*',
        destination: `${backendUrl}/api/proxy-image/:path*`,
      },
      {
        source: '/api/lyrics/:path*',
        destination: `${backendUrl}/api/lyrics/:path*`,
      },
      {
        source: '/api/explore/:path*',
        destination: `${backendUrl}/api/explore/:path*`,
      },
      {
        source: '/api/youtube/:path*',
        destination: `${backendUrl}/api/youtube/:path*`,
      },
      {
        source: '/api/play',
        destination: `${backendUrl}/api/play`,
      },
      {
        source: '/api/search',
        destination: `${backendUrl}/api/search`,
      },
      {
        source: '/api/guilds',
        destination: `${backendUrl}/api/guilds`,
      },
      {
        source: '/api/guild/:path*',
        destination: `${backendUrl}/api/guild/:path*`,
      },
      {
        source: '/api/stats',
        destination: `${backendUrl}/api/stats`,
      },
      {
        source: '/api/admin/:path*',
        destination: `${backendUrl}/api/admin/:path*`,
      },
      {
        source: '/api/commands',
        destination: `${backendUrl}/api/commands`,
      },
      {
        source: '/api/premium/:path*',
        destination: `${backendUrl}/api/premium/:path*`,
      },
      {
        source: '/api/users/:path*',
        destination: `${backendUrl}/api/users/:path*`,
      }
    ];
  },
}

module.exports = nextConfig
