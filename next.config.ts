import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // imagens externas permitidas (avatares do Supabase Storage)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // remove aviso de "x-powered-by: Next.js" nos headers
  poweredByHeader: false,

  // cabeçalhos de segurança para todas as rotas
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },

  // redireciona / para /login (a raiz não tem página)
  async redirects() {
    return [
      {
        source:      '/',
        destination: '/login',
        permanent:   false,
      },
    ]
  },
}

export default nextConfig
