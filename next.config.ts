import type {NextConfig} from 'next';

// Permite ignorar errores de certificados SSL (útil para servicios internos con certificados auto-firmados)
// ADVERTENCIA: No se recomienda para producción por riesgos de seguridad.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/issuer/:path*',
        destination: 'https://issuer.interfase.uy/:path*',
      },
      {
        source: '/api/v1/pre-auth/:path*',
        destination: 'https://issuer.interfase.uy/api/v1/pre-auth/:path*',
      },
      {
        source: '/api/status-list/v1/:id/encoded',
        destination: 'https://midplus.interfase.uy/api/st/v1/:id/encoded',
      },
      {
        source: '/api/status-list',
        destination: 'https://midplus.interfase.uy/api/st/v1',
      }
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  env: {
    URL_ISSUER_SERVICE: 'https://issuer.interfase.uy',
    URL_VERIFICATION_SERVICE: 'https://verifier-ui.interfase.uy/',
  }
};

export default nextConfig;
