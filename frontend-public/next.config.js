/** @type {import('next').NextConfig} */
const nextConfig = {
    // Configuración para producción
    poweredByHeader: false,
    compress: true,

    // Reescritura para API backend
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:3000/api/:path*' // Backend Express
            }
        ];
    },

    // Optimización de imágenes
    images: {
        domains: ['raw.githubusercontent.com', 'api-sports.io']
    }
};

module.exports = nextConfig;
