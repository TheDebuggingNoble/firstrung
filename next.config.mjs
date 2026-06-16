/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // don't advertise the framework (minor hardening)
  experimental: {
    // Limit the body size accepted by Server Actions to curb abuse.
    serverActions: { bodySizeLimit: "1mb" },
  },
};

export default nextConfig;
