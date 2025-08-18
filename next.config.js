/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = config.resolve.alias || {};
      // Route core 'punycode' to the userland package to avoid Node deprecation warning
      config.resolve.alias.punycode = require.resolve("punycode/");
      // Also handle Node core specifier 'node:punycode'
      config.resolve.alias["node:punycode"] = require.resolve("punycode/");
    }
    return config;
  },
};

module.exports = nextConfig;
