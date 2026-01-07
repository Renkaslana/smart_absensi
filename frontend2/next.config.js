/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', '127.0.0.1'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*',
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Handle WASM files for MediaPipe
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    // Handle .data files
    config.module.rules.push({
      test: /\.data$/,
      type: 'asset/resource',
    });
    
    return config;
  },
};

module.exports = nextConfig;
